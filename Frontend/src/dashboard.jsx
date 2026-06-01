// dashboard.jsx — Dashboard page (API-integrated)

import React from 'react';
import API from './api';
import { Icon, Card, Badge, ProgressBar, Ring, Skeleton, Button, ErrorState, useCountUp, RECENT_ICON, RECENT_TONE, attTone } from './lib';

function Greeting({ user }) {
  const date = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const firstName = user ? (user.fullName || user.username || "").split(" ")[0] : "…";

  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="text-[26px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
        Hey, {firstName} <span className="ml-0.5">👋</span>
      </h1>
      <p className="text-[13px] text-neutral-500 dark:text-neutral-400">{date}</p>
    </div>
  );
}

function StatCard({ icon, label, value, suffix = "", sub, ring, loaded, delay = 0 }) {
  const animated = useCountUp(loaded && value != null ? value : 0, { duration: 950, delay });
  return (
    <Card className="relative overflow-hidden p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.8)]">
      <div className="flex items-center gap-1.5 text-[11.5px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        <Icon name={icon} size={12} />
        <span>{label}</span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-1.5">
        <span className="text-[30px] font-semibold tracking-tight tabular-nums text-neutral-900 dark:text-neutral-50">
          {loaded && value != null ? animated : <Skeleton className="h-7 w-12 inline-block" />}{suffix}
        </span>
        {ring != null && (
          <div className="flex-shrink-0">
            <Ring value={loaded ? ring : 0} size={36} stroke={3} />
          </div>
        )}
      </div>
      <div className="mt-1 text-[11.5px] text-neutral-500 dark:text-neutral-400">{sub}</div>
    </Card>
  );
}

