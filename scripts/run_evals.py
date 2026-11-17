#!/usr/bin/env python3
"""MasterDesk LZ12: reproducible baseline and *real* Ollama evals.

Python 3.10+. Model inference never runs in the baseline path.
Usage:
  python scripts/run_evals.py --mode baseline
  python scripts/run_evals.py --mode qwen --model qwen2.5:3b
  python scripts/run_evals.py --mode all --model qwen2.5:3b
"""
from __future__ import annotations
import argparse
import csv
import json
import re
import statistics
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'evals' / 'dataset.jsonl'
OUT = ROOT / 'evals' / 'results'
CATEGORIES = ['DISPLAY','CHARGING','BATTERY','POWER','OVERHEATING','AUDIO','SOFTWARE','OTHER']
INCIDENTS = ['NONE','DROP','LIQUID']

# Handwritten baseline: 28 keyword-based rules, deliberately not trained on the test set.
CATEGORY_RULES = [
 ('SOFTWARE', r'синий экран|blue screen|bsod'),
 ('SOFTWARE', r'восстановлени[ея] системы'),
 ('SOFTWARE', r'windows|android|обновлени|жаңарт'),
 ('SOFTWARE', r'завис|логотип|вылет|перезагрузк'),
 ('SOFTWARE', r'приложени|жүйе'),
 ('BATTERY', r'заряд ұстамайды|қуат тез таусылады'),
 ('BATTERY', r'разряж|батаре[яи]|аккумулятор|аккум'),
 ('BATTERY', r'не держит заряд|без сети'),
 ('BATTERY', r'процентах батареи|вздул'),
 ('CHARGING', r'не заряжа|зарядка не ид|заряд не ид'),
 ('CHARGING', r'раз[ъь]ём зарядк|разъем зарядк|кабель отходит'),
 ('CHARGING', r'процент зарядки не раст|не бер[её]т заряд'),
 ('POWER', r'не включа|не пода[её]т признаков жизни'),
 ('POWER', r'сам отключа|не горят|не подаёт'),
 ('POWER', r'өшіп|қосылмайды'),
 ('OVERHEATING', r'перегрева|греется|корпус горячий'),
 ('OVERHEATING', r'ысып кетеді|қатты қызады'),
 ('OVERHEATING', r'кулер всегда|вентилятор шумит'),
 ('AUDIO', r'звук|динамик|микрофон'),
 ('AUDIO', r'не слышит|дыбыс|дауыс'),
 ('DISPLAY', r'экран|дисплей|матриц'),
 ('DISPLAY', r'изображен|подсветк'),
 ('DISPLAY', r'полосы|трещин'),
 ('DISPLAY', r'көрсетпейді|көрсетпей|қара'),
 ('OTHER', r'камер|gps|wi-?fi'),
 ('OTHER', r'клавиш|кнопк|фокусирует'),
 ('OTHER', r'сенсор|ремешок'),
 ('OTHER', r'слот|разъем наушников'),
]

DEVICE_PATTERNS = [
 (r'(?:iphone|айфон)\s*(\d{1,2})\s*(?:pro|про)?', 'iPhone'),
 (r'ipad\s*(\d{1,2})', 'iPad'),
 (r'macbook\s+air\s*m\d+', 'MacBook Air'),
 (r'samsung\s+galaxy\s+[as]\d+', 'Samsung Galaxy'),
 (r'(?:xiaomi\s+)?redmi\s+note\s*\d+', 'Redmi Note'),
 (r'(?:xiaomi\s+)?redmi\s*\d+', 'Xiaomi Redmi'),
 (r'xiaomi\s*\d+', 'Xiaomi'),
 (r'(?:xiaomi\s+)?poco\s+x\d+', 'Poco'),
 (r'honor\s*\d+', 'Honor'),
 (r'huawei\s+p\d+', 'Huawei'),
 (r'lenovo\s+ideapad\s*\d+', 'Lenovo IdeaPad'),
 (r'lenovo\s+thinkpad\s+t\d+', 'Lenovo ThinkPad'),
 (r'lenovo\s+legion\s*\d+', 'Lenovo Legion'),
 (r'acer\s+aspire\s*\d+', 'Acer Aspire'),
 (r'acer\s+swift', 'Acer Swift'),
 (r'asus\s+vivobook\s*\d+', 'Asus VivoBook'),
 (r'asus\s+tuf\s+f\d+', 'Asus TUF'),
 (r'msi\s+cyborg\s*\d+', 'MSI Cyborg'),
 (r'dell\s+inspiron\s*\d+', 'Dell Inspiron'),
 (r'hp\s+pavilion\s*\d+', 'HP Pavilion'),
 (r'hp\s+victus\s*\d+', 'HP Victus'),
 (r'hp\s+probook', 'HP ProBook'),
]


