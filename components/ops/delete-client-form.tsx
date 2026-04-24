"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { deleteClientFormAction, type FormMessage } from "@/app/actions/ops";
import { FormAlert, PrimaryButton } from "./form-primitives";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <PrimaryButton type="submit" disabled={pending}>
      {pending ? "Eliminando…" : "Sí, eliminar"}
    </PrimaryButton>
  );
}

export function DeleteClientForm({ clientId }: { clientId: string }) {
  const [state, formAction] = useActionState<FormMessage | null, FormData>(deleteClientFormAction, null);
  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="clientId" value={clientId} />
      {state?.ok === false ? <FormAlert type="err" message={state.error} /> : null}
      <p className="text-sm text-muted-foreground">
        Esta acción no se puede deshacer: se borran ingresos, documentos e historial asociados a este cliente (CASCADE).
      </p>
      <div className="pt-1">
        <Submit />
      </div>
    </form>
  );
}
