# 测试规范

> 用途:写测试与跑门禁的人。分层策略、门禁命令、改动后的固定验证表、用例规范。

## 测试分层

| 层 | 现状 | 说明 |
|---|---|---|
| 静态检查 | `npm run lint` | eslint + react-hooks 规则,0 告警放行 |
| 类型/构建 | `npm run build` | tsc 全仓类型检查 + 生产构建 + 预渲染 |
| 端到端冒烟 | `npm run smoke` | 14 步走完全部产品能力并断言,主力门禁 |
| 单元测试 | **暂无** | 已知局限,见文末 |

## 门禁命令(仓库根执行)

```bash
npm run lint            # 0 告警 0 错误
npm run build           # 编译 + 21 路由 + 6 页面全部生成
LLM_API_KEY= npm run smoke   # 演示模式,零 API 消耗,14/14 通过
npm run smoke            # 真实模式:所有 LLM 环节真实调用,需可用 key 与网络
SMOKE_BASE_URL=https://<域名> npm run smoke   # 验线上部署
```

## 冒烟脚本约定(`scripts/smoke.mjs`)

- 14 步按用户旅程排序:首页 → 上传脱敏 → 文献对标 → Critique → 模拟审稿 → 回复打磨 →
  Word×2 → Cover Letter → 组会+PPTX → 修改稿对照 → 承诺核查 → 洞察 → 清理。
- 每步自建数据、末步清理,可对同一实例重复执行;新增功能**必须**补对应步骤与断言。
- 断言口径:结构断言(章节数、线程数、zip 魔数)在演示模式即可验;语义质量不进断言,
  人工看真实模式输出。
- 修改稿样例的敏感信息断言注意:标题页内容被整体排除不算正文脱敏,URL 类要放进章节正文。

## 改动后的固定验证表

| 动了什么 | 必须跑 |
|---|---|
| `src/lib/prompts.ts` 提示词 | 真实模式 smoke + 人工看一条 Critique/审稿输出 |
| `src/lib/llm.ts` 调用层 | 两种模式 smoke + 一次真实调用确认降级路径 |
| `src/lib/store.ts` / `quota.ts` | 两种模式 smoke(覆盖存储与额度路径) |
| 任一 API 路由 | 演示模式 smoke;改了 LLM 环节加真实模式 |
| 页面/组件 | `npm run build` + 手工过对应页签;动了通用外壳加移动端宽度目检 |
| `package.json` 依赖 | build + smoke,并在 `AGENTS.md` 当前状态更新依赖数 |

## 用例规范(写单元测试时生效)

- 框架用 vitest,测试文件与被测对象同目录 `*.test.ts`;先写可失败的用例再实现。
- `parse.ts`/`sanitize.ts` 是纯函数,优先补;LLM 相关模块用注入 mock,不在单测里真调模型。
- 测试数写进 `AGENTS.md` 时必须带复核命令。

## 已知局限

- **无单元测试层**:函数级回归目前完全依赖端到端 smoke;`parse.ts` 的章节切分边界(编号标题、
  行内 Abstract)只有真实验证过的样例覆盖,改 `HEADING_RULES` 时务必用真实 PDF 复验。
- smoke 对真实 LLM 的**语义质量**不做断言:提示词退化(输出变泛、编造引用)只能靠人工抽检,
  文献对标步骤仅断言检索返回数量。
