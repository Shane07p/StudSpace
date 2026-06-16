# StudSpace

A full-stack academic workspace for university students — organize semesters, track attendance, manage study resources, and chat with an AI study assistant.

---

## Features

- **Dashboard** — At-a-glance stats (courses, attendance %, resources, credits) with per-course cards
- **Semesters & Courses** — Full CRUD for semesters and courses; resource management (notes, links, PDFs); weekly timetable view; shareable semester pages via public token
- **Attendance** — Per-course daily tracking with 75% threshold ring visualization; skip/need calculation
- **Grades** — CGPA calculator using actual course credits from the API
- **Classmates** — Public student directory filterable by college, branch, and year
- **Profile** — Public/private profile with social and coding handle links (GitHub, LinkedIn, LeetCode, etc.)
- **Share page** — Unauthenticated public view of a shared semester (courses, resources, stats)
- **Google OAuth** — Sign in with Google in addition to email/password
- **AI Chat** — Semester-aware study assistant powered by Groq LLaMA 3.3 70B
- **PDF Upload** — Upload study materials to Cloudinary (PDF only, 25 MB limit)
- **Dark mode** — Persisted in `localStorage`
- **Rate limiting** — 5 login attempts / 15 min / IP (Bucket4j)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot 3.2.5 · Java 21 |
| Auth | JWT (jjwt 0.12.5) · Google OAuth2 (Authorization Code Flow) |
| Database | PostgreSQL 16 |
| ORM | Spring Data JPA + Hibernate |
| Rate limiting | Bucket4j 8.10.1 |
| File storage | Cloudinary (PDF upload) |
| Frontend | Vite 5 · React 18 · Tailwind CSS 3.4 · Lucide React · FullCalendar 6 |
| AI | Groq LLaMA 3.3 70B (chat assistant) |
| Container | Docker Compose (3 services: `db` · `backend` · `frontend`) |
| Web server | nginx (static files + reverse proxy to Spring Boot) |

---

## Architecture

```
Browser
  |
  |-- GET /                          --> nginx :80 (index.html, signin.html, share.html)
  |-- GET /dashboard.html            --> nginx :80 (Vite bundle)
  |-- /api/*                         --> nginx :80 --> Spring Boot :8080 --> PostgreSQL :5432
```

**Google OAuth flow:**
```
Browser --> /oauth2/authorization/google --> Google --> backend callback --> JWT --> /dashboard.html?token=JWT
```

