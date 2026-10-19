#!/usr/bin/env python3
"""MasterDesk LZ4: safely prepare/create 20 GitHub Issues via authenticated gh CLI.
Dry-run by default; --apply required for mutations. Existing exact titles skipped.
Run from the repository root after docs have been added to your branch.
"""
import argparse, json, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CATALOG=ROOT/'docs/requirements/issue-catalog.json'

def call(args, capture=False, check=True):
 result=subprocess.run(args,cwd=ROOT,text=True,check=check,capture_output=capture)
 return result.stdout if capture else ''

ap=argparse.ArgumentParser()
ap.add_argument('--repo',default='zekochka/masterDesk')
ap.add_argument('--apply',action='store_true',help='Actually create labels and issues')
a=ap.parse_args()
if not CATALOG.exists():sys.exit('Missing catalog: '+str(CATALOG))
issues=json.loads(CATALOG.read_text(encoding='utf-8'))
try:
 call(['gh','--version'],capture=True)
 if a.apply:call(['gh','auth','status'],capture=True)
except (FileNotFoundError,subprocess.CalledProcessError):
 sys.exit('Install GitHub CLI and run gh auth login first.')

print('Repository:',a.repo,'Mode:','APPLY' if a.apply else 'DRY RUN')
try:
 existing_json=call(['gh','issue','list','--repo',a.repo,'--state','all','--limit','500','--json','title'],capture=True)
 existing={i['title'] for i in json.loads(existing_json)}
except subprocess.CalledProcessError:
 if a.apply:sys.exit('Cannot read repository issues. Check authentication/access.')
 existing=set();print('WARNING: cannot read existing issues; dry-run only.')

if a.apply:
 labels=sorted({label for i in issues for label in i['labels']})
 for label in labels:
  call(['gh','label','create',label,'--repo',a.repo,'--color','E6F3F1','--force'],check=True)

created=skipped=0
for issue in issues:
 title=issue['title']
 if title in existing:
  print('SKIP existing:',title);skipped+=1;continue
 body=ROOT/issue['body_file']
 if not body.exists():sys.exit('Missing file: '+str(body))
 if a.apply:
  args=['gh','issue','create','--repo',a.repo,'--title',title,'--body-file',str(body)]
  for label in issue['labels']:args.extend(['--label',label])
  call(args,check=True); created+=1;print('CREATED:',title)
 else:print('WOULD CREATE:',title)
print(f'Result: created={created}, already_exists={skipped}, total={len(issues)}')
if not a.apply:print('To publish: rerun with --apply (after PR merge is recommended).')