def read_dataset():
    rows = [json.loads(l) for l in DATA.read_text(encoding='utf-8').splitlines() if l.strip()]
    ids = [x['id'] for x in rows]
    assert len(rows) >= 30 and len(set(ids)) == len(rows)
    assert all(x['expected']['category'] in CATEGORIES and x['expected']['incident'] in INCIDENTS for x in rows)
    return rows


def normalize_device(s):
    s = re.sub(r'\s+', ' ', str(s or 'UNKNOWN').strip())
    if not s or s.lower() in ('none','null','unknown','неизвестно','не указан','неизвестная','-'):
        return 'UNKNOWN'
    s = re.sub(r'^apple\s+', '', s, flags=re.I)
    s = re.sub(r'\bайфон\b', 'iPhone', s, flags=re.I)
    s = re.sub(r'\bпро\b', 'Pro', s, flags=re.I)
    return s.casefold()


def device_from_rules(t):
    for pat,prefix in DEVICE_PATTERNS:
        m = re.search(pat,t,re.I)
        if not m: continue
        raw=m.group(0)
        if prefix == 'iPhone':
            number=m.group(1)
            return f'iPhone {number}' + (' Pro' if re.search(r'\b(pro|про)\b',raw,re.I) else '')
        if prefix == 'iPad': return f'iPad {m.group(1)}'
        if prefix == 'Xiaomi Redmi': return raw.strip()
        # model names retain casing established by the dataset; match compares case-insensitively.
        # Prefix normalization for other names is only a simple regex replacement.
        if prefix == 'Redmi Note': return 'Redmi ' + re.search(r'note\s*\d+',raw,re.I).group(0)
        if prefix == 'Poco': return 'Poco ' + re.search(r'x\d+',raw,re.I).group(0)
        if prefix == 'HP ProBook': return 'HP ProBook'
        if prefix == 'Acer Swift': return 'Acer Swift'
        if prefix == 'MacBook Air': return 'MacBook Air ' + re.search(r'm\d+',raw,re.I).group(0)
        # remove optional vendor from regular expressions when the prefix already includes it
        if prefix in ('Samsung Galaxy','Xiaomi','Honor','Huawei','Lenovo IdeaPad','Lenovo ThinkPad','Lenovo Legion','Acer Aspire','Asus VivoBook','Asus TUF','MSI Cyborg','Dell Inspiron','HP Pavilion','HP Victus'):
            for keyword in [prefix.split()[-1]]:
                p=re.search(r'(?i)'+re.escape(keyword)+r'\s*([asfptmx]?\d+)',raw)
                if p: return prefix+' '+p.group(1)
            p=re.search(r'([asfptmx]?\d+)\s*$',raw,re.I)
            if p: return prefix+' '+p.group(1)
        return raw
    return 'UNKNOWN'


def baseline(text):
    lowered=text.lower()
    category=next((c for c,p in CATEGORY_RULES if re.search(p,lowered)), 'OTHER')
    if re.search(r'суға|су төг|судан|попала вода|попала влага|после дождя|после кофе|жидк',lowered):
        incident='LIQUID'
    elif re.search(r'упал|упала|упало|падени|урони|түсіп кетті|құлап|құлады',lowered):
        incident='DROP'
    else: incident='NONE'
    return dict(device_model=device_from_rules(text),category=category,incident=incident)


def metrics(dataset, rows, approach, additional=None):
    from sklearn.metrics import accuracy_score, f1_score, precision_recall_fscore_support
    tr={x['id']:x for x in dataset}
    truth=[tr[x['id']]['expected'] for x in rows]
    preds=[x['predicted'] for x in rows]
    y_true=[x['category'] for x in truth]
    y_pred=[x.get('category','__INVALID__') for x in preds]
    labels=CATEGORIES
    pr,rec,f1,sup=precision_recall_fscore_support(y_true,y_pred,labels=labels,zero_division=0)
    stats={
      'approach':approach,'count':len(rows),'category_accuracy':round(accuracy_score(y_true,y_pred),4),
      'macro_f1':round(f1_score(y_true,y_pred,labels=labels,average='macro',zero_division=0),4),
      'device_accuracy':round(sum(normalize_device(t['device_model']) == normalize_device(p.get('device_model')) for t,p in zip(truth,preds))/len(rows),4),
      'incident_accuracy':round(sum(t['incident'] == p.get('incident') for t,p in zip(truth,preds))/len(rows),4),
      'all_fields_accuracy':round(sum(t['category']==p.get('category') and t['incident']==p.get('incident') and normalize_device(t['device_model'])==normalize_device(p.get('device_model')) for t,p in zip(truth,preds))/len(rows),4),
      'per_class':{c:{'precision':round(float(a),4),'recall':round(float(b),4),'f1':round(float(d),4),'support':int(e)} for c,a,b,d,e in zip(labels,pr,rec,f1,sup)},
      'errors_count':sum(t['category']!=p.get('category') for t,p in zip(truth,preds)),
      'created_utc':datetime.now(timezone.utc).isoformat(),
      'source':'ACTUAL CODE EXECUTION (not an estimate)',
    }
    if additional:stats.update(additional)
    return stats


