# Tier-1 Latency Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut dashboard latency by fixing an N+1 (~30 → ~5 queries), enable gzip, make the DB pool explicit, and cache the dashboard per user with evict-on-write.

**Architecture:** The dashboard read path batches its DB access and is cached in-process (Caffeine) keyed by user id; every write that changes dashboard data evicts that user's entry. nginx gzips responses. No schema change.

**Tech Stack:** Spring Boot 3.2.5, Java 21, Spring Data JPA, Spring Cache + Caffeine, nginx, Docker Compose.

## Global Constraints

- **No test framework in this repo.** Verification is manual per `.claude/testing.md`: rebuild the container, exercise it, observe. Every task's "verify" step is a real command or UI action with expected output — not JUnit.
- **Ownership pattern is mandatory** and must not be weakened; this change touches read/aggregation and caching only — do not remove any `getOwned`/ownership check.
- **Do not read or print `.env`.**
- **Response DTOs must be byte-for-byte unchanged** by Task 1 (pure query refactor).
- Rebuild after backend changes: `docker compose build backend && docker compose up -d --force-recreate backend`. After nginx: `docker compose build frontend && docker compose up -d --force-recreate frontend`.
- Commit style: short summary line; for a behavioral/perf fix add a blank line + a paragraph explaining what was wrong and why. No `Co-Authored-By`.

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `Backend/src/main/java/com/studspace/dashboard/DashboardService.java` | batched aggregation; `@Cacheable` | 1, 4 |
| `Backend/src/main/java/com/studspace/resource/ResourceRepository.java` | `JOIN FETCH r.course` on recent | 1 |
| `Frontend/nginx.conf` | gzip | 2 |
| `Backend/src/main/resources/application.properties` | Hikari pool | 3 |
| `Backend/pom.xml` | cache + caffeine deps | 4 |
| `Backend/src/main/java/com/studspace/config/CacheConfig.java` (new) | `@EnableCaching` + Caffeine manager | 4 |
| `Backend/src/main/java/com/studspace/attendance/AttendanceService.java` | `@CacheEvict` | 4 |
| `Backend/src/main/java/com/studspace/resource/ResourceService.java` | `@CacheEvict` | 4 |
| `Backend/src/main/java/com/studspace/course/CourseService.java` | `@CacheEvict` | 4 |
| `Backend/src/main/java/com/studspace/semester/SemesterService.java` | `@CacheEvict` | 4 |

---

## Task 1: Batch the dashboard queries (fix N+1)

**Files:**
- Modify: `Backend/src/main/java/com/studspace/dashboard/DashboardService.java` (rewrite `getDashboard`, add imports)
- Modify: `Backend/src/main/java/com/studspace/resource/ResourceRepository.java:22-23` (`findRecentByUserId` query)

**Interfaces:**
- Consumes (existing, already present): `attendanceRepository.findByCourseIdIn(Collection<UUID>) : List<AttendanceRecord>`; `resourceRepository.countByCourseIds(Collection<UUID>) : List<Object[]>` (row[0]=UUID courseId, row[1]=Long count); `courseService.toDto(Course, List<AttendanceRecord>, int) : CourseDto`.
- Produces: `getDashboard(UUID) : DashboardResponse` — **unchanged signature and response shape.**

- [ ] **Step 1: Capture the baseline (before any change)**

Ensure the stack is up and seeded:
```bash
docker compose up -d
node seed.mjs                       # if benchuser not already seeded
BENCH_USER=benchuser BENCH_PASSWORD=Bench123! node benchmark.mjs
```
Expected: note the **Dashboard** avg/p95 line (baseline to beat).

- [ ] **Step 2: Turn on SQL logging to see the N+1**

Edit `Backend/src/main/resources/application.properties`: set `spring.jpa.show-sql=true` (temporary). Rebuild + hit the dashboard once:
```bash
docker compose build backend && docker compose up -d --force-recreate backend
TOKEN=$(curl -s -X POST http://localhost/api/auth/login -H "Content-Type: application/json" -d '{"username":"benchuser","password":"Bench123!"}' | python -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")
curl -s -o /dev/null http://localhost/api/dashboard -H "Authorization: Bearer $TOKEN"
docker compose logs backend --since 30s | grep -c "select"
```
Expected: a high count (~30 for a 6-course seed) — the N+1 you're fixing.

- [ ] **Step 3: Add `JOIN FETCH r.course` to the recent-resources query**

