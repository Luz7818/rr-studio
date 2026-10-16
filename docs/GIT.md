# Git 规范

> 用途:提交代码的人。分支策略、必须入库/禁止上传、commit message、一批一提交。

## 当前状态与分支策略

- 远端**未配置**(复核:`git remote -v` 为空)。配置远端后:主分支 `main`,单人开发直接提交
  `main`;多人或实验性改动开 `feat/<主题>` 短分支,合入即删。
- 提交前门禁:`npm run lint` + `npm run build` + `LLM_API_KEY= npm run smoke` 全绿。

## 一批一提交

一个提交 = 一个可回退单元。一次开发会话若有多个主题(如「组会引擎」与「lint 清零」),
分成多个提交。禁止把全量工作攒成一个大未提交工作区——工作区脏文件多日累积是本工作区
其他仓库发生过数据事故的直接成因。

## 必须入库 / 禁止上传

- **必须入库**:源码、规范文档、`supabase/migration.sql`、`.env.example`(只有占位符)、
  `scripts/smoke.mjs`。
- **禁止上传**:`.env.local`(本机密钥,已在 `.gitignore`)、`.data/`(用户稿件运行态)、
  `.next/`、`node_modules/`、`tsconfig.tsbuildinfo`、任何真实 key 或稿件原文。
- 新增根目录文件先按《项目整体规范》§2.3 判断;产物(生成的 PPTX/DOCX)不进仓库。

## Commit message

格式:`<类型>: <一句话中文摘要>`,正文可空,必要时列要点。类型:`feat` / `fix` / `docs` /
`refactor` / `chore`。示例:

```
feat: 文献对标——OpenAlex 检索注入审稿提示词
fix: re-review 路由未传 literatureBlock
```

## PR 与检查

单人项目暂无 PR 流程;引入协作者后:PR 必须附门禁输出,review 通过方可合入。
`HISTORY.md` 在每个版本节点追加一条(只追加,不改历史)。
