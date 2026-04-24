"use client";

import { useActionState, useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { generateContractAction, type ContractGenerateState } from "@/app/actions/contracts";
import { CONTRACT_CATALOG, type ContractTemplateId } from "@/lib/contract-templates/types";
import { FormAlert, inputClass, Label, labelBoxClass, PrimaryButton, selectClass, Card, Muted } from "./form-primitives";
import { SignaturePad, type SignaturePadHandle } from "./signature-pad";

function SubmitButton({ isPending }: { isPending: boolean }) {
  return <PrimaryButton disabled={isPending}>{isPending ? "Generando PDF…" : "Generar y descargar PDF"}</PrimaryButton>;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

export function ContractGeneratorForm() {
  const [state, formAction] = useActionState<ContractGenerateState, FormData>(generateContractAction, null);
  const [isPending, startTransition] = useTransition();
  const [kind, setKind] = useState<ContractTemplateId>("DESARROLLO_SOFTWARE");
  const doneRef = useRef<string | null>(null);
  const sig1 = useRef<SignaturePadHandle>(null);
  const sig2 = useRef<SignaturePadHandle>(null);
  const sig3 = useRef<SignaturePadHandle>(null);

  function onSubmitForm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("firmaColaborador1Png", sig1.current?.getPngBase64() ?? "");
    fd.set("firmaColaborador2Png", sig2.current?.getPngBase64() ?? "");
    fd.set("firmaColaborador3Png", sig3.current?.getPngBase64() ?? "");
    startTransition(() => {
      void formAction(fd);
    });
  }

  useEffect(() => {
    if (state?.ok && state.download) {
      const { name, pdfBase64 } = state.download;
      const k = name + pdfBase64.slice(0, 64);
      if (doneRef.current === k) {
        return;
      }
      doneRef.current = k;
      const bytes = Uint8Array.from(globalThis.atob(pdfBase64), (c) => c.charCodeAt(0));
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      a.download = name;
      a.click();
      URL.revokeObjectURL(a.href);
    }
  }, [state]);

  const selected = CONTRACT_CATALOG.find((c) => c.id === kind);
  const isAvailable = selected?.available === true;

  return (
    <form onSubmit={onSubmitForm} className="space-y-6" encType="multipart/form-data" method="post">
      <input type="hidden" name="kind" value={kind} />

      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <Label htmlFor="contract-kind">Tipo de contrato</Label>
        <select
          id="contract-kind"
          className={selectClass + " mt-1.5 max-w-lg"}
          value={kind}
          onChange={(e) => setKind(e.target.value as ContractTemplateId)}
        >
          {CONTRACT_CATALOG.map((c) => (
            <option key={c.id} value={c.id} disabled={!c.available}>
              {c.label}
              {!c.available ? " (próximamente)" : ""}
            </option>
          ))}
        </select>
        {selected ? <p className="mt-2 text-sm text-muted-foreground">{selected.description}</p> : null}
      </div>

      {state?.ok === false ? <FormAlert type="err" message={state.error} /> : null}
      {state?.ok && state.download ? <FormAlert type="ok" message="Descarga iniciada. Guarde el archivo y revíselo con asesoría legal." /> : null}

      {!isAvailable ? (
        <Card>
          <p className="text-sm text-foreground">Este tipo de plantilla aún se está integrando. Por ahora use «Desarrollo de software».</p>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Partes</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className={labelBoxClass + " sm:col-span-2"}>
                <Label htmlFor="empresaDesarrolladora">Empresa desarrolladora (EL DESARROLLADOR) *</Label>
                <input
                  className={inputClass}
                  id="empresaDesarrolladora"
                  name="empresaDesarrolladora"
                  required
                  maxLength={300}
                  placeholder="Razón social o nombre comercial"
                />
              </div>
              <div className={labelBoxClass + " sm:col-span-2"}>
                <Label htmlFor="representanteDesarrollador">Representante del desarrollador *</Label>
                <input
                  className={inputClass}
                  id="representanteDesarrollador"
                  name="representanteDesarrollador"
                  required
                  maxLength={200}
                  placeholder="Nombre y cargo"
                />
              </div>
              <div className={labelBoxClass + " sm:col-span-2"}>
                <Label htmlFor="clienteEmpresa">Empresa del cliente (EL CLIENTE) *</Label>
                <input
                  className={inputClass}
                  id="clienteEmpresa"
                  name="clienteEmpresa"
                  required
                  maxLength={300}
                />
              </div>
              <div className={labelBoxClass + " sm:col-span-2"}>
                <Label htmlFor="nombreCliente">Nombre del representante del cliente *</Label>
                <input
                  className={inputClass}
                  id="nombreCliente"
                  name="nombreCliente"
                  required
                  maxLength={200}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Proyecto y alcance</h3>
            <div className={labelBoxClass}>
              <Label htmlFor="proyecto">Nombre del sistema / proyecto *</Label>
              <input className={inputClass} id="proyecto" name="proyecto" required maxLength={500} />
            </div>
            <div className={labelBoxClass}>
              <Label htmlFor="modulos">Módulos y funciones / alcance *</Label>
              <textarea
                className={inputClass + " min-h-[120px]"}
                id="modulos"
                name="modulos"
                required
                maxLength={20000}
                placeholder="Describa pantallas, integraciones, roles, entregables…"
              />
            </div>
            <div className={labelBoxClass}>
              <Label htmlFor="tecnologias">Tecnologías (stack, frameworks, requisitos técnicos)</Label>
              <textarea
                className={inputClass + " min-h-[72px]"}
                id="tecnologias"
                name="tecnologias"
                maxLength={5000}
                placeholder="Ej. Next.js, NestJS, PostgreSQL, alojamiento en…"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Precio y pago</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className={labelBoxClass + " sm:col-span-2"}>
                <Label htmlFor="montoTotal">Monto total *</Label>
                <input
                  className={inputClass}
                  id="montoTotal"
                  name="montoTotal"
                  required
                  maxLength={200}
                  placeholder="Ej. RD$ 150,000.00 o USD 5,000.00"
                />
              </div>
              <div className={labelBoxClass}>
                <Label htmlFor="inicial">Pago inicial *</Label>
                <input className={inputClass} id="inicial" name="inicial" required maxLength={200} />
              </div>
              <div className={labelBoxClass}>
                <Label htmlFor="cuotas">Restante / cuotas *</Label>
                <input
                  className={inputClass}
                  id="cuotas"
                  name="cuotas"
                  required
                  maxLength={2000}
                  placeholder="Ej. 2 cuotas de RD$ 50,000 a los 30 y 60 días"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Plazos</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className={labelBoxClass}>
                <Label htmlFor="diasHabiles">Días hábiles de desarrollo (estimado) *</Label>
                <input
                  className={inputClass}
                  id="diasHabiles"
                  name="diasHabiles"
                  type="number"
                  min={1}
                  max={3650}
                  required
                  defaultValue={90}
                />
              </div>
              <div className={labelBoxClass}>
                <Label htmlFor="fechaInicio">Fecha de inicio (referencia) *</Label>
                <input className={inputClass} id="fechaInicio" name="fechaInicio" type="date" required defaultValue={todayStr()} />
              </div>
              <div className={labelBoxClass + " sm:col-span-2"}>
                <Label htmlFor="fechaEntrega">Fecha de entrega estimada (opcional; si queda en blanco se indica en texto genérico)</Label>
                <input className={inputClass} id="fechaEntrega" name="fechaEntrega" type="date" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Soporte, IP y riesgos</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className={labelBoxClass}>
                <Label htmlFor="mesesSoporte">Meses de soporte post-entrega *</Label>
                <input
                  className={inputClass}
                  id="mesesSoporte"
                  name="mesesSoporte"
                  type="number"
                  min={0}
                  max={120}
                  required
                  defaultValue={3}
                />
              </div>
              <div className={labelBoxClass + " sm:col-span-2"}>
                <Label htmlFor="quienPoseeCodigo">Titularidad del código y entregables (tras pago) *</Label>
                <input
                  className={inputClass}
                  id="quienPoseeCodigo"
                  name="quienPoseeCodigo"
                  required
                  maxLength={500}
                  defaultValue="EL CLIENTE, una vez completado el pago total acordado"
                />
              </div>
              <div className={labelBoxClass + " sm:col-span-2"}>
                <Label htmlFor="penalidadAtrasoPago">Penalidad o consecuencias por atraso en pago (opcional)</Label>
                <textarea
                  className={inputClass + " min-h-[64px]"}
                  id="penalidadAtrasoPago"
                  name="penalidadAtrasoPago"
                  maxLength={2000}
                  placeholder="Ej. interés moratorio, suspensión de hitos, costos de reactivación…"
                />
              </div>
              <div className={labelBoxClass + " sm:col-span-2"}>
                <Label htmlFor="jurisdiccion">Jurisdicción / leyes aplicables *</Label>
                <input
                  className={inputClass}
                  id="jurisdiccion"
                  name="jurisdiccion"
                  required
                  maxLength={500}
                  defaultValue="República Dominicana"
                />
              </div>
            </div>
          </div>

          <div className={labelBoxClass}>
            <Label htmlFor="fechaHoy">Fecha de firma del documento (referencia en el cierre) *</Label>
            <input
              className={inputClass + " max-w-xs"}
              id="fechaHoy"
              name="fechaHoy"
              type="date"
              required
              defaultValue={todayStr()}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Firmas de colaboradores (vendedores)</h3>
            <p className="text-sm text-muted-foreground">
              Firme con el dedo, stylus o mouse en los tres recuadros (uno por cada colaborador que comercializa el
              sistema). Se insertarán en el PDF bajo <strong>EL DESARROLLADOR</strong>. Use <strong>Limpiar</strong> si
              se equivocó. Si deja en blanco, en el PDF verá un espacio para firmar a mano al imprimir.
            </p>
            <div className="grid gap-6 sm:grid-cols-3">
              <SignaturePad ref={sig1} label="Colaborador 1" />
              <SignaturePad ref={sig2} label="Colaborador 2" />
              <SignaturePad ref={sig3} label="Colaborador 3" />
            </div>
          </div>

          <div>
            <SubmitButton isPending={isPending} />
          </div>
          <Muted>
            Se genera un <strong>PDF</strong> listo para imprimir o compartir. Complemente con cédula/RNC y anexos
            legales según su caso; revise con un asesor antes de firmar.
          </Muted>
        </>
      )}
    </form>
  );
}
