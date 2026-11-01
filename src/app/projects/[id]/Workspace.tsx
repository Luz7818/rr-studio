"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  Crown,
  ChevronRight,
  Copy,
  Download,
  Files,
  FlaskConical,
  Lightbulb,
  ListChecks,
  Mail,
  MinusCircle,
  PenLine,
  Presentation,
  ShieldCheck,
  Sigma,
  SpellCheck,
  Type,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import IconChip from "@/components/IconChip";
import type { CritiqueIntensity, CritiqueItem, Project, ResponseThread, Severity } from "@/lib/types";
import EmptyArt from "@/components/EmptyArt";
import FillBar from "@/components/FillBar";
import SegmentedControl from "@/components/SegmentedControl";
import RevisionPanel from "./RevisionPanel";

type Tab = "overview" | "critique" | "review" | "response" | "cover" | "seminar" | "revision";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "overview", label: "解析概览" },
  { key: "critique", label: "Critique 报告" },
  { key: "review", label: "模拟审稿" },
  { key: "response", label: "回复审稿人" },
  { key: "cover", label: "Cover Letter" },
  { key: "seminar", label: "组会汇报" },
  { key: "revision", label: "修改稿对照" },
];

const SEVERITY_LABEL: Record<Severity, string> = { major: "Major", minor: "Minor", suggestion: "建议" };
const SEVERITY_STYLE: Record<Severity, string> = {
  major: "border border-red-200 bg-red-50 text-red-700",
  minor: "border border-amber-200 bg-amber-50 text-amber-700",
  suggestion: "border border-line bg-band text-ink-soft",
};
const SEVERITY_ICON: Record<Severity, LucideIcon> = {
  major: AlertCircle,
  minor: MinusCircle,
  suggestion: Lightbulb,
};
const CATEGORY_LABEL: Record<string, string> = {
  logic: "逻辑",
  expression: "表达",
  grammar: "语法",
  style: "风格",
};
const CATEGORY_ICON: Record<string, LucideIcon> = {
  logic: Brain,
  expression: Type,
  grammar: SpellCheck,
  style: PenLine,
};
/** 三位审稿人的形象图标(与 personaLabel 对应) */
const PERSONA_ICON: Record<string, LucideIcon> = {
  methodologist: FlaskConical,
  statistician: Sigma,
  "domain-expert": Crown,
};
const REC_LABEL: Record<string, string> = {
  accept: "Accept",
  minor_revision: "Minor Revision",
  major_revision: "Major Revision",
  reject: "Reject",
};
const REC_STYLE: Record<string, string> = {
  accept: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  minor_revision: "border border-lime-200 bg-lime-50 text-lime-700",
  major_revision: "border border-amber-200 bg-amber-50 text-amber-700",
  reject: "border border-red-200 bg-red-50 text-red-700",
};
const STATUS_LABEL: Record<Project["status"], string> = {
  uploaded: "已解析",
  critiqued: "Critique 完成",
  reviewed: "审稿完成",
};
const STATUS_STYLE: Record<Project["status"], string> = {
  uploaded: "border-line bg-band text-ink-soft",
  critiqued: "border border-amber-200 bg-amber-50 text-amber-700",
  reviewed: "border border-emerald-200 bg-emerald-50 text-emerald-700",
};

function CopyButton({ text, label = "复制" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    },
    [],
  );
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          if (timerRef.current !== null) clearTimeout(timerRef.current);
          timerRef.current = window.setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
      className={`press inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition ${
        copied
          ? "border-accent/40 bg-accent-soft text-accent"
          : "border-line text-ink-soft hover:border-accent/40 hover:text-accent"
      }`}
    >
      {copied ? (
        <Check key="copied" className="icon-pop h-3 w-3" strokeWidth={2.5} />
      ) : (
        <Copy className="h-3 w-3" strokeWidth={1.75} />
      )}
      {copied ? "已复制" : label}
    </button>
  );
}

/** 审稿意见引用:超长意见折叠为 4 行,展开/收起不丢上下文 */
function CommentQuote({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > 240;
  return (
    <blockquote className="mt-3 border-l-2 border-accent/25 pl-3 text-[13px] leading-relaxed text-ink-soft transition-colors duration-200 group-hover/thread:border-accent/60">
      <span className={long && !expanded ? "line-clamp-4 block" : undefined}>{text}</span>
      {long && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-0.5 text-xs text-accent transition hover:opacity-80"
        >
          {expanded ? "收起" : "展开全文"}
        </button>
      )}
    </blockquote>
  );
}

