// profile.jsx — Profile page (API-integrated)

import React from 'react';
import API from './api';
import { Icon, Card, Badge, Button, Tabs, Sheet, Skeleton, ErrorState, attTone } from './lib';

const INDIAN_COLLEGES = [
  // IITs
  "IIT Bombay","IIT Delhi","IIT Kanpur","IIT Kharagpur","IIT Madras","IIT Roorkee",
  "IIT Guwahati","IIT Hyderabad","IIT BHU Varanasi","IIT (ISM) Dhanbad","IIT Bhubaneswar",
  "IIT Gandhinagar","IIT Jodhpur","IIT Patna","IIT Ropar","IIT Indore","IIT Mandi",
  "IIT Tirupati","IIT Palakkad","IIT Dharwad","IIT Jammu","IIT Bhilai","IIT Goa",
  // NITs
  "NIT Trichy","NIT Warangal","NIT Surathkal","NIT Calicut","NIT Allahabad (MNNIT)",
  "NIT Rourkela","NIT Kurukshetra","NIT Jaipur (MNIT)","NIT Durgapur","NIT Nagpur (VNIT)",
  "NIT Bhopal (MANIT)","NIT Agartala","NIT Hamirpur","NIT Jalandhar","NIT Patna",
  "NIT Silchar","NIT Srinagar","NIT Surat (SVNIT)","NIT Goa","NIT Delhi","NIT Raipur",
  // IIITs
  "IIIT Hyderabad","IIIT Bangalore","IIIT Allahabad","IIIT Delhi","IIIT Pune",
  "IIIT Gwalior","IIIT Jabalpur","IIIT Kancheepuram","IIIT Lucknow","IIIT Ranchi",
  // Premier Institutes
  "IISc Bangalore","BITS Pilani","BITS Goa","BITS Hyderabad","DAIICT Gandhinagar",
  "Thapar University","IIEST Shibpur","ISI Kolkata",
  // Central / State Universities
  "Delhi University","JNU (Jawaharlal Nehru University)","BHU (Banaras Hindu University)",
  "AMU (Aligarh Muslim University)","University of Hyderabad","Jadavpur University",
  "Mumbai University","Savitribai Phule Pune University","Anna University",
  "Calcutta University","Osmania University","Kerala University","Mysore University",
  "Madras University","TISS","IGNOU",
  // Top Private
  "VIT Vellore","VIT Chennai","VIT-AP University","SRM Institute of Science and Technology",
  "Manipal Institute of Technology","Amity University","LPU (Lovely Professional University)",
  "Symbiosis International University","KIIT University","Chandigarh University",
  "SASTRA University","PSG College of Technology","SSN College of Engineering",
  "PES University","RV College of Engineering","MS Ramaiah Institute of Technology",
  "Christ University","Ashoka University","Shiv Nadar University","Krea University",
  "Plaksha University","Azim Premji University","Flame University",
  "O.P. Jindal Global University","Bennett University","Chitkara University",
  "Nirma University","College of Engineering Pune (COEP)","VJTI Mumbai",
  "Dwarkadas J. Sanghvi College of Engineering","K.J. Somaiya College of Engineering",
  "SPIT Mumbai","Sardar Patel Institute of Technology","Vellore Institute of Technology",
  "Sathyabama Institute of Science and Technology","Kumaraguru College of Technology",
  "Heritage Institute of Technology","Kalinga Institute (KIIT)","UPES Dehradun",
  "MSU Baroda","SRM University AP","Dayananda Sagar University","Ramaiah University",
  // IIMs & Management
  "IIM Ahmedabad","IIM Bangalore","IIM Calcutta","IIM Lucknow","IIM Kozhikode",
  "IIM Indore","XLRI Jamshedpur","SP Jain Institute","NMIMS Mumbai",
];

const ALL_COLLEGES = [...INDIAN_COLLEGES.sort(), "Other"];