**Production (DigitalOcean with Let's Encrypt):**
```
HTTPS :443 (host nginx + Certbot) --> Docker frontend nginx :80 --> Spring Boot :8080
```

---

## Project Structure

```
StudSpace/
├── Backend/                         Spring Boot 3.2.5 app
│   ├── src/main/java/com/studspace/
│   │   ├── auth/                    JWT, OAuth2, rate limiting
│   │   ├── user/                    User entity, profile, handles
│   │   ├── semester/                Semester CRUD + share token
│   │   ├── course/                  Course CRUD
│   │   ├── resource/                Resource CRUD
│   │   ├── attendance/              Attendance upsert + summary
│   │   ├── slot/                    Timetable slots
│   │   ├── upload/                  Cloudinary PDF upload
│   │   ├── ai/                      Groq chat assistant
│   │   ├── dashboard/               Aggregated dashboard endpoint
│   │   ├── share/                   Public share endpoint
│   │   └── config/                  Security, CORS
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── schema.sql               Full PostgreSQL schema
│   └── Dockerfile
├── Frontend/
│   ├── src/                         Vite + React app (main dashboard)
│   │   ├── main.jsx                 Entry point (auth guard)
│   │   ├── app.jsx                  Shell: Sidebar, Topbar, Router
│   │   ├── api.js                   API client (named exports)
│   │   ├── lib.jsx                  Shared components + hooks
│   │   ├── semesters.jsx
│   │   ├── dashboard.jsx
│   │   ├── attendance.jsx
│   │   ├── calculator.jsx
│   │   ├── profile.jsx
│   │   └── globals.css              Tailwind base + CSS custom properties
│   ├── js/                          Vanilla JS for non-Vite pages
│   │   ├── api.js                   API client for signin/share (CDN fetch)
│   │   └── home.js                  Landing page JS
│   ├── dashboard.html               Vite entry HTML
│   ├── signin.html                  Auth page (served by nginx)
│   ├── index.html                   Landing page (served by nginx)
│   ├── share.html                   Public share page (served by nginx)
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
├── docker-compose.prod.yml          Production overrides
└── .env.example
```

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Engine and Compose)
- A [Google Cloud Console](https://console.cloud.google.com) project with an OAuth 2.0 Client ID (for Google sign-in)
- _(Optional)_ [Cloudinary](https://cloudinary.com) account for PDF uploads
- _(Optional)_ [Groq](https://console.groq.com/keys) API key for the AI chat assistant

---

## Getting Started

```bash
# 1. Clone the repo
git clone <repo-url>
cd StudSpace

# 2. Set up environment variables
cp .env.example .env
# Edit .env — see Environment Variables below

# 3. Start all services
docker compose up -d

# 4. Open the app
# http://localhost
```

The first `docker compose up` builds the images (a few minutes). Subsequent starts are fast.

> **Windows / OneDrive note:** If your path contains spaces (e.g. `C:\Users\Shane Christian\...`), disable BuildKit before building:
> ```powershell
> $env:DOCKER_BUILDKIT = "0"; $env:COMPOSE_DOCKER_CLI_BUILD = "0"
> docker compose up --build
> ```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values.

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_PASSWORD` | Yes | PostgreSQL password (any strong string) |
| `JWT_SECRET` | Yes | Base64-encoded HMAC secret for signing JWTs. Generate: `openssl rand -base64 64` |
| `GOOGLE_CLIENT_ID` | Yes* | OAuth2 Client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Yes* | OAuth2 Client Secret |
| `FRONTEND_URL` | Yes | Base URL of the frontend — `http://localhost` locally, `https://yourdomain.com` in production |
| `GROQ_API_KEY` | No | Groq API key — enables the AI chat assistant |
| `CLOUDINARY_URL` | No | Cloudinary connection URL (`cloudinary://api_key:api_secret@cloud_name`) — enables PDF uploads |

*Required for Google sign-in. Email/password auth works without it.

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID** → Application type: **Web application**
3. Under **Authorized redirect URIs**, add:
   - Local (Docker): `http://localhost/login/oauth2/code/google`
   - Production: `https://yourdomain.com/login/oauth2/code/google`
4. Copy the **Client ID** and **Client Secret** into your `.env`

---

## App URLs

| URL | Page |
|-----|------|
| `http://localhost` | Landing page |
| `http://localhost/signin.html` | Sign in / Register |
| `http://localhost/dashboard.html` | Main app (requires login) |
| `http://localhost/share.html?token=<token>` | Public share page |

---

## Database Schema

Seven tables, auto-applied from `Backend/src/main/resources/schema.sql` on first start.

| Table | Purpose |
|-------|---------|
| `users` | Accounts (email/password + Google OAuth), profile info |
| `user_handles` | Social / coding profile links |
| `semesters` | Academic semesters per user, with optional share token |
| `courses` | Courses within a semester (code, name, instructor, credits) |
| `resources` | Study resources (link, notes, PDF) per course |
| `attendance_records` | Daily attendance per course (PRESENT / ABSENT / CANCELLED) |
| `timetable_slots` | Weekly class schedule per semester |

---

## API Reference

All paths are relative to `/api`. Protected endpoints require `Authorization: Bearer <jwt>`.

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | No | Register — body: `{ fullName, username, email, password }` |
| `POST` | `/auth/login` | No | Login — body: `{ username, password }` → returns JWT |

### User
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/user/me` | Yes | Get current user profile |
| `PUT` | `/user/me` | Yes | Update profile (name, college, branch, year, bio) |
| `PUT` | `/user/me/handles` | Yes | Update social / coding handles |
| `POST` | `/user/me/photo` | Yes | Set profile photo URL |
| `POST` | `/user/me/cover` | Yes | Set cover photo URL |
| `PUT` | `/user/me/password` | Yes | Change password |
| `DELETE` | `/user/me` | Yes | Delete account |

### Semesters
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/semesters` | Yes | List all semesters |
| `POST` | `/semesters` | Yes | Create — body: `{ label, shortName?, current? }` |
| `PUT` | `/semesters/{id}` | Yes | Update |
| `POST` | `/semesters/{id}/current` | Yes | Mark as current semester |
| `DELETE` | `/semesters/{id}` | Yes | Delete |
| `POST` | `/semesters/{id}/share` | Yes | Enable public share token |
| `DELETE` | `/semesters/{id}/share` | Yes | Disable public share token |

### Courses
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/semesters/{id}/courses` | Yes | List courses |
| `POST` | `/semesters/{id}/courses` | Yes | Create — body: `{ name, code?, instructor?, credits? }` |
| `PUT` | `/courses/{id}` | Yes | Update |
| `DELETE` | `/courses/{id}` | Yes | Delete |

### Resources
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/courses/{id}/resources` | Yes | List resources for a course |
| `POST` | `/courses/{id}/resources` | Yes | Create — body: `{ type, title, url?, notes? }`. Type: `PYQ` `NOTES` `PLAYLIST` `LINK` `OTHER` |
| `GET` | `/semesters/{id}/resources` | Yes | All resources across a semester |
| `PUT` | `/resources/{id}` | Yes | Update |
| `DELETE` | `/resources/{id}` | Yes | Delete |
| `POST` | `/upload` | Yes | Upload PDF (multipart `file`, max 25 MB) → Cloudinary URL |
| `POST` | `/upload/image` | Yes | Upload image (multipart `file`) → Cloudinary URL |

### Attendance
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/courses/{id}/attendance` | Yes | All records + summary |
| `POST` | `/courses/{id}/attendance` | Yes | Upsert — body: `{ date: "YYYY-MM-DD", status: "PRESENT" \| "ABSENT" \| "CANCELLED" }` |
| `DELETE` | `/attendance/{id}` | Yes | Delete record |

### Timetable
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/semesters/{id}/slots` | Yes | List timetable slots |
| `POST` | `/semesters/{id}/slots` | Yes | Create slot |
| `PUT` | `/slots/{id}` | Yes | Update slot |
| `DELETE` | `/slots/{id}` | Yes | Delete slot |

### Dashboard & Share
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/dashboard` | Yes | Stats + current semester + recent resources |
| `GET` | `/share/{token}` | No | Public semester view |

### AI
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/ai/chat` | Yes | Chat — body: `{ message, context? }`. Powered by Groq LLaMA 3.3 70B |

---

## localStorage Keys

| Key | Values | Description |
|-----|--------|-------------|
| `ss-token` | JWT string | Auth token |
| `ss-theme` | `'dark'` \| `''` | Dark mode |
| `ss-sidebar` | `'1'` \| `''` | Sidebar collapsed state |
| `ss-att-threshold` | number (50–100) | Attendance threshold % (default 75) |

---

## Benchmark

Measured on a local Docker stack against a seeded dataset (2 semesters, 4 courses, 12 resources, 40 attendance records). 10 iterations per endpoint.

| Endpoint | Method | Path | Min | Avg | Max | p95 |
|----------|--------|------|-----|-----|-----|-----|
| Login | POST | `/api/auth/login` | — | 149 ms | — | — |
| Dashboard | GET | `/api/dashboard` | 23 ms | 30 ms | 60 ms | 60 ms |
| List semesters | GET | `/api/semesters` | 6 ms | 10 ms | 22 ms | 22 ms |
| User profile | GET | `/api/user/me` | 8 ms | 11 ms | 20 ms | 20 ms |
| Semester courses | GET | `/api/semesters/{id}/courses` | 10 ms | 12 ms | 15 ms | 15 ms |
| Semester resources | GET | `/api/semesters/{id}/resources` | 7 ms | 8 ms | 10 ms | 10 ms |
| Timetable slots | GET | `/api/semesters/{id}/slots` | 7 ms | 9 ms | 14 ms | 14 ms |
| Course resources | GET | `/api/courses/{id}/resources` | 7 ms | 9 ms | 13 ms | 13 ms |
| Course attendance | GET | `/api/courses/{id}/attendance` | 7 ms | 9 ms | 10 ms | 10 ms |

Login is slow by design — BCrypt password hashing is computationally expensive to make brute-force attacks infeasible. All other endpoints respond under 60 ms.

---

## Local Development (without Docker)

### Backend

Requires PostgreSQL 16 running locally with a database named `studspace`.

```bash
# Linux / macOS
cd Backend
./mvnw spring-boot:run \
  -Dspring-boot.run.jvmArguments="\
    -DJWT_SECRET=<base64-secret> \
    -DGOOGLE_CLIENT_ID=<client-id> \
    -DGOOGLE_CLIENT_SECRET=<client-secret> \
    -DFRONTEND_URL=http://localhost:5173"

# Windows (PowerShell)
cd Backend
.\mvnw.cmd spring-boot:run `-Dspring-boot.run.jvmArguments="-DJWT_SECRET=<secret> -DGOOGLE_CLIENT_ID=<id> -DGOOGLE_CLIENT_SECRET=<secret> -DFRONTEND_URL=http://localhost:5173"
```

### Frontend

```bash
cd Frontend
npm install
npm run dev   # Vite dev server on http://localhost:5173
```

Add a dev proxy to `Frontend/vite.config.js` so `/api` calls reach the local backend:

```js
server: {
  proxy: {
    '/api': 'http://localhost:8080',
    '/oauth2': 'http://localhost:8080',
    '/login': 'http://localhost:8080',
  },
},
```

---

## Deployment (Production)

The production override file `docker-compose.prod.yml` adjusts CORS origins, disables the exposed DB port, and configures the backend to trust forwarded headers from the host nginx.

```bash
# On the server
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

The host nginx at `/etc/nginx/sites-enabled/studspace` proxies `https://yourdomain.com` → `http://localhost:80` and passes `X-Forwarded-Proto: https` so the backend generates correct OAuth redirect URIs. Set `client_max_body_size 30M` in the host nginx config to allow PDF uploads.

---

## License & Copyright

© 2026 Shane Christian. All rights reserved.

This project and its source code are the intellectual property of the author. No part may be reproduced, distributed, or used without the author's permission.

