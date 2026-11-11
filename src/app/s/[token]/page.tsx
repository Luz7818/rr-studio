import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { redeemShare, type SharedProject } from "@/lib/share";
import type { CritiqueItem, ReviewerReport } from "@/lib/types";

/**
 * 只读分享页 /s/[token]:token 换只读投影(redeemShare),校验不过一律 notFound()(404),
 * 不区分不存在/过期/撤销——无存在性泄露。无任何编辑入口;导航由 AppShell 按 /s/ 前缀隐藏。
 * 投影白名单见 src/lib/share.ts sanitizeForShare(原文章节/回复线程/Cover Letter/
 * 组会/文献列表均不进公开面)。
 */

export const metadata: Metadata = {
  title: "只读分享 · R&R Studio",
  robots: { index: false, follow: false },
};

// 每次请求实时校验 token(撤销/过期立即生效);动态段按需渲染不缓存
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  uploaded: "已解析",
  critiqued: "已 Critique",
  reviewed: "已审稿",
};

const SEVERITY_LABEL: Record<string, string> = { major: "Major", minor: "Minor", suggestion: "建议" };
const SEVERITY_STYLE: Record<string, string> = {
  major: "bg-rose-50 text-rose-700",
  minor: "bg-amber-50 text-amber-700",
  suggestion: "bg-band text-ink-soft",
};
const CATEGORY_LABEL: Record<string, string> = {
  logic: "逻辑",
  expression: "表达",
  grammar: "语法",
  style: "风格",
};
const RECOMMENDATION_LABEL: Record<string, string> = {
  accept: "接收",
  minor_revision: "小修",
  major_revision: "大修",
  reject: "拒稿",
};

function CritiqueList({ items }: { items: CritiqueItem[] }) {
  const sections = [...new Set(items.map((i) => i.section))];
  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <section key={section}>
          <h3 className="text-[13px] font-semibold text-ink">{section}</h3>
          <ul className="mt-2 space-y-2.5">
            {items
              .filter((i) => i.section === section)
              .map((item) => (
                <li key={item.id} className="rounded-2xl border border-line bg-white p-4">
                  <p className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className={`rounded-full px-2 py-0.5 font-medium ${SEVERITY_STYLE[item.severity] ?? "bg-band text-ink-soft"}`}>
                      {SEVERITY_LABEL[item.severity] ?? item.severity}
                    </span>
                    <span className="text-ink-faint">{CATEGORY_LABEL[item.category] ?? item.category}</span>
                  </p>
                  <p className="mt-2 text-xs italic leading-relaxed text-ink-faint">“{item.quote}”</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink">{item.comment}</p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-accent">建议:{item.suggestion}</p>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: ReviewerReport }) {
  const rec = RECOMMENDATION_LABEL[review.recommendation] ?? review.recommendation;
  return (
    <article className="rounded-2xl border border-line bg-white p-4">
      <p className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-ink">{review.label}</span>
        <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-medium text-accent">{rec}</span>
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-ink">{review.overall}</p>
      {(["major", "minor"] as const).map((kind) =>
        review[kind].length > 0 ? (
          <div key={kind} className="mt-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">
              {kind === "major" ? "Major" : "Minor"}({review[kind].length})
            </p>
            <ul className="mt-1.5 list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-ink-soft">
              {review[kind].map((c) => (
                <li key={c.id}>{c.text}</li>
              ))}
            </ul>
          </div>
        ) : null,
      )}
    </article>
  );
}

function SharedReport({ project }: { project: SharedProject }) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-[13px] font-semibold">Critique 报告</h2>
        {project.critique?.items.length ? (
          <div className="mt-3">
            <CritiqueList items={project.critique.items} />
          </div>
        ) : (
          <p className="mt-2 text-xs text-ink-faint">尚未生成 Critique 报告。</p>
        )}
      </section>

      <section>
        <h2 className="text-[13px] font-semibold">模拟审稿</h2>
        {project.reviews?.length ? (
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            {project.reviews.map((r) => (
              <ReviewCard key={r.persona} review={r} />
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-ink-faint">尚未生成审稿意见。</p>
        )}
      </section>

      <section>
        <h2 className="text-[13px] font-semibold">修改稿对照</h2>
        {project.revision ? (
          <div className="mt-3 space-y-3">
            <div className="rounded-2xl border border-line bg-white p-4">
              <p className="text-[13px] leading-relaxed text-ink">{project.revision.overall}</p>
            </div>
            {project.revision.diff.length > 0 && (
              <ul className="space-y-1.5">
                {project.revision.diff.map((d, i) => (
                  <li key={`${d.section}-${i}`} className="flex flex-wrap items-baseline gap-2 text-xs">
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium ${
                        d.changeType === "unchanged" ? "bg-band text-ink-faint" : "bg-accent-soft text-accent"
                      }`}
                    >
                      {d.changeType}
                    </span>
                    <span className="font-medium text-ink">{d.section}</span>
                    <span className="text-ink-faint">{d.description}</span>
                  </li>
                ))}
              </ul>
            )}
            {project.revision.promiseChecks && project.revision.promiseChecks.length > 0 && (
              <div className="rounded-2xl border border-line bg-white p-4">
                <h3 className="text-[13px] font-semibold text-ink">承诺兑现核查</h3>
                <ul className="mt-2 space-y-2">
                  {project.revision.promiseChecks.map((p) => (
                    <li key={p.commentId} className="text-xs leading-relaxed">
                      <span className="font-medium text-ink">{p.reviewer}</span>
                      <span className="ml-1.5 text-ink-faint">({p.status === "fulfilled" ? "已兑现" : p.status === "partial" ? "部分兑现" : "未兑现"})</span>
                      <span>: {p.commitment}</span>
                      <span className="mt-0.5 block text-ink-soft">证据:{p.evidence}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-2 text-xs text-ink-faint">尚未上传修改稿。</p>
        )}
      </section>
    </div>
  );
}

export default async function SharedPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const redeemed = await redeemShare(token);
  if (!redeemed) notFound();
  const { project, expiresAt } = redeemed;

  return (
    <div className="mx-auto max-w-3xl">
      <header className="rounded-3xl border border-line bg-white/85 p-6 card-shadow">
        <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">
          R&amp;R Studio · 只读分享
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink">{project.title}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-faint">
          <span className="rounded-full border border-line bg-band px-2.5 py-0.5 font-medium text-ink-soft">
            {STATUS_LABEL[project.status] ?? project.status}
          </span>
          <span>有效期至 {new Date(expiresAt).toLocaleString("zh-CN")}</span>
          {project.meta?.targetJournal && <span>目标期刊:{project.meta.targetJournal}</span>}
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">
          本页为作者主动分享的只读报告快照:稿件原文、回复草稿与个人信息不在此列。
        </p>
      </header>
      <div className="mt-6">
        <SharedReport project={project} />
      </div>
      <p className="mt-10 text-center text-[11px] text-ink-faint">Generated by R&amp;R Studio</p>
    </div>
  );
}
