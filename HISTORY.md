# HISTORY.md —— 版本与决策更新记录

> 用途:记录版本节点与关键决策,只追加,禁止删除或改写历史条目。计划不写在这里(那是 TODO.md)。

## 2026-10-12 · v0.1.0 M1 完整投稿流水线

- 初始化 Next.js 16 + TypeScript + Tailwind v4 项目(`create-next-app`,git 由脚手架初始化)。
- 实现解析分节(`lib/parse.ts`,IMRaD 启发式 + PDF 断词修复)、脱敏层(`lib/sanitize.ts`,
  邮箱/ORCID/基金号/链接/单位行打码)、LLM 客户端(`lib/llm.ts`)。
- 五条流水线 API:上传、Critique、模拟审稿(3 persona)、回复打磨、Cover Letter;
  工作台五页签;本地 JSON 文件存储(`.data/`)。
- 决策:存储层预留接口,自用阶段用本地文件,开放注册时切 Supabase;提示词集中在
  `lib/prompts.ts` 作为产品调优主战场。未配 key 时全链路演示模式(占位示例),保证零成本走通。

## 2026-10-12 · v0.2.0 M2 组会引擎 + 修改稿对照 + 审稿洞察

- 组会引擎:5/10/15 分钟、中英文讲稿,`pptxgenjs` 导出真实 PPTX,讲稿写入演讲者备注,
  导师 Q&A 预演 5 问。9 页 PPTX 结构经 zip 解包验证(备注、要点齐全)。
- 修改稿对照:上传修改稿 → AI 逐节差异(新增/删除/修改/未变)+ 总评 → 对修改稿重审
  (不覆盖原稿回复线程,不计入额度)。
- 审稿洞察页 `/insights`:跨项目聚合审稿建议分布、Critique 类型与时间线。
- 接入 `Secrets/harness.env` 的 SEU aicloud 端点(qwen3.8-27b)为本机默认配置,
  `llm.ts` 支持 `LLM_EXTRA_BODY`(关思考模式/移除 response_format)与 WAF HTML 响应识别。
- 决策:发现校外被 WAF 420 拦截,明确「错误透出 + 提示连校园网」而不是静默降级。

## 2026-10-13 · v0.3.0 M3 SaaS 化

- Supabase SSR 认证(`@supabase/ssr`):登录/注册(服务端邀请码校验,service role)、邮箱确认回调。
- 路由保护:Next 16 `src/proxy.ts`(middleware 新约定),`/` 与 `/pricing` 公开。
- 免费额度:Free 每自然月 1 篇,Pro/Lab 无限,到期自动回落;存储层重构为 `ProjectStore`
  接口(本地文件 / Supabase 双实现,按 user_id 隔离,旧数据自动迁移)。
- 定价页 + 邀请码内测 + SQL 手动开通;`supabase/migration.sql` 建表、触发器与 RLS。
- 决策:支付通道需商户资质,内测期用 SQL 手动开通(定价页有模板),TODO 挂账。

## 2026-10-13 · v0.4.0 交付件补齐

- Word 导出:`docx` 生成 Response Letter(审稿人分组、Comment 斜体、Response 逐点)与
  Critique 报告(章节分组、采纳勾选)。
- 批量打磨(顺序执行带进度)、复制全部回复;SaaS 公开落地页 + 首页按登录态分流。
- 交付自检 `npm run smoke`(端到端断言,支持 `SMOKE_BASE_URL` 检线上)。
- 真实模式(校园网 + qwen)全链路验证,并加固:`jsonrepair` 修复 LLM 偶发 JSON 语法错误、
  网络层自动重试、重审按 commentId 保留草稿/打磨稿。

## 2026-10-13 · v0.5.0 前端设计系统重构

- 浏览器实测 flolab.cn 提取设计语言,建立令牌系统(`globals.css` @theme):白底 + 靛蓝
  `#5147E5` 单主色、胶囊几何、超粗黑标题、浮岛卡片、点阵装饰。
- 顶栏改左侧工作台侧栏(`AppShell.tsx`,移动端自动顶栏);落地页重写(hero 点阵 + 浮岛
  mockup + 深色 CTA 带);全站控件胶囊化;新增 favicon。
- 修复:`new Date()` 阻塞预渲染(抽 `FooterYear` 客户端组件)、proxy getUser 容错。

## 2026-10-14 · v0.6.0 质量闭环 + 文献对标

- 意见裁决:每条审稿意见可标记「有道理/不成立」,洞察页新增审稿人命中率;重审保留裁决。
- 修改承诺 + 承诺兑现核查(独有功能):回复线程可手填或 AI 批量提取「在哪改什么」;
  上传修改稿后逐条对照验证(已兑现/部分/未兑现 + 原文证据)。
- 文献对标(补齐最大短板):OpenAlex 优先、Semantic Scholar 兜底检索近三年真实文献,
  审稿提示词注入文献清单并禁止编造引用;检索结果按被引优先排序。真实模式 smoke 14/14 通过。
- lint 清零(修 re-review 未传 literatureBlock 的真 bug 等),文档按工作区《项目整体规范》建齐。
