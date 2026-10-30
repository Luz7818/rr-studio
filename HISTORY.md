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

## 2026-10-17 · v0.7.0 全站视觉与交互打磨

- 全局质感层(`globals.css`):统一缓动曲线 `cubic-bezier(0.23,1,0.32,1)`、新工具类
  `card-lift`(hover 上浮)/`rise-in`(内容块进入)/`stagger`(列表交错,≤240ms)/`bar-fill`
  (数据条过渡)/`skeleton`(加载脉冲),细化滚动条与 `card-shadow`。
- 侧栏导航点指示与本地模式状态灯;仪表盘稿件卡加流水线进度点、骨架加载与新空态;
  上传器拖放区悬停动效与文件选中胶囊。
- 工作台:页签切换轻过渡(key 重挂载)、Critique 筛选胶囊带计数 + 工具栏卡片化、审稿人卡片
  头像与文献行化(hover 高亮)、回复工具栏加打磨进度条、审稿意见改引用块、Cover Letter
  信纸排版、组会页卡交错入场;全站按钮形状统一为胶囊(`rounded-xl` 残留清零)。
- 修复两处真 bug:①洞察页 Critique 分布进度条用了无效类名 `bg-accent-soft0`,条形图一直
  不显示;②工作台标题改名 onBlur 拿已更新的 state 判「未变化」,导致改名永不保存(改为
  聚焦时快照对比)。另:工作台状态徽章英文名(project.status)中文化。
- 登录/注册卡与输入风格对齐全站;落地页功能卡统一 `card-lift`。
- 验证:lint 0 告警、生产构建通过(21 路由 + 6 页面不变)、演示模式 smoke 14/14、
  浏览器截图逐页复查(仪表盘/Critique/回复/洞察/定价)。

## 2026-10-17 · v0.8.0 体验与细节第二轮(异步反馈 + 交互组件)

- 异步反馈:`.spinner` 圆环进入所有 busy 按钮(上传/Critique/审稿/Cover Letter/组会);
  回复线程草稿与修改承诺失焦保存后显示「已保存 ✓」(1.6s 自动淡出)。
- 交互组件:新增 `components/ConfirmDialog.tsx`(遮罩 blur + rise-in,Escape/遮罩取消,
  危险操作红色确认),替换仪表盘删除项目与修改稿面板清除修改稿两处原生 `window.confirm`;
  DESIGN.md 新增「交互组件」节,禁止再写 window.confirm。
- 空态可行动:`EmptyState` 支持行动按钮——Critique 空态直接「生成」、回复空态「去模拟审稿」、
  Cover Letter 空态直接「生成」。
- 内容细节:解析概览章节结构加字数占比条(`bar-fill`,相对最长章节);组会 Q&A 改「先自己答,
  再看要点 →」默认折叠,点击才展开 💡 提示;洞察页统计数字 count-up(600ms ease-out,
  reduced-motion 直显终值);登录/注册卡加品牌 R 标识。
- 移动端与效率:工作台页签条改横向滑动(`overflow-x-auto no-scrollbar`),窄屏不再折行;
  数字键 1–7 直跳页签(输入控件聚焦时忽略),页签 title 提示快捷键。
- 验证:lint 0 告警(修 react-hooks/set-state-in-effect 一处)、构建通过、演示模式 smoke 14/14、
  桌面 + 390px 移动端截图复查(含确认弹窗打开态、Q&A 展开态)。

## 2026-10-17 · v0.9.0 补齐大规模使用差距(代码可解部分)

- **LLM 月度限额(堵成本敞口)**:SaaS 模式 Free 每月默认 60 次 LLM 分析(环境变量
  `FREE_LLM_MONTHLY_LIMIT` 可调,Pro/Lab 不限)。`supabase/migration.sql` 追加 `llm_usage` 表
  与 `increment_llm_usage` RPC(幂等,已建环境重跑即可);`lib/quota.ts` 新增
  `guardLlmQuota`(入口 403)/`consumeLlmCalls`(成功后按实际次数原子累加,失败静默);
  9 条 LLM 路由全部接入(critique 按实际段落数、review/re-review 3 次、其余 1-2 次);
  本地/演示模式不计不挡。仪表盘横幅显示「LLM 分析 x/60 次」。
