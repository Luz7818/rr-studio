# TODO.md —— 计划与进度

> 用途:开发者的任务清单。只放计划与进行中事项,验收标准可查;做完的进 HISTORY.md,不在这里留尸。

## 当前状态

M1/M2/M3 全部完成并通过 14 步端到端自检(复核:`LLM_API_KEY= npm run smoke`)。
下一优先级:**部署上线**(P1),其余按序。

## P1 · 部署上线

- [ ] Vercel 部署:配置 `LLM_API_KEY` 等环境变量,`SMOKE_BASE_URL=https://<域名> npm run smoke` 验线。
- [ ] Supabase 实际接入:建项目 → 执行 `supabase/migration.sql` → 生成邀请码 → 填三个环境变量。
  - 验收:注册(邀请码)→ 免费额度第 2 篇被拒 → SQL 升级 Pro 后解锁,全流程走通。
- [ ] 域名与引流:挂在 luzzz.me 子路径或子域,落地页 OG 卡片实测。

## P2 · 产品深化

- [x] 手动补充检索词:文献对标支持用户输入自定义查询(v0.12.0 完成,自定义词覆盖自动提取,
  检索结果与审稿引用同步更新;smoke 含回归步)。
  - 验收:输入检索词后检索结果与审稿引用同步更新。
- [ ] Critique 口径可调:按目标期刊风格调整提示词强度(更苛刻/侧重某维)。
- [ ] 课题组管理台(Lab 版多席位)。
- [ ] Response Letter 导出格式可配置(期刊模板)。

## P3 · 商业化

- [ ] 支付通道自动开通(支付宝/微信或 Stripe;需商户资质,内测期用定价页的 SQL 手动开通)。
  - 验收:支付成功 → `profiles.plan` 自动变更 → 额度解锁。

## P4 · 工程补强

- [x] 单元测试层:parse/sanitize 已有 17 个 vitest 用例(`npm test`;LLM 相关模块仍靠 smoke 覆盖)。
- [x] 配置 CI(GitHub Actions:lint + test + build + 演示模式 smoke)。
- [ ] 文献检索词质量回看:真实论文场景下核对检索命中率,必要时换 PubMed/Europe PMC 做医口。
