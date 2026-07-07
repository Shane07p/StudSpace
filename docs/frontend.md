# Frontend

Two separate frontends served by the same nginx, sharing the same `/api` backend.

| | Dashboard | Static pages |
|---|---|---|
| Files | `Frontend/src/` | `index.html`, `signin.html`, `share.html`, `Frontend/js/` |
| Build | Vite 5 (bundled) | served as-is by nginx |
| Modules | ES modules (`import`/`export`) | IIFE exposing `window.API` |
| Styling | Tailwind via `tailwind.config.js` | Tailwind CDN (pinned) |
| Icons | `lucide-react` npm package | lucide UMD CDN (pinned) |

Only `dashboard.html` goes through Vite. The other three HTML pages are copied straight to nginx.

## Dashboard (`Frontend/src/`)

```
src/
├── main.jsx        Entry point — theme init, OAuth #token capture, auth guard, ReactDOM.render
├── app.jsx         Shell: Sidebar, Topbar, client-side router
├── api.js          The single API client (export default API)
├── lib.jsx         Shared UI primitives + hooks (Card, Button, Tabs, Sheet, ConfirmDialog, EmptyState, useCountUp…)
├── dashboard.jsx   Dashboard page
├── semesters.jsx   Semester / course / resource management + weekly timetable
├── attendance.jsx  Attendance tracker
├── calculator.jsx  CGPA calculator (shown as "Grades" in the sidebar)
├── assistant.jsx   AI assistant page — conversation list + persistent chat (Markdown/LaTeX)
├── profile.jsx     User profile
├── tweaks-panel.jsx  UI customization panel
└── globals.css     Tailwind base + CSS custom properties
```

Conventions: function components only; reuse the primitives in `lib.jsx` before writing new ones; Tailwind utility classes; no window globals.

## Static pages (`Frontend/js/`, root HTML)

- `js/api.js` — a minimal IIFE client (`window.API`) with only `auth.login`, `auth.register`, `share.get`. Separate from the React client.
- `js/home.js` — landing-page interactions (the demo wizard uses hardcoded data only).
- **Escaping is mandatory** — any API value rendered via `innerHTML` goes through the page's `esc()` helper, and any `href`/`src` through `safeUrl()` (http/https only). `share.html` renders another user's data, so this is non-negotiable.

## The API bridge

`Frontend/src/api.js` is the single source for all dashboard ↔ backend calls. Each method maps 1:1 to a backend endpoint:

```js
API.semesters.list()              → GET  /api/semesters
API.courses.create(semId, data)   → POST /api/semesters/{semId}/courses
API.attendance.upsert(id, d, s)   → POST /api/courses/{id}/attendance
```

The client attaches `Authorization: Bearer <ss-token>`, unwraps `ApiResponse.data`, and handles `401` (clear token → sign-in) and `429` (friendly rate-limit message). Full endpoint list in [api.md](api.md).

## Auth & token

- The JWT lives in `localStorage['ss-token']`.
- On OAuth return, `main.jsx` reads the token from `location.hash` (`#token=…`), stores it, and strips it from the URL via `history.replaceState`.
- `main.jsx` is the auth guard: no token → redirect to `signin.html`.

## Client state (`localStorage`, `ss-*` prefix)

| Key | Values | Meaning |
|-----|--------|---------|
| `ss-token` | JWT string | Auth token |
| `ss-theme` | `'dark'` \| `''` | Dark mode |
| `ss-sidebar` | `'1'` \| `''` | Sidebar collapsed |
| `ss-att-threshold` | 50–100 | Attendance threshold % (default 75) |

The accent color is fixed to indigo in `globals.css` (no `ss-accent` key — the picker was removed).

## App URLs

| URL | Page |
|-----|------|
| `http://localhost` | Landing page |
| `http://localhost/signin.html` | Sign in / Register |
| `http://localhost/dashboard.html` | Main app (requires login) |
| `http://localhost/share.html?token=<token>` | Public share page |

## Build

`npm run build` in `Frontend/` produces `dist/`. The Docker image runs this inside the container. To apply changes:

```bash
docker compose build frontend && docker compose up -d --force-recreate frontend
```
