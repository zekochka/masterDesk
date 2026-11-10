#!/usr/bin/env python3
"""MasterDesk LZ11: repeatable SYNTHETIC data only; no real client PII."""
import argparse, csv, json, random
from pathlib import Path

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--seed', type=int, default=11011)
    ap.add_argument('--count', type=int, default=1000)
    ap.add_argument('--output-dir', default='data')
    args = ap.parse_args()
    r = random.Random(args.seed)
    out = Path(args.output_dir); out.mkdir(parents=True, exist_ok=True)
    types = ['Ноутбук', 'Смартфон', 'Монитор', 'Принтер', 'Планшет']
    defects = ['Қосылмайды', 'Экран сынған', 'Қуат алмайды', 'Шу шығады', 'Қызып кетеді']
    states = ['Қабылданды', 'Диагностикада', 'Жөнделуде', 'Берілуге дайын', 'Жабылды']
    items = []
    for n in range(1, args.count + 1):
        items.append({'order_id':f'TEST-{n:05d}', 'client_name':f'TEST CLIENT {n:05d}',
                      'client_phone':'0000000000', 'device_type':r.choice(types),
                      'problem':r.choice(defects),'status':r.choice(states),
                      'estimated_cost_kzt':r.randrange(3000,150000,500), 'is_synthetic':True})
    (out/'lz11-test-orders.json').write_text(json.dumps(items,ensure_ascii=False,indent=2),encoding='utf-8')
    with (out/'lz11-test-orders.csv').open('w',newline='',encoding='utf-8-sig') as f:
        wr=csv.DictWriter(f,fieldnames=list(items[0]));wr.writeheader();wr.writerows(items)
    print(f'{len(items)} synthetic orders created, seed={args.seed}, files in {out}/')
if __name__=='__main__': main()
