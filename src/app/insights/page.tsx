"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FillBar from "@/components/FillBar";

const REC_LABEL: Record<string, string> = {
  accept: "Accept",
  minor_revision: "Minor",
  major_revision: "Major",
  reject: "Reject",
};
const REC_STYLE: Record<string, string> = {
  accept: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  minor_revision: "border border-lime-200 bg-lime-50 text-lime-700",
  major_revision: "border border-amber-200 bg-amber-50 text-amber-700",
  reject: "border border-red-200 bg-red-50 text-red-700",
};
const SEV_STYLE: Record<string, string> = {
  major: "border border-red-200 bg-red-50 text-red-700",
  minor: "border border-amber-200 bg-amber-50 text-amber-700",
  suggestion: "border border-line bg-band text-ink-soft",
};

interface Insights {
  totalProjects: number;
  reviewedProjects: number;
  critiqueItems: number;
  recommendations: Array<{ persona: string; label: string; counts: Record<string, number> }>;
  categories: Array<{ key: string; label: string; count: number }>;
  severities: Array<{ key: string; label: string; count: number }>;
  topSections: Array<{ section: string; count: number }>;
  hitRates: Array<{ persona: string; label: string; valid: number; invalid: number; rate: number | null }>;
  promises: { total: number; fulfilled: number; partial: number; unmet: number };
  timeline: Array<{
    id: string;
    title: string;
    date: string;
    recs: Array<{ persona: string; recommendation: string }>;
    major: number;
    minor: number;
  }>;
}

