# StudyMe auth worker

Cloudflare Worker — бэкенд авторизации Google для синхронизации StudyMe.
Authorization-code flow с refresh-токеном: `client_secret` живёт только здесь,
приложение получает короткоживущий `access_token` по `sid`.

- **URL:** https://studyme-auth.sereshotes.workers.dev
- **Callback (redirect URI для Google):** https://studyme-auth.sereshotes.workers.dev/auth/callback

## Эндпоинты

| Метод | Путь | Назначение |
|---|---|---|
| GET | `/auth/login?return=<appUrl>` | Редирект на Google consent |
| GET | `/auth/callback?code&state` | Обмен кода на токены → редирект `return?sid=` |
| GET | `/auth/token?sid=<sid>` | `{ access_token, expires_in }` (обновляет по refresh) |
| POST | `/auth/logout?sid=<sid>` | Удалить сессию (+revoke) |
| GET | `/health` | Проверка живости |

## Конфигурация

`wrangler.toml`:
- `SCOPE` — `https://www.googleapis.com/auth/drive.file`
- `ALLOWED_ORIGINS` — список origin приложения через запятую (валидируется `return` и CORS)
- KV `SESSIONS` — хранит `state:*` (TTL) и `sess:*` (refresh_token)

Секреты (через `wrangler secret put`, не в файле):
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

## Деплой

```sh
cd auth-worker
npx wrangler deploy
# секреты:
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
```
