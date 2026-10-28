<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md —— 项目协作与代码开发规范（唯一权威入口）

> 用途：给 AI 编码助手与所有开发者。这里是规范入口与索引：目标、原则、流程、模块规则、维护矩阵、
> 阅读清单都在这份文件里。细则一律链接到对应文件，冲突时以细则文件为准并回改本文件。
> 被别的文档引用的事实（测试数、命令、路径）以本文件为准，其他文档只链接不复述。

## 项目目标

- 定位：面向研究生的**投稿加速流水线** Web 应用——上传英文论文草稿，自动脱敏分节，逐段 Critique、
  三位 AI 审稿人（真实文献对标）、Response Letter 打磨、Cover Letter、组会 PPTX、修改稿对照与
  承诺兑现核查，产出物可直接用于投稿。双模式运行：未配 Supabase 为本地单机自用，配置后切 SaaS
  （登录/邀请码/免费额度）。
- 核心功能：①解析脱敏（PDF/DOCX/粘贴 → 章节 + 敏感信息打码）②审稿链路（Critique / 模拟审稿 /
  文献对标）③交付链路（Response Letter 与 Critique 的 Word 导出、Cover Letter、组会 PPTX）
  ④质量闭环（意见裁决、修改承诺、承诺兑现核查、跨项目洞察）。
- 技术栈：Next.js 16.4.0（App Router + Turbopack）、React 19.3.0、TypeScript 5、Tailwind CSS v4、
  Supabase（SSR 认证，可选）、unpdf / mammoth / docx / pptxgenjs / jsonrepair。运行时依赖 10 个
  （复核：`node -e "console.log(Object.keys(require('./package.json').dependencies).length)"`）。