function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState(target);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    // reduced-motion:不做滚动,一帧后直接显示终值
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      raf = requestAnimationFrame(() => setValue(target));
    } else {
      raf = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function StatCard({ label, value }: { label: string; value: number }) {
  const shown = useCountUp(value);
  return (
    <div className="panel rounded-xl border border-line bg-white p-5 text-center">
      <p className="text-3xl font-semibold text-accent">{shown}</p>
      <p className="mt-1 text-sm text-ink-soft">{label}</p>
    </div>
  );
}

export default function InsightsPage() {
  const [data, setData] = useState<Insights | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/insights")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError("加载失败"));
  }, []);

  useEffect(() => {
    document.title = "审稿洞察 · R&R Studio";
    return () => {
      document.title = "R&R Studio — 投稿加速流水线";
    };
  }, []);

  if (error) return <p className="py-20 text-center text-red-600">{error}</p>;
  if (!data) {
    return (
      <div className="space-y-5 pt-4">
        <div className="skeleton h-8 w-32 rounded-md bg-band" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="panel rounded-xl border border-line bg-white p-5">
              <div className="skeleton mx-auto h-9 w-14 rounded-md bg-band" />
              <div className="skeleton mx-auto mt-2 h-3.5 w-20 rounded-md bg-band" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="panel rounded-xl border border-line bg-white p-5">
              <div className="skeleton h-4 w-40 rounded-md bg-band" />
              <div className="skeleton mt-4 h-3 w-full rounded-md bg-band" />
              <div className="skeleton mt-2 h-3 w-5/6 rounded-md bg-band" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const maxCat = Math.max(1, ...data.categories.map((c) => c.count));

  return (
    <div className="rise-in space-y-6">
      <div>
        <Link
          href="/"
          className="group inline-flex items-center gap-1 text-[13px] text-ink-faint transition hover:text-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" strokeWidth={1.75} />
          返回列表
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">审稿洞察</h1>
        <p className="mt-1 text-sm text-ink-soft">
          跨项目聚合你的模拟审稿与 Critique 数据,看清自己的薄弱环节与进步趋势。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "累计稿件", value: data.totalProjects },
          { label: "已模拟审稿", value: data.reviewedProjects },
          { label: "Critique 条数", value: data.critiqueItems },
        ].map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel rounded-xl border border-line bg-white p-5">
          <h2 className="font-semibold">三位审稿人的录用建议分布</h2>
          <div className="mt-3 space-y-3">
            {data.recommendations.map((r) => (
              <div key={r.persona} className="text-sm">
                <p className="font-medium text-ink">{r.label}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {Object.entries(r.counts).map(([k, v]) => (
                    <span key={k} className={`rounded-full px-2 py-0.5 text-xs ${REC_STYLE[k]}`}>
                      {REC_LABEL[k]} × {v}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel rounded-xl border border-line bg-white p-5">
          <h2 className="font-semibold">Critique 问题类型分布</h2>
          {data.categories.length === 0 ? (
            <p className="mt-3 text-sm text-ink-faint">暂无数据,先在稿件里生成 Critique 报告。</p>
          ) : (
            <div className="mt-3 space-y-2">
              {data.categories.map((c) => (
                <div key={c.key} className="flex items-center gap-3 text-sm">
                  <span className="w-10 shrink-0 text-ink-soft">{c.label}</span>
                  <FillBar pct={(c.count / maxCat) * 100} className="h-3 flex-1" />
                  <span className="w-8 text-right text-xs text-ink-soft">{c.count}</span>
                </div>
              ))}
            </div>
          )}
          {data.severities.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
              {data.severities.map((s) => (
                <span key={s.key} className={`rounded-full px-2 py-0.5 text-xs ${SEV_STYLE[s.key]}`}>
                  {s.label} × {s.count}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel rounded-xl border border-line bg-white p-5">
          <h2 className="font-semibold">审稿人命中率</h2>
          <p className="mt-1 text-xs text-ink-faint">你标记为「有道理」的意见占比——衡量每类审稿人的意见可信度。</p>
          <div className="mt-3 space-y-2">
            {data.hitRates.map((h) => (
              <div key={h.persona} className="flex items-center gap-3 text-sm">
                <span className="min-w-0 flex-1 truncate text-ink-soft">{h.label}</span>
                <FillBar pct={h.rate ?? 0} className="h-3 w-32" innerClassName="bg-emerald-500" />
                <span className="w-20 text-right text-xs text-ink-soft">
                  {h.rate === null ? "未裁决" : `${h.rate}% (${h.valid}/${h.valid + h.invalid})`}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel rounded-xl border border-line bg-white p-5">
          <h2 className="font-semibold">承诺兑现率</h2>
          <p className="mt-1 text-xs text-ink-faint">回复信里答应的修改,在修改稿中兑现的情况。</p>
          {data.promises.total === 0 ? (
            <p className="mt-3 text-sm text-ink-faint">暂无承诺核查记录。</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">已兑现 × {data.promises.fulfilled}</span>
              <span className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">部分兑现 × {data.promises.partial}</span>
              <span className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">未兑现 × {data.promises.unmet}</span>
              <span className="ml-auto self-center text-xs text-ink-faint">
                兑现率 {Math.round((data.promises.fulfilled / data.promises.total) * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="panel rounded-xl border border-line bg-white p-5">
        <h2 className="font-semibold">审稿时间线</h2>
        {data.timeline.length === 0 ? (
          <p className="mt-3 text-sm text-ink-faint">暂无已审稿的稿件。</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {data.timeline.map((t) => (
              <li key={t.id} className="relative py-3 pl-5">
                <span aria-hidden className="absolute left-0 top-[1.4rem] h-2 w-2 rounded-full bg-accent/70" />
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/projects/${t.id}`} className="font-medium text-ink hover:text-accent">
                    {t.title}
                  </Link>
                  <span className="text-xs text-ink-faint">{new Date(t.date).toLocaleDateString("zh-CN")}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  {t.recs.map((r, i) => (
                    <span key={i} className={`rounded-full px-2 py-0.5 ${REC_STYLE[r.recommendation]}`}>
                      {r.persona.split("·")[0].trim()} → {REC_LABEL[r.recommendation]}
                    </span>
                  ))}
                  <span className="text-ink-faint">
                    Major {t.major} · Minor {t.minor}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
