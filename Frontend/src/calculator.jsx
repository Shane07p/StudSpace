// calculator.jsx — CGPA / SGPA calculator

import React from 'react';
import API from './api';
import { Icon, Card, Badge, Button, Tabs, useCountUp } from './lib.jsx';

const DEFAULTS = {
  currentCGPA: 8.5,
  creditsEarned: 60,
  currentSemCredits: 20,
  targetCGPA: 9.0,
  totalProgramCredits: 160,
};

const GRADES = [
  { letter: "O",  points: 10 },
  { letter: "A+", points: 9 },
  { letter: "A",  points: 8 },
  { letter: "B+", points: 7 },
  { letter: "B",  points: 6 },
  { letter: "C",  points: 5 },
  { letter: "P",  points: 4 },
];

function calcRequiredSGPA({ currentCGPA, creditsEarned, currentSemCredits, targetCGPA }) {
  if (currentSemCredits <= 0) return null;
  const required = (targetCGPA * (creditsEarned + currentSemCredits) - currentCGPA * creditsEarned) / currentSemCredits;
  return required;
}

function classifyGoal(req) {
  if (req == null) return { tone: "neutral", label: "—", desc: "" };
  if (req <= 0)  return { tone: "good", label: "Already there", desc: "You'd hit this even if you bombed the semester." };
  if (req > 10)  return { tone: "bad",  label: "Mathematically impossible", desc: "Even straight O grades (10) won't get you there." };
  if (req > 9.5) return { tone: "bad",  label: "Extremely hard",  desc: "Requires near-perfect grades across every course." };
  if (req > 9)   return { tone: "warn", label: "Very ambitious",  desc: "Mostly A+/O. Doable but no room for slips." };
  if (req > 8)   return { tone: "warn", label: "Demanding",       desc: "Solid A+ average. Plan your priorities now." };
  if (req > 7)   return { tone: "good", label: "Achievable",      desc: "A solid B+/A average gets you there." };
  return            { tone: "good", label: "Comfortable",        desc: "Even a B average comfortably covers this." };
}

