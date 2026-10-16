import type { Persona, Recommendation, Severity, Category } from "./types";

const NOTE = "[演示模式] 未配置 LLM_API_KEY,以下为占位示例;在 .env.local 中配置后重新生成即可获得真实分析。";

export function mockCritique(heading: string) {
  const rows: Array<{ severity: Severity; category: Category; quote: string; comment: string; suggestion: string }> = [
    {
      severity: "major",
      category: "logic",
      quote: "(原文片段将出现在这里)",
      comment: `${NOTE} ${heading} 章节的论证链条存在断裂:结论所依赖的前提未在正文给出支撑。`,
      suggestion: "在段落开头补充一句衔接句,明确本节结果如何支撑核心主张,例如: This result directly supports our central claim that ...",
    },
    {
      severity: "minor",
      category: "expression",
      quote: "(原文片段将出现在这里)",
      comment: "表达偏口语化,学术期刊审稿人可能认为不够正式。",
      suggestion: '改写为: "The proposed framework demonstrates a statistically significant improvement (p < 0.05) over the baseline."',
    },
    {
      severity: "suggestion",
      category: "style",
      quote: "(原文片段将出现在这里)",
      comment: "术语在全文中应保持一致(如 framework/model/system 三选一)。",
      suggestion: "全文检索并统一核心术语;首次出现时给出缩写定义。",
    },
  ];
  return { items: rows };
}

const MOCK_REVIEWS: Record<Persona, { overall: string; recommendation: Recommendation; major: string[]; minor: string[] }> = {
  methodologist: {
    overall:
      "[演示模式] The manuscript addresses a relevant problem, but the experimental design does not fully support the central claim. The absence of key baselines and ablation studies weakens the contribution.",
    recommendation: "major_revision",
    major: [
      "The proposed method is compared against only one baseline. Please include at least two recent state-of-the-art methods published in the last three years.",
      "The novelty claim in the Introduction is too strong given the similarity to prior work; please clarify the exact technical difference.",
    ],
    minor: [
      "Section 3.2: the notation is inconsistent with Section 4.",
      "Please specify dataset licensing and availability for reproducibility.",
    ],
  },
  statistician: {
    overall:
      "[演示模式] While the results appear promising, the statistical treatment is insufficient. Uncertainty is not quantified and significance is claimed without formal testing.",
    recommendation: "major_revision",
    major: [
      "No confidence intervals or standard deviations are reported across runs; please repeat experiments with multiple seeds and report variance.",
      "The claim of 'significant improvement' requires a formal statistical test; please state the test used and the p-values.",
    ],
    minor: ["Figure 4 would benefit from error bars.", "Please clarify the sample size justification."],
  },
  "domain-expert": {
    overall:
      "[演示模式] The paper is clearly written and the topic fits the journal scope. The contribution is incremental but useful; the literature review misses several recent studies.",
    recommendation: "minor_revision",
    major: ["The literature review omits recent work from 2024-2025; please update and position your contribution accordingly."],
    minor: [
      "The abstract could state the quantitative improvement upfront.",
      "Please proofread the Conclusion for typos.",
    ],
  },
};

export function mockReview(persona: Persona) {
  return MOCK_REVIEWS[persona];
}

export function mockPolish(comment: string) {
  const topic = comment.slice(0, 120).replace(/\s+/g, " ");
  return `We thank the reviewer for this insightful comment regarding: "${topic}..."

[演示模式] Below is the structure a polished response would follow:

1. We appreciate the reviewer's point. We agree that ...
2. In response, we have ... [TODO: 补充你的具体证据或数据]
3. We have revised the manuscript accordingly (Section X, page Y): "..." [TODO: 粘贴修改后的原文]

配置 LLM_API_KEY 后,AI 将基于你的草稿生成完整的正式回复。`;
}

export function mockCoverLetter(title: string) {
  return `Dear Editor-in-Chief,

We are pleased to submit our manuscript entitled "${title}" for consideration for publication in [Journal Name].

[演示模式] In this work, we ... [TODO: 两到三句话概括论文的核心发现与意义]

We believe this manuscript falls within the scope of [Journal Name] because ...

This manuscript is original, has not been published previously, and is not under consideration elsewhere. All authors have approved the manuscript and agree with its submission. The authors declare no conflicts of interest.

Thank you for your consideration. We look forward to hearing from you.

Sincerely,
[Corresponding Author Name], on behalf of all authors
[Affiliation]
[Email]

---
${NOTE}`;
}