- **写冲突保护**:8 条「get → 长时间 LLM → 整包 save」路由改为完成后重读最新数据、只回写本路由
  拥有的字段(critique/reviews+responses/seminar/coverLetter/revision.*/单条线程 polished),
  竞态窗口从分钟级缩到毫秒级;修改稿类路由在修改稿被清除时返回 409 放弃结果。
- **Serverless 时长声明**:9 条 LLM 路由加 `export const maxDuration = 60`(Vercel 函数上限)。
- **单元测试层(P4 补齐)**:vitest 3(兼容 @types/node@20,选 3 而非 5 是 peer 依赖冲突最小解),
  parse 10 用例 + sanitize 7 用例,全绿。测试揪出一个认知偏差:FUNDING 规则会吞并 GRANT 占位符
  (隐私结果等价,断言按行为修正而非改代码)。
- **CI**:GitHub Actions(lint + test + build + 启动后演示模式 smoke),push/PR 触发。
- **隐私说明页** `/privacy`:脱敏承诺的准确边界(自动打码范围、正则覆盖不到的形态、SaaS 下
  脱敏后送 LLM 供应商),proxy 放行,落地页页脚入口。
- **signup 路由**复用新抽出的 `createSupabaseAdminClient()`(原内联实现删除)。
- 验证:lint 0 告警、`npm test` 17/17、构建通过(6→7 页面)、演示模式 smoke 14/14、
  /privacy 200。部署清单(Supabase 重跑迁移/公共供应商/Pro 时长/SMTP/Sentry)见
  docs/DEPLOYMENT.md「上线前检查清单」。

## 2026-10-18 · v0.10.0 去AI感:设计语言转向中性密度工具风

诊断:胶囊几何(全站 102 处 rounded-full)+ 粉彩徽章(35 处 100 底色块)+ emoji 图标(21 处)
+ 满屏浮岛卡,是「精修过的 AI 感」的来源。本轮重写设计语言(DESIGN.md 同步重写),
参照 Linear / Vercel Dashboard 的纪律。

- **图标系统(P0)**:引入 `lucide-react`(运行时依赖 10→11),替换全部 emoji/字符图标;
  16px/1.75 线宽规范;chrome 内禁 emoji 写进 DESIGN.md。
- **形状系统(P0)**:按钮/输入框/分段控件 → `rounded-lg`,内嵌块 `rounded-md`,面板
  `rounded-xl`;胶囊收敛为**只给状态徽章**(剩余 ~30 处全部合法:徽章/进度条几何);
  分段控件改 `bg-band p-0.5` 槽 + `rounded-md` 活动块。
- **状态色降饱和(P0)**:100 底色块全部改「50 底 + 200 描边 + 700 字」;审稿意见改 4px
  左色条形态;采纳态行用 `bg-emerald-50/40` 弱化。
- **密度(P1)**:Critique 条目、回复线程、组会讲稿从卡片流改为 `divide-y` 行列表(单容器,
  行 hover 灰底);审稿人卡去投影与头像徽标,Overall/Major/Minor 用左色条排版。
- **字阶(P1)**:产品内字重 600 封顶(工作台标题 text-2xl semibold,原 text-3xl black);
  正文收敛 text-[13px];微标签(micro-label)用于侧栏分组与元信息;侧栏改分组
  (工作区/方案)+ 导航图标。
- **投影纪律(P0/P2)**:静态面板全部去投影(边框优先),`card-shadow` 只留给弹窗;
  `card-lift` 只留仪表盘可点稿件卡。
- **落地页(P2)**:删点阵背景、浮岛 mockup 装饰与漂浮胶囊标签;hero 改左文右图 split 布局,
  产品示意改三栏 grid + gap-px 分隔线的静态结构;功能带同构;按钮 rounded-lg。