In `ResourceRepository.java`, change:
```java
@Query("SELECT r FROM Resource r WHERE r.course.semester.user.id = :userId ORDER BY r.createdAt DESC")
List<Resource> findRecentByUserId(UUID userId, org.springframework.data.domain.Pageable pageable);
```
to:
```java
@Query("SELECT r FROM Resource r JOIN FETCH r.course WHERE r.course.semester.user.id = :userId ORDER BY r.createdAt DESC")
List<Resource> findRecentByUserId(UUID userId, org.springframework.data.domain.Pageable pageable);
```

- [ ] **Step 4: Rewrite `getDashboard` to batch**

Add these imports to `DashboardService.java`:
```java
import com.studspace.attendance.AttendanceRecord;
import java.util.Map;
import java.util.stream.Collectors;
```
Replace the body of `getDashboard(UUID userId)` (lines ~35-90) with:
```java
public DashboardResponse getDashboard(UUID userId) {
    List<Semester> semesters = semesterRepository.findByUserIdOrderByCreatedAtDesc(userId);
    Semester current = semesters.stream().filter(Semester::isCurrent).findFirst()
            .orElse(semesters.isEmpty() ? null : semesters.get(0));

    List<Course> allCourses = courseRepository.findBySemesterUserIdOrderByCreatedAtAsc(userId);
    List<UUID> courseIds = allCourses.stream().map(Course::getId).toList();

    Map<UUID, List<AttendanceRecord>> recordsMap = courseIds.isEmpty() ? Map.of()
            : attendanceRepository.findByCourseIdIn(courseIds).stream()
                .collect(Collectors.groupingBy(r -> r.getCourse().getId()));
    Map<UUID, Integer> countMap = courseIds.isEmpty() ? Map.of()
            : resourceRepository.countByCourseIds(courseIds).stream()
                .collect(Collectors.toMap(row -> (UUID) row[0], row -> ((Long) row[1]).intValue()));

    int totalCourses = allCourses.size();
    int totalResources = countMap.values().stream().mapToInt(Integer::intValue).sum();

    long totalPresent = 0, totalNonCancelled = 0;
    for (Course c : allCourses) {
        var records = recordsMap.getOrDefault(c.getId(), List.of());
        long present = records.stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT).count();
        long cancelled = records.stream().filter(r -> r.getStatus() == AttendanceStatus.CANCELLED).count();
        totalPresent += present;
        totalNonCancelled += records.size() - cancelled;
    }
    double overallAttendance = totalNonCancelled == 0 ? 0 : (totalPresent * 100.0) / totalNonCancelled;

    int totalCredits = allCourses.stream().mapToInt(Course::getCredits).sum();
    Stats stats = new Stats(totalCourses, Math.round(overallAttendance * 10.0) / 10.0, totalResources, totalCredits);

    CurrentSemesterView currentView = null;
    if (current != null) {
        SemesterDto semDto = mapper.map(current, SemesterDto.class);
        semDto.setShared(current.getShareToken() != null);
        UUID curId = current.getId();
        List<CourseDto> courses = allCourses.stream()
                .filter(c -> c.getSemester().getId().equals(curId))
                .map(c -> courseService.toDto(c,
                        recordsMap.getOrDefault(c.getId(), List.of()),
                        countMap.getOrDefault(c.getId(), 0)))
                .toList();
        currentView = new CurrentSemesterView(semDto, courses);
    }

    List<ResourceDto> recentResources = resourceRepository
            .findRecentByUserId(userId, PageRequest.of(0, 6))
            .stream()
            .map(r -> {
                ResourceDto dto = new ResourceDto();
                dto.setId(r.getId());
                dto.setCourseId(r.getCourse().getId());
                dto.setCourseName(r.getCourse().getName());
                dto.setType(r.getType());
                dto.setTitle(r.getTitle());
                dto.setUrl(r.getUrl());
                dto.setCreatedAt(r.getCreatedAt());
                return dto;
            })
            .toList();

    return new DashboardResponse(stats, currentView, recentResources);
}
```
Note: `c.getSemester().getId()` reads only the id of the lazy proxy — Hibernate does not initialize it, so this adds no query.

- [ ] **Step 5: Rebuild and verify the query count dropped**

```bash
docker compose build backend && docker compose up -d --force-recreate backend
TOKEN=$(curl -s -X POST http://localhost/api/auth/login -H "Content-Type: application/json" -d '{"username":"benchuser","password":"Bench123!"}' | python -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")
curl -s -o /dev/null http://localhost/api/dashboard -H "Authorization: Bearer $TOKEN"
docker compose logs backend --since 30s | grep -c "select"
```
Expected: **~5** selects (down from ~30).

- [ ] **Step 6: Verify the response is unchanged + faster**

