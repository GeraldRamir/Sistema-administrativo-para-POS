import Link from "next/link";
import type { PosStoreCustomersResult } from "@/lib/pos-store-customers";
import { Card, Muted } from "./form-primitives";

const money = (n: number) =>
  n.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const link = "text-primary text-xs font-medium underline-offset-2 hover:underline";

export function PosStoreCustomersCard({ result }: { result: PosStoreCustomersResult }) {
  if (!result.ok) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-foreground">Clientes en el POS (catálogo)</h3>
        <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">{result.message}</p>
        {result.detail ? (
          <pre className="mt-2 max-h-40 overflow-auto rounded border border-amber-500/30 bg-amber-50/50 p-2 text-xs text-muted-foreground dark:bg-amber-950/20">
            {result.detail}
          </pre>
        ) : null}
        <Muted>
          Defina <code className="font-mono text-xs">POS_API_BASE_URL</code> hacia el backend del POS. El listado usa{" "}
          <code className="font-mono text-xs">GET /organization/customers</code> (público, sin Bearer, todas las sucursales).
        </Muted>
      </Card>
    );
  }

  if (result.customers.length === 0) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-foreground">Clientes en el POS (catálogo)</h3>
        <p className="mt-2 text-sm text-muted-foreground">No hay clientes en el catálogo o la lista está vacía.</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Clientes en el POS (catálogo)</h3>
          <p className="text-xs text-muted-foreground">
            {result.customers.length} registro{result.customers.length === 1 ? "" : "s"} (todas las sucursales, GET público).
          </p>
        </div>
        <Link className={link} href="/comms">
          Ir a Comunicados
        </Link>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Sucursal (id)</th>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">ID / RNC</th>
              <th className="px-3 py-2">Correo</th>
              <th className="px-3 py-2 text-right">Saldo</th>
              <th className="px-3 py-2">Activo</th>
              <th className="px-3 py-2">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {result.customers.map((c) => (
              <tr key={c.id} className="bg-card">
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground" title={c.branchId || undefined}>
                  {c.branchId
                    ? c.branchId.length > 12
                      ? `${c.branchId.slice(0, 10)}…`
                      : c.branchId
                    : "—"}
                </td>
                <td className="px-3 py-2 font-medium text-foreground">{c.name}</td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{c.identification}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {c.email?.trim() ? c.email : "—"}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs">{money(c.balance)}</td>
                <td className="px-3 py-2 text-xs">{c.active ? "Sí" : "No"}</td>
                <td className="px-3 py-2">
                  {c.email?.trim() ? (
                    <Link
                      className="text-sm text-primary underline-offset-2 hover:underline"
                      href={`/comms?to=${encodeURIComponent(c.email.trim())}`}
                    >
                      Enviar comunicado
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
