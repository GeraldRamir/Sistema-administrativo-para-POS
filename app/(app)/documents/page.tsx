import Link from "next/link";
import { getAllDocuments, getClientOptions } from "@/lib/queries";
import { documentKindLabel } from "@/lib/labels";
import { Card, PageHeader } from "@/components/ops/form-primitives";
import { DocumentForm } from "@/components/ops/document-form";

export default async function DocumentsPage() {
  const [docs, options] = await Promise.all([getAllDocuments(), getClientOptions()]);
  const clients = options.map((c) => ({ id: c.id, companyName: c.companyName }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentos comerciales"
        description="Registre contratos, licencias y referencias. Marque “generar borrador” para bajar un .txt con datos del cliente. Los PDF firmados o el almacenamiento de archivos se integran después vía `fileKey` o bucket."
      />

      <Card>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Nuevo documento o borrador</h3>
        {clients.length === 0 ? (
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
            Aún no hay clientes.{" "}
            <Link className="font-medium underline" href="/clients/new">
              Cree un cliente
            </Link>{" "}
            primero.
          </p>
        ) : (
          <div className="mt-3">
            <DocumentForm clients={clients} />
          </div>
        )}
      </Card>

      <div>
        <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Listado (últimos 500)</h3>
        {docs.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">Aún no hay filas. Use el formulario superior o la ficha de un cliente.</p>
        ) : (
          <div className="mt-2 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                <tr>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Título</th>
                  <th className="px-3 py-2">Cliente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {docs.map((d) => (
                  <tr key={d.id} className="bg-white dark:bg-zinc-900/20">
                    <td className="px-3 py-2 text-zinc-500">{d.createdAt.toLocaleString("es-DO")}</td>
                    <td className="px-3 py-2">{documentKindLabel[d.kind]}</td>
                    <td className="px-3 py-2 font-medium text-zinc-800 dark:text-zinc-200">{d.title}</td>
                    <td className="px-3 py-2">
                      <Link className="text-violet-600 hover:underline dark:text-violet-400" href={`/clients/${d.client.id}`}>
                        {d.client.companyName}
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
