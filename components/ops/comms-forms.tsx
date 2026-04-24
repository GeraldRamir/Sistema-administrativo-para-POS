"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { sendCommsFormAction, testCommsFormAction, type CommsFormState } from "@/app/actions/ops";
import { FormAlert, inputClass, Label, labelBoxClass, PrimaryButton, selectClass } from "./form-primitives";

type Opt = { id: string; companyName: string };

function SendSubmit() {
  const { pending } = useFormStatus();
  return <PrimaryButton disabled={pending}>{pending ? "Enviando…" : "Enviar comunicado"}</PrimaryButton>;
}

function TestSubmit() {
  const { pending } = useFormStatus();
  return (
    <PrimaryButton disabled={pending}>
      {pending ? "Enviando prueba…" : "Solo probar entrega (SMTP o log)"}
    </PrimaryButton>
  );
}

export function CommsMainForm({ clients, defaultTo }: { clients: Opt[]; defaultTo?: string | null }) {
  const [state, formAction] = useActionState<CommsFormState, FormData>(sendCommsFormAction, null);
  return (
    <form action={formAction} className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">Mensaje saliente</h3>
      {state?.ok === false ? <FormAlert type="err" message={state.error} /> : null}
      {state?.ok && state.message ? <FormAlert type="ok" message={state.message} /> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={labelBoxClass + " sm:col-span-2 max-w-md"}>
          <Label htmlFor="m-to">Destinatario (para) *</Label>
          <input
            name="to"
            id="m-to"
            className={inputClass}
            type="email"
            required
            defaultValue={defaultTo?.trim() ?? ""}
            key={defaultTo ?? "default"}
          />
        </div>
        <div className={`${labelBoxClass} sm:col-span-2`}>
          <Label htmlFor="m-subject">Asunto *</Label>
          <input name="subject" id="m-subject" className={inputClass} required maxLength={500} />
        </div>
        <div className={`${labelBoxClass} sm:col-span-2 max-w-md`}>
          <Label htmlFor="m-template">ID plantilla (registro en log, opcional)</Label>
          <input name="template" id="m-template" className={inputClass} maxLength={200} placeholder="bienvenida, recordatorio, …" />
        </div>
        <div className={`${labelBoxClass} sm:col-span-2 max-w-md`}>
          <Label htmlFor="m-cid">Cliente (relacionar con log)</Label>
          <select name="clientId" id="m-cid" className={selectClass} defaultValue="">
            <option value="">— Ninguno —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </select>
        </div>
        <div className={labelBoxClass + " sm:col-span-2"}>
          <Label htmlFor="m-text">Cuerpo texto</Label>
          <textarea name="text" id="m-text" className={inputClass + " min-h-[100px]"} maxLength={100000} />
        </div>
        <div className={labelBoxClass + " sm:col-span-2"}>
          <Label htmlFor="m-html">Cuerpo HTML (si rellena, o combine con texto; al menos uno)</Label>
          <textarea name="html" id="m-html" className={inputClass + " min-h-[100px] font-mono text-xs"} maxLength={500000} />
        </div>
      </div>
      <SendSubmit />
    </form>
  );
}

export function CommsTestForm() {
  const [state, formAction] = useActionState<CommsFormState, FormData>(testCommsFormAction, null);
  return (
    <form action={formAction} className="space-y-2 border-t border-border pt-5">
      <h3 className="text-sm font-medium text-foreground">Probar conexión SMTP o modo log</h3>
      {state?.ok === false ? <FormAlert type="err" message={state.error} /> : null}
      {state?.ok && state.message ? <FormAlert type="ok" message={state.message} /> : null}
      <div className={labelBoxClass + " max-w-md"}>
        <Label htmlFor="test-to">Enviar prueba a *</Label>
        <input name="to" id="test-to" className={inputClass} type="email" required />
      </div>
      <TestSubmit />
    </form>
  );
}
