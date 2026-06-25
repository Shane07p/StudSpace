-- StudSpace Database Schema
-- Run this once against your PostgreSQL database: psql -U postgres -d studspace -f schema.sql
-- Create the database first: CREATE DATABASE studspace;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users
CREATE TABLE IF NOT EXISTS users (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    username      VARCHAR(50) UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    google_sub    VARCHAR(255) UNIQUE,
    full_name     VARCHAR(100),
    college       VARCHAR(100),
    branch        VARCHAR(50),
    year          INT,
    bio           TEXT,
    profile_photo TEXT,
    cover_photo   TEXT,
    created_at    TIMESTAMP DEFAULT now(),
    updated_at    TIMESTAMP DEFAULT now()
);

-- Social / coding handles (one-to-many with users)
CREATE TABLE IF NOT EXISTS user_handles (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform      VARCHAR(50) NOT NULL,
    url           VARCHAR(500),
    display_order INT         DEFAULT 0
);

-- Semesters
CREATE TABLE IF NOT EXISTS semesters (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label       VARCHAR(100) NOT NULL,
    short_name  VARCHAR(10),
    is_current  BOOLEAN     DEFAULT false,
    share_token VARCHAR(64) UNIQUE,
    created_at  TIMESTAMP   DEFAULT now()
);

-- Courses
CREATE TABLE IF NOT EXISTS courses (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    semester_id  UUID        NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    code         VARCHAR(20),
    name         VARCHAR(200) NOT NULL,
    instructor   VARCHAR(100),
    credits      INT         DEFAULT 3,
    total_classes INT        DEFAULT 0,
    created_at   TIMESTAMP   DEFAULT now()
);

-- Resources (course_id nullable to support uncategorized resources linked to a semester)
CREATE TABLE IF NOT EXISTS resources (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id   UUID         REFERENCES courses(id) ON DELETE CASCADE,
    semester_id UUID         REFERENCES semesters(id) ON DELETE CASCADE,
    type        VARCHAR(20)  NOT NULL,
    title       VARCHAR(300) NOT NULL,
    url         VARCHAR(1000),
    notes       TEXT,
    created_at  TIMESTAMP    DEFAULT now()
);

-- Attendance records
CREATE TABLE IF NOT EXISTS attendance_records (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id  UUID        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    date       DATE        NOT NULL,
    status     VARCHAR(20) NOT NULL,
    created_at TIMESTAMP   DEFAULT now(),
    UNIQUE (course_id, date)
);

-- Timetable slots
CREATE TABLE IF NOT EXISTS timetable_slots (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    semester_id UUID        NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    course_id   UUID        REFERENCES courses(id) ON DELETE SET NULL,
    day         VARCHAR(5)  NOT NULL,
    start_time  VARCHAR(5)  NOT NULL,
    end_time    VARCHAR(5)  NOT NULL,
    room        VARCHAR(100),
    created_at  TIMESTAMP   DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_semesters_user_id    ON semesters(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_semester_id  ON courses(semester_id);
CREATE INDEX IF NOT EXISTS idx_resources_course_id  ON resources(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_course_id ON attendance_records(course_id);
CREATE INDEX IF NOT EXISTS idx_semesters_share_token ON semesters(share_token);
CREATE INDEX IF NOT EXISTS idx_slots_semester_id    ON timetable_slots(semester_id);
