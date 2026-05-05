"use client";

import { useActionState, useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { generateContractAction, type ContractGenerateState } from "@/app/actions/contracts";
import { CONTRACT_CATALOG, type ContractTemplateId } from "@/lib/contract-templates/types";
import {
  FormAlert,
  GhostButton,
  inputClass,
  Label,
  labelBoxClass,
  PrimaryButton,
  selectClass,
  Card,
  Muted,
} from "./form-primitives";
import { ContractRichTextField } from "./contract-rich-text-field";
import { SignaturePad, type SignaturePadHandle } from "./signature-pad";

const STORAGE_KEY = "sistema-admin-pos:contrato-desarrollo-borrador";
const PASTE_HELP =
  "Al copiar desde Word o Excel, use «Pegar y limpiar» o pegue con Ctrl+Mayús+V (pegar sin formato) en el recuadro, para evitar guiones invisibles y símbolos raros en el PDF.";

const ZOD_FIELD_LABELS: Record<string, string> = {
  empresaDesarrolladora: "Empresa del proveedor",
  representanteDesarrollador: "Representante del proveedor",
  clienteEmpresa: "Empresa del cliente (EL CLIENTE)",
  nombreCliente: "Nombre del representante del cliente",
  proyecto: "Nombre del proyecto o sistema",
  modulos: "Módulos y alcance",
  nombreServicio: "Nombre del servicio o producto (SaaS)",
  descripcionAlcance: "Alcance, planes, límites, exclusiones",
  montoRecurrente: "Tarifa o monto del período",
  periodoFacturacion: "Periodicidad de facturación",
  tarifaUnica: "Implementación, activación o tarifa única (opcional)",
  facturacionYrenovacion: "Facturación, vencimientos, renovación",
  compromisoMinimoMeses: "Compromiso mínimo (meses)",
  fechaInicio: "Fecha de inicio",
  fechaEntrega: "Fecha de entrega estimada",
  fechaFinPlazo: "Fecha de cierre/renovación (referencia)",
  integracionAccesos: "Requisitos e integraciones",
  disponibilidad: "Disponibilidad, SLA, soporte (informativo)",
  licenciaUso: "Licencia de uso y titularidad",
  monedaReferencia: "Moneda de referencia",
  montoTotal: "Monto total",
  inicial: "Pago inicial",
  cuotas: "Cuotas / restante a pagar",
  diasHabiles: "Días hábiles de desarrollo",
  tecnologias: "Tecnologías",
  mesesSoporte: "Meses de soporte",
  quienPoseeCodigo: "Titularidad del código",
  penalidadAtrasoPago: "Penalidad por atraso de pago",
  jurisdiccion: "Jurisdicción / leyes aplicables",
  fechaHoy: "Fecha de firma del documento",
};

const DEV_STEPS = [
  { id: 0, title: "Partes" },
  { id: 1, title: "Proyecto y alcance" },
  { id: 2, title: "Precio y moneda" },
  { id: 3, title: "Plazos" },
  { id: 4, title: "Soporte, IP y riesgos" },
  { id: 5, title: "Fecha de firma" },
  { id: 6, title: "Firmas (comercial — PDF)" },
] as const;

const SAAS_STEPS = [
  { id: 0, title: "Partes" },
  { id: 1, title: "Servicio y alcance" },
  { id: 2, title: "Precio, periodicidad, facturación" },
  { id: 3, title: "Vigencia y plazos" },
  { id: 4, title: "Licencia, datos, riesgos" },
  { id: 5, title: "Fecha de firma" },
  { id: 6, title: "Firmas (comercial — PDF)" },
] as const;

const todayStr = () => new Date().toISOString().slice(0, 10);

const staticDefaults = (): Record<string, string> => {
  const t = todayStr();
  return {
    diasHabiles: "90",
    mesesSoporte: "3",
    fechaInicio: t,
    fechaHoy: t,
    quienPoseeCodigo: "EL CLIENTE, una vez completado el pago total acordado",
    jurisdiccion: "República Dominicana",
    monedaReferencia: "DOP",
    compromisoMinimoMeses: "12",
    periodoFacturacion: "MENSUAL",
    licenciaUso:
      "Licencia de uso no exclusiva e intransmisible del Servicio, revocable por incumplimiento esencial, según cláusulas y anexos.",
    facturacionYrenovacion:
      "Facturación por período; vencimientos y medios según factura; renovación tácita salvo notificación oportuna o lo acordado por escrito.",
  };
};

const isContractKind = (k: string | undefined): k is ContractTemplateId => k === "SAAS" || k === "DESARROLLO_SOFTWARE";

const readDraft = (): { values: Record<string, string>; numFirmas: 1 | 2 | 3; kind: ContractTemplateId } => {
  if (typeof window === "undefined") {
    return { values: staticDefaults(), numFirmas: 3, kind: "DESARROLLO_SOFTWARE" };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { values: staticDefaults(), numFirmas: 3, kind: "DESARROLLO_SOFTWARE" };
    }
    const p = JSON.parse(raw) as Record<string, string>;
    const n = parseInt(p.numFirmas ?? "3", 10);
    const numFirmas: 1 | 2 | 3 = n === 1 || n === 2 ? n : 3;
    const { numFirmas: _nf, kind: kRaw, ...rest } = p;
    const kind: ContractTemplateId = isContractKind(kRaw) ? kRaw : "DESARROLLO_SOFTWARE";
    return { values: { ...staticDefaults(), ...rest }, numFirmas, kind };
  } catch {
    return { values: staticDefaults(), numFirmas: 3, kind: "DESARROLLO_SOFTWARE" };
  }
};

const computeLens = (d: Record<string, string>) => ({
  empresaDesarrolladora: (d.empresaDesarrolladora ?? "").length,
  representanteDesarrollador: (d.representanteDesarrollador ?? "").length,
  clienteEmpresa: (d.clienteEmpresa ?? "").length,
  nombreCliente: (d.nombreCliente ?? "").length,
  proyecto: (d.proyecto ?? "").length,
  modulos: (d.modulos ?? "").length,
  tecnologias: (d.tecnologias ?? "").length,
  montoTotal: (d.montoTotal ?? "").length,
  inicial: (d.inicial ?? "").length,
  cuotas: (d.cuotas ?? "").length,
  penalidadAtrasoPago: (d.penalidadAtrasoPago ?? "").length,
  quienPoseeCodigo: (d.quienPoseeCodigo ?? "").length,
  jurisdiccion: (d.jurisdiccion ?? "").length,
  nombreServicio: (d.nombreServicio ?? "").length,
  descripcionAlcance: (d.descripcionAlcance ?? "").length,
  montoRecurrente: (d.montoRecurrente ?? "").length,
  facturacionYrenovacion: (d.facturacionYrenovacion ?? "").length,
  integracionAccesos: (d.integracionAccesos ?? "").length,
  disponibilidad: (d.disponibilidad ?? "").length,
  licenciaUso: (d.licenciaUso ?? "").length,
  tarifaUnica: (d.tarifaUnica ?? "").length,
});

