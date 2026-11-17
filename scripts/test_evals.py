"""Offline smoke checks. No Qwen call, no inferred AI accuracy."""
import json,sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import run_evals as ev

class Tests(unittest.TestCase):
 def test_dataset_and_gold(self):
  data=ev.read_dataset()
  self.assertEqual(40,len(data))
  self.assertEqual({c:5 for c in ev.CATEGORIES},{c:sum(x['expected']['category']==c for x in data) for c in ev.CATEGORIES})
 def test_baseline_nonlearned(self):
  self.assertEqual('DISPLAY',ev.baseline('Разбился экран телефона')['category'])
  self.assertEqual('CHARGING',ev.baseline('Телефон не заряжается')['category'])
  self.assertEqual('DROP',ev.baseline('Айфон 13 про упал')['incident'])
  self.assertEqual('iPhone 13 Pro',ev.baseline('Айфон 13 про упал')['device_model'])
 def test_parser(self):
  p=ev.parse_model_output('```json\n{"device_model":"iPhone 12","category":"DISPLAY","incident":"NONE"}\n```')
  self.assertEqual('DISPLAY',p['category'])
  bad=ev.parse_model_output('{"category":"SOMETHING","incident":"NONE"}')
  self.assertEqual('__INVALID__',bad['category'])
 def test_no_hidden_gold_in_prompt(self):
  p=ev.prompt_for('TEST NO MODEL INFO','fewshot')
  self.assertIn('Клиент: TEST NO MODEL INFO',p)
  self.assertNotIn('D01',p)

if __name__=='__main__':unittest.main(verbosity=2)
