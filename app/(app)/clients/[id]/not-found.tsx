import Link from "next/link";

export default function ClientNotFound() {
  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Cliente no encontrado</h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">No existe un registro con ese id o fue eliminado.</p>
      <Link className="text-sm text-violet-600 underline dark:text-violet-400" href="/clients">
        Volver a la lista
      </Link>
    </div>
  );
}
