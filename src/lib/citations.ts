/**
 * 引用格式导出三纯函数:BibTeX / APA(第 7 版) / GB/T 7714-2015(顺序编码制)。
 *
 * 设计依据(核查报告/_体检-2026-11-11/综合路线图.md §3.6-4 与 研究三轮-后端功能批设计.md §2.3-B):
 * 输入只有文献对标的 5 字段(title/authors/year/venue/doi/url),缺字段按格式规则降级
 * ——无 doi 省略 doi 段、无卷期页整段省略;自写纯函数而非 CSL 引擎,citation-js 0.7 的
 * BibTeX 导出对中文作者会渲染为空(author = {,  and ,  and, }),中文规则([J] 标识、
 * 「等」截断)直写反而可测。CSL 官方样式(apa.csl 与 china-national-standard-
 * gb-t-7714-2015-numeric.csl,citeproc-js 渲染)的对拍基准逐条登记在 citations.test.ts
 * 测试注释里,改动本文件先跑该测试确认与基准的差异是登记过的差异。
 */

/** 引用条目最小输入:LiteratureRef(title/year/venue/citedBy/url/abstract)结构可直传 */
export interface CiteRef {
  title: string;
  /** 显示名全称列表("John A. Smith" / "陈伟");检索数据缺作者时省略 → 题名顶替作者位 */
  authors?: readonly string[];
  year?: number | null;
  venue?: string;
  /** DOI 裸值(不带 https://doi.org/ 前缀);缺省时尝试从 url 提取 */
  doi?: string | null;
  url?: string | null;
}

/** OpenAlex/Semantic Scholar 检索结果形状(与 src/lib/literature.ts 保持结构同源) */
export interface LiteratureRef {
  title: string;
  authors?: string[];
  year: number | null;
  venue: string;
  citedBy: number;
  url: string;
  abstract: string;
}

/** CJK 字符(含扩展区):命中则整体保留姓名,不做姓/名拆分 */
const CJK = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;

/** 从 url 提取裸 DOI(https://doi.org/10.x/… 或直写的 10.x/…);提不出返回 null */
export function doiFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/(10\.\d{4,9}\/\S+?)(\?|#|$)/i);
  return m ? m[1] : null;
}

/**
 * 显示名 → 姓/名。西文显示名是「名 姓」序,按最后一个空格拆
 * ("John A. Smith" → family "Smith" given "John A.");单词名(如 "Madonna")给名为空;
 * CJK 名姓名连写已是姓前名后,整体保留不拆。
 */
function splitName(display: string): { family: string; given: string; cjk: boolean } {
  const name = display.trim();
  if (CJK.test(name)) return { family: name, given: "", cjk: true };
  const idx = name.lastIndexOf(" ");
  if (idx <= 0) return { family: name, given: "", cjk: false };
  return { family: name.slice(idx + 1), given: name.slice(0, idx), cjk: false };
}

/** 西文名 → 缩写串:"John A." → "J. A."(各 token 首字母大写加点);空给名 → "" */
function initials(given: string): string {
  return given
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => `${t[0].toUpperCase()}.`)
    .join(" ");
}

/** 西文名 → 姓前名后全称:"John A. Smith" → "Smith, John A.";CJK 原样 */
function surnameFirst(display: string): string {
  const { family, given, cjk } = splitName(display);
  return cjk || !given ? family : `${family}, ${given}`;
}

/** 西文名 → GB/T 式:"John A. Smith" → "SMITH J A"(姓全大写,名缩写无点);CJK 原样 */
function gbtAuthor(display: string): string {
  const { family, given, cjk } = splitName(display);
  if (cjk || !given) return family;
  const abbr = given
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t[0].toUpperCase())
    .join(" ");
  return `${family.toUpperCase()} ${abbr}`.trim();
}

/** 西文名 → APA 式:"John A. Smith" → "Smith, J. A.";CJK 原样 */
function apaAuthor(display: string): string {
  const { family, given, cjk } = splitName(display);
  if (cjk) return family;
  const abbr = initials(given);
  return abbr ? `${family}, ${abbr}` : family;
}

function normalize(ref: CiteRef): {
  title: string;
  authors: string[];
  year: number | null;
  venue: string;
  doi: string | null;
  url: string | null;
} {
  const doi = ref.doi?.trim() || doiFromUrl(ref.url);
  // url 只是 doi 链接时视为重复信息,各格式的链接段由 doi 表达
  const url = ref.url?.trim() && doi && /doi\.org/i.test(ref.url) ? null : (ref.url?.trim() || null);
  return {
    title: ref.title.trim(),
    authors: (ref.authors ?? []).map((a) => a.trim()).filter(Boolean),
    year: ref.year ?? null,
    venue: ref.venue?.trim() ?? "",
    doi: doi || null,
    url,
  };
}

/* ---------------------------------------------------------------- BibTeX -- */

