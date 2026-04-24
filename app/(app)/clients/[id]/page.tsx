import Link from "next/link";
import { notFound } from "next/navigation";
import { getClientById, getClientOptions } from "@/lib/queries";
import { documentKindLabel, clientStatusLabel } from "@/lib/labels";
import { appShellLink, Card, Muted, PageHeader } from "@/components/ops/form-primitives";
import { ClientEditForm } from "@/components/ops/client-edit-form";
import { DocumentForm } from "@/components/ops/document-form";
import { DeleteClientForm } from "@/components/ops/delete-client-form";
import { RevenueForm } from "@/components/ops/revenue-form";
import { ActivityForm } from "@/components/ops/activity-form";

type Params = { id: string };

function fmtMoney(amount: { toString: () => string } | null | undefined) {
  if (amount == null) {
    return "—";
  }
  return amount.toString();
}

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const client = await getClientById(id);
  if (!client) {
    notFound();
  }
  const options = await getClientOptions();
  const clientsMini = options.map((c) => ({ id: c.id, companyName: c.companyName }));
  const savedV = sp.saved;
  const createdV = sp.created;
  const saved = (Array.isArray(savedV) ? savedV[0] : savedV) === "1";
  const created = (Array.isArray(createdV) ? createdV[0] : createdV) === "1";

  return (
    <div className="space-y-8">
      <PageHeader
        title={client.companyName}
        description={clientStatusLabel[client.status]}
        actions={
          <Link className={appShellLink} href="/clients">
            Todos los clientes
          </Link>
        }
      />

      {created ? (
        <p className="rounded-md border border-success/30 bg-success/5 px-3 py-2 text-sm text-foreground">
          Cliente creado. Puede completar la ficha abajo.
        </p>
      ) : null}
      {saved ? (
        <p className="rounded-md border border-success/30 bg-success/5 px-3 py-2 text-sm text-foreground">
          Cambios guardados.
        </p>
      ) : null}

      <Card>
        <h3 className="text-sm font-semibold text-foreground">Datos generales</h3>
        <div className="mt-3">
          <ClientEditForm client={client} />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-sm font-semibold text-foreground">Ingresos recientes</h3>
          <p className="text-xs text-muted-foreground">Monto y moneda internas (no e‑CF en esta consola)</p>
          {client.revenue.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Aún no hay filas. Use el formulario de al lado o el módulo Ingresos.</p>
          ) : (
            <ul className="mt-2 max-h-64 space-y-1 overflow-auto text-sm">
              {client.revenue.map((r) => (
                <li
                  key={r.id}
                  className="flex justify-between border-b border-border py-1.5 last:border-0"
                >
                  <span>
                    {fmtMoney(r.amount)} {r.currency}
                    {r.label ? <span className="text-muted-foreground"> — {r.label}</span> : null}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {r.occurredOn.toLocaleDateString("es-DO")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-foreground">Registrar ingreso</h3>
          <div className="mt-2">
            <RevenueForm clients={clientsMini} defaultClientId={id} />
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-sm font-semibold text-foreground">Documentos</h3>
        <p className="text-sm text-muted-foreground">
          Registre licencia, contrato u otro. Opcional: genere y descargue un borrador en <code className="text-xs">.txt</code>.
        </p>
        {client.documents.length > 0 ? (
          <ul className="mt-3 max-h-48 space-y-1 overflow-auto text-sm">
            {client.documents.map((d) => (
              <li
                key={d.id}
                className="flex items-start justify-between gap-2 border-b border-border py-1.5 last:border-0"
              >
                <span>
                  {documentKindLabel[d.kind]} — <span className="font-medium text-foreground">{d.title}</span>
                  {d.fileKey ? <span className="block text-xs text-muted-foreground">Ref: {d.fileKey}</span> : null}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{d.createdAt.toLocaleDateString("es-DO")}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-4 border-t border-dashed border-border pt-4">
          <DocumentForm clients={clientsMini} defaultClientId={id} />
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-foreground">Bitácora asociada</h3>
        {client.activities.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Sin actividad todavía.</p>
        ) : (
          <ul className="mt-2 max-h-64 space-y-1 overflow-auto text-sm">
            {client.activities.map((a) => (
              <li
                key={a.id}
                className="rounded-lg border border-border p-2"
              >
                <p className="font-medium text-foreground">{a.action}</p>
                {a.detail ? <p className="text-muted-foreground">{a.detail}</p> : null}
                <p className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString("es-DO")}</p>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 border-t border-dashed border-border pt-4">
          <h4 className="text-xs font-medium uppercase text-muted-foreground">Añadir evento a este cliente</h4>
          <div className="mt-2">
            <ActivityForm clients={clientsMini} defaultClientId={id} />
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-destructive">Zona de peligro</h3>
        <p className="text-sm text-muted-foreground">
          Elimine el registro y todo lo vinculado a este <code className="font-mono">clientId</code> en pos-ops.
        </p>
        <div className="mt-3 max-w-sm">
          <DeleteClientForm clientId={id} />
        </div>
      </Card>
      <Muted>Envíos a este contacto: consulte y redacte en <Link className="text-primary underline-offset-2 hover:underline" href="/comms">Comunicados</Link>.</Muted>
    </div>
  );
}