- **认证/定价/隐私/弹窗同步**:输入框与按钮统一 rounded-lg;定价卡去 ring 与 emerald ✓ 字符
  (改 Lucide Check),Free 档注明 60 次 LLM 分析;ConfirmDialog 面板 shadow-xl 代替 card-shadow。
- 验证:lint 0 告警、`npm test` 17/17、构建通过(17 页面)、演示模式 smoke 14/14、
  截图复查(仪表盘/工作台概览/Critique 行列表/定价);落地页 SaaS 未登录态待部署后目检。

## 2026-10-18 · v0.10.1 功能实测 + 细节补齐

- **浏览器功能实测(演示数据全流程)**:数字键 1–7 切页签、Critique 采纳勾选(行高亮)、
  草稿失焦自动保存(「已保存」出现 → 1.6s 消失 → 刷新后持久)、删除确认弹窗(Escape 取消、
  不误删)、Q&A 折叠展开、移动端 390px 页签横滑——全部通过。测试方法备注:React onBlur
  需合成 focusout 而非 blur 事件才能在自动化里触发。
- **修复**:仪表盘删除按钮图标化时丢失的无障碍标注与加载反馈(补 aria-label/title/spinner);
  privacy 页与确认弹窗残留 font-bold(600 封顶纪律)。
- **升级**:洞察页加载态改骨架脉冲(原一行「加载中…」);工作台/洞察页 document.title
  跟随内容(「稿件名 · R&R Studio」),离开自动还原;仪表盘稿件卡改相对时间
  (刚刚/x 分钟前/x 天前,30 天以上回退日期)。
- lint 过程修正两处新引入问题:title effect 依赖收窄为 projectTitle 局部变量;
  Dashboard 挂载 effect 保持内联 async IIFE(react-hooks/set-state-in-effect 不穿透函数边界,
  `void load()` 形态会误报)。
- 验证:lint 0 告警、`npm test` 17/17、构建通过、smoke 14/14、洞察页截图 + document.title 复查。
- **品牌图标重绘**:原 icon.svg 用 `<text>`+Arial(favicon 跨平台渲染不一致)。两轮被否:
  「R.」句点方案(字母组合与工作性质无关)→ 平涂「稿件行+对勾」(无光影层次,与全站
  反 AI 平面感的方向自相矛盾)。第三版换立体路线:靛蓝渐变底 + -4° 微旋白纸页
  (渐变+feDropShadow 投影)+ 三行浅紫稿件行 + 主色判定对勾——「被审过的稿件」。
  立体/层叠双案对比,E2 徽章在 16px 缩成一点被否,E1 定稿。DESIGN.md 品牌节同步
  (禁 <text>、四档尺寸实测、质感来自渐变+层叠+投影而非平涂)。
- **按钮图标微动效统一**:导出 Download hover 下探、返回 ArrowLeft hover 左移、拖放区 Upload
  hover 上浮变色、仪表盘 RefreshCw 加载时自旋、复制成功 Check 以新 `.icon-pop` 弹入
  (0.6 起跳,避免 scale(0) 违例);全部 200ms 级、只动 transform,reduced-motion 自动降级。

## 2026-10-19 · v0.11.0 一切对齐 flolab.cn(用户拍板唯一设计锚点)

- **决策**:连续三版品牌图标被否后,用户给出唯一参照 https://flolab.cn——「一切像这个网站
  对齐」。浏览器实测提取语言:白底浮岛、白胶囊容器承载彩色图形(白底蓝鲸 favicon)、
  点阵装饰、居中大标题带主色强调、悬浮胶囊标签、全胶囊控件、粘性白胶囊导航。
  中途偏移到 Linear/Vercel 风的几何系统(v0.10)整体回退,DESIGN.md 重写并固化锚点。
- **图标 v4(第四版,定稿)**:白底圆角方块 + 单色靛蓝实体稿件图形(-5° 微旋,白色行与
  判定勾镂空)——与 flolab「白底蓝鲸」同构:白底承载单色实体形。三案对比(实体纸/纯勾/
  审稿双气泡),F5 双气泡在 16px 糊掉、F4b 丢稿件语义,F4a 精修(勾加粗至 5、延长至
  45px)后定稿。副本 public/logo.svg 供界面引用。