function StepBadge({
  done,
  label,
  onClick,
  current = false,
}: {
  done: boolean;
  label: string;
  /** 已完成的步骤可点击直跳对应页签 */
  onClick?: () => void;
  current?: boolean;
}) {
  const tone = done ? "text-accent" : "text-ink-faint";
  const state = current ? "bg-accent-soft/70 font-medium" : "";
  // key 随 done 变化重挂载:步骤刚完成时 Check 以 icon-pop 弹入一次(低频时刻的惊喜预算)
  const check = (
    <Check key={done ? "done" : "pending"} className={`h-3.5 w-3.5 ${done ? "icon-pop" : ""}`} strokeWidth={2} />
  );
  if (done && onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`press inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs transition hover:bg-accent-soft/70 ${tone} ${state}`}
      >
        {check}
        {label}
      </button>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${tone} ${state}`}>
      {done ? check : <span className="h-3.5 w-3.5 rounded-full border border-line" aria-hidden />}
      {label}
    </span>
  );
}

function EmptyState({
  hint,
  action,
  actionLabel,
  onAction,
  disabled,
}: {
  hint: string;
  action?: string;
  actionLabel?: string;
  onAction?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line py-10 text-center">
      <EmptyArt />
      <p className="text-sm text-ink-soft">{hint}</p>
      {action && <p className="mt-1 text-xs text-ink-faint">{action}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          disabled={disabled}
          className="btn-primary press group mt-4 rounded-full bg-accent px-5 py-2 text-sm font-medium text-white transition hover:bg-accent/90 disabled:opacity-50"
        >
          {actionLabel}
          <ArrowRight className="ml-1 inline h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2} aria-hidden />
        </button>
      )}
    </div>
  );
}

export default function Workspace() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const [llmConfigured, setLlmConfigured] = useState(true);
  // 页签写入 ?tab= 持久化:刷新/回退/分享不丢位置(无效值回退解析概览)
  const paramTab = searchParams.get("tab");
  const [tab, setTab] = useState<Tab>(() =>
    TABS.some((x) => x.key === paramTab) ? (paramTab as Tab) : "overview",
  );
  const switchTab = (t: Tab, motion: boolean) => {
    setTabMotion(motion);
    setTab(t);
  };
  // 页签变化统一同步到 ?tab=:刷新/回退/分享不丢位置
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("tab") !== tab) {
      url.searchParams.set("tab", tab);
      window.history.replaceState(null, "", url);
    }
  }, [tab]);
  /** 本次切签是否由指针触发:键盘(数字键 1–7)切签直跳不加动画(DESIGN 动效纪律) */
  const [tabMotion, setTabMotion] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<"all" | Severity>("all");
  const [seminarDuration, setSeminarDuration] = useState<5 | 10 | 15>(10);
  const [seminarLang, setSeminarLang] = useState<"zh" | "en">("zh");
  /** Critique 口径:重新生成时随请求发送;已生成的报告记录自己用过的口径 */
  const [intensity, setIntensity] = useState<CritiqueIntensity>("balanced");
  const [batch, setBatch] = useState<{ total: number; done: number } | null>(null);
  /** 聚焦时的标题快照:失焦时对比,避免 onChange 已改 state 导致误判「未变化」 */
  const titleOnFocus = useRef("");
  /** 最近一次自动保存成功的线程(1.6s 后淡出) */
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  /** 标题失焦自动保存的瞬时反馈 */
  const [titleSaved, setTitleSaved] = useState(false);
  /** 组会 Q&A 已展开参考要点的题号(默认隐藏,先自己答) */
  const [revealedQA, setRevealedQA] = useState<Set<number>>(new Set());
  /** 文献对标自定义检索词(分号分隔);首次载入已有时预填,便于增删而非从零写 */
  const [litQuery, setLitQuery] = useState("");
  /** 回复线程状态筛选:定位还没打磨完/还没裁决的意见 */
  const [threadFilter, setThreadFilter] = useState<"all" | "undrafted" | "undecided">("all");
  const litPrefilled = useRef(false);
  useEffect(() => {
    if (!litPrefilled.current && project?.literature) {
      litPrefilled.current = true;
      setLitQuery(project.literature.queries.join("; "));
    }
  }, [project?.literature]);

  // 载入结果统一应用(load 与首挂载共用;deps 全为稳定 setState,满足 React Compiler 推断)
  const applyLoaded = useCallback(
    (data: { project?: Project | null; llmConfigured?: boolean }) => {
      setProject(data.project ?? null);
      setLlmConfigured(Boolean(data.llmConfigured));
      setIntensity(data.project?.critique?.intensity ?? "balanced");
      if (data.project?.seminar) {
        setSeminarDuration(data.project.seminar.durationMin as 5 | 10 | 15);
        setSeminarLang(data.project.seminar.language);
      }
    },
    [setProject, setLlmConfigured, setIntensity, setSeminarDuration, setSeminarLang],
  );

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "加载失败");
      applyLoaded(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    }
  }, [id, applyLoaded]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  // 数字键 1-7 直跳页签;输入类控件聚焦或带修饰键时忽略
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= TABS.length) {
        setTabMotion(false);
        setTab(TABS[n - 1].key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // 浏览器标签页标题跟随稿件名
  const projectTitle = project?.title;
  useEffect(() => {
    document.title = projectTitle ? `${projectTitle} · R&R Studio` : "R&R Studio — 投稿加速流水线";
    return () => {
      document.title = "R&R Studio — 投稿加速流水线";
    };
  }, [projectTitle]);

  const runPipeline = async (
    step: "critique" | "review" | "cover-letter" | "seminar" | "literature",
    after?: Tab,
    body?: Record<string, unknown>,
  ) => {
    setBusy(step);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${id}/${step}`, {
        method: "POST",
        ...(body
          ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
          : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "执行失败");
      setProject(data.project);
      if (after) switchTab(after, true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "执行失败");
    } finally {
      setBusy(null);
    }
  };

  const patchProject = async (fields: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存失败");
      setProject(data.project);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败,请检查网络后重试");
    }
  };

  const toggleAdopted = (item: CritiqueItem, checked: boolean) => {
    if (!project?.critique) return;
    const adopted = project.critique.items.filter((i) => (i.id === item.id ? checked : i.adopted)).map((i) => i.id);
    setProject({
      ...project,
      critique: { ...project.critique, items: project.critique.items.map((i) => (i.id === item.id ? { ...i, adopted: checked } : i)) },
    });
    void patchProject({ adopted });
  };

  const updateThreadLocal = (commentId: string, patch: Partial<ResponseThread>) => {
    setProject((prev) =>
      prev
        ? {
            ...prev,
            responses: (prev.responses ?? []).map((t) =>
              t.commentId === commentId ? { ...t, ...patch } : t,
            ),
          }
        : prev,
    );
  };

  const saveThread = async (thread: ResponseThread) => {
    try {
      const res = await fetch(`/api/projects/${id}/responses`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threads: [thread] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存失败");
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败,请检查网络后重试");
      return;
    }
    setSavedIds((prev) => new Set(prev).add(thread.commentId));
    setTimeout(() => {
      setSavedIds((prev) => {
        const next = new Set(prev);
        next.delete(thread.commentId);
        return next;
      });
    }, 1600);
  };

  /** 打磨单条回复;返回是否成功,批量流程据此汇总失败数 */
  const polishThread = async (commentId: string): Promise<boolean> => {
    setBusy(`polish-${commentId}`);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "打磨失败");
      updateThreadLocal(commentId, { polished: data.thread.polished });
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "打磨失败");
      return false;
    } finally {
      setBusy(null);
    }
  };

  /** AI 从回复内容中批量提取「修改承诺」 */
  const extractCommitments = async () => {
    setBusy("commitments");
    setError(null);
    try {
      const res = await fetch(`/api/projects/${id}/responses/commitments`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "提取失败");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "提取失败");
    } finally {
      setBusy(null);
    }
  };

  /** 裁决某条审稿意见是否成立 */
  const setVerdict = async (thread: ResponseThread, verdict: "valid" | "invalid" | null) => {
    updateThreadLocal(thread.commentId, { verdict: verdict ?? undefined });
    await saveThread({ ...thread, verdict: verdict ?? undefined });
  };

  /** 顺序打磨所有未完成的回复(尊重供应商限速),显示进度并汇总失败数 */
  const polishAllPending = async () => {
    const pending = (project?.responses ?? []).filter((t) => !t.polished.trim());
    if (pending.length === 0) return;
    setBatch({ total: pending.length, done: 0 });
    setError(null);
    let failed = 0;
    for (let i = 0; i < pending.length; i++) {
      const ok = await polishThread(pending[i].commentId);
      if (!ok) failed++;
      setBatch({ total: pending.length, done: i + 1 });
    }
    setBatch(null);
    if (failed > 0) {
      setError(`批量打磨完成:${pending.length - failed}/${pending.length} 成功。失败多为供应商限速,稍后可对单条重试。`);
    }
  };

  if (error && !project) {
    return <p className="py-20 text-center text-red-600">{error}</p>;
  }
  if (!project) {
    return (
      <div className="space-y-4 py-6">
        <div className="skeleton h-9 w-2/3 rounded-full bg-band" />
        <div className="skeleton h-6 w-1/2 rounded-full bg-band" />
        <div className="skeleton h-40 w-full rounded-2xl bg-band" />
      </div>
    );
  }

  const critiqueItems = project.critique?.items.filter((i) => severityFilter === "all" || i.severity === severityFilter) ?? [];
  const maxSectionChars = Math.max(1, ...project.sections.map((s) => s.chars));
  const threads = project.responses ?? [];
  const allResponsesText = threads
    .filter((t) => t.polished.trim() || t.draft.trim())
    .map(
      (t) =>
        `${t.reviewer} (${t.type === "major" ? "Major" : "Minor"}):\n${t.commentText}\n\n回复:\n${t.polished.trim() || t.draft.trim()}`,
    )
    .join("\n\n————————\n\n");
  /** Critique 报告的 Markdown 版,供粘贴进笔记/文档 */
  const critiqueMarkdown = project.critique
    ? [
        `# Critique 报告 — ${project.title}`,
        ...project.critique.items.map(
          (i) =>
            `\n## [${SEVERITY_LABEL[i.severity]} · ${CATEGORY_LABEL[i.category] ?? i.category}] ${i.section}\n${i.quote ? `> ${i.quote}\n` : ""}${i.comment}\n\n建议:${i.suggestion}`,
        ),
      ].join("\n")
    : "";
  const visibleThreads =
    threadFilter === "undrafted"
      ? threads.filter((t) => !t.polished.trim())
      : threadFilter === "undecided"
        ? threads.filter((t) => !t.verdict)
        : threads;

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/"
          className="group inline-flex items-center gap-1 text-[13px] text-ink-faint transition hover:text-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" strokeWidth={1.75} />
          返回列表
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input
            value={project.title}
            onChange={(e) => setProject({ ...project, title: e.target.value })}
            onFocus={(e) => {
              titleOnFocus.current = e.target.value;
            }}
            onBlur={async (e) => {
              const v = e.target.value.trim();
              if (v && v !== titleOnFocus.current) {
                await patchProject({ title: v });
                setTitleSaved(true);
                setTimeout(() => setTitleSaved(false), 1600);
              }
            }}
            aria-label="稿件标题"
            className="min-w-0 flex-1 rounded-2xl border border-transparent px-2 py-1 text-xl font-semibold tracking-tight transition hover:border-line focus:border-accent/50 focus:outline-none"
          />
          {titleSaved && <span className="rise-in text-xs text-emerald-600">已保存</span>}
          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_STYLE[project.status] ?? "border-line bg-band text-ink-soft"}`}>
            {STATUS_LABEL[project.status] ?? project.status}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(
            [
              { key: "overview", label: "上传解析", done: true },
              { key: "critique", label: "Critique", done: Boolean(project.critique) },
              { key: "review", label: "模拟审稿", done: Boolean(project.reviews?.length) },
              { key: "response", label: "回复审稿人", done: threads.some((t) => t.draft || t.polished) },
              { key: "cover", label: "Cover Letter", done: Boolean(project.coverLetter) },
            ] as Array<{ key: Tab; label: string; done: boolean }>
          ).map((st, i) => (
            <Fragment key={st.key}>
              {i > 0 && (
                <span
                  aria-hidden
                  className={`mx-0.5 h-px w-4 ${st.done ? "bg-accent/40" : "bg-line"}`}
                />
              )}
              <StepBadge
                done={st.done}
                label={st.label}
                current={tab === st.key}
                onClick={() => switchTab(st.key, true)}
              />
            </Fragment>
          ))}
        </div>
      </div>

      {!llmConfigured && (
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50 px-4 py-2.5 text-[13px] text-amber-800">
          <b>演示模式</b>:未配置 <code>LLM_API_KEY</code>,以下内容由占位示例生成。配置后点击各步骤的「重新生成」即可获得真实结果。
        </div>
      )}
      {error && (
        <div role="alert" className="rise-in rounded-2xl border border-red-200/60 bg-red-50 px-4 py-2.5 text-[13px] text-red-700">{error}</div>
      )}

      {/* 页签条吸顶:长内容滚动时仍可切签;移动端让位 h-14 顶栏 */}
      <div className="sticky top-14 z-20 -mx-1 rounded-b-2xl bg-white/65 px-1 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_12px_32px_-20px_rgba(23,23,28,0.18)] backdrop-blur-xl lg:top-0">
        <div className="no-scrollbar min-w-0 max-w-full flex-1 overflow-x-auto">
          <SegmentedControl
            value={tab}
            onChange={(k) => switchTab(k, true)}
            size="md"
            ariaLabel="工作台页签"
            options={TABS.map((t, i) => ({
              value: t.key,
              title: `快捷键 ${i + 1}`,
              label: (
                <>
                  {t.label}
                  {t.key === "critique" && project.critique ? ` (${project.critique.items.length})` : ""}
                  {t.key === "review" && project.reviews?.length ? ` (${project.reviews.length})` : ""}
                  {t.key === "response" && threads.length ? ` (${threads.length})` : ""}
                </>
              ),
            }))}
          />
        </div>
      </div>

      {/* key 挂在页签上:指针切签轻过渡;键盘切签 data-still 直显 */}
      <div key={tab} className="rise-in" data-still={!tabMotion}>
      {tab === "overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="panel rounded-xl border border-line bg-white p-5">
              <h3 className="flex items-center gap-2 text-[13px] font-semibold">
                <IconChip icon={ShieldCheck} tone="emerald" size="sm" />
                脱敏报告
              </h3>
              <p className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-semibold text-emerald-600">{project.sanitize.redactions}</span>
                <span className="text-[13px] text-ink-soft">处敏感信息已替换为占位符</span>
              </p>
              <ul className="mt-3 space-y-1 text-[13px] text-ink-soft">
                {Object.entries(project.sanitize.details).length === 0 && <li className="text-ink-faint">未发现匹配的敏感信息</li>}
                {Object.entries(project.sanitize.details).map(([k, v]) => (
                  <li key={k} className="flex justify-between">
                    <span>{k}</span>
                    <span className="font-medium">{v}</span>
                  </li>
                ))}
              </ul>
              {project.sanitize.removedAuthorBlock && (
                <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  标题页(作者/单位区)已整体排除,未进入分析与存储
                </p>
              )}
            </div>
            <div className="panel rounded-xl border border-line bg-white p-5">
              <h3 className="flex items-center gap-2 text-[13px] font-semibold">
                <IconChip icon={Files} tone="ink" size="sm" />
                稿件信息
              </h3>
              <dl className="mt-3 space-y-3 text-[13px]">
                <div>
                  <dt className="text-xs text-ink-faint">源文件</dt>
                  <dd>{project.meta.fileName ?? "粘贴文本"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-faint">目标期刊</dt>
                  <dd>
                    <input
                      value={project.meta.targetJournal ?? ""}
                      placeholder="如 IEEE Transactions on ITS"
                      aria-label="目标期刊"
                      onChange={(e) => setProject({ ...project, meta: { ...project.meta, targetJournal: e.target.value } })}
                      onBlur={(e) => void patchProject({ targetJournal: e.target.value })}
                      className="field w-full rounded-full px-3.5 py-2 text-[13px] outline-none"
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-faint">上传时间</dt>
                  <dd>{new Date(project.createdAt).toLocaleString("zh-CN")}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="panel rounded-xl border border-line bg-white p-5">
            <h3 className="flex items-center gap-2 text-[13px] font-semibold">
              <IconChip icon={ListChecks} size="sm" />
              章节结构({project.sections.length})
            </h3>
            <ul className="mt-3 divide-y divide-line text-[13px]">
              {project.sections.map((s) => (
                <li key={s.id} className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2 transition hover:bg-band">
                  <span className="w-24 shrink-0 truncate font-medium text-ink sm:w-36">{s.heading}</span>
                  <FillBar
                    pct={Math.max(3, (s.chars / maxSectionChars) * 100)}
                    className="h-1 flex-1"
                    innerClassName="bg-accent/60"
                  />
                  <span className="w-14 shrink-0 text-right text-xs text-ink-faint">{s.chars} 字符</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <SegmentedControl
              value={intensity}
              onChange={setIntensity}
              ariaLabel="Critique 口径"
              options={[
                { value: "strict", label: "苛刻", title: "顶刊最挑剔审稿人:每节 5–8 条,不放过边缘问题" },
                { value: "balanced", label: "均衡" },
                { value: "gentle", label: "温和", title: "只报真正影响录用的 1–3 条高信号问题" },
              ]}
            />
            <button
              onClick={() => void runPipeline("critique", "critique", { intensity })}
              disabled={busy !== null}
              className="btn-primary press rounded-full bg-accent px-6 py-2.5 text-[13px] font-medium text-white transition hover:bg-accent/90 disabled:opacity-50"
            >
              {busy === "critique" ? (
                <>
                  <span className="spinner mr-1.5" aria-hidden />
                  逐段分析中…
                </>
              ) : project.critique ? (
                "重新生成 Critique 报告"
              ) : (
                "① 生成 Critique 报告"
              )}
            </button>
            <button
              onClick={() => void runPipeline("review", "review")}
              disabled={busy !== null}
              className="btn-dark press rounded-full bg-ink px-6 py-2.5 text-[13px] font-medium text-white transition hover:bg-ink/90 disabled:opacity-50"
            >
              {busy === "review" ? (
                <>
                  <span className="spinner mr-1.5" aria-hidden />
                  三位审稿人审稿中…
                </>
              ) : project.reviews?.length ? (
                "重新模拟审稿"
              ) : (
                "② 模拟审稿(3 位审稿人)"
              )}
            </button>
          </div>
        </div>
      )}

      {tab === "critique" && (
        <div className="space-y-3">
          {project.critique && (
            <div className="panel flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3">
              <div className="no-scrollbar min-w-0 max-w-full flex-1 overflow-x-auto">
                <SegmentedControl
                  value={severityFilter}
                  onChange={setSeverityFilter}
                  ariaLabel="按严重程度筛选"
                  options={(["all", "major", "minor", "suggestion"] as const).map((f) => {
                    const count =
                      f === "all"
                        ? project.critique!.items.length
                        : project.critique!.items.filter((i) => i.severity === f).length;
                    return {
                      value: f,
                      label: (
                        <>
                          {f === "all" ? "全部" : SEVERITY_LABEL[f]}
                          {count > 0 && <span className="ml-1 text-xs text-ink-faint">{count}</span>}
                        </>
                      ),
                    };
                  })}
                />
              </div>
              <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                <span className="hidden text-xs text-ink-faint sm:inline">口径</span>
                <div className="no-scrollbar min-w-0 max-w-full flex-1 overflow-x-auto">
                  <SegmentedControl
                    value={intensity}
                    onChange={setIntensity}
                    ariaLabel="Critique 口径"
                    options={[
                      { value: "strict", label: "苛刻", title: "顶刊最挑剔审稿人:每节 5–8 条,不放过边缘问题" },
                      { value: "balanced", label: "均衡" },
                      { value: "gentle", label: "温和", title: "只报真正影响录用的 1–3 条高信号问题" },
                    ]}
                  />
                </div>
                <button
                  onClick={() => void runPipeline("critique", undefined, { intensity })}
                  disabled={busy !== null}
                  className="press rounded-full border border-accent/30 px-4 py-1.5 text-[13px] text-accent transition hover:bg-accent-soft disabled:opacity-50"
                >
                  {busy === "critique" ? (
                    <>
                      <span className="spinner mr-1.5" aria-hidden />
                      分析中…
                    </>
                  ) : (
                    "重新生成"
                  )}
                </button>
                <CopyButton text={critiqueMarkdown} label="复制 Markdown" />
                <a
                  href={`/api/projects/${id}/export/critique`}
                  className="press group inline-flex items-center gap-1 rounded-full border border-line px-3.5 py-1.5 text-xs text-ink-soft transition hover:border-accent/40 hover:text-accent"
                >
                  <Download className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-y-0.5" strokeWidth={1.75} />
                  导出 Word 报告
                </a>
              </div>
            </div>
          )}

          {!project.critique ? (
            <EmptyState
              hint="尚未生成 Critique 报告。"
              action="逐段从逻辑、表达、语法、风格四个维度给出可直接采纳的修改建议。"
              actionLabel="生成 Critique 报告"
              onAction={() => void runPipeline("critique", "critique", { intensity })}
              disabled={busy !== null}
            />
          ) : (
            <>
              {project.critique.errors?.map((err) => (
                <p key={err} className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  部分章节分析失败:{err}
                </p>
              ))}
              <ul className="panel divide-y divide-line rounded-xl border border-line bg-white">
                {critiqueItems.map((item, i) => {
                  const SevIcon = SEVERITY_ICON[item.severity];
                  const CatIcon = CATEGORY_ICON[item.category] ?? Brain;
                  return (
                  <li
                    key={item.id}
                    style={{ animationDelay: `${Math.min(i * 30, 240)}ms` }}
                    className={`stagger group/crit p-4 transition hover:bg-band/40 ${item.adopted ? "bg-emerald-50/40" : ""}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-6 shrink-0 text-xs font-medium tabular-nums text-ink-faint">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${SEVERITY_STYLE[item.severity]}`}>
                        <SevIcon className="h-3 w-3" strokeWidth={2} aria-hidden />
                        {SEVERITY_LABEL[item.severity]}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] text-accent">
                        <CatIcon className="h-3 w-3" strokeWidth={1.75} aria-hidden />
                        {CATEGORY_LABEL[item.category] ?? item.category}
                      </span>
                      <span className="text-xs text-ink-faint">{item.section}</span>
                      <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-xs text-ink-soft transition hover:text-ink">
                        <input
                          type="checkbox"
                          checked={item.adopted}
                          onChange={(e) => toggleAdopted(item, e.target.checked)}
                          className="accent-emerald-600"
                        />
                        已采纳
                      </label>
                    </div>
                    {item.quote && (
                      <p className="mt-2.5 border-l-2 border-line pl-3 text-[13px] italic text-ink-soft transition-colors duration-200 group-hover/crit:border-accent/50">
                        “{item.quote}”
                      </p>
                    )}
                    <p className="mt-2 text-[13px] leading-relaxed text-ink">{item.comment}</p>
                    <p className="mt-2 rounded-xl bg-accent-soft px-3 py-2 text-[13px] leading-relaxed text-accent">{item.suggestion}</p>
                  </li>
                  );
                })}
              </ul>
              {critiqueItems.length === 0 && <p className="py-8 text-center text-[13px] text-ink-faint">该严重程度下暂无条目。</p>}
            </>
          )}
        </div>
      )}

      {tab === "review" && (
        <div className="space-y-3">
          <div className="panel rounded-xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-2">
                <IconChip icon={BookOpen} size="sm" />
                <div className="min-w-0">
                <h3 className="text-[13px] font-semibold">文献对标(审稿依据)</h3>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-ink-faint">
                  检索近三年真实文献作为审稿依据:审稿人讨论文献缺口时只引用这些真实论文,
                  杜绝编造引用。来源 OpenAlex / Semantic Scholar。
                </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => void runPipeline("literature")}
                  disabled={busy !== null}
                  className="press rounded-full border border-accent/30 px-4 py-1.5 text-xs font-medium text-accent transition hover:bg-accent-soft disabled:opacity-50"
                >
                  {busy === "literature" ? "检索中…" : project.literature ? "重新检索" : "获取真实文献对标"}
                </button>
                <button
                  onClick={() => void runPipeline("review")}
                  disabled={busy !== null}
                  className="press rounded-full border border-line px-3.5 py-1.5 text-xs text-ink-soft transition hover:bg-band disabled:opacity-50"
                >
                  {busy === "review" ? "审稿中…" : "重新模拟审稿"}
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
              <input
                value={litQuery}
                onChange={(e) => setLitQuery(e.target.value)}
                placeholder="自定义检索词(用分号;分隔,留空则自动从稿件提取)"
                className="field min-w-56 flex-1 rounded-full px-3.5 py-1.5 text-xs outline-none"
              />
              <button
                onClick={() =>
                  void runPipeline("literature", undefined, {
                    queries: litQuery.split(/[;;\n；]/).map((s) => s.trim()).filter(Boolean),
                  })
                }
                disabled={busy !== null || !litQuery.trim()}
                className="press shrink-0 rounded-full border border-accent/30 px-3.5 py-1.5 text-xs font-medium text-accent transition hover:bg-accent-soft disabled:opacity-50"
              >
                {busy === "literature" ? "检索中…" : "按这些检索词检索"}
              </button>
            </div>
            {project.literature && (
              <div className="mt-3 border-t border-line pt-3">
                <ul className="space-y-0.5">
                  {project.literature.papers.slice(0, 6).map((p, i) => (
                    <li key={p.url}>
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex flex-wrap items-baseline gap-2 rounded-full px-2.5 py-1.5 text-xs transition hover:bg-band"
                      >
                        <span className="w-4 shrink-0 text-right font-medium text-ink-faint transition group-hover:text-accent">
                          {i + 1}
                        </span>
                        <span className="font-medium text-ink transition group-hover:text-accent">
                          {p.title}
                        </span>
                        <span className="text-ink-faint">
                          {p.venue || "venue n/a"} · {p.year ?? "n/a"} · 被引 {p.citedBy}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 px-2 text-[11px] text-ink-faint">
                  来源 {project.literature.source} · 共 {project.literature.papers.length} 篇
                  (检索词:{project.literature.queries.join(" / ").slice(0, 90)})
                </p>
              </div>
            )}
          </div>
          {!project.reviews?.length ? (
            <EmptyState
              hint="尚未模拟审稿。"
              action="点击「重新模拟审稿」,三位 AI 审稿人将分别给出意见。"
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {project.reviews.map((r, i) => (
                <div
                  key={r.persona}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className="stagger flex flex-col panel rounded-xl border border-line bg-white p-5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <IconChip icon={PERSONA_ICON[r.persona] ?? FlaskConical} size="sm" />
                      <h3 className="min-w-0 truncate text-[13px] font-semibold">{r.label}</h3>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${REC_STYLE[r.recommendation]}`}>
                      {REC_LABEL[r.recommendation] ?? r.recommendation}
                    </span>
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">{r.overall}</p>
                  <div className="mt-4 space-y-2 text-[13px]">
                    {r.major.map((c) => (
                      <div key={c.id} className="border-l-2 border-red-300 pl-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-red-600">Major</p>
                        <p className="mt-0.5 leading-relaxed text-ink">{c.text}</p>
                      </div>
                    ))}
                    {r.minor.map((c) => (
                      <div key={c.id} className="border-l-2 border-amber-300 pl-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">Minor</p>
                        <p className="mt-0.5 leading-relaxed text-ink">{c.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "response" && (
        <div className="space-y-3">
          {threads.length > 0 && (
            <div className="panel flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-line bg-white px-4 py-3">
              <span className="text-[13px] text-ink-soft">
                已打磨 <b className="font-medium text-ink">{threads.filter((t) => t.polished.trim()).length}</b>/{threads.length} 条
              </span>
              <FillBar
                pct={(threads.filter((t) => t.polished.trim()).length / threads.length) * 100}
                className="h-1 w-20"
              />
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <button
                  onClick={() => void polishAllPending()}
                  aria-live="polite"
                  disabled={busy !== null || batch !== null}
                  className="btn-primary press rounded-full bg-accent px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-accent/90 disabled:opacity-50"
                >
                  {batch ? `批量打磨中 ${batch.done}/${batch.total}…` : `批量打磨未完成 (${threads.filter((t) => !t.polished.trim()).length})`}
                </button>
                <button
                  onClick={() => void extractCommitments()}
                  disabled={busy !== null || batch !== null}
                  className="press rounded-full border border-accent/30 px-3.5 py-1.5 text-xs font-medium text-accent transition hover:bg-accent-soft disabled:opacity-50"
                >
                  {busy === "commitments" ? "提取中…" : "AI 提取修改承诺"}
                </button>
                <CopyButton text={allResponsesText} label="复制全部回复" />
                <a
                  href={`/api/projects/${id}/export/response-letter`}
                  className="press group inline-flex items-center gap-1 rounded-full border border-line px-3.5 py-1.5 text-xs text-ink-soft transition hover:border-accent/40 hover:text-accent"
                >
                  <Download className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-y-0.5" strokeWidth={1.75} />
                  导出 Word Response Letter
                </a>
              </div>
              <SegmentedControl
                value={threadFilter}
                onChange={setThreadFilter}
                ariaLabel="按状态筛选回复线程"
                className="w-full border-t border-line pt-2.5 sm:w-auto sm:border-t-0 sm:pt-0"
                options={[
                  { value: "all", label: `全部 (${threads.length})` },
                  { value: "undrafted", label: `未打磨 (${threads.filter((t) => !t.polished.trim()).length})` },
                  { value: "undecided", label: `未裁决 (${threads.filter((t) => !t.verdict).length})` },
                ]}
              />
            </div>
          )}
          {!project.reviews?.length ? (
            <EmptyState
              hint="请先完成「模拟审稿」。"
              action="三位审稿人的每条意见将在这里变成回复线程,可 AI 打磨成正式回复。"
              actionLabel="去模拟审稿"
              onAction={() => switchTab("review", true)}
            />
          ) : visibleThreads.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-ink-faint">
              {threads.length === 0 ? "暂无待回复意见。" : "该筛选下暂无线程,切回「全部」查看。"}
            </p>
          ) : (
            <div className="panel divide-y divide-line rounded-xl border border-line bg-white">
              {visibleThreads.map((t, i) => {
                const rid = /#(\d+)/.exec(t.reviewer)?.[1];
                return (
                <div
                  key={t.commentId}
                  style={{ animationDelay: `${Math.min(i * 30, 240)}ms` }}
                  className="stagger group/thread p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      aria-hidden
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft text-[10px] font-semibold text-accent"
                    >
                      {rid ? `R${rid}` : "R"}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${t.type === "major" ? "border border-red-200 bg-red-50 text-red-700" : "border border-amber-200 bg-amber-50 text-amber-700"}`}>
                      {t.type === "major" ? (
                        <AlertCircle className="h-3 w-3" strokeWidth={2} aria-hidden />
                      ) : (
                        <MinusCircle className="h-3 w-3" strokeWidth={2} aria-hidden />
                      )}
                      {t.type === "major" ? "Major" : "Minor"}
                    </span>
                    <span className="text-[13px] font-medium">{t.reviewer}</span>
                    {savedIds.has(t.commentId) && (
                      <span className="rise-in text-xs text-emerald-600">已保存</span>
                    )}
                    <div className="ml-auto flex gap-2">
                      <CopyButton text={t.polished || t.draft} label={t.polished ? "复制打磨稿" : "复制草稿"} />
                      <button
                        onClick={() => void polishThread(t.commentId)}
                        disabled={busy !== null}
                        className="btn-primary press rounded-full bg-accent px-3.5 py-1 text-xs font-medium text-white transition hover:bg-accent/90 disabled:opacity-50"
                      >
                        {busy === `polish-${t.commentId}` ? "打磨中…" : t.polished ? "重新打磨" : "AI 打磨回复"}
                      </button>
                    </div>
                  </div>
                  <CommentQuote text={t.commentText} />
                  <textarea
                    value={t.draft}
                    onChange={(e) => updateThreadLocal(t.commentId, { draft: e.target.value })}
                    onBlur={() => void saveThread(t)}
                    placeholder="先写下你的回复要点(数据、论据、修改位置)…失焦自动保存,AI 打磨时会保留你的事实与数字"
                    className="field mt-3 min-h-20 w-full resize-y rounded-xl p-3 text-[13px] outline-none"
                  />
                  {t.polished && (
                    <div className="mt-3 rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">AI 打磨稿 · 可直接粘贴进 Response Letter</p>
                      <pre className="mt-1.5 whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-ink">{t.polished}</pre>
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                    <span className="text-xs text-ink-faint">意见裁决:</span>
                    {([["valid", "有道理"], ["invalid", "不成立"]] as const).map(([v, label]) => (
                      <button
                        key={v}
                        onClick={() => void setVerdict(t, t.verdict === v ? null : v)}
                        className={`press inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition ${
                          t.verdict === v
                            ? v === "valid"
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : "border-red-300 bg-red-50 text-red-700"
                            : "border-line text-ink-soft hover:text-ink"
                        }`}
                      >
                        {v === "valid" ? <Check className="h-3 w-3" strokeWidth={2} /> : <X className="h-3 w-3" strokeWidth={2} />}
                        {label}
                      </button>
                    ))}
                    <input
                      value={t.commitment ?? ""}
                      onChange={(e) => updateThreadLocal(t.commentId, { commitment: e.target.value })}
                      onBlur={() => void saveThread(t)}
                      placeholder="修改承诺:答应修改稿件的哪里、改什么(供承诺核查用)"
                      className="field ml-auto min-w-56 flex-1 rounded-full px-3.5 py-1.5 text-xs outline-none"
                    />
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "cover" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => void runPipeline("cover-letter")}
              disabled={busy !== null}
              className="btn-primary press rounded-full bg-accent px-5 py-2 text-[13px] font-medium text-white transition hover:bg-accent/90 disabled:opacity-50"
            >
              {busy === "cover-letter" ? (
                <>
                  <span className="spinner mr-1.5" aria-hidden />
                  生成中…
                </>
              ) : project.coverLetter ? (
                "重新生成"
              ) : (
                "生成 Cover Letter"
              )}
            </button>
          </div>
          {!project.coverLetter ? (
            <EmptyState
              hint="尚未生成 Cover Letter。"
              action="将基于标题、摘要与结论自动撰写投稿信。"
              actionLabel="生成 Cover Letter"
              onAction={() => void runPipeline("cover-letter")}
              disabled={busy !== null}
            />
          ) : (
            <div className="panel rounded-xl border border-line bg-white p-6 sm:p-8">
              <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
                <p className="flex items-center gap-2 text-[13px] font-semibold tracking-tight">
                  <IconChip icon={Mail} size="sm" />
                  Cover Letter Draft
                </p>
                <div className="flex items-center gap-2">
                  <CopyButton text={project.coverLetter.content} label="复制全文" />
                  <a
                    href={`/api/projects/${id}/export/cover-letter`}
                    className="press group inline-flex items-center gap-1 rounded-full border border-line px-3.5 py-1.5 text-xs text-ink-soft transition hover:border-accent/40 hover:text-accent"
                  >
                    <Download className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-y-0.5" strokeWidth={1.75} />
                    导出 Word
                  </a>
                </div>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-[1.9] text-ink">{project.coverLetter.content}</pre>
              <p className="mt-5 border-t border-line pt-3 text-xs text-ink-faint">发送前请替换 [方括号] 中的占位信息,并核对期刊对 Cover Letter 的具体要求。</p>
            </div>
          )}
        </div>
      )}

      {tab === "seminar" && (
        <div className="space-y-3">
          <div className="panel flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white p-4">
            <IconChip icon={Presentation} size="sm" />
            <label className="flex items-center gap-2 text-[13px] text-ink-soft">
              时长
              <select
                value={seminarDuration}
                onChange={(e) => setSeminarDuration(Number(e.target.value) as 5 | 10 | 15)}
                className="field rounded-full px-3 py-1.5 text-[13px] outline-none"
              >
                <option value={5}>约 5 分钟</option>
                <option value={10}>约 10 分钟</option>
                <option value={15}>约 15 分钟</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-[13px] text-ink-soft">
              讲稿语言
              <select
                value={seminarLang}
                onChange={(e) => setSeminarLang(e.target.value as "zh" | "en")}
                className="field rounded-full px-3 py-1.5 text-[13px] outline-none"
              >
                <option value="zh">中文(术语保留英文)</option>
                <option value="en">English</option>
              </select>
            </label>
            <button
              onClick={() => void runPipeline("seminar", "seminar", { durationMin: seminarDuration, language: seminarLang })}
              disabled={busy !== null}
              className="btn-primary press rounded-full bg-accent px-5 py-2 text-[13px] font-medium text-white transition hover:bg-accent/90 disabled:opacity-50"
            >
              {busy === "seminar" ? (
                <>
                  <span className="spinner mr-1.5" aria-hidden />
                  生成中…
                </>
              ) : project.seminar ? (
                "重新生成"
              ) : (
                "生成组会汇报"
              )}
            </button>
            {project.seminar && (
              <a
                href={`/api/projects/${id}/seminar/pptx`}
                className="press group inline-flex items-center gap-1 rounded-full border border-line px-5 py-2 text-[13px] text-ink-soft transition hover:border-accent/40 hover:text-accent"
              >
                <Download className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-y-0.5" strokeWidth={1.75} />
                下载 PPTX(讲稿在演讲者备注)
              </a>
            )}
          </div>

          {!project.seminar ? (
            <EmptyState
              hint="尚未生成组会汇报。"
              action="选择时长与讲稿语言后点击「生成组会汇报」——大纲、逐页讲稿与导师 Q&A 预演一次到位。"
            />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-ink-soft">
                  共 {project.seminar.slides.length} 页 · 预设 {project.seminar.questions.length} 个问题 ·{" "}
                  {project.seminar.durationMin} 分钟版
                </p>
                <CopyButton
                  text={project.seminar.slides.map((s) => `【${s.title}】\n${s.script}`).join("\n\n")}
                  label="复制全部讲稿"
                />
              </div>
              <ol className="panel divide-y divide-line rounded-xl border border-line bg-white">
                {project.seminar.slides.map((s, i) => (
                  <li
                    key={i}
                    style={{ animationDelay: `${Math.min(i * 30, 240)}ms` }}
                    className="stagger p-4 transition hover:bg-band/40"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 shrink-0 text-right text-xs font-medium text-ink-faint">{i + 1}</span>
                      <h4 className="min-w-0 flex-1 truncate text-[13px] font-medium">{s.title}</h4>
                      <CopyButton text={s.script} label="复制讲稿" />
                    </div>
                    {s.bullets.length > 0 && (
                      <ul className="mt-2 list-disc space-y-1 pl-9 text-[13px] text-ink-soft">
                        {s.bullets.map((b, j) => (
                          <li key={j}>{b}</li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-2 border-l-2 border-line pl-3 text-[13px] leading-relaxed text-ink-soft">{s.script}</p>
                  </li>
                ))}
              </ol>
              {project.seminar.questions.length > 0 && (
                <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-5">
                  <h3 className="text-[13px] font-semibold text-amber-800">导师 Q&amp;A 预演 · 先自己答,再看要点</h3>
                  <ol className="mt-3 space-y-3">
                    {project.seminar.questions.map((q, i) => (
                      <li key={i} className="text-[13px]">
                        <p className="font-medium text-ink">{i + 1}. {q.question}</p>
                        {revealedQA.has(i) ? (
                          <p className="mt-1 flex items-start gap-1.5 pl-5 text-ink-soft">
                            <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" strokeWidth={1.75} />
                            {q.hint}
                          </p>
                        ) : (
                          <button
                            onClick={() => setRevealedQA((prev) => new Set(prev).add(i))}
                            className="press ml-5 mt-1 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs text-accent transition hover:bg-accent-soft"
                          >
                            先自己答,再看要点
                            <ChevronRight className="h-3 w-3" strokeWidth={2} />
                          </button>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === "revision" && <RevisionPanel project={project} setProject={setProject} />}
      </div>
    </div>
  );
}
