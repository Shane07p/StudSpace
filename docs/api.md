# API Reference

38 endpoints across 11 controllers. All paths are relative to `/api`. Protected endpoints require `Authorization: Bearer <jwt>`. All responses use the envelope `{ success, data, message }`.

## Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | No | Register — body: `{ fullName, username, email, password }` (password ≥ 8). Rate-limited 5/15min/IP |
| `POST` | `/auth/login` | No | Login — body: `{ username, password }` → returns JWT. Rate-limited 5/15min/IP |

## User
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/user/me` | Yes | Get current user profile |
| `PUT` | `/user/me` | Yes | Update profile (name, college, branch, year, bio) |
| `PUT` | `/user/me/handles` | Yes | Update social / coding handles |
| `POST` | `/user/me/photo` | Yes | Set profile photo URL |
| `POST` | `/user/me/cover` | Yes | Set cover photo URL |
| `PUT` | `/user/me/password` | Yes | Change password (new ≥ 8) |
| `DELETE` | `/user/me` | Yes | Delete account |

## Semesters
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/semesters` | Yes | List all semesters |
| `POST` | `/semesters` | Yes | Create — body: `{ label, shortName?, current? }` |
| `PUT` | `/semesters/{id}` | Yes | Update |
| `POST` | `/semesters/{id}/current` | Yes | Mark as current semester |
| `DELETE` | `/semesters/{id}` | Yes | Delete |
| `POST` | `/semesters/{id}/share` | Yes | Enable public share token |
| `DELETE` | `/semesters/{id}/share` | Yes | Disable public share token |

## Courses
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/semesters/{id}/courses` | Yes | List courses |
| `POST` | `/semesters/{id}/courses` | Yes | Create — body: `{ name, code?, instructor?, credits? }` |
| `PUT` | `/courses/{id}` | Yes | Update |
| `DELETE` | `/courses/{id}` | Yes | Delete |

## Resources
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/courses/{id}/resources` | Yes | List resources for a course |
| `POST` | `/courses/{id}/resources` | Yes | Create — body: `{ type, title, url?, notes? }`. Type: `PYQ` `NOTES` `PLAYLIST` `LINK` `OTHER` |
| `GET` | `/semesters/{id}/resources` | Yes | All resources across a semester |
| `PUT` | `/resources/{id}` | Yes | Update |
| `DELETE` | `/resources/{id}` | Yes | Delete |
| `POST` | `/upload` | Yes | Upload PDF (multipart `file`, max 25 MB, magic-byte checked) → Cloudinary URL |
| `POST` | `/upload/image` | Yes | Upload image (multipart `file`, JPEG/PNG/WebP/GIF) → Cloudinary URL |

## Attendance
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/courses/{id}/attendance` | Yes | All records + summary |
| `POST` | `/courses/{id}/attendance` | Yes | Upsert — body: `{ date: "YYYY-MM-DD", status: "PRESENT" \| "ABSENT" \| "CANCELLED" }` |
| `DELETE` | `/attendance/{id}` | Yes | Delete record |

## Timetable
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/semesters/{id}/slots` | Yes | List timetable slots |
| `POST` | `/semesters/{id}/slots` | Yes | Create slot (rejects overlapping/duplicate times) |
| `PUT` | `/slots/{id}` | Yes | Update slot |
| `DELETE` | `/slots/{id}` | Yes | Delete slot |

## Dashboard & Share
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/dashboard` | Yes | Stats + current semester + recent resources |
| `GET` | `/share/{token}` | No | Public semester view (curated, no sensitive fields) |

## AI
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/ai/chat` | Yes | Chat — body: `{ message, context? }`. Powered by Groq LLaMA 3.3 70B |
