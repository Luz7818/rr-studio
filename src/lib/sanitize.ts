export interface SanitizeReport {
  redactions: number;
  details: Record<string, number>;
  removedAuthorBlock: boolean;
}

interface Rule {
  name: string;
  re: RegExp;
  replacement: string;
}

const RULES: Rule[] = [
  { name: "EMAIL", re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, replacement: "[EMAIL]" },
  { name: "ORCID", re: /\b\d{4}-\d{4}-\d{4}-\d{3}[\dXx]\b/g, replacement: "[ORCID]" },
  { name: "URL", re: /https?:\/\/\S+|www\.\S+/g, replacement: "[URL]" },
  {
    name: "GRANT",
    re: /\b(?:grant|award|contract|project)\s+(?:no\.?|number|id)\s*[:#]?\s*[^,;).\n]+/gi,
    replacement: "[GRANT INFO REDACTED]",
  },
  { name: "FUNDING", re: /\b(?:funded|supported)\s+by\s+[^,;.\n]{0,120}/gi, replacement: "[FUNDING REDACTED]" },
  {
    name: "FUNDING_CN",
    re: /(国家|省|市)[^\s,;，。；]{0,12}(?:基金|项目)[^\s,;，。；]{0,40}/g,
    replacement: "[基金信息已删除]",
  },
  { name: "TEL", re: /\b(?:tel|phone|fax)\.?\s*[:：]\s*\+?[\d\s().-]{7,}/gi, replacement: "[TEL]" },
  { name: "LONG_NUM", re: /\b\d{6,}\b/g, replacement: "[NUM]" },
];

// 独立成行的单位/院系信息(标题页残留)
const AFFILIATION_RE =
  /^\s*(?:[\d*†‡§¶a-zA-Z,;\s]*)?(?:the\s+)?(?:university|institute|department|school|college|academy|laboratory|lab|center|centre|faculty|key laboratory)\b/i;

function bump(details: Record<string, number>, name: string) {
  details[name] = (details[name] ?? 0) + 1;
}

/**
 * 对章节文本做脱敏:邮箱、ORCID、链接、基金号、电话、长数字串、单位行。
 * 返回替换后的文本与统计报告。
 */
export function sanitizeText(input: string): { text: string; report: SanitizeReport } {
  const details: Record<string, number> = {};
  let text = input;

  for (const rule of RULES) {
    text = text.replace(rule.re, () => {
      bump(details, rule.name);
      return rule.replacement;
    });
  }

  text = text
    .split("\n")
    .map((line) => {
      const t = line.trim();
      if (!t) return line;
      if (t.length <= 140 && AFFILIATION_RE.test(t)) {
        bump(details, "AFFILIATION");
        return "[AFFILIATION REMOVED]";
      }
      if (/corresponding author/i.test(t) && t.length <= 200) {
        bump(details, "CONTACT");
        return "[CONTACT REMOVED]";
      }
      return line;
    })
    .join("\n");

  const redactions = Object.values(details).reduce((a, b) => a + b, 0);
  return { text, report: { redactions, details, removedAuthorBlock: false } };
}

export const SANITIZE_LABELS: Record<string, string> = {
  EMAIL: "邮箱地址",
  ORCID: "ORCID 编号",
  URL: "网址链接",
  GRANT: "基金/项目编号",
  FUNDING: "资助来源描述",
  FUNDING_CN: "中文基金信息",
  TEL: "电话/传真",
  LONG_NUM: "长数字串(编号/登录号)",
  AFFILIATION: "单位/院系信息",
  CONTACT: "通讯作者信息",
};
