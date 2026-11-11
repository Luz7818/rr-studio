# TODO.md —— 计划与进度

> 用途:开发者的任务清单。只放计划与进行中事项,验收标准可查;做完的进 HISTORY.md,不在这里留尸。

## 当前状态

M1/M2/M3 全部完成并通过 18 步端到端自检(复核:`LLM_API_KEY= npm run smoke`)。
下一优先级:**部署上线**(P1),其余按序。

## P1 · 部署上线

- [ ] Vercel 部署:配置 `LLM_API_KEY` 等环境变量,`SMOKE_BASE_URL=https://<域名> npm run smoke` 验线。
- [ ] Supabase 实际接入:建项目 → 执行 `supabase/migration.sql` 与 `supabase/migration-002-shares.sql` → 生成邀请码 → 填三个环境变量。
  - 验收:注册(邀请码)→ 免费额度第 2 篇被拒 → SQL 升级 Pro 后解锁,全流程走通。
- [ ] 域名与引流:挂在 luzzz.me 子路径或子域,落地页 OG 卡片实测。

## P2 · 产品深化

- [x] 手动补充检索词:文献对标支持用户输入自定义查询(v0.12.0 完成,自定义词覆盖自动提取,
  检索结果与审稿引用同步更新;smoke 含回归步)。
  - 验收:输入检索词后检索结果与审稿引用同步更新。
- [x] Critique 口径可调(v0.14.0 完成:苛刻/均衡/温和三档,双入口切换,口径随报告落库)。
- [x] 引用格式导出(v0.21.0 完成:文献区 BibTeX/APA/GB-T 7714 三下载,后端三纯函数
  `src/lib/citations.ts`,期望值为 CSL 官方样式 citeproc-js 实渲染对拍基准,见 citations.test.ts)。
  - 验收:`npm test` citations 13 用例全绿;smoke 引用导出步断言 @article 条目数、APA 年份段、
    GB/T 序号与 [J] 标识、未知格式 400。
- [x] 只读分享链接(v0.22.0 完成:`POST /api/projects/[id]/share` + 列表 + 软撤销 + 公开
  `GET /api/share/[token]` + `/s/[token]` 只读页;token 256-bit url-safe,7 天默认有效期,
  校验不过一律 404 防探测;SaaS 走 report_shares 表 RLS(migration-002)+ service role 兑换,
  本地走 `.data/shares/`)。
  - 验收:`npm test` share 11 用例全绿;smoke 分享两步(创建→匿名只读 200→撤销→404)。
- [ ] 课题组管理台(Lab 版多席位)。
- [ ] Response Letter 导出格式可配置(期刊模板)。

## P3 · 商业化

- [ ] 支付通道自动开通(支付宝/微信或 Stripe;需商户资质,内测期用定价页的 SQL 手动开通)。
  - 验收:支付成功 → `profiles.plan` 自动变更 → 额度解锁。

## P4 · 工程补强

- [x] 单元测试层:parse/sanitize/citations/share 已有 41 个 vitest 用例(`npm test`;LLM 相关模块仍靠 smoke 覆盖)。
- [x] 配置 CI(GitHub Actions:lint + test + build + 演示模式 smoke)。
- [ ] 文献检索词质量回看:真实论文场景下核对检索命中率,必要时换 PubMed/Europe PMC 做医口。
