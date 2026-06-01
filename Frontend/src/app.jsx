// app.jsx — StudSpace shell (Sidebar, Topbar, App)

import React from 'react';
import API from './api';
import { Icon, Button, useLoaded, NAV, ACCENTS } from './lib';
import { useTweaks, TweaksPanel, TweakSection, TweakToggle, TweakColor, TweakRadio } from './tweaks-panel.jsx';
import Dashboard from './dashboard.jsx';
import SemesterPage from './semesters.jsx';
import AttendancePage from './attendance.jsx';
import CalculatorPage from './calculator.jsx';
import ProfilePage from './profile.jsx';

// ─────────────────────────────────────────────────────────────────────────────
// Error Boundary
// ─────────────────────────────────────────────────────────────────────────────

class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(err) {
    return { error: err };
  }
  componentDidCatch(err, info) {
    console.error("[StudSpace] Page render error:", err, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl text-rose-500" style={{ background: "rgba(244,63,94,0.08)" }}>
            <Icon name="AlertTriangle" size={20} />
          </div>
          <p className="text-[14px] font-medium" style={{ color: "var(--text-primary)" }}>
            This page crashed.
          </p>
          <p className="text-[12px] text-neutral-500 max-w-[320px]">{this.state.error.message}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="text-[12px] text-[var(--accent)] hover:underline"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────────────────────

function Sidebar({ active, onNav, collapsed, onToggle, user }) {
  const initials = user ? (user.fullName || user.username || "U")
    .split(" ").slice(0, 2).map(w => w[0].toUpperCase()).join("") : "…";
  const label = user ? `${user.fullName || user.username}'s workspace` : "Loading…";
  const sub = user ? [user.branch, user.college].filter(Boolean).join(" · ") : "";

  return (
    <aside
      className="hidden md:flex shrink-0 flex-col border-r transition-[width] duration-300 ease-out"
      style={{ width: collapsed ? 60 : 232, backgroundColor: "var(--sidebar-bg)", borderRightColor: "var(--sidebar-border-color)" }}
    >
      <div className="flex h-14 items-center gap-2 px-3.5">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-[var(--accent)] text-white shadow-sm">
          <Icon name="GraduationCap" size={15} strokeWidth={2.25} />
        </div>
        {!collapsed && (
          <div className="flex items-baseline gap-1.5 overflow-hidden">
            <span className="text-[13.5px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">StudSpace</span>
          </div>
        )}
      </div>

      {!collapsed && (
        <button className="mx-2.5 mb-2 flex items-center justify-between gap-2 rounded-md border border-neutral-200/80 dark:border-white/[0.06] bg-white dark:bg-white/[0.03] px-2 py-1.5 text-left hover:bg-neutral-50 dark:hover:bg-white/[0.05] transition-colors">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-5 w-5 shrink-0 rounded-full overflow-hidden grid place-items-center text-white text-[9px] font-semibold" style={{ background: user?.profilePhoto ? "none" : "linear-gradient(to bottom right, #404040, #171717)" }}>
              {user?.profilePhoto ? <img src={user.profilePhoto} alt="" className="h-full w-full object-cover" /> : initials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[12px] font-medium text-neutral-800 dark:text-neutral-100 leading-tight">{label}</div>
              {sub && <div className="truncate text-[10.5px] text-neutral-500">{sub}</div>}
            </div>
          </div>
          <Icon name="ChevronsUpDown" size={12} className="text-neutral-400" />
        </button>
      )}

      <nav className="mt-1 flex-1 px-2">
        <ul className="flex flex-col gap-0.5">
          {NAV.map((n) => {
            const isActive = active === n.id;
            const cls = `group flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[12.5px] font-medium transition-colors ${
              isActive
                ? "bg-neutral-200/70 text-neutral-900 dark:bg-white/[0.08] dark:text-white"
                : "text-neutral-600 hover:bg-neutral-200/40 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/[0.04] dark:hover:text-neutral-100"
            } ${collapsed ? "justify-center" : ""}`;
            const inner = (
              <>
                <Icon name={n.icon} size={15} strokeWidth={isActive ? 2 : 1.75} />
                {!collapsed && <span className="truncate flex-1 text-left">{n.label}</span>}
                {!collapsed && n.external && <Icon name="ArrowUpRight" size={11} className="text-neutral-400 dark:text-neutral-500" />}
              </>
            );
            return (
              <li key={n.id}>
                {n.external ? (
                  <a href={n.external} target="_blank" rel="noopener noreferrer" className={cls} title={collapsed ? n.label : undefined}>
                    {inner}
                  </a>
                ) : (
                  <button onClick={() => onNav(n.id)} className={cls} title={collapsed ? n.label : undefined}>
                    {inner}
                  </button>
                )}
              </li>
            );
          })}
        </ul>

      </nav>

      <div className="border-t border-neutral-200/70 dark:border-white/[0.06] p-2 flex flex-col gap-0.5">
        <a
          href="index.html"
          className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[12px] text-neutral-500 hover:bg-neutral-200/40 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/[0.04] dark:hover:text-neutral-100 transition-colors ${collapsed ? "justify-center" : ""}`}
          title={collapsed ? "Visit homepage" : undefined}
        >
          <Icon name="Home" size={14} />
          {!collapsed && <span className="flex-1">Visit homepage</span>}
          {!collapsed && <Icon name="ArrowUpRight" size={11} className="text-neutral-400" />}
        </a>
        <button
          onClick={() => { API.clearToken(); window.location.href = "signin.html"; }}
          className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[12px] text-rose-600 dark:text-rose-400 hover:bg-rose-50/70 dark:hover:bg-rose-500/[0.08] transition-colors ${collapsed ? "justify-center" : ""}`}
          title={collapsed ? "Sign out" : undefined}
        >
          <Icon name="LogOut" size={14} />
          {!collapsed && <span>Sign out</span>}
        </button>
        <button
          onClick={onToggle}
          className={`mt-0.5 flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[12px] text-neutral-500 hover:bg-neutral-200/40 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/[0.04] dark:hover:text-neutral-100 transition-colors ${collapsed ? "justify-center" : ""}`}
          title={collapsed ? "Expand" : "Collapse"}
        >
          <Icon name={collapsed ? "PanelLeftOpen" : "PanelLeftClose"} size={14} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Topbar
// ─────────────────────────────────────────────────────────────────────────────

const CRUMB = {
  dashboard:  { icon: "LayoutDashboard", label: "Dashboard" },
  semesters:  { icon: "BookOpen",        label: "Semesters" },
  attendance: { icon: "CalendarCheck2",  label: "Attendance" },
  calculator: { icon: "Calculator",      label: "Calculator" },
  profile:    { icon: "User",            label: "Profile" },
};

function Topbar({ active, dark, onDark, onNav, user }) {
  const crumb = CRUMB[active] || CRUMB.dashboard;
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef(null);
  const initials = user ? (user.fullName || user.username || "U")
    .split(" ").slice(0, 2).map(w => w[0].toUpperCase()).join("") : "…";

  React.useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onClick); document.removeEventListener("keydown", onKey); };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b px-5 backdrop-blur-md" style={{ backgroundColor: "var(--topbar-bg)", borderBottomColor: "var(--topbar-border-color)" }}>
      <div className="flex items-center gap-2 text-[12.5px] text-neutral-500 dark:text-neutral-400">
        <Icon name={crumb.icon} size={13} />
        <span>{crumb.label}</span>
        {user && active === "profile" && <>
          <span className="text-neutral-300 dark:text-neutral-700">/</span>
          <span className="text-neutral-700 dark:text-neutral-200 font-medium">@{user.username}</span>
        </>}
      </div>
      <div className="flex items-center gap-1.5">
        <IconBtn name={dark ? "Sun" : "Moon"} onClick={() => onDark(!dark)} />

        <div className="relative ml-1" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className={`grid h-7 w-7 place-items-center rounded-full overflow-hidden text-[10.5px] font-semibold text-white shadow-sm ring-1 ring-white/20 transition-shadow ${menuOpen ? "ring-2 ring-[var(--accent)]/40" : ""} ${user?.profilePhoto ? "" : "bg-gradient-to-br from-indigo-500 to-violet-600"}`}
          >
            {user?.profilePhoto ? <img src={user.profilePhoto} alt="" className="h-full w-full object-cover" /> : initials}
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 rounded-lg border border-neutral-200/80 dark:border-white/[0.08] bg-white dark:bg-neutral-950 shadow-2xl shadow-neutral-900/[0.12] dark:shadow-black/50 overflow-hidden">
              <div className="px-3.5 py-3 border-b border-neutral-200/70 dark:border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className={`grid h-9 w-9 place-items-center rounded-full overflow-hidden text-[12px] font-semibold text-white shadow-sm ${user?.profilePhoto ? "" : "bg-gradient-to-br from-indigo-500 to-violet-600"}`}>
                    {user?.profilePhoto ? <img src={user.profilePhoto} alt="" className="h-full w-full object-cover" /> : initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 truncate">{user?.fullName || "…"}</div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono truncate">@{user?.username || "…"}</div>
                  </div>
                </div>
              </div>
              <div className="p-1">
                <MenuItem icon="User" label="View profile" onClick={() => { setMenuOpen(false); onNav("profile"); }} />
              </div>
              <div className="border-t border-neutral-200/70 dark:border-white/[0.06] p-1">
                <MenuItem icon="Home" label="Visit homepage" external href="index.html" />
              </div>
              <div className="border-t border-neutral-200/70 dark:border-white/[0.06] p-1">
                <MenuItem icon="LogOut" label="Sign out" onClick={() => { API.clearToken(); window.location.href = "signin.html"; }} danger />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuItem({ icon, label, shortcut, onClick, href, external, danger }) {
  const cls = `group flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[12.5px] transition-colors ${
    danger
      ? "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/[0.08]"
      : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-neutral-100"
  }`;
  const inner = (
    <>
      <Icon name={icon} size={13} className={danger ? "text-rose-500" : "text-neutral-500 group-hover:text-neutral-800 dark:group-hover:text-neutral-200"} />
      <span className="flex-1 text-left font-medium">{label}</span>
      {shortcut && <kbd className="rounded border border-neutral-200 dark:border-white/[0.08] bg-neutral-50 dark:bg-white/[0.03] px-1 text-[9.5px] font-mono text-neutral-500">{shortcut}</kbd>}
      {external && <Icon name="ArrowUpRight" size={10} className="text-neutral-400" />}
    </>
  );
  if (href) return <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className={cls}>{inner}</a>;
  return <button onClick={onClick} className={cls}>{inner}</button>;
}

function IconBtn({ name, onClick }) {
  return (
    <button
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/[0.06] dark:hover:text-neutral-100 transition-colors"
    >
      <Icon name={name} size={14} />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile bottom nav (visible only below md breakpoint)
// ─────────────────────────────────────────────────────────────────────────────

function MobileBottomNav({ active, onNav }) {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 flex border-t safe-area-inset-bottom"
      style={{ backgroundColor: "var(--topbar-bg)", borderTopColor: "var(--topbar-border-color)" }}
    >
      {NAV.map(n => {
        const isActive = active === n.id;
        return (
          <button
            key={n.id}
            onClick={() => onNav(n.id)}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
              isActive ? "text-[var(--accent)]" : "text-neutral-400 dark:text-neutral-500"
            }`}
          >
            <Icon name={n.icon} size={19} strokeWidth={isActive ? 2.25 : 1.75} />
            <span>{n.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────────────────────

const TWEAK_DEFAULTS = {
  accent: localStorage.getItem("ss-accent-key") || "indigo",
  dark: localStorage.getItem("ss-theme") === "dark",
  sidebarCollapsed: localStorage.getItem("ss-sidebar") === "1",
};

const VALID_TABS = ["dashboard", "semesters", "attendance", "calculator", "profile"];

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [active, setActive] = React.useState(() => {
    const hash = window.location.hash.slice(1);
    return VALID_TABS.includes(hash) ? hash : "dashboard";
  });
  const [collapsed, setCollapsed] = React.useState(TWEAK_DEFAULTS.sidebarCollapsed);
  const [user, setUser] = React.useState(API.getCachedUser());
  const [courses, setCourses] = React.useState([]);
  const loaded = useLoaded(750);

  React.useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", t.dark);
  }, [t.dark]);

  React.useEffect(() => {
    localStorage.setItem("ss-theme", t.dark ? "dark" : "light");
  }, [t.dark]);

  React.useEffect(() => {
    document.documentElement.style.setProperty("--accent", ACCENTS[t.accent] || ACCENTS.indigo);
    localStorage.setItem("ss-accent", ACCENTS[t.accent] || ACCENTS.indigo);
    localStorage.setItem("ss-accent-key", t.accent);
  }, [t.accent]);

  React.useEffect(() => {
    API.user.me().then(u => {
      setUser(u);
      API.cacheUser(u);
    }).catch(() => {
      API.clearToken();
      window.location.href = "signin.html";
    });
  }, []);

  React.useEffect(() => {
    API.dashboard.get().then(d => {
      if (d && d.currentSemester) setCourses(d.currentSemester.courses || []);
    }).catch(() => {});
  }, []);

  React.useEffect(() => {
    const onHash = () => {
      const tab = window.location.hash.slice(1);
      if (VALID_TABS.includes(tab)) setActive(tab);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const goto = (id) => {
    setActive(id);
    window.location.hash = id;
  };

  return (
    <div className="flex h-screen w-screen antialiased" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif", backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}>
      <Sidebar active={active} onNav={goto} collapsed={collapsed} onToggle={() => setCollapsed(v => { const next = !v; localStorage.setItem("ss-sidebar", next ? "1" : ""); return next; })} user={user} />

      <div className="flex min-w-0 flex-1 flex-col" style={{ backgroundColor: "var(--content-bg)" }}>
        <Topbar active={active} dark={t.dark} onDark={(v) => setTweak("dark", v)} onNav={goto} user={user} />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <PageErrorBoundary key={active}>
            {active === "dashboard"  && <Dashboard loaded={loaded} onNav={goto} user={user} />}
            {active === "semesters"  && <SemesterPage />}
            {active === "attendance" && <AttendancePage />}
            {active === "calculator" && <CalculatorPage />}
            {active === "profile"    && <ProfilePage user={user} onUserUpdate={setUser} />}
          </PageErrorBoundary>
        </main>
      </div>

      <MobileBottomNav active={active} onNav={goto} />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Appearance" />
        <TweakToggle label="Dark mode" value={t.dark} onChange={(v) => setTweak("dark", v)} />
        <TweakColor
          label="Accent"
          value={ACCENTS[t.accent]}
          options={Object.values(ACCENTS)}
          onChange={(hex) => {
            const key = Object.keys(ACCENTS).find(k => ACCENTS[k] === hex) || "indigo";
            setTweak("accent", key);
          }}
        />
        <TweakSection label="Layout" />
        <TweakToggle label="Collapse sidebar" value={collapsed} onChange={(v) => { setCollapsed(v); setTweak("sidebarCollapsed", v); }} />
        <TweakSection label="Navigation" />
        <TweakRadio
          label="Jump to"
          value={active}
          options={["dashboard", "semesters", "attendance", "calculator", "profile"]}
          onChange={(v) => setActive(v)}
        />
      </TweaksPanel>
    </div>
  );
}

export default App;
