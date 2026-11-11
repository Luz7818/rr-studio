import { describe, expect, it } from "vitest";
import { doiFromUrl, toApa, toBibtex, toGbT7714, type CiteRef } from "./citations";

/**
 * ─── CSL 样式对拍基准(2026-11-12 实渲染,非手写期望) ───────────────────────────
 *
 * 基准来源:citeproc-js(v3 npm 包 citeproc)分别加载官方样式
 *   ① apa.csl(en-US locale)
 *   ② china-national-standard-gb-t-7714-2015-numeric.csl(zh-CN locale)
 * 渲染下述 6 条受控样本所得(citeproc updateUncitedItems + makeBibliography,
 * 剥 HTML 标签取纯文本)。样式文件经 postext-citeproc(CSL 项目样式/CC BY-SA 3.0,
 * 未修改转发)分发;另以 citation-js 0.7.22 渲染同样本作 BibTeX 结构旁证。
 *
 * 下述 toBibtex/toApa/toGbT7714 对拍用例的期望值即这些实渲染输出。与基准的
 * 已登记差异(改这些差异 = 改设计,必须同步改注释与路线图):
 *   1. 三函数均为纯文本导出,无斜体/引号排版(数据形状只有 5 字段);
 *   2. 无卷/期/页数据,GB/T「卷(期): 页」段与 APA「卷(期), 页」段整段省略;
 *   3. GB/T 序号 [n] 按入参顺序(CSL numeric 的序号语义是正文引用序,导出无正文
 *      上下文,取检索结果的重要性序);对拍样本按基准字母序排列使序号重合;
 *   4. BibTeX 键全小写、题名首词不跳冠词、缩进两空格、字段固定顺序——citation-js
 *      保留原大小写、跳过冠词 "a"、tab 缩进、字段序不定;citation-js 0.7 对中文
 *      条目渲染坏键+空作者(`undefined2023undefined` / `author = {,  and ,  and, }`),
 *      正是「自写纯函数方案成立」的直接证据(调研-业务仓后端.md §2.5);
 *   5. APA >20 作者的省略截断(…+末作者)未实现,检索数据实际 ≤ 数人。
 */

// 与上方基准一一对应的受控样本;display name 即本仓检索管线存的形状("名 姓"西文/CJK 连写)
const FIXTURES: CiteRef[] = [
  {
    title: "Adaptive traffic signal control with deep reinforcement learning",
    authors: ["John A. Smith", "Wei Chen"],
    year: 2024,
    venue: "IEEE Transactions on Intelligent Transportation Systems",
    // 故意只给 doi 链接不给裸 doi:验证 doi-from-url 分支与 url 去重
    url: "https://doi.org/10.1109/tits.2024.0001",
  },
  {
    title: "Attention is all you need",
    authors: ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar", "Jakob Uszkoreit"],
    year: 2017,
    venue: "Advances in Neural Information Processing Systems",
  },
  {
    title: "城市轨道交通客流预测方法综述",
    authors: ["陈伟", "李明", "王芳"],
    year: 2023,
    venue: "交通运输系统工程与信息",
  },
  {
    title: "A survey on embodied navigation",
    authors: ["Yang Liu"],
    year: 2025,
    url: "https://example.org/survey",
  },
  {
    title: "Dataset note without a publication year",
    authors: ["Maria Gomez"],
    year: null,
    venue: "Journal of Open Data",
    doi: "10.5281/dataset.note",
  },
  {
    title: "Anonymous report on benchmark integrity",
    year: 2022,
    venue: "Journal of Open Data",
    doi: "10.5281/anon.2022",
  },
];

