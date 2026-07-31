# Deployment & Setup

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Engine + Compose)
- A [Google Cloud Console](https://console.cloud.google.com) OAuth 2.0 Client ID (for Google sign-in)
- _(Optional)_ [Cloudinary](https://cloudinary.com) account — for PDF/image uploads
- _(Optional)_ [Groq](https://console.groq.com/keys) API key — for the AI text assistant
- _(Optional)_ [Google Gemini](https://aistudio.google.com/apikey) API key — for reading PDF resources in the assistant

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
| `GROQ_API_KEY` | No | Enables the AI text assistant |
| `GEMINI_API_KEY` | No | Enables PDF reading in the assistant (Google Gemini) |
| `GEMINI_MODEL` | No | Gemini model to use — default `gemini-2.5-flash`. Pick one with free-tier quota on your key |
| `CLOUDINARY_URL` | No | `cloudinary://api_key:api_secret@cloud_name` — enables uploads |

*Required for Google sign-in. Email/password auth works without it.

## Google OAuth setup

1. Google Cloud Console → **APIs & Services** → **Credentials**
2. **Create Credentials** → **OAuth 2.0 Client ID** → **Web application**
3. Add **Authorized redirect URIs**:
   - Local: `http://localhost/login/oauth2/code/google`
   - Production: `https://yourdomain.com/login/oauth2/code/google`
4. Copy the Client ID + Secret into `.env`

## Production (single VM)

The production setup is the same on any Ubuntu VM — **currently Microsoft Azure**, previously DigitalOcean. Both run the same three containers behind a host-level nginx that terminates HTTPS.

`docker-compose.prod.yml` closes the exposed DB port and binds the frontend to `127.0.0.1:8080` (only the host nginx reaches it); the backend trusts forwarded headers from that nginx.

### Common steps (any VM)

```bash
# 1. install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER      # re-login after

# 2. get the code + secrets
git clone <repo-url> && cd StudSpace
# copy .env with real secrets; set FRONTEND_URL=https://yourdomain.com

# 3. build + run (build sequentially on small boxes)
docker compose -f docker-compose.yml -f docker-compose.prod.yml build backend
docker compose -f docker-compose.yml -f docker-compose.prod.yml build frontend
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

A **host-level nginx** terminates HTTPS (Certbot / Let's Encrypt) and proxies `https://yourdomain.com` → `http://127.0.0.1:8080` (the frontend container), passing `X-Forwarded-Proto: https` so the backend builds correct OAuth redirect URIs. Set `client_max_body_size 30M` in the host nginx for PDF uploads:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
# create /etc/nginx/sites-available/studspace with a server block:
#   listen 80; server_name yourdomain.com; client_max_body_size 30M;
#   location / { proxy_pass http://127.0.0.1:8080; proxy_set_header Host $host;
#                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#                proxy_set_header X-Forwarded-Proto $scheme; }
sudo certbot --nginx -d yourdomain.com     # adds 443 + HTTP->HTTPS redirect
```

There is **no CI/CD** — pushing to GitHub does not redeploy. Pull and rebuild on the VM manually. On a fresh volume, `schema.sql` runs automatically on first boot, so all tables are created; only an existing DB needs manual migration.

### Azure notes (current host)

- **Azure for Students** restricts regions via a `listOfAllowedLocations` policy. Central India is **not** allowed — deploy to an allowed region (e.g. **UAE North**, East Asia, Malaysia West). Set **Availability options → "No infrastructure redundancy required"** to avoid zone-level policy blocks.
- The cheapest viable size is **`B2ats_v2`** (2 vCPU / 1 GB, ~$8/mo). On 1 GB, two tweaks are required so the build and JVM don't OOM:
  ```bash
  # 2 GB swap (before building)
  sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
  sudo mkswap /swapfile && sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  ```
  and cap the JVM heap by adding to the backend service in `docker-compose.yml`:
  ```yaml
  JAVA_TOOL_OPTIONS: "-Xmx384m"
  ```
- The base `docker-compose.yml` frontend publishes `80:80` for local dev; remove that line on the VM so only the prod override's `127.0.0.1:8080` binding applies (Compose concatenates `ports`, so leaving both would expose the container publicly and clash with the host nginx).

### DigitalOcean notes (previous host)

- Droplet: Ubuntu, 2 GB RAM — enough to run without swap or the JVM cap.
- Same host-nginx + Certbot setup; frontend bound to `127.0.0.1:8080`.

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
