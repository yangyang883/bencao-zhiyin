import unittest
from evaluate_fine import score


class ScoreTests(unittest.TestCase):
    def test_errors_and_unknowns_do_not_inflate_accuracy(self):
        rows = [{'labels': {'body_color': '红'}, 'prediction': {'bodyColor': '红'}},
                {'labels': {'body_color': '红'}, 'prediction': {}},
                {'labels': {'body_color': '淡白'}, 'prediction': {'bodyColor': '红'}},
                {'labels': {'body_color': '无法判断'}, 'prediction': {'bodyColor': '红'}}]
        result = score(rows)['body_color']
        self.assertEqual(result['labeled_count'], 3)
        self.assertEqual(result['accuracy_including_rejections'], 1 / 3)
        self.assertEqual(result['accuracy_on_answered'], 1 / 2)
        self.assertEqual(result['coverage'], 2 / 3)
        self.assertEqual(result['classes']['红']['f1'], 1 / 2)
        self.assertIsNone(score([])['body_color']['accuracy_including_rejections'])


if __name__ == '__main__':
    unittest.main()