const bibtexKeyPart = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** LaTeX 特殊字符转义(& % $ # _)——字段内容包在花括号里,仅这五个字符在 braces 内仍活跃 */
const escapeBibtex = (s: string) => s.replace(/([&%$#_])/g, "\\$1");

/**
 * toBibtex(refs):每条 `@article{key, …}`,key = 首作者姓+年+题名首词(全小写,仅保留
 * [a-z0-9];年缺省略年段,清空后为空回退 `ref<序号>`);键冲突按出现顺序追加字母后缀
 * a/b/c… 保证稳定。作者姓前名后以 " and " 连接(BibTeX 惯例)。对拍基准(citation-js
 * 0.7 同输入渲染)登记在 citations.test.ts——差异:键全小写(citation-js 保留原大小写)、
 * 题名首词不跳冠词(citation-js 会跳过 "a")、缩进两空格(citation-js 用 tab)、
 * 字段固定顺序(citation-js 顺序不定)。
 */
export function toBibtex(refs: readonly CiteRef[]): string {
  const seen = new Map<string, number>();
  const lines: string[] = [];

  refs.forEach((raw, i) => {
    const ref = normalize(raw);
    const surnameLatin = bibtexKeyPart(ref.authors.length ? splitName(ref.authors[0]).family : "");
    const yearPart = ref.year != null ? String(ref.year) : "";
    const firstWord = bibtexKeyPart(ref.title.split(/\s+/)[0] ?? "");
    let key = `${surnameLatin}${yearPart}${firstWord}`;
    if (!key) key = `ref${i + 1}`;
    const n = seen.get(key) ?? 0;
    seen.set(key, n + 1);
    if (n > 0) key += String.fromCharCode(96 + n); // 第二条 a,第三条 b……

    const fields: string[] = [];
    if (ref.authors.length > 0) {
      fields.push(`  author = {${ref.authors.map(surnameFirst).map(escapeBibtex).join(" and ")}}`);
    }
    fields.push(`  title = {${escapeBibtex(ref.title)}}`);
    if (ref.year != null) fields.push(`  year = {${ref.year}}`);
    if (ref.venue) fields.push(`  journal = {${escapeBibtex(ref.venue)}}`);
    if (ref.doi) fields.push(`  doi = {${ref.doi}}`);
    if (ref.url) fields.push(`  url = {${ref.url}}`);
    lines.push(`@article{${key},\n${fields.join(",\n")},\n}`);
  });

  return lines.join("\n");
}

/* ------------------------------------------------------------------- APA -- */

/** APA 作者序列:"A, B, & C"(第 7 版并列连接词,两名同样 ", & ");无作者 → null(题名顶替) */
function apaAuthors(authors: string[]): string | null {
  const list = authors.map(apaAuthor);
  if (list.length === 0) return null;
  if (list.length === 1) return list[0];
  return `${list.slice(0, -1).join(", ")}, & ${list[list.length - 1]}`;
}

/**
 * toApa(refs):`作者 (年). 题名. 刊名. https://doi.org/…`(第 7 版;卷期页无数据省略,
 * 刊名应排斜体此处为纯文本导出)。年缺省 `(n.d.)`;无作者题名顶替作者位且不再重复
 * (与 CSL apa.csl 渲染一致);链接段 DOI 优先、无 DOI 落 url,为末段时不带句点。
 * 对拍基准登记在 citations.test.ts——已知差异:>20 作者的省略截断(… + 末作者)未实现
 * (检索数据实际 ≤ 数人)。
 */
export function toApa(refs: readonly CiteRef[]): string {
  return refs
    .map((raw) => {
      const ref = normalize(raw);
      const list = apaAuthors(ref.authors);
      // 作者块以句点收束后再接年份:拉丁缩写串自带句点(…& Chen, W.),CJK 姓名串不带
      // (…& 王芳)需补——CSL apa.csl 渲染两者都是「作者块. (年).」
      const authorsPart = list ? (list.endsWith(".") ? list : `${list}.`) : null;
      const year = ref.year != null ? `(${ref.year})` : "(n.d.)";
      const link = ref.doi ? `https://doi.org/${ref.doi}` : (ref.url ?? "");
      // 题名/刊名段各自带句点;链接段在最末、其后不加句点(CSL apa.csl 渲染行为)
      const head = authorsPart ? `${authorsPart} ${year}. ${ref.title}.` : `${ref.title}. ${year}.`;
      const rest = [ref.venue ? `${ref.venue}.` : "", link].filter(Boolean).join(" ");
      return rest ? `${head} ${rest}` : head;
    })
    .join("\n");
}

/* -------------------------------------------------------------- GB/T 7714 -- */

/**
 * toGbT7714(refs):顺序编码制,`[n] 作者. 题名[J]. 刊名, 年. DOI:…`。
 * 规则(全部与官方 CSL china-national-standard-gb-t-7714-2015-numeric 实渲染对拍,
 * 基准见 citations.test.ts 注释):>3 作者取前三 +「等」;西文作者姓全大写、名缩写
 * 无点空格分隔(SMITH J A);DOI 或 url 存在用 [J/OL] 否则 [J];年缺省整段省略;
 * 链接段 DOI 优先(`DOI:10.x/y` 形式)、无 DOI 落 url;无作者题名顶替;序号按入参
 * 顺序(CSL 的引文序号由正文引用顺序决定,此处无正文上下文,按重要性序即入参序)。
 */
export function toGbT7714(refs: readonly CiteRef[]): string {
  return refs
    .map((raw, i) => {
      const ref = normalize(raw);
      const listed = ref.authors.length > 3 ? `${ref.authors.slice(0, 3).map(gbtAuthor).join(", ")}, 等` : ref.authors.map(gbtAuthor).join(", ");
      const authorsPart = listed ? `${listed}. ` : "";
      const type = ref.doi || ref.url ? "J/OL" : "J";
      const link = ref.doi ? `DOI:${ref.doi}` : (ref.url ?? "");
      const mid = [ref.venue, ref.year != null ? String(ref.year) : ""].filter(Boolean).join(", ");
      const head = `${authorsPart}${ref.title}[${type}]`;
      const tail = [mid, link].filter(Boolean).join(". ");
      return `[${i + 1}] ${tail ? `${head}. ${tail}.` : `${head}.`}`;
    })
    .join("\n");
}
