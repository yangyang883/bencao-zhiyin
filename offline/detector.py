"""YOLOv8n ONNX inference, Python 3.6; weights never downloaded at runtime."""
import ast
import numpy as np
import cv2
try:
    import onnxruntime as ort
except ImportError:
    ort = None

LABELS = ['red_tongue', 'purple_tongue', 'swollen_tongue', 'thin_tongue',
          'red_spots', 'cracks', 'tooth_marks', 'white_coating', 'yellow_coating', 'black_coating']
NAMES = ['红舌', '紫舌', '胖大', '瘦薄', '红点', '裂纹', '齿痕', '白苔', '黄苔', '黑苔']
WEAK = {1, 2, 4, 5, 6, 9}


def prepare(image):
    width, height = image.size
    scale = min(512.0 / width, 512.0 / height)
    nw, nh = int(round(width * scale)), int(round(height * scale))
    left, top = int(round((512 - nw) / 2.0 - 0.1)), int(round((512 - nh) / 2.0 - 0.1))
    pixels = cv2.resize(np.asarray(image), (nw, nh), interpolation=cv2.INTER_LINEAR)
    canvas = np.full((512, 512, 3), 114, dtype=np.uint8)
    canvas[top:top + nh, left:left + nw] = pixels
    return np.ascontiguousarray(canvas.transpose(2, 0, 1)[None], dtype=np.float32) / 255.0, scale, left, top


def decode(output, size, scale, left, top):
    if output.shape != (1, 14, 5376) or not np.isfinite(output).all():
        raise ValueError('十类模型输出格式不正确')
    rows = output[0].T
    ids = rows[:, 4:].argmax(axis=1)
    scores = rows[np.arange(len(rows)), 4 + ids]
    selected = (scores >= 0.25) & (scores <= 1) & (rows[:, 2] > 0) & (rows[:, 3] > 0)
    rows, ids, scores = rows[selected], ids[selected], scores[selected]
    boxes = np.column_stack((rows[:, 0] - rows[:, 2] / 2, rows[:, 1] - rows[:, 3] / 2,
                             rows[:, 0] + rows[:, 2] / 2, rows[:, 1] + rows[:, 3] / 2))
    # Per-class NMS preserves overlapping appearance categories.
    keep = []
    for category in range(10):
        order = np.where(ids == category)[0]
        order = order[np.argsort(-scores[order])]
        while len(order) and len(keep) < 300:
            index = order[0]
            keep.append(index)
            rest = order[1:]
            intersection = np.maximum(0, np.minimum(boxes[index, 2:], boxes[rest, 2:]) -
                                      np.maximum(boxes[index, :2], boxes[rest, :2])).prod(axis=1)
            area = np.maximum(0, boxes[:, 2:] - boxes[:, :2]).prod(axis=1)
            iou = intersection / np.maximum(area[index] + area[rest] - intersection, 1e-8)
            order = rest[iou <= 0.45]
    detections = []
    for index in sorted(keep, key=lambda i: -scores[i]):
        box = boxes[index].copy()
        box[[0, 2]] = np.clip((box[[0, 2]] - left) / scale, 0, size[0])
        box[[1, 3]] = np.clip((box[[1, 3]] - top) / scale, 0, size[1])
        if box[2] > box[0] and box[3] > box[1]:
            detections.append({'label': LABELS[int(ids[index])], 'model_score': float(scores[index]),
                               'xyxy': [round(float(v), 2) for v in box]})
    return detections


def make_report(detections):
    scores = {}
    for item in detections:
        scores[item['label']] = max(scores.get(item['label'], 0), item['model_score'])
    def group(indices):
        found = [NAMES[i] for i in indices if LABELS[i] in scores]
        return '疑似' + '、'.join(found) + '（待核对）' if found else '未确定；未检出不代表正常'
    details = []
    for i, label in enumerate(LABELS):
        score = scores.get(label)
        description = ('检出疑似%s，最高模型分数 %.1f%%；该分数不是医学准确率。' % (NAMES[i], score * 100)
                       if score is not None else '未检出达到显示阈值的候选，不能据此判断没有此特征。')
        if i in WEAK:
            description += '本轮该类别识别较弱，需人工复核。'
        details.append({'category': NAMES[i], 'status': '待核对' if score is not None else '未确定', 'description': description})
    details.append({'category': '模型范围', 'status': '外观检测', 'description':
        'YOLOv8n 十类外观模型；分数阈值0.25、逐类别NMS阈值0.45仅为工程设置。未训练舌苔厚薄、腻腐、剥苔、湿润度等项目；黑苔测试样本仅3个。不能判断疾病或体质。'})
    return {'source': 'local-yolov8n', 'detections': detections,
            'tongueColor': group([0, 1]), 'tongueShape': group([2, 3, 4, 5, 6]), 'coating': group([7, 8, 9]),
            'constitution': '未评估，外观检测不能判断体质', 'details': details,
            'suggestions': ['请核对舌面是否清晰、光线自然，避免滤镜和食物染色。',
                            '未检出不等于正常；红点、裂纹、齿痕、紫舌等结果尤其需要人工复核。',
                            '如有不适，可在下一步填写实际症状获取一般健康建议。']}


class TongueDetector:
    def __init__(self, path):
        self.net = None
        warmup = np.zeros((1, 3, 512, 512), dtype=np.float32)
        if ort is None:
            self.net = cv2.dnn.readNetFromONNX(str(path))
            self.net.setInput(warmup)
            if self.net.forward().shape != (1, 14, 5376):
                raise ValueError('十类模型输出格式不正确')
        else:
            options = ort.SessionOptions()
            options.intra_op_num_threads = 2
            options.inter_op_num_threads = 1
            self.session = ort.InferenceSession(str(path), sess_options=options, providers=['CPUExecutionProvider'])
            entry = self.session.get_inputs()[0]
            if entry.shape != [1, 3, 512, 512]:
                raise ValueError('模型输入必须是1×3×512×512')
            names = ast.literal_eval(self.session.get_modelmeta().custom_metadata_map['names'])
            if names != dict(enumerate(LABELS)):
                raise ValueError('模型标签顺序与十类定义不一致')
            self.input_name = entry.name
            self.session.run(None, {self.input_name: warmup})

    def analyze(self, image):
        tensor, scale, left, top = prepare(image)
        if self.net is None:
            output = self.session.run(None, {self.input_name: tensor})[0]
        else:
            self.net.setInput(tensor)
            output = self.net.forward()
        return make_report(decode(output, image.size, scale, left, top))
