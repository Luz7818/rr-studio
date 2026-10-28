"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { Project, RevisionDiffItem } from "@/lib/types";

const CHANGE_STYLE: Record<RevisionDiffItem["changeType"], { label: string; cls: string }> = {
  added: { label: "新增", cls: "border border-emerald-200 bg-emerald-50 text-emerald-700" },
  removed: { label: "删除", cls: "border border-red-200 bg-red-50 text-red-700" },
  modified: { label: "修改", cls: "border border-amber-200 bg-amber-50 text-amber-700" },
  unchanged: { label: "未变", cls: "border border-line bg-band text-ink-soft" },
};

const REC_LABEL: Record<string, string> = {
  accept: "Accept",
  minor_revision: "Minor Revision",
  major_revision: "Major Revision",
  reject: "Reject",
};
const PROMISE_STATUS: Record<string, { label: string; cls: string }> = {
  fulfilled: { label: "已兑现", cls: "border border-emerald-200 bg-emerald-50 text-emerald-700" },
  partial: { label: "部分兑现", cls: "border border-amber-200 bg-amber-50 text-amber-700" },
  unmet: { label: "未兑现", cls: "border border-red-200 bg-red-50 text-red-700" },
};

const REC_STYLE: Record<string, string> = {
  accept: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  minor_revision: "border border-lime-200 bg-lime-50 text-lime-700",
  major_revision: "border border-amber-200 bg-amber-50 text-amber-700",
  reject: "border border-red-200 bg-red-50 text-red-700",
};
const PROMISE_BAR: Record<string, string> = {
  fulfilled: "border-l-emerald-400",
  partial: "border-l-amber-400",
  unmet: "border-l-red-400",
};

