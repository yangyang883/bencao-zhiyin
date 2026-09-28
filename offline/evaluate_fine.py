"""Evaluate reviewed held-out labels through the real localhost inference API."""
import argparse
import base64
import csv
import hashlib
import json
from pathlib import Path
import time
import urllib.error
import urllib.request

FIELDS = dict(zip(
    ['body_color', 'body_shape', 'tooth_marks', 'fissures', 'coat_color', 'coat_thickness', 'coat_texture', 'peeling'],
    ['bodyColor', 'bodyShape', 'toothMarks', 'fissures', 'coatColor', 'coatThickness', 'coatTexture', 'peeling']))
UNKNOWN = '无法判断'


def score(records):
    summary = {}
    for column, key in FIELDS.items():
        pairs = [(r['labels'][column], r['prediction'].get(key, UNKNOWN)) for r in records
                 if r['labels'].get(column, '') not in ('', UNKNOWN)]
        total = len(pairs)
        answered = sum(p != UNKNOWN for _, p in pairs)
        correct = sum(t == p for t, p in pairs)
        confusion = {}
        for truth, pred in pairs:
            confusion.setdefault(truth, {})[pred] = confusion.setdefault(truth, {}).get(pred, 0) + 1
        classes = {}
        for label in sorted(set(t for t, _ in pairs)):
            tp = sum(t == label and p == label for t, p in pairs)
            fp = sum(t != label and p == label for t, p in pairs)
            fn = sum(t == label and p != label for t, p in pairs)
            classes[label] = {'precision': tp / (tp + fp) if tp + fp else 0,
                              'recall': tp / (tp + fn) if tp + fn else 0,
                              'f1': 2 * tp / (2 * tp + fp + fn) if 2 * tp + fp + fn else 0}
        summary[column] = {'labeled_count': total, 'coverage': answered / total if total else None,
                           'accuracy_including_rejections': correct / total if total else None,
                           'accuracy_on_answered': correct / answered if answered else None,
                           'unknown_or_error_count': total - answered, 'classes': classes, 'confusion': confusion}
    return summary


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('csv', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError('输出文件已存在，请换一个文件名保留之前的评估')
    with args.csv.open(encoding='utf-8-sig', newline='') as f:
        rows = list(csv.DictReader(f))
    subjects, ids = {}, set()
    for row in rows:
        if not row.get('subject_id') or not row.get('image_id') or row.get('split') not in ('train', 'val', 'test'):
            raise ValueError('请填写真实image_id、匿名subject_id及train/val/test，不要直接运行示例行')
        if row['image_id'] in ids:
            raise ValueError('image_id重复')
        ids.add(row['image_id'])
        subjects.setdefault(row['subject_id'], set()).add(row['split'])
    if any(len(splits) > 1 for splits in subjects.values()):
        raise ValueError('同一受试者跨训练/验证/测试集合，存在数据泄漏')
    held_out = [r for r in rows if r['split'] == 'test']
    if not held_out or any(not r.get('reviewer', '').strip() for r in held_out):
        raise ValueError('需要具有复核者记录的独立test样本')
    if not any(any(r.get(k, '') not in ('', UNKNOWN) for k in FIELDS) for r in held_out):
        raise ValueError('测试集中没有已核对的特征标签，不能计算准确率')
    # Validate all paths before starting inference; nothing leaves localhost.
    for row in held_out:
        if not row.get('image_path') or not (args.csv.parent / row['image_path']).is_file():
            raise ValueError('找不到测试图片: ' + row.get('image_path', ''))
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    with opener.open('http://127.0.0.1:3100/api/tongue-fine', timeout=15) as response:
        allowed = {field['key']: field['values'] for field in json.load(response)['fields']}
    for row in held_out:
        for column, key in FIELDS.items():
            if row.get(column, '') and row[column] not in allowed[key]:
                raise ValueError('标签不在项目分类表中: ' + column + '=' + row[column])
    records = []
    for row in held_out:
        path = args.csv.parent / row['image_path']
        mime = {'.jpg': 'jpeg', '.jpeg': 'jpeg', '.png': 'png', '.webp': 'webp'}.get(path.suffix.lower())
        if not mime:
            raise ValueError('仅支持JPG/PNG/WebP')
        raw = path.read_bytes()
        request = urllib.request.Request('http://127.0.0.1:3100/api/tongue-fine',
            data=json.dumps({'image': 'data:image/' + mime + ';base64,' + base64.b64encode(raw).decode()}).encode(),
            headers={'Content-Type': 'application/json'})
        started, prediction, model, error = time.time(), {}, None, None
        try:
            with opener.open(request, timeout=170) as response:
                data = json.load(response)
                prediction, model = data['features'], data['model']
        except (urllib.error.URLError, KeyError, ValueError, TimeoutError) as exc:
            error = str(exc)  # Errors remain in denominators, not silently dropped.
        records.append({'image_id': row['image_id'], 'image_sha256': hashlib.sha256(raw).hexdigest(),
                        'labels': {k: row.get(k, '') for k in FIELDS}, 'prediction': prediction,
                        'model': model, 'error': error, 'seconds': round(time.time() - started, 3)})
        args.output.write_text(json.dumps({'complete': len(records) == len(held_out),
            'records': records, 'metrics': score(records)}, ensure_ascii=False, indent=2), encoding='utf-8')
        print('Evaluated', len(records), '/', len(held_out), flush=True)


if __name__ == '__main__':
    main()
