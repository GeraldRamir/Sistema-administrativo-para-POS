"use server";

import { desarrolloSoftwareContractSchema, saasContractSchema } from "@/lib/validators";
import type { ZodError } from "zod";
import { buildDesarrolloSoftwarePdf } from "@/lib/contract-pdf/desarrollo-software-pdf";
import { buildSaaSContractPdf } from "@/lib/contract-pdf/saas-pdf";
import { desarrolloSoftwareFileName } from "@/lib/contract-templates/desarrollo-software";
import { saasFileName } from "@/lib/contract-templates/saas";

/** Tamaño máx. decodificado (PNG de firma dibujada en pantalla) */
const MAX_SIGNATURE_PNG = 1_000_000;

export type ContractGenerateState =
  | null
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | { ok: true; download: { name: string; pdfBase64: string } };

function err(m: string, fieldErrors?: Record<string, string>): ContractGenerateState {
  return { ok: false, error: m, ...(fieldErrors ? { fieldErrors } : {}) };
}

function zodErrorToFieldMap(issue: ZodError): Record<string, string> {
  const o: Record<string, string> = {};
  for (const i of issue.issues) {
    const p = i.path[0];
    const k = p !== undefined && p !== null ? String(p) : "";
    if (!k || o[k]) {
      continue;
    }
    o[k] = i.message;
  }
  return o;
}

/** Acepta base64 (del canvas `toDataURL`) o cadena vacía. Valida cabecera PNG. */
function pngBase64ToBuffer(raw: string | null, label: string): Buffer | null {
  if (raw == null) {
    return null;
  }
  const t = String(raw).trim();
  if (!t) {
    return null;
  }
  if (t.length > 1_500_000) {
    throw new Error(`${label}: trazo de firma demasiado extenso. Limpie y vuelva a firmar.`);
  }
  let buf: Buffer;
  try {
    buf = Buffer.from(t, "base64");
  } catch {
    throw new Error(`${label}: datos de firma no legibles.`);
  }
  if (buf.length > MAX_SIGNATURE_PNG) {
    throw new Error(`${label}: la firma genera una imagen demasiado grande. Reduzca trazos o ancho.`);
  }
  if (buf.length < 8) {
    return null;
  }
  if (buf[0] !== 0x89 || buf[1] !== 0x50) {
    throw new Error(`${label}: solo se acepta PNG generado en el recuadro.`);
  }
  return buf;
}

