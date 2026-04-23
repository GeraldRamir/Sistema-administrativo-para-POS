import "server-only";

/** URL pública de la app POS (front) para enlaces en correos transaccionales. */
export function getPosAppPublicUrl(): string {
  const raw = process.env.POS_APP_PUBLIC_URL?.trim() || process.env.NEXT_PUBLIC_POS_APP_URL?.trim() || "";
  if (raw) {
    return raw.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}