export default function RevisionPanel({
  project,
  setProject,
}: {
  project: Project;
  setProject: (p: Project) => void;
}) {
  const [mode, setMode] = useState<"file" | "paste">("file");
  const [file, setFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const id = project.id;

  const clearRevision = () => {
    setProject({ ...project, revision: undefined });
    void fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revision: null }),
    }).catch(() => {});
  };

  const api = async (path: string, init?: RequestInit) => {
    const res = await fetch(`/api/projects/${id}/${path}`, init);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "操作失败");
    setProject(data.project);
    return data.project as Project;
  };

  const uploadRevision = async () => {
    setError(null);
    if (mode === "file" && !file) return setError("请选择修改稿文件");
    if (mode === "paste" && !pasteText.trim()) return setError("请粘贴修改稿文本");
    setBusy("upload");
    try {
      if (mode === "file") {
        const form = new FormData();
        form.append("file", file as File);
        await api("revision", { method: "POST", body: form });
      } else {
        await api("revision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: pasteText }),
        });
      }
      setFile(null);
      setPasteText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "上传失败");
    } finally {
      setBusy(null);
    }
  };

  const run = async (path: "revision/summary" | "revision/re-review") => {
    setBusy(path);
    setError(null);
    try {
      await api(path, { method: "POST" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setBusy(null);
    }
  };

  const runPromiseCheck = async () => {
    setBusy("promise");
    setError(null);
    try {
      await api("revision/promise-check", { method: "POST" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "核查失败");
    } finally {
      setBusy(null);
    }
  };

  const rev = project.revision;
  const committedThreads = (project.responses ?? []).filter((t) => t.commitment?.trim());

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-line bg-white p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[13px] font-semibold">修改稿对照</h3>
          {rev && (
            <button
              onClick={() => setConfirmClear(true)}
              className="text-xs text-ink-faint transition hover:text-red-600"
            >
              清除修改稿
            </button>
          )}
        </div>
        <p className="mb-3 text-xs text-ink-faint">
          投稿大修后,把修改版上传到这里:AI 逐节对比原稿给出差异说明与总评,并可对修改稿重新模拟审稿。不计入免费额度。
        </p>

        {!rev ? (
          <>
            <div className="mb-3 inline-flex rounded-full bg-band p-1 text-[13px]">
              {(["file", "paste"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`press rounded-full px-3.5 py-1.5 transition ${
                    mode === m ? "bg-white font-medium text-accent shadow-sm" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {m === "file" ? "上传文件" : "粘贴文本"}
                </button>
              ))}
            </div>
            {mode === "file" ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) setFile(f);
                }}
                className="group cursor-pointer rounded-2xl border border-dashed border-line px-6 py-8 text-center transition hover:border-accent/50 hover:bg-accent-soft/50"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                {file ? (
                  <span className="inline-flex max-w-full items-center rounded-full bg-accent-soft px-3.5 py-1 text-[13px] font-medium text-accent">
                    <span className="truncate">{file.name}</span>
                  </span>
                ) : (
                  <>
                    <Upload className="mx-auto mb-2.5 h-5 w-5 text-ink-faint transition-all duration-200 group-hover:-translate-y-0.5 group-hover:text-accent" strokeWidth={1.5} />
                    <p className="text-[13px] text-ink-soft">点击选择或拖拽修改稿(PDF / DOCX / TXT)</p>
                  </>
                )}
              </div>
            ) : (
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="粘贴修改稿全文(含章节标题)…"
                className="h-40 w-full resize-y rounded-2xl border border-line bg-band/50 p-3 text-sm outline-none transition focus:border-accent focus:bg-white"
              />
            )}
            <button
              onClick={() => void uploadRevision()}
              disabled={busy !== null}
              className="press mt-3 w-full rounded-full bg-accent py-2.5 text-sm font-medium text-white transition hover:bg-accent/90 disabled:opacity-50"
            >
              {busy === "upload" ? "解析并脱敏中…" : "上传修改稿"}
            </button>
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-sm text-ink-soft">
              <span>
                修改稿已上传:{new Date(rev.uploadedAt).toLocaleString("zh-CN")} · {rev.sections.length} 个章节 · 脱敏{" "}
                {rev.sanitize.redactions} 处
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => void run("revision/summary")}
                disabled={busy !== null}
                className="press rounded-full bg-accent px-5 py-2 text-sm font-medium text-white transition hover:bg-accent/90 disabled:opacity-50"
              >
                {busy === "revision/summary" ? "对比中…" : rev.summaryReady ? "重新生成对比" : "生成逐节对比"}
              </button>
              <button
                onClick={() => void run("revision/re-review")}
                disabled={busy !== null}
                className="press rounded-full bg-ink px-5 py-2 text-sm font-medium text-white transition hover:bg-ink/90 disabled:opacity-50"
              >
                {busy === "revision/re-review" ? "审稿中…" : rev.reviews ? "重新模拟审稿" : "对修改稿重新模拟审稿"}
              </button>
            </div>
          </div>
        )}
        {error && (
          <p className="mt-3 rounded-xl bg-red-50 px-3.5 py-2 text-sm text-red-700">{error}</p>
        )}
      </div>

      {rev?.summaryReady && (
        <div className="rounded-xl border border-line bg-white p-5">
          <h3 className="font-semibold">AI 总评</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink">{rev.overall}</p>
          <h4 className="mt-4 text-sm font-medium text-ink-soft">逐节差异({rev.diff.length})</h4>
          <ul className="mt-2 space-y-2">
            {rev.diff.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${CHANGE_STYLE[d.changeType].cls}`}>
                  {CHANGE_STYLE[d.changeType].label}
                </span>
                <span className="font-medium text-ink">{d.section}</span>
                <span className="text-ink-soft">{d.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {rev && committedThreads.length > 0 && (
        <div className="rounded-xl border border-line bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">承诺兑现核查</h3>
            <button
              onClick={() => void runPromiseCheck()}
              disabled={busy !== null}
              className="press rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-white transition hover:bg-accent/90 disabled:opacity-50"
            >
              {busy === "promise" ? "核查中…" : rev.promiseChecks ? "重新核查" : `核查 ${committedThreads.length} 条承诺`}
            </button>
          </div>
          <p className="mt-1 text-xs text-ink-faint">
            对照修改稿,逐条验证回复信里答应的修改是否真的改了——投稿前最后一道保险。
          </p>
          {rev.promiseChecks && rev.promiseChecks.length > 0 && (
            <ul className="mt-4 space-y-2.5">
              {rev.promiseChecks.map((c) => (
                <li key={c.commentId} className={`rounded-xl border border-line border-l-2 ${PROMISE_BAR[c.status] ?? ""} p-3 text-sm`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PROMISE_STATUS[c.status].cls}`}>
                      {PROMISE_STATUS[c.status].label}
                    </span>
                    <span className="text-xs text-ink-faint">{c.reviewer}</span>
                    <span className="font-medium text-ink">{c.commitment}</span>
                  </div>
                  {c.evidence && <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{c.evidence}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {rev?.reviews && (
        <div className="grid gap-4 lg:grid-cols-3">
          {rev.reviews.map((r) => (
            <div key={r.persona} className="rounded-xl border border-line bg-white p-5">
              <h4 className="text-sm font-semibold">{r.label}</h4>
              <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${REC_STYLE[r.recommendation]}`}>
                {REC_LABEL[r.recommendation] ?? r.recommendation}
              </span>
              <p className="mt-2 text-xs leading-relaxed text-ink-soft">{r.overall}</p>
              <div className="mt-3 space-y-2 text-xs">
                {r.major.map((c) => (
                  <p key={c.id} className="rounded-md bg-red-50 p-2 text-ink">
                    <b className="text-red-600">Major</b> {c.text}
                  </p>
                ))}
                {r.minor.map((c) => (
                  <p key={c.id} className="rounded-md bg-amber-50 p-2 text-ink-soft">
                    <b className="text-amber-600">Minor</b> {c.text}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmClear}
        title="清除修改稿?"
        body="当前对照数据(含已生成的总结、重审意见与承诺核查)将被清空,重新上传后需重新生成。"
        confirmLabel="清除"
        danger
        onConfirm={() => {
          clearRevision();
          setConfirmClear(false);
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