describe("GB/T 7714 与官方 CSL 对拍(基准 = china-national-standard-gb-t-7714-2015-numeric 实渲染)", () => {
  it("六条样本逐条等于 CSL 渲染结果", () => {
    expect(toGbT7714(FIXTURES).split("\n")).toEqual([
      // CSL: SMITH J A, CHEN W. …[J/OL]. IEEE Transactions on Intelligent
      //      Transportation Systems, 2024. DOI:10.1109/tits.2024.0001.
      "[1] SMITH J A, CHEN W. Adaptive traffic signal control with deep reinforcement learning[J/OL]. IEEE Transactions on Intelligent Transportation Systems, 2024. DOI:10.1109/tits.2024.0001.",
      // CSL: VASWANI A, SHAZEER N, PARMAR N, 等. Attention is all you need[J].
      //      Advances in Neural Information Processing Systems, 2017.
      // 4 作者触发「等」截断(官方 CSL zh-CN locale 的 et-al 项渲染就是「等」);
      // 无 DOI/URL → [J] 而非 [J/OL]。
      "[2] VASWANI A, SHAZEER N, PARMAR N, 等. Attention is all you need[J]. Advances in Neural Information Processing Systems, 2017.",
      // CSL: 陈伟, 李明, 王芳. 城市轨道交通客流预测方法综述[J]. 交通运输系统工程与信息, 2023.
      // CJK 姓名整体保留(已姓前名后),3 作者不截断。
      "[3] 陈伟, 李明, 王芳. 城市轨道交通客流预测方法综述[J]. 交通运输系统工程与信息, 2023.",
      // CSL: LIU Y. A survey on embodied navigation[J/OL]. 2025. https://example.org/survey.
      // 无刊名 → 刊名段省略,只剩年;无 DOI → 链接段落原 url。
      "[4] LIU Y. A survey on embodied navigation[J/OL]. 2025. https://example.org/survey.",
      // CSL: GOMEZ M. Dataset note without a publication year[J/OL]. Journal of Open
      //      Data. DOI:10.5281/dataset.note.
      // 年缺省 → 年段(含前逗号)整段省略,不是 (n.d.) 也不是 0。
      "[5] GOMEZ M. Dataset note without a publication year[J/OL]. Journal of Open Data. DOI:10.5281/dataset.note.",
      // CSL: Anonymous report on benchmark integrity[J/OL]. Journal of Open Data,
      //      2022. DOI:10.5281/anon.2022.
      // 无作者 → 题名顶替作者位(与 CSL 行为一致),标题后不重复出现。
      "[6] Anonymous report on benchmark integrity[J/OL]. Journal of Open Data, 2022. DOI:10.5281/anon.2022.",
    ]);
  });

  it("「等」截断边界:恰 3 作者不截,4 作者取三留等,5 作者同", () => {
    const three = toGbT7714([
      { title: "T", authors: ["Ann Lee", "Bob Ray", "Cara Fox"], year: 2024 },
    ]);
    expect(three).toContain("LEE A, RAY B, FOX C. T[J]. 2024.");
    expect(three).not.toContain("等");
    const four = toGbT7714([
      { title: "T", authors: ["Ann Lee", "Bob Ray", "Cara Fox", "Dan Wu"], year: 2024 },
    ]);
    expect(four).toContain("LEE A, RAY B, FOX C, 等. T[J]. 2024.");
    expect(four).not.toContain("WU D");
    expect(
      toGbT7714([
        { title: "T", authors: ["Ann Lee", "Bob Ray", "Cara Fox", "Dan Wu", "Eve Bar"], year: 2024 },
      ]),
    ).toContain("LEE A, RAY B, FOX C, 等.");
  });

  it("url 只是 doi 链接时链接段归一为 DOI: 形式,不再重复 url", () => {
    const out = toGbT7714([
      { title: "T", authors: ["Aa Bb"], year: 2024, url: "https://doi.org/10.12345/x?utm=1" },
    ]);
    expect(out).toContain("DOI:10.12345/x.");
    expect(out).not.toContain("doi.org");
  });
});

