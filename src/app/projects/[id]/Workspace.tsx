"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { CritiqueItem, Project, ResponseThread, Severity } from "@/lib/types";
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
  major: "bg-red-100 text-red-700",
  minor: "bg-amber-100 text-amber-700",
  suggestion: "bg-band text-ink-soft",
};
const CATEGORY_LABEL: Record<string, string> = {
  logic: "逻辑",
  expression: "表达",
  grammar: "语法",
  style: "风格",
};
const REC_LABEL: Record<string, string> = {
  accept: "Accept",
  minor_revision: "Minor Revision",
  major_revision: "Major Revision",
  reject: "Reject",
};
const REC_STYLE: Record<string, string> = {
  accept: "bg-emerald-100 text-emerald-700",
  minor_revision: "bg-lime-100 text-lime-700",
  major_revision: "bg-amber-100 text-amber-700",
  reject: "bg-red-100 text-red-700",
};

function CopyButton({ text, label = "复制" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
      className="rounded-full border border-line px-2.5 py-1 text-xs text-ink-soft transition hover:border-accent/40 hover:text-accent"
    >
      {copied ? "已复制 ✓" : label}
    </button>
  );
}

function StepBadge({ done, label }: { done: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium ${
        done ? "bg-accent-soft text-accent" : "bg-band text-ink-faint"
      }`}
    >
      {done ? "✓" : "○"} {label}
    </span>
  );
}

export default function Workspace() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [llmConfigured, setLlmConfigured] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<"all" | Severity>("all");
  const [seminarDuration, setSeminarDuration] = useState<5 | 10 | 15>(10);
  const [seminarLang, setSeminarLang] = useState<"zh" | "en">("zh");
  const [batch, setBatch] = useState<{ total: number; done: number } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "加载失败");
      setProject(data.project);
      setLlmConfigured(Boolean(data.llmConfigured));
      if (data.project?.seminar) {
        setSeminarDuration(data.project.seminar.durationMin);
        setSeminarLang(data.project.seminar.language);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    }
  }, [id]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/projects/${id}`);
        const data = await res.json();
        if (!alive) return;
        if (!res.ok) throw new Error(data.error ?? "加载失败");
        setProject(data.project);
        setLlmConfigured(Boolean(data.llmConfigured));
        if (data.project?.seminar) {
          setSeminarDuration(data.project.seminar.durationMin);
          setSeminarLang(data.project.seminar.language);
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "加载失败");
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

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
      if (after) setTab(after);
    } catch (e) {
      setError(e instanceof Error ? e.message : "执行失败");
    } finally {
      setBusy(null);
    }
  };

  const patchProject = async (fields: Record<string, unknown>) => {
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    const data = await res.json();
    if (res.ok) setProject(data.project);
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
    await fetch(`/api/projects/${id}/responses`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threads: [thread] }),
    });
  };

  const polishThread = async (commentId: string) => {
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "打磨失败");
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

  /** 顺序打磨所有未完成的回复(尊重供应商限速),显示进度 */
  const polishAllPending = async () => {
    const pending = (project?.responses ?? []).filter((t) => !t.polished.trim());
    if (pending.length === 0) return;
    setBatch({ total: pending.length, done: 0 });
    setError(null);
    for (let i = 0; i < pending.length; i++) {
      try {
        await polishThread(pending[i].commentId);
      } catch {
        // 单条失败不中断批量流程
      }
      setBatch({ total: pending.length, done: i + 1 });
    }
    setBatch(null);
  };

  if (error && !project) {
    return <p className="py-20 text-center text-red-600">{error}</p>;
  }
  if (!project) {
    return <p className="py-20 text-center text-ink-faint">加载中…</p>;
  }

  const critiqueItems = project.critique?.items.filter((i) => severityFilter === "all" || i.severity === severityFilter) ?? [];
  const threads = project.responses ?? [];
  const allResponsesText = threads
    .filter((t) => t.polished.trim() || t.draft.trim())
    .map(
      (t) =>
        `${t.reviewer} (${t.type === "major" ? "Major" : "Minor"}):\n${t.commentText}\n\n回复:\n${t.polished.trim() || t.draft.trim()}`,
    )
    .join("\n\n————————\n\n");

  return (
    <div className="space-y-5">
      <div>
        <Link href="/" className="text-sm text-ink-faint hover:text-accent">
          ← 返回列表
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input
            value={project.title}
            onChange={(e) => setProject({ ...project, title: e.target.value })}
            onBlur={(e) => {
              if (e.target.value.trim() && e.target.value !== project.title) void patchProject({ title: e.target.value });
            }}
            className="min-w-0 flex-1 rounded-2xl border border-transparent px-2 py-1 text-2xl font-black tracking-tight hover:border-line focus:border-accent/50 focus:outline-none"
          />
          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">{project.status}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StepBadge done label="上传解析" />
          <StepBadge done={Boolean(project.critique)} label="Critique" />
          <StepBadge done={Boolean(project.reviews?.length)} label="模拟审稿" />
          <StepBadge done={threads.some((t) => t.draft || t.polished)} label="回复审稿人" />
          <StepBadge done={Boolean(project.coverLetter)} label="Cover Letter" />
        </div>
      </div>

      {!llmConfigured && (
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50 px-5 py-3.5 text-sm text-amber-800">
          <b>演示模式</b>:未配置 <code>LLM_API_KEY</code>,以下内容由占位示例生成。配置后点击各步骤的「重新生成」即可获得真实结果。
        </div>
      )}
      {error && <div className="rounded-2xl border border-red-200/60 bg-red-50 px-5 py-3.5 text-sm text-red-700">{error}</div>}

      <nav className="inline-flex max-w-full flex-wrap gap-1 rounded-full bg-band p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-2 text-sm transition ${
              tab === t.key
                ? "bg-white font-semibold text-ink shadow-sm"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            {t.label}
            {t.key === "critique" && project.critique ? ` (${project.critique.items.length})` : ""}
            {t.key === "review" && project.reviews?.length ? ` (${project.reviews.length})` : ""}
            {t.key === "response" && threads.length ? ` (${threads.length})` : ""}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-white p-5">
              <h3 className="font-semibold">脱敏报告</h3>
              <p className="mt-2 text-3xl font-bold text-emerald-600">{project.sanitize.redactions}</p>
              <p className="text-xs text-ink-faint">处敏感信息已替换为占位符</p>
              <ul className="mt-3 space-y-1 text-sm text-ink-soft">
                {Object.entries(project.sanitize.details).length === 0 && <li className="text-ink-faint">未发现匹配的敏感信息</li>}
                {Object.entries(project.sanitize.details).map(([k, v]) => (
                  <li key={k} className="flex justify-between">
                    <span>{k}</span>
                    <span className="font-medium">{v}</span>
                  </li>
                ))}
              </ul>
              {project.sanitize.removedAuthorBlock && (
                <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  ✓ 标题页(作者/单位区)已整体排除,未进入分析与存储
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-line bg-white p-5">
              <h3 className="font-semibold">稿件信息</h3>
              <dl className="mt-3 space-y-3 text-sm">
                <div>
                  <dt className="text-ink-faint">源文件</dt>
                  <dd>{project.meta.fileName ?? "粘贴文本"}</dd>
                </div>
                <div>
                  <dt className="text-ink-faint">目标期刊</dt>
                  <dd>
                    <input
                      value={project.meta.targetJournal ?? ""}
                      placeholder="如 IEEE Transactions on ITS"
                      onChange={(e) => setProject({ ...project, meta: { ...project.meta, targetJournal: e.target.value } })}
                      onBlur={(e) => void patchProject({ targetJournal: e.target.value })}
                      className="w-full rounded-xl border border-line px-3 py-2 outline-none focus:border-accent"
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-faint">上传时间</dt>
                  <dd>{new Date(project.createdAt).toLocaleString("zh-CN")}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5">
            <h3 className="font-semibold">章节结构({project.sections.length})</h3>
            <ul className="mt-3 divide-y divide-line text-sm">
              {project.sections.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2">
                  <span className="font-medium text-ink">{s.heading}</span>
                  <span className="text-xs text-ink-faint">{s.chars} 字符</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => void runPipeline("critique", "critique")}
              disabled={busy !== null}
              className="press rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white transition hover:bg-accent/90 disabled:opacity-50"
            >
              {busy === "critique" ? "逐段分析中…" : project.critique ? "重新生成 Critique 报告" : "① 生成 Critique 报告"}
            </button>
            <button
              onClick={() => void runPipeline("review", "review")}
              disabled={busy !== null}
              className="press rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition hover:bg-ink/90 disabled:opacity-50"
            >
              {busy === "review" ? "三位审稿人审稿中…" : project.reviews?.length ? "重新模拟审稿" : "② 模拟审稿(3 位审稿人)"}
            </button>
          </div>
        </div>
      )}

      {tab === "critique" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 rounded-xl bg-band p-0.5 text-sm">
              {(["all", "major", "minor", "suggestion"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setSeverityFilter(f)}
                  className={`rounded-full px-3.5 py-1.5 ${severityFilter === f ? "bg-white font-medium text-accent shadow-sm" : "text-ink-soft"}`}
                >
                  {f === "all" ? "全部" : SEVERITY_LABEL[f]}
                </button>
              ))}
            </div>
            <button
              onClick={() => void runPipeline("critique")}
              disabled={busy !== null}
              className="press rounded-full border border-accent/30 px-5 py-1.5 text-sm text-accent transition hover:bg-accent-soft disabled:opacity-50"
            >
              {busy === "critique" ? "分析中…" : "重新生成"}
            </button>
            {project.critique && (
              <a
                href={`/api/projects/${id}/export/critique`}
                className="press rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
              >
                ⬇ 导出 Word 报告
              </a>
            )}
          </div>

          {!project.critique ? (
            <p className="rounded-2xl border border-dashed border-line py-12 text-center text-sm text-ink-faint">
              尚未生成 Critique 报告,点击上方「重新生成」开始。
            </p>
          ) : (
            <>
              {project.critique.errors?.map((err) => (
                <p key={err} className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  部分章节分析失败:{err}
                </p>
              ))}
              <ul className="space-y-3">
                {critiqueItems.map((item) => (
                  <li key={item.id} className={`rounded-2xl border bg-white p-4 ${item.adopted ? "border-emerald-300" : "border-line"}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_STYLE[item.severity]}`}>
                        {SEVERITY_LABEL[item.severity]}
                      </span>
                      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">
                        {CATEGORY_LABEL[item.category] ?? item.category}
                      </span>
                      <span className="text-xs text-ink-faint">{item.section}</span>
                      <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-xs text-ink-soft">
                        <input
                          type="checkbox"
                          checked={item.adopted}
                          onChange={(e) => toggleAdopted(item, e.target.checked)}
                          className="accent-emerald-600"
                        />
                        已采纳
                      </label>
                    </div>
                    {item.quote && <p className="mt-2 border-l-2 border-line pl-3 text-sm italic text-ink-soft">“{item.quote}”</p>}
                    <p className="mt-2 text-sm text-ink">{item.comment}</p>
                    <p className="mt-2 rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent">✏️ {item.suggestion}</p>
                  </li>
                ))}
              </ul>
              {critiqueItems.length === 0 && <p className="py-8 text-center text-sm text-ink-faint">该严重程度下暂无条目。</p>}
            </>
          )}
        </div>
      )}

      {tab === "review" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold">文献对标(审稿依据)</h3>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-ink-faint">
                  检索近三年真实文献作为审稿依据:审稿人讨论文献缺口时只引用这些真实论文,
                  杜绝编造引用。来源 OpenAlex / Semantic Scholar。
                </p>
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
                  className="press rounded-full border border-line px-4 py-1.5 text-xs text-ink-soft transition hover:bg-band disabled:opacity-50"
                >
                  {busy === "review" ? "审稿中…" : "重新模拟审稿"}
                </button>
              </div>
            </div>
            {project.literature && (
              <div className="mt-3 border-t border-line pt-3">
                <ul className="space-y-1.5">
                  {project.literature.papers.slice(0, 6).map((p) => (
                    <li key={p.url} className="flex flex-wrap items-baseline gap-2 text-xs">
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-ink transition hover:text-accent"
                      >
                        {p.title}
                      </a>
                      <span className="text-ink-faint">
                        {p.venue || "venue n/a"} · {p.year ?? "n/a"} · 被引 {p.citedBy}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] text-ink-faint">
                  来源 {project.literature.source} · 共 {project.literature.papers.length} 篇
                  (检索词:{project.literature.queries.join(" / ").slice(0, 90)})
                </p>
              </div>
            )}
          </div>
          {!project.reviews?.length ? (
            <p className="rounded-2xl border border-dashed border-line py-12 text-center text-sm text-ink-faint">
              尚未模拟审稿。在「解析概览」或此处点击开始,三位 AI 审稿人将分别给出意见。
            </p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              {project.reviews.map((r) => (
                <div key={r.persona} className="flex flex-col rounded-2xl border border-line bg-white p-5">
                  <h3 className="font-semibold">{r.label}</h3>
                  <span className={`mt-2 w-fit rounded-full px-2 py-0.5 text-xs font-medium ${REC_STYLE[r.recommendation]}`}>
                    {REC_LABEL[r.recommendation] ?? r.recommendation}
                  </span>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">{r.overall}</p>
                  <div className="mt-4 space-y-3 text-sm">
                    {r.major.map((c) => (
                      <div key={c.id} className="rounded-xl bg-red-50 p-3">
                        <p className="text-xs font-medium text-red-600">Major</p>
                        <p className="mt-1 text-ink">{c.text}</p>
                      </div>
                    ))}
                    {r.minor.map((c) => (
                      <div key={c.id} className="rounded-xl bg-amber-50 p-3">
                        <p className="text-xs font-medium text-amber-600">Minor</p>
                        <p className="mt-1 text-ink">{c.text}</p>
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
        <div className="space-y-4">
          {threads.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-white px-4 py-3">
              <span className="text-sm text-ink-soft">
                已打磨 {threads.filter((t) => t.polished.trim()).length}/{threads.length} 条
              </span>
              <button
                onClick={() => void polishAllPending()}
                disabled={busy !== null || batch !== null}
                className="rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-accent/90 disabled:opacity-50"
              >
                {batch ? `批量打磨中 ${batch.done}/${batch.total}…` : `批量打磨未完成 (${threads.filter((t) => !t.polished.trim()).length})`}
              </button>
              <button
                onClick={() => void extractCommitments()}
                disabled={busy !== null || batch !== null}
                className="press rounded-full border border-accent/30 px-4 py-1.5 text-xs font-medium text-accent transition hover:bg-accent-soft disabled:opacity-50"
              >
                {busy === "commitments" ? "提取中…" : "AI 提取修改承诺"}
              </button>
              <CopyButton text={allResponsesText} label="复制全部回复" />
              <a
                href={`/api/projects/${id}/export/response-letter`}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
              >
                ⬇ 导出 Word Response Letter
              </a>
            </div>
          )}
          {!project.reviews?.length ? (
            <p className="rounded-2xl border border-dashed border-line py-12 text-center text-sm text-ink-faint">
              请先完成「模拟审稿」,即可在此逐条撰写与打磨回复。
            </p>
          ) : threads.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-faint">暂无待回复意见。</p>
          ) : (
            threads.map((t) => (
              <div key={t.commentId} className="rounded-2xl border border-line bg-white p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${t.type === "major" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                    {t.type === "major" ? "Major" : "Minor"}
                  </span>
                  <span className="text-sm font-medium">{t.reviewer}</span>
                  <div className="ml-auto flex gap-2">
                    <CopyButton text={t.polished || t.draft} label={t.polished ? "复制打磨稿" : "复制草稿"} />
                    <button
                      onClick={() => void polishThread(t.commentId)}
                      disabled={busy !== null}
                      className="rounded-full bg-accent px-3.5 py-1 text-xs font-medium text-white hover:bg-accent/90 disabled:opacity-50"
                    >
                      {busy === `polish-${t.commentId}` ? "打磨中…" : t.polished ? "重新打磨" : "AI 打磨回复"}
                    </button>
                  </div>
                </div>
                <p className="mt-3 rounded-xl bg-band p-3 text-sm text-ink-soft">
                  <span className="font-medium text-ink-soft">审稿意见:</span> {t.commentText}
                </p>
                <textarea
                  value={t.draft}
                  onChange={(e) => updateThreadLocal(t.commentId, { draft: e.target.value })}
                  onBlur={() => void saveThread(t)}
                  placeholder="先写下你的回复要点(数据、论据、修改位置)…失焦自动保存,AI 打磨时会保留你的事实与数字"
                  className="mt-3 min-h-24 w-full resize-y rounded-xl border border-line p-3 text-sm outline-none focus:border-accent"
                />
                {t.polished && (
                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                    <p className="text-xs font-medium text-emerald-600">AI 打磨稿(可直接粘贴进 Response Letter)</p>
                    <pre className="mt-1 whitespace-pre-wrap font-sans text-sm text-ink">{t.polished}</pre>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                  <span className="text-xs text-ink-faint">意见裁决:</span>
                  {([["valid", "有道理 ✓"], ["invalid", "不成立 ✗"]] as const).map(([v, label]) => (
                    <button
                      key={v}
                      onClick={() => void setVerdict(t, t.verdict === v ? null : v)}
                      className={`press rounded-full px-3 py-1 text-xs font-medium transition ${
                        t.verdict === v
                          ? v === "valid"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                          : "bg-band text-ink-soft hover:text-ink"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  <input
                    value={t.commitment ?? ""}
                    onChange={(e) => updateThreadLocal(t.commentId, { commitment: e.target.value })}
                    onBlur={() => void saveThread(t)}
                    placeholder="修改承诺:答应修改稿件的哪里、改什么(供承诺核查用)"
                    className="ml-auto min-w-56 flex-1 rounded-full border border-line bg-band/50 px-4 py-1.5 text-xs outline-none transition focus:border-accent focus:bg-white"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "cover" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => void runPipeline("cover-letter")}
              disabled={busy !== null}
              className="press rounded-full bg-accent px-5 py-1.5 text-sm font-medium text-white transition hover:bg-accent/90 disabled:opacity-50"
            >
              {busy === "cover-letter" ? "生成中…" : project.coverLetter ? "重新生成" : "生成 Cover Letter"}
            </button>
          </div>
          {!project.coverLetter ? (
            <p className="rounded-2xl border border-dashed border-line py-12 text-center text-sm text-ink-faint">
              尚未生成。将基于标题、摘要与结论自动撰写投稿信。
            </p>
          ) : (
            <div className="rounded-2xl border border-line bg-white p-6">
              <div className="mb-3 flex justify-end">
                <CopyButton text={project.coverLetter.content} label="复制全文" />
              </div>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink">{project.coverLetter.content}</pre>
              <p className="mt-4 text-xs text-ink-faint">发送前请替换 [方括号] 中的占位信息,并核对期刊对 Cover Letter 的具体要求。</p>
            </div>
          )}
        </div>
      )}

      {tab === "seminar" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-4">
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              时长
              <select
                value={seminarDuration}
                onChange={(e) => setSeminarDuration(Number(e.target.value) as 5 | 10 | 15)}
                className="rounded-xl border border-line px-2 py-1.5 text-sm outline-none focus:border-accent"
              >
                <option value={5}>约 5 分钟</option>
                <option value={10}>约 10 分钟</option>
                <option value={15}>约 15 分钟</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              讲稿语言
              <select
                value={seminarLang}
                onChange={(e) => setSeminarLang(e.target.value as "zh" | "en")}
                className="rounded-xl border border-line px-2 py-1.5 text-sm outline-none focus:border-accent"
              >
                <option value="zh">中文(术语保留英文)</option>
                <option value="en">English</option>
              </select>
            </label>
            <button
              onClick={() => void runPipeline("seminar", "seminar", { durationMin: seminarDuration, language: seminarLang })}
              disabled={busy !== null}
              className="press rounded-full bg-accent px-5 py-2 text-sm font-medium text-white transition hover:bg-accent/90 disabled:opacity-50"
            >
              {busy === "seminar" ? "生成中…" : project.seminar ? "重新生成" : "生成组会汇报"}
            </button>
            {project.seminar && (
              <a
                href={`/api/projects/${id}/seminar/pptx`}
                className="press rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
              >
                ⬇ 下载 PPTX(讲稿在演讲者备注)
              </a>
            )}
          </div>

          {!project.seminar ? (
            <p className="rounded-2xl border border-dashed border-line py-12 text-center text-sm text-ink-faint">
              尚未生成。选择时长与讲稿语言后点击「生成组会汇报」——大纲、逐页讲稿与导师 Q&amp;A 预演一次到位。
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-ink-soft">
                  共 {project.seminar.slides.length} 页 · 预设 {project.seminar.questions.length} 个问题 ·{" "}
                  {project.seminar.durationMin} 分钟版
                </p>
                <CopyButton
                  text={project.seminar.slides.map((s) => `【${s.title}】\n${s.script}`).join("\n\n")}
                  label="复制全部讲稿"
                />
              </div>
              <ol className="space-y-3">
                {project.seminar.slides.map((s, i) => (
                  <li key={i} className="rounded-2xl border border-line bg-white p-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent">
                        {i + 1}
                      </span>
                      <h4 className="font-medium">{s.title}</h4>
                      <CopyButton text={s.script} label="复制讲稿" />
                    </div>
                    {s.bullets.length > 0 && (
                      <ul className="mt-2 list-disc space-y-1 pl-10 text-sm text-ink-soft">
                        {s.bullets.map((b, j) => (
                          <li key={j}>{b}</li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-2 rounded-xl bg-band p-3 text-sm leading-relaxed text-ink">{s.script}</p>
                  </li>
                ))}
              </ol>
              {project.seminar.questions.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
                  <h3 className="font-semibold text-amber-800">导师 Q&amp;A 预演(先自己答,再看要点)</h3>
                  <ol className="mt-3 space-y-3">
                    {project.seminar.questions.map((q, i) => (
                      <li key={i} className="text-sm">
                        <p className="font-medium text-ink">{i + 1}. {q.question}</p>
                        <p className="mt-1 pl-5 text-ink-soft">💡 {q.hint}</p>
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
  );
}
