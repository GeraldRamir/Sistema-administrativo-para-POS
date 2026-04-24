import type { z } from "zod";
import { sanitizeContractText } from "@/lib/contract-text-sanitize";
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

/** Párrafo informativo según moneda de referencia del formulario. */
const monedaPrefijoContrato = (m: "DOP" | "USD" | "LIBRE") => {
  if (m === "DOP") {
    return "Salvo otra indicación expresa en cifra, el marco de referencia de los importes de este acto es el peso dominicano (RD$). ";
  }
  if (m === "USD") {
    return "Salvo otra indicación expresa en cifra, el marco de referencia de los importes de este acto es el dólar estadounidense (USD). ";
  }
  return "";
};

/**
 * Limpia texto que se renderiza a PDF/WinAnsi: al pegar desde otras apps suelen colarse
 * U+00AD, espacios de ancho cero, unión de palabra, guion "duro" no partible, etc. Con
 * Times base en PDF eso a veces se ve como «Ð» o basura al salto de línea.
 * También se quitan d/D islandeses en este contexto por sustituciones erróneas.
 */
export const sanitizeTextForContractPdf = sanitizeContractText;

const optSKeepUndefined = (v: string | undefined) => {
  if (v === undefined) {
    return undefined;
  }
  if (v === "") {
    return v;
  }
  return sanitizeContractText(v);
};

/** Sanea todos los campos de texto tras el formulario, antes de plantillas y PDF. */
export const sanitizeDesarrolloSoftwareInputForPdf = (
  data: DesarrolloSoftwareInput,
): DesarrolloSoftwareInput => ({
  ...data,
  empresaDesarrolladora: sanitizeContractText(data.empresaDesarrolladora),
  representanteDesarrollador: sanitizeContractText(data.representanteDesarrollador),
  clienteEmpresa: sanitizeContractText(data.clienteEmpresa),
  nombreCliente: sanitizeContractText(data.nombreCliente),
  proyecto: sanitizeContractText(data.proyecto),
  modulos: sanitizeContractText(data.modulos),
  montoTotal: sanitizeContractText(data.montoTotal),
  inicial: sanitizeContractText(data.inicial),
  cuotas: sanitizeContractText(data.cuotas),
  fechaInicio: sanitizeContractText(data.fechaInicio),
  fechaEntrega: optSKeepUndefined(data.fechaEntrega),
  tecnologias: optSKeepUndefined(data.tecnologias),
  quienPoseeCodigo: sanitizeContractText(data.quienPoseeCodigo),
  penalidadAtrasoPago: optSKeepUndefined(data.penalidadAtrasoPago),
  jurisdiccion: sanitizeContractText(data.jurisdiccion),
  fechaHoy: sanitizeContractText(data.fechaHoy),
  monedaReferencia: data.monedaReferencia,
});

/**
 * Genera el texto del contrato (borrador). Revise con asesoría legal antes de firmar.
 */