describe("APA 与官方 CSL 对拍(基准 = apa.csl en-US 实渲染)", () => {
  it("六条样本逐条等于 CSL 渲染结果(斜体为纯文本导出的已登记差异)", () => {
    expect(toApa(FIXTURES).split("\n")).toEqual([
      // CSL: Smith, J. A., & Chen, W. (2024). Adaptive … learning. <i>IEEE Transactions
      //      on Intelligent Transportation Systems</i>. https://doi.org/10.1109/tits.2024.0001
      // 作者并列第 7 版连接词 ", & ";链接为末段、其后无句点。
      "Smith, J. A., & Chen, W. (2024). Adaptive traffic signal control with deep reinforcement learning. IEEE Transactions on Intelligent Transportation Systems. https://doi.org/10.1109/tits.2024.0001",
      // CSL: Vaswani, A., Shazeer, N., Parmar, N., & Uszkoreit, J. (2017). Attention is
      //      all you need. <i>Advances in Neural Information Processing Systems</i>.
      // 无链接 → 行以刊名句点收尾。
      "Vaswani, A., Shazeer, N., Parmar, N., & Uszkoreit, J. (2017). Attention is all you need. Advances in Neural Information Processing Systems.",
      // CSL: 陈伟, 李明, & 王芳. (2023). 城市轨道交通客流预测方法综述. <i>交通运输系统工程与信息</i>.
      // CJK 姓名不做缩写化,与 CSL 一致。
      "陈伟, 李明, & 王芳. (2023). 城市轨道交通客流预测方法综述. 交通运输系统工程与信息.",
      // CSL: Liu, Y. (2025). <i>A survey on embodied navigation</i>. https://example.org/survey
      // 无刊名 → 题名后直接链接(CSL 会给题名加斜体,纯文本导出不排)。
      "Liu, Y. (2025). A survey on embodied navigation. https://example.org/survey",
      // CSL: Gomez, M. (n.d.). Dataset note without a publication year.
      //      <i>Journal of Open Data</i>. https://doi.org/10.5281/dataset.note
      // 年缺省 → (n.d.)(与 GB/T 的整段省略是两套规则,均为 CSL 行为)。
      "Gomez, M. (n.d.). Dataset note without a publication year. Journal of Open Data. https://doi.org/10.5281/dataset.note",
      // CSL: Anonymous report on benchmark integrity. (2022). <i>Journal of Open Data</i>.
      //      https://doi.org/10.5281/anon.2022
      "Anonymous report on benchmark integrity. (2022). Journal of Open Data. https://doi.org/10.5281/anon.2022",
    ]);
  });

  it("三名以上用「, & 」并列连接,单作者不加连接词;CJK 作者块补句点后接年份", () => {
    expect(toApa([{ title: "T", authors: ["Ann Lee", "Bob Ray", "Cara Fox"], year: 2024 }])).toBe(
      "Lee, A., Ray, B., & Fox, C. (2024). T.",
    );
    expect(toApa([{ title: "T", authors: ["Ann Lee"], year: 2024 }])).toBe("Lee, A. (2024). T.");
    expect(toApa([{ title: "T", authors: ["陈伟", "李明"], year: 2024 }])).toBe(
      "陈伟, & 李明. (2024). T.",
    );
  });
});