- **Logo 对齐**:侧栏/移动顶栏/登录注册卡的 Logo 改为**白胶囊容器(card-shadow)+
  logo.svg**——直接复刻 flolab 顶栏的 Logo 处理。
- **落地页**:恢复点阵 hero、悬浮胶囊标签(三位 AI 审稿人/讲稿在演讲者备注)、居中主色
  强调标题、胶囊 CTA;功能带/对比/CTA 带同步胶囊化。
- **控件几何回退**:按钮/页签/筛选/输入框/导航项全站回归 `rounded-full`(v0.10 的
  rounded-lg 体系撤销);提示横幅 rounded-2xl;工具页保留行列表密度与 Lucide 图标纪律
  (这两项与 flolab 不冲突,是 AI 感治理的正确部分)。
- 验证:lint 0 告警(新增两处 img 豁免注释)、构建通过、smoke 14/14、仪表盘截图复查
  (白胶囊 Logo/胶囊控件/相对时间);落地页 SaaS 未登录态待部署后目检。

## 2026-10-19 · v0.11.1 营销壳 + 滚动动效系统(对齐 flolab 第二阶段)

- **双壳布局**:根布局按会话分壳——SaaS 未登录走**营销壳**(body[data-bare],无侧栏),
  落地页/定价/隐私/登录/注册自备 `MarketingNav` 浮岛胶囊导航(白胶囊 Logo + 居中链接 +
  CTA,sticky);应用壳内 `bare-only` 元素由 CSS 隐藏。本地模式维持应用壳。
- **动效系统**:`Reveal` 组件(IntersectionObserver + CSS 过渡,transform/opacity 专用,
  reduced-motion 直显)用于落地页各区滚动交错显现;`float-soft`/`float-soft-slow` 长周期
  漂浮用于 mockup 与悬浮标签;hero 用 `.stagger` 入场编排(60ms 步进)。
- **落地页内容扩充**:新增数据带(40+ 意见/篇 · 3 审稿人 · 100% 文献可溯 · 4 类交付物)、
  特性卡 Lucide 图标徽章、FAQ 手风琴(原生 details,5 问)、三栏页脚。
- **修复三处带 Supabase 构建的阻塞 bug**(哑环境预览时暴露):①proxy 把带扩展名路径
  (logo.svg/icon.svg 等静态资源)重定向到登录页导致裂图——静态路径直接放行;
  ②getSessionUser 网络失败时抛错全站 500——按 proxy 口径容错返回未登录;
  ③根布局读会话的 cookies() 与 cacheComponents(PPR)静态预渲染冲突——关闭 PPR,
  全站 force-dynamic(登录工具,代价可接受)。
- **验证方式突破**:以自指哑 Supabase 变量构建,首次在本机完整预览 SaaS 落地页
  (首屏/功能区/FAQ/页脚逐屏截图确认);正式构建后 smoke 14/14。
- 下一步追差距方向:产品截图替换 mockup 示意、OG 卡片图、移动端落地页细查。

## 2026-10-20 · v0.11.2 真实产品截图 + OG 卡 + 移动端细查(对齐第三阶段)

- **真实截图进落地页**:手工构造逼真演示项目(直接写入 .data JSON,零 API 消耗——含真实
  论文标题、5 条中英 Critique、3 份审稿报告、3 条已打磨回复线程与修改承诺),浏览器截取
  Critique / 审稿 / 回复三页存入 public/showcase-*.png;落地页 mockup 从结构示意替换为
  **真实界面截图**(回复线程主图 + 审稿卡后景层叠 + 漂浮标签),营销说服力质变。
  截图前按类名隐藏演示模式横幅与本地模式提示框(策划过的呈现)。
- **OG 分享卡**:`src/app/opengraph-image.tsx`(next/og,1200×630):品牌行 + 主标语 +
  流水线副标 + 三枚胶囊标签,社交分享不再裸链接。
