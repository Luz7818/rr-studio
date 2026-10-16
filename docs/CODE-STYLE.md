# 代码规范

> 用途:写代码的人。风格由工具强制,本文件记录工具没管的约定:命名、错误处理、LLM 调用与日志纪律。

## 工具强制项

- 格式与规则由 **eslint**(`npm run lint`,0 告警 0 错误放行)与 **TypeScript**
  (`npm run build` 内置 tsc)强制。风格分歧以 eslint 结果为准,不在 review 里吵格式。
- Tailwind v4 令牌定义在 `src/app/globals.css` 的 `@theme`;**禁止硬编码颜色值**,用
  `ink / ink-soft / ink-faint / band / line / accent / accent-soft` 令牌类。

## 命名

- 文件:组件与页面用社区惯例(组件帕斯卡、`lib/` 内小写);新增非规范文件一律英文小写加连字符。
- API 路由:资源名复数(`projects`),动作用名词目录(`revision/summary` 而非 `do-summary`)。
- 类型与字段以 `src/lib/types.ts` 为唯一事实;新增领域概念先改类型再写代码。
- 中文文案面向研究生,口语但不含网络语;错误信息以「现象 + 处理」句式。

## 错误处理

- **API 层**:可预期失败返回 `NextResponse.json({error}, {status})`,状态码约定——400 参数/状态
  不满足、401 未登录、403 额度、404 不存在、502 上游(LLM/检索)失败。错误信息中文、能定位
  (带步骤名或章节名),例如 `Critique 生成失败: <章节>: <原因>`。
- **禁止吞异常**:catch 必须要么转成用户可见错误,要么入 `errors` 数组随响应返回
  (参照 critique 路由的分章节容错)。
- **LLM 调用只走 `lib/llm.ts`**:JSON 期望用 `chatJSON<T>`(自带 jsonrepair 修复 + 重试),
  纯文本用 `chatText`;禁止在路由里手写 fetch 调模型。演示模式判定只认 `isLlmConfigured()`。
- **前端**:异步操作 `busy` 状态防重入(命名 `busy === "<step>"`);长流程失败显示在页面错误条,
  不用 `window.alert`。

## 数据与安全

- 所有存储访问经 `getApiContext()`;新增 API **不得**直接 import `localStore/supabaseStore`。
- 用户稿件是敏感数据:入库前必须过 `sanitizeText`;日志与错误信息不得包含稿件原文片段
  (引用截断 ≤ 400 字符仅存于用户自己的 Project 内)。
- 新增凭据一律走 `.env.local`(登记进 `.env.example` 注释),服务端专用密钥命名不带
  `NEXT_PUBLIC_` 前缀。

## 日志约定

- 不引入日志库;服务端排障靠响应错误与 Next dev 控制台。`console.log` 只允许出现在
  排障临时改动里,提交前删除。
- smoke 脚本(`scripts/smoke.mjs`)是唯一允许的约定输出:步骤 `✓/✗` 与汇总行。

## 注释

- 只写代码本身说不出的约束(如「cacheComponents 不兼容 runtime 导出」「Next 16 单 dev 实例」)。
  不写「这行在干什么」的翻译腔注释。
