import { describe, expect, it } from "vitest";
import { sectionize } from "./parse";

const run = (body: string) => sectionize(body);

describe("sectionize", () => {
  it("按 IMRaD 标题切分章节", () => {
    const r = run("My Paper\n\nAbstract\nShort summary.\n\n1. Introduction\nWe study X.\n\n2. Methods\nWe do Y.");
    expect(r.sections.map((s) => s.heading)).toEqual(["Abstract", "Introduction", "Methods"]);
    expect(r.title).toBe("My Paper");
  });

  it("支持 IEEE 编号标题与罗马数字", () => {
    const r = run("T\n\nI. INTRODUCTION\nbody one\n\nII. RESULTS\nbody two");
    expect(r.sections.map((s) => s.heading)).toEqual(["Introduction", "Results"]);
  });

  it("修复 PDF 断词(conges-\\ntion)", () => {
    const r = run("T\n\n1. Introduction\nUrban conges-\ntion is costly.");
    expect(r.sections[0].text).toContain("congestion");
  });

  it("行内式 Abstract—body 正确切出", () => {
    const r = run("T\n\nAbstract—This paper studies a problem with enough body text after the dash to count.");
    expect(r.sections).toHaveLength(1);
    expect(r.sections[0].heading).toBe("Abstract");
    expect(r.sections[0].text).toContain("This paper studies");
  });

  it("标题页(作者/单位)整体排除且 authorBlockRemoved 为真", () => {
    const r = run("My Paper\n\nAlice Smith\nSome University\n\n1. Introduction\nbody here");
    expect(r.title).toBe("My Paper");
    expect(r.authorBlockRemoved).toBe(true);
    expect(r.sections.map((s) => s.heading)).toEqual(["Introduction"]);
    expect(JSON.stringify(r.sections)).not.toContain("Alice Smith");
  });

  it("单行标题页不算作者块", () => {
    const r = run("My Paper\n\n1. Introduction\nbody");
    expect(r.authorBlockRemoved).toBe(false);
  });

  it("同名章节自动合并(拆页重复标题)", () => {
    const r = run("T\n\n1. Introduction\nfirst part\n\n1. Introduction\nsecond part");
    expect(r.sections).toHaveLength(1);
    expect(r.sections[0].text).toContain("first part");
    expect(r.sections[0].text).toContain("second part");
  });

  it("References / Appendix / Acknowledgments 也按标题切出", () => {
    const r = run("T\n\n1. Introduction\nbody\n\nReferences\n[1] Someone.\n\nAppendix\nextra");
    expect(r.sections.map((s) => s.heading)).toEqual(["Introduction", "References", "Appendix"]);
  });

  it("无任何标题时整文作为 Manuscript 单节", () => {
    const r = run("Just some text without headings.\nAnother line.");
    expect(r.sections).toHaveLength(1);
    expect(r.sections[0].heading).toBe("Manuscript");
    expect(r.authorBlockRemoved).toBe(false);
  });

  it("正文行即使包含 Abstract 字样也不误切(超长行不走标题规则)", () => {
    const long = `T\n\n1. Introduction\n${"In this section the word abstract appears mid-sentence and the line keeps going well past the heading length limit. ".repeat(2)}`;
    const r = run(long);
    expect(r.sections.map((s) => s.heading)).toEqual(["Introduction"]);
  });
});
