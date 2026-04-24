import Link from "next/link";
import { appShellLink } from "@/components/ops/form-primitives";

export default function ClientNotFound() {
  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold text-foreground">Cliente no encontrado</h2>
      <p className="text-sm text-muted-foreground">No existe un registro con ese id o fue eliminado.</p>
      <Link className={appShellLink} href="/clients">
        Volver a la lista
      </Link>
    </div>
  );
}
