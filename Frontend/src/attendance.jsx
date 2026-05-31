// attendance.jsx — full attendance view (API-integrated)

import React from 'react';
import API from './api.js';
import { Icon, Card, Badge, Button, Tabs, Ring, ErrorState, useCountUp, Skeleton, attTone } from './lib.jsx';

const STATUS_DOT_AT = {
  PRESENT:   "bg-emerald-500",
  ABSENT:    "bg-rose-500",
  CANCELLED: "bg-neutral-300 dark:bg-neutral-600",
};
const STATUS_ROW_AT = {
  PRESENT:   "bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-500/[0.05] dark:hover:bg-emerald-500/[0.09]",
  ABSENT:    "bg-rose-50/50 hover:bg-rose-50 dark:bg-rose-500/[0.05] dark:hover:bg-rose-500/[0.09]",
  CANCELLED: "bg-neutral-50/70 hover:bg-neutral-50 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]",
};

const STATUSES = [
  { id: "PRESENT",   label: "Present",   color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500" },
  { id: "ABSENT",    label: "Absent",    color: "text-rose-600 dark:text-rose-400",        bg: "bg-rose-500" },
  { id: "CANCELLED", label: "Cancelled", color: "text-neutral-500 dark:text-neutral-400",  bg: "bg-neutral-400" },
];

function StatusToggle({ value, onChange }) {
  const idx = STATUSES.findIndex(s => s.id === value);
  return (
    <div className="relative inline-flex items-center rounded-md border border-neutral-200/80 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] p-0.5">
      <div
        className="absolute top-0.5 bottom-0.5 rounded-[5px] transition-all duration-300 ease-out"
        style={{
          width: `calc((100% - 4px) / 3)`,
          left: `calc(2px + ${idx} * ((100% - 4px) / 3))`,
          background: value === "PRESENT" ? "rgba(16,185,129,0.12)" : value === "ABSENT" ? "rgba(244,63,94,0.12)" : "rgba(115,115,115,0.10)",
        }}
      />
      {STATUSES.map((s) => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          className={`relative z-10 inline-flex items-center justify-center gap-1 rounded-[5px] px-2.5 py-1 text-[11.5px] font-medium transition-colors duration-300 min-w-[72px] ${
            value === s.id ? s.color : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${value === s.id ? s.bg : "bg-neutral-300 dark:bg-neutral-600"}`} />
          {s.label}
        </button>
      ))}
    </div>
  );
}

