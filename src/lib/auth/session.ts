import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "aiip_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30日

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET が設定されていません");
  }
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

/** ログイン成功時に発行するCookie値 "payload.signature" を生成 */
export function createSessionToken(): string {
  const payload = `authenticated.${Date.now()}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

/** Cookie値を検証する。改ざん・期限切れならfalse */
export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return false;
  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);
  const expected = sign(payload);

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  if (!timingSafeEqual(sigBuf, expBuf)) return false;

  const parts = payload.split(".");
  const issuedAt = Number(parts[1]);
  if (!issuedAt || Number.isNaN(issuedAt)) return false;
  const ageSeconds = (Date.now() - issuedAt) / 1000;
  if (ageSeconds > MAX_AGE_SECONDS) return false;

  return true;
}

export { COOKIE_NAME, MAX_AGE_SECONDS };