describe("BibTeX 与 citation-js 旁证对拍(结构基准;差异 4 条已登记于文件头)", () => {
  it("首作者姓+年+题名首词构键,与 citation-js 键构成一致(仅大小写差异)", () => {
    const out = toBibtex([FIXTURES[0]]);
    expect(out).toContain("@article{smith2024adaptive,");
    // citation-js 旁证:@article{Smith2024Adaptive, author = {Smith, John A. and Chen, Wei},
    //   journal = {IEEE Transactions on Intelligent Transportation Systems},
    //   doi = {10.1109/tits.2024.0001}, year = {2024}, title = {…}} —— 字段内容一致。
    expect(out).toContain("author = {Smith, John A. and Chen, Wei}");
    expect(out).toContain("doi = {10.1109/tits.2024.0001}");
    // url 即 doi 链接 → 去重,url 字段不重复输出
    expect(out).not.toContain("url = {");
  });

  it("键稳定:同输入两次构键一致,同列表内键互异", () => {
    expect(toBibtex(FIXTURES)).toBe(toBibtex(FIXTURES));
    const keys = [...toBibtex(FIXTURES).matchAll(/@article\{([^,]+),/g)].map((m) => m[1]);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain("vaswani2017attention");
  });

  it("键冲突按出现顺序追加 a/b/c 后缀,非法字符被清洗", () => {
    const dup = [
      { title: "Traffic & Flow: a study!", authors: ["Amy Poe"], year: 2024 },
      { title: "Traffic (Flow) study", authors: ["Amy Poe"], year: 2024 },
    ];
    const keys = [...toBibtex(dup).matchAll(/@article\{([^,]+),/g)].map((m) => m[1]);
    expect(keys).toEqual(["poe2024traffic", "poe2024traffica"]);
  });

  it("CJK 条目键降级为年段;citation-js 同输入坏键(undefined2023undefined),仅可比对结构", () => {
    const out = toBibtex([FIXTURES[2]]);
    expect(out).toContain("@article{2023,");
    expect(out).toContain("author = {陈伟 and 李明 and 王芳}");
    expect(out).toContain("title = {城市轨道交通客流预测方法综述}");
    expect(out).toContain("journal = {交通运输系统工程与信息}");
  });

  it("LaTeX 活跃字符转义:标题中 & % $ # _ 前加反斜杠", () => {
    const out = toBibtex([{ title: "Water & rock: 50% H_2O of $5", authors: ["Aa Bb"], year: 2024 }]);
    expect(out).toContain("title = {Water \\& rock: 50\\% H\\_2O of \\$5}");
  });

  it("年缺省省略 year 字段与键年段(对齐 citation-js GomezDataset 旁证);键全空回退 ref<序号>", () => {
    const out = toBibtex([{ title: "Solo", authors: ["Maria Gomez"] }]);
    expect(out).toContain("@article{gomezsolo,");
    expect(out).not.toContain("year = ");
    // CJK-only 输入,姓/首词清洗后全空 → ref1
    expect(toBibtex([{ title: "城市研究", authors: ["陈伟"], year: 2024 }])).toContain("@article{2024,");
    expect(toBibtex([{ title: "城市研究" }])).toContain("@article{ref1,");
  });
});

describe("doiFromUrl 与缺字段降级(旧数据 authors 字段缺省)", () => {
  it("从 doi 链接、带查询串的裸 DOI 链接提取,非 DOI 链接返回 null", () => {
    expect(doiFromUrl("https://doi.org/10.1109/tits.2024.0001")).toBe("10.1109/tits.2024.0001");
    expect(doiFromUrl("https://doi.org/10.5281/x.y?v=2")).toBe("10.5281/x.y");
    expect(doiFromUrl("10.1038/s41586-024-0001-x")).toBe("10.1038/s41586-024-0001-x");
    expect(doiFromUrl("https://example.org/survey")).toBeNull();
    expect(doiFromUrl("")).toBeNull();
    expect(doiFromUrl(null)).toBeNull();
    expect(doiFromUrl(undefined)).toBeNull();
  });

  it("旧数据无 authors 字段(存量为 2025-11 前项目)按无作者规则降级不抛错", () => {
    const legacy = { title: "Old paper", year: 2021, venue: "J", citedBy: 0, url: "", abstract: "" };
    expect(toApa([legacy])).toBe("Old paper. (2021). J.");
    expect(toGbT7714([legacy])).toBe("[1] Old paper[J]. J, 2021.");
    expect(toBibtex([legacy])).toContain("@article{2021old,");
  });
});
