"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { createDocumentFormState } from "@/app/actions/ops";
import { DocumentKind } from "@prisma/client";
import { documentKindLabel } from "@/lib/labels";
import { FormAlert, inputClass, Label, labelBoxClass, PrimaryButton, selectClass } from "./form-primitives";

const kinds = Object.keys(documentKindLabel) as DocumentKind[];

function Submit({ label = "Registrar documento" }: { label?: string }) {
  const { pending } = useFormStatus();
  return <PrimaryButton disabled={pending}>{pending ? "Procesando…" : label}</PrimaryButton>;
}

type Opt = { id: string; companyName: string };

export function DocumentForm({ clients, defaultClientId }: { clients: Opt[]; defaultClientId?: string | null }) {
  const [state, formAction] = useActionState(createDocumentFormState, null);
  const doneRef = useRef<string | null>(null);

  useEffect(() => {
    if (state?.ok && state.download) {
      const k = state.download.name + state.download.text.slice(0, 20);
      if (doneRef.current === k) {
        return;
      }
      doneRef.current = k;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(
        new Blob([state.download.text], { type: "text/plain;charset=utf-8" }),
      );
      a.download = state.download.name;
      a.click();
      URL.revokeObjectURL(a.href);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-3">
      {state?.ok === false ? <FormAlert type="err" message={state.error} /> : null}
      {state?.ok && (state.message || state.download) ? (
        <FormAlert
          type="ok"
          message={state.message ?? (state.download ? "Descarga de borrador iniciada." : "")}
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className={`${labelBoxClass} sm:col-span-2`}>
          <Label htmlFor="d-clientId">Cliente *</Label>
          <select
            id="d-clientId"
            name="clientId"
            required
            className={selectClass}
            defaultValue={defaultClientId ?? (clients[0]?.id ?? "")}
          >
            {clients.length === 0 ? (
              <option value="">— Cree un cliente primero —</option>
            ) : (
              clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))
            )}
          </select>
        </div>
        <div className={labelBoxClass}>
          <Label htmlFor="d-kind">Tipo *</Label>
          <select id="d-kind" name="kind" className={selectClass} defaultValue="CONTRACT">
            {kinds.map((k) => (
              <option key={k} value={k}>
                {documentKindLabel[k]}
              </option>
            ))}
          </select>
        </div>
        <div className={labelBoxClass}>
          <Label htmlFor="d-title">Título o referencia *</Label>
          <input
            id="d-title"
            name="title"
            required
            className={inputClass}
            placeholder="Ej. Contrato comercial 2025"
            maxLength={300}
          />
        </div>
        <div className={`${labelBoxClass} sm:col-span-2`}>
          <Label htmlFor="d-fileKey">Referencia de archivo (opcional)</Label>
          <input
            id="d-fileKey"
            name="fileKey"
            className={inputClass}
            placeholder="s3://… o ruta interna al integrar almacenamiento"
            maxLength={500}
          />
        </div>
        <div className="flex items-start gap-2 sm:col-span-2">
          <input id="d-with" name="withTemplate" type="checkbox" value="true" className="mt-0.5 h-4 w-4 rounded" />
          <label htmlFor="d-with" className="text-sm text-foreground/90">
            Tras el registro, <strong>generar y descargar</strong> un borrador en <code className="text-xs">.txt</code>{" "}
            (texto informativo; defina términos con legal / contratos oficiales).
          </label>
        </div>
      </div>
      <div className="pt-1">
        <Submit label="Registrar (y descargar si aplica)" />
      </div>
    </form>
  );
}
