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

const link = "text-primary underline-offset-2 hover:underline";

export default function ApiDocsPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">API REST (v1)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Las rutas viven en esta misma aplicación Next.js bajo{" "}
          <code className="rounded bg-muted px-1.5 font-mono text-xs text-foreground">/api/v1</code>. En producción use la
          URL pública de pos-ops, p. ej. <span className="font-mono text-xs">https://ops.su-dominio.com/api/v1/...</span>
        </p>
      </div>
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-medium text-foreground">Autenticación</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Si define <code className="rounded bg-muted px-1.5 font-mono text-xs">OPS_API_KEY</code> en{" "}
          <code className="font-mono text-xs">.env</code>, toda ruta bajo <code className="font-mono text-xs">/api/*</code>{" "}
          excepto <code className="font-mono text-xs">GET /api/health</code> y{" "}
          <code className="font-mono text-xs">GET /api/v1/health</code> exigirá{" "}
          <code className="font-mono text-xs">Authorization: Bearer &lt;OPS_API_KEY&gt;</code> o el header{" "}
          <code className="font-mono text-xs">X-API-Key: &lt;OPS_API_KEY&gt;</code>. Sin clave (solo en desarrollo) las
          rutas aceptan peticiones sin autenticación; en producción conviene fijar la clave.
        </p>
      </section>
      <section className="space-y-2">
        <h3 className="text-sm font-medium text-foreground">Rutas</h3>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="bg-muted/60 text-foreground/90">
              <tr>
                <th className="px-3 py-2 font-medium">Método</th>
                <th className="px-3 py-2 font-medium">Ruta</th>
                <th className="px-3 py-2 font-medium">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {routes.map((r) => (
                <tr key={`${r.method} ${r.path}`} className="bg-card">
                  <td className="px-3 py-2 font-mono text-xs text-primary">{r.method}</td>
                  <td className="px-3 py-2 font-mono text-xs text-foreground">{r.path}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="text-sm text-muted-foreground">
        <Link href="/dashboard" className={link}>
          Volver al inicio
        </Link>
      </p>
    </div>
  );
}
