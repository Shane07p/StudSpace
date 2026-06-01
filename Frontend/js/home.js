// home.js — interactive behaviors for StudSpace landing
// - scroll-reveal (with stagger)
// - animated counters on scroll
// - theme toggle (light/dark, system default)
// - "try-it" mini resource adder
// - "build your StudSpace" 3-step onboarding wizard

(() => {
  const root = document.documentElement;

  // ─── Theme ────────────────────────────────────────────────────────────────
  const storedTheme = localStorage.getItem("ss-theme");
  if (storedTheme === "dark" || (!storedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    root.classList.add("dark");
  }
  document.getElementById("theme-toggle")?.addEventListener("click", () => {
    root.classList.toggle("dark");
    const isDark = root.classList.contains("dark");
    localStorage.setItem("ss-theme", isDark ? "dark" : "light");
    const icon = document.querySelector("#theme-toggle [data-lucide]");
    icon?.setAttribute("data-lucide", isDark ? "sun" : "moon");
    if (window.lucide) window.lucide.createIcons();
  });
  if (root.classList.contains("dark")) {
    document.querySelector("#theme-toggle [data-lucide]")?.setAttribute("data-lucide", "sun");
  }

  // ─── Footer: no dynamic columns needed ───────────────────────────────────

  // ─── Scroll reveal ────────────────────────────────────────────────────────
  const reveal = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          reveal.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  document.querySelectorAll("[data-reveal], [data-reveal-stagger]").forEach((el) => reveal.observe(el));

  // ─── Animated counters (count up when in view) ────────────────────────────
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const duration = parseInt(el.dataset.duration || "1100", 10);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const suffix = el.dataset.suffix || "";
    const prefix = el.dataset.prefix || "";
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const v = target * easeOut(p);
      el.textContent = prefix + (decimals === 0 ? Math.round(v).toLocaleString() : v.toFixed(decimals)) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const counterObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          animateCount(e.target);
          counterObs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.4 }
  );
  document.querySelectorAll("[data-count]").forEach((el) => counterObs.observe(el));

  // ─── Try-it-now resource adder ────────────────────────────────────────────
  const TRY = {
    types: [
      { id: "PYQ",      cls: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300", icon: "file-text" },
      { id: "Playlist", cls: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",        icon: "play-square" },
      { id: "Notes",    cls: "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",    icon: "notebook-pen" },
      { id: "Link",     cls: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",            icon: "link" },
      { id: "Other",    cls: "bg-neutral-100 text-neutral-700 dark:bg-white/[0.06] dark:text-neutral-300", icon: "paperclip" },
    ],
    selected: "PYQ",
    placeholders: {
      PYQ: "e.g. OS Mid-sem 2023 — solved",
      Playlist: "e.g. Gate Smashers — DBMS Normalization",
      Notes: "e.g. Memory paging cheatsheet",
      Link: "e.g. OSTEP free PDF",
      Other: "e.g. Class recording — Apr 10",
    },
    list: [
      { type: "PYQ",   title: "OS Mid-sem 2023 — solved",       when: "2h ago" },
      { type: "Notes", title: "Deadlock handling — handwritten", when: "Yesterday" },
    ],
  };

  const tryRoot = document.getElementById("try-it");
  if (tryRoot) {
    const typeRow = tryRoot.querySelector(".try-types");
    const input = tryRoot.querySelector(".try-input");
    const addBtn = tryRoot.querySelector(".try-add");
    const listEl = tryRoot.querySelector(".try-list");
    const counterEl = tryRoot.querySelector(".try-count");

    // Build type pills
    typeRow.innerHTML = TRY.types
      .map(
        (t) =>
          `<button class="try-type rounded-md border px-2 py-1 text-[12px] font-medium transition-all" data-id="${t.id}">${t.id}</button>`
      )
      .join("");
    const refreshTypePills = () => {
      typeRow.querySelectorAll(".try-type").forEach((b) => {
        const t = TRY.types.find((x) => x.id === b.dataset.id);
        const active = b.dataset.id === TRY.selected;
        b.className =
          "try-type rounded-md border px-2 py-1 text-[12px] font-medium transition-all " +
          (active
            ? `${t.cls} border-transparent shadow-sm scale-105`
            : "border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-400 dark:hover:bg-white/[0.06]");
      });
      input.placeholder = TRY.placeholders[TRY.selected];
    };
    typeRow.addEventListener("click", (e) => {
      const b = e.target.closest(".try-type");
      if (!b) return;
      TRY.selected = b.dataset.id;
      refreshTypePills();
      input.focus();
    });
    refreshTypePills();

    const render = () => {
      listEl.innerHTML = TRY.list
        .map((r, i) => {
          const t = TRY.types.find((x) => x.id === r.type);
          return `<div class="try-row slide-in flex items-center gap-3 rounded-md px-2.5 py-2 hover:bg-neutral-50 dark:hover:bg-white/[0.03] transition-colors" style="animation-delay:${
            i === 0 && r._isNew ? "0ms" : "0ms"
          }">
            <span class="grid h-7 w-7 place-items-center rounded-md bg-neutral-100 dark:bg-white/[0.05] text-neutral-600 dark:text-neutral-300">
              <i data-lucide="${t.icon}" class="w-[13px] h-[13px]"></i>
            </span>
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <span class="rounded-md ${t.cls} px-1.5 py-0.5 text-[10.5px] font-medium">${r.type}</span>
              <span class="truncate text-[12.5px] font-medium text-neutral-800 dark:text-neutral-100">${r.title}</span>
            </div>
            <span class="text-[11px] text-neutral-400 tabular-nums shrink-0">${r.when}</span>
          </div>`;
        })
        .join("");
      counterEl.textContent = TRY.list.length;
      if (window.lucide) window.lucide.createIcons();
      // clear slide-in flag after the animation
      TRY.list.forEach((r) => delete r._isNew);
    };

    const addItem = () => {
      const v = input.value.trim();
      if (!v) {
        input.classList.add("ring-2", "ring-rose-300");
        setTimeout(() => input.classList.remove("ring-2", "ring-rose-300"), 600);
        return;
      }
      TRY.list = [{ type: TRY.selected, title: v, when: "Just now", _isNew: true }, ...TRY.list].slice(0, 6);
      input.value = "";
      render();
    };
    addBtn.addEventListener("click", addItem);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") addItem(); });
    render();
  }

  // ─── Onboarding wizard ────────────────────────────────────────────────────
  const WIZ = {
    step: 0,
    answers: { degree: null, semester: 4, situation: null },
    degrees: [
      { id: "btech_cse",  label: "B.Tech CSE",     icon: "cpu",          courses: [
        { code: "CS3401", name: "Operating Systems",     attendance: 88 },
        { code: "CS3402", name: "Database Systems",      attendance: 91 },
        { code: "CS3403", name: "Computer Networks",     attendance: 74 },
        { code: "MA3401", name: "Discrete Mathematics",  attendance: 95 },
      ]},
      { id: "btech_ece",  label: "B.Tech ECE",     icon: "radio",        courses: [
        { code: "EC3401", name: "Signals & Systems",     attendance: 82 },
        { code: "EC3402", name: "Digital Electronics",   attendance: 90 },
        { code: "EC3403", name: "VLSI Design",           attendance: 76 },
        { code: "MA3401", name: "Engineering Maths III", attendance: 88 },
      ]},
      { id: "btech_mech", label: "B.Tech Mech",    icon: "settings-2",   courses: [
        { code: "ME3401", name: "Thermodynamics",        attendance: 84 },
        { code: "ME3402", name: "Fluid Mechanics",       attendance: 79 },
        { code: "ME3403", name: "Theory of Machines",    attendance: 86 },
        { code: "MA3401", name: "Engineering Maths III", attendance: 90 },
      ]},
      { id: "bba",        label: "BBA",            icon: "briefcase",    courses: [
        { code: "MG3401", name: "Marketing Management",  attendance: 86 },
        { code: "MG3402", name: "Financial Accounting",  attendance: 91 },
        { code: "MG3403", name: "Business Statistics",   attendance: 73 },
        { code: "MG3404", name: "Organizational Behavior", attendance: 89 },
      ]},
      { id: "mbbs",       label: "MBBS",           icon: "stethoscope",  courses: [
        { code: "MB201",  name: "Pharmacology I",        attendance: 92 },
        { code: "MB202",  name: "Pathology I",           attendance: 88 },
        { code: "MB203",  name: "Microbiology",          attendance: 80 },
        { code: "MB204",  name: "Forensic Medicine",     attendance: 76 },
      ]},
      { id: "law",        label: "Law",            icon: "scale",        courses: [
        { code: "LW301",  name: "Constitutional Law",    attendance: 87 },
        { code: "LW302",  name: "Contract Law",          attendance: 84 },
        { code: "LW303",  name: "Criminal Law",          attendance: 78 },
        { code: "LW304",  name: "Jurisprudence",         attendance: 90 },
      ]},
    ],
    situations: [
      { id: "safe",      label: "I'm safe",       sub: "≥ 80%",            attendanceAdjust:  0, color: "emerald" },
      { id: "edge",      label: "On the edge",    sub: "75 – 80%",         attendanceAdjust: -6, color: "amber" },
      { id: "below",     label: "Below 75%",      sub: "Need to claw back", attendanceAdjust: -14, color: "rose" },
    ],
  };

  const wizRoot = document.getElementById("wizard");
  if (wizRoot) {
    const stepsWrap = wizRoot.querySelector(".wiz-steps");
    const progressDots = wizRoot.querySelector(".wiz-dots");
    const preview = wizRoot.querySelector(".wiz-preview");
    const stepLabels = ["Your degree", "Your semester", "Your attendance"];

    const renderProgress = () => {
      progressDots.innerHTML = stepLabels
        .map((l, i) => {
          const done = i < WIZ.step;
          const active = i === WIZ.step;
          return `<div class="flex items-center gap-2">
            <span class="grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold transition-colors ${
              done
                ? "bg-[var(--accent)] text-white"
                : active
                ? "bg-[var(--accent)]/15 text-[var(--accent)] ring-1 ring-[var(--accent)]/40"
                : "bg-neutral-200 text-neutral-500 dark:bg-white/[0.06] dark:text-neutral-400"
            }">${done ? "✓" : i + 1}</span>
            <span class="text-[12px] font-medium ${active || done ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-400"}">${l}</span>
          </div>`;
        })
        .join('<span class="hidden sm:block h-px w-6 bg-neutral-200 dark:bg-white/[0.06]"></span>');
    };

    const renderStep = () => {
      renderProgress();
      let html = "";
      if (WIZ.step === 0) {
        html = `<div class="wiz-step">
          <h3 class="text-[20px] font-semibold tracking-tight">What are you studying?</h3>
          <p class="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">We'll set up courses that look like yours.</p>
          <div class="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-2">
            ${WIZ.degrees
              .map(
                (d) => `<button class="wiz-degree group flex items-center gap-2.5 rounded-md border px-3 py-2.5 text-left transition-all ${
                  WIZ.answers.degree === d.id
                    ? "border-[var(--accent)] bg-[var(--accent)]/8 text-neutral-900 dark:text-neutral-50"
                    : "border-neutral-200 dark:border-white/[0.08] hover:border-neutral-300 dark:hover:border-white/15 hover:bg-neutral-50 dark:hover:bg-white/[0.03]"
                }" data-id="${d.id}">
                  <span class="grid h-7 w-7 place-items-center rounded-md ${
                    WIZ.answers.degree === d.id
                      ? "bg-[var(--accent)] text-white"
                      : "bg-neutral-100 dark:bg-white/[0.05] text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300"
                  } transition-colors">
                    <i data-lucide="${d.icon}" class="w-[14px] h-[14px]"></i>
                  </span>
                  <span class="text-[13px] font-medium">${d.label}</span>
                </button>`
              )
              .join("")}
          </div>
        </div>`;
      } else if (WIZ.step === 1) {
        const sem = WIZ.answers.semester;
        html = `<div class="wiz-step">
          <h3 class="text-[20px] font-semibold tracking-tight">Which semester are you in?</h3>
          <p class="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">Skip if you're between semesters.</p>
          <div class="mt-7 flex items-baseline gap-2">
            <span class="text-[48px] font-semibold tracking-tight tabular-nums leading-none">${sem}</span>
            <span class="text-[14px] text-neutral-500">of 8</span>
          </div>
          <input type="range" min="1" max="8" step="1" value="${sem}" class="wiz-sem mt-4 w-full appearance-none h-1.5 rounded-full bg-neutral-200 dark:bg-white/[0.08] outline-none" />
          <div class="mt-2 flex justify-between text-[10.5px] text-neutral-400 font-mono">
            ${Array.from({ length: 8 }).map((_, i) => `<span>S${i + 1}</span>`).join("")}
          </div>
        </div>`;
      } else if (WIZ.step === 2) {
        html = `<div class="wiz-step">
          <h3 class="text-[20px] font-semibold tracking-tight">How's your attendance looking?</h3>
          <p class="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">Honestly. We won't judge.</p>
          <div class="mt-6 flex flex-col gap-2">
            ${WIZ.situations
              .map((s) => {
                const active = WIZ.answers.situation === s.id;
                const dot = { emerald: "bg-emerald-500", amber: "bg-amber-500", rose: "bg-rose-500" }[s.color];
                return `<button class="wiz-sit flex items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-all ${
                  active
                    ? "border-[var(--accent)] bg-[var(--accent)]/8"
                    : "border-neutral-200 dark:border-white/[0.08] hover:border-neutral-300 dark:hover:border-white/15 hover:bg-neutral-50 dark:hover:bg-white/[0.03]"
                }" data-id="${s.id}">
                  <span class="h-2 w-2 rounded-full ${dot}"></span>
                  <div class="flex-1">
                    <div class="text-[13px] font-medium text-neutral-900 dark:text-neutral-50">${s.label}</div>
                    <div class="text-[11px] text-neutral-500 dark:text-neutral-400">${s.sub}</div>
                  </div>
                  ${active ? `<i data-lucide="check" class="w-3.5 h-3.5 text-[var(--accent)]" data-stroke-width="3"></i>` : ""}
                </button>`;
              })
              .join("")}
          </div>
        </div>`;
      }

      // Footer nav
      const showPrev = WIZ.step > 0;
      const canNext =
        (WIZ.step === 0 && WIZ.answers.degree) ||
        WIZ.step === 1 ||
        (WIZ.step === 2 && WIZ.answers.situation);
      const nextLabel = WIZ.step === 2 ? "Show my workspace" : "Continue";
      html += `<div class="mt-7 flex items-center justify-between gap-3">
        <button class="wiz-prev text-[12.5px] font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors ${
          showPrev ? "" : "invisible"
        }">← Back</button>
        <button class="wiz-next inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[13px] font-medium transition-all shadow-sm ${
          canNext
            ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100"
            : "bg-neutral-100 dark:bg-white/[0.04] text-neutral-400 cursor-not-allowed"
        }" ${canNext ? "" : "disabled"}>
          ${nextLabel} <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
        </button>
      </div>`;

      stepsWrap.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();

      // wire interactions
      stepsWrap.querySelectorAll(".wiz-degree").forEach((b) => {
        b.addEventListener("click", () => {
          WIZ.answers.degree = b.dataset.id;
          renderStep();
        });
      });
      const semSlider = stepsWrap.querySelector(".wiz-sem");
      if (semSlider) {
        semSlider.addEventListener("input", (e) => {
          WIZ.answers.semester = parseInt(e.target.value, 10);
          // update only the number — no full re-render to avoid losing focus
          const num = stepsWrap.querySelector(".wiz-step .tabular-nums");
          if (num) num.textContent = WIZ.answers.semester;
        });
      }
      stepsWrap.querySelectorAll(".wiz-sit").forEach((b) => {
        b.addEventListener("click", () => {
          WIZ.answers.situation = b.dataset.id;
          renderStep();
        });
      });
      stepsWrap.querySelector(".wiz-prev")?.addEventListener("click", () => {
        if (WIZ.step > 0) { WIZ.step--; renderStep(); }
      });
      stepsWrap.querySelector(".wiz-next")?.addEventListener("click", () => {
        if (!stepsWrap.querySelector(".wiz-next").disabled) {
          if (WIZ.step < 2) { WIZ.step++; renderStep(); }
          else { renderPreview(); }
        }
      });
    };

    const renderPreview = () => {
      const deg = WIZ.degrees.find((d) => d.id === WIZ.answers.degree);
      const sit = WIZ.situations.find((s) => s.id === WIZ.answers.situation);
      const adj = sit.attendanceAdjust;
      const courses = deg.courses.map((c) => ({ ...c, attendance: Math.max(40, Math.min(100, c.attendance + adj)) }));
      const avg = Math.round(courses.reduce((s, c) => s + c.attendance, 0) / courses.length);
      const above = avg >= 75;
      const sitColor = { emerald: ["#10b981", "emerald"], amber: ["#f59e0b", "amber"], rose: ["#f43f5e", "rose"] }[sit.color];

      stepsWrap.innerHTML = `<div class="wiz-step">
        <div class="flex items-center gap-2 text-[11.5px] font-medium uppercase tracking-wider text-[var(--accent)]">
          <i data-lucide="sparkles" class="w-3 h-3"></i> Your personalized workspace
        </div>
        <h3 class="mt-2 text-[20px] font-semibold tracking-tight">Here's how it would look, ${deg.label} sem ${WIZ.answers.semester}.</h3>
        <p class="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">All editable in seconds once you're in. Add real courses, drop in resources, mark attendance — that's it.</p>

        <div class="mt-5 rounded-lg border border-neutral-200/80 dark:border-white/[0.06] bg-white dark:bg-neutral-950 p-4">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-[13px] font-semibold tracking-tight">Good morning 👋</div>
              <div class="text-[11px] text-neutral-500 dark:text-neutral-400">${deg.label} · Semester ${WIZ.answers.semester} · ${courses.length} courses</div>
            </div>
            <div class="flex items-center gap-1.5 rounded-md px-2 py-1 ${above ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-amber-50 dark:bg-amber-500/10"}">
              <i data-lucide="${above ? "shield-check" : "alert-triangle"}" class="w-3 h-3 ${above ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}"></i>
              <span class="text-[11px] font-semibold ${above ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}">${avg}% avg</span>
            </div>
          </div>
          <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            ${courses
              .map((c) => {
                const low = c.attendance < 75;
                return `<div class="rounded-md border border-neutral-200/80 dark:border-white/[0.06] p-2.5">
                  <div class="flex items-center justify-between">
                    <span class="font-mono text-[9.5px] text-neutral-400">${c.code}</span>
                    ${low ? `<span class="rounded-sm bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 px-1 py-px text-[8.5px] font-medium">Low</span>` : ""}
                  </div>
                  <div class="mt-0.5 text-[12px] font-semibold tracking-tight truncate">${c.name}</div>
                  <div class="mt-2 flex items-center gap-2">
                    <div class="flex-1 h-[3px] rounded-full bg-neutral-100 dark:bg-white/[0.06]">
                      <div class="h-full rounded-full ${low ? "bg-amber-500" : "bg-[var(--accent)]"}" style="width:${c.attendance}%"></div>
                    </div>
                    <span class="text-[11px] font-semibold tabular-nums ${low ? "text-amber-600 dark:text-amber-400" : "text-neutral-700 dark:text-neutral-300"}">${c.attendance}%</span>
                  </div>
                </div>`;
              })
              .join("")}
          </div>
        </div>

        <div class="mt-5 flex flex-col sm:flex-row gap-2">
          <a href="signin.html" class="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[13px] font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-sm">
            Create my workspace <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
          </a>
          <button class="wiz-restart inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-md border border-neutral-200/80 dark:border-white/[0.08] text-[13px] font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-white/[0.06] transition-colors">
            <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i> Start over
          </button>
        </div>
      </div>`;

      if (window.lucide) window.lucide.createIcons();
      stepsWrap.querySelector(".wiz-restart")?.addEventListener("click", () => {
        WIZ.step = 0;
        WIZ.answers = { degree: null, semester: 4, situation: null };
        renderStep();
      });
    };

    renderStep();
  }

  // ─── Lucide init (run last so all dynamically-added icons hydrate) ────────
  if (window.lucide) window.lucide.createIcons();
})();
