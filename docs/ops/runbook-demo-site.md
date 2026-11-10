# ЛЗ 11 — Runbook: Angular демо-стенд ашылмайды

**Сценарий:** MasterDesk Angular демо-сайты `http://localhost:4200/` ашылмайды немесе Uptime Kuma «Down» деп көрсетеді. **Иесі:** Амир (frontend). **Эскалация:** 15 минутта шешілмесе Ханкелдіге (API/инфрақұрылым) хабарлау; 30 минуттан асса PM демонстрацияны тоқтату/кейінге қалдыру шешімін тіркейді. Контактілер GitHub командасы арқылы, жеке нөмірлер мұнда сақталмайды.

## Диагностика (Windows PowerShell, репозиторий түбірінде)
```powershell
cd frontend
npm --version
npm ci
npm run build
Get-NetTCPConnection -LocalPort 4200 -ErrorAction SilentlyContinue
try { (Invoke-WebRequest http://localhost:4200 -UseBasicParsing -TimeoutSec 5).StatusCode } catch { $_.Exception.Message }
```
- `npm run build` қатесі → тәуелділіктерді/соңғы commit-ті қарау; қате логын сақтап, issue ашу.
- 4200 портында процесс жоқ → dev server іске қосылмаған болуы мүмкін.
- HTTP 200, бірақ бет бос → браузер Console / Network, жергілікті деректер, роутингті тексеру.

## Қалпына келтіру
```powershell
# frontend қалтасында
npm run start -- --host 0.0.0.0
# Жаңа PowerShell терезесінде:
Invoke-WebRequest http://localhost:4200 -UseBasicParsing
```
Ескерту: `0.0.0.0` Docker Desktop мониторингі үшін ғана; құрылғыны интернетке ашпау, Windows Firewall желі шектеуін сақтау. Demo сервер production емес.

## Мониторинг (Docker Desktop Windows)
```powershell
docker run -d --restart unless-stopped -p 3001:3001 -v uptime-kuma:/app/data --name uptime-kuma louislam/uptime-kuma:1
```
`http://localhost:3001` ашып HTTP monitor қосу: Docker контейнерінен host-қа қолжетімді `http://host.docker.internal:4200/`. Интервал: 300 секунд (NFR-04); айлық 99,0% шек тек 1 ай нақты мониторингпен өлшенеді. Бұл команда мониторингті өздігінен конфигурацияламайды; UI арқылы URL орнату қажет.

## Қалпына келгенін тексеру
1. GET `/` HTTP 200, басты бетте MasterDesk көрінеді.
2. Кіру, өтінімдер беті және навигация кемінде бір рет тексеріледі.
3. Uptime Kuma статусында UP болып, логта тексерудің уақыты көрсетіледі.
4. Issue-де симптом/себеп/өзгеріс/тексеру дәлелі белгіленеді.

## Тәуелсіз тексеріс
Тексеруші (бағдарламаның осы бөлігін жазбаған адам): **[аты, командасы]**. Орындаған күні: **[ ]**. Runbook бойынша қалпына келтіру уақыты: **[ ] минут**. Нақты тексеру әлі расталмаған.