export function buildDesarrolloSoftwareContract(data: DesarrolloSoftwareInput): string {
  const d = sanitizeDesarrolloSoftwareInputForPdf(data);
  const tec = d.tecnologias?.trim() ? d.tecnologias.trim() : undefined;
  const modulos = d.modulos.trim();
  const fechaEntregaTexto = d.fechaEntrega?.trim()
    ? `Fecha de entrega estimada: ${fmtDate(d.fechaEntrega.trim())}.`
    : "La fecha de entrega final se coordinará según el plan de trabajo aprobado.";

  const penal = d.penalidadAtrasoPago?.trim();
  const penalBloque = penal
    ? `\nAsimismo, se acuerda lo siguiente respecto a mora o atraso en el pago: ${penal}`
    : "";

  return `CONTRATO DE PRESTACIÓN DE SERVICIOS DE DESARROLLO DE SOFTWARE

Marco normativo: República Dominicana, incluyendo en lo que resulte aplicable la Ley 126-02, sobre Comercio Electrónico, la Ley 172-13, sobre Protección Integral de Datos Personales, y la Ley 125-23, de Facturación Electrónica, sin que ello importe asesoría legal ni interpretación vinculante, salvo lo acordado por separado.

Entre ${d.empresaDesarrolladora}, en adelante "EL PRESTADOR", representada o representado según conste, por ${d.representanteDesarrollador},
y ${d.clienteEmpresa}, en adelante "EL CLIENTE", representada o representado según conste, por ${d.nombreCliente}.


ARTÍCULO PRIMERO: DE LAS PARTES

EL PRESTADOR: ${d.empresaDesarrolladora}
Representación: ${d.representanteDesarrollador}

EL CLIENTE: ${d.clienteEmpresa}
Representación: ${d.nombreCliente}


ARTÍCULO SEGUNDO: DEL OBJETO

EL PRESTADOR se compromete a prestar, según se acuerde, servicios de análisis, diseño, implementación, pruebas y, en su caso, puesta a disposición, respecto del Proyecto o Sistema designado e informado, en términos de:

    ${d.proyecto}

${lineOrBlock("Alcance funcional y módulos acordados (enunciativo):\n\n", modulos, "(Definir módulos y alcance con precisión, y completar con anexos, si aplica).")}

${lineOrBlock("Tecnologías, stack, integraciones o anotaciones técnicas:\n\n", tec, "(Especificar en anexo o ampliar aquí, según se acuerde).")}


ARTÍCULO TERCERO: PRECIO Y FORMA DE PAGO

${monedaPrefijoContrato(d.monedaReferencia)}EL CLIENTE pagará a EL PRESTADOR la suma total de: ${d.montoTotal}

Forma de pago: pago inicial ${d.inicial}; saldo o mecánica: ${d.cuotas}

Los medios, cuentas, moneda, facturación conforme a normativa aplicable, incluidas las reglas o lineamientos de la Dirección General de Impuestos Internos (DGII) o normas fiscales vigentes en la República Dominicana, se regularán por canales, instrucciones y, en su caso, RNC, datos de constancia u otros elementos que las partes aporten o documenten, sin asumir el Prestador, por el solo hecho del software, asesoría contable, tributaria o de cumplimiento a nombre del Cliente.


ARTÍCULO CUARTO: DE LOS PLAZOS

El plazo estimado de desarrollo y puesta a disposición, expresada en días hábiles, asciende a ${String(
    d.diasHabiles,
  )} días hábiles, contados a partir de ${fmtDate(d.fechaInicio)}, conforme al calendario laboral aplicable y con el condicionante de oportunidad, integridad o veracidad de insumos, claves, accesos, datos y decisiones a cargo de EL CLIENTE, sin perjuicio de ajustes documentados y aceptados.

${fechaEntregaTexto}


ARTÍCULO QUINTO: CAMBIOS ADICIONALES

Toda modificación, ampliación, variación o requisito cuya naturaleza sea claramente ajena al alcance aceptado en el ARTÍCULO SEGUNDO, salvo aceptación expresa y anexo o adenda, tendrá costo, plazo, forma y condición adicionales, los cuales deberán fijarse por escrito, previa aceptación, antes de su ejecución, salvo urgencia o salvaguarda acordada.


ARTÍCULO SEXTO: PROPIEDAD INTELECTUAL, BACKGROUND Y FOREGROUND

En lo relativo a obras, código, repositorios, entregables y documentación:

(a) "Background" o activos de base: plataformas, frameworks, bibliotecas reutilizables, plantillas, módulos genéricos, herramientas de terceros o creadas para reutilización entre clientes, continuarán, salvo ley, licencia pública, acuerdo o transferencia distinta, en la esfera del titular o titulares que al efecto tenga o consolide EL PRESTADOR.

(b) "Foreground" o personalizaciones: configuraciones, desarrollos y activos específicos para el Cliente, según se documente, serán, respecto de la titularidad, licencia, cesión o uso, los que, en términos sencillos, se fijen en lo que sigue, con la salvedad de que lo incorporado a Background, por naturaleza reutilizable, no deja, por ello, de regirse por el apartado (a), excepto aceptación escrita distinta:

    ${d.quienPoseeCodigo}

Librerías, API, dependencias o recursos bajo términos de terceros, licencias abiertas, de uso, de marca o restringido, conservan sus términos, sin exceder, por este contrato, asunciones ajenas a su texto.


ARTÍCULO SÉPTIMO: DE LA CONFIDENCIALIDAD Y TRATAMIENTO DE INFORMACIÓN (LEY 172-13, EN LO APLICABLE)

Las partes procuran la reserva adecuada, según su naturaleza, de la información técnica, de negocio, operativa, personal o cuya revelación afecte expectativas legítimas, salvo deberes legales, requerimientos con sustento, consentimiento, o criterios aceptables según ley, incluida en lo conducente, la normativa de protección de datos personales que resulte de aplicación en el territorio, sin que, por este borrador, se fije un DPO, medidas de seguridad exhaustivas, ni traslado internacional, salvo anexos, políticas, encargos o términos, cuando proceda.


ARTÍCULO OCTAVO: COMERCIO ELECTRÓNICO, ENTORNOS, FACTURACIÓN Y CUMPLIMIENTO (LEY 126-02, LEY 125-23; DGII, EN LO INFORMATIVO)

Sin perjuicio de aceptaciones o integraciones, EL CLIENTE asume, respecto de su actividad, RNC, datos, timbrado, nCF o medios, la coordinación, exactitud, conservación, uso y adecuación, según exija su obligación, frente a la autoridad o normas aplicables; EL PRESTADOR, en la medida de lo pactado, facilita cauces, formatos, funcionalidades, exportaciones, integración o adecuación técnica, sin asumir sanción, inexactitud, omisión, ni obligación, por el solo suministro de software, de cumplimientos que deban asegurarse, en concreto, a nombre, cuenta y riesgo de EL CLIENTE, salvo aceptación escrita en alcance, integración, soporte, o módulos que así lo fijen.


ARTÍCULO NOVENO: DEL ENTORNO DE DESPLIEGUE E INFRAESTRUCTURA (DOCKER / LINUX, EN LO PERTINENTE)

Se entiende que, cuando a ello haya lugar, la solución puede probarse, empaquetarse o desplegarse en entornos compatibles con contenedores (p. ej. Docker) y servidores Linux, según fases, sin perjuicio de variantes; cambios, actualizaciones, migraciones, hardening, políticas de red, firewalls, SO no previstos, o alteraciones a la pila, que tengan por efecto afectar compatibilidad, rendimiento o continuidad, requerirán, salvo riesgo o salvaguarda, evaluación, ajuste, estimación, o anexo, pudiendo ello, según su magnitud, repercutir en costo o plazo, sin que, por cambios ajenos o posteriores a un despliegue aceptado, se impute a EL PRESTADOR, por sí, la incompatibilidad, salvo dolo o cláusula o garantía aceptada por separado, expresa.


ARTÍCULO DÉCIMO: DISPONIBILIDAD, SOPORTE NIVEL DE SERVICIO (OBJETIVO) Y ASISTENCIA

Para subconjuntos, entornos o puesta en servicio, cuando se califiquen, por acuerdo o anexo, como "críticos" (p. ej. un punto de venta en operación, según defina el Cliente, documentado o en plan), la disponibilidad objetivo razonable asciende al orden del 99,9% mensual, con mediciones y excepciones, ventana de mantenimiento, o fuerza mayor, a regular por anexo o apéndice, sin constituir, por sí, garantía absoluta, ni sanción automática, en ausencia de métricas y términos, salvo aceptación explícita.

A efectos informativos y salvo aceptación distinta en anexo, tiempos orientativos de atención (no obligatorios si el canal, horas o canales de soporte aún no están fijados): aproximadamente, hasta cuatro (4) horas para incidentes o errores "críticos" o que impidan, en términos reales, la operación esencial, y aproximadamente, veinticuatro (24) horas para anomalías o consultas "no críticas", días y horas hábiles o según anexo, sin excluir, según hechos, otras prioridades, filas, colas, encargos o terceros, ni sustituir, sin más, lo que no esté aceptado por presupuesto, alcance, ni canal.

Se incluye soporte post-entrega por un periodo de ${String(
    d.mesesSoporte,
  )} meses, o según aceptación, en términos, canales, jornada y exclusiones que, en ley, proceda dejar, en anexo, política o aceptación escrita. Cumplido o prorrogado, el servicio, renovación o extensión, podrá ajustarse, contratarse o cesar, según oferta o aceptación.


ARTÍCULO UNDÉCIMO: LÍMITE DE RESPONSABILIDAD (EJ. DGII, INTEGRIDAD EN BASES DE DATOS, POSTGRESQL, EN LO APLICABLE)

En la medida permitida, EL PRESTADOR no será responsable de multas, sanciones, inexactitud, atraso, o contingencias, incluida la que pudiera afectar la relación con la DGII, derivadas del uso indebido del Sistema, del incumplimiento, por parte de EL CLIENTE, de requisitos fiscales, contables, de dato, de cierre, o de adecuación, ni de alteración manual, script, operación, o tercerización no autorizada por las partes, sobre el motor, esquemas, copias, restauraciones, o el contenido de la base (incl., según fuese el caso, PostgreSQL) que el Cliente, sus administradores, terceros, o conexión de sistemas, ejecute fuera de los flujos o procedimientos acordados o soportados, excluido dolo o aceptación expresa de otra suerte.


ARTÍCULO DUODÉCIMO: INCUMPLIMIENTO, MORA Y SUSPENSIÓN

El atraso o el incumplimiento, según su naturaleza, en abonos u obligaciones, podrá, sin perjuicio de la ley o de aceptación que lo sustituya, dar lugar, previa adecuada comunicación y plazo razonable, según criterios, a la suspensión, limitación, o cese, temporal o mientras dure, del avance, entrega, habilitación o soportes, ajustándose, entonces, plazos o hitos, sin que ello, por solo suspender, conlleve, por sí, extinción de contrato, excepto aceptación o agravante que, en concreto, afecte lo esencial.${penalBloque}


ARTÍCULO DÉCIMO TERCERO: JURISDICCIÓN Y CIERRE NORMATIVO

Asuntos de interpretación, validez, resolución, cese, liquidación, incumplimiento, excepciones, vicios, o términos, se rigen, con sometimiento a lo convenido, por las leyes, tribunales o foros, según, en concreto: ${d.jurisdiccion}, sin perjuicio, según asuntos, de vías, elecciones o alternativas que la ley permita, salvo acuerdo, elección, cláusula, o procedimiento, expreso.


ANEXO TÉCNICO A: STACK, ENTORNOS, INTEROPERABILIDAD (REFERENCIAL)

1) A efectos de interoperabilidad, repositorio, o documentación, el Proyecto, según fases, puede vincularse, de forma enunciativa y no limitante, a un "stack" de referencia, por ejemplo, aplicación con Next.js, acceso a datos, migración o mapeo con Prisma, y almacenamiento, según fases, bajo motor PostgreSQL; variaciones, versiones, o mix, a regular por fases, anexos, o aceptación.

2) Otras obras, tercerización, cifrado, copias, integraciones, facturación electrónica, EDI, o detalle de versión, quedan, salvo aceptación, a completar, ampliar, o ajustar, según aplica.

${lineOrBlock("3) Anotación o requisito técnico adicional informado o acordado:\n\n", tec, "3) Sin anotación, en el presente borrador, otra variante; completar, según propuesta, anexo, o aceptación.")}

En prueba de conformidad, se firma el presente documento en ${fmtDate(d.fechaHoy)}.


_______________________________          _______________________________
EL PRESTADOR                                 EL CLIENTE
${d.representanteDesarrollador}         ${d.nombreCliente}
${d.empresaDesarrolladora}              ${d.clienteEmpresa}

---
Documento generado en POS Ops — borrador informativo. No constituye asesoría legal. Revise con un abogado antes de firmar.
`;
}

