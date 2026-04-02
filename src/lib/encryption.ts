import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    // Fallback: no encryption in dev if key not set
    return Buffer.alloc(32, 0);
  }
  // Key should be 64 hex chars (32 bytes)
  return Buffer.from(key, "hex");
}

/**
 * Encrypt a string using AES-256-GCM.
 * Returns base64 string: iv:encrypted:authTag
 */
export function encrypt(text: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${encrypted}:${authTag.toString("base64")}`;
}

/**
 * Decrypt an AES-256-GCM encrypted string.
 */
export function decrypt(encryptedText: string): string {
  const key = getKey();
  const [ivBase64, encrypted, authTagBase64] = encryptedText.split(":");

  if (!ivBase64 || !encrypted || !authTagBase64) {
    // Not encrypted — return as-is (backward compatibility)
    return encryptedText;
  }

  try {
    const iv = Buffer.from(ivBase64, "base64");
    const authTag = Buffer.from(authTagBase64, "base64");
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    // If decryption fails, return raw (might be unencrypted legacy token)
    return encryptedText;
  }
}
