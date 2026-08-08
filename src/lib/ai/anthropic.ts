// Anthropic Claude APIへの直接fetch呼び出し。
// AIProviderを差し替えれば OpenAI/Gemini 等にも切り替え可能。

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

export async function callClaude(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY が設定されていません");
  }

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${text}`);
  }

  const data = await res.json();
  const textBlock = data.content?.find((c: { type: string }) => c.type === "text");
  if (!textBlock) {
    throw new Error("Anthropic APIからテキスト応答が得られませんでした");
  }
  return textBlock.text as string;
}

/** Claudeの応答からJSON部分を安全に抽出してパースする */
export function parseJsonFromModelOutput<T>(raw: string): T {
  let cleaned = raw.trim();
  // コードブロック記法で囲まれていた場合に備えて除去
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");
  return JSON.parse(cleaned) as T;
}
