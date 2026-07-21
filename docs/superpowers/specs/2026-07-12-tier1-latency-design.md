# Tier-1 Latency Optimization — Design

**Date:** 2026-07-12
**Status:** Approved (pending spec review)
**Scope:** Reduce dashboard latency and per-request overhead. No new features, no schema change.

## Problem

`DashboardService.getDashboard(userId)` — the app's most-hit read endpoint, also used to build the AI assistant's semester context — issues ~30 SQL queries per call for a 6-course user (N+1):

- resource count queried **per course** (`countByCourseId` in a loop) — `DashboardService.java:44`
- all attendance rows loaded **per course** (`findByCourseIdOrderByDateAsc` in a loop) — `DashboardService.java:51`
- current-semester courses mapped with the single `toDto(c)` (2 queries each) — `DashboardService.java:68-69`
- recent resources lazy-load `r.getCourse()` per row — `DashboardService.java:79-80`

Batch helpers already exist in the repositories but the dashboard doesn't use them. There is no HTTP compression and no caching.

Interview-relevant framing: profile → find the real bottleneck (N+1, not missing infra) → fix with batched queries → measure → then cache.

## Goals

- Cut dashboard query count from ~30 to ~5 (A).
- Compress JSON responses over the wire (B).
- Make the connection pool explicit (C).
- Cache the dashboard per user with correct invalidation on writes (D).
- Measure before/after; no behavior/response change.

## Non-goals

- No read replicas / DB replication (load test showed the backend, not Postgres, is the ceiling).
- No Redis / horizontal scaling in this change (in-memory Caffeine is enough for a single instance).
- No timetable-slot involvement (slots are not on the dashboard).

---

## A. Fix the dashboard N+1

Rewrite `DashboardService.getDashboard` to load batched data once and reuse it:

1. `List<Course> allCourses = courseRepository.findBySemesterUserIdOrderByCreatedAtAsc(userId)` (unchanged, 1 query).
2. `List<UUID> allCourseIds = allCourses.map(Course::getId)`.
3. **Attendance (1 query):** `attendanceRepository.findByCourseIdIn(allCourseIds)`, group by `course.id` into `Map<UUID, List<AttendanceRecord>>`.
4. **Resource counts (1 query):** `resourceRepository.countByCourseIds(allCourseIds)`, collect into `Map<UUID, Integer>`.
5. **Stats:** compute `totalResources` (sum of countMap), `overallAttendance` (sum present / sum non-cancelled across recordsMap), `totalCredits`, `totalCourses` from the in-memory maps — no per-course queries.
6. **Current-semester view:** filter `allCourses` to the current semester and map each with the existing public `courseService.toDto(c, recordsMap.getOrDefault(id, List.of()), countMap.getOrDefault(id, 0))` — reuses the already-loaded maps, **zero extra queries**. (Do **not** call `getBySemester`; it would re-query.)
7. **Recent resources:** add `JOIN FETCH r.course` to `ResourceRepository.findRecentByUserId` so `r.getCourse()` needs no lazy load.

Resulting queries: semesters (1) + allCourses (1) + attendance (1) + resource counts (1) + recent resources (1) = **~5**. Response DTO is byte-for-byte identical.

**Files:** `DashboardService.java`, `ResourceRepository.java` (fetch join). `CourseService.toDto(Course, List, int)` is already public — reused as-is.

## B. gzip in nginx

