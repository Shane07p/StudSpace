# StudSpace

A full-stack academic workspace for university students — organize semesters, track attendance, manage study resources, and chat with an AI study assistant.

---

## Table of Contents

- [Architecture](docs/architecture.md)
- [Backend](docs/backend.md)
- [Frontend](docs/frontend.md)
- [Database](docs/database.md)
- [API Reference](docs/api.md)
- [Deployment & Setup](docs/deployment.md)
- [ER Diagram (PDF)](docs/studpspace_er_diagram.pdf)

---

## Features

- **Dashboard** — At-a-glance stats (courses, attendance %, resources, credits) with per-course cards
- **Semesters & Courses** — Full CRUD for semesters and courses; resource management (notes, links, PDFs); weekly timetable view; shareable semester pages via public token
- **Attendance** — Per-course daily tracking with 75% threshold ring visualization; skip/need calculation
- **Grades** — CGPA calculator using actual course credits from the API
- **Profile** — Editable profile with social and coding handle links (GitHub, LinkedIn, LeetCode, etc.)
- **Share page** — Unauthenticated public view of a shared semester (courses, resources, stats)
- **Google OAuth** — Sign in with Google in addition to email/password
- **AI Assistant** — Semester-aware study assistant with persistent, multi-turn chat history. Reads your attached PDF resources via Google Gemini (multimodal); falls back to Groq LLaMA 3.3 70B for text. Replies render Markdown + LaTeX
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
| File storage | Cloudinary (PDF / image upload) |
| Frontend | Vite 5 · React 18 · Tailwind CSS 3.4 · Lucide React · FullCalendar 6 |
| AI | Groq LLaMA 3.3 70B (text chat) · Google Gemini (PDF reading) |
| Container | Docker Compose (3 services: `db` · `backend` · `frontend`) |
| Web server | nginx (static files + reverse proxy to Spring Boot) |

---

## Quick Start

```bash
git clone <repo-url> && cd StudSpace
cp .env.example .env          # fill in values — see docs/deployment.md
docker compose up -d          # app on http://localhost
```

The first build takes a few minutes. Full setup, environment variables, and the Windows/BuildKit note are in [docs/deployment.md](docs/deployment.md).

---

## License & Copyright

© 2026 Shane Christian. All rights reserved.

This project and its source code are the intellectual property of the author. No part may be reproduced, distributed, or used without the author's permission.