type CharLens = ReturnType<typeof computeLens>;

function SubmitButton({ isPending }: { isPending: boolean }) {
  return <PrimaryButton disabled={isPending}>{isPending ? "Generando PDF…" : "Generar y descargar PDF"}</PrimaryButton>;
}

function mapFieldErrorsToList(fe: Record<string, string> | undefined) {
  if (!fe) {
    return undefined;
  }
  return Object.entries(fe).map(([fieldKey, message]) => ({
    fieldKey,
    fieldLabel: ZOD_FIELD_LABELS[fieldKey] ?? fieldKey,
    message,
  }));
}

export function ContractGeneratorForm() {
  const [state, formAction] = useActionState<ContractGenerateState, FormData>(generateContractAction, null);
  const [isPending, startTransition] = useTransition();
  const [ready, setReady] = useState(false);
  const [defaults, setDefaults] = useState<Record<string, string> | null>(null);
  const [numFirmas, setNumFirmas] = useState<1 | 2 | 3>(3);
  const [lens, setLens] = useState<CharLens | null>(null);
  const [kind, setKind] = useState<ContractTemplateId>("DESARROLLO_SOFTWARE");
  const [activeStep, setActiveStep] = useState(0);
  const [formRemountKey, setFormRemountKey] = useState(0);
  const [clientDateError, setClientDateError] = useState<string | null>(null);
  const doneRef = useRef<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const sig1 = useRef<SignaturePadHandle>(null);
  const sig2 = useRef<SignaturePadHandle>(null);
  const sig3 = useRef<SignaturePadHandle>(null);

  const selected = CONTRACT_CATALOG.find((c) => c.id === kind);
  const isAvailable = selected?.available === true;
  const fieldErrors = state?.ok === false ? state.fieldErrors : undefined;
  const fe = (k: string) => fieldErrors?.[k];
  const stepWrap = (i: number) => (i === activeStep ? "space-y-4" : "hidden");
  const steps = kind === "SAAS" ? SAAS_STEPS : DEV_STEPS;
  const lastStep = steps.length - 1;

  useEffect(() => {
    const { values, numFirmas: n, kind: k } = readDraft();
    setDefaults(values);
    setNumFirmas(n);
    setKind(k);
    setLens(computeLens(values));
    setReady(true);
  }, []);

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

  useEffect(() => {
    if (!ready) {
      return;
    }
    const el = formRef.current;
    if (!el) {
      return;
    }
    let t: number;
    const onSave = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        try {
          const fd = new FormData(el);
          const o: Record<string, string> = { numFirmas: String(numFirmas), kind: String(kind) };
          fd.forEach((v, k) => {
            if (typeof v !== "string") {
              return;
            }
            if (k === "kind" || k.startsWith("firma")) {
              return;
            }
            o[k] = v;
          });
          localStorage.setItem(STORAGE_KEY, JSON.stringify(o));
        } catch {
          /* almacenamiento lleno o deshabilitado */
        }
      }, 600);
    };
    el.addEventListener("input", onSave);
    el.addEventListener("change", onSave);
    return () => {
      el.removeEventListener("input", onSave);
      el.removeEventListener("change", onSave);
      window.clearTimeout(t);
    };
  }, [ready, numFirmas, formRemountKey, kind]);

  const handleUpdateLen = (name: keyof CharLens) => (v: string) => {
    setLens((prev) => {
      if (!prev) {
        return prev;
      }
      return { ...prev, [name]: v.length };
    });
  };

  const setFieldLen = (name: keyof CharLens) => (n: number) => {
    setLens((prev) => (prev ? { ...prev, [name]: n } : prev));
  };

  const handleGoNext = () => {
    if (clientDateError) {
      return;
    }
    setActiveStep((s) => Math.min(s + 1, lastStep));
  };

  const handleGoBack = () => {
    setActiveStep((s) => Math.max(s - 1, 0));
  };

  const handleClearDraft = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* */
    }
    const v = staticDefaults();
    setDefaults(v);
    setNumFirmas(3);
    setKind("DESARROLLO_SOFTWARE");
    setActiveStep(0);
    setLens(computeLens(v));
    setFormRemountKey((k) => k + 1);
  };

  const onSubmitForm = (e: FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    const fIn = form.fechaInicio;
    const a = fIn && "value" in fIn ? String(fIn.value).trim() : "";
    if (kind === "SAAS") {
      const fP = form.fechaFinPlazo;
      const b = fP && "value" in fP ? String(fP.value).trim() : "";
      if (b && a && b < a) {
        e.preventDefault();
        setClientDateError("La fecha de cierre/renovación no puede ser anterior a la de inicio de vigencia.");
        return;
      }
    } else {
      const fEn = form.fechaEntrega;
      const b = fEn && "value" in fEn ? String(fEn.value).trim() : "";
      if (b && a && b < a) {
        e.preventDefault();
        setClientDateError("La fecha de entrega no puede ser anterior a la de inicio.");
        return;
      }
    }
    setClientDateError(null);
    e.preventDefault();
    const fd = new FormData(form);
    fd.set("firmaColaborador1Png", sig1.current?.getPngBase64() ?? "");
    fd.set("firmaColaborador2Png", sig2.current?.getPngBase64() ?? "");
    fd.set("firmaColaborador3Png", sig3.current?.getPngBase64() ?? "");
    startTransition(() => {
      void formAction(fd);
    });
  };

  if (!ready || !defaults || !lens) {
    return (
      <Card>
        <p className="text-sm text-muted-foreground" role="status">
          Cargando formulario y borrador local…
        </p>
      </Card>
    );
  }

  const dV = (name: keyof typeof defaults) => String(defaults[name] ?? "");

  return (
    <form
      key={formRemountKey}
      ref={formRef}
      onSubmit={onSubmitForm}
      className="space-y-6"
      encType="multipart/form-data"
      method="post"
      noValidate
    >
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

      {state?.ok === false ? (
        <FormAlert
          type="err"
          message={state.error}
          fieldErrors={mapFieldErrorsToList(fieldErrors)}
        />
      ) : null}
      {state?.ok && state.download ? (
        <FormAlert type="ok" message="Descarga iniciada. Guarde el archivo y revíselo con asesoría legal." />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
        <p className="text-muted-foreground" aria-hidden="true">
          Paso {activeStep + 1} de {steps.length}: <strong className="text-foreground">{steps[activeStep]!.title}</strong>
        </p>
        <div className="flex flex-wrap gap-2">
          <GhostButton
            type="button"
            onClick={handleClearDraft}
            aria-label="Borrar borrador guardado en este navegador"
          >
            Borrar borrador
          </GhostButton>
        </div>
      </div>

      {!isAvailable ? (
        <Card>
          <p className="text-sm text-foreground">Este tipo de plantilla aún se está integrando. Por ahora use «Desarrollo de software».</p>
        </Card>
      ) : (
        <>
          <ol className="flex list-none flex-wrap gap-1 text-xs" aria-label="Progreso del asistente">
            {steps.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setActiveStep(i)}
                  className={
                    "rounded-md px-2 py-1 " +
                    (i === activeStep
                      ? "bg-primary text-primary-foreground"
                      : i < activeStep
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground")
                  }
                  aria-current={i === activeStep ? "step" : undefined}
                >
                  {i + 1}
                </button>
              </li>
            ))}
          </ol>

          <section className={stepWrap(0)} aria-labelledby="step-partes">
            <h3 id="step-partes" className="text-sm font-semibold text-foreground">
              {steps[0]!.title}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className={labelBoxClass + " sm:col-span-2"}>
                <Label htmlFor="empresaDesarrolladora">
                  {kind === "SAAS"
                    ? "Empresa o razón social del proveedor (EL PROVEEDOR) *"
                    : "Empresa o razón social del proveedor (EL PRESTADOR) *"}
                </Label>
                {fe("empresaDesarrolladora") ? (
                  <p id="empresaDesarrolladora-err" className="text-destructive text-xs" role="alert">
                    {fe("empresaDesarrolladora")}
                  </p>
                ) : null}
                <input
                  className={inputClass}
                  id="empresaDesarrolladora"
                  name="empresaDesarrolladora"
                  required
                  maxLength={300}
                  defaultValue={dV("empresaDesarrolladora")}
                  placeholder="Ej. ONEMAX, S. R. L. — RNC …"
                  aria-describedby={
                    [fe("empresaDesarrolladora") && "empresaDesarrolladora-err", "empresaDesarrolladora-count"]
                      .filter(Boolean)
                      .join(" ") || "empresaDesarrolladora-count"
                  }
                  aria-invalid={fe("empresaDesarrolladora") ? true : undefined}
                  onInput={(e) => handleUpdateLen("empresaDesarrolladora")((e.target as HTMLInputElement).value)}
                />
                <p className="text-right text-xs text-muted-foreground" id="empresaDesarrolladora-count" aria-live="polite">
                  {lens.empresaDesarrolladora} / 300
                </p>
              </div>
              <div className={labelBoxClass + " sm:col-span-2"}>
                <Label htmlFor="representanteDesarrollador">
                  {kind === "SAAS" ? "Representante de EL PROVEEDOR *" : "Representante de EL PRESTADOR *"}
                </Label>
                {fe("representanteDesarrollador") ? (
                  <p id="representanteDesarrollador-err" className="text-destructive text-xs" role="alert">
                    {fe("representanteDesarrollador")}
                  </p>
                ) : null}
                <input
                  className={inputClass}
                  id="representanteDesarrollador"
                  name="representanteDesarrollador"
                  required
                  maxLength={200}
                  defaultValue={dV("representanteDesarrollador")}
                  placeholder="Nombre completo, cargo: Representante legal / Director de proyectos"
                  aria-describedby={
                    [fe("representanteDesarrollador") && "representanteDesarrollador-err", "representanteDesarrollador-count"]
                      .filter(Boolean)
                      .join(" ") || "representanteDesarrollador-count"
                  }
                  aria-invalid={fe("representanteDesarrollador") ? true : undefined}
                  onInput={(e) => handleUpdateLen("representanteDesarrollador")((e.target as HTMLInputElement).value)}
                />
                <p
                  className="text-right text-xs text-muted-foreground"
                  id="representanteDesarrollador-count"
                  aria-live="polite"
                >
                  {lens.representanteDesarrollador} / 200
                </p>
              </div>
              <div className={labelBoxClass + " sm:col-span-2"}>
                <Label htmlFor="clienteEmpresa">Empresa del cliente (EL CLIENTE) *</Label>
                {fe("clienteEmpresa") ? (
                  <p id="clienteEmpresa-err" className="text-destructive text-xs" role="alert">
                    {fe("clienteEmpresa")}
                  </p>
                ) : null}
                <input
                  className={inputClass}
                  id="clienteEmpresa"
                  name="clienteEmpresa"
                  required
                  maxLength={300}
                  defaultValue={dV("clienteEmpresa")}
                  placeholder="Razón social, nombre comercial o 'persona natural' con nombre completo"
                  aria-describedby={
                    [fe("clienteEmpresa") && "clienteEmpresa-err", "clienteEmpresa-count"].filter(Boolean).join(" ") ||
                    "clienteEmpresa-count"
                  }
                  aria-invalid={fe("clienteEmpresa") ? true : undefined}
                  onInput={(e) => handleUpdateLen("clienteEmpresa")((e.target as HTMLInputElement).value)}
                />
                <p className="text-right text-xs text-muted-foreground" id="clienteEmpresa-count" aria-live="polite">
                  {lens.clienteEmpresa} / 300
                </p>
              </div>
              <div className={labelBoxClass + " sm:col-span-2"}>
                <Label htmlFor="nombreCliente">Nombre del representante del cliente *</Label>
                {fe("nombreCliente") ? (
                  <p id="nombreCliente-err" className="text-destructive text-xs" role="alert">
                    {fe("nombreCliente")}
                  </p>
                ) : null}
                <input
                  className={inputClass}
                  id="nombreCliente"
                  name="nombreCliente"
                  required
                  maxLength={200}
                  defaultValue={dV("nombreCliente")}
                  placeholder="Nombre, apellido y, si aplica, cargo o «propietario» / «apoderado»"
                  aria-describedby={
                    [fe("nombreCliente") && "nombreCliente-err", "nombreCliente-count"].filter(Boolean).join(" ") ||
                    "nombreCliente-count"
                  }
                  aria-invalid={fe("nombreCliente") ? true : undefined}
                  onInput={(e) => handleUpdateLen("nombreCliente")((e.target as HTMLInputElement).value)}
                />
                <p className="text-right text-xs text-muted-foreground" id="nombreCliente-count" aria-live="polite">
                  {lens.nombreCliente} / 200
                </p>
              </div>
            </div>
          </section>

          <section className={stepWrap(1)} aria-labelledby="step-proyecto">
            <h3 id="step-proyecto" className="text-sm font-semibold text-foreground">
              {steps[1]!.title}
            </h3>
            <p className="text-sm text-muted-foreground" id="paste-help-global">
              {PASTE_HELP}
            </p>
            {kind === "DESARROLLO_SOFTWARE" ? (
              <>
                <div className={labelBoxClass}>
                  <Label htmlFor="proyecto">Nombre del sistema / proyecto *</Label>
                  {fe("proyecto") ? (
                    <p id="proyecto-err" className="text-destructive text-xs" role="alert">
                      {fe("proyecto")}
                    </p>
                  ) : null}
                  <input
                    className={inputClass}
                    id="proyecto"
                    name="proyecto"
                    required
                    maxLength={500}
                    defaultValue={dV("proyecto")}
                    placeholder="Ej. POS y stock multi-sucursal, panel admin y caja (detalle mínimo para identificar el acto)"
                    aria-describedby={["paste-help-global", "proyecto-count", fe("proyecto") && "proyecto-err"]
                      .filter(Boolean)
                      .join(" ")}
                    onInput={(e) => handleUpdateLen("proyecto")((e.target as HTMLInputElement).value)}
                    aria-invalid={fe("proyecto") ? true : undefined}
                  />
                  <p className="text-right text-xs text-muted-foreground" id="proyecto-count" aria-live="polite">
                    {lens.proyecto} / 500
                  </p>
                </div>
                <div className={labelBoxClass}>
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <Label htmlFor="modulos">Módulos y funciones / alcance *</Label>
                  </div>
                  {fe("modulos") ? (
                    <p id="modulos-err" className="text-destructive text-xs" role="alert">
                      {fe("modulos")}
                    </p>
                  ) : null}
                  <ContractRichTextField
                    key={`rtf-modulos-${formRemountKey}`}
                    remountKey={formRemountKey}
                    name="modulos"
                    id="modulos"
                    defaultValue={dV("modulos")}
                    maxLength={20000}
                    requiredField
                    placeholder="Ej. inventario, ventas, reportes, roles (admin, cajero)… (use listas del editor, no Word pegado sin limpiar.)"
                    minHeightClass="min-h-[120px]"
                    aria-describedby={["paste-help-global", "modulos-count", fe("modulos") && "modulos-err"]
                      .filter(Boolean)
                      .join(" ")}
                    aria-invalid={fe("modulos") ? true : undefined}
                    onPlainLengthChange={setFieldLen("modulos")}
                  />
                  <p className="text-right text-xs text-muted-foreground" id="modulos-count" aria-live="polite">
                    {lens.modulos} / 20000
                  </p>
                </div>
                <div className={labelBoxClass}>
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <Label htmlFor="tecnologias">Tecnologías (stack, frameworks, requisitos técnicos)</Label>
                  </div>
                  <ContractRichTextField
                    key={`rtf-tecnologias-${formRemountKey}`}
                    remountKey={formRemountKey}
                    name="tecnologias"
                    id="tecnologias"
                    defaultValue={dV("tecnologias")}
                    maxLength={5000}
                    placeholder="Next.js, NestJS, PostgreSQL, hosting, dominio, SSL, respaldos…"
                    minHeightClass="min-h-[80px]"
                    aria-describedby="paste-help-global tecnologias-count"
                    onPlainLengthChange={setFieldLen("tecnologias")}
                  />
                  <p className="text-right text-xs text-muted-foreground" id="tecnologias-count" aria-live="polite">
                    {lens.tecnologias} / 5000
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className={labelBoxClass}>
                  <Label htmlFor="nombreServicio">Nombre comercial del servicio o producto (SaaS) *</Label>
                  {fe("nombreServicio") ? (
                    <p id="nombreServicio-err" className="text-destructive text-xs" role="alert">
                      {fe("nombreServicio")}
                    </p>
                  ) : null}
                  <input
                    className={inputClass}
                    id="nombreServicio"
                    name="nombreServicio"
                    required
                    maxLength={500}
                    defaultValue={dV("nombreServicio")}
                    placeholder="Ej. PosCloud — plan Estándar y módulo facturación"
                    aria-describedby={["paste-help-global", "nombreServicio-c", fe("nombreServicio") && "nombreServicio-err"]
                      .filter(Boolean)
                      .join(" ")}
                    onInput={(e) => handleUpdateLen("nombreServicio")((e.target as HTMLInputElement).value)}
                    aria-invalid={fe("nombreServicio") ? true : undefined}
                  />
                  <p className="text-right text-xs text-muted-foreground" id="nombreServicio-c" aria-live="polite">
                    {lens.nombreServicio} / 500
                  </p>
                </div>
                <div className={labelBoxClass}>
                  <Label htmlFor="descripcionAlcance">Alcance, planes, límites, exclusiones y funcionalidades *</Label>
                  {fe("descripcionAlcance") ? (
                    <p id="descripcionAlcance-err" className="text-destructive text-xs" role="alert">
                      {fe("descripcionAlcance")}
                    </p>
                  ) : null}
                  <ContractRichTextField
                    key={`rtf-saas-alcance-${formRemountKey}`}
                    remountKey={formRemountKey}
                    name="descripcionAlcance"
                    id="descripcionAlcance"
                    defaultValue={dV("descripcionAlcance")}
                    maxLength={20000}
                    requiredField
                    placeholder="Usuarios, almacenamiento, módulos, entornos (producción/pruebas), exclusión de personalización a medida, etc."
                    minHeightClass="min-h-[120px]"
                    aria-describedby={["paste-help-global", "descripcionAlcance-c", fe("descripcionAlcance") && "descripcionAlcance-err"]
                      .filter(Boolean)
                      .join(" ")}
                    aria-invalid={fe("descripcionAlcance") ? true : undefined}
                    onPlainLengthChange={setFieldLen("descripcionAlcance")}
                  />
                  <p className="text-right text-xs text-muted-foreground" id="descripcionAlcance-c" aria-live="polite">
                    {lens.descripcionAlcance} / 20000
                  </p>
                </div>
                <div className={labelBoxClass}>
                  <Label htmlFor="integracionAccesos">Requisitos de acceso, SSO, integraciones, API (opcional)</Label>
                  <ContractRichTextField
                    key={`rtf-saas-integ-${formRemountKey}`}
                    remountKey={formRemountKey}
                    name="integracionAccesos"
                    id="integracionAccesos"
                    defaultValue={dV("integracionAccesos")}
                    maxLength={5000}
                    placeholder="VPN, IP permitidas, conector contable, webhooks, etc."
                    minHeightClass="min-h-[80px]"
                    aria-describedby="paste-help-global integracionAccesos-c"
                    onPlainLengthChange={setFieldLen("integracionAccesos")}
                  />
                  <p className="text-right text-xs text-muted-foreground" id="integracionAccesos-c" aria-live="polite">
                    {lens.integracionAccesos} / 5000
                  </p>
                </div>
              </>
            )}
          </section>

          <section className={stepWrap(2)} aria-labelledby="step-precio">
            <h3 id="step-precio" className="text-sm font-semibold text-foreground">
              {steps[2]!.title}
            </h3>
            <p className="text-sm text-muted-foreground" id="moneda-desc">
              Elija con qué moneda deben leerse los importes de este acto. Si escribe cifras mezcladas, use «En el texto
              (libre)» y detalle en cada campo.
            </p>
            <div className={labelBoxClass}>
              <Label htmlFor="monedaReferencia">Moneda de referencia *</Label>
              {fe("monedaReferencia") ? (
                <p id="monedaReferencia-err" className="text-destructive text-xs" role="alert">
                  {fe("monedaReferencia")}
                </p>
              ) : null}
              <select
                id="monedaReferencia"
                name="monedaReferencia"
                className={selectClass + " max-w-sm"}
                required
                defaultValue={dV("monedaReferencia") || "DOP"}
                aria-describedby={["moneda-desc", fe("monedaReferencia") && "monedaReferencia-err"].filter(Boolean).join(" ")}
              >
                <option value="DOP">Peso dominicano (RD$ / DOP)</option>
                <option value="USD">Dólar estadounidense (USD)</option>
                <option value="LIBRE">En el texto (libre — cifra explícita en montos)</option>
              </select>
            </div>
            {kind === "DESARROLLO_SOFTWARE" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className={labelBoxClass + " sm:col-span-2"}>
                  <Label htmlFor="montoTotal">Monto total *</Label>
                  {fe("montoTotal") ? (
                    <p id="montoTotal-err" className="text-destructive text-xs" role="alert">
                      {fe("montoTotal")}
                    </p>
                  ) : null}
                  <input
                    className={inputClass}
                    id="montoTotal"
                    name="montoTotal"
                    required
                    maxLength={200}
                    defaultValue={dV("montoTotal")}
                    placeholder="Ej. RD$ 150,000.00; USD 5,000.00; o cifra acorde a su elección de moneda"
                    aria-describedby={fe("montoTotal") ? "montoTotal-err" : undefined}
                    onInput={(e) => handleUpdateLen("montoTotal")((e.target as HTMLInputElement).value)}
                  />
                  <p className="text-right text-xs text-muted-foreground" aria-live="polite">
                    {lens.montoTotal} / 200
                  </p>
                </div>
                <div className={labelBoxClass}>
                  <Label htmlFor="inicial">Pago inicial *</Label>
                  {fe("inicial") ? (
                    <p id="inicial-err" className="text-destructive text-xs" role="alert">
                      {fe("inicial")}
                    </p>
                  ) : null}
                  <input
                    className={inputClass}
                    id="inicial"
                    name="inicial"
                    required
                    maxLength={200}
                    defaultValue={dV("inicial")}
                    placeholder="Ej. 50% al aprobar, o RD$ 30,000.00 a la firma"
                    aria-describedby={fe("inicial") ? "inicial-err" : undefined}
                    onInput={(e) => handleUpdateLen("inicial")((e.target as HTMLInputElement).value)}
                  />
                  <p className="text-right text-xs text-muted-foreground" aria-live="polite">
                    {lens.inicial} / 200
                  </p>
                </div>
                <div className={labelBoxClass + " sm:col-span-2"}>
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <Label htmlFor="cuotas">Restante / cuotas *</Label>
                  </div>
                  {fe("cuotas") ? (
                    <p id="cuotas-err" className="text-destructive text-xs" role="alert">
                      {fe("cuotas")}
                    </p>
                  ) : null}
                  <ContractRichTextField
                    key={`rtf-cuotas-${formRemountKey}`}
                    remountKey={formRemountKey}
                    name="cuotas"
                    id="cuotas"
                    defaultValue={dV("cuotas")}
                    maxLength={2000}
                    requiredField
                    placeholder="Ej. 2 cuotas de RD$ 50,000.00 a los 30 y 60 días…"
                    minHeightClass="min-h-[88px]"
                    aria-describedby={["cuotas-len", fe("cuotas") && "cuotas-err"].filter(Boolean).join(" ")}
                    aria-invalid={fe("cuotas") ? true : undefined}
                    onPlainLengthChange={setFieldLen("cuotas")}
                  />
                  <p className="text-right text-xs text-muted-foreground" id="cuotas-len" aria-live="polite">
                    {lens.cuotas} / 2000
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className={labelBoxClass + " sm:col-span-2"}>
                  <Label htmlFor="montoRecurrente">Tarifa o monto del período (recurrente) *</Label>
                  {fe("montoRecurrente") ? (
                    <p id="montoRecurrente-err" className="text-destructive text-xs" role="alert">
                      {fe("montoRecurrente")}
                    </p>
                  ) : null}
                  <input
                    className={inputClass}
                    id="montoRecurrente"
                    name="montoRecurrente"
                    required
                    maxLength={200}
                    defaultValue={dV("montoRecurrente")}
                    placeholder="Ej. RD$ 4,500.00 / mes; USD 99.00 / mes"
                    onInput={(e) => handleUpdateLen("montoRecurrente")((e.target as HTMLInputElement).value)}
                    aria-describedby={fe("montoRecurrente") ? "montoRecurrente-err" : undefined}
                  />
                  <p className="text-right text-xs text-muted-foreground" aria-live="polite">
                    {lens.montoRecurrente} / 200
                  </p>
                </div>
                <div className={labelBoxClass}>
                  <Label htmlFor="periodoFacturacion">Periodicidad de facturación *</Label>
                  {fe("periodoFacturacion") ? (
                    <p className="text-destructive text-xs" id="per-err" role="alert">
                      {fe("periodoFacturacion")}
                    </p>
                  ) : null}
                  <select
                    id="periodoFacturacion"
                    name="periodoFacturacion"
                    className={selectClass + " max-w-sm"}
                    required
                    defaultValue={dV("periodoFacturacion") || "MENSUAL"}
                    aria-describedby={fe("periodoFacturacion") ? "per-err" : undefined}
                  >
                    <option value="MENSUAL">Mensual</option>
                    <option value="ANUAL">Anual</option>
                    <option value="TRIMESTRAL">Trimestral</option>
                    <option value="SEMESTRAL">Semestral</option>
                    <option value="OTRO">Otro (detallar en facturación y renovación)</option>
                  </select>
                </div>
                <div className={labelBoxClass}>
                  <Label htmlFor="tarifaUnica">Implementación, activación o tarifa única (opcional)</Label>
                  {fe("tarifaUnica") ? (
                    <p id="tarifaUnica-err" className="text-destructive text-xs" role="alert">
                      {fe("tarifaUnica")}
                    </p>
                  ) : null}
                  <input
                    className={inputClass}
                    id="tarifaUnica"
                    name="tarifaUnica"
                    maxLength={200}
                    defaultValue={dV("tarifaUnica")}
                    placeholder="Ej. RD$ 10,000.00 única, o 0"
                    onInput={(e) => handleUpdateLen("tarifaUnica")((e.target as HTMLInputElement).value)}
                  />
                  <p className="text-right text-xs text-muted-foreground" aria-live="polite">
                    {lens.tarifaUnica} / 200
                  </p>
                </div>
                <div className={labelBoxClass + " sm:col-span-2"}>
                  {fe("facturacionYrenovacion") ? (
                    <p id="fact-err" className="text-destructive text-xs" role="alert">
                      {fe("facturacionYrenovacion")}
                    </p>
                  ) : null}
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <Label htmlFor="facturacionYrenovacion">Vencimientos, renovación tácita, recargos y medios *</Label>
                  </div>
                  <ContractRichTextField
                    key={`rtf-saas-fact-${formRemountKey}`}
                    remountKey={formRemountKey}
                    name="facturacionYrenovacion"
                    id="facturacionYrenovacion"
                    defaultValue={dV("facturacionYrenovacion")}
                    maxLength={2000}
                    requiredField
                    placeholder="Día de cargo, días de gracia, IVA, suspensión por mora, etc."
                    minHeightClass="min-h-[88px]"
                    aria-describedby={["fact-len", fe("facturacionYrenovacion") && "fact-err"].filter(Boolean).join(" ")}
                    onPlainLengthChange={setFieldLen("facturacionYrenovacion")}
                  />
                  <p className="text-right text-xs text-muted-foreground" id="fact-len" aria-live="polite">
                    {lens.facturacionYrenovacion} / 2000
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className={stepWrap(3)} aria-labelledby="step-plazos">
            <h3 id="step-plazos" className="text-sm font-semibold text-foreground">
              {steps[3]!.title}
            </h3>
            {clientDateError ? (
              <p className="text-destructive text-sm" role="alert">
                {clientDateError}
              </p>
            ) : null}
            {kind === "DESARROLLO_SOFTWARE" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className={labelBoxClass}>
                  <Label htmlFor="diasHabiles">Días hábiles de desarrollo (estimado) *</Label>
                  {fe("diasHabiles") ? (
                    <p className="text-destructive text-xs" id="dias-err" role="alert">
                      {fe("diasHabiles")}
                    </p>
                  ) : null}
                  <input
                    className={inputClass}
                    id="diasHabiles"
                    name="diasHabiles"
                    type="number"
                    min={1}
                    max={3650}
                    required
                    defaultValue={dV("diasHabiles") || "90"}
                    aria-describedby={fe("diasHabiles") ? "dias-err" : undefined}
                    aria-invalid={fe("diasHabiles") ? true : undefined}
                  />
                </div>
                <div className={labelBoxClass}>
                  <Label htmlFor="fechaInicio">Fecha de inicio (referencia) *</Label>
                  {fe("fechaInicio") ? (
                    <p className="text-destructive text-xs" id="fini-err" role="alert">
                      {fe("fechaInicio")}
                    </p>
                  ) : null}
                  <input
                    className={inputClass}
                    id="fechaInicio"
                    name="fechaInicio"
                    type="date"
                    required
                    defaultValue={dV("fechaInicio") || todayStr()}
                    onChange={() => setClientDateError(null)}
                    aria-describedby={fe("fechaInicio") ? "fini-err" : undefined}
                  />
                </div>
                <div className={labelBoxClass + " sm:col-span-2"}>
                  <Label htmlFor="fechaEntrega">Fecha de entrega estimada (opcional; si queda en blanco se indica en texto genérico)</Label>
                  {fe("fechaEntrega") ? (
                    <p className="text-destructive text-xs" id="fent-err" role="alert">
                      {fe("fechaEntrega")}
                    </p>
                  ) : null}
                  <input
                    className={inputClass}
                    id="fechaEntrega"
                    name="fechaEntrega"
                    type="date"
                    defaultValue={dV("fechaEntrega")}
                    onChange={() => setClientDateError(null)}
                    aria-describedby={fe("fechaEntrega") ? "fent-err" : undefined}
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className={labelBoxClass}>
                  <Label htmlFor="compromisoMinimoMeses">Compromiso mínimo o permanencia (meses) *</Label>
                  {fe("compromisoMinimoMeses") ? (
                    <p className="text-destructive text-xs" id="com-err" role="alert">
                      {fe("compromisoMinimoMeses")}
                    </p>
                  ) : null}
                  <input
                    className={inputClass}
                    id="compromisoMinimoMeses"
                    name="compromisoMinimoMeses"
                    type="number"
                    min={0}
                    max={120}
                    required
                    defaultValue={dV("compromisoMinimoMeses") || "12"}
                    aria-describedby={fe("compromisoMinimoMeses") ? "com-err" : undefined}
                  />
                </div>
                <div className={labelBoxClass}>
                  <Label htmlFor="fechaInicio">Inicio de vigencia de la suscripción (referencia) *</Label>
                  {fe("fechaInicio") ? (
                    <p className="text-destructive text-xs" id="fini2-err" role="alert">
                      {fe("fechaInicio")}
                    </p>
                  ) : null}
                  <input
                    className={inputClass}
                    id="fechaInicio"
                    name="fechaInicio"
                    type="date"
                    required
                    defaultValue={dV("fechaInicio") || todayStr()}
                    onChange={() => setClientDateError(null)}
                    aria-describedby={fe("fechaInicio") ? "fini2-err" : undefined}
                  />
                </div>
                <div className={labelBoxClass + " sm:col-span-2"}>
                  <Label htmlFor="fechaFinPlazo">Fecha de cierre, renovación o término del plazo inicial (opcional)</Label>
                  {fe("fechaFinPlazo") ? (
                    <p className="text-destructive text-xs" id="ffp-err" role="alert">
                      {fe("fechaFinPlazo")}
                    </p>
                  ) : null}
                  <input
                    className={inputClass}
                    id="fechaFinPlazo"
                    name="fechaFinPlazo"
                    type="date"
                    defaultValue={dV("fechaFinPlazo")}
                    onChange={() => setClientDateError(null)}
                    aria-describedby={fe("fechaFinPlazo") ? "ffp-err" : undefined}
                  />
                </div>
              </div>
            )}
          </section>

          <section className={stepWrap(4)} aria-labelledby="step-riesgo">
            <h3 id="step-riesgo" className="text-sm font-semibold text-foreground">
              {steps[4]!.title}
            </h3>
            {kind === "DESARROLLO_SOFTWARE" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className={labelBoxClass}>
                  <Label htmlFor="mesesSoporte">Meses de soporte post-entrega *</Label>
                  {fe("mesesSoporte") ? (
                    <p className="text-destructive text-xs" id="ms-err" role="alert">
                      {fe("mesesSoporte")}
                    </p>
                  ) : null}
                  <input
                    className={inputClass}
                    id="mesesSoporte"
                    name="mesesSoporte"
                    type="number"
                    min={0}
                    max={120}
                    required
                    defaultValue={dV("mesesSoporte") || "3"}
                    aria-describedby={fe("mesesSoporte") ? "ms-err" : undefined}
                  />
                </div>
                <div className={labelBoxClass + " sm:col-span-2"}>
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <Label htmlFor="quienPoseeCodigo">Titularidad del código y entregables (tras pago) *</Label>
                  </div>
                  {fe("quienPoseeCodigo") ? (
                    <p id="quien-err" className="text-destructive text-xs" role="alert">
                      {fe("quienPoseeCodigo")}
                    </p>
                  ) : null}
                  <ContractRichTextField
                    key={`rtf-quien-${formRemountKey}`}
                    remountKey={formRemountKey}
                    name="quienPoseeCodigo"
                    id="quienPoseeCodigo"
                    defaultValue={dV("quienPoseeCodigo")}
                    maxLength={500}
                    requiredField
                    placeholder="Ej. EL CLIENTE, una vez abonado el ciento por ciento…"
                    minHeightClass="min-h-[72px]"
                    aria-describedby={["quien-c", fe("quienPoseeCodigo") && "quien-err"].filter(Boolean).join(" ")}
                    aria-invalid={fe("quienPoseeCodigo") ? true : undefined}
                    onPlainLengthChange={setFieldLen("quienPoseeCodigo")}
                  />
                  <p className="text-right text-xs text-muted-foreground" id="quien-c" aria-live="polite">
                    {lens.quienPoseeCodigo} / 500
                  </p>
                </div>
                <div className={labelBoxClass + " sm:col-span-2"}>
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <Label htmlFor="penalidadAtrasoPago">Penalidad o consecuencias por atraso en pago (opcional)</Label>
                  </div>
                  <ContractRichTextField
                    key={`rtf-penalidad-${formRemountKey}`}
                    remountKey={formRemountKey}
                    name="penalidadAtrasoPago"
                    id="penalidadAtrasoPago"
                    defaultValue={dV("penalidadAtrasoPago")}
                    maxLength={2000}
                    placeholder="Ej. interés moratorio, suspensión de acceso, costos de reactivación…"
                    minHeightClass="min-h-[72px]"
                    onPlainLengthChange={setFieldLen("penalidadAtrasoPago")}
                  />
                  <p className="text-right text-xs text-muted-foreground" aria-live="polite">
                    {lens.penalidadAtrasoPago} / 2000
                  </p>
                </div>
                <div className={labelBoxClass + " sm:col-span-2"}>
                  <Label htmlFor="jurisdiccion">Jurisdicción / leyes aplicables *</Label>
                  {fe("jurisdiccion") ? (
                    <p id="juris-err" className="text-destructive text-xs" role="alert">
                      {fe("jurisdiccion")}
                    </p>
                  ) : null}
                  <input
                    className={inputClass}
                    id="jurisdiccion"
                    name="jurisdiccion"
                    required
                    maxLength={500}
                    defaultValue={dV("jurisdiccion")}
                    aria-describedby={["jur-len", fe("jurisdiccion") && "juris-err"].filter(Boolean).join(" ")}
                    onInput={(e) => handleUpdateLen("jurisdiccion")((e.target as HTMLInputElement).value)}
                  />
                  <p className="text-right text-xs text-muted-foreground" id="jur-len" aria-live="polite">
                    {lens.jurisdiccion} / 500
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className={labelBoxClass}>
                  <Label htmlFor="mesesSoporte">Meses de soporte o mesa de ayuda incluidos (referencia) *</Label>
                  {fe("mesesSoporte") ? (
                    <p className="text-destructive text-xs" id="ms2-err" role="alert">
                      {fe("mesesSoporte")}
                    </p>
                  ) : null}
                  <input
                    className={inputClass}
                    id="mesesSoporte"
                    name="mesesSoporte"
                    type="number"
                    min={0}
                    max={120}
                    required
                    defaultValue={dV("mesesSoporte") || "3"}
                    aria-describedby={fe("mesesSoporte") ? "ms2-err" : undefined}
                  />
                </div>
                <div className={labelBoxClass + " sm:col-span-2"}>
                  <Label htmlFor="licenciaUso">Licencia de uso, datos en proveedor, titularidad (cloud) *</Label>
                  {fe("licenciaUso") ? (
                    <p id="lic-err" className="text-destructive text-xs" role="alert">
                      {fe("licenciaUso")}
                    </p>
                  ) : null}
                  <ContractRichTextField
                    key={`rtf-lic-${formRemountKey}`}
                    remountKey={formRemountKey}
                    name="licenciaUso"
                    id="licenciaUso"
                    defaultValue={dV("licenciaUso")}
                    maxLength={2000}
                    requiredField
                    placeholder="Derecho de acceso, datos alojados en tercero, no sublicencia, cese del acceso al vencimiento, etc."
                    minHeightClass="min-h-[88px]"
                    aria-describedby={["lic-c", fe("licenciaUso") && "lic-err"].filter(Boolean).join(" ")}
                    onPlainLengthChange={setFieldLen("licenciaUso")}
                  />
                  <p className="text-right text-xs text-muted-foreground" id="lic-c" aria-live="polite">
                    {lens.licenciaUso} / 2000
                  </p>
                </div>
                <div className={labelBoxClass + " sm:col-span-2"}>
                  <Label htmlFor="disponibilidad">Disponibilidad, SLA, horario de soporte, exclusiones (opcional)</Label>
                  <ContractRichTextField
                    key={`rtf-sla-${formRemountKey}`}
                    remountKey={formRemountKey}
                    name="disponibilidad"
                    id="disponibilidad"
                    defaultValue={dV("disponibilidad")}
                    maxLength={2000}
                    placeholder="Ej. ~99% mensual (objetivo), excl. fuerza mayor, ventana de mantenimiento…"
                    minHeightClass="min-h-[72px]"
                    aria-describedby="dis-c"
                    onPlainLengthChange={setFieldLen("disponibilidad")}
                  />
                  <p className="text-right text-xs text-muted-foreground" id="dis-c" aria-live="polite">
                    {lens.disponibilidad} / 2000
                  </p>
                </div>
                <div className={labelBoxClass + " sm:col-span-2"}>
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <Label htmlFor="penalidadAtrasoPago">Penalidad o suspensión por atraso en pago (opcional)</Label>
                  </div>
                  <ContractRichTextField
                    key={`rtf-saas-penal-${formRemountKey}`}
                    remountKey={formRemountKey}
                    name="penalidadAtrasoPago"
                    id="penalidadAtrasoPago"
                    defaultValue={dV("penalidadAtrasoPago")}
                    maxLength={2000}
                    placeholder="Suspensión de acceso, interés, reactivación…"
                    minHeightClass="min-h-[72px]"
                    onPlainLengthChange={setFieldLen("penalidadAtrasoPago")}
                  />
                  <p className="text-right text-xs text-muted-foreground" aria-live="polite">
                    {lens.penalidadAtrasoPago} / 2000
                  </p>
                </div>
                <div className={labelBoxClass + " sm:col-span-2"}>
                  <Label htmlFor="jurisdiccion2">Jurisdicción / leyes aplicables *</Label>
                  {fe("jurisdiccion") ? (
                    <p id="juris2-err" className="text-destructive text-xs" role="alert">
                      {fe("jurisdiccion")}
                    </p>
                  ) : null}
                  <input
                    className={inputClass}
                    id="jurisdiccion2"
                    name="jurisdiccion"
                    required
                    maxLength={500}
                    defaultValue={dV("jurisdiccion")}
                    aria-describedby={["jur2-len", fe("jurisdiccion") && "juris2-err"].filter(Boolean).join(" ")}
                    onInput={(e) => handleUpdateLen("jurisdiccion")((e.target as HTMLInputElement).value)}
                  />
                  <p className="text-right text-xs text-muted-foreground" id="jur2-len" aria-live="polite">
                    {lens.jurisdiccion} / 500
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className={stepWrap(5)} aria-labelledby="step-cierre">
            <h3 id="step-cierre" className="text-sm font-semibold text-foreground">
              {steps[5]!.title}
            </h3>
            <div className={labelBoxClass}>
              <Label htmlFor="fechaHoy">Fecha de firma del documento (referencia en el cierre) *</Label>
              {fe("fechaHoy") ? (
                <p id="fechaHoy-err" className="text-destructive text-xs" role="alert">
                  {fe("fechaHoy")}
                </p>
              ) : null}
              <input
                className={inputClass + " max-w-xs"}
                id="fechaHoy"
                name="fechaHoy"
                type="date"
                required
                defaultValue={dV("fechaHoy") || todayStr()}
                aria-describedby={fe("fechaHoy") ? "fechaHoy-err" : undefined}
                aria-invalid={fe("fechaHoy") ? true : undefined}
              />
            </div>
          </section>

          <section className={stepWrap(6)} aria-labelledby="step-firmas">
            <h3 id="step-firmas" className="text-sm font-semibold text-foreground">
              {steps[6]!.title}
            </h3>
            <p className="text-sm text-muted-foreground" id="firmas-intro">
              En el PDF se añade una hoja con tres celdas alineadas (como en el esquema). Complete solo las que necesite; las
              vacías quedan con espacio para firmar a mano al imprimir. Los trazos de este formulario se insertan bajo
              {kind === "SAAS" ? " EL PROVEEDOR" : " EL PRESTADOR"}.
            </p>
            <div className={labelBoxClass}>
              <Label htmlFor="numFirmasUi">Firmas de colaborador a capturar</Label>
              <select
                id="numFirmasUi"
                className={selectClass + " max-w-sm"}
                value={numFirmas}
                onChange={(e) => setNumFirmas(parseInt(e.target.value, 10) as 1 | 2 | 3)}
                aria-describedby="firmas-intro"
              >
                <option value={1}>1 firma (comercial)</option>
                <option value={2}>2 firmas (comerciales)</option>
                <option value={3}>3 firmas (comerciales)</option>
              </select>
            </div>
            <p className="text-xs text-muted-foreground" aria-hidden="true">
              Vista aproximada: celdas subrayadas en el PDF, izquierda a derecha, Colaborador 1 a 3. Las celdas que deje
              en blanco siguen reservando espacio.
            </p>
            <div
              className="mb-4 flex flex-wrap gap-2"
              role="img"
              aria-label="Celdas de firma: las primeras N según su elección son las activas; el resto, espacio al imprimir"
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={
                    "flex h-20 w-28 flex-col items-center justify-end rounded border-2 " +
                    (i < numFirmas
                      ? "border-primary/70 bg-primary/5"
                      : "border-dashed border-border bg-muted/20 opacity-80")
                  }
                >
                  <span className="p-1 text-center text-[0.65rem] text-muted-foreground">
                    Col. {i + 1}
                    {i < numFirmas ? " (dibuje abajo)" : " (en blanco en el form.)"}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground" id="sign-help">
              Firme con el dedo, lápiz óptico o mouse. Use <strong>Limpiar</strong> si se equivocó. Si deja en blanco, se
              reservará en el impreso.
            </p>
            <div
              className="grid gap-6 sm:grid-cols-3"
              id="sign-grid"
              aria-describedby="sign-help"
              aria-label="Tres recuadros consecutivos: use los primeros según cuántas firmas indicó arriba; el resto puede dejarse en blanco"
            >
              <div>
                <SignaturePad ref={sig1} label="Colaborador 1" />
              </div>
              <div className={numFirmas < 2 ? "opacity-50" : ""}>
                <SignaturePad ref={sig2} label="Colaborador 2" />
              </div>
              <div className={numFirmas < 3 ? "opacity-50" : ""}>
                <SignaturePad ref={sig3} label="Colaborador 3" />
              </div>
            </div>
            {numFirmas < 3 ? (
              <p className="text-sm text-muted-foreground">
                Los recuadros atenuados no suelen ser necesarios; el PDF siempre reserva tres celdas. Deje en blanco lo que
                no use.
              </p>
            ) : null}
          </section>
        </>
      )}

      {isAvailable ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            {activeStep > 0 ? (
              <button
                type="button"
                onClick={handleGoBack}
                className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground shadow-sm transition hover:bg-muted"
                aria-label="Paso anterior"
              >
                Anterior
              </button>
            ) : null}
            {activeStep < lastStep ? (
              <button
                type="button"
                onClick={handleGoNext}
                className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground shadow-sm transition hover:bg-muted"
                aria-label="Paso siguiente"
              >
                Siguiente
              </button>
            ) : null}
          </div>
          {activeStep === lastStep ? <SubmitButton isPending={isPending} /> : null}
        </div>
      ) : null}
      {isAvailable ? (
        <Muted>
          Se genera un <strong>PDF</strong> listo para imprimir o compartir. Complemente con cédula/RNC y anexos legales
          según su caso; revise con un asesor antes de firmar. El borrador de este formulario se guarda de forma local en
          su navegador mientras rellene (no se envía al servidor hasta generar el PDF).
        </Muted>
      ) : null}
    </form>
  );
}
