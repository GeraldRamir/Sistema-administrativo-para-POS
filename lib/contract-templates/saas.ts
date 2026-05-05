import type { z } from "zod";
import { saasContractSchema } from "@/lib/validators";
import type { FormalContractPdfModel } from "@/lib/contract-templates/formal-pdf-model";
import { sanitizeTextForContractPdf, fmtDate, lineOrBlock, monedaPrefijoContrato } from "./desarrollo-software";

export type SaasInput = z.infer<typeof saasContractSchema>;

const periodoLectura = (p: SaasInput["periodoFacturacion"]): string => {
  const m: Record<SaasInput["periodoFacturacion"], string> = {
    MENSUAL: "período de facturación mensual (por adelantado o según se indique)",
    ANUAL: "período de facturación anual (por adelantado o según se indique)",
    TRIMESTRAL: "período de facturación trimestral (por adelantado o según se indique)",
    SEMESTRAL: "período de facturación semestral (por adelantado o según se indique)",
    OTRO: "período o esquema de facturación que se detalle en el texto o en anexo",
  };
  return m[p];
};

function mapPdfModel(m: FormalContractPdfModel): FormalContractPdfModel {
  const t = sanitizeTextForContractPdf;
  return {
    mainTitle: t(m.mainTitle),
    documentKind: t(m.documentKind),
    leadIn: t(m.leadIn),
    partyRows: m.partyRows.map((r) => ({ label: t(r.label), role: t(r.role), name: t(r.name) })),
    sections: m.sections.map((s) => ({
      title: t(s.title),
      paragraphs: s.paragraphs.map(t),
    })),
    closing: m.closing.map(t),
  };
}

export const sanitizeSaaSInputForPdf = (data: SaasInput): SaasInput => ({
  ...data,
  empresaDesarrolladora: sanitizeTextForContractPdf(data.empresaDesarrolladora),
  representanteDesarrollador: sanitizeTextForContractPdf(data.representanteDesarrollador),
  clienteEmpresa: sanitizeTextForContractPdf(data.clienteEmpresa),
  nombreCliente: sanitizeTextForContractPdf(data.nombreCliente),
  nombreServicio: sanitizeTextForContractPdf(data.nombreServicio),
  descripcionAlcance: sanitizeTextForContractPdf(data.descripcionAlcance),
  montoRecurrente: sanitizeTextForContractPdf(data.montoRecurrente),
  tarifaUnica: data.tarifaUnica?.trim() ? sanitizeTextForContractPdf(data.tarifaUnica) : data.tarifaUnica,
  facturacionYrenovacion: sanitizeTextForContractPdf(data.facturacionYrenovacion),
  fechaInicio: sanitizeTextForContractPdf(data.fechaInicio),
  fechaFinPlazo: data.fechaFinPlazo?.trim() ? sanitizeTextForContractPdf(data.fechaFinPlazo) : data.fechaFinPlazo,
  integracionAccesos: data.integracionAccesos?.trim() ? sanitizeTextForContractPdf(data.integracionAccesos) : data.integracionAccesos,
  disponibilidad: data.disponibilidad?.trim() ? sanitizeTextForContractPdf(data.disponibilidad) : data.disponibilidad,
  licenciaUso: sanitizeTextForContractPdf(data.licenciaUso),
  penalidadAtrasoPago: data.penalidadAtrasoPago?.trim() ? sanitizeTextForContractPdf(data.penalidadAtrasoPago) : data.penalidadAtrasoPago,
  jurisdiccion: sanitizeTextForContractPdf(data.jurisdiccion),
  fechaHoy: sanitizeTextForContractPdf(data.fechaHoy),
  monedaReferencia: data.monedaReferencia,
  periodoFacturacion: data.periodoFacturacion,
  compromisoMinimoMeses: data.compromisoMinimoMeses,
  mesesSoporte: data.mesesSoporte,
});

