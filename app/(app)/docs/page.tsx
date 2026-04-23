import Link from "next/link";

const routes = [
  { method: "GET", path: "/api/health", note: "Sin base de datos. Público." },
  { method: "GET", path: "/api/v1/health", note: "Incluye consulta a la base (SELECT 1). Público." },
  { method: "GET", path: "/api/v1/clients", note: "Query: q, status, limit, offset" },
  { method: "POST", path: "/api/v1/clients", note: "Cuerpo: cliente (ver validadores en código)" },
  { method: "GET", path: "/api/v1/clients/{id}", note: "Detalle con documentos, ingresos, envíos (comunicados), actividad" },
  { method: "PATCH", path: "/api/v1/clients/{id}", note: "Actualización parcial" },
  { method: "DELETE", path: "/api/v1/clients/{id}", note: "Borrar cliente" },
  { method: "GET", path: "/api/v1/clients/{id}/documents", note: "Listar documentos" },
  { method: "POST", path: "/api/v1/clients/{id}/documents", note: "Crear documento" },
  { method: "GET", path: "/api/v1/clients/{id}/revenue", note: "Listar ingresos" },
  { method: "POST", path: "/api/v1/clients/{id}/revenue", note: "Registrar ingreso" },
  { method: "GET", path: "/api/v1/activity", note: "Query: clientId, limit, offset" },
  { method: "POST", path: "/api/v1/activity", note: "Registrar evento" },
  { method: "GET", path: "/api/v1/emails", note: "Historial; query: clientId, limit, offset" },
  { method: "POST", path: "/api/v1/emails/send", note: "Enviar mensaje (Comunicados; SMTP o MAIL_LOG_ONLY)" },
  { method: "POST", path: "/api/v1/emails/test", note: "Prueba de entrega" },
  { method: "GET", path: "/api/v1/pos/ping", note: "Health del API del POS (POS_API_BASE_URL)" },
] as const;

export default function ApiDocsPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">API REST (v1)</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Las rutas viven en esta misma aplicación Next.js bajo{" "}
          <code className="rounded bg-zinc-100 px-1 font-mono text-xs dark:bg-zinc-800">/api/v1</code>. En producción use la
          URL pública de pos-ops, p. ej. <span className="font-mono text-xs">https://ops.su-dominio.com/api/v1/...</span>
        </p>
      </div>
      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Autenticación</h3>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Si define <code className="rounded bg-zinc-100 px-1 font-mono text-xs dark:bg-zinc-800">OPS_API_KEY</code> en{" "}
          <code className="font-mono text-xs">.env</code>, toda ruta bajo <code className="font-mono text-xs">/api/*</code>{" "}
          excepto <code className="font-mono text-xs">GET /api/health</code> y{" "}
          <code className="font-mono text-xs">GET /api/v1/health</code> exigirá{" "}
          <code className="font-mono text-xs">Authorization: Bearer &lt;OPS_API_KEY&gt;</code> o el header{" "}
          <code className="font-mono text-xs">X-API-Key: &lt;OPS_API_KEY&gt;</code>. Sin clave (solo en desarrollo) las
          rutas aceptan peticiones sin autenticación; en producción conviene fijar la clave.
        </p>
      </section>
      <section className="space-y-2">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Rutas</h3>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              <tr>
                <th className="px-3 py-2 font-medium">Método</th>
                <th className="px-3 py-2 font-medium">Ruta</th>
                <th className="px-3 py-2 font-medium">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {routes.map((r) => (
                <tr key={`${r.method} ${r.path}`} className="bg-white dark:bg-zinc-900/30">
                  <td className="px-3 py-2 font-mono text-xs text-violet-700 dark:text-violet-400">{r.method}</td>
                  <td className="px-3 py-2 font-mono text-xs text-zinc-900 dark:text-zinc-200">{r.path}</td>
                  <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="text-sm text-zinc-500">
        <Link href="/dashboard" className="text-violet-600 underline dark:text-violet-400">
          Volver al inicio
        </Link>
      </p>
    </div>
  );
}
