"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, RefreshCw, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import Uploader from "@/components/Uploader";

interface ProjectSummary {
  id: string;
  title: string;
  status: "uploaded" | "critiqued" | "reviewed";
  createdAt: string;
  fileName?: string;
  sections: number;
  redactions: number;
  critiqueCount: number;
  reviewCount: number;
}

interface PlanInfo {
  tier: "free" | "pro" | "lab" | "local";
  used: number;
  limit: number | null;
}

const STATUS_LABEL: Record<ProjectSummary["status"], string> = {
  uploaded: "已解析",
  critiqued: "已生成 Critique",
  reviewed: "已完成模拟审稿",
};

const STATUS_STYLE: Record<ProjectSummary["status"], string> = {
  uploaded: "border-line bg-band text-ink-soft",
  critiqued: "border-amber-200 bg-amber-50 text-amber-700",
  reviewed: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

/** 列表用相对时间:<1 分钟「刚刚」,今天内「x 分钟/小时前」,否则「x 天前」,超过 30 天回退日期 */
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d <= 30) return `${d} 天前`;
  return new Date(iso).toLocaleDateString("zh-CN");
}

function EmptyArt() {
  return (
    <svg width="112" height="84" viewBox="0 0 112 84" fill="none" aria-hidden className="mx-auto mb-4">
      <rect x="42" y="6" width="40" height="52" rx="5" fill="#eeeefc" transform="rotate(6 62 32)" />
      <g transform="rotate(-5 44 42)">
        <rect x="24" y="16" width="42" height="54" rx="5" fill="#fff" stroke="#ececf0" strokeWidth="1.5" />
        <g stroke="#d9d5f8" strokeWidth="3.2" strokeLinecap="round">
          <path d="M31 27 H50" />
          <path d="M31 35 H59" />
          <path d="M31 43 H46" />
        </g>
        <path d="M33 53 L41 61 L57 42" stroke="#5147E5" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <circle cx="18" cy="20" r="3" fill="#eeeefc" />
      <circle cx="96" cy="62" r="4" fill="#eeeefc" />
      <path d="M92 16 L96 10 M98 18 L104 14" stroke="#d9d5f8" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [llmConfigured, setLlmConfigured] = useState(true);
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [llmUsed, setLlmUsed] = useState(0);
  const [llmLimit, setLlmLimit] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProjectSummary | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data.projects ?? []);
      setLlmConfigured(Boolean(data.llmConfigured));
      setPlan(data.plan ?? null);
      setLlmUsed(Number(data.llmUsed ?? 0));
      setLlmLimit(data.llmLimit ?? null);
    } catch {
      // 列表加载失败时保留空态
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/projects");
        const data = await res.json();
        if (!alive) return;
        setProjects(data.projects ?? []);
        setLlmConfigured(Boolean(data.llmConfigured));
        setPlan(data.plan ?? null);
        setLlmUsed(Number(data.llmUsed ?? 0));
        setLlmLimit(data.llmLimit ?? null);
      } catch {
        // 列表加载失败时保留空态
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const remove = async (id: string) => {
    setDeleting(id);
    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
      await load();
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {!llmConfigured && (
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50 px-4 py-2.5 text-[13px] text-amber-800">
          当前处于<b>演示模式</b>(未配置 <code>LLM_API_KEY</code>):流水线可完整走通,但内容由占位示例生成。
          在 <code>.env.local</code> 中配置后重启即可获得真实分析。
        </div>
      )}

      {plan && plan.tier !== "local" && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-accent/20 bg-accent-soft/60 px-4 py-3 text-sm text-accent">
          <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium uppercase text-white">
            {plan.tier}
          </span>
          <span>
            本月已用 {plan.used} / {plan.limit ?? "∞"} 篇
            {llmLimit !== null && ` · LLM 分析 ${llmUsed}/${llmLimit} 次`}
          </span>
          {plan.limit !== null && plan.used >= plan.limit && (
            <span className="text-amber-700">· 稿件额度已用完</span>
          )}
          {llmLimit !== null && llmUsed >= llmLimit && (
            <span className="text-amber-700">· LLM 次数已用完</span>
          )}
          <Link href="/pricing" className="ml-auto text-accent hover:underline">
            查看方案 →
          </Link>
        </div>
      )}

      <Uploader onCreated={(id) => router.push(`/projects/${id}`)} />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">我的稿件</h2>
          <div className="flex items-center gap-4 text-[13px]">
            <Link href="/insights" className="flex items-center gap-1 text-ink-soft transition hover:text-accent">
              <BarChart3 className="h-3.5 w-3.5" strokeWidth={1.75} />
              审稿洞察
            </Link>
            <button
              onClick={() => void load()}
              className="flex items-center gap-1 text-[13px] text-ink-soft transition hover:text-accent"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} strokeWidth={1.75} />
              刷新
            </button>
          </div>
        </div>

        {loading ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <li key={i} className="panel rounded-xl border border-line bg-white p-4">
                <div className="skeleton h-5 w-3/4 rounded-full bg-band" />
                <div className="skeleton mt-3 h-3.5 w-1/2 rounded-full bg-band" />
                <div className="skeleton mt-2 h-3.5 w-2/3 rounded-full bg-band" />
              </li>
            ))}
          </ul>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line py-12 text-center">
            <EmptyArt />
            <p className="text-sm text-ink-soft">还没有稿件</p>
            <p className="mt-1 text-xs text-ink-faint">
              上传 PDF / DOCX,或直接粘贴文本,一条流水线跑到底。
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {projects.map((p, i) => (
              <li
                key={p.id}
                style={{ animationDelay: `${Math.min(i * 40, 240)}ms` }}
                className="stagger card-lift group relative panel rounded-xl border border-line bg-white p-4 hover:border-accent/40"
              >
                <button
                  onClick={() => router.push(`/projects/${p.id}`)}
                  className="block w-full text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-sm font-medium text-ink">{p.title}</h3>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[p.status]}`}
                    >
                      {STATUS_LABEL[p.status]}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-1 text-xs text-ink-faint">
                    {p.fileName ?? "粘贴文本"} · {relativeTime(p.createdAt)}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center gap-1" aria-hidden>
                      {[
                        { done: true, label: "解析" },
                        { done: p.critiqueCount > 0, label: "Critique" },
                        { done: p.reviewCount > 0, label: "审稿" },
                      ].map((s) => (
                        <span
                          key={s.label}
                          title={s.label}
                          className={`h-1 w-5 rounded-full ${s.done ? "bg-accent" : "bg-band"}`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-ink-soft">
                      {p.sections} 章节 · 脱敏 {p.redactions}
                      {p.critiqueCount > 0 && ` · Critique ${p.critiqueCount}`}
                      {p.reviewCount > 0 && ` · 审稿 ${p.reviewCount}`}
                    </p>
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPendingDelete(p);
                  }}
                  disabled={deleting === p.id}
                  aria-label={`删除「${p.title}」`}
                  title="删除稿件"
                  className="absolute right-3 top-3 rounded bg-white/80 p-1 text-ink-faint opacity-0 transition hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 disabled:opacity-40 [@media(hover:none)]:opacity-100 group-hover:opacity-100"
                >
                  {deleting === p.id ? (
                    <span className="spinner h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="删除这篇稿件?"
        body={`「${pendingDelete?.title ?? ""}」的所有 Critique、审稿与回复数据将一并删除,不可恢复。`}
        confirmLabel="删除"
        danger
        onConfirm={() => {
          if (pendingDelete) void remove(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
