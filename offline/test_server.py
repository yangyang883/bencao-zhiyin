import base64
import io
import math
import unittest
from PIL import Image
from server import read_image, make_report, check_visual_input


class LocalInputTests(unittest.TestCase):
    def test_image_decode_and_invalid_inputs(self):
        data = io.BytesIO()
        Image.new('RGB', (80, 80), 'white').save(data, format='PNG')
        value = 'data:image/png;base64,' + base64.b64encode(data.getvalue()).decode()
        self.assertEqual(read_image(value).size, (80, 80))
        with self.assertRaises(ValueError):
            check_visual_input(value)
        for value in [None, 'https://example.com/a.jpg', 'data:image/png;base64,@@@@', 'data:image/png;base64,aGVsbG8=']:
            with self.assertRaises(ValueError):
                read_image(value)

    def test_report_limits(self):
        report = make_report([0.1, 0.8, 0.1])
        self.assertEqual(report['class_name'], '紫舌')
        self.assertEqual(report['confidence'], 0.8)
        self.assertIn('未评估', report['constitution'])
        unsure = make_report([0.130, 0.394, 0.476])
        self.assertIn('不确定', unsure['tongueColor'])
        self.assertEqual(unsure['details'][0]['status'], '结果不确定')
        with self.assertRaises(ValueError):
            make_report([math.nan, 0.5, 0.5])


if __name__ == '__main__':
    unittest.main()
