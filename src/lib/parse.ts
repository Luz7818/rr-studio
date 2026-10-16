import { extractText } from "unpdf";
import mammoth from "mammoth";
import type { Section } from "./types";

/**
 * 常见 IMRaD 章节标题。行内匹配(整行只有标题,或 IEEE 风格编号标题)。
 */
const HEADING_RULES: Array<{ re: RegExp; heading: string }> = [
  { re: /^abstract\b[\s.:—–-]*$/i, heading: "Abstract" },
  { re: /^(keywords?|index terms)\b[\s.:—–-]*.*$/i, heading: "Keywords" },
  { re: /^(?:(?:[ivxlcdm]+|\d+)\s*[.):]?\s+)?introduction\b[\s.:—–-]*$/i, heading: "Introduction" },
  { re: /^(?:(?:[ivxlcdm]+|\d+)\s*[.):]?\s+)?background\b[\s.:—–-]*$/i, heading: "Introduction" },
  { re: /^(?:(?:[ivxlcdm]+|\d+)\s*[.):]?\s+)?related works?\b[\s.:—–-]*$/i, heading: "Related Work" },
  { re: /^(?:(?:[ivxlcdm]+|\d+)\s*[.):]?\s+)?literature (?:review|overview)\b[\s.:—–-]*$/i, heading: "Related Work" },
  {
    re: /^(?:(?:[ivxlcdm]+|\d+)\s*[.):]?\s+)?(?:materials? and methods?|methodology|methods?|experimental (?:setup|section|program)|study design)\b[\s.:—–-]*$/i,
    heading: "Methods",
  },
  { re: /^(?:(?:[ivxlcdm]+|\d+)\s*[.):]?\s+)?results?\b[\s.:—–-]*$/i, heading: "Results" },
  { re: /^(?:(?:[ivxlcdm]+|\d+)\s*[.):]?\s+)?results? and discussion\b[\s.:—–-]*$/i, heading: "Results and Discussion" },
  { re: /^(?:(?:[ivxlcdm]+|\d+)\s*[.):]?\s+)?discussion\b[\s.:—–-]*$/i, heading: "Discussion" },
  { re: /^(?:(?:[ivxlcdm]+|\d+)\s*[.):]?\s+)?conclusions?\b[\s.:—–-]*$/i, heading: "Conclusion" },
  { re: /^limitations\b[\s.:—–-]*$/i, heading: "Limitations" },
  { re: /^acknowledgeme?nts?\b[\s.:—–-]*$/i, heading: "Acknowledgments" },
  { re: /^(references?|bibliography)\b[\s.:—–-]*$/i, heading: "References" },
  { re: /^(appendix|appendices|supplementary materials?)\b[\s.:—–-]*$/i, heading: "Appendix" },
];

export interface ParseResult {
  title: string;
  sections: Section[];
  /** 标题页(作者/单位所在部分)是否被整体排除 */
  authorBlockRemoved: boolean;
}

function guessTitle(frontLines: string[]): string {
  const first = frontLines.map((l) => l.trim()).find((l) => l.length > 0);
  if (!first) return "未命名稿件";
  const cleaned = first.replace(/^title\s*[:.]\s*/i, "").trim();
  return cleaned.slice(0, 300) || "未命名稿件";
}

function makeSection(id: string, heading: string, text: string): Section | null {
  const cleaned = text.replace(/\n{3,}/g, "\n\n").trim();
  if (!cleaned) return null;
  return { id, heading, text: cleaned, chars: cleaned.length };
}

/**
 * 将纯文本稿件切分为章节;Abstract 之前的标题页(含作者/单位)不进入存储文本。
 */
export function sectionize(rawText: string): ParseResult {
  const text = rawText
    .replace(/\r\n?/g, "\n")
    // 修复 PDF 断词:`conges-\ntion` → `congestion`
    .replace(/(\p{L})-\n(\p{L})/gu, "$1$2")
    .replace(/\n{3,}/g, "\n\n");

  const lines = text.split("\n");
  const marks: Array<{ index: number; heading: string; sameLineBody?: string }> = [];

  lines.forEach((line, i) => {
    const t = line.trim();
    if (!t) return;
    if (t.length <= 90) {
      for (const rule of HEADING_RULES) {
        if (rule.re.test(t)) {
          marks.push({ index: i, heading: rule.heading });
          return;
        }
      }
    }
    // IEEE 行内式 "Abstract—This paper ..."
    const inline = t.match(/^abstract\b[:.\-—–]?\s*(.{40,})$/i);
    if (inline) marks.push({ index: i, heading: "Abstract", sameLineBody: inline[1] });
  });

  if (marks.length === 0) {
    const title = guessTitle(lines);
    const sec = makeSection(crypto.randomUUID(), "Manuscript", text);
    return { title, sections: sec ? [sec] : [], authorBlockRemoved: false };
  }

  const first = marks[0];
  const frontLines = lines.slice(0, first.index);
  const title = guessTitle(frontLines);
  const nonTitleFrontLines = frontLines.map((l) => l.trim()).filter((l) => l.length > 0).length;
  const authorBlockRemoved = nonTitleFrontLines > 1;

  const sections: Section[] = [];
  for (let k = 0; k < marks.length; k++) {
    const mark = marks[k];
    const end = k + 1 < marks.length ? marks[k + 1].index : lines.length;
    const body = mark.sameLineBody
      ? [mark.sameLineBody, ...lines.slice(mark.index + 1, end)].join("\n")
      : lines.slice(mark.index + 1, end).join("\n");
    const sec = makeSection(crypto.randomUUID(), mark.heading, body);
    if (sec) sections.push(sec);
  }

  // 同名章节合并(如拆页导致的重复标题)
  const merged: Section[] = [];
  for (const sec of sections) {
    const prev = merged[merged.length - 1];
    if (prev && prev.heading === sec.heading) {
      prev.text = `${prev.text}\n\n${sec.text}`;
      prev.chars = prev.text.length;
    } else {
      merged.push(sec);
    }
  }

  return { title, sections: merged, authorBlockRemoved };
}

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());
  if (name.endsWith(".pdf")) {
    const { text } = await extractText(new Uint8Array(buf), { mergePages: true });
    return text;
  }
  if (name.endsWith(".docx")) {
    const { value } = await mammoth.extractRawText({ buffer: buf });
    return value;
  }
  if (name.endsWith(".doc")) {
    throw new Error("暂不支持旧版 .doc,请另存为 .docx 或 PDF");
  }
  return buf.toString("utf8");
}
