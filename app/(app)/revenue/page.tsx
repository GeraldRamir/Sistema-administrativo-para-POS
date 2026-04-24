import Link from "next/link";
import { getRevenueList, getClientOptions } from "@/lib/queries";
import { Card, PageHeader } from "@/components/ops/form-primitives";
import { RevenueForm } from "@/components/ops/revenue-form";

const link = "text-primary underline-offset-2 hover:underline";

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
            Cree un{" "}
            <Link className={link} href="/clients/new">
              cliente
            </Link>{" "}
            antes de registrar movimientos.
          </p>
        ) : (
          <RevenueForm clients={clients} heading="Registrar un ingreso" />
        )}
      </Card>

      <div>
        <h3 className="text-sm font-medium text-foreground">Historial (últimos 200 movimientos)</h3>
        {rows.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Sin filas. Añada ingresos con el formulario o desde la ficha de cada cliente.</p>
        ) : (
          <div className="mt-2 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Monto</th>
                  <th className="px-3 py-2">Nota</th>
                  <th className="px-3 py-2">Cliente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.id} className="bg-card">
                    <td className="px-3 py-2 text-muted-foreground">{r.occurredOn.toLocaleDateString("es-DO")}</td>
                    <td className="px-3 py-2 font-mono">
                      {r.amount.toString()} {r.currency}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{r.label ?? "—"}</td>
                    <td className="px-3 py-2">
                      <Link className={link} href={`/clients/${r.clientId}`}>
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
