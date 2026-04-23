"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { addActivityFormAction, type ActivityFormState } from "@/app/actions/ops";
import { FormAlert, inputClass, Label, labelBoxClass, PrimaryButton, selectClass } from "./form-primitives";

type Opt = { id: string; companyName: string };

function Submit() {
  const { pending } = useFormStatus();
  return <PrimaryButton disabled={pending}>{pending ? "Guardando…" : "Añadir evento"}</PrimaryButton>;
}

export function ActivityForm({ clients, defaultClientId }: { clients: Opt[]; defaultClientId?: string | null }) {
  const [state, formAction] = useActionState<ActivityFormState, FormData>(addActivityFormAction, null);
  return (
    <form action={formAction} className="space-y-3">
      {state?.ok === false ? <FormAlert type="err" message={state.error} /> : null}
      {state?.ok && state.message ? <FormAlert type="ok" message={state.message} /> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={labelBoxClass + " sm:col-span-2 max-w-md"}>
          <Label htmlFor="a-client">Cliente (opcional)</Label>
          <select
            name="clientId"
            id="a-client"
            className={selectClass}
            defaultValue={defaultClientId ?? ""}
          >
            <option value="">— Ninguno —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </select>
        </div>
        <div className={labelBoxClass + " sm:col-span-2 max-w-2xl"}>
          <Label htmlFor="a-action">Acción (clave breve) *</Label>
          <input
            name="action"
            id="a-action"
            className={inputClass}
            required
            maxLength={200}
            placeholder="p. ej. call.follow_up, handoff.legal, deploy.done"
          />
        </div>
        <div className={`${labelBoxClass} sm:col-span-2`}>
          <Label htmlFor="a-detail">Detalle (opcional)</Label>
          <textarea name="detail" id="a-detail" className={inputClass + " min-h-[80px]"} maxLength={10000} />
        </div>
      </div>
      <Submit />
    </form>
  );
}
