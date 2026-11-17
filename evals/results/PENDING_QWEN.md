# Qwen: өлшеу әлі жүргізілген жоқ

2026-11-17 жағдайына `qwen_zeroshot_summary.json`, `qwen_fewshot_summary.json` және сырық жауаптар әлі жоқ. **Ешбір AI Accuracy / F1 көрсеткіші жасанды түрде толтырылмады**.

Пайдаланушы Ollama-ны жергілікті компьютерде іске қосып, мына команданы орындауы керек:

```powershell
ollama pull qwen2.5:3b
py -m pip install -r requirements.txt
py scripts/run_evals.py --mode qwen --model qwen2.5:3b
py scripts/analyze_results.py
```

Содан кейін `evals/results/qwen_*` файлдарын берсеңіз, Word есебіне нақты AI нәтижелерін, графиктер мен ADR қайта қарауды қосуға болады.
