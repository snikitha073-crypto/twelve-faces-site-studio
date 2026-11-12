// Server-only owner authentication. Credentials live in environment secrets; nothing here ships to the browser.
import { useSession as startSession, getRequestIP } from "@tanstack/react-start/server";

export type OwnerSession = { role?: "owner"; email?: string; loginAt?: number };

export function ownerEmail(): string {
  return (process.env["ADMIN_EMAIL"] || "snikitha073@gmail.com").trim().toLowerCase();
}

export function ownerSessionConfig() {
  const password = process.env["ADMIN_SESSION_SECRET"];
  if (!password || password.length < 32) throw new Error("Owner session secret is not configured");
  return {
    password,
    name: "voxora_owner",
    maxAge: 60 * 60 * 8,
    cookie: { httpOnly: true, secure: true, sameSite: "none" as const, path: "/" },
  };
}

export async function getOwnerSession() {
  return startSession<OwnerSession>(ownerSessionConfig());
}

export async function isOwner(): Promise<boolean> {
  try {
    const session = await getOwnerSession();
    return session.data.role === "owner" && session.data.email === ownerEmail();
  } catch {
    return false;
  }
}

async function sha256(value: string): Promise<Uint8Array> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return new Uint8Array(buf);
}

/** Constant-time comparison of SHA-256 digests (no plaintext comparison, no length leak). */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([sha256(a), sha256(b)]);
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha[i]! ^ hb[i]!;
  return diff === 0;
}

export function clientIp(): string {
  try {
    return getRequestIP({ xForwardedFor: true }) || "unknown";
  } catch {
    return "unknown";
  }
}
