import Link from "next/link";
import { PageHeader, Card, Muted, appShellLink } from "@/components/ops/form-primitives";
import { ClientCreateForm } from "@/components/ops/client-create-form";

export default function NewClientPage() {
  return (
    <div>
      <PageHeader
        title="Nuevo cliente"
        description="Cree un registro comercial (empresa, contacto, enlace lógico al API del producto). Después podrá añadir documentos e ingresos desde la ficha."
        actions={
          <Link className={appShellLink} href="/clients">
            Volver a la lista
          </Link>
        }
      />
      <Card>
        <ClientCreateForm />
        <p className="mt-4 text-xs text-muted-foreground">Al guardar, abriremos la ficha del cliente creado.</p>
      </Card>
      <div className="mt-4">
        <Muted>
          Mismo modelo que <code className="font-mono">POST /api/v1/clients</code> (API para integraciones).
        </Muted>
      </div>
    </div>
  );
}
