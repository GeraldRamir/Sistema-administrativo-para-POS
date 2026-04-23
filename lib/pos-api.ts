/**
 * Cliente hacia el API del POS (pos-backend-project).
 * Uso: rutas de servidor o Server Actions; no exponer claves al navegador.
 */
const getBase = (): string | null => {
  const u = process.env.POS_API_BASE_URL?.trim();
  return u && u.length > 0 ? u.replace(/\/$/, "") : null;
};

export const getPosApiBaseUrl = getBase;

export const posApiConfigured = (): boolean => getBase() !== null;

/**
 * Llamada al API del POS. Auth: `serviceKey` o `POS_SERVICE_KEY`; opcional `bearerToken` o `omitAuth: true` para rutas públicas.
 */
export async function posApiFetch(
  path: string,
  init: RequestInit = {},
  options?: { serviceKey?: string; bearerToken?: string; omitAuth?: boolean },
): Promise<Response> {
  const base = getBase();
  if (!base) {
    throw new Error("POS_API_BASE_URL no está configurado");
  }
  const url = path.startsWith("http") ? path : `${base}/${path.replace(/^\//, "")}`;
  const key = options?.serviceKey ?? process.env.POS_SERVICE_KEY?.trim() ?? "";
  const userJwt = options?.bearerToken?.trim() ?? "";
  const headers = new Headers(init.headers);
  if (init.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!options?.omitAuth) {
    if (userJwt) {
      headers.set("Authorization", `Bearer ${userJwt}`);
    } else if (key) {
      headers.set("Authorization", `Bearer ${key}`);
    }
  }
  return fetch(url, { ...init, headers, cache: "no-store" });
}
