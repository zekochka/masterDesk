# MasterDesk — ЛЗ 11 (дайын файлдар)

Бұл архив **репозиторий түбіріне** көшіруге арналған. Бар файлдарды автоматты түрде ауыстырмайды. Негізгі 4 артефакт:

- `docs/qa/test-strategy.md` — стратегия/НФТ/орталар/ақаулар.
- `docs/qa/uat-protocol.md` — 12 сценарий, үлгі нәтижелер, нақты UAT хаттамасы үшін бос жолдар.
- `docs/qa/postmortem-ci.md` — CI workflow инциденті, blame-free талдау.
- `docs/ops/runbook-demo-site.md` — демонстрациялық сайт ашылмаса не істеу керек.

Қосымша: `docs/qa/issue-drafts.md`, `scripts/generate_test_data.py`, `tests/load/masterdesk_load.js`.

## Репозиторийге көшіру
1. ZIP ішіндегі `docs`, `scripts`, `tests` папкаларын `masterDesk` **түбіріне** біріктіріңіз (жобадағы ескі файлдарды өшірмеңіз).
2. Жеке branch: `git switch -c docs/lz11-quality-uat`
3. `git add docs/qa docs/ops/runbook-demo-site.md scripts/generate_test_data.py tests/load/masterdesk_load.js`
4. `git commit -m "docs: add LZ11 QA UAT postmortem and runbook"`
5. `git push -u origin docs/lz11-quality-uat` → Pull Request.

## Демо деректерін дайындау
`python scripts/generate_test_data.py --count 1000 --seed 11011` → `data/lz11-test-orders.json` және `data/lz11-test-orders.csv` (сайттың БД-сына автоматты енгізілмейді).

## k6 жүктеме сынағы
Backend API іске қосылғаннан кейін жолдарды **нақты Swagger-мен сәйкестендіріңіз**:
```powershell
$env:API_BASE_URL="http://localhost:8000"
$env:ORDERS_PATH="/api/orders"
$env:AUTH_TOKEN="<TEST_TOKEN>"    # тек терминалда, репозиторийге сақтамаңыз
$env:TEST_SCENARIO="list"
k6 run tests/load/masterdesk_load.js
$env:TEST_SCENARIO="create"
k6 run tests/load/masterdesk_load.js
$env:TEST_SCENARIO="scale"
k6 run tests/load/masterdesk_load.js
```
`/api/orders` — келісім тексерілгенше **болжамды** маршрут; нақты URL және POST JSON өрістерін бекенді аяқтағаннан кейін ғана растаңыз. Жоғарыдағы тесттер бұл архив жасалған кезде іске қосылған жоқ. `create` режимінде тесттік өтінімдер жасалады; тек бөлек test DB қолданыңыз.

## Сдача/дәлел
Сыртқы топтан UAT жүргіздіріңіз; нақты «өтті/өтпеді» нәтижелерін, датасын, қатысушы рөлдерін, скриншоттарын қосыңыз. GitHub-та Issue draft-тарды шынайы Issue ретінде жасаңыз, нақты сілтемесін postmortem мен UAT-қа тіркеңіз; runbook-ты сыртқы адаммен тексеріңіз. Word нұсқасы архивтен бөлек берілген.
