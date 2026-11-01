/**
 * R&R Studio 交付自检脚本:对运行中的实例完整走一遍产品流水线并断言结果。
 *
 * 用法:
 *   LLM_API_KEY= npm run smoke        # 演示模式(wiring 检查,无 API 消耗)
 *   npm run smoke                     # 真实模式(需已配置可用 key,逐项真实调用)
 *   SMOKE_BASE_URL=https://xxx npm run smoke   # 检查线上部署
 */
const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

const results = [];
const step = async (name, fn) => {
  try {
    await fn();
    results.push(true);
    console.log(`  ✓ ${name}`);
  } catch (e) {
    results.push(false);
    console.error(`  ✗ ${name} — ${String(e.message).slice(0, 160)}`);
  }
};
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};
const json = async (res) => {
  const d = await res.json();
  assert(res.ok, `${res.status}: ${d.error ?? "unknown"}`);
  return d;
};

const SAMPLE = `Smoke Test of Deep Learning Traffic Signal Control
Author Alice (alice@example.edu), Some University, Grant No. 12345678

Abstract
Urban congestion is costly. This paper proposes a multi-agent reinforcement learning framework for signal control, reducing average delay by 18.3 percent on a 25-intersection network versus strong baselines.

Keywords
traffic signal control; reinforcement learning

1. Introduction
Fixed-time plans cannot adapt to fluctuating demand. We propose a decentralized framework that learns cooperative policies from local observations only. Contributions: attention-based communication, fairness-aware reward, large-scale experiments.

2. Methods
Each intersection is an agent with queue-length state. MAPPO with centralized training and decentralized execution. SUMO simulation with calibrated demand. Baselines: FixedTime, MaxPressure, MPLight. Five seeds, Welch t-test at 0.05. Code available at https://github.com/example/traffic-rl.

3. Results
Delay 42.6 s/veh vs 52.1 for MPLight (p < 0.01). Gini improves 12.4 percent. Ablation: removing attention raises delay by 9.7 percent. Preprint: https://arxiv.org/abs/2501.12345.

4. Discussion
Local-observation agents coordinate via learned communication. Limitation: 48 GPU-hours per network.

5. Conclusion
A practical step toward deployable adaptive traffic control.

References
[1] A. Author, Deep RL for signal control, 2024.`;

const REVISION_SAMPLE = SAMPLE.replace(
  "reducing average delay by 18.3 percent",
  "reducing average delay by 21.7 percent",
).replace("Five seeds", "Ten seeds with confidence intervals");

const isZip = (buf) => buf.length > 4 && buf[0] === 0x50 && buf[1] === 0x4b;
let projectId;

console.log(`\nR&R Studio 冒烟测试 → ${BASE}\n`);

// 实例指纹自检:本应用的 API 对未知资源必返回 JSON(404/401),陌生实例多半回 HTML 页。
// 端口被陈旧进程劫持时,15 步会全部打出误导性失败——先挡在门外(RR-01)。
const probe = await fetch(`${BASE}/api/projects/00000000-0000-0000-0000-000000000000`).catch(() => null);
const probeType = probe?.headers.get("content-type") ?? "";
if (!probe || !probeType.includes("application/json")) {
  console.error(`  ✗ 目标 ${BASE} 不是 R&R Studio 实例(${probe ? `content-type: ${probeType}` : "无法连接"})。`);
  console.error("    若 3000 端口被陈旧进程或其他应用占用:先杀掉占用进程;或另起端口自起构建产物,用 SMOKE_BASE_URL 指定。");
  process.exit(1);
}
console.log("  ✓ 实例指纹(目标 API 返回 JSON)");

await step("首页可访问", async () => {
  const r = await fetch(`${BASE}/`);
  assert(r.ok, `status ${r.status}`);
});

