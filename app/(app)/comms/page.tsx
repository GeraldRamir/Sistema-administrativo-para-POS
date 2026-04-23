import { getEmailLogs, getClientOptions } from "@/lib/queries";
import { Card, Muted, PageHeader } from "@/components/ops/form-primitives";
import { CommsMainForm, CommsTestForm } from "@/components/ops/comms-forms";

type Q = string | string[] | undefined;
function getTo(sp: { to?: Q }) {
  const t = sp.to;
  if (Array.isArray(t)) {
    return t[0];
  }
  return t;
}

export default async function CommsPage({ searchParams }: { searchParams: Promise<{ to?: Q }> }) {
  const sp = await searchParams;
  const defaultTo = getTo(sp);

  const [rows, options] = await Promise.all([getEmailLogs(), getClientOptions()]);
  const clients = options.map((c) => ({ id: c.id, companyName: c.companyName }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comunicados"
        description="Redacte y envíe mensajes por correo (SMTP) o, en desarrollo, use MAIL_LOG_ONLY para ver en consola. Cada envío o error queda en el registro a continuación. Puede abrir Comunicados con ?to= (destinatario) desde la lista de usuarios o clientes en Clientes (lectura de la base del producto)."
      />
      <div className="grid gap-6 lg:grid-cols-1">
        <Card>
          <CommsMainForm clients={clients} defaultTo={defaultTo} />
        </Card>
        <Card>
          <CommsTestForm />
        </Card>
      </div>
      <div>
        <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Log de salidas (recientes)</h3>
        {rows.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">Aún no hay entradas. Envíe un mensaje o una prueba arriba.</p>
        ) : (
          <div className="mt-2 max-h-96 overflow-auto rounded-xl border border-zinc-200 text-sm dark:border-zinc-800">
            <table className="w-full min-w-[32rem] text-left">
              <thead className="sticky top-0 bg-zinc-50 text-xs uppercase text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                <tr>
                  <th className="px-2 py-2">Cuándo</th>
                  <th className="px-2 py-2">A</th>
                  <th className="px-2 py-2">Asunto</th>
                  <th className="px-2 py-2">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {rows.map((e) => (
                  <tr key={e.id} className="bg-white dark:bg-zinc-900/20">
                    <td className="px-2 py-2 text-xs text-zinc-500">
                      {e.createdAt.toLocaleString("es-DO")}
                    </td>
                    <td className="px-2 py-2 text-xs break-all">{e.toEmail}</td>
                    <td className="px-2 py-2">{e.subject}</td>
                    <td className="px-2 py-2">
                      <span
                        className={
                          e.status === "SENT" || e.status === "LOG_ONLY"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {e.status}
                      </span>
                      {e.error ? <span className="block text-xs text-red-500">{e.error}</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-2">
          <Muted>
            Ajuste SMTP_*, MAIL_FROM y, si aplica, <code className="font-mono">MAIL_LOG_ONLY</code> en <code className="font-mono">.env</code>.
          </Muted>
        </div>
      </div>
    </div>
  );
}
