"use client";

import { useRef, useState } from "react";
import { ArrowRight, Upload, X } from "lucide-react";
import SegmentedControl from "@/components/SegmentedControl";

/** 与文件选择框 accept 一致;单文件上限 30MB(unpdf/mammoth 在更大文件上易 OOM 或超时) */
const ACCEPT_EXT = ["pdf", "docx", "txt", "md"];
const MAX_FILE_MB = 30;

export default function Uploader({ onCreated }: { onCreated: (id: string) => void }) {
  const [mode, setMode] = useState<"file" | "paste">("file");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [title, setTitle] = useState("");
  const [targetJournal, setTargetJournal] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pickFile = (f: File | null | undefined) => {
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ACCEPT_EXT.includes(ext)) {
      setFile(null);
      return setError(`暂不支持 .${ext} 文件,请选择 PDF / DOCX / TXT / MD`);
    }
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      setFile(null);
      return setError(`文件 ${(f.size / 1024 / 1024).toFixed(1)}MB 超过 ${MAX_FILE_MB}MB 上限,请拆分或压缩后上传`);
    }
    setError(null);
    setFile(f);
  };

  const submit = async () => {
    setError(null);
    if (mode === "file" && !file) return setError("请先选择 PDF / DOCX / TXT 文件");
    if (mode === "paste" && !pasteText.trim()) return setError("请粘贴稿件文本");

    setBusy(true);
    try {
      let res: Response;
      if (mode === "file") {
        const form = new FormData();
        form.append("file", file as File);
        if (title.trim()) form.append("title", title.trim());
        if (targetJournal.trim()) form.append("targetJournal", targetJournal.trim());
        res = await fetch("/api/projects", { method: "POST", body: form });
      } else {
        res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: pasteText, title, targetJournal }),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "上传失败");
      onCreated(data.project.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "上传失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel rounded-xl border border-line bg-white p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold">新建稿件</h2>
        <SegmentedControl
          value={mode}
          onChange={setMode}
          ariaLabel="新建稿件方式"
          options={[
            { value: "file", label: "上传文件" },
            { value: "paste", label: "粘贴文本" },
          ]}
        />
      </div>

      {mode === "file" ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pickFile(e.dataTransfer.files?.[0]);
          }}
          className={`group cursor-pointer rounded-2xl border border-dashed px-6 py-10 text-center transition ${
            dragging
              ? "border-accent bg-accent-soft/60"
              : "border-line hover:border-accent/60 hover:bg-accent-soft/30"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
          <Upload
            className={`mx-auto mb-3 h-5 w-5 text-ink-faint transition-all duration-200 group-hover:-translate-y-0.5 group-hover:text-accent ${
              dragging ? "-translate-y-1 text-accent" : ""
            }`}
            strokeWidth={1.5}
          />
          {file ? (
            <div>
              <p className="text-sm font-medium text-accent">{file.name}</p>
              <p className="mt-1 text-xs text-ink-faint">
                {(file.size / 1024).toFixed(0)} KB · 点击可重新选择
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-ink">{dragging ? "松开即选择该文件" : "点击选择或拖拽文件到此处"}</p>
              <p className="mt-1 text-xs text-ink-faint">支持 PDF / DOCX / TXT / MD,单文件 ≤ {MAX_FILE_MB}MB</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="粘贴英文稿件全文(建议包含 Abstract / Introduction / Methods / Results / Discussion 等章节标题,便于分节)…"
            className="field h-44 w-full resize-y rounded-2xl p-3.5 text-sm outline-none"
          />
          <div className="mt-1 flex items-center justify-between text-xs text-ink-faint">
            <span>{pasteText.trim() ? `${pasteText.trim().length} 字符` : "支持直接粘贴,无需清洗格式"}</span>
            {pasteText && (
              <button
                onClick={() => setPasteText("")}
                className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-ink-faint transition hover:bg-band hover:text-ink"
              >
                <X className="h-3 w-3" strokeWidth={1.75} />
                清空
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="稿件标题(可选,留空自动识别)"
          className="field rounded-full px-4 py-2.5 text-sm outline-none"
        />
        <input
          value={targetJournal}
          onChange={(e) => setTargetJournal(e.target.value)}
          placeholder="目标期刊(可选,如 IEEE T-ITS)"
          className="field rounded-full px-4 py-2.5 text-sm outline-none"
        />
      </div>

      {error && (
        <p className="rise-in mt-3 rounded-xl bg-red-50 px-3.5 py-2 text-sm text-red-700">{error}</p>
      )}

      <button
        onClick={() => void submit()}
        disabled={busy}
        className="btn-primary press group mt-4 w-full rounded-full bg-accent py-2.5 text-sm font-medium text-white transition hover:bg-accent/90 disabled:opacity-50"
      >
        {busy ? (
          <>
            <span className="spinner mr-1.5" aria-hidden />
            解析并脱敏中…
          </>
        ) : (
          <>
            上传并解析(自动脱敏)
            <ArrowRight className="ml-1 inline h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2} />
          </>
        )}
      </button>
      <p className="mt-2.5 text-center text-xs text-ink-faint">
        标题页(作者/单位)不会进入分析;邮箱、基金号、链接等敏感信息自动替换为占位符。
      </p>
    </section>
  );
}