/** Cuerpo del contrato para PDF: sin el bloque ASCII de firmas ni nota de pie; el PDF añade la hoja de firmas. */
export function buildDesarrolloSoftwareContractPdfBody(data: DesarrolloSoftwareInput): string {
  const d = sanitizeDesarrolloSoftwareInputForPdf(data);
  const full = buildDesarrolloSoftwareContract(d);
  const marker = "\n\nEn prueba de conformidad,";
  const i = full.indexOf(marker);
  if (i === -1) {
    return full.replace(/\n*---\n[\s\S]*$/m, "");
  }
  return (
    full.slice(0, i) +
    "\n\n" +
    `En prueba de conformidad, se firma el presente documento en ${fmtDate(
      d.fechaHoy,
    )}. Las firmas de los colaboradores comerciales y de las partes se incluyen al final en el apartado de firmas.`
  );
}

export const CONTRATO_PDF_NOTA_PIE = "Borrador generado en POS Ops. No constituye asesoría legal.";

function mapPdfModelThroughSanitize(m: DesarrolloSoftwarePdfModel): DesarrolloSoftwarePdfModel {
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
  const d = sanitizeDesarrolloSoftwareInputForPdf(data);
  const tec = d.tecnologias?.trim();
  const modulos = d.modulos.trim();
  const fechaEntregaTexto = d.fechaEntrega?.trim()
    ? `Fecha de entrega estimada: ${fmtDate(d.fechaEntrega.trim())}.`
    : "La fecha de entrega final se coordinará según el plan de trabajo aprobado y la disponibilidad oportuna de insumos por EL CLIENTE.";

  const penal = d.penalidadAtrasoPago?.trim();
  const incumplimientoEx = penal
    ? ` Asimismo, las partes dejan asentado lo siguiente respecto de la mora o atraso en el pago: ${penal}`
    : "";

  return mapPdfModelThroughSanitize({
    mainTitle: "CONTRATO DE PRESTACIÓN DE SERVICIOS\nDE DESARROLLO DE SOFTWARE",
    documentKind: "República Dominicana — Leyes 126-02, 172-13, 125-23 (marco informativo) — Borrador, revisar con asesoría legal",
    leadIn: `Entre ${d.empresaDesarrolladora}, en adelante «EL PRESTADOR», y ${d.clienteEmpresa}, en adelante «EL CLIENTE» —cuyas representaciones se identifican al inicio y en la hoja de firmas—, celebran el presente acto, el cual reconoce, a título informativo, sin sustituir asesoría legal, marcos de la República Dominicana, incluidas, según asuntos, la Ley 126-02 (comercio electrónico), la Ley 172-13 (protección de datos personales) y la Ley 125-23 (facturación electrónica). Las partes, individualmente, la «Parte»; en su conjunto, las «Partes»; y el contrato, por lo escrito, según cláusulas, anexos e instrumentos, salvo, según cuestión, disposición legal imperativa.`,

    partyRows: [
      { label: "EL PRESTADOR", role: "Razón o denominación", name: d.empresaDesarrolladora },
      { label: "", role: "Por", name: d.representanteDesarrollador },
      { label: "EL CLIENTE", role: "Razón o denominación", name: d.clienteEmpresa },
      { label: "", role: "Por", name: d.nombreCliente },
    ],

    sections: [
      {
        title: "ARTÍCULO PRIMERO. De la identidad de las partes y de la representación",
        paragraphs: [
          "Las partes dejan asentada su capacidad, según el caso, para asumir los compromisos y obligaciones de este acto, sin perjuicio de aportar, cuando exija la banca, el pago, la ley, la constancia o el tercero, los datos, constancias o anexos que correspondan (RNC, instrucción de facturación, u otros).",
        ],
      },
      {
        title: "ARTÍCULO SEGUNDO. Del objeto, del alcance y de las referencias técnicas",
        paragraphs: [
          "EL PRESTADOR se obliga frente a EL CLIENTE a prestar, según se acuerde, servicios de análisis, diseño, implementación, pruebas y, en su caso, puesta a disposición, en adelante, el «Proyecto» o el «Sistema», materializados, en términos, en el siguiente resumen, sin perjuicio de anexar especificaciones en fases posteriores o de común acuerdo:",
          d.proyecto,
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
        title: "ARTÍCULO TERCERO. Del precio, de la facturación y de la forma de pago",
        paragraphs: [
          `${monedaPrefijoContrato(d.monedaReferencia)}Como retribución por el servicio, EL CLIENTE se obliga a abonar a EL PRESTADOR la suma total de: ${d.montoTotal}.`,
          `Forma de pago: pago inicial ${d.inicial}; saldo o mecánica: ${d.cuotas}.`,
          "Los medios, cuentas, moneda, facturación conforme a normativa aplicable, incluidas reglas o lineamientos de la DGII o normas fiscales de la República Dominicana, se regularán por canales, instrucciones y, en su caso, RNC, datos o constancias que las partes aporten o documenten, sin asumir EL PRESTADOR, por el solo hecho del software, asesoría contable, tributaria o de cumplimiento a nombre de EL CLIENTE.",
        ],
      },
      {
        title: "ARTÍCULO CUARTO. De los plazos y la coordinación de entregas",
        paragraphs: [
          `El plazo estimado, en días hábiles, asciende a ${String(d.diasHabiles)} días hábiles, contados a partir de ${fmtDate(
            d.fechaInicio,
          )}, con el condicionante de insumos, claves, accesos y decisiones a cargo de EL CLIENTE, sin perjuicio de ajustes documentados y aceptados.`,
          fechaEntregaTexto,
        ],
      },
      {
        title: "ARTÍCULO QUINTO. De variaciones, cambios y alcance adicional",
        paragraphs: [
          "Toda modificación, ampliación, variación o requisito ajeno al ARTÍCULO SEGUNDO, salvo aceptación y anexo o adenda, tendrá costo, plazo, forma y condición adicionales, a fijarse por escrito, previa aceptación, antes de su ejecución, salvo urgencia o salvaguarda acordada.",
        ],
      },
      {
        title: "ARTÍCULO SEXTO. De la propiedad intelectual (Background, Foreground) y licencias",
        paragraphs: [
          "(a) «Background»: plataformas, frameworks, bibliotecas reutilizables, plantillas, módulos genéricos, herramientas de terceros o creadas para reutilización entre clientes, continuarán, salvo ley, licencia pública, acuerdo o transferencia, en la esfera del titular o titulares que tenga o consolide EL PRESTADOR.",
          "(b) «Foreground» o personalizaciones: la titularidad, licencia, cesión o uso se regirá por lo siguiente, sin que lo reutilizable deje, por ello, de regirse por (a), excepto aceptación escrita distinta:",
          d.quienPoseeCodigo,
          "Librerías, API, dependencias o recursos bajo términos de terceros conservan esos términos, sin exceder, por este contrato, asunciones ajenas a su licencia o texto.",
        ],
      },
      {
        title: "ARTÍCULO SÉPTIMO. De la confidencialidad y de datos personales (Ley 172-13, en lo aplicable)",
        paragraphs: [
          "Las partes procuran la reserva de la información técnica, de negocio, operativa o cuya revelación afecte expectativas legítimas, salvo deberes legales, requerimientos fundados, consentimiento o criterio legal, incluida, en lo conducente, la normativa de protección de datos personales vigente, sin fijar por este solo borrador, salvo anexos, DPO, medidas exhaustivas ni traslado internacional.",
        ],
      },
      {
        title: "ARTÍCULO OCTAVO. Comercio electrónico, facturación y cumplimiento (Leyes 126-02, 125-23; DGII, informativo)",
        paragraphs: [
          "EL CLIENTE asume, respecto de su actividad, RNC, timbrado, nCF o medios, la coordinación, exactitud, conservación y adecuación, según exija su obligación frente a la autoridad; EL PRESTADOR facilita, en la medida pactada, cauces, formatos, funcionalidades, exportaciones, integración o adecuación técnica, sin asumir, por el solo suministro de software, sanciones, inexactitud u omisión, en cumplimientos a nombre, cuenta y riesgo de EL CLIENTE, salvo alcance, integración o módulo que, por escrito, fije otra suerte.",
        ],
      },
      {
        title: "ARTÍCULO NOVENO. Del entorno de despliegue (Docker, Linux, en lo pertinente)",
        paragraphs: [
          "Cuando aplique, la solución podrá probarse, empaquetarse o desplegarse en contenedores (p. ej. Docker) y servidores Linux; variaciones, migraciones, hardening, red, SO o alteraciones a la pila que afecten compatibilidad, rendimiento o continuidad requerirán, salvo riesgo inminente, evaluación, ajuste, anexo o estimación, pudiendo repercutir en costo o plazo, sin imputar a EL PRESTADOR incompatibilidad por cambios ajenos, salvo dolo o garantía aceptada por separado, expresa.",
        ],
      },
      {
        title: "ARTÍCULO DÉCIMO. De disponibilidad, SLA (objetivo) y asistencia post-entrega",
        paragraphs: [
          "En subconjuntos o entornos acordados como «críticos» (p. ej. un POS en operación, según anexo o plan), la disponibilidad objetivo razonable, salvo anexo, es del orden del 99,9% mensual, con mediciones, excepciones, ventana de mantenimiento o fuerza mayor, a regular en anexo, sin constituir, por sí, garantía absoluta, salvo aceptación expresa, ni sanción automática sin métricas.",
          "A efectos informativos, plazos orientativos de atención, si se fijan canales: aproximadamente hasta cuatro (4) horas para incidentes críticos y veinticuatro (24) horas para anomalías no críticas, hábiles o según anexo, salvo otras colas, prioridades, presupuestos o alcance.",
          `Soporte post-entrega por un periodo de ${String(
            d.mesesSoporte,
          )} meses, o según aceptación, en términos, canales y exclusiones en anexo o política. Cumplido, podrá ajustarse, prorrogarse, contratarse a parte o cesar.`,
        ],
      },
      {
        title: "ARTÍCULO UNDÉCIMO. Límite de responsabilidad (DGII, integridad de bases, PostgreSQL, en lo aplicable)",
        paragraphs: [
          "En la medida permitida, EL PRESTADOR no responde por multas, sanciones, inexactitud, atraso, o contingencia (incluida frente a la DGII) derivada de uso indebido del Sistema, incumplimiento fiscal, contable o de datos de EL CLIENTE, ni de alteración manual, script, operación o tercerización no autorizada sobre el motor, esquemas, copias, restauraciones o el contenido de la base (incluido PostgreSQL) que EL CLIENTE o terceros ejecuten fuera de flujos o procedimientos acordados o soportados, excluido dolo o aceptación distinta, expresa.",
        ],
      },
      {
        title: "ARTÍCULO DUODÉCIMO. Incumplimiento, mora y suspensión",
        paragraphs: [
          "Atraso o incumplimiento, según su naturaleza, en abonos u obligaciones, podrá dar lugar, con comunicación y plazo razonable, a suspensión, limitación o cese temporal del avance, entrega, habilitación o soportes, ajustando plazos, sin que la sola suspensión extinga el contrato, salvo gravedad esencial, según acepte la ley o acepte expresa." + incumplimientoEx,
        ],
      },
      {
        title: "ARTÍCULO DÉCIMO TERCERO. Jurisdicción y cierre",
        paragraphs: [
          "Interpretación, validez, resolución, cese, liquidación, incumplimiento, excepciones o términos, se rigen, según convenio, para: " + d.jurisdiccion + ", sin perjuicio de vías que la ley permita, salvo acuerdo, elección, cláusula o procedimiento, expresos por escrito.",
        ],
      },
      {
        title: "ANEXO TÉCNICO A. Stack, entornos, interoperabilidad (referencial)",
        paragraphs: [
          "1) El Proyecto, según fases, podrá vincularse, en términos enunciativos, a: aplicación con Next.js, acceso a datos, migración o mapeo con Prisma, almacenamiento bajo motor PostgreSQL; versiones, variaciones o tercerización se documentarán en anexos, según se acuerde por escrito.",
          "2) Cifrado, integraciones, facturación electrónica, u otra obra, a completar, salvo aceptación, en anexos, según apliquen.",
          lineOrBlock("3) Anotación o requisito adicional, informada o aceptada:\n\n", tec, "3) Sin otra anotación en el borrador; completar, según propuesta o anexo."),
        ],
      },
    ],
    closing: [
      "En señal de aceptación, las partes dejan asentada la buena fe en la relación, sin perjuicio de ajustar anexos, técnicas y documentación que proceda.",
      `Dado, firmado, u otorgado, en o con efectos de: ${fmtDate(
        d.fechaHoy,
      )}. Rúbricas, firmas de colaboradores o sellos, cuando correspondan, se consignan en la hoja de firmas a continuación.`,
    ],
  });
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
