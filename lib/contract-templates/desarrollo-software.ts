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

/** Estructura para un PDF formal (secciones, partes, cierre). */
export type DesarrolloSoftwarePdfModel = {
  mainTitle: string;
  documentKind: string;
  leadIn: string;
  partyRows: { label: string; role: string; name: string }[];
  sections: { title: string; paragraphs: string[] }[];
  closing: string[];
};

/**
 * Mismo contenido que el contrato, organizado en bloques para renderizado con diseño fijo.
 */
export function getDesarrolloSoftwareContractPdfModel(data: DesarrolloSoftwareInput): DesarrolloSoftwarePdfModel {
  const tec = data.tecnologias?.trim();
  const modulos = data.modulos.trim();
  const fechaEntregaTexto = data.fechaEntrega?.trim()
    ? `Fecha de entrega estimada: ${fmtDate(data.fechaEntrega.trim())}.`
    : "La fecha de entrega final se coordinará según el plan de trabajo aprobado y la disponibilidad oportuna de insumos por EL CLIENTE.";

  const penal = data.penalidadAtrasoPago?.trim();
  const incumplimientoEx = penal
    ? ` Asimismo, las partes dejan asentado lo siguiente respecto de la mora o atraso en el pago: ${penal}`
    : "";

  return {
    mainTitle: "CONTRATO DE DESARROLLO DE SOFTWARE",
    documentKind: "Documento privado · Borrador (revisar con asesoría legal)",
    leadIn: `Entre ${data.empresaDesarrolladora}, en adelante «EL DESARROLLADOR», y ${data.clienteEmpresa}, en adelante «EL CLIENTE» —cuyas representaciones constan al pie de la presente—, se celebra el contrato que a continuación se describe, el cual vinculará a las partes, en adelante, individualmente, la «Parte» o, en conjunto, las «Partes», según las cláusulas y condiciones siguientes.`,

    partyRows: [
      { label: "EL DESARROLLADOR", role: "Razón o denominación", name: data.empresaDesarrolladora },
      { label: "", role: "Por", name: data.representanteDesarrollador },
      { label: "EL CLIENTE", role: "Razón o denominación", name: data.clienteEmpresa },
      { label: "", role: "Por", name: data.nombreCliente },
    ],

    sections: [
      {
        title: "PRIMERO. De la identidad de las partes y de la representación",
        paragraphs: [
          "Las partes dejan asentada su capacidad jurídica, según el caso, para asumir los compromisos y obligaciones derivados de este acto, sin perjuicio de la aportación de constancias adicionales que, según exija la ley, la banca o la naturaleza del pago, procedan acompañar.",
        ],
      },
      {
        title: "SEGUNDO. Del objeto, alcance y referencias técnicas",
        paragraphs: [
          "EL DESARROLLADOR se obliga frente a EL CLIENTE a prestar, según se acuerde, el servicio de análisis, diseño, desarrollo, pruebas y, en su caso, despliegue, en adelante, el «Proyecto» o el «Sistema», materializado en términos enunciatos en el siguiente resumen (sin perjuicio de anexar especificaciones levantadas en fases posteriores):",
          data.proyecto,
          lineOrBlock(
            "Sobre el alcance funcional, módulos y entregables, ha de regir, en lo sustancial, la siguiente descripción, salvo acuerdo escrito distinto:\n\n",
            modulos,
            "Por este borrador, el detalle de alcance funcional o de módulos habrá de completarse, sin perjuicio de lo aceptado por escrito, ulteriormente.",
          ),
          tec && tec.length
            ? "Sobre requisitos técnicos, stack, integraciones, ambientes, versiones o tercerización, se toma nota, en lo mínimamente informativo, de lo que sigue, sin prejuzgar tareas adicionales no incluidas, salvo anexos:\n\n" + tec
            : "Sobre requisitos técnicos, stack, integraciones o ambientes, no se inserta, en el presente borrador, otra nota, debiendo precisarse en anexos, cuando a ello haya lugar.",
        ],
      },
      {
        title: "TERCERO. Del precio, de la facturación y de la forma de pago",
        paragraphs: [
          "Como retribución por el servicio objeto de este contrato, EL CLIENTE se obliga a abonar a EL DESARROLLADOR la suma y en la forma en que, en lo sustancial, se señala a continuación, sin perjuicio de ajustes documentados y aceptados por anexo, cuando a ello haya lugar.",
          `Monto total pactado: ${data.montoTotal}.`,
          `Pago inicial: ${data.inicial}.`,
          `Restante, cuotas u otra mecánica acordada: ${data.cuotas}.`,
          "La ejecución material de los pagos se regirá por medios, cuentas, moneda y requisitos que las partes fijen por escrito, complementariamente, cuando sea necesario.",
        ],
      },
      {
        title: "CUARTO. De los plazos y la coordinación de entregas",
        paragraphs: [
          `El plazo de ejecución estimado para el desarrollo y puesta a disposición, expresada en días hábiles, asciende a ${String(
            data.diasHabiles,
          )} días, contados a partir de la fecha de referencia ${fmtDate(
            data.fechaInicio,
          )}, sin perjuicio de ajustes razonables vinculados a la recepción oportuna de información, accesos e insumos a cargo de EL CLIENTE.`,
          fechaEntregaTexto,
        ],
      },
      {
        title: "QUINTO. De variaciones, cambios y alcance adicional",
        paragraphs: [
          "Cualquier modificación, adición, ampliación o requerimiento de alcance claramente ajeno a lo aceptado en el SEGUNDO título, en sus apartados, tendrá, salvo acuerdo expreso y escrito, costo, forma de pago y, en su caso, plazo adicionales, los cuales deberán documentarse, previa aceptación, mediante propuesta, adenda o anexo, según el caso.",
        ],
      },
      {
        title: "SEXTO. De la propiedad intelectual, licencias de terceros y entregables",
        paragraphs: [
          "La titularidad del código, entregables, documentación asociada al Proyecto y, en concreto, de los activos cuya titularidad corresponde según ley y uso comercial, quedará determinada según se indica a continuación, una vez acreditado el pago o los hitos convenidos, según se aplique:\n" +
            data.quienPoseeCodigo,
          "Las dependencias, bibliotecas, componentes o recursos bajo licencia pública, de terceros o bajo términos de uso restringido conservan sus términos y limitaciones, sin perjuicio de lo acordado entre las partes.",
        ],
      },
      {
        title: "SÉPTIMO. De la confidencialidad",
        paragraphs: [
          "Las partes deberán guardar reserva, respecto de la información técnica, comercial o de negocio obtenida en virtud o con motivo del presente acto, salvo obligación de revelar conforme a ley o a requerimiento de autoridad, debidamente fundada, o previo consentimiento, según el caso, sin perjuicio de lo adicional en anexos de confidencialidad independientes, cuando a ello haya lugar.",
        ],
      },
      {
        title: "OCTAVO. Del soporte post-entrega",
        paragraphs: [
          `Salvo acuerdo distinto por anexo, se entiende incluido, por un término de ${String(
            data.mesesSoporte,
          )} meses, soporte o asistencia técnica, en canales, horas y limitaciones, que podrán precisarse, en su caso, en anexo, política o aceptación escrita. Transcurrido el plazo, su renovación, contratación a parte, o el cese, en su caso, quedará sujeto, entonces, a lo de común acuerdo.`,
        ],
      },
      {
        title: "NOVENO. Del incumplimiento, resolución y mecanismos de suspensión",
        paragraphs: [
          "En caso de atraso o incumplimiento, según su naturaleza, en el abono, podrá, sin perjuicio de lo demás que proveyere la ley, proceder, previa oportunidad, según se estipule, la suspensión razonable del avance, la entrega o de ciertos soportes, mientras se regularice, salvo excepción prevista por escrito." + incumplimientoEx,
        ],
      },
      {
        title: "DÉCIMO. De la ley, jurisdicción y cierre",
        paragraphs: [
          "Para el efecto, interpretación, cumplimiento, liquidación, rescisión, extinción o cuestiones derivadas, las partes se someten, en términos de competencia, a lo previsto, en concreto, con respecto a: " + data.jurisdiccion + ".",
        ],
      },
    ],
    closing: [
      "En señal de aceptación y para constancia, las partes dejan asentada la buena fe en la relación, sin perjuicio de ajustar anexos, técnicas y documentación complementaria que, en ley, proceda.",
      `Dado, firmado, en o con efectos de: ${fmtDate(
        data.fechaHoy,
      )}. Las rúbricas, firmas de colaboradores o sellos, cuando correspondan, se hacen en la hoja de firmas a continuación.`,
    ],
  };
}

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