export function mockSeminarSlides(title: string) {
  const rows: Array<{ title: string; bullets: string[]; script: string }> = [
    {
      title,
      bullets: ["论文精读汇报", "[演示模式]"],
      script: `大家好,本周我精读的论文是《${title}》。选这篇文章是因为它与我们的课题直接相关,方法设计有可借鉴之处。`,
    },
    {
      title: "研究背景与动机",
      bullets: ["领域痛点", "现有方法不足", "本文切入点"],
      script: "[演示模式] 先看背景。这个领域的核心痛点是……现有方法主要有两类思路,但分别存在……的问题,这就是本文的切入点。",
    },
    {
      title: "方法总体框架",
      bullets: ["核心模块", "关键设计", "创新点"],
      script: "[演示模式] 整体框架分三步:输入如何表示、核心模块如何处理、输出如何决策。我认为最关键的设计是……",
    },
    {
      title: "实验设置",
      bullets: ["数据集/场景", "对比基线", "评价指标"],
      script: "[演示模式] 实验在……上进行,对比了……等基线,指标用的是……,设置比较标准。",
    },
    {
      title: "主要结果",
      bullets: ["关键数字(来自论文)", "消融实验"],
      script: "[演示模式] 主结果:论文报告了……的提升(具体数字以论文为准)。消融实验证明每个模块都有贡献。",
    },
    {
      title: "启发与借鉴",
      bullets: ["对我们课题的启发", "可借鉴的设计"],
      script: "[演示模式] 对我们课题最有价值的是……这个设计思路,可以尝试迁移到……场景。",
    },
    {
      title: "局限与讨论",
      bullets: ["论文自述局限", "我的补充看法"],
      script: "[演示模式] 论文承认的局限是……我补充一点:……这可能影响……",
    },
    {
      title: "总结",
      bullets: ["一句话贡献", "后续计划"],
      script: "[演示模式] 总结:这篇论文的核心贡献是……下一步我计划在……上验证类似思路。以上是我的汇报,请各位老师同学批评指正。",
    },
  ];
  return { slides: rows };
}

export function mockSeminarQuestions() {
  const rows: Array<{ question: string; hint: string }> = [
    { question: "[演示模式] 这篇文章和你自己课题的关系到底是什么?只是相关还是真能用上?", hint: "回答要点:先一句话讲清共同点,再具体说哪个模块/思路可以迁移,以及迁移的前提条件。" },
    { question: "[演示模式] 论文的对比实验是否公平?基线选择有没有偏向?", hint: "回答要点:检查基线是否是最新的、调参是否充分;如果论文有消融,说明各模块贡献是否可信。" },
    { question: "[演示模式] 方法的计算复杂度如何?能扩展到更大规模吗?", hint: "回答要点:从论文的训练/推理开销出发,推算大规模场景下的瓶颈,并给出论文是否讨论了这一点。" },
    { question: "[演示模式] 如果把某个关键假设去掉,方法还成立吗?", hint: "回答要点:识别方法最依赖的假设,说明去掉后哪一环会失效,论文是否有对应实验。" },
    { question: "[演示模式] 你觉得这篇论文最大的弱点是什么?", hint: "回答要点:给出一个具体、有依据的批评(数据、设计或论证),不要泛泛而谈;并说明如何改进。" },
  ];
  return { questions: rows };
}

export function mockRevisionSummary(oldHeadings: string[], newHeadings: string[]) {
  const diff: Array<{ section: string; changeType: "added" | "removed" | "modified" | "unchanged"; description: string }> = [];
  const oldSet = new Set(oldHeadings);
  const newSet = new Set(newHeadings);
  for (const h of oldHeadings) {
    if (!newSet.has(h)) {
      diff.push({ section: h, changeType: "removed", description: "[演示模式] 该章节在修改稿中已删除。" });
    } else {
      diff.push({ section: h, changeType: "modified", description: "[演示模式] 该章节有修改:表述与内容有调整,具体差异配置 LLM 后可见。" });
    }
  }
  for (const h of newHeadings) {
    if (!oldSet.has(h)) {
      diff.push({ section: h, changeType: "added", description: "[演示模式] 修改稿新增的章节。" });
    }
  }
  return {
    diff,
    overall: "[演示模式] 修改稿整体有实质性调整:若干章节被修改/新增/删除。配置 LLM_API_KEY 后,AI 将逐节给出真实差异说明与总评。",
  };
}

export function mockCommitments(ids: string[]) {
  return {
    items: ids.map((id, i) => ({
      id,
      commitment: ["Methods 增加两个基线并报告方差", "Results 补充 10 seeds 置信区间", "Introduction 收敛 novelty 表述"][i % 3],
    })),
  };
}

export function mockPromiseChecks(promises: Array<{ id: string; commitment: string }>) {
  const statuses: Array<"fulfilled" | "partial" | "unmet"> = ["fulfilled", "partial", "unmet"];
  return {
    checks: promises.map((p, i) => ({
      id: p.id,
      status: statuses[i % 3],
      evidence: `[演示模式] ${p.commitment} 的核查结论;配置 LLM_API_KEY 后将引用修改稿原文作为证据。`,
    })),
  };
}

export function mockLiterature() {
  const papers = [
    { title: "Graph-Attention Multi-Agent RL for Large-Scale Signal Control", year: 2025, venue: "IEEE T-ITS", citedBy: 14 },
    { title: "Decentralized Traffic Signal Control with Local Observations: A Survey", year: 2025, venue: "TR Part C", citedBy: 31 },
    { title: "MAPPO Variants for Urban Mobility: A Benchmark Revisited", year: 2024, venue: "Transportation Research Record", citedBy: 22 },
    { title: "Fairness-Aware Reward Shaping in Signal Control", year: 2024, venue: "IEEE T-ITS", citedBy: 9 },
  ];
  return {
    queries: ["multi-agent reinforcement learning traffic signal control", "decentralized signal control graph attention"],
    papers: papers.map((p) => ({
      ...p,
      url: "https://openalex.org/demo",
      abstract: "[演示模式] 检索到 近三年真实文献占位;配置后来自 OpenAlex/Semantic Scholar 真实数据。",
    })),
    source: "OpenAlex(演示)",
    errors: [],
  };
}