- **移动端 390px 细查**:仪表盘/落地页首屏/截图区/FAQ 逐屏通过;浮动标签移动端隐藏、
  层叠图降为单图,无需修复。
- **测试方法教训**:截图管道对动画敏感——无限 float 动画会让截图等不到空闲帧(需暂停注入,
  但暂停也会冻结 rise-in 的 opacity:0 起点导致"空面板"假象);正确做法是等有限动画完成
  (workbench 300ms)再截。页签切换用按钮 click 而非键盘合成事件(后者本会话不稳定)。
- 验证:lint 0 告警、构建通过(/opengraph-image 路由生成)、smoke 14/14、移动端 390px 与
  桌面端截图复查;showcase 演示项目保留在 .data(本地模式可见,作为活样例)。

## 2026-10-20 · v0.11.3 内容层补齐(对齐第四阶段)

- **使用指南 `/guide`**:七步流水线步骤卡(编号 + 正文 + 场景提示),SaaS 营销壳/本地应用壳
  双态可用,尾部 CTA。
- **更新日志 `/changelog`**:用户视角的版本亮点(v0.6→v0.11 六个版本),开发者细节仍以
  仓库 HISTORY.md 为准。
- **导航/页脚接线**:MarketingNav 加入使用指南与更新日志(lg 起 5 项),落地页页脚资源区
  补全;proxy 对未登录放行两页。
- **OG 卡 v2**:背景换真实产品截图(回复线程页),深色渐变压暗后叠品牌行与英文胶囊标签;
  中文不进 satori(satori 无内置 CJK 字体,中文会渲染为空)——中文语义由截图像素承载,
  这也是选截图背景的技术原因。渐变从「压死」调浅为「上亮下沉」,产品 UI 清晰透出。
- **空态插画**:工作台与仪表盘空状态加品牌母题内联 SVG(双纸叠 + 判定勾,仅令牌色),
  替代纯文字。
- 验证:lint 0 告警、构建通过、smoke 14/14、/guide /changelog 200、OG 图形目检
  (截图透出度达标)。

## 2026-10-29 · v0.12.0 动效/逻辑/质感三层打磨 + 手动检索词(P2 首项)

- **动效系统**:新增 `SegmentedControl`(分段控件白色活动块滑动过渡,220ms 统一缓动,
  只动 transform/width,首帧定位不滑入,字体加载后补测)——工作台页签、上传/修改稿模式切换、
  Critique 严重度筛选四处接入;新增 `FillBar`(数据条挂载后从 0 填充到目标宽度,之后沿用
  同一过渡)——章节占比条、回复打磨进度、洞察页两类条形图接入。ConfirmDialog 升级:
  面板 pop-in 微缩放入场、退场淡出(reduced-motion 跳过等待)、Tab 焦点圈、背景滚动锁定;
  错误条 rise-in。键盘(数字键)切页签直跳不加动画,与 DESIGN 动效纪律对齐(`data-still` 门控)。
- **使用逻辑**:工作台页签写入 `?tab=`(history.replaceState),刷新/回退/分享不丢位置,
  页签条吸顶(移动端让位顶栏);上传器拖拽悬停高亮(松开即选)、扩展名与 30MB 前置校验、
  粘贴字数统计与一键清空;长审稿意见折叠为 4 行可展开;批量打磨汇总失败数(限速场景可单条重试);
  触屏设备删除按钮常显(原 `hidden group-hover:block` 触屏不可达)。
- **质感层**:`globals.css` 新增 `panel`(静态面板发丝级落影)、`btn-primary`/`btn-dark`
  (实底按钮内高光+主色/墨色柔影)、`field`(输入统一灰底→聚焦白底+主色微光圈,键盘聚焦
  同效)四类,全站面板、实底按钮与输入框接入;移动端导航项胶囊化对齐全站几何语言。
- **新功能(P2 路线图首项)——文献对标手动补充检索词**:literature 路由接受 `queries`
  覆盖自动提取(≤4 条);文献卡加检索词输入行(已有检索词预填),按自定义词检索后结果与
  审稿引用同步更新;使用指南同步更新;smoke 增至 15 步(含自定义检索词回归)。
