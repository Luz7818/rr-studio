import { describe, expect, it } from "vitest";
import { sanitizeText, SANITIZE_LABELS } from "./sanitize";

describe("sanitizeText", () => {
  it("打码邮箱并计数", () => {
    const { text, report } = sanitizeText("Contact alice@example.edu for data.");
    expect(text).toContain("[EMAIL]");
    expect(text).not.toContain("alice@example.edu");
    expect(report.details.EMAIL).toBe(1);
    expect(report.redactions).toBe(1);
  });

  it("打码 URL 与长数字串", () => {
    const { text, report } = sanitizeText("Code at https://github.com/example/rl and access no. 123456789.");
    expect(text).toContain("[URL]");
    expect(text).toContain("[NUM]");
    expect(report.details.URL).toBe(1);
    expect(report.details.LONG_NUM).toBe(1);
  });

  it("打码英文基金号与资助描述", () => {
    const { text, report } = sanitizeText("This work was supported by the National Fund (Grant No. 12345).");
    // FUNDING 会把含 GRANT 占位符的整个资助短语一并吞掉,隐私结果等价:编号与描述都不残留
    expect(text).not.toContain("Grant");
    expect(text).not.toContain("12345");
    expect(text).toContain("REDACTED");
    expect(report.details.GRANT).toBeGreaterThanOrEqual(1);
    expect(report.details.FUNDING).toBe(1);
  });

  it("打码中文基金信息", () => {
    const { text, report } = sanitizeText("本研究受国家自然科学基金(12345678)资助。");
    expect(text).toContain("[基金信息已删除]");
    expect(report.details.FUNDING_CN).toBe(1);
  });

  it("独立单位行与通讯作者行被移除", () => {
    const { text, report } = sanitizeText(
      "Some University\nDepartment of Computer Science\nCorresponding author: Bob\nBody text stays.",
    );
    expect(text).toContain("[AFFILIATION REMOVED]");
    expect(text).toContain("[CONTACT REMOVED]");
    expect(text).toContain("Body text stays.");
    expect(report.details.AFFILIATION).toBe(2);
    expect(report.details.CONTACT).toBe(1);
  });

  it("干净学术文本零打码", () => {
    const { text, report } = sanitizeText("We propose a method. Results improve by 12.4 percent over baselines.");
    expect(report.redactions).toBe(0);
    expect(text).toBe("We propose a method. Results improve by 12.4 percent over baselines.");
  });

  it("所有打码类型都有中文标签", () => {
    for (const key of ["EMAIL", "ORCID", "URL", "GRANT", "FUNDING", "FUNDING_CN", "TEL", "LONG_NUM", "AFFILIATION", "CONTACT"]) {
      expect(SANITIZE_LABELS[key]).toBeTruthy();
    }
  });
});
