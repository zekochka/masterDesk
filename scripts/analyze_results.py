#!/usr/bin/env python3
"""Generate an evidence-based human-readable comparison after an Ollama run.
Preserves 'NOT TESTED' instead of inventing missing AI metrics.
"""
import csv,json
from pathlib import Path
from run_evals import ROOT,CATEGORIES
P=ROOT/'evals/results'

def load(name):
 p=P/f'{name}_summary.json'
 return json.loads(p.read_text(encoding='utf-8')) if p.is_file() else None

def main():
 kinds=['baseline','qwen_zeroshot','qwen_fewshot']
 results={x:load(x) for x in kinds}
 md=['# MasterDesk — ЛЗ-12: модель сапасын салыстыру','', '**Ереже:** тек нақты іске қосылған тест нәтижелері көрсетіледі; жоқ нәтиже «ТЕКСЕРІЛМЕДІ» деп белгіленеді.','', '| Әдіс | Сценарий | Accuracy | Macro F1 | Құрылғы дәлдігі | Оқиға дәлдігі | Барлық өрістер |','|---|---:|---:|---:|---:|---:|---:|']
 for key in kinds:
  d=results[key]
  if d:md.append(f'| {key} | {d["count"]} | {d["category_accuracy"]:.1%} | {d["macro_f1"]:.1%} | {d["device_accuracy"]:.1%} | {d["incident_accuracy"]:.1%} | {d["all_fields_accuracy"]:.1%} |')
  else:md.append(f'| {key} | ТЕКСЕРІЛМЕДІ | — | — | — | — | — |')
 for key,d in results.items():
  md.extend(['',f'## {key}'])
  if not d:
   md.append('ТЕКСЕРІЛМЕДІ — Qwen іске қосылған соң автоматты толтырылады.');continue
  md.extend([f'- Іске қосу дерегі: `{d["created_utc"]}`', f'- Дерек: {d["source"]}',f'- Санат бойынша қате саны: **{d["errors_count"]} / {d["count"]}**'])
  if d.get('model'): md.append(f'- Модель: `{d["model"]}`, temperature=0, seed=42, орташа жауап уақыты: {d.get("avg_latency_seconds")} сек')
  md.extend(['','| Санат | Precision | Recall | F1 | Саны |','|---|---:|---:|---:|---:|'])
  for k,v in d['per_class'].items():md.append(f'| {k} | {v["precision"]:.2f} | {v["recall"]:.2f} | {v["f1"]:.2f} | {v["support"]} |')
  f=P/f'{key}_results.csv'
  if f.exists():
   rows=list(csv.DictReader(f.open(encoding='utf-8-sig')))
   wrong=[r for r in rows if r['category_ok']!='1']
   md.extend(['','### Санат қателерінің тізімі', ''])
   if not wrong:md.append('Санат бойынша қате жоқ.')
   else:
    for r in wrong: md.append(f'- `{r["id"]}`: «{r["text"]}» → эталон `{r["true_category"]}`, жүйе `{r["predicted_category"]}`')
 md.extend(['','## Енгізу туралы шешім','', 'Нақты `qwen_zeroshot` және `qwen_fewshot` нәтижелері бар болғаннан кейін ғана ADR-дегі шешімді нақтылаңыз. AI ешқашан адам растауынсыз өтінімді сақтамауы тиіс.'])
 out=ROOT/'docs/ai/RESULTS_COMPARISON.md';out.write_text('\n'.join(md)+'\n',encoding='utf-8')
 print('Updated:',out)

if __name__=='__main__':main()
