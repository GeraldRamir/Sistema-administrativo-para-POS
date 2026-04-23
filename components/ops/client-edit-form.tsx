"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { Client, ClientStatus } from "@prisma/client";
import { updateClientFormAction, type FormMessage } from "@/app/actions/ops";
import { clientStatusLabel } from "@/lib/labels";
import { FormAlert, inputClass, Label, labelBoxClass, PrimaryButton, selectClass } from "./form-primitives";

function Submit() {
  const { pending } = useFormStatus();
  return <PrimaryButton disabled={pending}>{pending ? "Guardando…" : "Guardar cambios"}</PrimaryButton>;
}

const statuses = Object.keys(clientStatusLabel) as ClientStatus[];

type Row = Pick<
  Client,
  "id" | "companyName" | "contactEmail" | "contactName" | "phone" | "status" | "posOrganizationId" | "posClientBaseUrl" | "notes"
>;

export function ClientEditForm({ client }: { client: Row }) {
  const [state, formAction] = useActionState<FormMessage | null, FormData>(updateClientFormAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="clientId" value={client.id} />
      {state?.ok === false ? <FormAlert type="err" message={state.error} /> : null}
      {state?.ok && state.message ? <FormAlert type="ok" message={state.message} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className={labelBoxClass}>
          <Label htmlFor="e-companyName">Empresa *</Label>
          <input
            id="e-companyName"
            name="companyName"
            required
            className={inputClass}
            defaultValue={client.companyName}
            maxLength={200}
          />
        </div>
        <div className={labelBoxClass}>
          <Label htmlFor="e-contactEmail">Correo *</Label>
          <input
            id="e-contactEmail"
            name="contactEmail"
            type="email"
            required
            className={inputClass}
            defaultValue={client.contactEmail}
          />
        </div>
        <div className={labelBoxClass}>
          <Label htmlFor="e-contactName">Contacto</Label>
          <input
            id="e-contactName"
            name="contactName"
            className={inputClass}
            defaultValue={client.contactName ?? ""}
            maxLength={200}
          />
        </div>
        <div className={labelBoxClass}>
          <Label htmlFor="e-phone">Teléfono</Label>
          <input id="e-phone" name="phone" className={inputClass} defaultValue={client.phone ?? ""} maxLength={50} />
        </div>
        <div className={labelBoxClass}>
          <Label htmlFor="e-status">Estado</Label>
          <select id="e-status" name="status" className={selectClass} defaultValue={client.status}>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {clientStatusLabel[s]}
              </option>
            ))}
          </select>
        </div>
        <div className={labelBoxClass}>
          <Label htmlFor="e-posOrg">ID organización (POS)</Label>
          <input
            id="e-posOrg"
            name="posOrganizationId"
            className={inputClass}
            defaultValue={client.posOrganizationId ?? ""}
            maxLength={200}
          />
        </div>
        <div className={`${labelBoxClass} sm:col-span-2`}>
          <Label htmlFor="e-baseUrl">URL base del cliente</Label>
          <input
            id="e-baseUrl"
            name="posClientBaseUrl"
            className={inputClass}
            defaultValue={client.posClientBaseUrl ?? ""}
            maxLength={500}
            placeholder="https://"
          />
        </div>
        <div className={`${labelBoxClass} sm:col-span-2`}>
          <Label htmlFor="e-notes">Notas</Label>
          <textarea
            id="e-notes"
            name="notes"
            className={inputClass + " min-h-[100px]"}
            defaultValue={client.notes ?? ""}
            maxLength={20000}
          />
        </div>
      </div>
      <Submit />
    </form>
  );
}
