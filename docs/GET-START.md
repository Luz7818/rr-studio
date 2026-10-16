# 上手手册

> 用途:要真的把 R&R Studio 用起来的人。环境、安装、运行、验证、常见故障,一条命令可直接粘贴。

## 环境要求

- Node.js ≥ 20 与 npm(开发机实测 Node 24.19 / npm 11.17,复核:`node --version && npm --version`)。
- 可选:LLM API key(任一 OpenAI Chat Completions 兼容供应商)。不配则进入演示模式,
  全链路可走通但内容由占位示例生成。
- 可选:Supabase 项目(仅 SaaS 模式需要,见 `docs/DEPLOYMENT.md`)。

## 安装与启动

在仓库根目录执行:

```bash
npm install
cp .env.example .env.local
npm run dev
```

浏览器打开 `http://localhost:3000`。看到侧栏「工作台」和「新建稿件」卡片即启动成功。

## 配置 LLM

编辑 `.env.local`(已被 gitignore,不会入库):

```bash
LLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
LLM_API_KEY=<你的key>
LLM_MODEL=glm-4.6
```

改完重启 `npm run dev`。首页横幅不再显示「演示模式」即生效。供应商任选:

- 智谱 `https://open.bigmodel.cn/api/paas/v4`
- DeepSeek `https://api.deepseek.com`
- 高校自建端点(如东南大学 `https://openapi.seu.edu.cn/v1`,需校园网/VPN,并按需设
  `LLM_EXTRA_BODY={"response_format": null, "enable_thinking": false}`)

## 五分钟验证一条流水线

1. 首页「新建稿件」→ 粘贴一段带 `Abstract` / `1. Introduction` 等标题的英文文本 → 上传。
2. 自动跳转工作台,「解析概览」应显示章节数与脱敏计数。
3. 点「① 生成 Critique 报告」→「Critique 报告」页签出现逐条意见。
4. 「模拟审稿」页签 → 点「获取真实文献对标」(出现论文列表)→「重新模拟审稿」。
5. 「回复审稿人」页签 → 任选一条写草稿 → 「AI 打磨回复」。
6. 「组会汇报」页签 → 生成 → 「下载 PPTX」,用 PowerPoint/WPS 打开,演讲者视图应见讲稿。

批零验证(代替以上手工步骤):

```bash
LLM_API_KEY= npm run smoke
```

`结果: 14/14 项通过 ✅ 可以交付` 即全部功能正常(14 步会自建并清理测试数据)。

## SaaS 模式(开放给用户)

在 Supabase 建项目后,于 SQL Editor 执行 `supabase/migration.sql`,生成邀请码并填好
`.env.local` 的三个 Supabase 变量。详细步骤与验证清单见 `docs/DEPLOYMENT.md`。
本地模式数据在 `.data/`,切 SaaS 后旧数据不自动上云(按 user_id 隔离是新写入)。

## 常见故障

| 现象 | 原因 | 处理 |
|---|---|---|
| 报错含 `LLM 请求失败 420` 或「非 JSON 响应」 | 校外访问高校端点被 WAF 拦截 | 连校园网/VPN,或换公共供应商 |
| 报错「LLM 返回内容无法解析为 JSON」且重试后仍失败 | 模型输出坏 JSON 超出兜底 | 重试一次;频繁出现换 `LLM_MODEL` |
| dev 启动报 `Port 3000 is in use` | 旧进程残留 | 杀掉占用进程后重启 |
| 页面 500 且日志见 `0xc0000142` | 强杀进程损坏 Turbopack 环境 | 删 `.next/` 重启 `npm run dev` |
| 「第二个 dev 实例」提示退出 | Next 16 同目录单实例 | 复用既有实例,勿双开 |
| PPTX 下载后打不开 | 响应被代理改写 | 直连 `localhost` 重试,确认响应为 zip 魔数 |
