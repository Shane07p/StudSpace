# Architecture

How the pieces of StudSpace fit together, the path a request takes, and the key design decisions.

## System overview

Three Docker Compose services behind a single nginx entry point:

```
                    ┌─────────────── Docker Compose ───────────────┐
Browser  ──:80──▶   │  frontend (nginx)                            │
                    │     ├─ serves index/signin/share .html       │
                    │     ├─ serves the Vite dashboard bundle       │
                    │     └─ proxies /api, /oauth2, /login ──┐      │
                    │                                        ▼      │
                    │                              backend (Spring) │
                    │                                  :8080  │     │
                    │                                        ▼      │
                    │                              db (PostgreSQL)  │
                    │                                  :5432        │
                    └───────────────────────────────────────────────┘
```

Only the `frontend` container publishes a port (`80`). The backend (`8080`) and database (`5432`) are **not** exposed to the host — everything reaches them through the nginx reverse proxy.

## Request paths

```
GET /                      → nginx → index.html / signin.html / share.html (static)
GET /dashboard.html        → nginx → Vite-built React bundle
/api/*                     → nginx → Spring Boot :8080 → PostgreSQL
/oauth2/*  /login/*        → nginx → Spring Boot :8080 (Google OAuth)
```

## Google OAuth flow

```
Browser → /oauth2/authorization/google → Google consent
        → backend callback (/login/oauth2/code/google)
        → find-or-create user, issue JWT
        → redirect to dashboard.html#token=JWT
```

The JWT is returned in the URL **fragment** (`#token=`), never a query parameter, so it never reaches server access logs or the `Referer` header. `Frontend/src/main.jsx` reads it from `location.hash` and strips it from the URL.

## Production topology (DigitalOcean)

```
HTTPS :443  (host nginx + Certbot / Let's Encrypt)
   → Docker frontend nginx :80
   → Spring Boot :8080
```

A host-level nginx terminates TLS and forwards to the Docker frontend. It passes `X-Forwarded-Proto: https` so the backend builds correct OAuth redirect URIs. See [deployment.md](deployment.md).

## Key design decisions

- **Stateless backend** — JWT in the `Authorization` header, no server sessions (`SessionCreationPolicy.STATELESS`). OAuth2 state is kept in a short-lived cookie, not a session.
- **Two frontends, one origin** — the dashboard is a bundled Vite/React SPA; the landing, sign-in, and share pages are plain HTML served as-is. Both are served by the same nginx, so all share `/api`. See [frontend.md](frontend.md).
- **Single Vite entry** — only `dashboard.html` goes through Vite; the other HTML pages are copied to nginx untouched.
- **nginx as the only door** — backend and DB ports stay private; the browser only ever talks to nginx on port 80.
- **Token out of URLs** — OAuth JWT delivered via fragment (see above).

## Performance

Measured on a local Docker stack against a seeded dataset (2 semesters, 4 courses, 12 resources, 40 attendance records), 10 iterations per endpoint:

| Endpoint | Method | Avg | p95 |
|----------|--------|-----|-----|
| Login | POST `/api/auth/login` | 149 ms | — |
| Dashboard | GET `/api/dashboard` | 30 ms | 60 ms |
| List semesters | GET `/api/semesters` | 10 ms | 22 ms |
| User profile | GET `/api/user/me` | 11 ms | 20 ms |
| Semester courses | GET `/api/semesters/{id}/courses` | 12 ms | 15 ms |
| Semester resources | GET `/api/semesters/{id}/resources` | 8 ms | 10 ms |
| Timetable slots | GET `/api/semesters/{id}/slots` | 9 ms | 14 ms |
| Course resources | GET `/api/courses/{id}/resources` | 9 ms | 13 ms |
| Course attendance | GET `/api/courses/{id}/attendance` | 9 ms | 10 ms |

Login is intentionally slow — BCrypt hashing is deliberately expensive to resist brute force. Every other endpoint responds under 60 ms.

### Load & concurrency

Load-tested with [k6](https://k6.io) — each virtual user (VU) logs in once, then loops the read endpoints. Local Docker stack:

| Concurrent users (VUs) | Throughput | Errors | p95 |
|---|---|---|---|
| 20 | ~4,000 req/s | 0% | ~16 ms |
| 40 | ~4,000 req/s | 0% | ~17 ms |
| 80 | ~3,800 req/s | 0% | ~42 ms |

Throughput plateaus around **4,000 req/s** (backend-bound) and stays error-free through 80 concurrent VUs — the stack degrades by slowing, not failing.

This required an nginx change: the proxy `location` blocks now target a **keepalive `upstream`** (`proxy_http_version 1.1` + `Connection ""` in `Frontend/nginx.conf`). Without connection reuse, nginx opened a fresh TCP connection to the backend per request and returned **502s past ~10 concurrent users**; with it, the same hardware serves ~2× the throughput with zero errors.
