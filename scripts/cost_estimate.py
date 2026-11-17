#!/usr/bin/env python3
"""Explicitly labelled paper costs, optional tokenizer-based refinement.
Prices observed on 2026-11-17; verify official provider prices before reuse.
"""
import argparse,csv,json,statistics
from datetime import date
from pathlib import Path
from run_evals import read_dataset,prompt_for,ROOT
PRICE_INPUT=0.10   # GPT-6 Luna Standard input USD / 1M tokens
PRICE_OUTPUT=0.50  # GPT-6 Luna Standard output USD / 1M tokens
GPU_HOURLY=0.27   # Runpod RTX A5000 / h, indicative on-demand rate
GPU_HOURS=730

def main():
 p=argparse.ArgumentParser()
 p.add_argument('--volume',type=int,default=260)
 p.add_argument('--input-tokens',type=int,default=900)
 p.add_argument('--output-tokens',type=int,default=80)
 p.add_argument('--use-tiktoken',action='store_true',help='Measure local prompt token lengths with tiktoken o200k_base (OpenAI estimate)')
 p.add_argument('--variant',choices=['zeroshot','fewshot'],default='fewshot')
 a=p.parse_args()
 source='PLAN ASSUMPTION: input/output token counts not yet measured'
 measured_prompt_lengths=[]
 if a.use_tiktoken:
  try:import tiktoken
  except ImportError:raise SystemExit('Install token counter: pip install tiktoken')
  enc=tiktoken.get_encoding('o200k_base')
  measured_prompt_lengths=[len(enc.encode(prompt_for(row['text'],a.variant))) for row in read_dataset()]
  a.input_tokens=round(statistics.mean(measured_prompt_lengths))
  source='MEASURED LOCAL PROMPT TOKENS by tiktoken o200k_base; output tokens remain an explicit assumption'
 price_request=(a.input_tokens*PRICE_INPUT+a.output_tokens*PRICE_OUTPUT)/1_000_000
 gpu_monthly=GPU_HOURLY*GPU_HOURS
 cases=[]
 for mult in (1,10):
  requests=a.volume*mult
  cases.append({'case':'base' if mult==1 else 'x10','requests_per_month':requests,'avg_input_tokens':a.input_tokens,'avg_output_tokens':a.output_tokens,'api_cost_usd_per_month':round(price_request*requests,6),'gpu_24x7_usd_per_month':round(gpu_monthly,2)})
 crossing=round(gpu_monthly/price_request) if price_request else None
 report={
  'prepared_date':'2026-11-17', 'status':'FINANCIAL SCENARIO (not actual invoices or measured production traffic)',
  'source_of_token_counts':source,'input_tokens':a.input_tokens,'output_tokens':a.output_tokens,
  'openai_model':'gpt-6-luna', 'source_price_api':'https://developers.openai.com/api/docs/models/gpt-6-luna',
  'input_usd_per_million':PRICE_INPUT,'output_usd_per_million':PRICE_OUTPUT,
  'gpu_model':'Runpod RTX A5000','source_price_gpu':'https://www.runpod.io/pricing',
  'gpu_hourly_usd':GPU_HOURLY,'gpu_hours_per_month':GPU_HOURS,
  'gpu_cost_usd_per_month':round(gpu_monthly,2),
  'api_cost_per_request_usd':round(price_request,8),
  'breakeven_requests_per_month_ignoring_other_costs':crossing,
  'scenario':cases,
  'limitations':'Figures ignore API retries/caching, GPU storage/network/engineering, model quality, currency conversion, taxes. tiktoken o200k_base is a proxy for the specific commercial model, not its provider billing tokenizer.'
 }
 out=ROOT/'evals/results';out.mkdir(exist_ok=True,parents=True)
 (out/'cost_estimate.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
 with (out/'cost_scenarios.csv').open('w',encoding='utf-8-sig',newline='') as f:
  writer=csv.DictWriter(f,fieldnames=cases[0].keys());writer.writeheader();writer.writerows(cases)
 md=f'''# MasterDesk — ЛЗ-12: AI құнының есептік сценарийі

**Күні:** 17.11.2026. **Статус:** оқу-жоспарлық есеп; нақты төлем немесе модельдің өлшенген токен шығыны емес.

## Болжамдар және тарифтер

- Айлық жүктеме: **{a.volume} өтінім**, MasterDesk-тің бұрынғы бизнес-кейсі үшін қабылданған *оқу болжамы*, TechPoint-та өлшенбеген.
- Орташа кіріс: **{a.input_tokens} токен/сұрау**, жауап: **{a.output_tokens} токен/сұрау**.
- Токендердің дереккөзі: **{source}**.
- Коммерциялық салыстыру моделі: **GPT-6 Luna**, кіріс **${PRICE_INPUT} / 1 млн токен**, шығыс **${PRICE_OUTPUT} / 1 млн токен**; ресми модель парағы: {report['source_price_api']} (17.11.2026).
- GPU-нұсқа: **Runpod RTX A5000 ${GPU_HOURLY}/сағ**, айына **{GPU_HOURS} сағ** (24/7 шамалас); ресми баға: {report['source_price_gpu']} (17.11.2026).

## Формула

`API/ай = сұраулар саны × (кіріс токендері × $0.10 + шығыс токендері × $0.50) / 1 000 000`.

`GPU/ай = $0.27 × 730 = ${gpu_monthly:.2f}`.

| Сценарий | Сұрау/ай | API USD/ай | GPU USD/ай |
|---|---:|---:|---:|
'''
 for c in cases:md+=f'| {c["case"]} | {c["requests_per_month"]} | ${c["api_cost_usd_per_month"]:.4f} | ${gpu_monthly:.2f} |\n'
 md+=f'''\n## Теориялық шығындар теңесетін нүкте

`GPU/ай ÷ API/сұрау = {gpu_monthly:.2f} / {price_request:.8f} ≈ {crossing:,} сұрау/ай` (басқа шығындар ескерілмеді).

Бұл — **тек баға бойынша break-even**. Нақты таңдау үшін деректердің құпиялылығы, Qwen сапасы, жауап беру уақыты, сақтау/трафик/қызмет көрсету және модельдің релизге жарамдылығы бөлек қаралады. Жергілікті Ollama-ны тестілеу тегін болуы мүмкін, бірақ өнімдік self-hosted сервер тегін емес.

Ескерту: токендерді нақтылау үшін `python scripts/cost_estimate.py --use-tiktoken` іске қосыңыз. `tiktoken` қажет; OpenAI-ға арналған токен санау Qwen-нің Ollama токенизаторымен дәл сәйкес болмауы мүмкін. Ollama прогоннан кейін шығыс `prompt_eval_count` және `eval_count` мәндерін қайта салыстыру керек.
'''
 (ROOT/'docs/ai/COST_ANALYSIS.md').write_text(md,encoding='utf-8')
 print(f'Calculated assumptions: {a.input_tokens}/{a.output_tokens} tokens, API base ${cases[0]["api_cost_usd_per_month"]:.4f}/mo, x10 ${cases[1]["api_cost_usd_per_month"]:.4f}/mo, GPU ${gpu_monthly:.2f}/mo. Break-even {crossing:,} requests/mo.')

if __name__=='__main__':main()
