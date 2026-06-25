# Deployment & Setup

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Engine + Compose)
- A [Google Cloud Console](https://console.cloud.google.com) OAuth 2.0 Client ID (for Google sign-in)
- _(Optional)_ [Cloudinary](https://cloudinary.com) account — for PDF/image uploads
- _(Optional)_ [Groq](https://console.groq.com/keys) API key — for the AI chat assistant

## Run locally (Docker)

```bash
git clone <repo-url> && cd StudSpace
cp .env.example .env          # fill in values (see below)
docker compose up -d          # app on http://localhost
```

First build takes a few minutes; later starts are fast.

Rebuild after changes:
```bash
docker compose build backend frontend && docker compose up -d --force-recreate backend frontend
```

> **Windows / paths with spaces:** if the path contains a space (e.g. `C:\Users\Shane Christian\…`), disable BuildKit first:
> ```powershell
> $env:DOCKER_BUILDKIT = "0"; $env:COMPOSE_DOCKER_CLI_BUILD = "0"
> docker compose up --build
> ```

## Environment variables (`.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_PASSWORD` | Yes | PostgreSQL password |
| `JWT_SECRET` | Yes | Base64 HMAC secret for JWTs. Generate: `openssl rand -base64 64` |
| `GOOGLE_CLIENT_ID` | Yes* | OAuth2 Client ID |
| `GOOGLE_CLIENT_SECRET` | Yes* | OAuth2 Client Secret |
| `FRONTEND_URL` | Yes | `http://localhost` locally, `https://yourdomain.com` in production |
| `GROQ_API_KEY` | No | Enables the AI chat assistant |
| `CLOUDINARY_URL` | No | `cloudinary://api_key:api_secret@cloud_name` — enables uploads |

*Required for Google sign-in. Email/password auth works without it.

## Google OAuth setup

1. Google Cloud Console → **APIs & Services** → **Credentials**
2. **Create Credentials** → **OAuth 2.0 Client ID** → **Web application**
3. Add **Authorized redirect URIs**:
   - Local: `http://localhost/login/oauth2/code/google`
   - Production: `https://yourdomain.com/login/oauth2/code/google`
4. Copy the Client ID + Secret into `.env`

## Production (DigitalOcean)

`docker-compose.prod.yml` adjusts CORS origins, removes the exposed DB port, and trusts forwarded headers from the host nginx.

```bash
# on the server
cd /root/StudSpace && git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml build backend frontend
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate backend frontend
```

There is **no CI/CD** — pushing to GitHub does not redeploy. You pull and rebuild on the droplet manually.

A host-level nginx terminates HTTPS (Certbot / Let's Encrypt) and proxies `https://yourdomain.com` → `http://localhost:80` (the Docker frontend), passing `X-Forwarded-Proto: https` so the backend builds correct OAuth redirect URIs. Set `client_max_body_size 30M` in the host nginx to allow PDF uploads.

## Local development (without Docker)

**Backend** — needs PostgreSQL 16 with a `studspace` database:
```bash
cd Backend
./mvnw spring-boot:run \
  -Dspring-boot.run.jvmArguments="-DJWT_SECRET=<secret> -DGOOGLE_CLIENT_ID=<id> -DGOOGLE_CLIENT_SECRET=<secret> -DFRONTEND_URL=http://localhost:5173"
```

**Frontend**:
```bash
cd Frontend
npm install
npm run dev      # Vite dev server on http://localhost:5173
```

Add a dev proxy to `Frontend/vite.config.js` so `/api` reaches the local backend:
```js
server: {
  proxy: {
    '/api': 'http://localhost:8080',
    '/oauth2': 'http://localhost:8080',
    '/login': 'http://localhost:8080',
  },
},
```
