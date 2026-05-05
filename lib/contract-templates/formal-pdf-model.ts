/**
 * Estructura común para PDF formal (misma plantilla de maquetación en `formal-contract-pdf.ts`).
 */
export type FormalContractPdfModel = {
  mainTitle: string;
  documentKind: string;
  leadIn: string;
  partyRows: { label: string; role: string; name: string }[];
  sections: { title: string; paragraphs: string[] }[];
  closing: string[];
};
