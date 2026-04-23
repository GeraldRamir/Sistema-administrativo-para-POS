import "server-only";
import { posApiFetch } from "@/lib/pos-api";

/**
 * Genera el token en el API del POS (requiere POS_API_BASE_URL y POS_SERVICE_KEY en pos-ops).
 */
export async function issuePasswordSetupToken(email: string): Promise<{ token: string }> {
  const res = await posApiFetch("auth/integration/password-setup-token", {
    method: "POST",
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
  const raw = (await res.json().catch(() => ({}))) as { message?: string | string[]; token?: string };
  if (!res.ok) {
    const m = Array.isArray(raw.message) ? raw.message.join(" ") : raw.message;
    throw new Error(m || `Error ${res.status}`);
  }
  if (!raw.token || typeof raw.token !== "string") {
    throw new Error("Respuesta del API sin token de activación.");
  }
  return { token: raw.token };
}
