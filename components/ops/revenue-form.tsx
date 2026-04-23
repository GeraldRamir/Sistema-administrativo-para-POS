"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { addRevenueFormAction, type RevenueFormState } from "@/app/actions/ops";
import { FormAlert, inputClass, Label, labelBoxClass, PrimaryButton, selectClass } from "./form-primitives";

type Opt = { id: string; companyName: string };

function Submit() {
  const { pending } = useFormStatus();
  return <PrimaryButton disabled={pending}>{pending ? "Guardando…" : "Registrar ingreso"}</PrimaryButton>;
}

export function RevenueForm({ clients, defaultClientId, heading = "Añadir ingreso" }: { clients: Opt[]; defaultClientId?: string; heading?: string }) {
  const [state, formAction] = useActionState<RevenueFormState, FormData>(addRevenueFormAction, null);
  return (
    <form action={formAction} className="space-y-3">
      <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{heading}</h3>
      {state?.ok === false ? <FormAlert type="err" message={state.error} /> : null}
      {state?.ok && state.message ? <FormAlert type="ok" message={state.message} /> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={labelBoxClass + " sm:col-span-2 max-w-md"}>
          <Label htmlFor="r-client">Cliente *</Label>
          <select
            name="clientId"
            id="r-client"
            className={selectClass}
            required
            defaultValue={defaultClientId ?? ""}
          >
            <option value="">Elegir…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </select>
        </div>
        <div className={labelBoxClass}>
          <Label htmlFor="r-amount">Monto *</Label>
          <input
            name="amount"
            id="r-amount"
            className={inputClass}
            required
            type="text"
            inputMode="decimal"
            placeholder="0.00"
          />
        </div>
        <div className={labelBoxClass}>
          <Label htmlFor="r-currency">Moneda</Label>
          <input name="currency" id="r-currency" className={inputClass} defaultValue="DOP" maxLength={8} />
        </div>
        <div className={labelBoxClass}>
          <Label htmlFor="r-date">Fecha (servidor local)</Label>
          <input name="occurredOn" id="r-date" className={inputClass} type="date" />
        </div>
        <div className={`${labelBoxClass} sm:col-span-2`}>
          <Label htmlFor="r-label">Descripción (opcional)</Label>
          <input name="label" id="r-label" className={inputClass} maxLength={500} placeholder="Ej. cierre, renovación…" />
        </div>
      </div>
      <Submit />
    </form>
  );
}