In `Frontend/nginx.conf`, enable compression for API/text responses:

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_proxied any;
gzip_types application/json application/javascript text/css text/plain application/xml;
```

Applies to the proxied `/api` JSON and the static assets. No effect on already-compressed PDFs/images.

## C. HikariCP pool

In `application.properties`, set explicit pool sizing (documented intent, not silent defaults):

```
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=2
```

Rationale: a single 1-vCPU/2-GB droplet with one Postgres instance; 10 is ample and bounded. (Default is already 10 — this makes it explicit and tunable.)

## D. Cache the dashboard (Caffeine, evict on write)

**Dependencies (`Backend/pom.xml`):** `spring-boot-starter-cache` and `com.github.ben-manes.caffeine:caffeine`.

**Config:** a `@Configuration` with `@EnableCaching` and a Caffeine `CacheManager` for a `dashboard` cache (max ~1000 entries, a 10-minute defensive TTL as a safety net; correctness comes from eviction, not TTL).

**Read:** `@Cacheable(value = "dashboard", key = "#userId")` on `DashboardService.getDashboard(UUID userId)`.

**Invalidation:** `@CacheEvict(value = "dashboard", key = "#userId")` on every write that changes what the dashboard shows. All these methods already take `userId`:

| Service | Methods |
|---|---|
| AttendanceService | `upsert`, `delete` |
| ResourceService | `create`, `createForSemester`, `update`, `delete` |
| CourseService | `create`, `update`, `delete` |
| SemesterService | `create`, `update`, `setAsCurrent`, `delete`, `enableSharing`, `disableSharing` |

**Excluded:** timetable slot writes (not on the dashboard).

**Cross-service note:** `AttendanceService`/`ResourceService`/`CourseService` mutate data owned by the dashboard's user; each has the `userId` param, so `key="#userId"` evicts the right entry. Self-invocation is not a concern because eviction annotations sit on the write methods called directly from their controllers.

**Bonus:** the AI assistant builds its context via `getDashboard(userId)`, so caching also speeds up AI chats.

---

## Verification (measure-first)

No automated test framework in this repo — manual, per `.claude/testing.md`.

1. **Baseline:** `node seed.mjs` then `BENCH_USER=benchuser BENCH_PASSWORD=Bench123! node benchmark.mjs` — record dashboard avg/p95.
2. **After A:** rebuild backend, re-run benchmark — expect a clear drop. Temporarily set `spring.jpa.show-sql=true` and confirm the dashboard fires ~5 queries, not ~30.
3. **After D:** re-run benchmark — a cached hit should be ~sub-ms. Then in the UI: mark attendance on a course → reload dashboard → the overall % and course % update **immediately** (proves eviction). Repeat for adding a course and a resource.
4. **Throughput:** `k6 run -e VUS=20 -e DURATION=15s loadtest.js` — error rate stays 0%, throughput held or improved.
5. Revert `show-sql` to false.

## Rollout / risk

- A is behavior-preserving (identical DTO) — lowest risk, biggest single win.
- B, C are config-only.
- D's risk surface is the eviction list: a missed write path would serve a stale dashboard until the next eviction or TTL expiry. The table above enumerates all dashboard-affecting writes; the defensive TTL bounds any miss.
- Accepted-minor: `@CacheEvict` (afterInvocation) may evict slightly before the surrounding `@Transactional` commits, leaving a microsecond window where a concurrent read could re-cache pre-commit data. For a single-user, low-traffic personal app this is negligible; revisit with transaction-bound eviction only if it ever matters.
- No schema change → no droplet migration step. Backend rebuild required (new dependency + code); frontend rebuild required for the nginx change.

## Files touched

| File | Change |
|---|---|
| `Backend/.../dashboard/DashboardService.java` | batched queries; `@Cacheable` |
| `Backend/.../resource/ResourceRepository.java` | `JOIN FETCH r.course` on `findRecentByUserId` |
| `Backend/.../attendance/AttendanceService.java` | `@CacheEvict` on upsert/delete |
| `Backend/.../resource/ResourceService.java` | `@CacheEvict` on create/createForSemester/update/delete |
| `Backend/.../course/CourseService.java` | `@CacheEvict` on create/update/delete |
| `Backend/.../semester/SemesterService.java` | `@CacheEvict` on create/update/setAsCurrent/delete/enableSharing/disableSharing |
| `Backend/.../config/CacheConfig.java` (new) | `@EnableCaching` + Caffeine `CacheManager` |
| `Backend/pom.xml` | cache starter + caffeine |
| `Frontend/nginx.conf` | gzip |
| `Backend/.../resources/application.properties` | Hikari pool sizes |
