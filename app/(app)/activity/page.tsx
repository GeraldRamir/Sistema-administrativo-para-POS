import Link from "next/link";
import { getActivityList, getClientOptions } from "@/lib/queries";
import { Card, Muted, PageHeader } from "@/components/ops/form-primitives";
import { ActivityForm } from "@/components/ops/activity-form";

export default async function ActivityPage() {
  const [rows, options] = await Promise.all([getActivityList(), getClientOptions()]);
  const clients = options.map((c) => ({ id: c.id, companyName: c.companyName }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Actividad (bitácora)"
        description="Escriba un evento manual o confíe en el registro automático al crear clientes, documentos, ingresos o enviar desde Comunicados."
      />
      <Card>
        <ActivityForm clients={clients} />
      </Card>
      <div>
        <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Línea de tiempo (más reciente primero)</h3>
        {rows.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">Sin actividad aún. Acciones desde esta app o el API crearán entradas.</p>
        ) : (
          <ol className="mt-3 space-y-2 border-l-2 border-violet-200 pl-4 dark:border-violet-900/60">
            {rows.map((a) => (
              <li key={a.id} className="relative -left-0 text-sm">
                <span className="absolute -left-4 top-1.5 h-2 w-2 rotate-45 rounded-sm bg-violet-500" aria-hidden />
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{a.action}</p>
                {a.detail ? <p className="text-zinc-600 dark:text-zinc-300">{a.detail}</p> : null}
                <p className="text-xs text-zinc-500">
                  {a.createdAt.toLocaleString("es-DO")}{" "}
                  {a.clientId && a.client ? (
                    <>
                      · <Link className="text-violet-600 dark:text-violet-400" href={`/clients/${a.clientId}`}>
                        {a.client.companyName}
                      </Link>
                    </>
                  ) : (
                    "· sin cliente"
                  )}
                </p>
              </li>
            ))}
          </ol>
        )}
        <div className="mt-4">
          <Muted>Campos técnicos y payload JSON: almacenados en base (metadata) cuando lo envía el API o acciones de servidor.</Muted>
        </div>
      </div>
    </div>
  );
}