function CourseCard({ c, loaded, idx, threshold, onNav }) {
  const att = useCountUp(loaded ? (c.attendancePercentage || 0) : 0, { duration: 900, delay: 100 + idx * 60 });
  const pct = c.attendancePercentage || 0;
  const tone = attTone(pct, threshold);
  const below = pct < threshold;
  const attCls = tone === "green" ? "text-neutral-900 dark:text-neutral-50"
               : tone === "yellow" ? "text-amber-600 dark:text-amber-400"
               : "text-rose-600 dark:text-rose-400";
  return (
    <Card className="group relative overflow-hidden p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-300 dark:hover:border-white/15 hover:shadow-[0_10px_28px_-14px_rgba(0,0,0,0.14)] dark:hover:shadow-[0_10px_28px_-14px_rgba(0,0,0,0.9)] cursor-pointer">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {c.code && <span className="text-[10.5px] font-mono font-medium tracking-wider text-neutral-400 dark:text-neutral-500">{c.code}</span>}
            {below && (
              <span className={`inline-flex items-center gap-1 rounded-sm px-1 py-px text-[10px] font-medium ${tone === "red" ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300" : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>
                <Icon name="AlertCircle" size={9} /> Low
              </span>
            )}
          </div>
          <h3 className="mt-1 text-[14px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 leading-snug">{c.name}</h3>
        </div>
        <button onClick={() => onNav?.("semesters")} className="opacity-0 group-hover:opacity-100 transition-opacity grid h-6 w-6 place-items-center rounded-md text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/[0.06] hover:text-neutral-700 dark:hover:text-neutral-200">
          <Icon name="ArrowUpRight" size={13} />
        </button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5">
        <div>
          <div className="text-[10.5px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-medium">Attendance</div>
          <div className={`mt-0.5 text-[18px] font-semibold tabular-nums tracking-tight ${attCls}`}>
            {att}<span className="text-[12px] text-neutral-400 font-normal">%</span>
          </div>
        </div>
        <div>
          <div className="text-[10.5px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-medium">Resources</div>
          <div className="mt-0.5 text-[18px] font-semibold text-neutral-900 dark:text-neutral-50 tabular-nums tracking-tight">{c.resourceCount || 0}</div>
        </div>
      </div>
    </Card>
  );
}

function CourseCardSkeleton() {
  return (
    <Card className="p-4">
      <Skeleton className="h-3 w-10" />
      <Skeleton className="mt-2 h-4 w-2/3" />
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div><Skeleton className="h-2 w-16" /><Skeleton className="mt-1.5 h-5 w-12" /></div>
        <div><Skeleton className="h-2 w-16" /><Skeleton className="mt-1.5 h-5 w-8" /></div>
      </div>
    </Card>
  );
}

function RecentRow({ r }) {
  const typeKey = r.type ? (r.type.charAt(0) + r.type.slice(1).toLowerCase()) : "Other";
  const iconName = RECENT_ICON[typeKey] || RECENT_ICON[r.type] || "Paperclip";
  const tone = RECENT_TONE[typeKey] || RECENT_TONE[r.type] || "neutral";
  const when = r.createdAt ? new Date(r.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";
  return (
    <div className="group flex items-center gap-3 rounded-md px-2 py-2 hover:bg-neutral-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer">
      <div className="grid h-8 w-8 place-items-center rounded-md bg-neutral-100 dark:bg-white/[0.05] text-neutral-600 dark:text-neutral-300">
        <Icon name={iconName} size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Badge tone={tone}>{r.type}</Badge>
          <span className="truncate text-[12.5px] font-medium text-neutral-800 dark:text-neutral-100">{r.title}</span>
        </div>
        <div className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
          <span className="font-mono">{r.courseName}</span>{when && ` · ${when}`}
        </div>
      </div>
      <Icon name="ChevronRight" size={13} className="text-neutral-300 dark:text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

function Dashboard({ loaded, onNav, user }) {
  const [data, setData] = React.useState(null);
  const [fetching, setFetching] = React.useState(true);
  const [error, setError] = React.useState(false);
  const threshold = parseInt(localStorage.getItem('ss-att-threshold') || '75', 10);

  const fetchData = React.useCallback(() => {
    setFetching(true);
    setError(false);
    API.dashboard.get()
      .then(d => { setData(d); setFetching(false); })
      .catch(() => { setFetching(false); setError(true); });
  }, []);

  React.useEffect(() => { fetchData(); }, []);

  const stats = data?.stats || {};
  const courses = data?.currentSemester?.courses || [];
  const semester = data?.currentSemester?.semester;
  const recent = data?.recentResources || [];
  const dataReady = loaded && !fetching;
  const weekCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyResources = recent.filter(r => r.createdAt && new Date(r.createdAt).getTime() > weekCutoff).length;

  if (error) return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-7 lg:px-10 lg:py-9 page-fade">
      <Greeting user={user} courses={[]} />
      <div className="mt-8">
        <ErrorState title="Failed to load dashboard" onRetry={fetchData} />
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-7 lg:px-10 lg:py-9 page-fade">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <Greeting user={user} />
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => onNav?.("attendance")}><Icon name="Calendar" size={13} /> Today</Button>
          <Button onClick={() => onNav?.("semesters")}><Icon name="Plus" size={13} strokeWidth={2.25} /> Add resource</Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard loaded={dataReady} icon="BookOpen"       label="Courses"    value={stats.totalCourses}      sub={semester ? `${semester.label} · ${courses.length} active` : "No active semester"} delay={0} />
        <StatCard loaded={dataReady} icon="CalendarCheck2" label="Attendance" value={stats.overallAttendance} suffix="%" sub="Across all courses" ring={stats.overallAttendance} delay={80} />
        <StatCard loaded={dataReady} icon="Bookmark"       label="Resources"  value={stats.totalResources}    sub={`All semesters${weeklyResources > 0 ? ` · +${weeklyResources} this week` : ""}`} delay={160} />
        <StatCard loaded={dataReady} icon="GraduationCap"  label="Credits"    value={stats.totalCredits}      sub="Across all courses" delay={240} />
      </div>

      <section className="mt-9">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Current semester</h2>
            <p className="mt-0.5 text-[12.5px] text-neutral-500 dark:text-neutral-400">
              {semester ? `${semester.label} · ${courses.length} courses` : "No active semester — add one in Semesters"}
            </p>
          </div>
          <button onClick={() => onNav?.("semesters")} className="inline-flex items-center gap-1 text-[12px] font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors">
            View all <Icon name="ArrowRight" size={12} />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {!dataReady
            ? Array.from({ length: 3 }).map((_, i) => <CourseCardSkeleton key={i} />)
            : courses.length === 0
              ? <div className="col-span-3 rounded-lg border border-dashed border-neutral-200 dark:border-white/[0.08] py-10 text-center text-[13px] text-neutral-400">No courses yet. Go to Semesters to add your first course.</div>
              : courses.map((c, i) => <CourseCard key={c.id} c={c} loaded={dataReady} idx={i} threshold={threshold} onNav={onNav} />)
          }
        </div>
      </section>

      <section className="mt-9 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Recent resources</h2>
              {dataReady && <Badge>{recent.length}</Badge>}
            </div>
            <button onClick={() => onNav?.("semesters")} className="text-[11.5px] font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">Open library</button>
          </div>
          <div className="mt-2 -mx-1 flex flex-col gap-0.5">
            {!dataReady
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-2 py-2">
                    <Skeleton className="h-8 w-8" />
                    <div className="flex-1"><Skeleton className="h-3 w-2/3" /><Skeleton className="mt-1.5 h-2.5 w-1/4" /></div>
                  </div>
                ))
              : recent.length === 0
                ? <div className="py-8 text-center text-[13px] text-neutral-400">No resources yet.</div>
                : recent.map((r, i) => <RecentRow key={r.id || i} r={r} />)
            }
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Attendance overview</h2>
          </div>
          {!dataReady ? (
            <div className="mt-4 flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1"><Skeleton className="h-2.5 w-3/4" /><Skeleton className="mt-1.5 h-1.5 w-full" /></div>
                  <Skeleton className="h-3 w-8" />
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="mt-4 text-[12.5px] text-neutral-400 dark:text-neutral-500">
              Add courses in the <button onClick={() => onNav?.("semesters")} className="text-[var(--accent)] hover:underline font-medium">Semesters</button> page to track attendance here.
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {courses.slice(0, 4).map(c => {
                const tone = attTone(c.attendancePercentage || 0, threshold);
                const barCls = tone === "green" ? "bg-emerald-500" : tone === "yellow" ? "bg-amber-500" : "bg-rose-500";
                const txtCls = tone === "green" ? "text-emerald-600 dark:text-emerald-400" : tone === "yellow" ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400";
                return (
                <div key={c.id} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-medium text-neutral-700 dark:text-neutral-200">{c.name}</div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-white/[0.06]">
                      <div className={`h-full rounded-full transition-[width] duration-700 ${barCls}`} style={{ width: `${c.attendancePercentage || 0}%` }} />
                    </div>
                  </div>
                  <span className={`text-[11.5px] tabular-nums font-medium ${txtCls}`}>
                    {c.attendancePercentage || 0}%
                  </span>
                </div>
                );
              })}
            </div>
          )}
          {courses.length > 4 && (
            <button onClick={() => onNav?.("attendance")} className="mt-3 w-full text-center text-[11.5px] font-medium text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors">
              View all {courses.length} courses →
            </button>
          )}
        </Card>
      </section>

      <div className="mt-10 flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-600">
        <span>StudSpace · v1.0</span>
        <span>Data from StudSpace API</span>
      </div>
    </div>
  );
}

export default Dashboard;
