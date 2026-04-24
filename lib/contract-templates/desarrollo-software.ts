import type { z } from "zod";
import { desarrolloSoftwareContractSchema } from "@/lib/validators";

export type DesarrolloSoftwareInput = z.infer<typeof desarrolloSoftwareContractSchema>;

function fmtDate(d: string): string {
  const t = Date.parse(d);
  if (Number.isNaN(t)) {
    return d;
  }
  return new Date(t).toLocaleDateString("es-DO", { year: "numeric", month: "long", day: "numeric" });
}

function lineOrBlock(label: string, value: string | undefined, empty: string) {
  const v = value?.trim();
  if (!v) {
    return empty;
  }
  return label + v;
}

/**
 * Genera el texto del contrato (borrador). Revise con asesoría legal antes de firmar.
 */
export function buildDesarrolloSoftwareContract(data: DesarrolloSoftwareInput): string {
  const tec = data.tecnologias?.trim();
  const modulos = data.modulos.trim();
  const fechaEntregaTexto = data.fechaEntrega?.trim()
    ? `Fecha de entrega estimada: ${fmtDate(data.fechaEntrega.trim())}.`
    : "La fecha de entrega final se coordinará según el plan de trabajo aprobado.";

  const penal = data.penalidadAtrasoPago?.trim();
  const penalBloque = penal
    ? `\nAsimismo, se acuerda lo siguiente respecto a mora o atraso en el pago: ${penal}`
    : "";

  return `CONTRATO DE DESARROLLO DE SOFTWARE

Entre ${data.empresaDesarrolladora}, en adelante "EL DESARROLLADOR", representada por ${data.representanteDesarrollador},
y ${data.clienteEmpresa}, en adelante "EL CLIENTE", representada o representado por ${data.nombreCliente}.


PRIMERO: PARTES

EL DESARROLLADOR: ${data.empresaDesarrolladora}
Representante: ${data.representanteDesarrollador}

EL CLIENTE: ${data.clienteEmpresa}
Representante: ${data.nombreCliente}


SEGUNDO: OBJETO

EL DESARROLLADOR se compromete a analizar, diseñar e implementar el sistema o solución denominada:

    ${data.proyecto}

${lineOrBlock("Alcance funcional y módulos acordados:\n\n", modulos, "(Definir módulos y alcance.)")}

${lineOrBlock("Tecnologías, stack o referencias técnicas:\n\n", tec, "(No especificado en este borrador.)")}


TERCERO: PRECIO Y FORMA DE PAGO

EL CLIENTE pagará a EL DESARROLLADOR la suma total de: ${data.montoTotal}

Forma de pago:
- Pago inicial: ${data.inicial}
- Saldo / cuotas: ${data.cuotas}

Los pagos se entenderán realizados según los medios y cuentas que las partes acuerden por escrito.


CUARTO: PLAZO DE EJECUCIÓN

El plazo estimado de desarrollo y entrega es de ${String(data.diasHabiles)} días hábiles, contados a partir de ${fmtDate(data.fechaInicio)}, conforme al calendario laboral aplicable y sujeto a la entrega oportuna de insumos e información por parte de EL CLIENTE.

${fechaEntregaTexto}


QUINTO: CAMBIOS ADICIONALES

Toda modificación, ampliación o requerimiento ajeno al alcance descrito en el SEGUNDO numeral tendrá costo y plazo adicionales, previa aceptación expresa de ambas partes (propuesta adicional o anexo).


SEXTO: PROPIEDAD INTELECTUAL

El código fuente, entregables y documentación asociada al proyecto serán de titularidad de: ${data.quienPoseeCodigo}
a partir del cumplimiento total de las obligaciones de pago pactadas, salvo acuerdo distinto firmado por las partes. Las librerías de terceros, API públicas o componentes con licencia propia conservan sus licencias originales.


SÉPTIMO: CONFIDENCIALIDAD

Ambas partes se obligan a mantener la reserva de la información técnica, comercial o de negocio compartida en el marco de este contrato, salvo obligación legal o requerimiento de autoridad competente.


OCTAVO: SOPORTE

Se incluye soporte técnico post-entrega por un periodo de ${String(data.mesesSoporte)} meses, en los términos (canales, horario y exclusiones) que las partes definan en anexo o política de soporte. Tras dicho periodo, el soporte podrá ser contratado por separado.


NOVENO: INCUMPLIMIENTO Y MORA

El retraso en el cumplimiento de los pagos podrá dar lugar a la suspensión del trabajo, la entrega o el soporte, sin perjuicio de lo establecido en ley o en acuerdos posteriores entre las partes.${penalBloque}


DÉCIMO: JURISDICCIÓN

Para la interpretación y cumplimiento del presente contrato, las partes se someten a las leyes de la jurisdicción de: ${data.jurisdiccion}


En prueba de conformidad, se firma el presente documento en ${fmtDate(data.fechaHoy)}.


_______________________________          _______________________________
EL DESARROLLADOR                            EL CLIENTE
${data.representanteDesarrollador}         ${data.nombreCliente}
${data.empresaDesarrolladora}              ${data.clienteEmpresa}

---
Documento generado en POS Ops — borrador informativo. No constituye asesoría legal. Revise con un abogado antes de firmar.
`;
}

/** Cuerpo del contrato para PDF: sin el bloque ASCII de firmas ni nota de pie; el PDF añade la hoja de firmas. */
export function buildDesarrolloSoftwareContractPdfBody(data: DesarrolloSoftwareInput): string {
  const full = buildDesarrolloSoftwareContract(data);
  const marker = "\n\nEn prueba de conformidad,";
  const i = full.indexOf(marker);
  if (i === -1) {
    return full.replace(/\n*---\n[\s\S]*$/m, "");
  }
  return (
    full.slice(0, i) +
    "\n\n" +
    `En prueba de conformidad, se firma el presente documento en ${fmtDate(
      data.fechaHoy,
    )}. Las firmas de los colaboradores comerciales y de las partes se incluyen al final en el apartado de firmas.`
  );
}

export const CONTRATO_PDF_NOTA_PIE = "Borrador generado en POS Ops. No constituye asesoría legal.";

export function desarrolloSoftwareFileName(proyecto: string, ext: "txt" | "pdf" = "txt"): string {
  const safe = proyecto
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñü\s-]/gi, "")
    .replace(/\s+/g, "-")
    .slice(0, 60) || "proyecto";
  const d = new Date().toISOString().slice(0, 10);
  return `contrato-desarrollo-software-${safe}-${d}.${ext}`;
}
