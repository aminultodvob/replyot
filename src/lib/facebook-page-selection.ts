import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

type PendingFacebookPage = {
  id: string;
  name: string;
  accessToken: string;
};

type PendingSelection = {
  userId: string;
  pageId: string;
  pageName: string;
  accessToken: string;
  expiresAt: number;
};

const TTL_MS = 10 * 60 * 1000;
const ALGORITHM = "aes-256-gcm";

const getEncryptionKey = () => {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is required for Facebook page selection");
  }

  return createHash("sha256").update(secret).digest();
};

const encodePayload = (payload: PendingSelection) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);

  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString("base64url");
};

export const decodePendingFacebookSelection = (
  token: string
): PendingSelection | null => {
  try {
    const raw = Buffer.from(token, "base64url");
    const iv = raw.subarray(0, 12);
    const authTag = raw.subarray(12, 28);
    const encrypted = raw.subarray(28);

    const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString("utf8");

    const parsed = JSON.parse(decrypted) as PendingSelection;

    if (
      !parsed ||
      typeof parsed.userId !== "string" ||
      typeof parsed.pageId !== "string" ||
      typeof parsed.pageName !== "string" ||
      typeof parsed.accessToken !== "string" ||
      typeof parsed.expiresAt !== "number"
    ) {
      return null;
    }

    if (parsed.expiresAt <= Date.now()) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export const createPendingFacebookSelection = (
  userId: string,
  page: PendingFacebookPage
) => {
  return encodePayload({
    userId,
    pageId: page.id,
    pageName: page.name,
    accessToken: page.accessToken,
    expiresAt: Date.now() + TTL_MS,
  });
};
