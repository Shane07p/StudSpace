# Backend

Spring Boot 3.2.5 · Java 21 · Spring Data JPA · stateless JWT security. Maven project under `Backend/`.

## Package-by-feature

Each domain is a self-contained package under `com.studspace` holding its own Controller / Service / Repository / entity / `dto`:

```
com/studspace/
├── auth/         JWT, login/register, Google OAuth2, rate limiting
├── user/         User + UserHandle entities, profile, handles
├── semester/     Semester CRUD + share token
├── course/       Course CRUD
├── resource/     Resource CRUD (PYQ/NOTES/PLAYLIST/LINK/OTHER)
├── attendance/   Attendance upsert + summary
├── slot/         Timetable slots (with overlap guard)
├── upload/       Cloudinary PDF / image upload
├── ai/           Groq chat assistant
├── dashboard/    Aggregated stats endpoint
├── share/        Public (no-auth) shared-semester view
├── common/       ApiResponse, exceptions, GlobalExceptionHandler
└── config/       SecurityConfig, CorsConfig, AppConfig
```

## Request lifecycle

Every authenticated request flows through the same layers:

```
HTTP request
  → RateLimitFilter      (only /api/auth/login, /register)
  → JwtFilter            (validates Bearer token → sets authenticated user)
  → Controller           (thin: extract userId, delegate)
  → Service              (business logic + ownership checks)
  → Repository           (Spring Data JPA → PostgreSQL)
  → Entity               (row mapped to object)
  ← DTO, wrapped in ApiResponse
  ← exceptions caught by GlobalExceptionHandler
```

## Conventions

- **Lombok** — `@RequiredArgsConstructor` for constructor injection (`private final` fields), `@Data` on DTOs, `@Builder`/`@Getter`/`@Setter` on entities.
- **Thin controllers** — extract the caller's id with the local `uid(principal)` helper (`UUID.fromString(p.getUsername())`), then delegate. No business logic in controllers.
- **Responses** — everything returns `ApiResponse.ok(data)` / `ApiResponse.ok(null, "message")`. The envelope is `{ success, data, message }`.
- **Validation at the edge** — DTO fields use `@NotBlank` / `@Size` / `@Email`; controllers put `@Valid` on the `@RequestBody`.
- **Queries** — Spring Data derived method names (`findBySemesterIdOrderBy...`) or `@Query` with `@Param`. No string concatenation of user input.

## The ownership pattern (mandatory)

Every service that loads a resource by id verifies it belongs to the caller before returning it. Example — `SemesterService.getOwned`:

```java
public Semester getOwned(UUID semesterId, UUID userId) {
    Semester semester = semesterRepository.findById(semesterId)
            .orElseThrow(() -> new NotFoundException("Semester not found"));
    if (!semester.getUser().getId().equals(userId))
        throw new ForbiddenException("Access denied");
    return semester;
}
```

Each feature has its equivalent (`getOwned`, `getSemesterOwned`, `getSlotOwned`). Combined with unguessable UUID ids, this closes IDOR (a user can't access another user's data by guessing ids).

## Errors

Exceptions thrown from services are translated to clean JSON by `GlobalExceptionHandler` (`@RestControllerAdvice`) and wrapped in `ApiResponse.fail(code, message)`. No stack traces leak to the client. The custom ones live in `common`.

| Exception | HTTP | Error code | When it fires |
|-----------|------|-----------|---------------|
| `NotFoundException` | 404 | `RESOURCE_NOT_FOUND` | id doesn't exist |
| `ForbiddenException` | 403 | `FORBIDDEN` | resource not owned by caller (`getOwned`) |
| `BadRequestException` | 400 | `BAD_REQUEST` | bad input / business rule (slot overlap, invalid PDF) |
| `ConflictException` | 409 | `CONFLICT` | duplicate username/email on register |
| `MethodArgumentNotValidException` | 400 | `VALIDATION_ERROR` | `@Valid` DTO check fails |
| `BadCredentialsException` | 401 | `INVALID_CREDENTIALS` | wrong login password |
| `AccessDeniedException` | 403 | `FORBIDDEN` | Spring Security blocks the request |
| `Exception` (fallback) | 500 | `INTERNAL_ERROR` | anything unexpected (generic message) |

## Auth

- **JWT** — `JwtUtil` signs an HMAC-SHA token whose subject is the user id (7-day expiry). `JwtFilter` validates the `Bearer` token on every request and loads the user.
- **Login / register** — `AuthController` → `AuthService`; passwords hashed with BCrypt; minimum 8 chars (`RegisterRequest`, `ChangePasswordRequest`).
- **Rate limiting** — `RateLimitFilter` (Bucket4j) caps `/api/auth/login` and `/register` at 5 requests / 15 min / IP. The client IP is the right-most public entry of `X-Forwarded-For` (our nginx hops are trailing).
- **Google OAuth2** — `OAuth2SuccessHandler` issues the JWT and redirects with a `#token=` fragment; OAuth state is stored in a short-lived cookie (`CookieOAuth2AuthorizationRequestRepository`).

## Other notable services

- **UploadService** — validates magic bytes (`%PDF-`, JPEG/PNG/WebP/GIF), not just the Content-Type header; stores PDFs with a forced `.pdf` name; uploads to Cloudinary.
- **TimetableSlotService** — rejects slots that overlap an existing one on the same day, and verifies a slot's course belongs to its semester.
- **ShareService** — the only endpoint that returns data without auth; builds a curated public DTO (no email, no password hash, no ids) from a semester's share token.
- **AiService** — forwards the user's message + their own semester context to Groq (LLaMA 3.3 70B).

## Config

- `config/SecurityConfig` — the filter chain; public paths are `/api/auth/**`, `/api/share/**`, `/oauth2/**`, `/login/oauth2/**`; everything else under `/api/**` requires auth.
- `Backend/src/main/resources/application.properties` — all secrets via `${ENV_VAR}`; `ddl-auto=validate` (Hibernate checks the schema, never modifies it).

See [database.md](database.md) for the schema and [api.md](api.md) for the endpoint reference.
