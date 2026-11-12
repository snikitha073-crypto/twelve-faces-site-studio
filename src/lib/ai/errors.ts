// Map AI gateway failures to safe, user-facing messages.
export function aiErrorMessage(error: unknown): { status: number; message: string } {
  const e = error as { statusCode?: number; status?: number; message?: string; lastError?: { statusCode?: number } };
  const status = e?.statusCode ?? e?.status ?? e?.lastError?.statusCode ?? 500;
  if (status === 429) return { status, message: "The AI arena is busy right now. Wait a few seconds and send your argument again." };
  if (status === 402) return { status, message: "AI credits for Voxora have run out. The owner needs to add credits before debates can continue." };
  if (status === 403) return { status, message: "AI access is currently blocked for this app. The owner needs to check the AI settings." };
  return { status: status >= 400 && status < 600 ? status : 500, message: "Couldn't connect to your AI opponent. Please try sending your argument again." };
}