def save_approach(approach, dataset, rows, extra=None):
    OUT.mkdir(parents=True,exist_ok=True)
    stats=metrics(dataset,rows,approach,extra)
    (OUT / f'{approach}_summary.json').write_text(json.dumps(stats,ensure_ascii=False,indent=2),encoding='utf-8')
    fields=['id','approach','text','true_category','predicted_category','true_device','predicted_device','true_incident','predicted_incident','category_ok','device_ok','incident_ok','raw_response','error']
    with (OUT / f'{approach}_results.csv').open('w',encoding='utf-8-sig',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader()
        idx={x['id']:x for x in dataset}
        for r in rows:
            original=idx[r['id']]
            exp=original['expected'];pred=r['predicted']
            writer.writerow(dict(id=r['id'],approach=approach,text=original['text'],true_category=exp['category'],predicted_category=pred.get('category'),true_device=exp['device_model'],predicted_device=pred.get('device_model'),true_incident=exp['incident'],predicted_incident=pred.get('incident'),category_ok=int(exp['category']==pred.get('category')),device_ok=int(normalize_device(exp['device_model'])==normalize_device(pred.get('device_model'))),incident_ok=int(exp['incident']==pred.get('incident')),raw_response=r.get('raw_response',''),error=r.get('error','')))
    print(f'{approach}: category Accuracy={stats["category_accuracy"]:.3f}, Macro F1={stats["macro_f1"]:.3f}, device={stats["device_accuracy"]:.3f}, incident={stats["incident_accuracy"]:.3f}')
    return stats


def run_baseline(dataset):
    rows=[dict(id=x['id'],predicted=baseline(x['text'])) for x in dataset]
    return save_approach('baseline',dataset,rows,{'rule_count':len(CATEGORY_RULES),'device_patterns':len(DEVICE_PATTERNS)})


def prompt_for(text,variant):
    base='''Сен MasterDesk сервис орталығында жөндеу өтінімін тіркеуге арналған көмекшісің.
Тек сұрау мәтінінен ЕМЕС, нақты көрсетілген деректерді ғана ал. Жөндеу диагнозын қойма.
Тек бір JSON объектісін қайтар, Markdown немесе түсініктеме жазба:
{"device_model":"...","category":"...","incident":"..."}

device_model: мәтінде көрсетілген толық модель (латын жазуымен біріздендір), модель белгісіз болса "UNKNOWN".
category — ТЕК біреуін таңда:
DISPLAY = экран/матрица/көрсетілім; CHARGING = порт арқылы заряд алу ақауы;
BATTERY = батарея сыйымдылығы/тез таусылу; POWER = қосылмайды/өздігінен өшеді;
OVERHEATING = қызып кету; AUDIO = микрофон/динамик/дыбыс;
SOFTWARE = операциялық жүйе/қосымша/жаңарту; OTHER = өзге немесе белгісіз.
Бұл ақаудың симптом санаты, оны нақты диагноз ретінде көрсетпе.
incident = DROP (құлау анық айтылған), LIQUID (судың/сұйықтықтың тигені анық), NONE (айтылмаған).
Мәтінде жоқ ақпаратты ойдан қоспа. Егер бірден бірнеше ақау жазылса, негізгі шағымын таңдау қажет.'''
    few='''\n\nҮЛГІЛЕР (бағалау жинағынан ЕМЕС):
Клиент: «После падения у Nokia G20 экран светится белым.»
JSON: {"device_model":"Nokia G20","category":"DISPLAY","incident":"DROP"}
Клиент: «Realme C55 не держит батарею, но зарядка подключается.»
JSON: {"device_model":"Realme C55","category":"BATTERY","incident":"NONE"}
Клиент: «Марка белгісіз, ноутбукқа шай төгілді, қосылмай қалды.»
JSON: {"device_model":"UNKNOWN","category":"POWER","incident":"LIQUID"}
Клиент: «Huawei Mate 50: Wi-Fi не видит сеть.»
JSON: {"device_model":"Huawei Mate 50","category":"OTHER","incident":"NONE"}'''
    return base+(few if variant=='fewshot' else '')+'\n\nКлиент: '+text+'\nJSON:'


def parse_model_output(raw):
    # Parse JSON only: no heuristics that give the model credit for malformed responses.
    s=raw.strip()
    if s.startswith('```'):
        s=re.sub(r'^```(?:json)?\s*','',s,flags=re.I).strip()
        s=re.sub(r'\s*```$','',s).strip()
    try: value=json.loads(s)
    except json.JSONDecodeError:
        m=re.search(r'\{[\s\S]*\}',s)
        if not m: raise ValueError('No valid JSON object in model output')
        value=json.loads(m.group(0))
    if not isinstance(value,dict):raise ValueError('JSON response is not an object')
    category=str(value.get('category','')).strip().upper()
    incident=str(value.get('incident','')).strip().upper()
    if category not in CATEGORIES:category='__INVALID__'
    if incident not in INCIDENTS:incident='__INVALID__'
    device=str(value.get('device_model','UNKNOWN')).strip() or 'UNKNOWN'
    return dict(category=category,incident=incident,device_model=device)


def check_model_available(url,model):
    import requests
    try:
        r=requests.get(url+'/api/tags',timeout=10);r.raise_for_status()
    except requests.RequestException as e:
        raise SystemExit('Ollama unavailable at '+url+'; start the Ollama app (or run `ollama serve`). Details: '+str(e))
    names=[m.get('name') for m in r.json().get('models',[])]
    if model not in names:
        raise SystemExit('Model '+model+' not installed. Available: '+str(names)+'. Run `ollama pull '+model+'`.')


def run_qwen(dataset,url,model):
    import requests
    check_model_available(url,model)
    OUTPUT=[]
    for variant in ('zeroshot','fewshot'):
        rows=[]; raw_path=OUT/f'qwen_{variant}_raw.jsonl';OUT.mkdir(parents=True,exist_ok=True)
        with raw_path.open('w',encoding='utf-8') as f:
            for i,x in enumerate(dataset,1):
                prompt=prompt_for(x['text'],variant)
                started=time.perf_counter()
                error='';raw='';response={};parsed={'device_model':'UNKNOWN','category':'__INVALID__','incident':'__INVALID__'}
                try:
                    resp=requests.post(url+'/api/generate',json={'model':model,'prompt':prompt,'stream':False,'format':'json','options':{'temperature':0,'seed':42}},timeout=240)
                    resp.raise_for_status();response=resp.json()
                    raw=response.get('response','')
                    parsed=parse_model_output(raw)
                except (requests.RequestException,ValueError,KeyError) as exc:
                    error=f'{type(exc).__name__}: {exc}'
                record=dict(id=x['id'],variant=variant,model=model,prompt=prompt,raw_response=raw,predicted=parsed,error=error,elapsed_seconds=round(time.perf_counter()-started,3),prompt_eval_count=response.get('prompt_eval_count'),eval_count=response.get('eval_count'),total_duration_ns=response.get('total_duration'),timestamp_utc=datetime.now(timezone.utc).isoformat())
                f.write(json.dumps(record,ensure_ascii=False)+'\n');f.flush()
                rows.append(record)
                print(f'[{variant}] {i}/{len(dataset)} {x["id"]}: {parsed["category"]}' + (f' | {error}' if error else ''),flush=True)
        valid_in=[x['prompt_eval_count'] for x in rows if isinstance(x.get('prompt_eval_count'),int)]
        valid_out=[x['eval_count'] for x in rows if isinstance(x.get('eval_count'),int)]
        stats=save_approach('qwen_'+variant,dataset,rows,{
            'model':model,'temperature':0,'seed':42,'prompt_style':variant,
            'ollama_url':url,'api_requests':len(rows),'request_errors':sum(bool(x['error']) for x in rows),
            'avg_input_tokens_ollama':round(statistics.mean(valid_in),2) if valid_in else None,
            'avg_output_tokens_ollama':round(statistics.mean(valid_out),2) if valid_out else None,
            'avg_latency_seconds':round(statistics.mean(x['elapsed_seconds'] for x in rows),2),
        })
        OUTPUT.append(stats)
    return OUTPUT


def main():
    p=argparse.ArgumentParser()
    p.add_argument('--mode',choices=['baseline','qwen','all'],default='all')
    p.add_argument('--model',default='qwen2.5:3b')
    p.add_argument('--url',default='http://localhost:11434')
    a=p.parse_args()
    dataset=read_dataset()
    if a.mode in ('baseline','all'):run_baseline(dataset)
    if a.mode in ('qwen','all'):run_qwen(dataset,a.url,a.model)
    print('Results folder:',OUT)

if __name__=='__main__':main()
