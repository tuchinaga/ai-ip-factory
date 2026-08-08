// Edge Runtime(middlewareの実行環境)はNode.jsの'crypto'モジュールに非対応のため、
// Web標準のSubtleCrypto API(crypto.subtle)でHMAC署名を行う。
// これはmiddleware(Edge)・APIルート(Node.js)の両方で動作する。

const COOKIE_NAME = "aiip_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30日

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET が設定されていません");
  }
  return secret;
}

async function getHmacKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(value: string): Promise<string> {
  const key = await getHmacKey();
  const enc = new TextEncoder();
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  return toHex(sig);
}

/** ログイン成功時に発行するCookie値 "payload.signature" を生成 */
export async function createSessionToken(): Promise<string> {
  const payload = `authenticated.${Date.now()}`;
  const signature = await sign(payload);
  return `${payload}.${signature}`;
}

/** Cookie値を検証する。改ざん・期限切れならfalse */
export async function verifySessionToken(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return false;
  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);
  const expected = await sign(payload);

  if (signature.length !== expected.length) return false;
  // timing-safeな比較(文字コードのXORを積算し、途中でreturnしない)
  let diff = 0;
  for (let i = 0; i < signature.length; i++) {
    diff |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (diff !== 0) return false;

  const parts = payload.split(".");
  const issuedAt = Number(parts[1]);
  if (!issuedAt || Number.isNaN(issuedAt)) return false;
  const ageSeconds = (Date.now() - issuedAt) / 1000;
  if (ageSeconds > MAX_AGE_SECONDS) return false;

  return true;
}

export { COOKIE_NAME, MAX_AGE_SECONDS };
