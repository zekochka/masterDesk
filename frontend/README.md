# MasterDesk frontend

Angular-приложение подключено к `backend/MasterDesk.Api`. Главная и магазин остаются демонстрационными; вход, профиль и заявки используют API и PostgreSQL. Полные команды запуска и проверки — в [README.md](../README.md).

Для локальной разработки запустите API на `http://localhost:5000`, затем выполните `npm ci` и `npm start` в этой папке. Dev server доступен на `http://localhost:4200` и проксирует `/api` через `proxy.conf.json`.
