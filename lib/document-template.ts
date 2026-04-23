import type { DocumentKind } from "@prisma/client";

const kindLabel: Record<DocumentKind, string> = {
  LICENSE: "Acuerdo de licencia de uso (software)",
  CONTRACT: "Contrato comercial / provisión de servicio",
  OTHER: "Documento / anexo",
};

type ClientInfo = { companyName: string; contactEmail: string; contactName?: string | null };

/**
 * Genera un borrador en texto plano (UTF-8) para descarga; no es documento legal — es plantilla operativa.
 */
export function buildDocumentText(
  kind: DocumentKind,
  title: string,
  client: ClientInfo,
): string {
  const when = new Date().toLocaleString("es-DO", { dateStyle: "long", timeStyle: "short" });
  const head = kindLabel[kind];
  return [
    `${head}`,
    `Título de registro: ${title}`,
    `Generado: ${when}`,
    ``,
    `PARTE — Cliente`,
    `Razón social / Empresa: ${client.companyName}`,
    `Correo de contacto: ${client.contactEmail}`,
    client.contactName ? `Persona de contacto: ${client.contactName}` : null,
    ``,
    `Marco (rellenar según política interna)`,
    `1. Objeto: descripción del acuerdo vinculado a la solución POS desplegada para el cliente citado.`,
    `2. Vigencia: fechas y renovación (definir con legal).`,
    `3. Confidencialidad: según plantilla legal ONEMAX / cliente.`,
    `4. Firmas: ______________________       ______________________`,
    ``,
    `— Fin del borrador —`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export function documentFileName(title: string, kind: DocumentKind) {
  const safe = title
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return `borrador-${kind.toLowerCase()}-${safe || "documento"}.txt`;
}
