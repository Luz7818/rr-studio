import { NextRequest, NextResponse } from "next/server";
import { chatJSON, isLlmConfigured } from "@/lib/llm";
import { seminarQuestionsPrompt, seminarSlidesPrompt } from "@/lib/prompts";
import { mockSeminarQuestions, mockSeminarSlides } from "@/lib/mocks";
import { getApiContext } from "@/lib/auth";
import { consumeLlmCalls, guardLlmQuota } from "@/lib/quota";
import type { Seminar, SeminarQuestion, SeminarSlide } from "@/lib/types";

export const maxDuration = 60;

const SKIP_HEADINGS = new Set(["References", "Appendix", "Acknowledgments", "Keywords"]);
const MAX_CHARS = 16000;
const DURATIONS = [5, 10, 15];

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const actx = await getApiContext();
  if (!actx.ok) return actx.res;
  const quotaRes = await guardLlmQuota(actx.ctx);
  if (quotaRes) return quotaRes;
  const { id } = await ctx.params;
  const project = await actx.ctx.store.get(actx.ctx.userId, id);
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { durationMin?: number; language?: string };
  const durationMin = DURATIONS.includes(Number(body.durationMin)) ? Number(body.durationMin) : 10;
  const language = body.language === "en" ? "en" : "zh";

  const fullText = project.sections
    .filter((s) => !SKIP_HEADINGS.has(s.heading))
    .map((s) => `## ${s.heading}\n\n${s.text}`)
    .join("\n\n")
    .slice(0, MAX_CHARS);

  const [slidesRes, questionsRes] = await Promise.allSettled([
    (async (): Promise<SeminarSlide[]> => {
      if (isLlmConfigured()) {
        const { system, user } = seminarSlidesPrompt(project.title, fullText, durationMin, language);
        const out = await chatJSON<{ slides?: Array<{ title?: string; bullets?: string[]; script?: string }> }>(
          system,
          user,
        );
        return (out.slides ?? [])
          .filter((s) => s.title && s.script)
          .map((s) => ({
            title: String(s.title),
            bullets: (Array.isArray(s.bullets) ? s.bullets : []).map(String).slice(0, 6),
            script: String(s.script),
          }));
      }
      return mockSeminarSlides(project.title).slides;
    })(),
    (async (): Promise<SeminarQuestion[]> => {
      if (isLlmConfigured()) {
        const { system, user } = seminarQuestionsPrompt(project.title, fullText, language);
        const out = await chatJSON<{ questions?: Array<{ question?: string; hint?: string }> }>(system, user);
        return (out.questions ?? [])
          .filter((q) => q.question)
          .map((q) => ({ question: String(q.question), hint: String(q.hint ?? "") }))
          .slice(0, 5);
      }
      return mockSeminarQuestions().questions;
    })(),
  ]);

  if (slidesRes.status === "rejected") {
    const msg = slidesRes.reason instanceof Error ? slidesRes.reason.message : "生成失败";
    return NextResponse.json({ error: `组会大纲生成失败: ${msg}` }, { status: 502 });
  }

  const seminar: Seminar = {
    durationMin,
    language,
    slides: slidesRes.value,
    questions: questionsRes.status === "fulfilled" ? questionsRes.value : [],
    createdAt: new Date().toISOString(),
  };
  // 字段级回写:只写 seminar;两次 LLM 调用(大纲 + Q&A)按成功次数计
  const latest = (await actx.ctx.store.get(actx.ctx.userId, id)) ?? project;
  latest.seminar = seminar;
  await actx.ctx.store.save(actx.ctx.userId, latest);
  void consumeLlmCalls(
    actx.ctx.userId,
    isLlmConfigured() ? (questionsRes.status === "fulfilled" ? 2 : 1) : 0,
  );
  return NextResponse.json({ project: latest });
}
