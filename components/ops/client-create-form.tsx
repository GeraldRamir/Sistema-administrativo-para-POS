"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createClientFormAction, type FormMessage } from "@/app/actions/ops";
import { ClientStatus } from "@prisma/client";
import { clientStatusLabel } from "@/lib/labels";
import { FormAlert, inputClass, Label, labelBoxClass, PrimaryButton, selectClass } from "./form-primitives";

function Submit() {
  const { pending } = useFormStatus();
  return <PrimaryButton disabled={pending}>{pending ? "Guardando…" : "Crear cliente"}</PrimaryButton>;
}

export function ClientCreateForm() {
  const [state, formAction] = useActionState<FormMessage | null, FormData>(createClientFormAction, null);

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      {state?.ok === false ? <FormAlert type="err" message={state.error} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className={labelBoxClass}>
          <Label htmlFor="companyName">Empresa *</Label>
          <input id="companyName" name="companyName" required className={inputClass} maxLength={200} />
        </div>
        <div className={labelBoxClass}>
          <Label htmlFor="contactEmail">Correo *</Label>
          <input id="contactEmail" name="contactEmail" type="email" required className={inputClass} maxLength={320} />
        </div>
        <div className={labelBoxClass}>
          <Label htmlFor="contactName">Contacto</Label>
          <input id="contactName" name="contactName" className={inputClass} maxLength={200} />
        </div>
        <div className={labelBoxClass}>
          <Label htmlFor="phone">Teléfono</Label>
          <input id="phone" name="phone" className={inputClass} maxLength={50} />
        </div>
        <div className={labelBoxClass}>
          <Label htmlFor="status">Estado</Label>
          <select id="status" name="status" className={selectClass} defaultValue={ClientStatus.LEAD}>
            {(Object.keys(clientStatusLabel) as ClientStatus[]).map((s) => (
              <option key={s} value={s}>
                {clientStatusLabel[s]}
              </option>
            ))}
          </select>
        </div>
        <div className={labelBoxClass}>
          <Label htmlFor="posOrganizationId">ID organización (POS)</Label>
          <input id="posOrganizationId" name="posOrganizationId" className={inputClass} maxLength={200} />
        </div>
        <div className={`${labelBoxClass} sm:col-span-2`}>
          <Label htmlFor="posClientBaseUrl">URL base del cliente (POS en producción)</Label>
          <input
            id="posClientBaseUrl"
            name="posClientBaseUrl"
            className={inputClass}
            placeholder="https://"
            maxLength={500}
          />
        </div>
        <div className={`${labelBoxClass} sm:col-span-2`}>
          <Label htmlFor="notes">Notas</Label>
          <textarea id="notes" name="notes" className={inputClass + " min-h-[100px]"} maxLength={20000} />
        </div>
      </div>
      <Submit />
    </form>
  );
}
