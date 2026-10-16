"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  uploaded: "bg-band text-ink-soft",
  critiqued: "bg-amber-100 text-amber-700",
  reviewed: "bg-emerald-100 text-emerald-700",
};

export default function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [llmConfigured, setLlmConfigured] = useState(true);
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data.projects ?? []);
      setLlmConfigured(Boolean(data.llmConfigured));
      setPlan(data.plan ?? null);
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
    if (!window.confirm("确定删除该项目?所有 Critique/审稿数据将一并删除。")) return;
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
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50 px-5 py-3.5 text-sm text-amber-800">
          当前处于<b>演示模式</b>(未配置 <code>LLM_API_KEY</code>):流水线可完整走通,但内容由占位示例生成。
          在 <code>.env.local</code> 中配置后重启即可获得真实分析。
        </div>
      )}

      {plan && plan.tier !== "local" && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-accent/20 bg-accent-soft px-4 py-3 text-sm text-accent">
          <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-white uppercase">
            {plan.tier}
          </span>
          <span>
            本月已用 {plan.used} / {plan.limit ?? "∞"} 篇
          </span>
          {plan.limit !== null && plan.used >= plan.limit && (
            <span className="text-amber-700">· 额度已用完</span>
          )}
          <Link href="/pricing" className="ml-auto text-accent hover:underline">
            查看方案 →
          </Link>
        </div>
      )}

      <Uploader onCreated={(id) => router.push(`/projects/${id}`)} />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">我的稿件</h2>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/insights" className="text-ink-soft hover:text-accent">
              📊 审稿洞察
            </Link>
            <button onClick={() => void load()} className="text-ink-soft hover:text-accent">
              刷新
            </button>
          </div>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-ink-faint">加载中…</p>
        ) : projects.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line py-10 text-center text-sm text-ink-faint">
            还没有稿件。上传 PDF / DOCX,或直接粘贴文本开始。
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {projects.map((p) => (
              <li
                key={p.id}
                className="group relative rounded-2xl border border-line bg-white p-4 shadow-sm transition hover:border-accent/40 hover:shadow"
              >
                <button
                  onClick={() => router.push(`/projects/${p.id}`)}
                  className="block w-full text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 font-medium text-ink">{p.title}</h3>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[p.status]}`}
                    >
                      {STATUS_LABEL[p.status]}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-1 text-xs text-ink-faint">
                    {p.fileName ?? "粘贴文本"} · {new Date(p.createdAt).toLocaleString("zh-CN")}
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">
                    {p.sections} 个章节 · 脱敏 {p.redactions} 处
                    {p.critiqueCount > 0 && ` · Critique ${p.critiqueCount} 条`}
                    {p.reviewCount > 0 && ` · 审稿意见 ${p.reviewCount} 份`}
                  </p>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    void remove(p.id);
                  }}
                  disabled={deleting === p.id}
                  className="absolute right-3 top-3 hidden rounded px-1.5 py-0.5 text-xs text-ink-faint hover:bg-red-50 hover:text-red-600 group-hover:block"
                >
                  {deleting === p.id ? "删除中…" : "删除"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