export async function generateContractAction(
  _prev: ContractGenerateState,
  formData: FormData,
): Promise<ContractGenerateState> {
  const kind = String(formData.get("kind") ?? "").trim();

  if (kind === "SAAS") {
    const rawSaaS = {
      empresaDesarrolladora: String(formData.get("empresaDesarrolladora") ?? ""),
      representanteDesarrollador: String(formData.get("representanteDesarrollador") ?? ""),
      clienteEmpresa: String(formData.get("clienteEmpresa") ?? ""),
      nombreCliente: String(formData.get("nombreCliente") ?? ""),
      nombreServicio: String(formData.get("nombreServicio") ?? ""),
      descripcionAlcance: String(formData.get("descripcionAlcance") ?? ""),
      monedaReferencia: String(formData.get("monedaReferencia") ?? "DOP"),
      montoRecurrente: String(formData.get("montoRecurrente") ?? ""),
      periodoFacturacion: String(formData.get("periodoFacturacion") ?? "MENSUAL"),
      tarifaUnica: String(formData.get("tarifaUnica") ?? ""),
      facturacionYrenovacion: String(formData.get("facturacionYrenovacion") ?? ""),
      compromisoMinimoMeses: formData.get("compromisoMinimoMeses"),
      fechaInicio: String(formData.get("fechaInicio") ?? ""),
      fechaFinPlazo: String(formData.get("fechaFinPlazo") ?? ""),
      integracionAccesos: String(formData.get("integracionAccesos") ?? ""),
      disponibilidad: String(formData.get("disponibilidad") ?? ""),
      licenciaUso: String(formData.get("licenciaUso") ?? ""),
      mesesSoporte: formData.get("mesesSoporte"),
      penalidadAtrasoPago: String(formData.get("penalidadAtrasoPago") ?? ""),
      jurisdiccion: String(formData.get("jurisdiccion") ?? ""),
      fechaHoy: String(formData.get("fechaHoy") ?? ""),
    };

    const parsedS = saasContractSchema.safeParse(rawSaaS);
    if (!parsedS.success) {
      return err("Revise los campos señalados e inténtelo de nuevo.", zodErrorToFieldMap(parsedS.error));
    }

    let sig1: Buffer | null = null;
    let sig2: Buffer | null = null;
    let sig3: Buffer | null = null;
    try {
      const g1 = formData.get("firmaColaborador1Png");
      const g2 = formData.get("firmaColaborador2Png");
      const g3 = formData.get("firmaColaborador3Png");
      sig1 = pngBase64ToBuffer(typeof g1 === "string" ? g1 : null, "Colaborador 1");
      sig2 = pngBase64ToBuffer(typeof g2 === "string" ? g2 : null, "Colaborador 2");
      sig3 = pngBase64ToBuffer(typeof g3 === "string" ? g3 : null, "Colaborador 3");
    } catch (e) {
      return err(e instanceof Error ? e.message : "Error al leer la firma.");
    }

    const pdf = await buildSaaSContractPdf(parsedS.data, [sig1, sig2, sig3]);
    return {
      ok: true,
      download: { name: saasFileName(parsedS.data.nombreServicio, "pdf"), pdfBase64: pdf.toString("base64") },
    };
  }

  if (kind !== "DESARROLLO_SOFTWARE") {
    return err("Ese tipo de contrato aún no está disponible. Elija «Desarrollo de software» o «SaaS».");
  }

  const raw = {
    empresaDesarrolladora: String(formData.get("empresaDesarrolladora") ?? ""),
    representanteDesarrollador: String(formData.get("representanteDesarrollador") ?? ""),
    clienteEmpresa: String(formData.get("clienteEmpresa") ?? ""),
    nombreCliente: String(formData.get("nombreCliente") ?? ""),
    proyecto: String(formData.get("proyecto") ?? ""),
    modulos: String(formData.get("modulos") ?? ""),
    monedaReferencia: String(formData.get("monedaReferencia") ?? "DOP"),
    montoTotal: String(formData.get("montoTotal") ?? ""),
    inicial: String(formData.get("inicial") ?? ""),
    cuotas: String(formData.get("cuotas") ?? ""),
    diasHabiles: formData.get("diasHabiles"),
    fechaInicio: String(formData.get("fechaInicio") ?? ""),
    fechaEntrega: String(formData.get("fechaEntrega") ?? ""),
    tecnologias: String(formData.get("tecnologias") ?? ""),
    mesesSoporte: formData.get("mesesSoporte"),
    quienPoseeCodigo: String(formData.get("quienPoseeCodigo") ?? ""),
    penalidadAtrasoPago: String(formData.get("penalidadAtrasoPago") ?? ""),
    jurisdiccion: String(formData.get("jurisdiccion") ?? ""),
    fechaHoy: String(formData.get("fechaHoy") ?? ""),
  };

  const parsed = desarrolloSoftwareContractSchema.safeParse(raw);
  if (!parsed.success) {
    const fe = zodErrorToFieldMap(parsed.error);
    return err("Revise los campos señalados e inténtelo de nuevo.", fe);
  }

  let sig1: Buffer | null = null;
  let sig2: Buffer | null = null;
  let sig3: Buffer | null = null;
  try {
    const g1 = formData.get("firmaColaborador1Png");
    const g2 = formData.get("firmaColaborador2Png");
    const g3 = formData.get("firmaColaborador3Png");
    sig1 = pngBase64ToBuffer(typeof g1 === "string" ? g1 : null, "Colaborador 1");
    sig2 = pngBase64ToBuffer(typeof g2 === "string" ? g2 : null, "Colaborador 2");
    sig3 = pngBase64ToBuffer(typeof g3 === "string" ? g3 : null, "Colaborador 3");
  } catch (e) {
    return err(e instanceof Error ? e.message : "Error al leer la firma.");
  }

  const pdf = await buildDesarrolloSoftwarePdf(parsed.data, [sig1, sig2, sig3]);
  const name = desarrolloSoftwareFileName(parsed.data.proyecto, "pdf");
  const pdfBase64 = pdf.toString("base64");

  return {
    ok: true,
    download: { name, pdfBase64 },
  };
}
