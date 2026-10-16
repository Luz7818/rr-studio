import { jsonrepair } from "jsonrepair";

const BASE_URL = (process.env.LLM_BASE_URL ?? "https://open.bigmodel.cn/api/paas/v4").replace(/\/+$/, "");
const API_KEY = process.env.LLM_API_KEY ?? "";
const MODEL = process.env.LLM_MODEL ?? "glm-4.6";

/**
 * 供应商特定的额外请求体。值为 null 的键表示从默认请求体中删除该字段,
 * 例如 {"response_format": null, "enable_thinking": false} 表示不发送
 * response_format 且关闭思考模式(东南大学 aicloud 等 qwen 部署需要)。
 */
const EXTRA_BODY: Record<string, unknown> = (() => {
  try {
    return process.env.LLM_EXTRA_BODY ? (JSON.parse(process.env.LLM_EXTRA_BODY) as Record<string, unknown>) : {};
  } catch {
    return {};
  }
})();

const REQUEST_TIMEOUT_MS = 180_000;
/** 瞬时网络错误(代理抖动/连接重置)自动重试 */
const NETWORK_RETRIES = 2;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const isLlmConfigured = () => API_KEY.length > 0;

export class LlmNotConfiguredError extends Error {
  constructor() {
    super("LLM_API_KEY 未配置,当前为演示模式");
  }
}

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function chat(messages: LlmMessage[], opts?: { json?: boolean }): Promise<string> {
  if (!isLlmConfigured()) throw new LlmNotConfiguredError();
  const body: Record<string, unknown> = { model: MODEL, messages, temperature: 0.3, stream: false };
  if (opts?.json) body.response_format = { type: "json_object" };
  for (const [k, v] of Object.entries(EXTRA_BODY)) {
    if (v === null) delete body[k];
    else body[k] = v;
  }

  let res: Response;
  for (let attempt = 0; ; attempt++) {
    try {
      res = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      break;
    } catch (e) {
      // 仅重试网络层错误;达到上限或非网络错误则抛出
      if (attempt >= NETWORK_RETRIES - 1) throw e;
      await sleep(1500 * (attempt + 1));
    }
  }

  if (!res.ok && opts?.json && res.status === 400) {
    // 部分供应商不支持 response_format,降级重试
    return chat(messages, { json: false });
  }
  if (!res.ok) {
    throw new Error(`LLM 请求失败 ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }

  const ct = res.headers.get("content-type") ?? "";
  const raw = await res.text();
  if (!ct.includes("application/json")) {
    // 网关/WAF 拦截页(如校园网外访问高校端点)会返回 HTML
    throw new Error(
      `LLM 端点返回非 JSON 响应(content-type: ${ct || "未知"})。若为高校内网端点,请确认已连接校园网/VPN。原文片段: ${raw.slice(0, 120)}`,
    );
  }
  const data = JSON.parse(raw) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content ?? "";
  if (!content) throw new Error("LLM 返回内容为空");
  return content;
}

export function extractJson<T>(raw: string): T {
  const cleaned = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error(`LLM 返回内容无法解析为 JSON: ${raw.slice(0, 200)}`);
  }
  const slice = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(slice) as T;
  } catch {
    // 模型偶发 JSON 语法错误(引号未转义/尾逗号等),自动修复后重试
    return JSON.parse(jsonrepair(slice)) as T;
  }
}

/** 要求模型输出 JSON 对象并解析;解析失败自动重试一次,不支持 response_format 的供应商自动降级 */
export async function chatJSON<T>(system: string, user: string): Promise<T> {
  const messages: LlmMessage[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await chat(messages, { json: true });
    try {
      return extractJson<T>(raw);
    } catch (e) {
      lastError = e;
    }
  }
  throw new Error(
    `${lastError instanceof Error ? lastError.message : "JSON 解析失败"}(已重试,模型仍未返回合法 JSON)`,
  );
}

export async function chatText(system: string, user: string): Promise<string> {
  return chat([
    { role: "system", content: system },
    { role: "user", content: user },
  ]);
}
