# MasterDesk — Docker, Trivy, Gitleaks smoke-test

**Қазіргі күйі:** қолданба коды жоқ, жобалық сканерлеу әлі жүргізілген жоқ. Бұл файлдағы сандық нәтиже — *мысал*, нақты журнал емес.

## Нені дәлелдейді?
- `docker version`: Docker CLI және daemon жауап береді.
- `docker run --rm hello-world`: контейнер іске қосылады.
- `aquasec/trivy:latest --version`: Trivy Docker-ден іске қосылады.
- `zricethezav/gitleaks:latest version`: Gitleaks Docker-ден іске қосылады.

**Оқу мысалы:** егер төрт тексерістің бәрі `PASS` болса, дайындық көрсеткіші `4 / 4 × 100% = 100%`. Бұл қауіпсіздік деңгейінің 100%-ы емес, тек орта іске қосылғанын тексереді. **Нақты нәтиже әлі жоқ.**

## Қалай жүргізу керек
Репозиторий түбінде Windows PowerShell ашып орындау:

```powershell
powershell -ExecutionPolicy Bypass -File .\docs\security\scanner_smoke_test.ps1
```

Нәтиже `docs/security/scanner_smoke_result.txt` файлына жазылады. Тек сол файл бар кезде сканердің іске қосылғанын расталған факт ретінде көрсетуге болады.

## Кейін код пайда болғанда (PowerShell)

```powershell
docker run --rm -v "${PWD}:/src" aquasec/trivy:latest fs --scanners vuln,misconfig /src
docker run --rm -v "${PWD}:/path" zricethezav/gitleaks:latest git -s /path -v
```

*Gitleaks CLI командасы нұсқаға тәуелді: `git` қолдауы жоқ ескі нұсқада методичкадағы `detect -s /path -v` нұсқасын пайдалану керек. Нұсқаны алдымен `version` арқылы анықтау қажет.*

Анықталған қауіптер `raid.md` құжатына тіркеледі; 0 finding тек сол код күйі мен сол тексеріске қатысты.