function CollegeSelect({ value, onChange, inputCls }) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [custom, setCustom] = React.useState(() => !!value && !INDIAN_COLLEGES.includes(value));
  const ref = React.useRef(null);
  const searchRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  React.useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  const filtered = ALL_COLLEGES.filter(c =>
    !search || c.toLowerCase().includes(search.toLowerCase())
  );

  if (custom) {
    return (
      <div className="flex gap-2">
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Type your college name"
          autoFocus
          className={inputCls + " flex-1"}
        />
        <button
          type="button"
          onClick={() => { setCustom(false); onChange(""); }}
          title="Pick from list"
          className="h-9 px-2.5 rounded-md border border-neutral-200/80 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[11.5px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors shrink-0"
        >
          <Icon name="List" size={13} />
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`${inputCls} w-full flex items-center justify-between gap-2 text-left ${!value ? "text-neutral-400" : ""}`}
      >
        <span className="truncate">{value || "Select college…"}</span>
        <Icon name="ChevronDown" size={13} className={`shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-md border border-neutral-200/80 dark:border-white/[0.08] bg-white dark:bg-neutral-900 shadow-lg overflow-hidden">
          <div className="p-2 border-b border-neutral-100 dark:border-white/[0.06]">
            <div className="relative">
              <Icon name="Search" size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search colleges…"
                className="h-8 w-full rounded-md border border-neutral-200/80 dark:border-white/[0.08] bg-neutral-50 dark:bg-white/[0.03] pl-7 pr-2.5 text-[12px] text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-[12px] text-neutral-400">No colleges found</div>
            ) : filtered.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  if (c === "Other") { setCustom(true); onChange(""); }
                  else { onChange(c); }
                  setOpen(false);
                  setSearch("");
                }}
                className={`w-full text-left px-3 py-2 text-[12.5px] transition-colors ${
                  c === value
                    ? "bg-[var(--accent)]/10 text-[var(--accent)] font-medium"
                    : c === "Other"
                    ? "text-neutral-500 dark:text-neutral-400 italic hover:bg-neutral-50 dark:hover:bg-white/[0.04]"
                    : "text-neutral-800 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-white/[0.04]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BrandGlyph({ name, size = 14 }) {
  const s = size;
  if (name === "leetcode") return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <path d="M9.5 1.5 4 7l5.5 5.5L11 11l-4-4 4-4-1.5-1.5Z" fill="currentColor" />
      <rect x="6.5" y="7" width="6.5" height="1.6" rx="0.8" fill="currentColor" />
    </svg>
  );
  if (name === "codeforces") return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <rect x="1.5"  y="7"   width="3" height="7" rx="0.8" fill="currentColor" />
      <rect x="6.5"  y="3.5" width="3" height="10.5" rx="0.8" fill="currentColor" opacity="0.8" />
      <rect x="11.5" y="5.5" width="3" height="8.5" rx="0.8" fill="currentColor" opacity="0.6" />
    </svg>
  );
  if (name === "hackerrank") return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5 14 5v6L8 14.5 2 11V5L8 1.5Z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6.5 5v6M9.5 5v6M6.5 8h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
  if (name === "github") return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1C4.13 1 1 4.13 1 8c0 3.1 2 5.72 4.78 6.65.35.07.48-.15.48-.34 0-.17-.01-.62-.01-1.22-1.94.42-2.35-.94-2.35-.94-.32-.81-.78-1.02-.78-1.02-.64-.43.05-.42.05-.42.7.05 1.07.72 1.07.72.63 1.08 1.65.77 2.05.59.06-.46.25-.77.45-.95-1.56-.18-3.2-.78-3.2-3.47 0-.77.28-1.39.72-1.88-.07-.18-.31-.89.07-1.85 0 0 .59-.19 1.94.72.56-.16 1.17-.23 1.77-.23.6 0 1.21.08 1.77.23 1.35-.91 1.94-.72 1.94-.72.39.96.14 1.67.07 1.85.45.49.72 1.11.72 1.88 0 2.69-1.64 3.29-3.2 3.46.25.22.48.65.48 1.32 0 .95-.01 1.71-.01 1.95 0 .19.13.41.49.34A7 7 0 0 0 15 8c0-3.87-3.13-7-7-7Z" />
    </svg>
  );
  if (name === "linkedin") return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 2h12a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Zm2.2 4.4a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4ZM3 7v6h2.4V7H3Zm4 0v6h2.4V9.7c0-.7.4-1.2 1.1-1.2.6 0 1 .4 1 1.2V13H13V9.3c0-1.8-1-2.5-2.2-2.5-.9 0-1.4.5-1.7 1V7H7Z" />
    </svg>
  );
  return null;
}

const PLATFORM_CFG = [
  { id: "leetcode",   label: "LeetCode",   placeholder: "leetcode.com/u/…",           brand: "leetcode",   accent: "#FFA116" },
  { id: "codeforces", label: "Codeforces", placeholder: "codeforces.com/profile/…",   brand: "codeforces", accent: "#1F8FE0" },
  { id: "hackerrank", label: "HackerRank", placeholder: "hackerrank.com/profile/…",   brand: "hackerrank", accent: "#1BA94C" },
  { id: "github",     label: "GitHub",     placeholder: "github.com/…",               brand: "github",     accent: "#171717" },
  { id: "linkedin",   label: "LinkedIn",   placeholder: "linkedin.com/in/…",          brand: "linkedin",   accent: "#0A66C2" },
  { id: "resume",     label: "Resume",     placeholder: "drive.google.com/… or paste PDF link", icon: "FileText", accent: "#DC2626" },
  { id: "portfolio",  label: "Portfolio",  placeholder: "yoursite.com",               icon: "Globe",       accent: "#7C3AED" },
];