```bash
curl -s http://localhost/api/dashboard -H "Authorization: Bearer $TOKEN" | python -m json.tool | head -40
BENCH_USER=benchuser BENCH_PASSWORD=Bench123! node benchmark.mjs
```
Expected: same JSON structure/values as baseline; Dashboard avg noticeably lower than Step 1.

- [ ] **Step 7: Turn SQL logging back off**

In `application.properties`, set `spring.jpa.show-sql=false`.

- [ ] **Step 8: Commit**

```bash
git add Backend/src/main/java/com/studspace/dashboard/DashboardService.java Backend/src/main/java/com/studspace/resource/ResourceRepository.java Backend/src/main/resources/application.properties
git commit -m "perf: batch dashboard queries to kill N+1 (~30 -> ~5 per load)"
```

---

## Task 2: gzip in nginx

**Files:**
- Modify: `Frontend/nginx.conf` (inside the `server { }` block, near the top)

**Interfaces:** none (config only).

- [ ] **Step 1: Add gzip directives**

In `Frontend/nginx.conf`, after the `client_max_body_size` line inside `server { }`, add:
```nginx
    # Compress text/JSON responses
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types application/json application/javascript text/css text/plain application/xml;
```

- [ ] **Step 2: Rebuild frontend**

```bash
docker compose build frontend && docker compose up -d --force-recreate frontend
```

- [ ] **Step 3: Verify compression on a JSON response**

```bash
TOKEN=$(curl -s -X POST http://localhost/api/auth/login -H "Content-Type: application/json" -d '{"username":"benchuser","password":"Bench123!"}' | python -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")
curl -s -D - -o /dev/null http://localhost/api/dashboard -H "Authorization: Bearer $TOKEN" -H "Accept-Encoding: gzip" | grep -i "content-encoding"
```
Expected: `content-encoding: gzip` (dashboard JSON exceeds the 1024-byte floor). Small responses stay uncompressed — that's correct.

- [ ] **Step 4: Commit**

```bash
git add Frontend/nginx.conf
git commit -m "perf: enable gzip for JSON/text responses in nginx"
```

---

## Task 3: Explicit HikariCP pool size

**Files:**
- Modify: `Backend/src/main/resources/application.properties` (Database section)

**Interfaces:** none (config only).

- [ ] **Step 1: Add pool sizing**

Under the `# Database` section in `application.properties`, add:
```
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=2
```

- [ ] **Step 2: Rebuild and confirm boot**

```bash
docker compose build backend && docker compose up -d --force-recreate backend
docker compose logs backend --since 60s | grep -iE "started studspace|HikariPool|error" | tail -5
```
Expected: `Started StudSpaceApplication`, a `HikariPool-1 - Start completed` line, no error.

- [ ] **Step 3: Commit**

```bash
git add Backend/src/main/resources/application.properties
git commit -m "chore: set explicit HikariCP pool size"
```

---

## Task 4: Cache the dashboard (Caffeine, evict on write)

**Files:**
- Modify: `Backend/pom.xml` (dependencies)
- Create: `Backend/src/main/java/com/studspace/config/CacheConfig.java`
- Modify: `Backend/src/main/java/com/studspace/dashboard/DashboardService.java` (`@Cacheable`)
- Modify: `AttendanceService.java`, `ResourceService.java`, `CourseService.java`, `SemesterService.java` (`@CacheEvict`)

**Interfaces:**
- Consumes: `getDashboard(UUID userId)` from Task 1.
- Produces: a Spring cache named `dashboard`, keyed by `userId`.

- [ ] **Step 1: Add cache dependencies to `pom.xml`**

Inside `<dependencies>` add:
```xml
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-cache</artifactId>
        </dependency>
        <dependency>
            <groupId>com.github.ben-manes.caffeine</groupId>
            <artifactId>caffeine</artifactId>
        </dependency>
```

- [ ] **Step 2: Create `CacheConfig.java`**

Create `Backend/src/main/java/com/studspace/config/CacheConfig.java`:
```java
package com.studspace.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
@EnableCaching
public class CacheConfig {

    // Dashboard is cached per user and evicted on any write that changes it.
    // The TTL is a backstop only — correctness comes from eviction.
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager("dashboard");
        manager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(1000)
                .expireAfterWrite(Duration.ofMinutes(10)));
        return manager;
    }
}
```

- [ ] **Step 3: Annotate the read**

In `DashboardService.java`, add import `import org.springframework.cache.annotation.Cacheable;` and annotate:
```java
    @Cacheable(value = "dashboard", key = "#userId")
    public DashboardResponse getDashboard(UUID userId) {
```

- [ ] **Step 4: Annotate the writes (evict by userId)**

