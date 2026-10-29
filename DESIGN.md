# DESIGN.md —— 视觉设计规范

> 用途:做界面的人。视觉令牌、几何语言、排版与动效约定。页面与组件结构看 `docs/PAGE-STRUCTURE.md`。
> **唯一设计锚点:[flolab.cn](https://flolab.cn)**(浏览器实测提取)。2026-10-19 用户拍板:
> 一切与 flolab 对齐;中途偏移到 Linear/Vercel 风的几何系统已回退。

## 来源与定位

极简白 + 单一靛蓝主色 + 胶囊几何的学术工具气质。flolab 的核心语言:
**白底浮岛、白胶囊容器承载彩色图形、点阵装饰、居中大标题带主色强调、悬浮胶囊标签**。
层次以「投影 + 分隔线」共同构建;工具页保持信息密度,营销页(落地页)保持浮岛气质。

## 双壳结构(营销壳 / 应用壳)

- 根布局按会话分壳:SaaS 未登录 = **营销壳**(body 标记 `data-bare`,无侧栏,页面自备
  `MarketingNav` 浮岛胶囊导航);其余 = **应用壳**(AppShell 侧栏)。
- `bare-only` 工具类:仅在营销壳显示的元素(导航等),应用壳内由 CSS 强制隐藏。
- 营销页动效系统:`Reveal` 组件(IntersectionObserver → data-visible,CSS 过渡
  transform/opacity,65ms 强 ease-out,reduced-motion 直显);`float-soft`/`float-soft-slow`
  长周期漂浮(仅落地页 mockup 与悬浮标签);hero 入场用 `.stagger` 编排(60ms 步进)。

## 颜色令牌(定义于 `src/app/globals.css` @theme)

| 令牌 | 值 | 用途 |
|---|---|---|
| `ink` | `#17171c` | 主文字 |
| `ink-soft` | `#6e6e76` | 次要文字 |
| `ink-faint` | `#a4a4ad` | 辅助说明、占位符 |
| `band` | `#f4f4f6` | 灰底分区、分段控件槽 |
| `line` | `#ececf0` | 发丝线、描边(层次的主要来源) |
| `accent` | `#5147e5` | 唯一主色:主按钮、链接、活动态、数据条 |
| `accent-soft` | `#eeeefc` | 主色浅底:活动导航、AI 产出块 |

实际取值以 `globals.css` 为准。页面底色 `#fafafb`,其上两层质感底图(纯 CSS/SVG 零请求):
① `html` 平铺 `feTurbulence` 细颗粒噪声(rect opacity 0.07)提供整页纸面触感;
② `layout` 首个元素的 `.page-deco` 顶部级底图(660px 渐隐)——三团靛蓝/紫罗兰极光
(0.13–0.16)+ 十字网格纹理(0.10,呼应 DecoCluster 母题)。body `isolation: isolate`
使 `.page-deco`(-z10)落在背景之上、内容之下;改底色/光强时按层调整。

**状态色纪律**(Major/Minor/裁决/核查结论专用,不得当装饰):

- 一律「低饱和 50 底 + 200 描边 + 700 字」三件套(如 `border-red-200 bg-red-50 text-red-700`),
  禁止 100 底的粉彩色块。
- 更克制时用 4px 左色条(`border-l-2` + 300 色)代替整块底色——审稿意见列表的默认形态。
- 徽章形状是**全站唯一允许的胶囊**(`rounded-full`),只给状态/严重度/建议。

## 图标

- **唯一图标库:Lucide React**(`lucide-react`)。禁止在 chrome(非用户内容)使用 emoji、
  几何字符(✦ ↑ ← ⬇)当图标。
- 默认 16px(`h-4 w-4`)+ `strokeWidth 1.75`;小场景 14px(`h-3.5 w-3.5`),行内 12px(`h-3 w-3`)。
- 常用映射:导出 `Download`、复制 `Copy`/`Check`、返回 `ArrowLeft`、上传 `Upload`、
  洞察 `BarChart3`、提示 `Lightbulb`、删除 `Trash2`、刷新 `RefreshCw`。

## 几何语言:胶囊(对齐 flolab)

| 元素 | 圆角 | 说明 |
|---|---|---|
| 按钮 / 输入框 / 页签 / 徽章 / 导航项 | `rounded-full` | 全站交互控件一律胶囊(flolab 语言) |
| 面板卡片 | `rounded-xl`~`rounded-2xl` | 顶层容器,边框 1px `line` |
| 落地页大区块 / 拖放区 / 提示横幅 | `rounded-2xl`~`rounded-[2.5rem]` | 大圆角浮岛 |
| 内嵌块(引用、代码、批注) | `rounded-md`~`rounded-xl` | 内容块,不参与胶囊语言 |
| 弹窗 | `rounded-xl` + `shadow-xl` | 投影只给弹层 |

- 分段控件(页签/筛选/切换)= `SegmentedControl` 组件:`bg-band p-1 rounded-full` 槽 +
  白色活动块**滑动过渡**(220ms 统一缓动,只动 transform/width;键盘/reduced-motion 直跳)。
- 列表优先于卡片:同质内容(Critique 条目、回复线程、讲稿页)用 `divide-y` 行列表装进
  一个容器,行 hover 用 `bg-band/40`,不用逐行卡片。

## 装饰词汇(v0.15,对齐 flolab「白底承载彩色图形」)

- **面板标题图标芯片** `components/IconChip.tsx`:卡片头部统一装饰位——圆形浅底座
  (accent-soft / band / emerald-50 / amber-50)+ 14px Lucide 线性图标。所有内容卡标题
  都应带一枚;新卡照抄,不再手写。
- **几何装饰角件** `components/DecoCluster.tsx`:圆环 + 十字 + 实心点组合 SVG,仅令牌色
  低饱和(#ececf0/#eeeefc/#d9d5f8),用于登录/注册卡等静态角落;父容器 `relative
  overflow-hidden`,元素 `aria-hidden`。
- **点阵变体**:`bg-dots`(hero 专用)/ `bg-dots-faint`(卡内铺底,如上传拖放区、定价标题)/
  `bg-dots-light`(深色 CTA 白点阵)。
- **语义图形**:严重度徽章带 AlertCircle/MinusCircle/Lightbulb 微图标;Critique 类别徽章
  按 逻辑=Brain / 表达=Type / 语法=SpellCheck / 风格=PenLine 配图;三位审稿人有固定形象
  图标(方法=FlaskConical / 统计=Sigma / 领域=Crown)并出现在审稿卡与回复线程头像(R1/R2/R3)
  中;使用指南七步各配一枚图标芯片。
- **管线轨**:工作台顶部步骤徽章之间以 1px 连接线衔接,完成段为 `accent/40`,未完成为
  `line`——流水线进度的静态可视化。
- **序号**:Critique 条目与指南步骤用两位 `tabular-nums` 序号(01…),文档式排布。
- **纪律**:装饰只占小面积、只用令牌色、一律 `aria-hidden`、不抢内容层级;同一视图装饰
  元素不超过两类(如:芯片 + 一处点阵)。
- 点阵装饰 `.bg-dots` + 径向蒙版:仅落地页 hero;悬浮胶囊标签(黑/主色底白字)仅落地页 mockup。

## 排版

- 产品内字重 ≤ 600(`font-semibold`);`font-black` 不使用。
- 页面主标题 `text-2xl font-semibold`;区块标题 `text-[13px] font-semibold`;
  正文/控件 `text-[13px]`;元信息 `text-xs text-ink-faint`。
- 落地页 hero 可到 `text-5xl`,主色强调词(对齐 flolab 的彩色标题段)。
- 数字 `tabular-nums`(body 全局开启);中文与英文/数字间留一个半角空格。
- 强调词用主色,单段最多一处。

## 层次与质感

- 层次来源:**胶囊形 + 分隔线 + 边框**为主;`card-shadow` 用于浮岛(落地页 mockup、Logo
  胶囊、弹层);产品内静态面板以边框为主。
- 质感层(v0.12):静态面板加 `.panel` 发丝级落影(纸面厚度,不抢边框的层次职责);
  实底按钮加 `.btn-primary`/`.btn-dark`(内高光 + 主色/墨色柔影);输入统一 `.field`
  (灰底 → 聚焦白底 + 主色微光圈,键盘聚焦同效)。新面板/按钮/输入一律复用,不再手写阴影。
- `card-lift`(hover 上浮)只用于**可点击进入**的卡片(如仪表盘稿件卡);静态容器不飘。
- 深色带(`bg-ink`)只出现在落地页 CTA 区。

## 动效

- 统一缓动曲线 `cubic-bezier(0.23, 1, 0.32, 1)`(强 ease-out),UI 动效一律 ≤ 300ms。
- 数据条一律用 `FillBar` 组件(挂载从 0 填充到目标宽度);弹层入场 `.pop-in`,退场淡出由
  `ConfirmDialog` 内建(130ms,reduced-motion 直关)。
- 微交互:按压 `.press`(active `scale(0.97)`);内容块进入 `.rise-in`;列表交错 `.stagger`
  (30–80ms 间隔,上限 240ms);数据条 `.bar-fill`;busy 按钮 `.spinner`(currentColor)。
- 键盘触发的状态变化不加动画:页签数字键 1–7 直跳;count-up 只用于洞察页统计卡,
  `prefers-reduced-motion` 时直显终值。
- 尊重 `prefers-reduced-motion`(globals 已全局降级);不引第三方动画库;只动 transform/opacity。

## 交互组件

- **确认弹窗**:统一用 `components/ConfirmDialog.tsx`(遮罩 blur + pop-in 面板,退场淡出,
  Tab 焦点圈内循环,Escape/点遮罩取消,危险操作红色确认),禁止新写 `window.confirm`。
- **分段控件**:统一用 `components/SegmentedControl.tsx`(滑动白胶囊),禁止手写瞬时切换的
  `bg-band` 按钮组;数据条统一用 `components/FillBar.tsx`。
- **空态**:纯文字 + 可选行动按钮(`EmptyState`),不放装饰图标。
- **加载态**:busy 按钮/空态行动按钮内嵌 `.spinner`;页面初始加载用 `.skeleton` 脉冲。

## 图标与品牌

- 品牌图标 `src/app/icon.svg`(副本 `public/logo.svg` 供界面引用):**白底圆角方块 + 单色靛蓝
  实体稿件图形**(-5° 微旋、白色行与判定勾镂空)——对齐 flolab「白底蓝鲸」的图形语言:
  白底承载单色实体形,而不是彩底白线。**禁止用 `<text>`/系统字体画图标**(跨平台渲染不一致);
  改动需在浏览器 16/32/64/180px 四档实测对比后定稿。
- 界面 Logo 统一引用 `public/logo.svg`,置于**白胶囊容器 + card-shadow** 中(对齐 flolab
  顶栏 Logo 处理),侧栏 / 移动顶栏 / 登录注册卡同构。
- 按钮图标(Lucide)带语义微动效:导出类 `Download` hover 下探 0.5px、返回类 `ArrowLeft`
  hover 左移 0.5px、拖放区 `Upload` hover 上浮、刷新 `RefreshCw` 加载时自旋、复制成功
  `Check` 以 `.icon-pop` 弹入(0.6 起跳)。微动效一律 200ms 级、只动 transform,由
  `prefers-reduced-motion` 全局降级。
- 产品名书写 `R&R Studio`,语气词「投稿前,先被 AI 审稿人虐一遍」为固定副标语(仅落地页)。
