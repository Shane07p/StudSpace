// assistant.jsx — full AI chat page: conversation list + persistent history

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import API from './api';
import { Icon, Button, Sheet, Select } from './lib';

const stub = (d) => ({ id: d.id, title: d.title, resourceId: d.resourceId, updatedAt: new Date().toISOString() });
const upsert = (list, d) => [stub(d), ...list.filter((c) => c.id !== d.id)];

export default function AssistantPage({ pendingResource, onConsumePending }) {
  const [convos, setConvos] = React.useState([]);
  const [listLoading, setListLoading] = React.useState(true);
  const [activeId, setActiveId] = React.useState(null);
  const [detail, setDetail] = React.useState(null);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const bottomRef = React.useRef(null);

  React.useEffect(() => {
    API.ai.listConversations()
      .then((cs) => setConvos(cs))
      .catch(() => {})
      .finally(() => setListLoading(false));
  }, []);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [detail, sending]);

  // "Ask AI about this" from a resource → open a fresh conversation attached to it
  React.useEffect(() => {
    if (!pendingResource) return;
    (async () => {
      try {
        const d = await API.ai.createConversation({ resourceId: pendingResource.id });
        setConvos((cs) => upsert(cs, d));
        setActiveId(d.id);
        setDetail(d);
      } catch { /* ignore */ }
      finally { onConsumePending?.(); }
    })();
  }, [pendingResource]);

  const openConvo = async (id) => {
    setActiveId(id);
    setDetail(null);
    try { setDetail(await API.ai.getConversation(id)); } catch { /* ignore */ }
  };

  const newChat = () => { setActiveId(null); setDetail(null); setInput(""); };

  const send = async () => {
    const msg = input.trim();
    if (!msg || sending) return;
    setInput("");
    setSending(true);
    setDetail((d) => ({
      ...(d || { id: null, title: null, resourceId: null }),
      messages: [...(d?.messages || []), { id: "tmp", role: "user", content: msg }],
    }));
    try {
      let d;
      if (activeId) {
        d = await API.ai.sendMessage(activeId, msg);
      } else {
        d = await API.ai.createConversation({ message: msg });
        setActiveId(d.id);
      }
      setDetail(d);
      setConvos((cs) => upsert(cs, d));
    } catch {
      setDetail((d) => ({ ...d, messages: [...(d?.messages || []), { id: "err", role: "assistant", content: "Sorry, I couldn't reach the AI. Please try again." }] }));
    } finally {
      setSending(false);
    }
  };

  const del = async (id, e) => {
    e.stopPropagation();
    try { await API.ai.deleteConversation(id); } catch { return; }
    setConvos((cs) => cs.filter((c) => c.id !== id));
    if (activeId === id) newChat();
  };

  // Attach a resource to the current chat (create one first if none is open yet).
  const pickResource = async (r) => {
    setPickerOpen(false);
    try {
      let d;
      if (activeId) d = await API.ai.attachResource(activeId, r.id);
      else { d = await API.ai.createConversation({ resourceId: r.id }); setActiveId(d.id); }
      setDetail(d);
      setConvos((cs) => upsert(cs, d));
    } catch { /* ignore */ }
  };

  const detach = async () => {
    if (!activeId) return;
    try {
      const d = await API.ai.attachResource(activeId, null);
      setDetail(d);
      setConvos((cs) => upsert(cs, d));
    } catch { /* ignore */ }
  };

  const messages = detail?.messages || [];

  return (
    <div className="flex h-full gap-4 p-4 sm:p-6">
      {/* Conversation list */}
      <aside className="hidden sm:flex w-60 shrink-0 flex-col rounded-xl border border-neutral-200/80 dark:border-white/[0.06] bg-white dark:bg-neutral-950 overflow-hidden">
        <div className="p-2.5 border-b border-neutral-200/80 dark:border-white/[0.06]">
          <Button className="w-full justify-center" onClick={newChat}>
            <Icon name="Plus" size={13} strokeWidth={2.25} /> New chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-0.5">
          {listLoading && <p className="text-[11.5px] text-neutral-400 text-center mt-4">Loading…</p>}
          {!listLoading && convos.length === 0 && (
            <p className="text-[11.5px] text-neutral-400 dark:text-neutral-500 text-center mt-4 px-2">No conversations yet.</p>
          )}
          {convos.map((c) => (
            <button
              key={c.id}
              onClick={() => openConvo(c.id)}
              className={`group flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-[12px] transition-colors ${
                activeId === c.id
                  ? "bg-neutral-200/70 text-neutral-900 dark:bg-white/[0.08] dark:text-white"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-white/[0.04]"
              }`}
            >
              <Icon name={c.resourceId ? "Paperclip" : "MessageSquare"} size={12} className="shrink-0 text-neutral-400" />
              <span className="truncate flex-1">{c.title || "New chat"}</span>
              <span onClick={(e) => del(c.id, e)} className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-rose-500 transition-colors" title="Delete">
                <Icon name="Trash2" size={12} />
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* Chat area */}
      <section className="flex min-w-0 flex-1 flex-col rounded-xl border border-neutral-200/80 dark:border-white/[0.06] bg-white dark:bg-neutral-950 overflow-hidden">
        <div className="flex shrink-0 items-center gap-2 border-b border-neutral-200/80 dark:border-white/[0.06] px-4 py-3">
          <Icon name="BotMessageSquare" size={16} className="text-[var(--accent)] shrink-0" />
          <div className="min-w-0">
            <h1 className="text-[13.5px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 leading-tight">Study Assistant</h1>
            {detail?.title && <div className="truncate text-[11px] text-neutral-500 dark:text-neutral-400">{detail.title}</div>}
          </div>
          <button onClick={newChat} className="sm:hidden ml-auto grid h-7 w-7 place-items-center rounded-md text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/[0.06]" title="New chat">
            <Icon name="Plus" size={14} />
          </button>
        </div>

        {detail?.resourceTitle && (
          <div className="flex shrink-0 items-center gap-1.5 border-b border-neutral-200/80 dark:border-white/[0.06] bg-[var(--accent)]/[0.06] px-4 py-1.5">
            <Icon name="Paperclip" size={11} className="text-[var(--accent)] shrink-0" />
            <span className="truncate text-[11px] font-medium text-neutral-600 dark:text-neutral-300">{detail.resourceTitle}</span>
            <button onClick={detach} className="ml-auto grid h-4 w-4 place-items-center rounded text-neutral-400 hover:text-rose-500" title="Detach resource">
              <Icon name="X" size={11} />
            </button>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 p-4">
          {messages.length === 0 && !sending && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center px-6">
              <Icon name="Sparkles" size={22} className="text-[var(--accent)]" />
              <p className="text-[12.5px] text-neutral-500 dark:text-neutral-400 max-w-xs">
                Ask about your courses, attendance, or resources — or open a note and hit "Ask AI".
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={m.id || i}
              className={`rounded-xl px-3 py-2 text-[12.5px] leading-relaxed max-w-[85%] ${
                m.role === "user"
                  ? "self-end bg-[var(--accent)] text-white whitespace-pre-wrap"
                  : "self-start bg-neutral-100 dark:bg-white/[0.06] text-neutral-800 dark:text-neutral-200 md-body"
              }`}
            >
              {m.role === "user"
                ? m.content
                : <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{m.content}</ReactMarkdown>}
            </div>
          ))}
          {sending && (
            <div className="self-start bg-neutral-100 dark:bg-white/[0.06] rounded-xl px-3 py-2.5">
              <Icon name="Loader2" size={14} className="animate-spin text-neutral-400" />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="shrink-0 flex gap-2 border-t border-neutral-200/80 dark:border-white/[0.06] px-4 py-3">
          <button
            onClick={() => setPickerOpen(true)}
            title="Attach a resource"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-neutral-200 text-neutral-500 hover:bg-neutral-100 dark:border-white/[0.08] dark:text-neutral-400 dark:hover:bg-white/[0.06]"
          >
            <Icon name="Paperclip" size={14} />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask anything about your studies…"
            className="flex-1 rounded-md border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] px-3 py-2 text-[12.5px] placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-[var(--accent)] dark:text-neutral-100"
          />
          <Button onClick={send} disabled={sending || !input.trim()}>
            <Icon name="Send" size={13} />
          </Button>
        </div>
      </section>

      <ResourcePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={pickResource} />
    </div>
  );
}

// Browse course resources (general first) and pick one to attach to the chat.
function ResourcePicker({ open, onClose, onPick }) {
  const [semesters, setSemesters] = React.useState([]);
  const [semId, setSemId] = React.useState(null);
  const [general, setGeneral] = React.useState([]);
  const [courses, setCourses] = React.useState([]);
  const [openCourse, setOpenCourse] = React.useState(null);
  const [courseRes, setCourseRes] = React.useState({}); // courseId -> resources[]
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    API.semesters.list().then((list) => {
      setSemesters(list);
      setSemId((cur) => cur || (list.find((s) => s.current) || list[0])?.id || null);
    }).catch(() => {});
  }, [open]);

  React.useEffect(() => {
    if (!semId) return;
    setLoading(true);
    setOpenCourse(null); setCourseRes({});
    Promise.all([
      API.resources.listUncategorized(semId).catch(() => []),
      API.courses.list(semId).catch(() => []),
    ]).then(([g, c]) => { setGeneral(g); setCourses(c); }).finally(() => setLoading(false));
  }, [semId]);

  const toggleCourse = async (id) => {
    if (openCourse === id) { setOpenCourse(null); return; }
    setOpenCourse(id);
    if (!courseRes[id]) {
      const rs = await API.resources.list(id).catch(() => []);
      setCourseRes((m) => ({ ...m, [id]: rs }));
    }
  };

  const match = (r) => !q.trim() || r.title.toLowerCase().includes(q.trim().toLowerCase());
  const genFiltered = general.filter(match);

  const ResItem = ({ r }) => (
    <button
      onClick={() => onPick(r)}
      className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[12px] text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/[0.05]"
    >
      <Icon name="FileText" size={13} className="shrink-0 text-neutral-400" />
      <span className="truncate">{r.title}</span>
    </button>
  );

  return (
    <Sheet open={open} onClose={onClose} title="Attach a resource" width={400}>
      <div className="flex flex-col gap-3 p-5">
        <Select
          value={semId || ""}
          onChange={setSemId}
          options={semesters.map((s) => ({ value: s.id, label: s.label + (s.current ? " (current)" : "") }))}
          placeholder="Select semester…"
        />

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search resources…"
          className="w-full rounded-md border border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] px-2.5 py-2 text-[12.5px] placeholder:text-neutral-400 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />

        {loading && <p className="text-[12px] text-neutral-400 text-center py-4">Loading…</p>}

        {!loading && (
          <div className="flex flex-col gap-1">
            <div className="px-1 text-[10.5px] font-semibold uppercase tracking-wider text-neutral-400">General</div>
            {genFiltered.length === 0
              ? <p className="px-2.5 py-1 text-[11.5px] text-neutral-400">No general resources.</p>
              : genFiltered.map((r) => <ResItem key={r.id} r={r} />)}

            <div className="mt-2 px-1 text-[10.5px] font-semibold uppercase tracking-wider text-neutral-400">Courses</div>
            {courses.length === 0 && <p className="px-2.5 py-1 text-[11.5px] text-neutral-400">No courses.</p>}
            {courses.map((c) => (
              <div key={c.id}>
                <button
                  onClick={() => toggleCourse(c.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[12px] font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-white/[0.05]"
                >
                  <Icon name={openCourse === c.id ? "ChevronDown" : "ChevronRight"} size={13} className="shrink-0 text-neutral-400" />
                  {c.code && <span className="font-mono text-[10.5px] text-neutral-400">{c.code}</span>}
                  <span className="truncate">{c.name}</span>
                </button>
                {openCourse === c.id && (
                  <div className="ml-4 flex flex-col gap-0.5 border-l border-neutral-200/70 dark:border-white/[0.06] pl-1">
                    {(courseRes[c.id] || []).filter(match).length === 0
                      ? <p className="px-2.5 py-1 text-[11.5px] text-neutral-400">{courseRes[c.id] ? "No resources." : "Loading…"}</p>
                      : courseRes[c.id].filter(match).map((r) => <ResItem key={r.id} r={r} />)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  );
}