- **小件**:Critique 报告一键复制 Markdown(与 Word 导出并列);标题失焦保存显示「已保存」
  瞬时反馈;`html` 加 `data-scroll-behavior="smooth"` 消除 Next 路由滚动提示;补
  `metadataBase`;`.env.example` 补入库(gitignore 白名单)。
- 验证:lint 0 告警、vitest 17/17、生产构建通过(21 API 路由 + 7 页面不变)、
  演示模式 smoke 15/15;浏览器实测分段控件滑动、吸顶、`?tab=` 恢复、手动检索词全链路
  (OpenAlex 返回 8 篇真实文献)与质感层渲染。

## 2026-10-29 · v0.13.0 交付链补全与回复线程筛选

- **Cover Letter 一键导出 Word**:新增 `export/cover-letter` 路由(正文按空行分段,页脚署名),
  Cover 页签「复制全文」旁加「导出 Word」——四个产出物(Critique 报告 / Response Letter /
  Cover Letter / 组会 PPTX)至此全部可一键导出,落地页「打磨交付」的表述落为真。
- **回复线程状态筛选**:回复工具栏加「全部 / 未打磨 / 未裁决」分段筛选(带实时计数),
  11+ 条意见时能快速定位还没处理完的;筛选为空有明确提示。裁决/打磨后计数即时联动。
- smoke 的 Cover Letter 步并入导出断言(15 步不变);README/AGENTS 路由数更新为 22,
  PAGE-STRUCTURE 补齐 guide/changelog/privacy 三个页面的欠账。
- 验证:lint 0 告警、vitest 17/17、生产构建通过(22 API 路由 + 9 页面)、演示模式 smoke 15/15、
  浏览器实测筛选计数联动(标记裁决后「未裁决」11→10)。

## 2026-10-29 · v0.13.1 失败可见性与文案一致性

- 仪表盘稿件列表加载失败从「静默吞掉、装作空态」改为错误横幅 + 重试按钮(对齐 CODE-STYLE
  「禁止吞异常」),错误且无数据时不再显示「还没有稿件」误导性空态。
- 登录/注册错误提示统一为全站错误横幅样式(rise-in + 红底);更新日志页补 v0.12/v0.13
  用户视角亮点;EmptyArt 空态插画抽为共享组件(工作台/仪表盘去重)。
- 验证:lint 0 告警、vitest 17/17、生产构建通过、演示模式 smoke 15/15。

## 2026-10-30 · v0.14.0 洞察页升级 + Critique 口径可调(P2 第二项)

- **洞察页**:全部零数据时给行动空态(「还没有可分析的数据 → 去上传稿件」)替代零值仪表;
  承诺兑现率卡加三色堆叠条(绿/黄/红比例一眼可读);审稿时间线交错入场。
- **工作台**:流水线步骤徽章(上传解析/Critique/模拟审稿/回复审稿人/Cover Letter)完成后
  可点击直跳对应页签,当前页签徽章高亮;标题行状态徽章配色与仪表盘一致
  (已解析灰/Critique 完成 amber/审稿完成 emerald)。
- **Critique 口径可调(P2)**:strict(顶刊最挑剔,每节 5–8 条)/ balanced(默认)/
  gentle(只报 1–3 条高信号问题)三档注入提示词;口径随 CritiqueReport 落库并在 UI 回显;
  解析概览与 Critique 工具栏双入口切换;smoke 步骤更名并断言口径落库。
- **一致性小件**:错误横幅统一 role="alert"(读屏可感知);定价/指南/隐私页接入 panel 质感;
  guide/更新日志文案同步。
- 验证:lint 0 告警、vitest 17/17、生产构建通过、演示模式 smoke 15/15、浏览器实测
  口径选择器与报告回显。

## 2026-10-30 · v0.14.1 细节清扫(几何语言合规 + 390px 溢出清零)