Add `import org.springframework.cache.annotation.CacheEvict;` to each file and put `@CacheEvict(value = "dashboard", key = "#userId")` on these methods (all already take `UUID userId`):

`AttendanceService.java`: `upsert(UUID courseId, UUID userId, ...)`, `delete(UUID recordId, UUID userId)`
`ResourceService.java`: `create(UUID courseId, UUID userId, ...)`, `createForSemester(UUID semId, UUID userId, ...)`, `update(UUID resourceId, UUID userId, ...)`, `delete(UUID resourceId, UUID userId)`
`CourseService.java`: `create(UUID semesterId, UUID userId, ...)`, `update(UUID courseId, UUID userId, ...)`, `delete(UUID courseId, UUID userId)`
`SemesterService.java`: `create(UUID userId, ...)`, `update(UUID semesterId, UUID userId, ...)`, `setAsCurrent(UUID semesterId, UUID userId)`, `delete(UUID semesterId, UUID userId)`, `enableSharing(UUID semesterId, UUID userId)`, `disableSharing(UUID semesterId, UUID userId)`

Example (AttendanceService.upsert):
```java
    @CacheEvict(value = "dashboard", key = "#userId")
    @Transactional
    public AttendanceResponse upsert(UUID courseId, UUID userId, UpsertAttendanceRequest req) {
```
(Keep any existing annotations like `@Transactional`; add `@CacheEvict` above them.)

- [ ] **Step 5: Rebuild and confirm boot + caching active**

```bash
docker compose build backend && docker compose up -d --force-recreate backend
docker compose logs backend --since 60s | grep -iE "started studspace|error" | tail -3
```
Expected: `Started StudSpaceApplication`, no error.

- [ ] **Step 6: Verify cache HIT (second call is faster / no SQL)**

Temporarily set `spring.jpa.show-sql=true`, rebuild, then:
```bash
TOKEN=$(curl -s -X POST http://localhost/api/auth/login -H "Content-Type: application/json" -d '{"username":"benchuser","password":"Bench123!"}' | python -c "import sys,json;print(json.load(sys.stdin)['data']['token'])")
curl -s -o /dev/null http://localhost/api/dashboard -H "Authorization: Bearer $TOKEN"   # miss: ~5 selects
curl -s -o /dev/null http://localhost/api/dashboard -H "Authorization: Bearer $TOKEN"   # hit: 0 selects
docker compose logs backend --since 15s | grep -c "select"
```
Expected: the 2nd call adds **0** selects (served from cache). Set `show-sql=false` again after.

- [ ] **Step 7: Verify eviction (mark attendance → dashboard updates immediately)**

In the browser (logged in as benchuser): open the dashboard, note a course's attendance %; mark a class present/absent on that course; return to the dashboard → the % reflects the change **immediately** (no 10-min wait). This proves `@CacheEvict` fired.

- [ ] **Step 8: Confirm throughput held**

```bash
& "C:\Program Files\k6\k6.exe" run -e VUS=20 -e DURATION=15s loadtest.js
```
Expected: 0% errors; dashboard p95 same or better than Task 1.

- [ ] **Step 9: Commit**

```bash
git add Backend/pom.xml Backend/src/main/java/com/studspace/config/CacheConfig.java Backend/src/main/java/com/studspace/dashboard/DashboardService.java Backend/src/main/java/com/studspace/attendance/AttendanceService.java Backend/src/main/java/com/studspace/resource/ResourceService.java Backend/src/main/java/com/studspace/course/CourseService.java Backend/src/main/java/com/studspace/semester/SemesterService.java
git commit -m "perf: cache dashboard per user with evict-on-write (Caffeine)"
```

---

## Self-Review

**Spec coverage:**
- A (N+1) → Task 1 ✓ (batched attendance + resource counts, reused maps for current-sem view, JOIN FETCH recent).
- B (gzip) → Task 2 ✓.
- C (Hikari) → Task 3 ✓.
- D (cache + evict on all 14 write methods) → Task 4 ✓ (list matches the spec's eviction table; slots excluded).
- Verification (benchmark before/after, show-sql count, mark-attendance-updates, k6) → present across tasks ✓.

**Placeholder scan:** none — every code step shows the actual code; every verify step is a concrete command with expected output.

**Type consistency:** `countByCourseIds` returns `List<Object[]>` (row[0] UUID, row[1] Long) — matched in Task 1. `courseService.toDto(Course, List<AttendanceRecord>, int)` signature matches its existing definition. `@CacheEvict` key `#userId` matches the `UUID userId` param present on every listed write method (verified against their signatures).
