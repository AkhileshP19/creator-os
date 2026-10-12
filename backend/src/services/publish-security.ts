import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { z } from "zod";

export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Configure ${name} before connecting YouTube`);
  return value;
}
function encryptionKey() {
  const key = Buffer.from(
    requiredEnv("INTEGRATION_TOKEN_ENCRYPTION_KEY"),
    "base64",
  );
  if (key.length !== 32)
    throw new Error(
      "Integration encryption key must contain 32 bytes in base64",
    );
  return key;
}
export function encryptToken(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}
export function decryptToken(value: string): string {
  const [version, iv, tag, ciphertext, extra] = value.split(".");
  if (version !== "v1" || !iv || !tag || !ciphertext || extra)
    throw new Error("Reconnect YouTube to restore secure credentials");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
function sign(value: string) {
  const secret = requiredEnv("OAUTH_STATE_SECRET");
  if (Buffer.byteLength(secret) < 32)
    throw new Error("OAuth state secret must contain at least 32 bytes");
  return createHmac("sha256", secret).update(value).digest("base64url");
}
const stateSchema = z.object({
  userId: z.string().min(1),
  nonce: z.string().min(32),
  issuedAt: z.number(),
  expiresAt: z.number(),
});
export function createOAuthState(userId: string) {
  const nonce = randomBytes(32).toString("base64url");
  const payload = {
    userId,
    nonce,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 600_000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return { state: `${encoded}.${sign(encoded)}`, nonce };
}
export function verifyOAuthState(state: string) {
  const [encoded, signature, extra] = state.split(".");
  if (!encoded || !signature || extra) throw new Error("Invalid OAuth state");
  const expected = Buffer.from(sign(encoded));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    throw new Error("Invalid OAuth state");
  const payload = stateSchema.parse(
    JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as unknown,
  );
  if (
    payload.expiresAt <= Date.now() ||
    payload.issuedAt > Date.now() ||
    payload.expiresAt - payload.issuedAt > 600_000
  )
    throw new Error("Expired OAuth state");
  return payload;
}
export function pkceVerifier(nonce: string) {
  return sign(`pkce:${nonce}`);
}

export function metadataObject(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
export function safePublishError(error: unknown): string {
  const root = metadataObject(error);
  const response = metadataObject(root.response);
  const data = metadataObject(response.data);
  const apiError = metadataObject(data.error);
  const reasons = Array.isArray(apiError.errors)
    ? apiError.errors.map((e) => metadataObject(e).reason)
    : [];
  if (reasons.includes("quotaExceeded"))
    return "YouTube quota exceeded. Retry after your quota resets.";
  if (reasons.includes("uploadLimitExceeded"))
    return "YouTube upload limit reached. Try again later.";
  if (response.status === 401 || data.error === "invalid_grant")
    return "YouTube authorization expired or was revoked. Reconnect the same channel in Settings.";
  if (
    root.name === "NoSuchKey" ||
    metadataObject(root.$metadata).httpStatusCode === 404
  )
    return "The video file is missing from storage.";
  if (typeof root.statusCode === "number" && error instanceof Error)
    return error.message;
  return "Publishing failed. Check your YouTube connection and video storage, then retry.";
}
