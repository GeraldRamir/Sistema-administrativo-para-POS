import Link from "next/link";
import { getDashboardStats } from "@/lib/queries";
import { clientStatusLabel } from "@/lib/labels";
import { Card, Muted } from "@/components/ops/form-primitives";
import type { ClientStatus } from "@prisma/client";

export default async function DashboardPage() {
  const s = await getDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Resumen</h2>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Indicadores de la consola interna. Use el menú lateral para clientes, documentos, ingresos, Comunicados y actividad;
          la guía del API está en <Link className="text-violet-600 underline dark:text-violet-400" href="/docs">API</Link>
          .
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Clientes</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{s.totalClients}</p>
          <Muted>Registros comerciales en pos-ops</Muted>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Ingresos (30 días)</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{s.revenue30d}</p>
          <Muted>Filas en el módulo de ingresos</Muted>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Comunicados (30 días)</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{s.email30d}</p>
          <Muted>Registros de envío en el log</Muted>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Atajos</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            <li>
              <Link className="text-violet-600 hover:underline dark:text-violet-400" href="/clients">
                Usuarios (POS)
              </Link>
            </li>
            <li>
              <Link className="text-violet-600 hover:underline dark:text-violet-400" href="/documents">
                Documentos
              </Link>
            </li>
            <li>
              <Link className="text-violet-600 hover:underline dark:text-violet-400" href="/comms">
                Comunicados
              </Link>
            </li>
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Clientes por estado</h3>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
            {(Object.keys(clientStatusLabel) as ClientStatus[]).map((k) => {
              const n = s.statusMap[k] ?? 0;
              return (
                <li key={k} className="flex justify-between border-b border-zinc-100 py-1 last:border-0 dark:border-zinc-800">
                  <span>{clientStatusLabel[k]}</span>
                  <span className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100">{n}</span>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Actividad reciente</h3>
          {s.recentActivity.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">Sin eventos aún. Las acciones desde la consola o el API se listan aquí.</p>
          ) : (
            <ul className="mt-3 max-h-72 space-y-2 overflow-auto text-sm">
              {s.recentActivity.map((a) => (
                <li key={a.id} className="rounded border border-zinc-100 p-2 dark:border-zinc-800">
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">{a.action}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(a.createdAt).toLocaleString("es-DO")}{" "}
                    {a.client?.companyName ? `· ${a.client.companyName}` : null}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
