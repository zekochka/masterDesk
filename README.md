# MasterDesk

Angular frontend, ASP.NET Core Web API и PostgreSQL для сценария ремонта: клиент создаёт заявку, мастер принимает и завершает её, клиент видит статус.

## Локальный запуск (PowerShell)

Нужны .NET 9 SDK, Node.js с npm и Docker Desktop. На этой машине порт 5432 занят другим PostgreSQL, поэтому локальная конфигурация использует 55432. Скрипт один раз создаёт случайные пароль БД и JWT-ключ в `.env` и `backend/MasterDesk.Api/appsettings.Development.json`. Оба файла игнорируются Git.

```powershell
pwsh -NoProfile -File scripts/setup-local-api.ps1
```

Запустите API. Профиль `Development` и адрес `http://localhost:5000` задаются в `launchSettings.json`. При первом запуске EF Core применит миграцию. Для тестового мастера перед запуском задайте логин и пароль в переменных окружения; он создаётся только в `Development`, если логина ещё нет в базе.

```powershell
$env:SeedMaster__Login = 'demo-master'
$env:SeedMaster__Password = Read-Host 'Пароль тестового мастера'
dotnet run --project backend/MasterDesk.Api
```

В другом терминале запустите интерфейс:

```powershell
cd frontend
npm ci
npm start
```

Откройте `http://localhost:4200/`. Angular dev server направляет `/api` на `http://localhost:5000`; Swagger доступен по адресу `http://localhost:5000/swagger`. Если JWT-ключ меняется после перезапуска API, нужно войти снова. Для остановки базы выполните `docker compose down` из корня проекта; данные останутся в Docker volume.

## Проверка сценария

1. Зарегистрируйте клиента через `/register`. Публичная регистрация всегда выдаёт роль `User`.
2. Создайте заявку в «Заявки → Создать заявку» и проверьте статус «Новая» в «Мои заявки».
3. Выйдите и войдите как `demo-master` с заданным выше паролем. В «Новые заявки» примите обращение, затем в «Мои ремонты» завершите его.
4. Снова войдите клиентом и обновите «Мои заявки»: статус должен стать «Завершена», а даты принятия и завершения появиться в карточке.

Пароли хэшируются на сервере. Токен в Angular хранится в `sessionStorage` только для демонстрации; это временное решение, не вариант хранения сессии для production. Старые локальные демоаккаунты не переносятся в PostgreSQL.

## Проверки

```powershell
dotnet build backend/MasterDesk.Api/MasterDesk.Api.csproj
dotnet test tests/MasterDesk.Api.Tests/MasterDesk.Api.Tests.csproj
cd frontend
npm run build
npm test
npm run lint
```

`tests/postgres-smoke.ps1` автоматически поднимает отдельный временный PostgreSQL-контейнер, запускает API, проверяет роли, права, переходы статуса и сохранение после перезапуска, затем удаляет только свой тестовый контейнер и том. Для него должны быть свободны порт API `5000` и доступен Docker Engine:

```powershell
pwsh -NoProfile -File tests/postgres-smoke.ps1
```

Основные файлы: `backend/MasterDesk.Api/` (API, модели, сервисы, DTO, миграция), `frontend/src/app/services/` (HTTP-сервисы), `frontend/src/app/features/orders/` (заявки клиента и мастера), `frontend/src/app/core/auth.interceptor.ts`, `docker-compose.yml` и `tests/`.
