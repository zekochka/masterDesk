# MasterDesk — ЛЗ-12 (дайын пакет, Qwen прогон күтіледі)

**Мақсат:** мәтіннен өтінім өрістерін ұсынуды кілтсөз алгоритмімен және Qwen арқылы салыстыру.

## Қазір қандай файлдар дайын?

- `docs/ai/LZ12_REPORT.docx` — есеп, қазақша; baseline **нақты**, Qwen бөлімі **толтыру күтілуде**.
- `docs/ai/AI_FUNCTION_CARD.md` — бизнес мақсаты, метрика, шекара, acceptance criteria.
- `docs/ai/RISK_REGISTER.md` — AI тәуекелдері және адам бақылауы.
- `docs/ai/COST_ANALYSIS.md` — API/GPU құны, ×10 жүктеме, break-even (нақты тарифтер, токендер — ашық болжам).
- `docs/ai/RESULTS_COMPARISON.md` — нәтижелер (скрипт қайта жасайды).
- `docs/adr/ADR-002-AI-ORDER-PREFILL.md` — AI-ді әзірше өндіріске қоспау туралы ADR.
- `evals/dataset.jsonl` — **40 синтетикалық** өтінім, эталондар.
- `evals/LABELING_PROTOCOL.md` — қайта қарау және дерек көзі.
- `evals/results/baseline_results.csv` + `baseline_summary.json` — нақты Python іске қосуы.
- `scripts/run_evals.py` — baseline + Ollama zero-shot/few-shot; параметрлер `temperature=0`, `seed=42`, raw жауаптарды сақтайды.
- `scripts/analyze_results.py` — барлық салыстыру кестесін жаңартады.
- `scripts/cost_estimate.py` — тариф, жүктеме, break-even, қажет болса `tiktoken`.
- `scripts/test_evals.py` — smoke tests (тегін, Ollama керек емес).

## Windows PowerShell — іске қосу

1. Архивті өзіңіздің `masterDesk` репозиторийінің түбіріне ашыңыз (папкалар біріктіріледі, бар файлдарыңызды алмастырмаңыз).
2. Репозиторий түбірінде PowerShell ашыңыз, `py --version` арқылы Python барын тексеріңіз.
3. Тәуелділіктер: `py -m pip install -r requirements.txt`
4. Ollama қолданбасын іске қосыңыз. Орнатылмаған болса: https://ollama.com/download
5. Модельді бір рет жүктеңіз: `ollama pull qwen2.5:3b`
6. Модель бар екенін тексеріңіз: `ollama list`
7. Тестті іске қосыңыз: `py scripts/run_evals.py --mode qwen --model qwen2.5:3b`
8. Кестелерді жаңартыңыз: `py scripts/analyze_results.py`
9. Нәтиже: `evals/results/qwen_zeroshot_results.csv`, `evals/results/qwen_fewshot_results.csv`, екі `*_summary.json` және екі `*_raw.jsonl`.

**Бір команданың өзі нөл-shot және few-shot тәсілдерін 40 жазбаның әрқайсысында бөлек тексереді (барлығы 80 сұрау).** Интернет Ollama модель файлын алғаш жүктеу үшін ғана қажет. Тест барысында localhost қолданылады.

Егер қуаттырақ модель қажет болса, `ollama pull qwen2.5:7b` және `--model qwen2.5:7b` қолданыңыз. Бұл жағдайда есепке дәл сол тег пен параметрлер жазылуы тиіс.

## Қосымша қайта есептеу

```powershell
py scripts/run_evals.py --mode baseline
py scripts/analyze_results.py
py scripts/cost_estimate.py
py scripts/test_evals.py
```

Токенді нақтылауға арналған ашық токенизатор (бөлек орнату қажет):

```powershell
py -m pip install tiktoken
py scripts/cost_estimate.py --use-tiktoken
```

**Назар аударыңыз:** `tiktoken`-дегі токен саны коммерциялық OpenAI модельдеріне арналған жуық өлшем. Qwen үшін нақты `prompt_eval_count` / `eval_count` Ollama raw жауаптарында сақталады.

## Құпиялылық және академиялық адалдық

- Бұл мәтіндер **жасанды**. TechPoint клиенттерінің жеке деректерін қоспаңыз.
- Baseline нақты іске қосылды (код + CSV дәлелі бар).
- Qwen **әзірге іске қосылмады** — нәтижені ойдан жазбаңыз.
- Эталондарды екі адам тексергенін дәлелсіз жазбаңыз; қажет болса екеуіңіз қарап, журналды жаңартыңыз.
- Құн есебіндегі 900/80 токен және 260 өтінім — **нақты өлшем емес, жоспарлық болжам**; кейін токенизатормен/прогонмен нақтылаңыз.
- Бұл пакетті тікелей продакшнға қосуға болмайды. Өнімдік интеграция бөлек PR және қауіпсіздік қарауымен жасалады.

## GitHub-қа жүктеу

```powershell
git add docs/ai docs/adr/ADR-002-AI-ORDER-PREFILL.md evals scripts requirements.txt README_LZ12.md
git commit -m "docs(ai): add LZ12 evaluation, risks and cost plan"
git push
```

Командалар нақты репозиторий түбірінен орындалады, әрі өз branch-ыңызбен PR жасағаныңыз дұрыс.
