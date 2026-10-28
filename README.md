# R&R Studio · 研究生投稿加速流水线

> 用途:给第一次打开这个仓库的人。看完知道它是什么、能不能解决你的问题、怎么跑起来。

上传英文论文草稿,自动脱敏分节后跑一条流水线:逐段 Critique → 三位 AI 审稿人(依据 OpenAlex
检索的近三年真实文献)→ Response Letter 逐条打磨 → Word 版回复信/Critique 报告、Cover Letter、
组会 PPTX 导出 → 大修后上传修改稿做逐节对照与承诺兑现核查。例:一篇 8 章节稿件 + 1 次点击,
得到 40 余条带英文改写建议的 Critique 与 3 份 Major/Minor 审稿意见,全程作者信息不出本机脱敏层。

**规模:22 个 API 路由、9 个页面(复核:`npm run build` 输出路由表;或 `find src/app -name route.ts` 应输出 22 行)**

## 30 秒跑通

```bash
# 在仓库根目录执行;不配 key 也能跑(演示模式,内容为占位示例)
npm install
cp .env.example .env.local
npm run dev
```

打开 `http://localhost:3000`,上传任一 PDF/DOCX 或粘贴文本,能看到章节结构就说明装对了。
要真实分析,在 `.env.local` 填 `LLM_API_KEY`(任一 OpenAI 兼容供应商)。完整步骤看
[上手手册](docs/GET-START.md)。

## 它能做什么

| 能力 | 怎么用 | 细节 |
|---|---|---|
| 解析 + 脱敏 | 首页上传或粘贴 | 标题页整体排除;邮箱/基金号/链接自动打码 |
| Critique 报告 | 工作台「Critique 报告」页签 | 逻辑/表达/语法/风格四维,可勾选采纳,导出 Word |
| 模拟审稿 | 「模拟审稿」页签,先点「获取真实文献对标」(可自定义检索词) | 三位审稿人 Major/Minor;意见可标记「有道理/不成立」 |
| Response Letter | 「回复审稿人」页签 | 你写草稿 AI 打磨,批量打磨,导出 Word 逐点回复信 |
| 修改稿对照 | 「修改稿对照」页签 | 逐节差异 + 重审;承诺兑现核查逐条验证是否真改了 |
| 组会引擎 | 「组会汇报」页签 | PPT 大纲 + 逐页讲稿 + 导师 Q&A 预演,导出 PPTX(讲稿在演讲者备注) |
| 审稿洞察 | 侧栏「审稿洞察」 | 审稿人命中率、Critique 类型分布、承诺兑现率 |

## 目录怎么分

| 目录 | 负责 |
|---|---|
| `src/` | 全部源码:`app/`(页面与 API)、`components/`、`lib/`(解析/脱敏/LLM/存储/配额) |
| `scripts/` | 交付自检脚本 `smoke.mjs` |
| `supabase/` | SaaS 模式的建表迁移 SQL |
| `docs/` | 上手、架构、代码/测试/Git 规范 |

每块负责什么的细节在各目录的 `README.md`,整棵树的入口见 [目录说明](目录说明.md)。

## 双模式

未配 Supabase 环境变量 = **本地模式**:数据存 `.data/`,无需登录,侧栏显示「本地模式」。
配好并执行 `supabase/migration.sql` 后自动切 **SaaS 模式**:邮箱注册(内测邀请码)、Free 每月
1 篇额度、Pro/Lab 无限。接入步骤见 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)。

## 已知做不到什么

- **校外访问高校 LLM 端点被 WAF 拦截**(HTTP 420):换公共供应商或连校园网,应用会给出明确报错。
- **文献对标依赖开放检索 API**:OpenAlex/Semantic Scholar 不可达时审稿退回无文献依据模式
  (不联网也能跑,但审稿人不再引用真实论文)。
- **单元测试只覆盖纯函数**:parse/sanitize 有 vitest 用例(`npm test`);LLM 调用链的函数级回归
  仍靠 15 步端到端 smoke(见 [docs/TESTING.md](docs/TESTING.md))。
- **双栏 PDF 公式密集稿解析质量有限**:unpdf 按文本流抽取,复杂排版可能切节不准,建议粘贴文本兜底。
- **SaaS 模式 LLM 次数限额**:Free 每月默认 60 次(`FREE_LLM_MONTHLY_LIMIT`),需在 Supabase
  重跑 `supabase/migration.sql` 建 `llm_usage` 表后生效;本地/演示模式不限额。

## 环境要求

- Node.js ≥ 20(实测 24)、npm。
- LLM:任一 OpenAI Chat Completions 兼容供应商的 API key(不配则为演示模式)。
- Supabase(可选):仅 SaaS 模式需要。
- 文献对标需能访问 `api.openalex.org`(失败自动回退 Semantic Scholar)。

## 许可与引用

未设开源许可证(个人项目,默认保留所有权利)。引用格式:`R&R Studio, https://github.com/Luz7818`(远端待配)。

---

维护:AI 改动本仓库前请读 [AGENTS.md](AGENTS.md)。