await step("上传稿件(解析+脱敏)", async () => {
  const r = await fetch(`${BASE}/api/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: SAMPLE, title: "Smoke Test Paper", targetJournal: "IEEE T-ITS" }),
  });
  const d = await json(r);
  projectId = d.project.id;
  assert(d.project.sections.length >= 4, `sections=${d.project.sections.length}`);
  assert(d.project.sanitize.removedAuthorBlock, "标题页(作者区)应被整体排除");
  assert(d.project.sanitize.redactions >= 1, "正文应至少脱敏 1 处(URL)");
});

await step("文献对标(真实检索)", async () => {
  const d = await json(await fetch(`${BASE}/api/projects/${projectId}/literature`, { method: "POST" }));
  assert((d.project.literature?.papers ?? []).length >= 3, "papers < 3");
});

await step("文献对标(自定义检索词)", async () => {
  const d = await json(
    await fetch(`${BASE}/api/projects/${projectId}/literature`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queries: ["adaptive traffic signal control deep learning"] }),
    }),
  );
  const lit = d.project.literature;
  assert((lit?.papers ?? []).length >= 3, "papers < 3");
  assert(lit.queries.join(" ").includes("adaptive traffic signal"), "检索词未采用手动输入");
});

await step("Critique 报告(苛刻口径)", async () => {
  const d = await json(
    await fetch(`${BASE}/api/projects/${projectId}/critique`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intensity: "strict" }),
    }),
  );
  assert(d.project.critique.items.length > 0, "items 为空");
  assert(d.project.critique.intensity === "strict", "口径未随报告落库");
});

await step("模拟审稿 + 回复线程", async () => {
  const d = await json(await fetch(`${BASE}/api/projects/${projectId}/review`, { method: "POST" }));
  assert(d.project.reviews.length === 3, `reviews=${d.project.reviews.length}`);
  assert((d.project.responses ?? []).length > 0, "threads 为空");
});

await step("回复打磨", async () => {
  const cid = "methodologist-major-1";
  await json(
    await fetch(`${BASE}/api/projects/${projectId}/responses`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threads: [
          {
            commentId: cid,
            type: "major",
            reviewer: "Reviewer #1",
            commentText: "baseline",
            draft: "We added two baselines and report variance over 10 seeds.",
            polished: "",
            verdict: "valid",
            commitment: "Methods 增加两个基线并报告方差",
            updatedAt: new Date().toISOString(),
          },
        ],
      }),
    }),
  );
  const d = await json(
    await fetch(`${BASE}/api/projects/${projectId}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId: cid }),
    }),
  );
  assert(d.thread.polished.length > 20, "polished 为空");
});

await step("Word 导出:Response Letter", async () => {
  const r = await fetch(`${BASE}/api/projects/${projectId}/export/response-letter`);
  assert(r.ok, `status ${r.status}`);
  assert(isZip(Buffer.from(await r.arrayBuffer())), "不是有效的 docx(zip)");
});

await step("Word 导出:Critique 报告", async () => {
  const r = await fetch(`${BASE}/api/projects/${projectId}/export/critique`);
  assert(r.ok, `status ${r.status}`);
  assert(isZip(Buffer.from(await r.arrayBuffer())), "不是有效的 docx(zip)");
});

await step("Cover Letter + Word 导出", async () => {
  const d = await json(await fetch(`${BASE}/api/projects/${projectId}/cover-letter`, { method: "POST" }));
  assert(d.project.coverLetter.content.length > 50, "内容过短");
  const exp = await fetch(`${BASE}/api/projects/${projectId}/export/cover-letter`);
  assert(exp.ok, `导出 ${exp.status}`);
  assert(
    (exp.headers.get("content-type") ?? "").includes("wordprocessingml"),
    "导出非 docx",
  );
});

await step("组会引擎 + PPTX 导出", async () => {
  const d = await json(
    await fetch(`${BASE}/api/projects/${projectId}/seminar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationMin: 10, language: "zh" }),
    }),
  );
  assert(d.project.seminar.slides.length >= 4, `slides=${d.project.seminar.slides.length}`);
  const r = await fetch(`${BASE}/api/projects/${projectId}/seminar/pptx`);
  assert(r.ok && isZip(Buffer.from(await r.arrayBuffer())), "pptx 无效");
});

await step("修改稿对照(上传+对比+重审)", async () => {
  await json(
    await fetch(`${BASE}/api/projects/${projectId}/revision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: REVISION_SAMPLE }),
    }),
  );
  const d = await json(await fetch(`${BASE}/api/projects/${projectId}/revision/summary`, { method: "POST" }));
  assert(d.project.revision.diff.length > 0, "diff 为空");
  const d2 = await json(await fetch(`${BASE}/api/projects/${projectId}/revision/re-review`, { method: "POST" }));
  assert(d2.project.revision.reviews.length === 3, "re-reviews != 3");
});

await step("承诺兑现核查", async () => {
  const d = await json(await fetch(`${BASE}/api/projects/${projectId}/revision/promise-check`, { method: "POST" }));
  assert((d.project.revision.promiseChecks ?? []).length >= 1, "promiseChecks 为空");
});

await step("审稿洞察", async () => {
  const d = await json(await fetch(`${BASE}/api/insights`));
  assert(d.totalProjects >= 1, "totalProjects=0");
  assert(d.recommendations.length === 3, "personas != 3");
  assert(d.hitRates.length === 3, "hitRates != 3");
  assert(typeof d.promises.total === "number", "promises 缺失");
});

await step("清理测试数据", async () => {
  const d = await json(await fetch(`${BASE}/api/projects/${projectId}`, { method: "DELETE" }));
  assert(d.ok === true, "delete 失败");
});

const passed = results.filter(Boolean).length;
console.log(`\n结果: ${passed}/${results.length} 项通过${passed === results.length ? " ✅ 可以交付" : " ❌ 存在失败项"}\n`);
process.exit(passed === results.length ? 0 : 1);
