// semesters.jsx — Semester / Course view (API-integrated)

import React from 'react';
import API from './api';
import { Icon, Card, Badge, Button, Tabs, Sheet, EmptyState, ErrorState, Skeleton, RECENT_ICON, RECENT_TONE, ConfirmDialog } from './lib';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const TIMES = [];
for (let h = 8; h <= 17; h++) {
  TIMES.push(`${String(h).padStart(2, "0")}:00`);
  TIMES.push(`${String(h).padStart(2, "0")}:30`);
}
TIMES.push("18:00");
const timeToMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

const COURSE_TINT = [
  { ring: "border-indigo-300/60 dark:border-indigo-400/30",  bg: "bg-indigo-50/80 dark:bg-indigo-500/10",  text: "text-indigo-700 dark:text-indigo-200" },
  { ring: "border-emerald-300/60 dark:border-emerald-400/30", bg: "bg-emerald-50/80 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-200" },
  { ring: "border-rose-300/60 dark:border-rose-400/30",      bg: "bg-rose-50/80 dark:bg-rose-500/10",       text: "text-rose-700 dark:text-rose-200" },
  { ring: "border-amber-300/60 dark:border-amber-400/30",    bg: "bg-amber-50/80 dark:bg-amber-500/10",     text: "text-amber-700 dark:text-amber-200" },
  { ring: "border-sky-300/60 dark:border-sky-400/30",        bg: "bg-sky-50/80 dark:bg-sky-500/10",         text: "text-sky-700 dark:text-sky-200" },
  { ring: "border-violet-300/60 dark:border-violet-400/30",  bg: "bg-violet-50/80 dark:bg-violet-500/10",   text: "text-violet-700 dark:text-violet-200" },
];
const tintAt = (idx) => COURSE_TINT[idx % COURSE_TINT.length];

const RESOURCE_TYPES = ["PYQ", "PLAYLIST", "NOTES", "LINK", "OTHER"];
const TYPE_LABEL = { PYQ: "PYQ", PLAYLIST: "Playlist", NOTES: "Notes", LINK: "Link", OTHER: "Other" };

const toTypeKey = (t) => t ? (t.charAt(0) + t.slice(1).toLowerCase()) : "Other";