function SummaryBar({ summary, threshold }) {
  const { present = 0, absent = 0, cancelled = 0, total = 0, percentage = 0 } = summary || {};
  const counted = total - cancelled;
  const above = percentage >= threshold;
  const t = threshold / 100;
  const classesNeeded = above ? 0 : Math.max(0, Math.ceil((t * counted - present) / (1 - t)));
  const canSkip = above ? Math.max(0, Math.floor(present / t - counted)) : 0;
  const animatedPct = useCountUp(Math.round(percentage), { duration: 900 });
  const tone = attTone(Math.round(percentage), threshold);
  const ringColor  = tone === "green" ? "#10b981" : tone === "yellow" ? "#f59e0b" : "#ef4444";
  const pctCls     = tone === "green" ? "text-emerald-600 dark:text-emerald-400" : tone === "yellow" ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400";
  const chipBg     = tone === "green" ? "bg-emerald-50 dark:bg-emerald-500/[0.08]" : tone === "yellow" ? "bg-amber-50 dark:bg-amber-500/[0.08]" : "bg-rose-50 dark:bg-rose-500/[0.08]";
  const chipIconCls= tone === "green" ? "text-emerald-600 dark:text-emerald-400" : tone === "yellow" ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400";
  const chipTxtCls = tone === "green" ? "text-emerald-700 dark:text-emerald-300" : tone === "yellow" ? "text-amber-700 dark:text-amber-300" : "text-rose-700 dark:text-rose-300";
  const iconName   = tone === "green" ? "ShieldCheck" : tone === "yellow" ? "ShieldAlert" : "AlertTriangle";

  return (
    <Card className="relative overflow-hidden p-5">
      <div className="flex flex-wrap items-center gap-6">
        <div className="relative">
          <Ring value={Math.round(percentage)} size={72} stroke={5} color={ringColor} />
          <div className="absolute inset-0 grid place-items-center">
            <span className={`text-[16px] font-semibold tabular-nums ${pctCls}`}>
              {animatedPct}%
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">This semester</div>
          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1.5">
            <Tally label="Attended"  value={present}   dotClass="bg-emerald-500" />
            <Tally label="Absent"    value={absent}    dotClass="bg-rose-500" />
            <Tally label="Cancelled" value={cancelled} dotClass="bg-neutral-300 dark:bg-neutral-600" />
            <div className="text-[12px] text-neutral-500 dark:text-neutral-400">
              <span className="font-medium text-neutral-700 dark:text-neutral-200 tabular-nums">{present}</span>
              <span className="mx-1 text-neutral-400">/</span>
              <span className="tabular-nums">{counted}</span> classes counted
            </div>
          </div>
        </div>
        <div className={`ml-auto flex items-center gap-2.5 rounded-md px-3 py-2 ${chipBg}`}>
          <Icon name={iconName} size={16} className={chipIconCls} />
          <div className="text-[12.5px] leading-snug">
            <div className={`font-semibold ${chipTxtCls}`}>
              {above
                ? <>You can skip up to <span className="tabular-nums">{canSkip}</span> more {canSkip === 1 ? "class" : "classes"}</>
                : <>You need <span className="tabular-nums">{classesNeeded}</span> more {classesNeeded === 1 ? "class" : "classes"} to reach {threshold}%</>}
            </div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Threshold: {threshold}% · Currently {above ? "ahead" : "below"}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function Tally({ label, value, dotClass }) {
  return (
    <div className="flex items-center gap-1.5 text-[12px] text-neutral-500 dark:text-neutral-400">
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      <span className="font-semibold text-neutral-800 dark:text-neutral-100 tabular-nums">{value}</span>
      <span>{label}</span>
    </div>
  );
}

const STATUS_CYCLE = { PRESENT: "ABSENT", ABSENT: "CANCELLED", CANCELLED: null };

function CalendarView({ records, selectedId, onRefresh }) {
  const today = new Date();
  const [year, setYear] = React.useState(today.getFullYear());
  const [month, setMonth] = React.useState(today.getMonth());

  const recMap = React.useMemo(() => {
    const m = {};
    records.forEach(r => { m[r.date] = r; });
    return m;
  }, [records]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const handleDayClick = async (dateStr, rec) => {
    const nextStatus = rec ? STATUS_CYCLE[rec.status] : "PRESENT";
    try {
      if (nextStatus === null) {
        await API.attendance.delete(rec.id);
      } else {
        await API.attendance.upsert(selectedId, dateStr, nextStatus);
      }
      onRefresh();
    } catch (e) {
      alert(e.message || "Failed to update attendance");
    }
  };

  const cellStyle = (status) => {
    if (status === "PRESENT")   return "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold";
    if (status === "ABSENT")    return "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-semibold";
    if (status === "CANCELLED") return "bg-neutral-100 dark:bg-white/[0.06] text-neutral-400 dark:text-neutral-500 line-through";
    return "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.05] cursor-pointer";
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isFuture = dateStr > todayStr;
    cells.push({ d, dateStr, rec: recMap[dateStr] || null, isFuture });
  }

  const cycleLabel = (rec) => rec ? (STATUS_CYCLE[rec.status] ? `→ ${STATUS_CYCLE[rec.status].charAt(0) + STATUS_CYCLE[rec.status].slice(1).toLowerCase()}` : "→ Remove") : "→ Mark Present";

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={prevMonth}
          className="flex items-center gap-1.5 rounded-md border border-neutral-200/80 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] px-3 py-1.5 text-[12px] font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/[0.06] transition-colors"
        >
          <Icon name="ChevronLeft" size={13} /> Prev
        </button>
        <span className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-50">{MONTHS[month]} {year}</span>
        <button
          onClick={nextMonth}
          className="flex items-center gap-1.5 rounded-md border border-neutral-200/80 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] px-3 py-1.5 text-[12px] font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/[0.06] transition-colors"
        >
          Next <Icon name="ChevronRight" size={13} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10.5px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} />;
          const isToday = cell.dateStr === todayStr;
          return (
            <button
              key={i}
              onClick={() => !cell.isFuture && handleDayClick(cell.dateStr, cell.rec)}
              disabled={cell.isFuture}
              title={cell.isFuture ? "Cannot mark future dates" : `${cell.dateStr}${cell.rec ? `: ${cell.rec.status.charAt(0) + cell.rec.status.slice(1).toLowerCase()}` : ""} ${cycleLabel(cell.rec)}`}
              className={`relative flex flex-col items-center justify-center rounded-lg py-2.5 text-[13px] transition-colors ${cell.isFuture ? "text-neutral-300 dark:text-neutral-700 cursor-not-allowed" : cellStyle(cell.rec?.status)} ${isToday ? "ring-2 ring-[var(--accent)] ring-offset-2 dark:ring-offset-neutral-950" : ""}`}
            >
              <span>{cell.d}</span>
              {cell.rec && (
                <span className={`mt-1 h-1 w-1 rounded-full ${cell.rec.status === "PRESENT" ? "bg-emerald-500" : cell.rec.status === "ABSENT" ? "bg-rose-500" : "bg-neutral-400"}`} />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-neutral-500 dark:text-neutral-400 border-t border-neutral-100 dark:border-white/[0.06] pt-3">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-100 dark:bg-emerald-500/20" /> Present</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-rose-100 dark:bg-rose-500/20" /> Absent</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-neutral-100 dark:bg-white/[0.06]" /> Cancelled</span>
        <span className="ml-auto">Click any day to add or cycle · 3rd click removes</span>
      </div>
    </Card>
  );
}

function ClassRow({ rec, onChange, onDelete }) {
  const d = new Date(rec.date);
  const dateStr = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const dayStr = d.toLocaleDateString(undefined, { weekday: "short" });
  const year = d.getFullYear();
  return (
    <div className={`group grid grid-cols-[20px_1fr_auto] items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${STATUS_ROW_AT[rec.status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_AT[rec.status]} transition-colors duration-300`} />
      <div className="flex items-baseline gap-3 min-w-0">
        <span className="text-[13px] font-medium text-neutral-800 dark:text-neutral-100 tabular-nums">{dateStr}</span>
        <span className="text-[11.5px] text-neutral-500 dark:text-neutral-400 w-10">{dayStr}</span>
        <span className="text-[11px] text-neutral-400 dark:text-neutral-500 hidden sm:inline tabular-nums">{year}</span>
      </div>
      <div className="flex items-center gap-2">
        <StatusToggle value={rec.status} onChange={(v) => onChange(v)} />
        <button
          onClick={onDelete}
          title="Delete record"
          className="opacity-0 group-hover:opacity-100 grid h-6 w-6 place-items-center rounded text-neutral-400 hover:bg-rose-50 dark:hover:bg-rose-500/[0.08] hover:text-rose-500 transition-all"
        >
          <Icon name="Trash2" size={12} />
        </button>
      </div>
    </div>
  );
}

function groupByMonth(records) {
  const groups = new Map();
  for (const r of records) {
    const d = new Date(r.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    if (!groups.has(key)) groups.set(key, { label, items: [] });
    groups.get(key).items.push(r);
  }
  return [...groups.values()];
}

function AttendancePage() {
  const [courses, setCourses] = React.useState([]);
  const [selectedId, setSelectedId] = React.useState(null);
  const [records, setRecords] = React.useState([]);
  const [summary, setSummary] = React.useState(null);
  const [filter, setFilter] = React.useState("all");
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(false);
  const [semLabel, setSemLabel] = React.useState("");
  const [threshold, setThreshold] = React.useState(() =>
    parseInt(localStorage.getItem('ss-att-threshold') || '75', 10)
  );
  const [editingThreshold, setEditingThreshold] = React.useState(false);
  const [viewMode, setViewMode] = React.useState("list");

  React.useEffect(() => {
    localStorage.setItem('ss-att-threshold', threshold);
  }, [threshold]);

  const loadCourses = React.useCallback(() => {
    setLoading(true);
    setLoadError(false);
    API.dashboard.get().then(d => {
      const sem = d?.currentSemester;
      if (sem && sem.courses && sem.courses.length > 0) {
        setCourses(sem.courses);
        setSelectedId(sem.courses[0].id);
        setSemLabel(sem.semester?.label || "");
      }
      setLoading(false);
    }).catch(() => { setLoadError(true); setLoading(false); });
  }, []);

  React.useEffect(() => { loadCourses(); }, []);

  React.useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    API.attendance.get(selectedId).then(data => {
      setRecords(data.records || []);
      setSummary(data.summary);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selectedId]);

  const setStatus = (rec, newStatus) => {
    setRecords(prev => prev.map(r => r.id === rec.id ? { ...r, status: newStatus } : r));
    API.attendance.upsert(selectedId, rec.date, newStatus).then(data => {
      setRecords(data.records || []);
      setSummary(data.summary);
    }).catch(() => {
      setRecords(prev => prev.map(r => r.id === rec.id ? rec : r));
    });
  };

  const exportCSV = () => {
    if (!course || records.length === 0) return;
    const rows = [
      ["Course", course.name],
      ["Code", course.code || ""],
      ["Semester", semLabel],
      ["Instructor", course.instructor || ""],
      [],
      ["Date", "Day", "Status"],
      ...records.slice().sort((a, b) => a.date.localeCompare(b.date)).map(r => {
        const d = new Date(r.date);
        return [
          r.date,
          d.toLocaleDateString(undefined, { weekday: "long" }),
          r.status.charAt(0) + r.status.slice(1).toLowerCase(),
        ];
      }),
      [],
      ["Present", summary?.present ?? ""],
      ["Absent", summary?.absent ?? ""],
      ["Cancelled", summary?.cancelled ?? ""],
      ["Attendance %", summary?.percentage != null ? summary.percentage.toFixed(1) + "%" : ""],
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${course.code || course.name}-attendance.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const markToday = () => {
    if (!selectedId) return;
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (records.some(r => r.date === today)) return;
    API.attendance.upsert(selectedId, today, "PRESENT").then(data => {
      setRecords(data.records || []);
      setSummary(data.summary);
    }).catch((e) => alert(e.message || "Failed to mark attendance"));
  };

  const course = courses.find(c => c.id === selectedId);
  const filtered = filter === "all" ? records : records.filter(r => r.status === filter.toUpperCase());
  const groups = groupByMonth(filtered.slice().reverse());

  if (loading && courses.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[1240px] px-6 py-7 lg:px-10 lg:py-9">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-24 w-full mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto w-full max-w-[1240px] px-6 py-7 lg:px-10 lg:py-9">
        <ErrorState title="Failed to load attendance" onRetry={loadCourses} />
      </div>
    );
  }

  if (!loading && courses.length === 0) {
    return (
      <div className="mx-auto flex max-w-[600px] flex-col items-center px-6 py-32 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-neutral-100 dark:bg-white/[0.05] text-neutral-500">
          <Icon name="CalendarCheck2" size={20} />
        </div>
        <h1 className="mt-5 text-[18px] font-semibold tracking-tight">No courses yet</h1>
        <p className="mt-1.5 text-[13px] text-neutral-500 max-w-[360px]">
          Add a semester and courses first. Then come back here to track attendance.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-7 lg:px-10 lg:py-9 page-fade">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[12px] text-neutral-500 dark:text-neutral-400">
            <Icon name="CalendarCheck2" size={12} />
            <span>Attendance</span>
            {course && <><span className="text-neutral-300 dark:text-neutral-700">/</span>
            <span className="font-mono text-neutral-600 dark:text-neutral-300">{course.code || course.name}</span></>}
          </div>
          <h1 className="mt-1.5 text-[24px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">{course?.name || "—"}</h1>
          <p className="mt-1 text-[12.5px] text-neutral-500 dark:text-neutral-400">
            {course ? `${course.instructor || ""} · ${course.credits} credits${semLabel ? ` · ${semLabel}` : ""}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportCSV} disabled={!course || records.length === 0}><Icon name="Download" size={12} /> Export CSV</Button>
          <Button onClick={markToday}><Icon name="Plus" size={12} strokeWidth={2.25} /> Mark today</Button>
        </div>
      </div>

      <div className="mt-6 -mx-1 flex items-center gap-1 overflow-x-auto pb-1">
        {courses.map(c => {
          const active = c.id === selectedId;
          const tone = attTone(c.attendancePercentage || 0, threshold);
          const dotCls = tone === "green" ? "bg-emerald-500" : tone === "yellow" ? "bg-amber-500" : "bg-rose-500";
          const pctCls = tone === "green" ? "text-neutral-500 dark:text-neutral-400" : tone === "yellow" ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400";
          return (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`group flex shrink-0 items-center gap-2 rounded-md border px-2.5 py-1.5 text-left transition-colors ${
                active
                  ? "border-neutral-300 bg-white shadow-sm dark:border-white/15 dark:bg-white/[0.05]"
                  : "border-transparent hover:bg-neutral-100/60 dark:hover:bg-white/[0.03]"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${dotCls} ${active ? "" : "opacity-50 group-hover:opacity-100"}`} />
              {c.code && <span className={`font-mono text-[10.5px] ${active ? "text-neutral-500 dark:text-neutral-400" : "text-neutral-400"}`}>{c.code}</span>}
              <span className={`text-[12px] font-medium ${active ? "text-neutral-900 dark:text-neutral-50" : "text-neutral-600 dark:text-neutral-300"}`}>{c.name}</span>
              <span className={`tabular-nums text-[11px] ${pctCls}`}>{c.attendancePercentage || 0}%</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        <SummaryBar summary={summary} threshold={threshold} />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {viewMode === "list" && (
            <Tabs
              value={filter}
              onChange={setFilter}
              items={[
                { id: "all",       label: "All",       badge: records.length },
                { id: "present",   label: "Present",   badge: records.filter(r => r.status === "PRESENT").length },
                { id: "absent",    label: "Absent",    badge: records.filter(r => r.status === "ABSENT").length },
                { id: "cancelled", label: "Cancelled", badge: records.filter(r => r.status === "CANCELLED").length },
              ]}
            />
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center rounded-md border border-neutral-200/80 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] p-0.5 gap-0.5">
            {[{id:"list",icon:"List"},{id:"calendar",icon:"CalendarDays"}].map(v => (
              <button key={v.id} onClick={() => setViewMode(v.id)}
                className={`grid h-7 w-7 place-items-center rounded-[5px] transition-colors ${viewMode === v.id ? "bg-neutral-100 dark:bg-white/[0.08] text-neutral-900 dark:text-neutral-50" : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"}`}>
                <Icon name={v.icon} size={13} />
              </button>
            ))}
          </div>
        <div className="flex items-center gap-4 text-[11.5px] text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-1.5">
            <Icon name="Target" size={12} />
            <span>Target:</span>
            {editingThreshold ? (
              <input
                type="number" min="50" max="100" value={threshold}
                onChange={e => setThreshold(Math.min(100, Math.max(50, parseInt(e.target.value) || 75)))}
                onBlur={() => setEditingThreshold(false)}
                autoFocus
                className="w-14 h-6 rounded border border-[var(--accent)] bg-white dark:bg-white/[0.03] px-1.5 text-[11.5px] text-neutral-800 dark:text-neutral-200 outline-none"
              />
            ) : (
              <button
                onClick={() => setEditingThreshold(true)}
                className="font-medium text-[var(--accent)] hover:underline tabular-nums"
              >
                {threshold}%
              </button>
            )}
          </div>
        </div>
        </div>
      </div>

      {viewMode === "calendar" && (
        <div className="mt-3">
          <CalendarView
            records={records}
            selectedId={selectedId}
            onRefresh={() => {
              API.attendance.get(selectedId).then(data => {
                setRecords(data.records || []);
                setSummary(data.summary);
              }).catch(() => {});
            }}
          />
        </div>
      )}

      <section className={`mt-3 flex flex-col gap-5 ${viewMode === "calendar" ? "hidden" : ""}`}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-md" />)
        ) : groups.length === 0 ? (
          <Card className="p-10 text-center">
            <Icon name="Inbox" size={20} className="text-neutral-300 dark:text-neutral-600" />
            <p className="mt-3 text-[13px] text-neutral-500 dark:text-neutral-400">
              {records.length === 0 ? "No attendance records yet. Use 'Mark today' to add your first." : "No classes match this filter."}
            </p>
          </Card>
        ) : (
          groups.map((g) => (
            <div key={g.label} className="flex flex-col gap-1.5">
              <div className="sticky top-14 z-10 -mx-1 flex items-center gap-3 bg-white/85 dark:bg-neutral-950/85 px-1 py-1.5 backdrop-blur">
                <div className="text-[10.5px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">{g.label}</div>
                <div className="h-px flex-1 bg-neutral-200/70 dark:bg-white/[0.06]" />
                <div className="text-[10.5px] text-neutral-400 dark:text-neutral-500 tabular-nums">{g.items.length} {g.items.length === 1 ? "class" : "classes"}</div>
              </div>
              <div className="flex flex-col gap-1">
                {g.items.map((rec) => (
                  <ClassRow key={rec.id} rec={rec} onChange={(s) => setStatus(rec, s)} onDelete={() => {
                    API.attendance.delete(rec.id).then(() => {
                      setRecords(prev => prev.filter(r => r.id !== rec.id));
                      API.attendance.get(selectedId).then(data => setSummary(data.summary)).catch(() => {});
                    }).catch(e => alert(e.message || "Failed to delete"));
                  }} />
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export default AttendancePage;
