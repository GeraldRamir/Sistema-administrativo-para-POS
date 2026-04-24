import Link from "next/link";
import { getDashboardStats } from "@/lib/queries";
import { clientStatusLabel } from "@/lib/labels";
import { Card, Muted, PageHeader } from "@/components/ops/form-primitives";
import type { ClientStatus } from "@prisma/client";

const link = "text-primary underline-offset-2 hover:underline";

export default async function DashboardPage() {
  const s = await getDashboardStats();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Resumen"
        description={
          <>
            Indicadores de la consola interna. El menú lateral da acceso a clientes, documentos, ingresos, Comunicados y
            actividad; la guía del API está en{" "}
            <Link className={link} href="/docs">
              API
            </Link>
            .
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Clientes</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{s.totalClients}</p>
          <Muted>Registros comerciales en pos-ops</Muted>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ingresos (30 días)</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{s.revenue30d}</p>
          <Muted>Filas en el módulo de ingresos</Muted>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Comunicados (30 días)</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{s.email30d}</p>
          <Muted>Registros de envío en el log</Muted>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Atajos</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            <li>
              <Link className={link} href="/clients">
                Usuarios (POS)
              </Link>
            </li>
            <li>
              <Link className={link} href="/documents">
                Documentos
              </Link>
            </li>
            <li>
              <Link className={link} href="/comms">
                Comunicados
              </Link>
            </li>
            <li>
              <Link className={link} href="/contratos">
                Contratos
              </Link>
            </li>
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-sm font-medium text-foreground">Clientes por estado</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {(Object.keys(clientStatusLabel) as ClientStatus[]).map((k) => {
              const n = s.statusMap[k] ?? 0;
              return (
                <li key={k} className="flex justify-between border-b border-border py-1 last:border-0">
                  <span>{clientStatusLabel[k]}</span>
                  <span className="font-mono tabular-nums text-foreground">{n}</span>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-foreground">Actividad reciente</h3>
          {s.recentActivity.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Sin eventos aún. Las acciones desde la consola o el API se listan aquí.</p>
          ) : (
            <ul className="mt-3 max-h-72 space-y-2 overflow-auto text-sm">
              {s.recentActivity.map((a) => (
                <li key={a.id} className="rounded-lg border border-border bg-background/50 p-2.5">
                  <p className="font-medium text-foreground">{a.action}</p>
                  <p className="text-xs text-muted-foreground">
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