function SemField({ label, hint, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[11.5px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{label}</span>
        {hint && <span className="text-[10.5px] text-neutral-400">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
function SemInput(props) {
  return (
    <input
      {...props}
      className="h-9 rounded-md border border-neutral-200/80 bg-white px-2.5 text-[12.5px] text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-200 transition-shadow"
    />
  );
}
function NumberStepper({ value, onChange, min = 1, max = 20, placeholder }) {
  const num = parseInt(value, 10);
  return (
    <div className="flex h-9 items-center overflow-hidden rounded-md border border-neutral-200/80 bg-white dark:border-white/[0.08] dark:bg-white/[0.03]">
      <button
        type="button"
        onClick={() => onChange(String(isNaN(num) ? min : Math.max(min, num - 1)))}
        className="flex h-full w-8 shrink-0 items-center justify-center border-r border-neutral-200/80 text-neutral-500 hover:bg-neutral-100 dark:border-white/[0.08] dark:hover:bg-white/[0.06] transition-colors select-none"
      >−</button>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
        placeholder={placeholder}
        className="h-full w-full min-w-0 bg-transparent text-center text-[12.5px] text-neutral-800 placeholder:text-neutral-400 dark:text-neutral-200 outline-none"
      />
      <button
        type="button"
        onClick={() => onChange(String(isNaN(num) ? min : Math.min(max, num + 1)))}
        className="flex h-full w-8 shrink-0 items-center justify-center border-l border-neutral-200/80 text-neutral-500 hover:bg-neutral-100 dark:border-white/[0.08] dark:hover:bg-white/[0.06] transition-colors select-none"
      >+</button>
    </div>
  );
}
function TimeSelect({ value, onChange, times }) {
  const [open, setOpen] = React.useState(false);
  const [dropRect, setDropRect] = React.useState(null);
  const ref = React.useRef(null);
  const listRef = React.useRef(null);

  const toggle = () => {
    if (!open && ref.current) setDropRect(ref.current.getBoundingClientRect());
    setOpen((o) => !o);
  };

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target) && !listRef.current?.contains(e.target)) setOpen(false); };
    // Close on page scroll (menu is position:fixed), but not when scrolling inside the menu itself
    // — opening auto-scrolls the list to the selected time, which would otherwise close it instantly.
    const onScroll = (e) => { if (!listRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('scroll', onScroll, true);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('scroll', onScroll, true); };
  }, [open]);

  React.useEffect(() => {
    if (!open || !listRef.current) return;
    const sel = listRef.current.querySelector('[data-selected="true"]');
    sel?.scrollIntoView({ block: 'nearest' });
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        className="flex h-9 w-full items-center justify-between rounded-md border border-neutral-200/80 bg-white px-2.5 text-[12.5px] text-neutral-800 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-200 transition-shadow"
      >
        <span className="flex items-center gap-1.5">
          <Icon name="Clock" size={13} className="text-neutral-400 flex-shrink-0" />
          {value || <span className="text-neutral-400">--:--</span>}
        </span>
        <Icon name="ChevronDown" size={13} className={`text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && dropRect && (
        <div
          ref={listRef}
          style={{ position: 'fixed', top: dropRect.bottom + 4, left: dropRect.left, width: dropRect.width, zIndex: 9999, maxHeight: 192, overflowY: 'auto' }}
          className="rounded-md border border-neutral-200/80 bg-white shadow-lg dark:border-white/[0.08] dark:bg-neutral-900 py-1"
        >
          {times.map((t) => (
            <button
              key={t}
              type="button"
              data-selected={t === value}
              onClick={() => { onChange(t); setOpen(false); }}
              className={`w-full px-3 py-1.5 text-left text-[12.5px] transition-colors ${
                t === value
                  ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-medium'
                  : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-white/[0.05]'
              }`}
            >{t}</button>
          ))}
        </div>
      )}
    </div>
  );
}
function CourseSelect({ value, onChange, courses, emptyLabel = "— Pick a course —" }) {
  const [open, setOpen] = React.useState(false);
  const [dropRect, setDropRect] = React.useState(null);
  const ref = React.useRef(null);

  const toggle = () => {
    if (!open && ref.current) setDropRect(ref.current.getBoundingClientRect());
    setOpen((o) => !o);
  };

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onScroll = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('scroll', onScroll, true);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('scroll', onScroll, true); };
  }, [open]);

  const selected = courses.find((c) => c.id === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        className="flex h-9 w-full items-center justify-between rounded-md border border-neutral-200/80 bg-white px-2.5 text-[12.5px] text-neutral-800 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-200 transition-shadow"
      >
        <span className="flex items-center gap-1.5 min-w-0 overflow-hidden">
          <Icon name="BookOpen" size={13} className="text-neutral-400 flex-shrink-0" />
          {selected ? (
            <span className="truncate text-[12.5px]">
              {selected.code && <span className="font-mono text-[11px] text-neutral-400 mr-1">{selected.code} ·</span>}
              {selected.name}
            </span>
          ) : <span className="text-neutral-400">{emptyLabel}</span>}
        </span>
        <Icon name="ChevronDown" size={13} className={`text-neutral-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && dropRect && (
        <div
          style={{ position: 'fixed', top: dropRect.bottom + 4, left: dropRect.left, width: dropRect.width, zIndex: 9999, maxHeight: 224, overflowY: 'auto' }}
          className="rounded-md border border-neutral-200/80 bg-white shadow-lg dark:border-white/[0.08] dark:bg-neutral-900 py-1"
        >
          <button type="button" onClick={() => { onChange("", null); setOpen(false); }} className="w-full px-3 py-2 text-left text-[12.5px] text-neutral-400 hover:bg-neutral-50 dark:hover:bg-white/[0.05] transition-colors">{emptyLabel}</button>
          {courses.map((c) => (
            <button key={c.id} type="button" onClick={() => { onChange(c.id, c); setOpen(false); }}
              className={`w-full px-3 py-2 text-left text-[12.5px] transition-colors ${c.id === value ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-medium' : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-white/[0.05]'}`}
            >
              {c.code && <span className="font-mono text-[10.5px] text-neutral-400 mr-1.5">{c.code} ·</span>}
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function ErrMsg({ msg }) {
  if (!msg) return null;
  return <p className="text-[12px] text-rose-600 dark:text-rose-400">{msg}</p>;
}

export function AddResourceSheet({ open, onClose, semId, courses, defaultCourseId, onSaved }) {
  const [type, setType] = React.useState("PYQ");
  const [title, setTitle] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [courseId, setCourseId] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [autoDetected, setAutoDetected] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setType("PYQ"); setTitle(""); setUrl(""); setErr(""); setAutoDetected(false);
    setCourseId(defaultCourseId ?? "");
  }, [open, defaultCourseId]);

  const handleUrlChange = (e) => {
    setUrl(e.target.value);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      setErr("File too large — maximum is 25 MB.");
      e.target.value = '';
      return;
    }
    setUploading(true); setErr("");
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + API.getToken() },
        body: form,
      });
      let json;
      try { json = await res.json(); } catch { setErr(`Upload failed (${res.status}).`); return; }
      if (json.success) {
        setErr("");
        setUrl(json.data.url);
        setType('NOTES');
        setAutoDetected(true);
      } else {
        setErr(json.message || 'Upload failed');
      }
    } catch {
      setErr('Upload failed. Check your connection.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const save = async () => {
    if (!title.trim()) { setErr("Title is required"); return; }
    setSaving(true); setErr("");
    try {
      let r;
      if (courseId) {
        r = await API.resources.create(courseId, { type, title: title.trim(), url: url.trim() || undefined });
      } else {
        r = await API.resources.createUncategorized(semId, { type, title: title.trim(), url: url.trim() || undefined });
      }
      onSaved?.(courseId || null, r);
      onClose();
    } catch (e) {
      setErr(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add resource">
      <div className="flex flex-col gap-5 p-5">
        <SemField label="Type">
          <div className="flex flex-wrap gap-1.5">
            {RESOURCE_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => { setType(t); setAutoDetected(false); }}
                className={`rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors ${
                  type === t
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-300 dark:hover:bg-white/[0.06]"
                }`}
              >{TYPE_LABEL[t]}</button>
            ))}
          </div>
        </SemField>

        <SemField label="Title">
          <SemInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. OS Mid-sem 2023 — solved" />
        </SemField>

        <SemField label="Link / File" hint="URL or upload a PDF">
          <div className="flex gap-2">
            <input
              value={url}
              onChange={handleUrlChange}
              placeholder="https://…"
              className="h-9 flex-1 min-w-0 rounded-md border border-neutral-200/80 bg-white px-2.5 text-[12.5px] text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-200 transition-shadow"
            />
            <label className={`flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-[12.5px] font-medium transition-colors select-none ${
              uploading
                ? "border-neutral-200 text-neutral-400 dark:border-white/[0.08] cursor-not-allowed"
                : "border-neutral-200 text-neutral-700 hover:bg-neutral-50 dark:border-white/[0.08] dark:text-neutral-300 dark:hover:bg-white/[0.06]"
            }`}>
              <Icon name={uploading ? "Loader2" : "Paperclip"} size={12} className={uploading ? "animate-spin" : ""} />
              {uploading ? "Uploading…" : "PDF"}
              <input type="file" accept=".pdf,application/pdf" className="hidden" disabled={uploading} onChange={handleFileUpload} />
            </label>
          </div>
        </SemField>

        <SemField label="Course" hint="optional">
          <CourseSelect
            value={courseId}
            onChange={(id) => setCourseId(id)}
            courses={courses}
            emptyLabel="General — no course"
          />
        </SemField>

        <ErrMsg msg={err} />

        <div className="flex items-center justify-end gap-2 border-t border-neutral-200/80 dark:border-white/[0.06] pt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || uploading}>
            <Icon name={saving ? "Loader2" : "Check"} size={13} strokeWidth={2.25} />
            {saving ? "Saving…" : "Save resource"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

function AddSemesterSheet({ open, onClose, onSaved }) {
  const [label, setLabel] = React.useState("");
  const [shortName, setShortName] = React.useState("");
  const [isCurrent, setIsCurrent] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    if (open) { setLabel(""); setShortName(""); setIsCurrent(false); setErr(""); }
  }, [open]);

  const save = async () => {
    if (!label.trim()) { setErr("Label is required"); return; }
    setSaving(true); setErr("");
    try {
      const sem = await API.semesters.create({
        label: label.trim(),
        shortName: shortName.trim() || undefined,
        isCurrent,
      });
      onSaved?.(sem);
      onClose();
    } catch (e) {
      setErr(e.message || "Failed to create semester");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="New semester">
      <div className="flex flex-col gap-5 p-5">
        <SemField label="Label">
          <SemInput value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Semester 6 · Spring 2025" />
        </SemField>
        <SemField label="Short name" hint="optional">
          <SemInput value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="e.g. S6" />
        </SemField>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={isCurrent}
            onChange={(e) => setIsCurrent(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 dark:border-white/20 accent-[var(--accent)]"
          />
          <span className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300">Mark as current semester</span>
        </label>
        <ErrMsg msg={err} />
        <div className="flex items-center justify-end gap-2 border-t border-neutral-200/80 dark:border-white/[0.06] pt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            <Icon name={saving ? "Loader2" : "Check"} size={13} strokeWidth={2.25} />
            {saving ? "Creating…" : "Create semester"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

function AddCourseSheet({ open, onClose, semesterId, onSaved }) {
  const [code, setCode] = React.useState("");
  const [name, setName] = React.useState("");
  const [instructor, setInstructor] = React.useState("");
  const [credits, setCredits] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    if (open) { setCode(""); setName(""); setInstructor(""); setCredits(""); setErr(""); }
  }, [open]);

  const save = async () => {
    if (!name.trim()) { setErr("Course name is required"); return; }
    setSaving(true); setErr("");
    try {
      const c = await API.courses.create(semesterId, {
        code: code.trim() || undefined,
        name: name.trim(),
        instructor: instructor.trim() || undefined,
        credits: credits ? parseInt(credits, 10) : undefined,
      });
      onSaved?.(c);
      onClose();
    } catch (e) {
      setErr(e.message || "Failed to add course");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add course">
      <div className="flex flex-col gap-5 p-5">
        <div className="grid grid-cols-2 gap-3">
          <SemField label="Course code" hint="optional">
            <SemInput value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. CS3401" />
          </SemField>
          <SemField label="Credits" hint="optional">
            <NumberStepper value={credits} onChange={setCredits} min={1} max={20} placeholder="e.g. 4" />
          </SemField>
        </div>
        <SemField label="Course name">
          <SemInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Operating Systems" />
        </SemField>
        <SemField label="Instructor" hint="optional">
          <SemInput value={instructor} onChange={(e) => setInstructor(e.target.value)} placeholder="e.g. Dr. Mehta" />
        </SemField>
        <ErrMsg msg={err} />
        <div className="flex items-center justify-end gap-2 border-t border-neutral-200/80 dark:border-white/[0.06] pt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            <Icon name={saving ? "Loader2" : "Check"} size={13} strokeWidth={2.25} />
            {saving ? "Adding…" : "Add course"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}


function ResourceNotesSheet({ open, onClose, resource, onSave }) {
  const [text, setText] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    if (resource?.id) { setText(resource.notes || ""); setSaved(false); }
  }, [resource?.id]);

  const isDirty = text !== (resource?.notes || "");

  const save = async () => {
    if (saving) return;
    setSaving(true); setSaved(false);
    try {
      await onSave(text.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    setSaving(false);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Notes" width={560}>
      <div className="flex flex-col gap-4 p-5">
        <p className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400 truncate">{resource?.title}</p>
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setSaved(false); }}
          placeholder="Jot down what to remember — questions to revisit, key concepts, page references, important timestamps…"
          rows={14}
          className="w-full resize-none rounded-lg border border-neutral-200 bg-white px-4 py-3 text-[13px] leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-neutral-100 dark:placeholder:text-neutral-600"
        />
        <div className="flex items-center justify-between border-t border-neutral-200/80 dark:border-white/[0.06] pt-3">
          <span className={`text-[11.5px] ${saved ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-400 dark:text-neutral-500"}`}>
            {saving ? "Saving…" : saved ? "✓ Saved" : isDirty ? "Unsaved changes" : ""}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button onClick={save} disabled={saving || !isDirty}>
              <Icon name={saving ? "Loader2" : "Save"} size={13} />
              Save
            </Button>
          </div>
        </div>
      </div>
    </Sheet>
  );
}

function ResourceRow({ r, onDelete }) {
  const key = toTypeKey(r.type);
  const iconName = RECENT_ICON[key] || "Paperclip";
  const tone = RECENT_TONE[key] || "neutral";
  const when = r.createdAt
    ? new Date(r.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "";
  const [deleting, setDeleting] = React.useState(false);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const [notesOpen, setNotesOpen] = React.useState(false);
  const [localNotes, setLocalNotes] = React.useState(r.notes || "");
  const isPdf = r.url && r.url.toLowerCase().includes('.pdf');

  const handleDelete = async () => {
    setDeleting(true);
    setConfirmingDelete(false);
    try {
      await API.resources.delete(r.id);
      onDelete?.(r.id);
    } catch {
      setDeleting(false);
    }
  };

  const handleNotesSave = async (text) => {
    await API.resources.update(r.id, {
      type: r.type,
      title: r.title,
      url: r.url || undefined,
      notes: text,
    });
    setLocalNotes(text);
  };

  return (
    <>
      <div className="flex flex-col rounded-md hover:bg-neutral-50 dark:hover:bg-white/[0.03] transition-colors group">
        <div className="grid grid-cols-[20px_60px_1fr_auto] sm:grid-cols-[24px_72px_1fr_auto_auto] items-center gap-2 sm:gap-3 px-2 sm:px-2.5 py-2">
          <Icon name={iconName} size={14} className="text-neutral-400 dark:text-neutral-500" />
          <Badge tone={tone}>{TYPE_LABEL[r.type] || r.type}</Badge>
          <div className="min-w-0">
            <div className="truncate text-[12.5px] font-medium text-neutral-800 dark:text-neutral-100">{r.title}</div>
            {r.url && !isPdf && (
              <div className="truncate text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">{r.url}</div>
            )}
            {isPdf && (
              <div className="text-[11px] text-neutral-400 dark:text-neutral-500 flex items-center gap-1 mt-0.5">
                <Icon name="FileText" size={10} /> PDF document
              </div>
            )}
          </div>
          <div className="hidden sm:block text-[11px] text-neutral-400 dark:text-neutral-500 tabular-nums">{when}</div>
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setNotesOpen(true); }}
              className={`grid h-6 w-6 place-items-center rounded-md transition-all ${
                localNotes
                  ? "text-[var(--accent)]"
                  : "opacity-0 group-hover:opacity-100 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/[0.06] hover:text-neutral-600 dark:hover:text-neutral-300"
              }`}
              title={localNotes ? "Edit notes" : "Add notes"}
            >
              <Icon name="StickyNote" size={12} />
            </button>
            {r.url && (
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="grid h-6 w-6 place-items-center rounded-md text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/[0.06] hover:text-neutral-700 dark:hover:text-neutral-200 transition-all opacity-0 group-hover:opacity-100"
                title={isPdf ? "Open PDF" : "Open link"}
              >
                <Icon name={isPdf ? "FileText" : "ExternalLink"} size={12} />
              </a>
            )}
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmingDelete(true); }}
                className="grid h-6 w-6 place-items-center rounded-md text-neutral-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-all opacity-0 group-hover:opacity-100"
              >
                <Icon name="Trash2" size={12} />
              </button>
          </div>
        </div>
      </div>
      <ResourceNotesSheet
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
        resource={{ ...r, notes: localNotes }}
        onSave={handleNotesSave}
      />
      <ConfirmDialog
        open={confirmingDelete}
        title={`Delete "${r.title}"?`}
        message="This resource will be permanently removed."
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </>
  );
}

const ATT_DOT = {
  PRESENT:   "bg-emerald-500",
  ABSENT:    "bg-rose-500",
  CANCELLED: "bg-neutral-300 dark:bg-neutral-600",
};
const ATT_ROW = {
  PRESENT:   "bg-emerald-50/40 dark:bg-emerald-500/[0.04]",
  ABSENT:    "bg-rose-50/40 dark:bg-rose-500/[0.04]",
  CANCELLED: "bg-neutral-50/60 dark:bg-white/[0.015]",
};
const ATT_TEXT = {
  PRESENT:   "text-emerald-700 dark:text-emerald-300",
  ABSENT:    "text-rose-700 dark:text-rose-300",
  CANCELLED: "text-neutral-500 dark:text-neutral-500",
};

function AttSummaryBar({ summary }) {
  if (!summary) return null;
  if ((summary.present + summary.absent + summary.cancelled) === 0) return null;
  const above = summary.percentage >= 75;
  return (
    <div className={`flex flex-wrap items-center gap-x-5 gap-y-2 rounded-md px-3.5 py-2.5 ${above ? "bg-emerald-50/60 dark:bg-emerald-500/[0.06]" : "bg-amber-50/70 dark:bg-amber-500/[0.06]"}`}>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-[18px] font-semibold tabular-nums tracking-tight ${above ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
          {Math.round(summary.percentage)}%
        </span>
        <span className="text-[11.5px] text-neutral-500 dark:text-neutral-400">attendance</span>
      </div>
      <div className="text-[12px] text-neutral-600 dark:text-neutral-300 tabular-nums">
        <span className="font-medium">{summary.present}</span> / {summary.present + summary.absent} attended
        {summary.cancelled > 0 && <span className="text-neutral-400"> · {summary.cancelled} cancelled</span>}
      </div>
      <div className={`ml-auto inline-flex items-center gap-1.5 text-[12px] font-medium ${above ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
        <Icon name={above ? "ShieldCheck" : "AlertTriangle"} size={13} />
        {above
          ? "On track"
          : <>Need <span className="tabular-nums">{summary.classesNeededFor75}</span> more to reach 75%</>}
      </div>
    </div>
  );
}

function AttRow({ rec }) {
  const dateStr = rec.date
    ? new Date(rec.date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "";
  const dayStr = rec.date
    ? new Date(rec.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" })
    : "";
  const s = rec.status;
  return (
    <div className={`flex items-center gap-3 rounded-md px-2 py-1.5 ${ATT_ROW[s] || ""}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${ATT_DOT[s] || "bg-neutral-300"}`} />
      <span className="w-16 text-[12px] font-mono tabular-nums text-neutral-500 dark:text-neutral-400">{dateStr}</span>
      <span className="w-10 text-[11.5px] text-neutral-400 dark:text-neutral-500">{dayStr}</span>
      <span className={`text-[12px] font-medium capitalize ${ATT_TEXT[s] || ""}`}>
        {s ? s.charAt(0) + s.slice(1).toLowerCase() : ""}
      </span>
    </div>
  );
}

function CourseAttTab({ courseId }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    API.attendance.get(courseId)
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [courseId]);

  if (loading) {
    return <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>;
  }
  if (!data) {
    return <div className="py-6 text-center text-[13px] text-neutral-400">Failed to load attendance.</div>;
  }

  const records = (data.records || []).slice().reverse();
  return (
    <div className="flex flex-col gap-3">
      <AttSummaryBar summary={data.summary} />
      {records.length === 0 ? (
        <div className="py-6 text-center text-[13px] text-neutral-400">
          No attendance records yet. Go to the Attendance page to mark classes.
        </div>
      ) : (
        <div className="-mx-1">
          {records.slice(0, 10).map((rec, i) => <AttRow key={rec.id || i} rec={rec} />)}
        </div>
      )}
      {records.length > 10 && (
        <span className="self-start text-[12px] text-neutral-400">
          Showing 10 of {records.length} — go to Attendance for full view
        </span>
      )}
    </div>
  );
}

function CourseRow({ c, expanded, onToggle, onAddResource, onDeleted, refreshKey }) {
  const [tab, setTab] = React.useState("resources");
  const [resources, setResources] = React.useState(null);
  const [loadingRes, setLoadingRes] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const below = (c.attendancePercentage || 0) < 75 && (c.presentCount > 0 || c.absentCount > 0);

  React.useEffect(() => {
    if (expanded && tab === "resources") {
      setLoadingRes(true);
      API.resources.list(c.id)
        .then((list) => { setResources(list); setLoadingRes(false); })
        .catch(() => { setResources([]); setLoadingRes(false); });
    }
  }, [expanded, tab, refreshKey]);

  const handleResourceSaved = (_courseId, r) => {
    setResources((prev) => prev ? [r, ...prev] : [r]);
  };

  const handleResourceDeleted = (id) => {
    setResources((prev) => prev ? prev.filter((r) => r.id !== id) : prev);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    setDeleting(true);
    setConfirmOpen(false);
    try {
      await API.courses.delete(c.id);
      onDeleted?.(c.id);
    } catch (err) {
      alert(err.message || "Failed to delete course");
      setDeleting(false);
    }
  };

  const resCount = resources !== null ? resources.length : (c.resourceCount || 0);

  return (
    <>
    <div className={`group/row rounded-lg border ${expanded ? "border-neutral-300 dark:border-white/15 shadow-[0_8px_24px_-14px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_24px_-14px_rgba(0,0,0,0.8)]" : "border-neutral-200/80 dark:border-white/[0.08]"} bg-white dark:bg-neutral-900/40 transition-all`}>
      <div
        role="button"
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-4 py-3.5 text-left cursor-pointer select-none"
      >
        <Icon name="ChevronRight" size={14} className={`text-neutral-400 transition-transform duration-200 shrink-0 ${expanded ? "rotate-90" : ""}`} />

        {c.code && (
          <span className="font-mono text-[11px] font-medium tracking-wider text-neutral-400 dark:text-neutral-500 w-14 shrink-0">{c.code}</span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[13.5px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">{c.name}</span>
            {below && <Badge tone="amber"><Icon name="AlertCircle" size={9} className="mr-0.5" /> Low</Badge>}
          </div>
          <div className="mt-0.5 text-[11.5px] text-neutral-500 dark:text-neutral-400">
            {[c.instructor, c.credits ? `${c.credits} credits` : null].filter(Boolean).join(" · ") || "No details"}
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-6">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">Attendance</div>
            <div className={`text-[13px] font-semibold tabular-nums ${below ? "text-amber-600 dark:text-amber-400" : "text-neutral-800 dark:text-neutral-100"}`}>
              {c.attendancePercentage || 0}%
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">Resources</div>
            <div className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-100 tabular-nums">{c.resourceCount || 0}</div>
          </div>
        </div>

        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Delete course"
          className="ml-1 grid h-7 w-7 place-items-center rounded-md text-neutral-300 dark:text-neutral-700 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 transition-all opacity-0 group-hover/row:opacity-100"
        >
          <Icon name={deleting ? "Loader2" : "Trash2"} size={13} />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-neutral-200/70 dark:border-white/[0.06] px-4 py-4 page-fade">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <Tabs
              value={tab}
              onChange={setTab}
              items={[
                { id: "resources",  label: "Resources",  icon: "Folder",         badge: resCount },
                { id: "attendance", label: "Attendance", icon: "CalendarCheck2", badge: `${c.attendancePercentage || 0}%` },
              ]}
            />
            {tab === "resources" && (
              <Button className="w-full sm:w-auto" onClick={() => onAddResource(c.id)}>
                <Icon name="Plus" size={12} strokeWidth={2.25} /> Add resource
              </Button>
            )}
          </div>

          <div className="mt-4">
            {tab === "resources" && (
              loadingRes ? (
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : !resources || resources.length === 0 ? (
                <EmptyState
                  icon="stack"
                  title="No resources yet"
                  body="Save PYQs, playlists, notes, and links for this course."
                  action={
                    <Button onClick={() => onAddResource(c.id)}>
                      <Icon name="Plus" size={12} strokeWidth={2.25} /> Add the first one
                    </Button>
                  }
                />
              ) : (
                <div className="-mx-2 flex flex-col gap-0.5">
                  <div className="grid grid-cols-[20px_60px_1fr_40px] sm:grid-cols-[24px_72px_1fr_auto_64px] gap-2 sm:gap-3 px-2 sm:px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    <span /><span>Type</span><span>Title</span><span className="hidden sm:block">Added</span><span className="hidden sm:block" />
                  </div>
                  {resources.map((r) => (
                    <ResourceRow key={r.id} r={r} onDelete={handleResourceDeleted} />
                  ))}
                </div>
              )
            )}

            {tab === "attendance" && <CourseAttTab courseId={c.id} />}
          </div>
        </div>
      )}
    </div>
    <ConfirmDialog
      open={confirmOpen}
      title={`Delete "${c.name}"?`}
      message="All resources and attendance records will also be deleted."
      onConfirm={doDelete}
      onCancel={() => setConfirmOpen(false)}
    />
    </>
  );
}

const REFERENCE_MONDAY = '2024-01-08';
const DAY_OFFSET = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4 };

function slotsToEvents(slots, courses) {
  return slots.map((s) => {
    const d = new Date(REFERENCE_MONDAY);
    d.setDate(d.getDate() + (DAY_OFFSET[s.day] ?? 0));
    const date = d.toISOString().slice(0, 10);
    const courseIdx = courses.findIndex((c) => c.id === s.courseId || c.code === s.courseCode);
    const course = courses.find((c) => c.id === s.courseId || c.code === s.courseCode);
    return {
      id: s.id,
      title: course?.name || s.courseCode || 'Class',
      start: `${date}T${s.start}`,
      end: `${date}T${s.end}`,
      extendedProps: { slot: s, course, courseIdx },
    };
  });
}

function Timetable({ slots, courses, onEdit, onAdd }) {
  const events = React.useMemo(() => slotsToEvents(slots, courses), [slots, courses]);

  return (
    <Card className="overflow-hidden">
      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        initialDate={REFERENCE_MONDAY}
        validRange={{ start: REFERENCE_MONDAY, end: '2024-01-15' }}
        headerToolbar={false}
        allDaySlot={false}
        weekends={false}
        slotMinTime="08:00:00"
        slotMaxTime="18:00:00"
        slotDuration="00:30:00"
        slotLabelInterval="01:00:00"
        slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        dayHeaderFormat={{ weekday: 'short' }}
        height="auto"
        eventBackgroundColor="transparent"
        eventBorderColor="transparent"
        events={events}
        eventClick={(info) => onEdit(info.event.extendedProps.slot)}
        dateClick={(info) => {
          const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][info.date.getDay()];
          const h = String(info.date.getHours()).padStart(2, '0');
          const m = String(info.date.getMinutes()).padStart(2, '0');
          onAdd(day, `${h}:${m}`);
        }}
        eventContent={(arg) => {
          const { slot, course, courseIdx } = arg.event.extendedProps;
          const tint = tintAt(courseIdx >= 0 ? courseIdx : 0);
          const durationMin = timeToMin(slot.end) - timeToMin(slot.start);
          return (
            <div className={`h-full w-full rounded-[4px] ${tint.bg} ${tint.text} border ${tint.ring} px-2 py-1.5 overflow-hidden backdrop-blur-sm`}>
              <div className="font-mono text-[9.5px] tabular-nums opacity-70 leading-tight">{slot.start}–{slot.end}</div>
              <div className="text-[12px] font-semibold tracking-tight truncate leading-tight mt-0.5">
                {course?.name || slot.courseCode || 'Class'}
              </div>
              {durationMin >= 60 && slot.room && (
                <div className="text-[10.5px] opacity-70 truncate mt-0.5 flex items-center gap-1">
                  <Icon name="MapPin" size={9} /> {slot.room}
                </div>
              )}
            </div>
          );
        }}
      />
    </Card>
  );
}

function EditSlotSheet({ open, onClose, slot, courses, onSave, onDelete }) {
  const isNew = slot && !slot.id;
  const [draft, setDraft] = React.useState(slot || {});
  React.useEffect(() => { if (slot) setDraft({ ...slot }); }, [slot]);
  if (!slot) return null;

  const valid = (draft.courseId || draft.courseCode) && draft.day && draft.start && draft.end && timeToMin(draft.end) > timeToMin(draft.start);

  return (
    <Sheet open={open} onClose={onClose} title={isNew ? "Add to timetable" : "Edit class"}>
      <div className="flex flex-col gap-5 p-5">
        <SemField label="Course">
          <CourseSelect
            value={draft.courseId || ""}
            onChange={(id, c) => setDraft({ ...draft, courseId: id, courseCode: c?.code || "" })}
            courses={courses}
          />
        </SemField>

        <SemField label="Day">
          <div className="grid grid-cols-5 gap-1">
            {DAYS.map((d) => (
              <button key={d}
                onClick={() => setDraft({ ...draft, day: d })}
                className={`h-9 rounded-md border text-[12px] font-medium transition-colors ${
                  draft.day === d
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-neutral-300 dark:hover:bg-white/[0.06]"
                }`}>{d}</button>
            ))}
          </div>
        </SemField>

        <div className="grid grid-cols-2 gap-3">
          <SemField label="Start">
            <TimeSelect
              value={draft.start || ""}
              onChange={(t) => setDraft({ ...draft, start: t })}
              times={TIMES.slice(0, -1)}
            />
          </SemField>
          <SemField label="End">
            <TimeSelect
              value={draft.end || ""}
              onChange={(t) => setDraft({ ...draft, end: t })}
              times={TIMES.filter((t) => !draft.start || timeToMin(t) > timeToMin(draft.start))}
            />
          </SemField>
        </div>

        <SemField label="Room / location">
          <SemInput value={draft.room || ""} onChange={(e) => setDraft({ ...draft, room: e.target.value })} placeholder="e.g. B-204 or Lab-3" />
        </SemField>

        <div className="flex items-center justify-between gap-2 border-t border-neutral-200/80 dark:border-white/[0.06] pt-4">
          {!isNew ? (
            <Button variant="ghost" onClick={() => { onDelete(slot.id); onClose(); }} className="!text-rose-600 dark:!text-rose-400">
              <Icon name="Trash2" size={12} /> Delete
            </Button>
          ) : <span />}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button disabled={!valid} onClick={() => { if (valid) { onSave(draft); onClose(); } }}>
              <Icon name="Check" size={13} strokeWidth={2.25} /> {isNew ? "Add class" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </Sheet>
  );
}

function TimetableSection({ semId, courses }) {
  const [slots, setSlots] = React.useState([]);
  const [editing, setEditing] = React.useState(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [confirmSlotId, setConfirmSlotId] = React.useState(null);

  React.useEffect(() => {
    if (!semId) return;
    API.slots.list(semId)
      .then(setSlots)
      .catch(() => {});
  }, [semId]);

  const totalHours = slots.reduce((s, x) => s + (timeToMin(x.end) - timeToMin(x.start)) / 60, 0);

  const openEdit = (slot) => { setEditing(slot); setSheetOpen(true); };
  const openAdd = (day, start) => {
    const startMin = timeToMin(start);
    setEditing({ day, start, end: `${String(Math.floor((startMin + 60) / 60)).padStart(2, "0")}:00`, courseId: "", courseCode: "", room: "" });
    setSheetOpen(true);
  };

  const saveSlot = async (s) => {
    try {
      if (s.id) {
        const updated = await API.slots.update(s.id, {
          day: s.day, start: s.start, end: s.end,
          room: s.room || null, courseId: s.courseId || null,
        });
        setSlots((prev) => prev.map((x) => x.id === s.id ? updated : x));
      } else {
        const created = await API.slots.create(semId, {
          day: s.day, start: s.start, end: s.end,
          room: s.room || null, courseId: s.courseId || null,
        });
        setSlots((prev) => [...prev, created]);
      }
    } catch (err) {
      alert(err.message || "Failed to save slot");
    }
  };

  const deleteSlot = async (id) => {
    try {
      await API.slots.delete(id);
      setSlots((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      alert(err.message || "Failed to delete slot");
    }
  };

  return (
    <section className="mt-6">
      <div className="flex items-end justify-between pb-3">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <Icon name="Calendar" size={14} className="text-[var(--accent)]" /> Weekly timetable
          </h2>
          <p className="mt-0.5 text-[12px] text-neutral-500 dark:text-neutral-400">
            <span className="tabular-nums">{slots.length}</span> slots · <span className="tabular-nums">{totalHours.toFixed(1)}h</span> per week · click any class to edit, empty slot to add
          </p>
        </div>
        <Button onClick={() => openAdd("Mon", "09:00")}>
          <Icon name="Plus" size={12} strokeWidth={2.25} /> Add class
        </Button>
      </div>
      <Timetable slots={slots} courses={courses} onEdit={openEdit} onAdd={openAdd} />
      <EditSlotSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        slot={editing}
        courses={courses}
        onSave={saveSlot}
        onDelete={(id) => setConfirmSlotId(id)}
      />
      <ConfirmDialog
        open={!!confirmSlotId}
        title="Delete this timetable slot?"
        message="This class slot will be removed from your weekly schedule."
        onConfirm={() => { deleteSlot(confirmSlotId); setConfirmSlotId(null); }}
        onCancel={() => setConfirmSlotId(null)}
      />
    </section>
  );
}

function SemSummaryStat({ label, value }) {
  return (
    <Card className="px-3.5 py-3">
      <div className="text-[10.5px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-medium">{label}</div>
      <div className="mt-1 text-[20px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 tabular-nums">{value}</div>
    </Card>
  );
}

function SemesterPage() {
  const [semesters, setSemesters] = React.useState([]);
  const [semId, setSemId] = React.useState(null);
  const [courses, setCourses] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingCourses, setLoadingCourses] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [expanded, setExpanded] = React.useState(new Set());

  const [addResOpen, setAddResOpen] = React.useState(false);
  const [addResDefault, setAddResDefault] = React.useState(null);
  const [addSemOpen, setAddSemOpen] = React.useState(false);
  const [addCourseOpen, setAddCourseOpen] = React.useState(false);
  const [deleteSemOpen, setDeleteSemOpen] = React.useState(false);

  const fetchSemesters = React.useCallback(() => {
    setLoading(true);
    setError(false);
    API.semesters.list()
      .then((list) => {
        setSemesters(list);
        const cur = list.find((s) => s.current) || list[0];
        if (cur) setSemId(cur.id);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  React.useEffect(() => { fetchSemesters(); }, []);

  const [uncategorized, setUncategorized] = React.useState([]);

  React.useEffect(() => {
    if (!semId) return;
    setLoadingCourses(true);
    setCourses([]);
    setExpanded(new Set());
    setUncategorized([]);
    API.courses.list(semId)
      .then((list) => { setCourses(list); setLoadingCourses(false); })
      .catch(() => setLoadingCourses(false));
    API.resources.listUncategorized(semId)
      .then(setUncategorized)
      .catch(() => {});
  }, [semId]);

  const sem = semesters.find((s) => s.id === semId);

  const toggle = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openAddResource = (courseId) => { setAddResDefault(courseId); setAddResOpen(true); };

  const [refreshKey, setRefreshKey] = React.useState(0);

  const [chatOpen, setChatOpen] = React.useState(false);
  const [chatHistory, setChatHistory] = React.useState([]);
  const [chatInput, setChatInput] = React.useState("");
  const [chatLoading, setChatLoading] = React.useState(false);
  const chatBottomRef = React.useRef(null);

  React.useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatLoading]);

  const buildChatContext = () => ({
    semesterLabel: sem?.label,
    courses: courses.map((c) => ({ name: c.name, code: c.code, credits: c.credits })),
  });

  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    setChatInput("");
    setChatHistory((h) => [...h, { role: "user", content: msg }]);
    setChatLoading(true);
    try {
      const res = await API.ai.chat(msg, buildChatContext());
      setChatHistory((h) => [...h, { role: "assistant", content: res.reply }]);
    } catch {
      setChatHistory((h) => [...h, { role: "assistant", content: "Sorry, I couldn't connect to the AI. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleResourceSaved = (courseId, resource) => {
    if (courseId) {
      setCourses((prev) =>
        prev.map((c) => c.id === courseId ? { ...c, resourceCount: (c.resourceCount || 0) + 1 } : c)
      );
      setExpanded((prev) => { const next = new Set(prev); next.add(courseId); return next; });
      setRefreshKey((k) => k + 1);
    } else {
      setUncategorized((prev) => [resource, ...prev]);
    }
  };

  const handleCourseDeleted = (courseId) => {
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
    setExpanded((prev) => { const next = new Set(prev); next.delete(courseId); return next; });
  };

  const handleSemCreated = (sem) => {
    setSemesters((prev) => [sem, ...prev]);
    setSemId(sem.id);
  };

  const handleCourseCreated = (course) => {
    setCourses((prev) => [...prev, course]);
  };

  const deleteSemester = async () => {
    if (!sem) return;
    try {
      await API.semesters.delete(sem.id);
      const next = semesters.filter((s) => s.id !== sem.id);
      setSemesters(next);
      setSemId(next[0]?.id || null);
    } catch (e) {
      alert(e.message || "Failed to delete semester");
    }
  };

  const shareToggle = async () => {
    if (!sem) return;
    try {
      if (sem.shareToken) {
        await API.semesters.disableShare(sem.id);
        setSemesters((prev) => prev.map((s) => s.id === sem.id ? { ...s, shareToken: null } : s));
      } else {
        const updated = await API.semesters.enableShare(sem.id);
        setSemesters((prev) => prev.map((s) => s.id === sem.id ? { ...s, shareToken: updated.shareToken } : s));
      }
    } catch (e) {
      alert(e.message || "Failed to update sharing");
    }
  };

  const setAsCurrent = async () => {
    if (!sem || sem.current) return;
    try {
      await API.semesters.setCurrent(sem.id);
      setSemesters((prev) => prev.map((s) => ({ ...s, current: s.id === sem.id })));
    } catch (e) {
      alert(e.message || "Failed to set current semester");
    }
  };

  const copyShareLink = () => {
    if (!sem?.shareToken) return;
    const link = `${window.location.origin}/share.html?token=${sem.shareToken}`;
    if (navigator.clipboard) navigator.clipboard.writeText(link);
  };

  const totalAtt = courses.length
    ? Math.round(courses.reduce((s, c) => s + (c.attendancePercentage || 0), 0) / courses.length)
    : 0;
  const totalRes = courses.reduce((s, c) => s + (c.resourceCount || 0), 0);
  const totalCred = courses.reduce((s, c) => s + (c.credits || 0), 0);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1240px] px-6 py-7 lg:px-10 lg:py-9 page-fade flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-[1240px] px-6 py-7 lg:px-10 lg:py-9 page-fade">
        <ErrorState title="Failed to load semesters" onRetry={fetchSemesters} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-7 lg:px-10 lg:py-9 page-fade">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[12px] text-neutral-500 dark:text-neutral-400">
            <Icon name="BookOpen" size={12} />
            <span>Semesters</span>
          </div>
          <h1 className="mt-1.5 text-[24px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            {sem?.label || "No semester selected"}
          </h1>
          <p className="mt-1 text-[12.5px] text-neutral-500 dark:text-neutral-400">
            {sem?.current ? "Current semester · " : (sem ? "Archived · " : "")}{courses.length} course{courses.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 shrink-0">
          <Button variant="ghost" onClick={() => setAddSemOpen(true)}>
            <Icon name="FolderPlus" size={12} /> New semester
          </Button>
          {sem && !sem.current && (
            <Button variant="outline" onClick={setAsCurrent}>
              <Icon name="Star" size={12} /> Set as current
            </Button>
          )}
          {sem && (
            <Button variant="outline" onClick={shareToggle}>
              <Icon name={sem.shareToken ? "Link2Off" : "Share2"} size={12} />
              {sem.shareToken ? "Unshare" : "Share"}
            </Button>
          )}
          {courses.length > 0 && (
            <Button variant="outline" onClick={() => expanded.size === courses.length ? setExpanded(new Set()) : setExpanded(new Set(courses.map((c) => c.id)))}>
              <Icon name={expanded.size === courses.length ? "ChevronsDownUp" : "ChevronsUpDown"} size={12} />
              {expanded.size === courses.length ? "Collapse all" : "Expand all"}
            </Button>
          )}
          {courses.length > 0 && (
            <Button variant="outline" onClick={() => setChatOpen(true)}>
              <Icon name="BotMessageSquare" size={12} /> AI Chat
            </Button>
          )}
          <Button onClick={() => openAddResource(courses[0]?.id || null)} disabled={courses.length === 0}>
            <Icon name="Plus" size={13} strokeWidth={2.25} /> Add resource
          </Button>
        </div>
      </div>

      {sem?.shareToken && (
        <div className="mt-4 flex items-center gap-3 rounded-md bg-[var(--accent)]/5 border border-[var(--accent)]/20 px-4 py-2.5">
          <Icon name="Link2" size={13} className="text-[var(--accent)] shrink-0" />
          <span className="text-[12px] text-neutral-600 dark:text-neutral-300 flex-1 truncate font-mono">
            {window.location.origin}/share.html?token={sem.shareToken}
          </span>
          <button
            onClick={copyShareLink}
            className="text-[11.5px] font-medium text-[var(--accent)] hover:underline whitespace-nowrap"
          >
            Copy link
          </button>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between border-b border-neutral-200/80 dark:border-white/[0.06]">
        <div className="flex items-center gap-1 overflow-x-auto">
          {semesters.length === 0 ? (
            <span className="px-3 py-2.5 text-[12.5px] text-neutral-400">No semesters yet</span>
          ) : (
            semesters.map((s) => {
              const active = s.id === semId;
              return (
                <button
                  key={s.id}
                  onClick={() => setSemId(s.id)}
                  className={`relative inline-flex items-center gap-1.5 px-3 py-2.5 text-[12.5px] font-medium transition-colors whitespace-nowrap ${
                    active
                      ? "text-neutral-900 dark:text-neutral-50"
                      : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
                  }`}
                >
                  {s.shortName || s.label}
                  {s.isCurrent && (
                    <span className="rounded bg-[var(--accent)]/10 px-1 py-px text-[9.5px] font-semibold text-[var(--accent)]">Now</span>
                  )}
                  {active && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-t bg-neutral-900 dark:bg-neutral-50" />}
                </button>
              );
            })
          )}
        </div>
      </div>

      {!loadingCourses && courses.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SemSummaryStat label="Courses"    value={courses.length} />
          <SemSummaryStat label="Attendance" value={`${totalAtt}%`} />
          <SemSummaryStat label="Resources"  value={totalRes} />
          <SemSummaryStat label="Credits"    value={totalCred || "—"} />
        </div>
      )}

      {courses.length > 0 && <TimetableSection semId={semId} courses={courses} />}

      {(uncategorized.length > 0 || semId) && (
        <section className="mt-6">
          <div className="flex items-center justify-between px-1 pb-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
              <Icon name="Library" size={12} /> General resources
            </h2>
            <Button variant="outline" onClick={() => { setAddResDefault(null); setAddResOpen(true); }}>
              <Icon name="Plus" size={11} strokeWidth={2.25} /> Add
            </Button>
          </div>
          {uncategorized.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-200 dark:border-white/[0.08] py-8 text-center text-[12px] text-neutral-400">
              Books, important PDFs, and links not tied to any course live here.
            </div>
          ) : (
            <div className="rounded-lg border border-neutral-200/80 dark:border-white/[0.08] bg-white dark:bg-neutral-900/40 -mx-0 overflow-hidden">
              <div className="grid grid-cols-[20px_60px_1fr_40px] sm:grid-cols-[24px_72px_1fr_auto_64px] gap-2 sm:gap-3 px-2 sm:px-2.5 pb-1.5 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                <span /><span>Type</span><span>Title</span><span className="hidden sm:block">Added</span><span className="hidden sm:block" />
              </div>
              <div className="flex flex-col gap-0.5 pb-1">
                {uncategorized.map((r) => (
                  <ResourceRow key={r.id} r={r} onDelete={(id) => setUncategorized((prev) => prev.filter((x) => x.id !== id))} />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="mt-6 flex flex-col gap-2">
        <div className="flex items-center justify-between px-1 pb-1">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Courses</h2>
          <div className="flex items-center gap-3">
            {courses.length > 0 && (
              <span className="text-[11px] text-neutral-400 dark:text-neutral-500">{expanded.size} of {courses.length} expanded</span>
            )}
            {semId && (
              <Button variant="outline" onClick={() => setAddCourseOpen(true)}>
                <Icon name="Plus" size={11} strokeWidth={2.25} /> Add course
              </Button>
            )}
          </div>
        </div>

        {loadingCourses ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
        ) : !semId ? (
          <EmptyState
            icon="BookOpen"
            title="No semesters yet"
            body="Create your first semester to get started."
            action={<Button onClick={() => setAddSemOpen(true)}><Icon name="Plus" size={12} /> New semester</Button>}
          />
        ) : courses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-200 dark:border-white/[0.08] py-12 text-center">
            <div className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400">No courses yet</div>
            <div className="mt-1 text-[12px] text-neutral-400">Add your first course for this semester.</div>
            <div className="mt-4">
              <Button onClick={() => setAddCourseOpen(true)}>
                <Icon name="Plus" size={12} strokeWidth={2.25} /> Add course
              </Button>
            </div>
          </div>
        ) : (
          courses.map((c) => (
            <CourseRow
              key={c.id}
              c={c}
              expanded={expanded.has(c.id)}
              onToggle={() => toggle(c.id)}
              onAddResource={openAddResource}
              onDeleted={handleCourseDeleted}
              refreshKey={refreshKey}
            />
          ))
        )}
      </section>

      {sem && (
        <div className="mt-10 flex items-center justify-end">
          <button
            onClick={() => setDeleteSemOpen(true)}
            className="inline-flex items-center gap-1.5 text-[12px] text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
          >
            <Icon name="Trash2" size={12} /> Delete this semester
          </button>
        </div>
      )}

      <AddResourceSheet
        open={addResOpen}
        onClose={() => setAddResOpen(false)}
        semId={semId}
        courses={courses}
        defaultCourseId={addResDefault}
        onSaved={handleResourceSaved}
      />
      <AddSemesterSheet open={addSemOpen} onClose={() => setAddSemOpen(false)} onSaved={handleSemCreated} />
      <AddCourseSheet open={addCourseOpen} onClose={() => setAddCourseOpen(false)} semesterId={semId} onSaved={handleCourseCreated} />

      {chatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-neutral-900/60 dark:bg-black/70 backdrop-blur-[2px]" onClick={() => setChatOpen(false)} />
          <div className="relative z-10 flex flex-col w-full max-w-lg bg-white dark:bg-neutral-950 rounded-xl shadow-2xl border border-neutral-200/80 dark:border-white/[0.06]" style={{ height: "80vh" }}>
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200/80 dark:border-white/[0.06] px-5">
              <div className="flex items-center gap-2">
                <Icon name="BotMessageSquare" size={15} className="text-[var(--accent)]" />
                <h2 className="text-[14px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Study Assistant</h2>
              </div>
              <button onClick={() => setChatOpen(false)} className="grid h-7 w-7 place-items-center rounded-md text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/[0.06]">
                <Icon name="X" size={14} />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 p-4">
              {chatHistory.length === 0 && (
                <p className="text-[12px] text-neutral-400 dark:text-neutral-500 text-center mt-8 px-4">
                  Ask me anything about your {sem?.label || "semester"} courses — concepts, study tips, or resources.
                </p>
              )}
              {chatHistory.map((m, i) => (
                <div
                  key={i}
                  className={`rounded-xl px-3 py-2 text-[12.5px] leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                    m.role === "user"
                      ? "self-end bg-[var(--accent)] text-white"
                      : "self-start bg-neutral-100 dark:bg-white/[0.06] text-neutral-800 dark:text-neutral-200"
                  }`}
                >{m.content}</div>
              ))}
              {chatLoading && (
                <div className="self-start bg-neutral-100 dark:bg-white/[0.06] rounded-xl px-3 py-2.5">
                  <Icon name="Loader2" size={14} className="animate-spin text-neutral-400" />
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>
            <div className="shrink-0 flex gap-2 border-t border-neutral-200/80 dark:border-white/[0.06] p-4">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                placeholder="Ask about your courses…"
                className="flex-1 rounded-md border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] px-3 py-2 text-[12.5px] placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-[var(--accent)] dark:text-neutral-100"
              />
              <Button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}>
                <Icon name="Send" size={12} />
              </Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={deleteSemOpen}
        title={sem ? `Delete "${sem.label}"?` : "Delete semester?"}
        message="All courses, resources, and attendance will be permanently deleted."
        onConfirm={() => { setDeleteSemOpen(false); deleteSemester(); }}
        onCancel={() => setDeleteSemOpen(false)}
      />
    </div>
  );
}

export default SemesterPage;
