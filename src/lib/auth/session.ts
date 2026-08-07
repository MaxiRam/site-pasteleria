import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Sesión de admin vía cookie firmada (HMAC-SHA256), sin tabla de sessions
 * en DB — no hace falta para un solo admin (negocio familiar).
 *
 * Formato del token: `<payload_base64url>.<firma_base64url>`, donde
 * payload es el JSON `{ adminId, exp }` en base64url, y la firma es el
 * HMAC-SHA256 (en hex) de `payload_base64url`, codificado a su vez en
 * base64url.
 */

export const SESSION_COOKIE_NAME = "admin_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

// Fail-fast: sin SESSION_SECRET no arrancamos en un estado inseguro. Nada
// de fallback hardcodeado. (IIFE para que TS infiera `string`, no
// `string | undefined`, sin necesitar un `!` en cada uso más abajo.)
const SESSION_SECRET: string = (() => {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET no está configurado. Definilo en el entorno (ver .env.example) antes de arrancar la app.",
    );
  }
  return secret;
})();

type SessionPayload = {
  adminId: number;
  exp: number;
};

function sign(payloadB64: string): string {
  const hex = createHmac("sha256", SESSION_SECRET).update(payloadB64).digest("hex");
  return Buffer.from(hex).toString("base64url");
}

export function createSessionToken(adminId: number): string {
  const payload: SessionPayload = {
    adminId,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signatureB64 = sign(payloadB64);
  return `${payloadB64}.${signatureB64}`;
}

export function verifySessionToken(token: string): { adminId: number } | null {
  const separatorIndex = token.indexOf(".");
  if (separatorIndex === -1) {
    return null;
  }

  const payloadB64 = token.slice(0, separatorIndex);
  const signatureB64 = token.slice(separatorIndex + 1);
  if (!payloadB64 || !signatureB64) {
    return null;
  }

  const expectedSignatureB64 = sign(payloadB64);

  const provided = Buffer.from(signatureB64);
  const expected = Buffer.from(expectedSignatureB64);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  let payload: SessionPayload;
  try {
    const json = Buffer.from(payloadB64, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as Partial<SessionPayload>;
    if (typeof parsed.adminId !== "number" || typeof parsed.exp !== "number") {
      return null;
    }
    payload = { adminId: parsed.adminId, exp: parsed.exp };
  } catch {
    return null;
  }

  if (Date.now() > payload.exp) {
    return null;
  }

  return { adminId: payload.adminId };
}

/** Flags de cookie compartidos entre el set en login y el delete en logout. */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