function RequiredSGPACard({ state, setState }) {
  const req = calcRequiredSGPA(state);
  const verdict = classifyGoal(req);
  const animated = useCountUp(req != null && isFinite(req) ? Math.max(0, Math.min(10, req)) : 0, { duration: 600, decimals: 2 });
  const projected = ((state.currentCGPA * state.creditsEarned + (req || 0) * state.currentSemCredits) / (state.creditsEarned + state.currentSemCredits)) || state.targetCGPA;
  const toneClass = {
    good:    "text-emerald-600 dark:text-emerald-400",
    warn:    "text-amber-600 dark:text-amber-400",
    bad:     "text-rose-600 dark:text-rose-400",
    neutral: "text-neutral-700 dark:text-neutral-200",
  }[verdict.tone];
  const ringColor = {
    good:    "#10b981",
    warn:    "#f59e0b",
    bad:     "#f43f5e",
    neutral: "#6366f1",
  }[verdict.tone];

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 text-[11.5px] font-medium uppercase tracking-wider text-[var(--accent)]">
        <Icon name="Target" size={12} /> Required SGPA
      </div>
      <h3 className="mt-2 text-[16px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
        What do I need this semester to reach my target CGPA?
      </h3>
      <p className="mt-1 text-[12.5px] text-neutral-500 dark:text-neutral-400">All values are editable. Everything updates live.</p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
        <NumField label="Current CGPA"           value={state.currentCGPA}      onChange={(v) => setState({ ...state, currentCGPA: clamp(v, 0, 10) })}      min={0} max={10}  step={0.01} decimals={2} hint="On a 10-point scale" />
        <NumField label="Credits earned so far"  value={state.creditsEarned}    onChange={(v) => setState({ ...state, creditsEarned: clamp(v, 0, 250) })}   min={0} max={250} step={1}    hint="Across all prior semesters" />
        <NumField label="This semester's credits" value={state.currentSemCredits} onChange={(v) => setState({ ...state, currentSemCredits: clamp(v, 1, 40) })} min={1} max={40}  step={1}    hint="Sum of all enrolled courses" />
        <NumField label="Target CGPA"            value={state.targetCGPA}       onChange={(v) => setState({ ...state, targetCGPA: clamp(v, 0, 10) })}       min={0} max={10}  step={0.01} decimals={2} hint="What you want to end this semester at" />
      </div>

      <div className="mt-6 rounded-lg border border-neutral-200/80 dark:border-white/[0.06] bg-neutral-50/60 dark:bg-white/[0.02] p-5">
        <div className="flex items-center gap-5">
          <div className="relative">
            <svg width="92" height="92" viewBox="0 0 92 92" className="-rotate-90">
              <circle cx="46" cy="46" r="38" stroke="currentColor" strokeWidth="6" fill="none" className="text-neutral-200 dark:text-white/[0.06]" />
              <circle cx="46" cy="46" r="38" stroke={ringColor} strokeWidth="6" fill="none" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 38}
                strokeDashoffset={2 * Math.PI * 38 - ((Math.max(0, Math.min(10, req || 0))) / 10) * 2 * Math.PI * 38}
                style={{ transition: "stroke-dashoffset 600ms cubic-bezier(.22,1,.36,1), stroke 300ms" }}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <div className={`text-[24px] font-semibold tabular-nums tracking-tight leading-none ${toneClass}`}>
                  {req == null ? "—" : (req < 0 ? "0.00" : req > 10 ? ">10" : animated.toFixed(2))}
                </div>
                <div className="text-[9.5px] uppercase tracking-wider text-neutral-400 font-medium mt-0.5">SGPA</div>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className={`text-[12px] font-semibold uppercase tracking-wider ${toneClass}`}>{verdict.label}</div>
            <div className="mt-1 text-[13.5px] text-neutral-700 dark:text-neutral-200 leading-snug">
              {req == null
                ? "Enter your this-semester credits to calculate."
                : req <= 0
                  ? <>You'll reach <span className="font-semibold tabular-nums">{state.targetCGPA.toFixed(2)}</span> even with a 0 this semester. Coast or aim higher.</>
                  : req > 10
                    ? <>This target isn't reachable in one semester. Reduce target to <span className="font-semibold tabular-nums">{Math.min(10, projected).toFixed(2)}</span> or earn more credits.</>
                    : <>You need to score at least <span className="font-semibold tabular-nums">{req.toFixed(2)}</span> SGPA across this semester's <span className="font-semibold tabular-nums">{state.currentSemCredits}</span> credits.</>}
            </div>
            <div className="mt-1 text-[11.5px] text-neutral-500 dark:text-neutral-400">{verdict.desc}</div>
          </div>
        </div>

        {req != null && req > 0 && req <= 10 && (
          <div className="mt-5 border-t border-neutral-200/70 dark:border-white/[0.06] pt-4">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">Grade reference</div>
            <div className="flex flex-wrap gap-1.5">
              {GRADES.map(g => {
                const hits = g.points >= req;
                return (
                  <div key={g.letter} className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${hits ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-neutral-100 dark:bg-white/[0.04] text-neutral-500 dark:text-neutral-400"}`}>
                    <span className="font-mono">{g.letter}</span>
                    <span className="text-neutral-400 dark:text-neutral-500">·</span>
                    <span className="tabular-nums">{g.points}</span>
                    {hits && <Icon name="Check" size={10} strokeWidth={3} />}
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-[10.5px] text-neutral-400 dark:text-neutral-500">Grades highlighted in green would individually keep you above your required SGPA.</p>
          </div>
        )}
      </div>
    </Card>
  );
}

function PlannerCard({ state, setState, courses }) {
  const [plan, setPlan] = React.useState({});

  React.useEffect(() => {
    setPlan(Object.fromEntries(courses.map(c => [c.id, "A+"])));
  }, [courses]);

  const setGrade = (id, letter) => setPlan(p => ({ ...p, [id]: letter }));

  const sgpa = React.useMemo(() => {
    const totalC = courses.reduce((s, c) => s + (c.credits || 0), 0);
    const totalG = courses.reduce((s, c) => s + (c.credits || 0) * (GRADES.find(g => g.letter === plan[c.id])?.points || 0), 0);
    return totalC ? totalG / totalC : 0;
  }, [plan, courses]);

  const totalSemCredits = courses.reduce((s, c) => s + (c.credits || 0), 0);
  const projectedCGPA = (state.currentCGPA * state.creditsEarned + sgpa * totalSemCredits) / (state.creditsEarned + totalSemCredits);
  const hitsTarget = projectedCGPA >= state.targetCGPA;
  const animatedSGPA = useCountUp(sgpa, { duration: 400, decimals: 2 });
  const animatedCGPA = useCountUp(projectedCGPA, { duration: 500, decimals: 2 });

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 text-[11.5px] font-medium uppercase tracking-wider text-[var(--accent)]">
        <Icon name="Sparkles" size={12} /> What-if planner
      </div>
      <h3 className="mt-2 text-[16px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
        Plan grades by course
      </h3>
      <p className="mt-1 text-[12.5px] text-neutral-500 dark:text-neutral-400">
        Pick a realistic grade for each course. We'll show your projected SGPA and updated CGPA.
      </p>

      {courses.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-neutral-200 dark:border-white/[0.08] py-8 text-center text-[13px] text-neutral-400">
          No courses in current semester. Add them in the Semesters page.
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-col gap-1.5">
            {courses.map((c) => (
              <div key={c.id} className="grid grid-cols-[88px_1fr_auto] items-center gap-3 rounded-md px-2 py-2 hover:bg-neutral-50 dark:hover:bg-white/[0.03] transition-colors">
                <span className="font-mono text-[11px] tracking-wider text-neutral-400 dark:text-neutral-500">{c.code || "—"}</span>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-neutral-800 dark:text-neutral-100">{c.name}</div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 tabular-nums">{c.credits} credits</div>
                </div>
                <GradePicker value={plan[c.id] || "A+"} onChange={(g) => setGrade(c.id, g)} />
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <CalcStat label="Projected SGPA" value={animatedSGPA.toFixed(2)} hint={`Across ${totalSemCredits} credits`} />
            <CalcStat label="Projected CGPA" value={animatedCGPA.toFixed(2)} hint={`Up from ${state.currentCGPA.toFixed(2)}`} tone={hitsTarget ? "good" : "warn"} />
            <CalcStat label="Target gap" value={(projectedCGPA - state.targetCGPA >= 0 ? "+" : "") + (projectedCGPA - state.targetCGPA).toFixed(2)} hint={hitsTarget ? "Above target" : "Below target"} tone={hitsTarget ? "good" : "warn"} />
          </div>
        </>
      )}
    </Card>
  );
}

function GradePicker({ value, onChange }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-md border border-neutral-200/80 dark:border-white/[0.08] bg-neutral-50 dark:bg-white/[0.03] p-0.5">
      {GRADES.map(g => {
        const active = g.letter === value;
        return (
          <button
            key={g.letter}
            onClick={() => onChange(g.letter)}
            className={`min-w-[28px] px-1.5 py-1 rounded-[5px] text-[11px] font-mono font-medium transition-colors ${
              active
                ? "bg-white text-neutral-900 shadow-sm dark:bg-white/[0.1] dark:text-white"
                : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            }`}
            title={`${g.letter} = ${g.points}`}
          >
            {g.letter}
          </button>
        );
      })}
    </div>
  );
}

function CalcStat({ label, value, hint, tone = "neutral" }) {
  const color = tone === "good" ? "text-emerald-600 dark:text-emerald-400" : tone === "warn" ? "text-amber-600 dark:text-amber-400" : "text-neutral-900 dark:text-neutral-50";
  return (
    <div className="rounded-md border border-neutral-200/80 dark:border-white/[0.06] bg-neutral-50/60 dark:bg-white/[0.02] px-3.5 py-3">
      <div className="text-[10.5px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-medium">{label}</div>
      <div className={`mt-1 text-[22px] font-semibold tabular-nums tracking-tight ${color}`}>{value}</div>
      <div className="text-[10.5px] text-neutral-400 dark:text-neutral-500">{hint}</div>
    </div>
  );
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, isNaN(n) ? min : n)); }

function NumField({ label, hint, value, onChange, min, max, step, decimals = 0 }) {
  const [raw, setRaw] = React.useState("");
  const [focused, setFocused] = React.useState(false);

  const display = decimals ? Number(value).toFixed(decimals) : String(value);

  const commit = (str) => {
    const n = parseFloat(str);
    if (!isNaN(n)) onChange(clamp(n, min, max));
  };

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11.5px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={focused ? raw : display}
        onFocus={() => { setRaw(display); setFocused(true); }}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={() => { commit(raw); setFocused(false); }}
        onKeyDown={(e) => { if (e.key === "Enter") { commit(raw); e.target.blur(); } }}
        className="h-9 w-full rounded-md border border-neutral-200/80 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] px-3 text-[13px] font-medium text-neutral-800 dark:text-neutral-200 tabular-nums outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 transition-shadow"
      />
      {hint && <span className="text-[10.5px] text-neutral-400 dark:text-neutral-500">{hint}</span>}
    </label>
  );
}

function CalculatorPage() {
  const [state, setState] = React.useState(DEFAULTS);
  const [courses, setCourses] = React.useState([]);

  React.useEffect(() => {
    API.dashboard.get().then(d => {
      const list = d?.currentSemester?.courses || [];
      setCourses(list);
      if (list.length > 0) {
        const semCredits = list.reduce((s, c) => s + (c.credits || 0), 0);
        setState(prev => ({ ...prev, currentSemCredits: semCredits || prev.currentSemCredits }));
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-7 lg:px-10 lg:py-9 page-fade">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[12px] text-neutral-500 dark:text-neutral-400">
            <Icon name="Calculator" size={12} />
            <span>Calculator</span>
          </div>
          <h1 className="mt-1.5 text-[24px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">CGPA & SGPA</h1>
          <p className="mt-1 text-[12.5px] text-neutral-500 dark:text-neutral-400">Figure out exactly what this semester needs to look like.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setState(DEFAULTS)}>
            <Icon name="RotateCcw" size={12} /> Reset
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <CalcSummaryStat icon="GraduationCap" label="Current CGPA"   value={state.currentCGPA.toFixed(2)} />
        <CalcSummaryStat icon="BookOpen"      label="Credits earned" value={`${state.creditsEarned}`} sub={`of ${state.totalProgramCredits}`} />
        <CalcSummaryStat icon="CalendarDays"  label="This semester"  value={`${state.currentSemCredits} cr`} sub={courses.length > 0 ? `${courses.length} courses` : "No courses yet"} />
        <CalcSummaryStat icon="Target"        label="Target CGPA"    value={state.targetCGPA.toFixed(2)} accent />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <RequiredSGPACard state={state} setState={setState} />
        <PlannerCard state={state} setState={setState} courses={courses} />
      </div>

      <Card className="mt-6 p-5 bg-neutral-50/60 dark:bg-white/[0.02]">
        <div className="flex items-start gap-3">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-[var(--accent)]/10 text-[var(--accent)] shrink-0">
            <Icon name="Info" size={14} />
          </div>
          <div className="text-[12px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
            <div className="font-semibold text-neutral-800 dark:text-neutral-200">How this works</div>
            <div className="mt-1 text-pretty">
              <span className="font-mono text-[11px] bg-neutral-100 dark:bg-white/[0.04] px-1.5 py-0.5 rounded">SGPA = Σ(credits × grade points) / Σ(credits)</span>{" "}
              for a single semester.{" "}
              <span className="font-mono text-[11px] bg-neutral-100 dark:bg-white/[0.04] px-1.5 py-0.5 rounded">CGPA = (CGPA_prev × credits_prev + SGPA × credits_this) / (credits_prev + credits_this)</span>{" "}
              for the running average. Grade points use the 10-point scale (O=10, A+=9, A=8, B+=7, B=6, C=5, P=4).
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function CalcSummaryStat({ icon, label, value, sub, accent }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        <Icon name={icon} size={11} />
        <span>{label}</span>
      </div>
      <div className={`mt-2 text-[24px] font-semibold tracking-tight tabular-nums ${accent ? "text-[var(--accent)]" : "text-neutral-900 dark:text-neutral-50"}`}>{value}</div>
      {sub && <div className="text-[11px] text-neutral-400 dark:text-neutral-500 tabular-nums">{sub}</div>}
    </Card>
  );
}

export default CalculatorPage;
