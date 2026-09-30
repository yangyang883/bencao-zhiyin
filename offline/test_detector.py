"""Run with the offline inference dependencies installed."""
import unittest
import numpy as np
from PIL import Image
from detector import prepare, decode, make_report


class DetectorTest(unittest.TestCase):
    def test_letterbox_nms_and_unknowns(self):
        tensor, scale, left, top = prepare(Image.new('RGB', (256, 128), (255, 0, 0)))
        self.assertEqual(tensor.shape, (1, 3, 512, 512))
        self.assertEqual((scale, left, top), (2, 0, 128))
        self.assertEqual(float(tensor[0, 0, 256, 256]), 1)
        output = np.zeros((1, 14, 5376), dtype=np.float32)
        output[0, :4, :3] = np.array([[256, 256, 256], [256, 256, 256], [128, 128, 128], [128, 128, 128]])
        output[0, 11, 0], output[0, 11, 1], output[0, 9, 2] = .9, .8, .7
        found = decode(output, (256, 128), scale, left, top)
        self.assertEqual([d['label'] for d in found], ['white_coating', 'cracks'])
        self.assertEqual(found[0]['xyxy'], [96, 32, 160, 96])
        report = make_report(found)
        self.assertIn('白苔', report['coating'])
        self.assertIn('未确定', report['tongueColor'])
        self.assertEqual(len(report['details']), 11)
        self.assertEqual(make_report([])['detections'], [])
        output[0, 0, 0] = np.nan
        with self.assertRaises(ValueError):
            decode(output, (256, 128), scale, left, top)


if __name__ == '__main__':
    unittest.main()
