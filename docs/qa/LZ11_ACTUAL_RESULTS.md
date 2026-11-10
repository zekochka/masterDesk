# MasterDesk — ЛЗ-11: фактические результаты

Дата: 10.11.2026, Asia/Qyzylorda. Репозиторий: ветка `md-02-backend`, HEAD `2cb30364f332b23d4bed5c984047043ad8fd011c`. Проверялось текущее рабочее дерево с незакоммиченными изменениями, поэтому SHA не описывает весь проверенный код.

## Окружение

- Frontend: Angular `22.2.3`, Node.js `26.13.0`, npm `11.20.0`; локальный адрес `http://localhost:4200`, команда `npm start` из `frontend/`.
- Backend: .NET SDK `9.0.102`; локальный адрес `http://localhost:5000`, команда `dotnet run --project backend/MasterDesk.Api`.
- База: PostgreSQL `16.15` в Docker (`29.3.1`, Compose `v5.1.1`), локальное подключение `127.0.0.1:55432`, база `masterdesk`. Пароли и токены в отчёт не включены.
- В текущей локальной базе на момент проверки была **1 заявка**. Интеграционный тест использовал отдельную временную базу и удалил её после прогона. Нагрузочного заполнения на 1000 заявок не было.

## Автоматические проверки

| Проверка | Команда | Результат | Доказательство |
|---|---|---|---|
| Frontend lint | `cd frontend; npm run lint` | PASS, exit 0 | [frontend-lint.txt](evidence/frontend-lint.txt) |
| Frontend build | `cd frontend; npm run build` | PASS, exit 0 | [frontend-build.txt](evidence/frontend-build.txt) |
| Frontend unit | `cd frontend; npm test` | PASS, 2/2 теста, exit 0 | [frontend-tests.txt](evidence/frontend-tests.txt) |
| Backend build | `dotnet build backend/MasterDesk.Api/MasterDesk.Api.csproj --no-restore -p:OutputPath=bin/Lz11Check/` | PASS, 0 ошибок и предупреждений, exit 0 | [backend-build.txt](evidence/backend-build.txt) |
| Backend unit | `dotnet test tests/MasterDesk.Api.Tests/MasterDesk.Api.Tests.csproj --no-restore -p:OutputPath=bin/Lz11Check/` | PASS, 2/2 теста, exit 0 | [backend-tests.txt](evidence/backend-tests.txt) |
| API + PostgreSQL integration | `pwsh -NoProfile -File tests/postgres-smoke.ps1 -BaseUrl http://localhost:5002` | PASS, exit 0: регистрация, роли, запрет чужой заявки, переходы New → Accepted → Completed, сохранение после перезапуска API | [postgres-smoke.txt](evidence/postgres-smoke.txt) |

Интеграционный прогон на `5002` не проверял Angular proxy. Отдельный браузерный E2E-тест в этой проверке не выполнялся. Процент code coverage не измерялся.

## Ручной сценарий пользователя

Пользователь сообщил в этой беседе, что зарегистрировался и вошёл, создал заявку, затем вошёл мастером и завершил ремонт. Это **сообщение пользователя**, а не независимый UAT с внешним участником и не записанный браузерный тест. Измерения длительности и скриншоты полного сценария в этот отчёт не приложены.

## Границы результата и расхождения

- В [NFR ЛЗ-4](../requirements/nfr.md) для списка указано 1000 записей, 5 пользователей и p95 ≤ 2,0 с; для создания — 5 пользователей и p95 ≤ 1,5 с; для масштабирования — 10 VU × 5 минут и ошибок ≤ 1%. Эти показатели данным прогоном не измерялись: `k6` не установлен, а [существующий k6-скрипт](../../tests/load/masterdesk_load.js) по умолчанию обращается к `/api/orders`, тогда как реализованный маршрут — `/api/requests`.
- Текущий backend покрывает сокращённый сценарий клиента и мастера. Полный MVP из [ЛЗ-4](../requirements/mvp-scope.md) включает диагностику, согласование цены, историю изменений и другие этапы, которые этим результатом не подтверждаются.
- Мониторинг Uptime Kuma, месячный SLA, независимая проверка runbook и внешняя приёмка здесь не заявляются как проведённые.
- [Postmortem CI](postmortem-ci.md) содержит учебную реконструкцию, а не измеренный пользовательский инцидент. Проверяемые следующие действия: (1) приложить URL реального GitHub Actions run к следующему PR; (2) проверить required checks перед merge; (3) дать другому участнику выполнить runbook и записать время восстановления. GitHub Issues по этим действиям в рамках данной проверки не создавались.

**Вывод:** технические сборки, unit-тесты и изолированный API/PostgreSQL сценарий прошли. Для формальной приёмки остаются отдельные измерения NFR и независимое UAT; текущий отчёт их не подменяет.