- 详情：[README.md](README.md)、[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## 开发原则

1. 正确性优先。
2. 可维护性优先。
3. 代码简洁、项目简洁。
4. 小步迭代。
5. 单模块开发。
6. 每个改动必须有明确设计与验收标准。
7. 禁止一次生成整个项目。
8. 禁止跳步开发。

执行口径：先想后写（假设与歧义先挑明，不在多种解释里静默挑一个）；最简优先（不加没要求的功能、
抽象、可配置项）；外科手术式改动（不动无关代码，每行改动可追溯到需求）；目标驱动（先有可验证
判据再动手，宣称完成前先跑通验证）。

## 开发流程

**分析 → 设计 → 实现 → 测试 → 文档更新 → Git提交 → 等待确认**。不得跳过任何阶段。

| 阶段 | 产出物 | 放行标准 |
|---|---|---|
| 分析 | 影响面清单（动哪些文件、影响哪些模块） | 影响面说全，无"顺手改"的暗项 |
| 设计 | 方案说明（思路、数据/接口变化、回退方式） | 验收标准已定义；与更简方案比较过 |
| 实现 | 代码 | 只含设计内改动，无未用导入与死代码 |
| 测试 | 测试结果 | 符合 [docs/TESTING.md](docs/TESTING.md) |
| 文档更新 | 受影响文档 diff | 维护矩阵逐项过完 |
| Git提交 | 提交 | 符合 [docs/GIT.md](docs/GIT.md)，一批一提交 |
| 等待确认 | —— | 等人确认后才进入下一步 |

## 模块开发规则

- 一个智能体一次只开发一个模块；模块完成后才能进入下一模块。
- 如需同时开发，使用多个子智能体，每个子智能体同样一次只开发一个模块。

模块完成标准（全部满足才算完成）：

1. 功能完成：达到 [TODO.md](TODO.md) 中该模块的验收标准。
2. 测试通过：符合 [docs/TESTING.md](docs/TESTING.md)。
3. 最简原则：代码和项目架构都保持最简洁，无冗余抽象与重复实现。
4. [TODO.md](TODO.md) 更新：勾选完成项、明确下一项。
5. [HISTORY.md](HISTORY.md) 追加变更记录。
6. 受影响的 docs 更新（按需）。
7. [README.md](README.md) 更新（如有面向使用者的变化）。
8. Commit message 符合 [docs/GIT.md](docs/GIT.md)。

## 文档维护规则

| 事件 | 需更新 |
|---|---|
| 模块完成 | `TODO.md`、`HISTORY.md`、受影响 docs、新增子文件夹的说明 |
| 架构决策（选型、目录/数据模型/接口变更、新依赖、推翻决策） | `docs/ARCHITECTURE.md` + `HISTORY.md` 记录缘由 |
| 命令/入口/参数/目录结构变化 | `README.md` / `docs/GET-START.md` / 对应子目录 README |
| 增删一级或二级目录 | 仓根 `目录说明.md` + 父目录 README 的子目录表 |
| 测试数/依赖/门禁命令/已知坑变化 | 本文件的「当前状态」与「已知坑」 |
| 新对话/新任务开始 | 按下方阅读清单阅读 |

## 开发前阅读清单

每个新对话/新任务，按顺序阅读：

1. 本文件（`AGENTS.md`）
2. [TODO.md](TODO.md)
3. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
4. [docs/GET-START.md](docs/GET-START.md)
5. [HISTORY.md](HISTORY.md)（近期变更）
6. 与任务相关的专项规范（`docs/CODE-STYLE.md`、`docs/TESTING.md`、`docs/GIT.md`、`DESIGN.md`、
   `docs/PAGE-STRUCTURE.md`、`docs/DEPLOYMENT.md` 等已创建的）

阅读完成后**不要写代码**：先做架构评审，输出——项目理解 / 核心模块 / 模块依赖关系 / 潜在风险 /
建议优化项 / 推荐开发顺序 / 是否发现架构问题——然后等待确认。

## Git 索引

- Git 规范：[docs/GIT.md](docs/GIT.md)（分支提交、必须入库/禁止上传、commit message、一批一提交）

## 按需规范文件登记

已创建（涉及对应内容）：`DESIGN.md`（视觉令牌）、`docs/PAGE-STRUCTURE.md`（页面结构）、
`docs/DEPLOYMENT.md`（部署）。未创建且当前不适用：`docs/DEVELOPMENT.md`（单人开发，流程沿用本
文件）、`docs/REGISTRY.md`（无可分发组件库）、`docs/REFACTORING.md`（无重构专项；相关约定暂记
本文件与 CODE-STYLE）。涉及时应创建并登记到这里。

## 当前状态

| 项 | 值 | 复核命令 |
|---|---|---|
| 冒烟自检 | 15/15 项通过(演示模式与真实 LLM 模式同套件) | `LLM_API_KEY= npm run smoke` |
| 静态检查 | eslint 0 告警 0 错误 | `npm run lint` |
| 单元测试 | parse/sanitize 17 个用例全绿 | `npm test` |
| 生产构建 | 通过,22 个 API 路由 + 9 个页面 | `npm run build`(`find src/app -name route.ts` 输出 22 行) |
| CI | GitHub Actions:lint + test + build + 演示模式 smoke | `.github/workflows/ci.yml` |
| 远端 | `Luz7818/rr-studio`(推送后 CI 自动跑) | `git remote -v` |
| 运行时依赖 | 10 个,开发依赖含 vitest,清单在 `package.json` | `node -e "console.log(require('./package.json').dependencies)"` |

## 已知坑（省下一次的调查时间）

- **校外访问高校 LLM 端点被 WAF 拦截**：`openapi.seu.edu.cn` 挂在安恒 SaaS WAF 后，校外 IP 一律
  HTTP 420「禁止访问」（HTML 页）。应用会把非 JSON 响应转成明确报错；连上校园网/VPN 即恢复，
  无需改代码。换公共供应商（智谱/DeepSeek）无此限制。
- **Windows 下强杀 dev 进程后 Turbopack 崩溃**：表现为子进程 `exit code 0xc0000142`、页面 500。
  原因是进程被强杀后环境损坏，处理：杀净 3000 端口残留进程、删 `.next/`、重启 `npm run dev`。
- **Next 16 同目录只允许一个 dev 实例**：第二个 `next dev` 会检测到既有实例并退出；预览另一份
  配置时用临时路由，不要起双实例。
- **middleware 已改名 proxy**：Next 16 路由保护文件是 `src/proxy.ts`、导出 `proxy` 函数；写回
  `middleware.ts` 会失效。
- **qwen 系模型偶发 JSON 语法错误**：长 JSON（如组会大纲）约数百次一遇。已有两层兜底：
  `jsonrepair` 自动修复 + `chatJSON` 解析失败整体重试一次；仍失败才报错。
- **`.env.local` 里是本机密钥**：已被 gitignore，禁止入库；他人使用按 `.env.example` 自填。
