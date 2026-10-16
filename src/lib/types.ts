export interface Section {
  id: string;
  heading: string;
  text: string;
  chars: number;
}

export interface SanitizeReport {
  redactions: number;
  details: Record<string, number>;
  removedAuthorBlock: boolean;
}

export type Severity = "major" | "minor" | "suggestion";
export type Category = "logic" | "expression" | "grammar" | "style";

export interface CritiqueItem {
  id: string;
  section: string;
  severity: Severity;
  category: Category;
  /** 原文片段,逐字引用 */
  quote: string;
  /** 中文问题说明 */
  comment: string;
  /** 英文改写句或明确操作建议 */
  suggestion: string;
  adopted: boolean;
}

export interface CritiqueReport {
  createdAt: string;
  items: CritiqueItem[];
  errors?: string[];
}

export type Persona = "methodologist" | "statistician" | "domain-expert";
export type Recommendation = "accept" | "minor_revision" | "major_revision" | "reject";

export interface ReviewComment {
  id: string;
  text: string;
}

export interface ReviewerReport {
  persona: Persona;
  label: string;
  overall: string;
  recommendation: Recommendation;
  major: ReviewComment[];
  minor: ReviewComment[];
  createdAt: string;
}

export interface ResponseThread {
  commentId: string;
  reviewer: string;
  type: "major" | "minor";
  commentText: string;
  draft: string;
  polished: string;
  updatedAt: string;
  /** 用户裁决:这条审稿意见是否成立(可申诉) */
  verdict?: "valid" | "invalid";
  /** 修改承诺:回复中答应修改稿件的哪处、改什么 */
  commitment?: string;
}

export interface PromiseCheck {
  commentId: string;
  reviewer: string;
  type: "major" | "minor";
  commitment: string;
  status: "fulfilled" | "partial" | "unmet";
  evidence: string;
}

export interface CoverLetter {
  content: string;
  createdAt: string;
}

export interface SeminarSlide {
  title: string;
  bullets: string[];
  script: string;
}

export interface SeminarQuestion {
  question: string;
  hint: string;
}

export interface Seminar {
  durationMin: number;
  language: "zh" | "en";
  slides: SeminarSlide[];
  questions: SeminarQuestion[];
  createdAt: string;
}

export interface RevisionDiffItem {
  section: string;
  changeType: "added" | "removed" | "modified" | "unchanged";
  description: string;
}

export interface Revision {
  uploadedAt: string;
  /** 修改稿章节(已脱敏) */
  sections: Section[];
  sanitize: SanitizeReport;
  summaryReady: boolean;
  diff: RevisionDiffItem[];
  overall: string;
  reviews?: ReviewerReport[];
  /** 承诺兑现核查:回复信里答应的修改是否真的改了 */
  promiseChecks?: PromiseCheck[];
}

export interface LiteratureRef {
  title: string;
  year: number | null;
  venue: string;
  citedBy: number;
  url: string;
  abstract: string;
}

export interface LiteratureGrounding {
  queries: string[];
  source: string;
  papers: LiteratureRef[];
  errors?: string[];
  fetchedAt: string;
}

export interface ProjectMeta {
  fileName?: string;
  targetJournal?: string;
  language: string;
}

export interface Project {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  status: "uploaded" | "critiqued" | "reviewed";
  sections: Section[];
  sanitize: SanitizeReport;
  meta: ProjectMeta;
  critique?: CritiqueReport;
  reviews?: ReviewerReport[];
  responses?: ResponseThread[];
  coverLetter?: CoverLetter;
  seminar?: Seminar;
  revision?: Revision;
  /** 文献对标:审稿依据的真实近期文献 */
  literature?: LiteratureGrounding;
}