- **DESIGN 合规**:chrome 内几何字符箭头(「查看方案 →」「Reviewer #1 → Minor」)全部换成
  Lucide 内联图标;insights 承诺三色徽章与定价「推荐」角标从 rounded-md 归位为胶囊。
- **390px 溢出清零**:根因是响应式网格小于断点时落入隐式 auto 轨道,按内容最宽处撑破容器
  (insights 命中率卡 +74px、Critique 工具栏 +74px)。全站网格补 `grid-cols-1` 显式基线;
  Critique 工具栏两个分段控件包进滚动容器(min-w-0),按钮行开 flex-wrap;七个路由复扫
  全部为 0。规范写入 CODE-STYLE。
- **仪表盘删除按钮与状态徽章重叠修复**:悬停时徽章 transform 左移让位、删除按钮淡入
  (触屏常显路径同步),不再互相压盖。
- **其他**:落地页截图补 width/height 消 CLS、后景图懒加载;登录/注册表单补 autocomplete
  (email/current-password/new-password)与「返回首页」链接;登录邮箱自动聚焦;工作台
  无占位符输入补 aria-label;侧栏与移动导航加 aria-current;服务端双路由补 30MB 上传兜底;
  CopyButton 定时器卸载清理;演示模式下 gentle 口径裁减示例条数,口径切换在演示模式也体感。
- 验证:lint 0 告警、vitest 17/17、生产构建通过、演示模式 smoke 15/15、
  390px 七路由溢出扫描全零。

## 2026-10-30 · v0.15.0 视觉丰盈层(图标/装饰/巧思)

- **装饰词汇三件套**(对齐 flolab「白底承载彩色图形」):`IconChip` 面板标题图标芯片
  (全站 20+ 卡片接入)、`DecoCluster` 几何装饰角件(登录/注册卡)、点阵变体
  `bg-dots-faint`(拖放区/定价标题)与 `bg-dots-light`(落地页深色 CTA)。
- **Critique 页**(用户首触页):条目加两位序号(01…15 文档式排布);严重度徽章配
  AlertCircle/MinusCircle/Lightbulb 微图标;类别徽章按 逻辑=Brain / 表达=Type /
  语法=SpellCheck / 风格=PenLine 配图。
- **工作台**:顶部五枚步骤徽章以 1px 管线轨衔接(完成段 accent、未完成 line)——流水线
  进度静态可视化;三位审稿人固定形象图标(方法=FlaskConical/统计=Sigma/领域=Crown)贯穿
  审稿卡与回复线程(R1/R2/R3 圆座头像);脱敏/稿件信息/章节结构/文献/Cover/组会/修改稿
  对照/承诺核查各卡头部接入图标芯片。
- **其余页面**:仪表盘新建稿件/我的稿件芯片,拖放区点阵铺底 + 上传图标圆座;洞察页五张
  分析卡芯片 + 统计卡图标座;定价三档 Sprout/Zap/Building2 与标题点阵;指南七步逐卡图标;
  登录/注册卡几何装饰角件。
- **顺带**:工作台 load 与首挂载 effect 去重(applyLoaded 统一应用,消除 React Compiler
  手动记忆化警告)。
- 验证:lint 0 告警、vitest 17/17、生产构建通过、DOM 结构断言(序号/轨线/芯片/角件/点阵
  全部落位)。装饰纪律写入 DESIGN.md「装饰词汇」节。

## 2026-10-30 · v0.15.1 页面质感底图

- 全站 body 底色升级为三层质感底图(纯 CSS/SVG,零网络请求):顶部 1100px 靛蓝径向微光
  (0.07)让白色浮岛真正浮起;180px 平铺 feTurbulence 细颗粒噪声(rect opacity 0.05)提供
  纸面触感;底色 #fafafb 不变。白岛、深色 CTA、点阵装饰均不受影响。
- DESIGN.md 底色条目同步(改底色需三层一起动)。
- 验证:构建通过、smoke 15/15、计算样式断言(径向光 + 噪声层均生效)。

## 2026-10-30 · v0.15.2 底图加强版(明显且优雅)

- 反馈「不够明显」后重做底图:①噪声提级(0.05 → 0.07);②新增 `.page-deco` 顶部级底图
  (660px 向下渐隐)——三团靛蓝/紫罗兰极光(0.13–0.16)叠十字网格纹理(0.10,与
  DecoCluster 十字母题同源),白岛浮在可见的有色场上;③body `isolation: isolate`
  解决负 z 装饰层与背景的绘制顺序,layout 挂载单一装饰节点,全站(双壳)生效。
- 验证:lint 0 告警、构建通过、smoke 15/15、计算样式断言(三层背景/遮罩/层级均生效)。

## 2026-10-30 · v0.16.0 微交互与动效精修

- **骨架屏 shimmer**:脉冲改为白光扫过(.skeleton::after,transform-only),加载态更有质感。
- **实底按钮**:悬停 -1px 浮起 + 阴影加深,按压 scale(0.97) 归位(.btn-primary/.btn-dark 内聚,
  不再依赖 .press 组合)。
- **行内链接划线 `.link-fx`**:下划线 scaleX 从左划入(transform-only),落地页页脚、洞察
  时间线、仪表盘「查看方案」接入。
- **极光底图漂移**:.page-deco 26s ease-in-out 往复 translate(±1%),首屏氛围「活」起来。
- **分段控件滑动过冲**:活动块改 cubic-bezier(0.3,1.3,0.35,1),~3% 过冲后回弹。
- **悬停点亮**:Critique 条目与回复线程的引用竖线随行悬停变色;洞察时间线节点悬停放大;
  落地页功能卡图标悬停 scale(1.1);Logo 悬停 -6° 微倾(品牌母题方向);输入框悬停边框加深。
- **其它**:空态插画 float-soft-xs 小幅漂浮;落地页 FAQ 展开内容淡入;锚点跳转 scroll-mt-24
  (浮动导航不遮标题);落地页统计数字 CountUp(600ms ease-out,reduced-motion 直显);
  本地模式状态灯呼吸 ping;批量打磨进度 aria-live。
- 全部动效仅 transform/opacity,`prefers-reduced-motion` 全局降级;lint 0 告警、构建通过、
  smoke 15/15。

## 2026-10-31 · v0.17.0 语义图形与巧思第三轮

- **落地页对比区**:两列清单语义图标化(通用平台 = 弱化 X,R&R Studio = 主色 Check),
  优劣一眼可辨;三步流程加虚线连接线(序列语义,数字圆座以 band 色环脱开底纹);
  主样机悬停微透视(perspective + 1.5°/-2°,300ms);页脚新增「回到顶部」平滑滚动
  (客户端小组件,指南/更新日志页脚复用)。
- **落地页统计 CountUp**:40+/3 位/100%/4 类 四枚数字滚动进场(reduced-motion 直显)。
- **空态行动按钮**:追加 ArrowRight 悬停右移,与全站 CTA 手势一致。
- 验证:lint 0 告警、vitest 17/17、构建通过、smoke 15/15。

## 2026-10-31 · v0.18.0 高级感升维(材质与光学)

- **多层环境光阴影**:.panel 从单影升级为三层(1px 定边 + 近影 + 24px 弥散远影),
  全站白岛获得真实的空气厚度——高级感的最大单一杠杆。
- **实底按钮维度渐变**:顶部白光内高光 + 底部压暗的双层 background-image 叠在令牌色上,
  按钮「立」起来;悬停阴影同步加深。
- **玻璃吸顶层**:工作台页签条(白/65 + blur-xl + 内高光 + 弥散影)、移动顶栏、侧栏
  (白/85 半透明玻璃)、营销导航胶囊组——磨砂玻璃质感。
- **关键数字渐变** `.num-grad`:靛蓝→紫罗兰小面积渐变文字,落地页 hero 强调词、统计数字、
  洞察统计卡。
- **光学细节**:落地页段落 text-balance(避免孤字尾行);页脚分隔改渐隐发丝线;
  深色 CTA 内侧高光 + 大弥散影;分段控件活动胶囊分层影;field 焦点环提级;
  rise-in 0.26s → 0.32s(更从容的入场节奏)。
- 验证:lint 0 告警、vitest 17/17、构建通过、smoke 15/15。