function HandleRow({ cfg, url, editing, draft, onChange, onStartEdit, onSave, onCancel }) {
  const IconNode = cfg.brand
    ? <span style={{ color: cfg.accent }}><BrandGlyph name={cfg.brand} size={15} /></span>
    : <Icon name={cfg.icon} size={15} className="text-neutral-500 dark:text-neutral-400" />;
  const empty = !url;

  return (
    <div className="group grid grid-cols-[28px_120px_1fr_auto] items-center gap-3 rounded-md px-2.5 py-2 hover:bg-neutral-50 dark:hover:bg-white/[0.03] transition-colors">
      <div className="grid h-7 w-7 place-items-center rounded-md bg-neutral-100 dark:bg-white/[0.05]">
        {IconNode}
      </div>
      <span className="text-[12.5px] font-medium text-neutral-800 dark:text-neutral-100">{cfg.label}</span>

      {editing ? (
        <input
          value={draft}
          onChange={(e) => onChange(e.target.value)}
          placeholder={cfg.placeholder}
          autoFocus
          className="h-8 flex-1 rounded-md border border-neutral-200/80 bg-white px-2.5 text-[12.5px] text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-200 transition-shadow"
        />
      ) : (
        <div className="min-w-0">
          {empty ? (
            <button
              onClick={onStartEdit}
              className="text-[12.5px] text-neutral-400 hover:text-[var(--accent)] inline-flex items-center gap-1.5 transition-colors"
            >
              <Icon name="Plus" size={11} /> Add {cfg.label.toLowerCase()}
            </button>
          ) : (
            <div className="truncate text-[12.5px] font-mono text-neutral-700 dark:text-neutral-200">{url}</div>
          )}
        </div>
      )}

      <div className="flex items-center gap-1">
        {editing ? (
          <>
            <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
            <Button size="sm" onClick={onSave}>Save</Button>
          </>
        ) : (
          <>
            {!empty && (
              <a
                href={url.startsWith("http") ? url : `https://${url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-7 w-7 place-items-center rounded-md text-neutral-400 opacity-0 group-hover:opacity-100 hover:bg-neutral-100 dark:hover:bg-white/[0.06] hover:text-neutral-700 dark:hover:text-neutral-200 transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <Icon name="ExternalLink" size={12} />
              </a>
            )}
            <button
              onClick={onStartEdit}
              className="grid h-7 w-7 place-items-center rounded-md text-neutral-400 opacity-0 group-hover:opacity-100 hover:bg-neutral-100 dark:hover:bg-white/[0.06] hover:text-neutral-700 dark:hover:text-neutral-200 transition-all"
            >
              <Icon name={empty ? "Plus" : "Pencil"} size={12} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function EditProfileSheet({ open, onClose, user, onSaved }) {
  const [form, setForm] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    if (open && user) {
      setForm({
        fullName:  user.fullName  || "",
        username:  user.username  || "",
        college:   user.college   || "",
        branch:    user.branch    || "",
        year:      user.year      || "",
        bio:       user.bio       || "",
      });
      setErr("");
    }
  }, [open, user]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const save = async () => {
    setSaving(true); setErr("");
    try {
      const updated = await API.user.update(form);
      onSaved?.(updated);
      onClose();
    } catch (e) {
      setErr(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "h-9 rounded-md border border-neutral-200/80 bg-white px-2.5 text-[12.5px] text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-200 transition-shadow";
  const field = (label, key, placeholder, opts = {}) => (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11.5px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{label}</span>
      <input value={form[key] || ""} onChange={set(key)} placeholder={placeholder} className={inputCls} {...opts} />
    </label>
  );

  return (
    <Sheet open={open} onClose={onClose} title="Edit profile">
      <div className="flex flex-col gap-4 p-5">
        {field("Full name", "fullName", "Your full name")}
        {field("Username", "username", "e.g. arjun.m")}
        <label className="flex flex-col gap-1.5">
          <span className="text-[11.5px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">College</span>
          <CollegeSelect
            value={form.college || ""}
            onChange={(v) => setForm((f) => ({ ...f, college: v }))}
            inputCls={inputCls}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          {field("Branch", "branch", "e.g. CSE")}
          {field("Year", "year", "e.g. 3")}
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11.5px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Bio</span>
          <textarea
            value={form.bio || ""}
            onChange={set("bio")}
            placeholder="A short bio about you…"
            rows={3}
            className="rounded-md border border-neutral-200/80 bg-white px-2.5 py-2 text-[12.5px] text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-200 transition-shadow resize-none"
          />
        </label>
        {err && <p className="text-[12px] text-rose-600 dark:text-rose-400">{err}</p>}
        <div className="flex items-center justify-end gap-2 border-t border-neutral-200/80 dark:border-white/[0.06] pt-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            <Icon name={saving ? "Loader2" : "Check"} size={13} strokeWidth={2.25} />
            {saving ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}



function ChangePasswordSheet({ open, onClose, hasPassword }) {
  const [form, setForm] = React.useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [ok, setOk] = React.useState(false);

  React.useEffect(() => {
    if (open) { setForm({ current: "", next: "", confirm: "" }); setErr(""); setOk(false); }
  }, [open]);

  const save = async () => {
    if (form.next.length < 8) { setErr("New password must be at least 8 characters"); return; }
    if (form.next !== form.confirm) { setErr("Passwords do not match"); return; }
    setSaving(true); setErr("");
    try {
      await API.user.changePassword(hasPassword ? form.current : null, form.next);
      setOk(true);
      setTimeout(onClose, 1200);
    } catch (e) {
      setErr(e.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "h-9 w-full rounded-md border border-neutral-200/80 bg-white px-2.5 text-[12.5px] text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-200 transition-shadow";

  return (
    <Sheet open={open} onClose={onClose} title={hasPassword ? "Change password" : "Set password"}>
      <div className="flex flex-col gap-4 p-5">
        {!hasPassword && (
          <p className="text-[12px] text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-white/[0.03] rounded-md px-3 py-2">
            You signed up with Google. Setting a password lets you also sign in with your email.
          </p>
        )}
        {hasPassword && (
          <label className="flex flex-col gap-1.5">
            <span className="text-[11.5px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Current password</span>
            <input type="password" value={form.current} onChange={e => setForm(f => ({ ...f, current: e.target.value }))} className={inputCls} />
          </label>
        )}
        <label className="flex flex-col gap-1.5">
          <span className="text-[11.5px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">New password</span>
          <input type="password" value={form.next} onChange={e => setForm(f => ({ ...f, next: e.target.value }))} placeholder="Min 8 characters" className={inputCls} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11.5px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Confirm new password</span>
          <input type="password" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} className={inputCls} />
        </label>
        {err && <p className="text-[12px] text-rose-600 dark:text-rose-400">{err}</p>}
        {ok && <p className="text-[12px] text-emerald-600 dark:text-emerald-400">Password updated successfully.</p>}
        <div className="flex items-center justify-end gap-2 border-t border-neutral-200/80 dark:border-white/[0.06] pt-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || ok}>
            <Icon name={saving ? "Loader2" : ok ? "Check" : "Lock"} size={13} strokeWidth={2.25} />
            {saving ? "Saving…" : ok ? "Done" : hasPassword ? "Update password" : "Set password"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

function CropModal({ open, src, outW, outH, viewW, viewH, circle, onCrop, onClose }) {
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const imgRef = React.useRef(null);
  const boxRef = React.useRef(null);
  const dragRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    setPos({ x: 0, y: 0 });
    setZoom(1);
  }, [open, src]);

  React.useEffect(() => {
    const el = boxRef.current;
    if (!el || !open) return;
    const handler = (e) => {
      e.preventDefault();
      const img = imgRef.current;
      const minZ = img ? Math.max(viewW / img.naturalWidth, viewH / img.naturalHeight) : 0.5;
      setZoom((z) => Math.max(minZ, Math.min(8, z * (e.deltaY < 0 ? 1.1 : 0.9))));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [open, viewW, viewH]);

  const onImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    setZoom(Math.max(viewW / img.naturalWidth, viewH / img.naturalHeight));
    setPos({ x: 0, y: 0 });
  };

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { sx: e.clientX, sy: e.clientY, px: pos.x, py: pos.y };
  };

  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    const { sx, sy, px, py } = dragRef.current;
    const img = imgRef.current;
    const hw = img ? Math.max(0, (img.naturalWidth * zoom - viewW) / 2) : 9999;
    const hh = img ? Math.max(0, (img.naturalHeight * zoom - viewH) / 2) : 9999;
    setPos({
      x: Math.max(-hw, Math.min(hw, px + (e.clientX - sx))),
      y: Math.max(-hh, Math.min(hh, py + (e.clientY - sy))),
    });
  };

  const onPointerUp = () => { dragRef.current = null; };

  const apply = () => {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const sx = img.naturalWidth / 2 - (viewW / 2 + pos.x) / zoom;
    const sy = img.naturalHeight / 2 - (viewH / 2 + pos.y) / zoom;
    canvas.getContext("2d").drawImage(img, sx, sy, viewW / zoom, viewH / zoom, 0, 0, outW, outH);
    onCrop(canvas.toDataURL("image/jpeg", 0.88));
  };

  if (!open || !src) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl border border-neutral-200/80 dark:border-white/[0.08] bg-white dark:bg-neutral-950 shadow-2xl p-5">
        <h3 className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-50">Adjust photo</h3>
        <p className="mt-0.5 text-[11.5px] text-neutral-500 dark:text-neutral-400">Drag to reposition · scroll to zoom</p>
        <div className="mt-4 flex justify-center">
          <div
            ref={boxRef}
            style={{
              width: viewW, height: viewH,
              borderRadius: circle ? "50%" : 8,
              cursor: "grab", position: "relative", overflow: "hidden",
              background: "#111", boxShadow: "0 0 0 3px var(--accent)",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <img
              ref={imgRef}
              src={src}
              onLoad={onImgLoad}
              draggable={false}
              style={{
                position: "absolute", left: "50%", top: "50%",
                transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) scale(${zoom})`,
                transformOrigin: "center", userSelect: "none", pointerEvents: "none", maxWidth: "none",
              }}
            />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={apply} className="flex-1">
            <Icon name="Check" size={13} strokeWidth={2.25} /> Apply
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProfilePage({ user: userProp }) {
  const [user, setUser] = React.useState(userProp || null);
  const [dashStats, setDashStats] = React.useState(null);
  const [tab, setTab] = React.useState("about");
  const [editProfileOpen, setEditProfileOpen] = React.useState(false);
  const [editingHandle, setEditingHandle] = React.useState(null);
  const [handleDraft, setHandleDraft] = React.useState("");
  const [savingHandles, setSavingHandles] = React.useState(false);
  const [handlesChanged, setHandlesChanged] = React.useState(false);
  const [userError, setUserError] = React.useState(false);
  const [handleMap, setHandleMap] = React.useState({});
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState("");
  const [deletingAccount, setDeletingAccount] = React.useState(false);
  const [changePwOpen, setChangePwOpen] = React.useState(false);
  const [cropState, setCropState] = React.useState(null);
  const photoInputRef = React.useRef(null);
  const coverInputRef = React.useRef(null);

  React.useEffect(() => {
    if (userProp) {
      setUser(userProp);
      const map = {};
      (userProp.handles || []).forEach((h) => { map[h.platform] = h.url; });
      setHandleMap(map);
    }
  }, [userProp]);

  const loadUser = React.useCallback(() => {
    setUserError(false);
    API.user.me().then((u) => {
      setUser(u);
      const map = {};
      (u.handles || []).forEach((h) => { map[h.platform] = h.url; });
      setHandleMap(map);
    }).catch(() => { setUserError(true); });
  }, []);

  React.useEffect(() => { loadUser(); }, []);

  React.useEffect(() => {
    API.dashboard.get().then((d) => setDashStats(d)).catch(() => {});
  }, []);

  const startEditHandle = (platformId) => {
    setHandleDraft(handleMap[platformId] || "");
    setEditingHandle(platformId);
  };

  const saveHandle = () => {
    setHandleMap((prev) => ({ ...prev, [editingHandle]: handleDraft.trim() }));
    setEditingHandle(null);
    setHandleDraft("");
    setHandlesChanged(true);
  };

  const cancelHandle = () => { setEditingHandle(null); setHandleDraft(""); };

  const uploadToCloudinary = async (dataUrl) => {
    const blob = await fetch(dataUrl).then(r => r.blob());
    const form = new FormData();
    form.append('file', blob, 'image.jpg');
    const res = await fetch('/api/upload/image', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + API.getToken() },
      body: form,
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Upload failed');
    return json.data.url;
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropState({
        src: ev.target.result,
        outW: 256, outH: 256, viewW: 240, viewH: 240, circle: true,
        onCrop: async (dataUrl) => {
          try {
            const url = await uploadToCloudinary(dataUrl);
            const updated = await API.user.updatePhoto(url);
            setUser(updated);
          } catch (err) { alert(err.message || "Failed to upload photo"); }
          setCropState(null);
        },
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropState({
        src: ev.target.result,
        outW: 1200, outH: 200, viewW: 336, viewH: 56, circle: false,
        onCrop: async (dataUrl) => {
          try {
            const url = await uploadToCloudinary(dataUrl);
            const updated = await API.user.updateCover(url);
            setUser(updated);
          } catch (err) { alert(err.message || "Failed to upload cover"); }
          setCropState(null);
        },
      });
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = async () => {
    try { const updated = await API.user.updatePhoto(null); setUser(updated); }
    catch (err) { alert(err.message || "Failed to remove photo"); }
  };

  const removeCover = async () => {
    try { const updated = await API.user.updateCover(null); setUser(updated); }
    catch (err) { alert(err.message || "Failed to remove cover"); }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user?.username) return;
    setDeletingAccount(true);
    try {
      await API.user.deleteAccount();
      API.clearToken();
      window.location.href = "signin.html";
    } catch (err) {
      alert(err.message || "Failed to delete account");
      setDeletingAccount(false);
    }
  };

  const saveHandles = async () => {
    setSavingHandles(true);
    try {
      const handles = PLATFORM_CFG
        .filter((cfg) => handleMap[cfg.id])
        .map((cfg, i) => ({ platform: cfg.id, url: handleMap[cfg.id], displayOrder: i }));
      await API.user.updateHandles(handles);
      setHandlesChanged(false);
    } catch (e) {
      alert(e.message || "Failed to save handles");
    } finally {
      setSavingHandles(false);
    }
  };

  const handleProfileSaved = (updated) => {
    setUser(updated);
    const map = {};
    (updated.handles || []).forEach((h) => { map[h.platform] = h.url; });
    setHandleMap(map);
  };

  if (userError && !user) return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-7 lg:px-10 lg:py-9">
      <ErrorState title="Failed to load profile" onRetry={loadUser} />
    </div>
  );

  const filledCount = PLATFORM_CFG.filter((cfg) => handleMap[cfg.id]).length;
  const firstName = user ? (user.fullName || user.username || "").split(" ")[0] : "…";
  const initials = user?.fullName
    ? user.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() || "?";

  const currentCourses = dashStats?.currentSemester?.courses || [];

  const TABS = [
    { id: "about",    label: "About",    icon: "User" },
    { id: "handles",  label: "Handles",  icon: "Link2",        badge: `${filledCount}/${PLATFORM_CFG.length}` },
    { id: "academic", label: "Academic", icon: "GraduationCap" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-7 lg:px-10 lg:py-9 page-fade">
      {/* Hidden file inputs */}
      <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />

      <div className="relative h-32 sm:h-40 overflow-hidden rounded-xl border border-neutral-200/80 dark:border-white/[0.06] bg-neutral-100 dark:bg-white/[0.03]">
        {user?.coverPhoto ? (
          <img src={user.coverPhoto} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <>
            <div className="absolute inset-0 opacity-90"
                 style={{ background: "radial-gradient(120% 80% at 100% 0%, color-mix(in oklch, var(--accent) 24%, transparent), transparent 50%), radial-gradient(80% 60% at 0% 100%, color-mix(in oklch, var(--accent) 16%, transparent), transparent 50%)" }} />
            <div className="absolute inset-0"
                 style={{ backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)", backgroundSize: "32px 32px", maskImage: "radial-gradient(80% 60% at 50% 0%, black, transparent)" }} />
          </>
        )}
        <div className="absolute right-3 top-3 flex items-center gap-1.5">
          {user?.coverPhoto && (
            <button onClick={removeCover} className="inline-flex items-center gap-1 rounded-md border border-neutral-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-neutral-900/60 backdrop-blur px-2 py-1 text-[11.5px] font-medium text-neutral-700 dark:text-neutral-200 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 transition-colors">
              <Icon name="X" size={11} /> Remove
            </button>
          )}
          <button onClick={() => coverInputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-neutral-900/60 backdrop-blur px-2 py-1 text-[11.5px] font-medium text-neutral-700 dark:text-neutral-200 hover:bg-white dark:hover:bg-neutral-900 transition-colors">
            <Icon name="ImagePlus" size={12} /> Change cover
          </button>
        </div>
      </div>

      <div className="-mt-6 sm:-mt-8 flex flex-col gap-4 px-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-end gap-4">
          <div className="relative">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full shadow-lg ring-4 ring-white dark:ring-neutral-950 overflow-hidden">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full grid place-items-center bg-gradient-to-br from-indigo-500 to-violet-600 text-[28px] sm:text-[32px] font-semibold text-white">
                  {initials}
                </div>
              )}
            </div>
            {user?.profilePhoto && (
              <button onClick={removePhoto} className="absolute -top-1 -left-1 grid h-6 w-6 place-items-center rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/15 shadow-sm text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                <Icon name="X" size={11} />
              </button>
            )}
            <button onClick={() => photoInputRef.current?.click()} className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/15 shadow-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors">
              <Icon name="Camera" size={12} />
            </button>
          </div>
          <div className="pb-1">
            {user ? (
              <>
                <h1 className="text-[22px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                  {user.fullName || user.username}
                  <span className="text-[var(--accent)]" title="Verified student"><Icon name="BadgeCheck" size={16} /></span>
                </h1>
                <p className="mt-0.5 text-[12.5px] text-neutral-500 dark:text-neutral-400 flex flex-wrap items-center gap-2">
                  <span className="font-mono">@{user.username}</span>
                  {user.branch && user.year && <><span className="text-neutral-300 dark:text-neutral-700">·</span><span className="inline-flex items-center gap-1"><Icon name="GraduationCap" size={11} /> {user.branch} · Year {user.year}</span></>}
                  {user.college && <><span className="text-neutral-300 dark:text-neutral-700">·</span><span className="inline-flex items-center gap-1"><Icon name="MapPin" size={11} /> {user.college}</span></>}
                </p>
              </>
            ) : (
              <>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="mt-1.5 h-4 w-56" />
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-end">
          <Button onClick={() => setEditProfileOpen(true)}><Icon name="Pencil" size={12} /> Edit profile</Button>
        </div>
      </div>

      <div className="mt-7 flex items-center justify-between border-b border-neutral-200/80 dark:border-white/[0.06]">
        <div className="flex items-center gap-1">
          {TABS.map((it) => {
            const active = tab === it.id;
            return (
              <button
                key={it.id}
                onClick={() => setTab(it.id)}
                className={`relative inline-flex items-center gap-1.5 px-3 py-2.5 text-[12.5px] font-medium transition-colors ${
                  active ? "text-neutral-900 dark:text-neutral-50" : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
                }`}
              >
                <Icon name={it.icon} size={12} />
                {it.label}
                {it.badge && (
                  <span className="rounded bg-neutral-100 dark:bg-white/[0.06] px-1 py-px text-[10px] font-mono text-neutral-500 dark:text-neutral-400">{it.badge}</span>
                )}
                {active && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-t bg-neutral-900 dark:bg-neutral-50" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-5 min-w-0">
          {(tab === "about" || tab === "handles") && (
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[14px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Handles & links</h2>
                  <p className="mt-0.5 text-[12px] text-neutral-500 dark:text-neutral-400">
                    Public links shown on your shared semester page.
                  </p>
                </div>
                <Badge>{filledCount}/{PLATFORM_CFG.length} added</Badge>
              </div>
              <div className="mt-4 -mx-1 flex flex-col gap-0.5">
                {PLATFORM_CFG.map((cfg) => (
                  <HandleRow
                    key={cfg.id}
                    cfg={cfg}
                    url={handleMap[cfg.id] || ""}
                    editing={editingHandle === cfg.id}
                    draft={handleDraft}
                    onChange={setHandleDraft}
                    onStartEdit={() => startEditHandle(cfg.id)}
                    onSave={saveHandle}
                    onCancel={cancelHandle}
                  />
                ))}
              </div>
              {handlesChanged && !editingHandle && (
                <div className="mt-4 flex items-center justify-between border-t border-neutral-200/60 dark:border-white/[0.06] pt-3">
                  <span className="text-[12px] text-neutral-500">Unsaved handle changes</span>
                  <Button onClick={saveHandles} disabled={savingHandles}>
                    <Icon name={savingHandles ? "Loader2" : "Save"} size={13} strokeWidth={2.25} />
                    {savingHandles ? "Saving…" : "Save all handles"}
                  </Button>
                </div>
              )}
            </Card>
          )}

          {tab === "about" && (
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[14px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">About</h2>
                <button onClick={() => setEditProfileOpen(true)} className="text-[11.5px] text-[var(--accent)] hover:underline">Edit</button>
              </div>
              {user?.bio ? (
                <p className="mt-3 text-[13.5px] leading-relaxed text-neutral-700 dark:text-neutral-300 text-pretty">{user.bio}</p>
              ) : (
                <p className="mt-3 text-[13px] text-neutral-400 italic">No bio added yet. <button onClick={() => setEditProfileOpen(true)} className="not-italic text-[var(--accent)] hover:underline">Add one →</button></p>
              )}
            </Card>
          )}

{tab === "academic" && (
            <Card className="p-5">
              <h2 className="text-[14px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Current semester</h2>
              {currentCourses.length === 0 ? (
                <div className="mt-4 text-[13px] text-neutral-400">No courses in current semester. Add them in the Semesters page.</div>
              ) : (
                <div className="mt-4 flex flex-col">
                  {currentCourses.map((c, i) => (
                    <div key={c.id} className={`grid grid-cols-[80px_1fr_auto_auto] items-center gap-3 px-1 py-2 ${i < currentCourses.length - 1 ? "border-b border-neutral-200/60 dark:border-white/[0.04]" : ""}`}>
                      <span className="font-mono text-[11px] tracking-wider text-neutral-400 dark:text-neutral-500 truncate">{c.code || "—"}</span>
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-medium text-neutral-800 dark:text-neutral-100">{c.name}</div>
                        {c.instructor && <div className="text-[11px] text-neutral-500 dark:text-neutral-400">{c.instructor}</div>}
                      </div>
                      <Badge tone={attTone(c.attendancePercentage || 0, parseInt(localStorage.getItem('ss-att-threshold') || '75', 10))}>{c.attendancePercentage || 0}%</Badge>
                      {c.credits && <span className="text-[11px] text-neutral-400 tabular-nums">{c.credits} cr</span>}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <Card className="p-5">
            <h3 className="text-[13px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Security</h3>
            <div className="mt-3 flex flex-col gap-1.5">
              <button
                onClick={() => setChangePwOpen(true)}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-[12px] hover:bg-neutral-100 dark:hover:bg-white/[0.04] text-neutral-700 dark:text-neutral-300 transition-colors"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="Lock" size={12} />
                  {user?.hasPassword ? "Change password" : "Set password"}
                </span>
                <Icon name="ChevronRight" size={11} className="opacity-60" />
              </button>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-[13px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Danger zone</h3>
            <div className="mt-3 flex flex-col gap-1.5">
              <button
                onClick={() => { setDeleteConfirm(""); setDeleteModalOpen(true); }}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-[12px] hover:bg-rose-50 dark:hover:bg-rose-500/[0.06] text-rose-600 dark:text-rose-400 transition-colors"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="Trash2" size={12} />
                  Delete account
                </span>
                <Icon name="ChevronRight" size={11} className="opacity-60" />
              </button>
            </div>
          </Card>

          {/* Delete account modal */}
          {deleteModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteModalOpen(false)} />
              <div className="relative w-full max-w-sm rounded-xl border border-neutral-200/80 dark:border-white/[0.08] bg-white dark:bg-neutral-950 shadow-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
                    <Icon name="AlertTriangle" size={16} />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-50">Delete account</h3>
                    <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400">This cannot be undone.</p>
                  </div>
                </div>
                <p className="text-[12.5px] text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                  All your semesters, courses, resources, and attendance records will be permanently deleted.
                </p>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11.5px] font-medium text-neutral-600 dark:text-neutral-400">
                    Type <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">{user?.username}</span> to confirm
                  </span>
                  <input
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder={user?.username}
                    className="h-9 rounded-md border border-neutral-200/80 bg-white px-2.5 text-[12.5px] text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/15 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-200 transition-shadow"
                  />
                </label>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={deletingAccount} className="flex-1">Cancel</Button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirm !== user?.username || deletingAccount}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-md bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[12.5px] font-medium transition-colors"
                  >
                    {deletingAccount ? <Icon name="Loader2" size={13} strokeWidth={2.25} /> : <Icon name="Trash2" size={13} strokeWidth={2} />}
                    {deletingAccount ? "Deleting…" : "Delete account"}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      <EditProfileSheet
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        user={user}
        onSaved={handleProfileSaved}
      />
      <ChangePasswordSheet
        open={changePwOpen}
        onClose={() => setChangePwOpen(false)}
        hasPassword={!!user?.hasPassword}
      />
      {cropState && (
        <CropModal
          open
          src={cropState.src}
          outW={cropState.outW}
          outH={cropState.outH}
          viewW={cropState.viewW}
          viewH={cropState.viewH}
          circle={cropState.circle}
          onCrop={cropState.onCrop}
          onClose={() => setCropState(null)}
        />
      )}
    </div>
  );
}

export default ProfilePage;