export function getSaaSContractPdfModel(dIn: SaasInput): FormalContractPdfModel {
  const d = sanitizeSaaSInputForPdf(dIn);
  const integ = d.integracionAccesos?.trim();
  const disp = d.disponibilidad?.trim();
  const tarifaU = d.tarifaUnica?.trim();
  const finPlazo = d.fechaFinPlazo?.trim();
  const finTexto = finPlazo
    ? `Fecha de referencia para cierre, renovación o renegociación del término inicial: ${fmtDate(finPlazo)}.`
    : "El cierre o renovación de cada término se ajustará a la mecánica y plazos acordados en el apartado de facturación, salvo anexo distinto.";

  const penal = d.penalidadAtrasoPago?.trim();
  const incumplimientoEx = penal
    ? ` Asimismo, las partes dejan asentado lo siguiente respecto de la mora o atraso en el pago: ${penal}`
    : "";

  return mapPdfModel({
    mainTitle: "CONTRATO DE PROVISIÓN\nDE SERVICIO SAAS (EN LA NUBE)",
    documentKind:
      "República Dominicana — Leyes 126-02, 172-13, 125-23 (marco informativo) — Borrador, revisar con asesoría legal",
    leadIn: `Entre ${d.empresaDesarrolladora}, en adelante «EL PROVEEDOR», y ${d.clienteEmpresa}, en adelante «EL CLIENTE» —cuyas representaciones se identifican al inicio y en la hoja de firmas—, celebran el presente acto, relativo a la puesta a disposición, en modalidad de software como servicio (SaaS), de la solución o plataforma identificada en las cláusulas siguientes, en adelante el «Servicio», el cual se prestará según términos, exclusiones, anexos y aceptación escrita, sin perjuicio de disposición legal imperativa.`,

    partyRows: [
      { label: "EL PROVEEDOR", role: "Razón o denominación", name: d.empresaDesarrolladora },
      { label: "", role: "Por", name: d.representanteDesarrollador },
      { label: "EL CLIENTE", role: "Razón o denominación", name: d.clienteEmpresa },
      { label: "", role: "Por", name: d.nombreCliente },
    ],

    sections: [
      {
        title: "ARTÍCULO PRIMERO. De la identidad de las partes y de la representación",
        paragraphs: [
          "Las partes declaran, según el caso, la capacidad para asumir las obligaciones de este acto, sin perjuicio de aportar, cuando exija el pago, la banca, la ley o un tercero, constancias, RNC, instrucciones de facturación, u otra documentación razonable.",
        ],
      },
      {
        title: "ARTÍCULO SEGUNDO. Del objeto: servicio SaaS, alcance y descripción",
        paragraphs: [
          "EL PROVEEDOR pone a disposición de EL CLIENTE, de forma remota, por acceso vía red (Internet o red privada según anexo) y bajo un modelo de suscripción o pago periódico, el o los productos, funcionalidades y límites que, en términos, se describen, salvo aceptación escrita distinta:",
          `Denominación comercial o referencia del Servicio: ${d.nombreServicio}.`,
          lineOrBlock(
            "Sobre módulos, perfiles, límites de usuario, almacenamiento, integración y exclusiones, ha de regir, en lo sustancial, la siguiente descripción, sin perjuicio de anexos, órdenes de compra, o aceptaciones posteriores:\n\n",
            d.descripcionAlcance,
            "Por el presente borrador, el detalle de alcance habrá de completarse en anexo o aceptación escrita, cuando a ello haya lugar.",
          ),
        ],
      },
      {
        title: "ARTÍCULO TERCERO. Del precio, de la periodicidad, de la facturación y de los medios de pago",
        paragraphs: [
          monedaPrefijoContrato(d.monedaReferencia) +
            "Como contraprestación por el acceso y uso del Servicio en el marco y período aceptado, EL CLIENTE se obliga a abonar a EL PROVEEDOR la suma, tarifa o precio, expresada para el o los períodos de facturación, de: " +
            d.montoRecurrente +
            ".",
          `Régimen o periodicidad contratada a efectos informativos: ${periodoLectura(d.periodoFacturacion)}.`,
          lineOrBlock(
            "Sobre puesta en marcha, activación, configuración, migración, capacitación inicial, honorario único o de implantación, cuando aplique, se toma nota, salvo otra aceptación:\n\n",
            tarifaU,
            "Sin costo o tarifa de implantación fijada en cifra en el presente apartado, salvo lo que, en anexo, se acepte.",
          ),
          "Forma, calendario, vencimientos, renovación tácita, recargos, reintentos, débito o cargo a tarjeta, y condiciones de suspensión por incumplimiento, en lo sustancial: " +
            d.facturacionYrenovacion +
            ".",
          "Los medios, cuentas, moneda, RNC, timbrado, nCF o facturación según la legislación y la DGII se regularán por canales, instrucciones o datos que las partes aporten o documenten, sin asumir EL PROVEEDOR, por el solo hecho de la plataforma, asesoría contable, tributaria o de cumplimiento a nombre de EL CLIENTE, salvo alcance expresamente aceptado por escrito.",
        ],
      },
      {
        title: "ARTÍCULO CUARTO. De la vigencia, del término y de la renovación",
        paragraphs: [
          `Vigencia inicial, renovaciones y plazo mínimo de permanencia, según común acuerdo o, en términos, lo siguiente: compromiso o referencia mínima de ${String(
            d.compromisoMinimoMeses,
          )} meses, con inicio o referencia de inicio: ${fmtDate(d.fechaInicio)}.`,
          finTexto,
        ],
      },
      {
        title: "ARTÍCULO QUINTO. Del acceso, de la identidad, de integraciones y de requisitos técnicos mínimos",
        paragraphs: [
          integ && integ.length
            ? "Sobre requisitos de conectividad, dispositivos, autenticación, SSO, integraciones, API, webhooks o restricciones de entorno, se toma nota, en términos, de lo que sigue, salvo tareas, licencias o costes de terceros no incluidos, salvo anexos o costos aceptados:\n\n" +
                integ
            : "En el presente borrador no se inserta anotación técnica; podrá añadirse, según aceptación, requisito de conectividad, SSO, u otra integración, en anexo o política.",
        ],
      },
      {
        title: "ARTÍCULO SEXTO. De la licencia de uso, de los datos y de la propiedad intelectual",
        paragraphs: [
          "Sujeto al cumplimiento de pago, EL PROVEEDOR otorga a EL CLIENTE una licencia de uso, no exclusiva, intransmisible, según se acuerde, revocable por incumplimiento esencial o por las causas de rescisión, respecto de la puesta a disposición en modalidad de servicio. El software, códigos y elementos de tercero conservan sus licencias, sin exceder asunciones ajenas a su texto.",
          d.licenciaUso,
        ],
      },
      {
        title: "ARTÍCULO SÉPTIMO. Protección de datos personales y comercio electrónico (Ley 172-13, Ley 126-02, en lo aplicable)",
        paragraphs: [
          "Cada Parte, en su esfera, procura el tratamiento lícito de la información, según ley, sin que por este acto, solo, se designe encargado, medidas técnicas exhaustivas, ni términos de transferencia internacional, salvo anexos, encargos o política, cuando a ello haya lugar.",
        ],
      },
      {
        title: "ARTÍCULO OCTAVO. De la disponibilidad, del mantenimiento y de las exclusiones (SLA, informe)",
        paragraphs: [
          disp && disp.length
            ? "Sobre horizonte de disponibilidad, ventana de mantenimiento, excepciones, fuerza mayor, canales, horario de soporte y métricas, deja constancia, en términos, lo siguiente, sin constituir, por solo este texto, acuerdo de niveles vinculante, salvo anexo explícito:\n\n" +
                disp
            : "Cualquier nivel de servicio (SLA) medible, multa, crédito o reembolso, se deja para anexo o aceptación escrita; en su defecto, regirá lo ofrecido u orientado de forma informativa por EL PROVEEDOR según canales aceptados.",
        ],
      },
      {
        title: "ARTÍCULO NOVENO. Facturación electrónica y competencia fiscal (Ley 125-23, DGII, informativo)",
        paragraphs: [
          "EL CLIENTE asume, en lo que le corresponda, RNC, timbrado, medios, exactitud, conservación y adecuación, según exija su obligación frente a la autoridad; EL PROVEEDOR facilita, en la medida y funcionalidad contratada, cauces, reportes, exportación o adecuación razonable, salvo aceptación distinta en módulo o anexo, sin asumir sanción o incumplimiento, por el mero acceso a la plataforma, a nombre de tercero.",
        ],
      },
      {
        title: "ARTÍCULO DÉCIMO. De la confidencialidad y del uso adecuado",
        paragraphs: [
          "Las partes guardan reserva razonable respecto de información técnica, comercial o de negocio, salvo obligación legal, requerimiento, u orden competente, debidamente fundada, o consentimiento, según el caso.",
        ],
      },
      {
        title: "ARTÍCULO UNDÉCIMO. Límite de responsabilidad",
        paragraphs: [
          "En la medida en que la ley lo permita, EL PROVEEDOR no será responsable por daños indirectos, lucro cesante, o pérdida de datos atribuibles a EL CLIENTE, terceros, fallas de tercero, o fuerza mayor, excluido dolo, salvo aceptación expresa distinta en cifra, alcance o póliza.",
        ],
      },
      {
        title: "ARTÍCULO DUODÉCIMO. Soporte, actualizaciones y asistencia",
        paragraphs: [
          `Se incluye, salvo aceptación distinta en anexo, soporte o asistencia frente a incidencias, consultas o uso del Servicio, por un término, contado a partir de la puesta a disposición, de aproximadamente ${String(
            d.mesesSoporte,
          )} meses, o según aceptación, canales, horas y exclusiones, en anexo, política o términos, sin prorrogar por silencio lo no aceptado.`,
        ],
      },
      {
        title: "ARTÍCULO DÉCIMO TERCERO. Incumplimiento, mora, suspensión o terminación",
        paragraphs: [
          "El atraso o el incumplimiento en abonos u obligaciones esenciales, podrá dar lugar, con comunicación y oportunidad, a suspensión, limitación o cese de accesos, sin que la sola suspensión, por sí, conlleve extinción, salvo gravedad, salvo aceptación o ley." +
            incumplimientoEx,
        ],
      },
      {
        title: "ARTÍCULO DÉCIMO CUARTO. Jurisdicción y cierre",
        paragraphs: [
          "Interpretación, resolución, cese, liquidación o términos, se rigen, según convenio, con sometimiento a: " + d.jurisdiccion + ", sin perjuicio de foros que la ley o acuerdo permitan, salvo acuerdo escrito distinto.",
        ],
      },
    ],
    closing: [
      "En señal de aceptación, las partes dejan asentada la buena fe en la relación, sin perjuicio de anexos, política de uso, medidas técnicas o términos complementarios que, en concreto, apliquen o se acuerden.",
      `Dado, firmado, u otorgado, en o con efectos de: ${fmtDate(
        d.fechaHoy,
      )}. Rúbricas, firmas de colaboradores o sellos, cuando correspondan, se consignan en la hoja de firmas a continuación.`,
    ],
  });
}

export function saasFileName(nombreServicio: string, ext: "txt" | "pdf" = "txt"): string {
  const safe =
    nombreServicio
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9áéíóúñü\s-]/gi, "")
      .replace(/\s+/g, "-")
      .slice(0, 60) || "saas";
  const day = new Date().toISOString().slice(0, 10);
  return `contrato-saas-${safe}-${day}.${ext}`;
}
