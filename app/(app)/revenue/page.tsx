import Link from "next/link";
import { getRevenueList, getClientOptions } from "@/lib/queries";
import { Card, PageHeader } from "@/components/ops/form-primitives";
import { RevenueForm } from "@/components/ops/revenue-form";

export default async function RevenuePage() {
  const [rows, options] = await Promise.all([getRevenueList(), getClientOptions()]);
  const clients = options.map((c) => ({ id: c.id, companyName: c.companyName }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ingresos internos"
        description="Montos y fechas a efectos operativos. No reemplaza facturación fiscal ni e‑CF; se usa para previsiones o seguimiento con el sector comercial."
      />
      <Card>
        {clients.length === 0 ? (
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Cree un <Link className="underline" href="/clients/new">cliente</Link> antes de registrar movimientos.
          </p>
        ) : (
          <RevenueForm clients={clients} heading="Registrar un ingreso" />
        )}
      </Card>

      <div>
        <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Historial (últimos 200 movimientos)</h3>
        {rows.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">Sin filas. Añada ingresos con el formulario o desde la ficha de cada cliente.</p>
        ) : (
          <div className="mt-2 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                <tr>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Monto</th>
                  <th className="px-3 py-2">Nota</th>
                  <th className="px-3 py-2">Cliente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {rows.map((r) => (
                  <tr key={r.id} className="bg-white dark:bg-zinc-900/20">
                    <td className="px-3 py-2 text-zinc-500">{r.occurredOn.toLocaleDateString("es-DO")}</td>
                    <td className="px-3 py-2 font-mono">
                      {r.amount.toString()} {r.currency}
                    </td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">{r.label ?? "—"}</td>
                    <td className="px-3 py-2">
                      <Link className="text-violet-600 hover:underline dark:text-violet-400" href={`/clients/${r.clientId}`}>
                        {r.client.companyName}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
