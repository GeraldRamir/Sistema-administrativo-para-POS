import { Writable } from "node:stream";
import PDFDocument from "pdfkit";
import type { FormalContractPdfModel } from "@/lib/contract-templates/formal-pdf-model";
import { CONTRATO_PDF_NOTA_PIE } from "@/lib/contract-templates/desarrollo-software";

export type FormalContractSignPageOptions = {
  pdfSubject: string;
  colaboradoresIntro: string;
  proveedorRolLabel: string;
};

export type FormalContractSignData = {
  empresaProveedor: string;
  repProveedor: string;
  nombreCliente: string;
  clienteEmpresa: string;
};

/** Márgenes amplios (aspecto más editorial / actual). */
const M = 60;
/** Azul petróleo: formal y legible (no neón). */
const ACCENT = "#1e3a5f";
const TEXT = "#0f172a";
const MUTED = "#4b5563";
const BORDER = "#e2e8f0";
const PAGE_LINE = "#cbd5e1";
const W_PT = 595.28;
const H_PT = 841.89;
const COL_W = W_PT - 2 * M;
/** Límite inferior (y) del área útil: margen inferior, sin solapar pie de PDF. */
const CONTENT_MAX_Y = H_PT - M;
/** Mínimo cuerpo de texto que debe caber bajo el título del artículo (evita título aislado al final de página). */
const MIN_BODY_PTS_WITH_TITLE = 36;
/** Espacio encima de cada título de artículo (debe coincidir con `sectionBlock`). */
const GAP_PRE_SECTION = 4;
/** Título de artículo: espacio bajo el texto, grosor “virtual” de la raya y aire hasta el cuerpo (alinear con `sectionBlock`). */
const SECTION_TITLE_GAP_BELOW_TEXT = 4;
const SECTION_TITLE_LINE_PTS = 1;
const SECTION_TITLE_GAP_TO_BODY = 6;

type PdfDoc = InstanceType<typeof PDFDocument>;

const MEASURE_DOC_OPTIONS = {
  size: "A4" as const,
  margin: M,
};

/**
 * `heightOfString` reutiliza el ajuste de líneas: si el texto pasa de página, PDFKit
 * añade páginas reales. El callback de `heightOfString` no imprime, así que el PDF
 * principal acumulaba hojas en blanco. Las mediciones se hacen en un documento
 * desechable (sin tocar el PDF final).
 */
const withMeasureDoc = <T>(fn: (m: PdfDoc) => T): T => {
  const m = new PDFDocument(MEASURE_DOC_OPTIONS);
  const sink = new Writable({ write(_chunk, _enc, cb) { cb(); } });
  m.pipe(sink);
  try {
    return fn(m);
  } finally {
    m.end();
  }
};

type PartyCard = {
  title: string;
  razon: string;
  representadoPor: string;
};

function partyRowsToCards(model: FormalContractPdfModel): PartyCard[] {
  const rows = model.partyRows;
  const out: PartyCard[] = [];
  let i = 0;
  while (i < rows.length) {
    const r = rows[i];
    const label = (r.label ?? "").trim();
    if (label) {
      const rNext = rows[i + 1];
      if (rNext) {
        out.push({
          title: label,
          razon: (r.name ?? "").trim(),
          representadoPor: (rNext.name ?? "").trim(),
        });
        i += 2;
      } else {
        out.push({ title: label, razon: (r.name ?? "").trim(), representadoPor: "" });
        i += 1;
      }
    } else {
      i += 1;
    }
  }
  return out;
}

const titleBandBoxHeight = (m: PdfDoc, title: string) => {
  m.font("Times-Bold", 8.8);
  const hTitle = m.heightOfString(title, { width: COL_W, lineGap: 0.8 });
  return (
    hTitle +
    SECTION_TITLE_GAP_BELOW_TEXT +
    SECTION_TITLE_LINE_PTS +
    SECTION_TITLE_GAP_TO_BODY
  );
};

const titleBandHeightPt = (title: string) => withMeasureDoc((m) => titleBandBoxHeight(m, title));

/**
 * Altura total del artículo (banda de título + cuerpo), con los mismos parámetros que `sectionBlock`.
 */
const measureSectionBlockHeight = (title: string, paragraphs: string[]) =>
  withMeasureDoc((m) => {
    const boxH = titleBandBoxHeight(m, title);
    let hBody = 0;
    let first = true;
    for (const p of paragraphs) {
      if (p && p.trim()) {
        if (!first) {
          hBody += 2.5;
        }
        first = false;
        m.font("Times-Roman", 9.6);
        hBody += m.heightOfString(p.trim(), { width: COL_W, align: "justify", lineGap: 1.35 });
      }
    }
    return GAP_PRE_SECTION + boxH + hBody + 2.8;
  });

function goToNextPageTop(doc: PdfDoc) {
  doc.addPage();
  doc.x = M;
  doc.y = M;
}

/**
 * Evita cortar título + cuerpo: si el bloque entero cabe en una hoja, se pasa a la
 * siguiente; si un artículo excede una hoja, respeta al menos título + primeras líneas de cuerpo.
 */
function ensureSectionPageLayout(doc: PdfDoc, title: string, paragraphs: string[]) {
  const fullH = measureSectionBlockHeight(title, paragraphs);
  const y = doc.y;
  const yMax = CONTENT_MAX_Y;
  if (y + fullH <= yMax) {
    return;
  }
  const onePageH = yMax - M;
  if (fullH <= onePageH) {
    goToNextPageTop(doc);
    return;
  }
  const boxH = titleBandHeightPt(title);
  const needHead = GAP_PRE_SECTION + boxH;
  if (y + needHead > yMax) {
    goToNextPageTop(doc);
    return;
  }
  if (y + needHead + MIN_BODY_PTS_WITH_TITLE > yMax) {
    goToNextPageTop(doc);
  }
}

const ensureClosingBlockLayout = (doc: PdfDoc, closing: string[]) => {
  const h = withMeasureDoc((m) => {
    let hInner = 6;
    const closeTitle = "Cierre y asentimiento de lectura";
    m.font("Times-Bold", 9.2);
    hInner += m.heightOfString(closeTitle, { width: COL_W });
    hInner += 4;
    let firstC = true;
    for (const c of closing) {
      if (!c.trim()) {
        continue;
      }
      if (!firstC) {
        hInner += 2.5;
      }
      firstC = false;
      m.font("Times-Roman", 9.5);
      hInner += m.heightOfString(c.trim(), { width: COL_W, align: "justify", lineGap: 1.4, paragraphGap: 0 });
    }
    return hInner + 4 + 1 + 5 + 12;
  });
  const yMax = CONTENT_MAX_Y;
  if (doc.y + h > yMax) {
    goToNextPageTop(doc);
  }
};

/**
 * Añade pie (centrado) cerca del borde inferior de cada página en búfer.
 * Las coordenadas deben quedar con y ≤ `page.maxY()`: con margen (p. ej. 60) el límite
 * útil (≈782 pt en A4) queda *por encima* de "altura total − 22", y al usar p. ej. y = h − 22
 * (≈819) el ajuste de líneas añadía hojas vacías al forzar salto (una por página con pie).
 */
function addPageFooters(doc: PdfDoc) {
  const range = doc.bufferedPageRange();
  for (let p = 0; p < range.count; p++) {
    doc.switchToPage(range.start + p);
    const page = doc.page;
    if (!page) {
      break;
    }
    const maxY = typeof page.maxY === "function" ? page.maxY() : CONTENT_MAX_Y;
    const footerFontSize = 7.1;
    doc.save();
    doc.lineWidth(0.2);
    doc.strokeColor(PAGE_LINE);
    doc.fillColor("#94a3b8");
    doc.font("Times-Italic", footerFontSize);
    const lineH = doc.currentLineHeight(true) || 8.5;
    const gapAboveText = 5;
    const yText = maxY - lineH - 2;
    const yLine = yText - gapAboveText;
    const footer = `POS Ops · pág. ${p + 1} / ${range.count}`;
    doc.moveTo(M, yLine).lineTo(M + COL_W, yLine).stroke();
    doc.text(footer, M, yText, { width: COL_W, align: "center" });
    doc.restore();
  }
  if (range.count > 0) {
    doc.switchToPage(range.start + range.count - 1);
  }
}

/**
 * Identificación de partes: solo texto, sin cajas ni franjas (estilo de escritura).
 */
function drawPartyCards(doc: PdfDoc, model: FormalContractPdfModel) {
  const cards = partyRowsToCards(model);
  if (cards.length === 0) {
    return;
  }

  const textW = COL_W;
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    if (i > 0) {
      doc.moveDown(1.1);
    }

    doc.fillColor(TEXT);
    doc.font("Times-Bold", 8.7);
    doc.text(card.title.toLocaleUpperCase("es-DO"), { width: textW, lineGap: 0 });
    doc.moveDown(0.25);
    doc.fillColor(MUTED);
    doc.font("Times-Italic", 7.2);
    doc.text("Razón social o denominación", { width: textW });
    doc.moveDown(0.15);
    doc.fillColor(TEXT);
    doc.font("Times-Roman", 9.5);
    doc.text(card.razon || "—", { width: textW, lineGap: 1.05 });
    doc.moveDown(0.35);
    doc.fillColor(MUTED);
    doc.font("Times-Italic", 7.2);
    doc.text("Representa", { width: textW });
    doc.moveDown(0.15);
    doc.fillColor(TEXT);
    doc.font("Times-Roman", 9);
    doc.text(card.representadoPor || "—", { width: textW, lineGap: 1.05 });
  }

  doc.x = M;
  doc.fillColor(TEXT);
  doc.moveDown(2.5);
}

function sectionBlock(doc: PdfDoc, title: string, paragraphs: string[]) {
  doc.x = M;
  doc.y += GAP_PRE_SECTION;
  const y0 = doc.y;
  doc.fillColor(TEXT);
  doc.font("Times-Bold", 8.8);
  doc.text(title, M, y0, { width: COL_W, align: "left", lineGap: 0.8 });
  const yAfterTitle = doc.y;
  const yLine = yAfterTitle + SECTION_TITLE_GAP_BELOW_TEXT;
  doc.save();
  doc.lineWidth(0.35);
  doc.strokeColor(ACCENT);
  doc.moveTo(M, yLine).lineTo(M + COL_W, yLine).stroke();
  doc.restore();
  doc.y = yLine + SECTION_TITLE_LINE_PTS + SECTION_TITLE_GAP_TO_BODY;

  doc.fillColor(TEXT);
  doc.font("Times-Roman", 9.6);
  for (const p of paragraphs) {
    if (p && p.trim()) {
      doc.text(p.trim(), { width: COL_W, align: "justify", lineGap: 1.35, paragraphGap: 2.5 });
    }
  }
  doc.moveDown(2.8);
}

export function buildFormalContractPdf(
  model: FormalContractPdfModel,
  sign: FormalContractSignPageOptions,
  data: FormalContractSignData,
  signatureImages: [Buffer | null, Buffer | null, Buffer | null],
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      bufferPages: true,
      margin: M,
      info: {
        Title: model.mainTitle,
        Author: "POS Ops",
        Subject: sign.pdfSubject,
      },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    /* Portada */
    doc.x = M;
    doc.y = M;
    const yLine0 = doc.y;
    doc.save();
    doc.lineWidth(2.2);
    doc.strokeColor(ACCENT);
    doc.moveTo(M, yLine0 + 0.2).lineTo(M + 54, yLine0 + 0.2).stroke();
    doc.restore();
    doc.moveDown(5);

    doc.fillColor(MUTED);
    doc.font("Times-Italic", 8.2);
    doc.text(model.documentKind, { width: COL_W, align: "left" });
    doc.moveDown(2);

    doc.fillColor(TEXT);
    doc.font("Times-Bold", 16.5);
    doc.text(model.mainTitle, { width: COL_W, align: "left", lineGap: 2.2 });
    doc.moveDown(5);
    const yR = doc.y;
    doc.save();
    doc.lineWidth(0.3);
    doc.strokeColor(PAGE_LINE);
    doc.moveTo(M, yR).lineTo(M + 64, yR).stroke();
    doc.restore();
    doc.moveDown(9);

    const yId = doc.y;
    const identTitle = "Identificación de las partes";
    doc.fillColor(TEXT);
    doc.font("Times-Bold", 9.2);
    doc.text(identTitle, M, yId, { width: COL_W, align: "left" });
    const yIdAfter = doc.y;
    doc.save();
    doc.strokeColor(ACCENT);
    doc.lineWidth(0.4);
    doc
      .moveTo(M, yIdAfter + 1)
      .lineTo(M + 160, yIdAfter + 1)
      .stroke();
    doc.restore();
    doc.y = yIdAfter + 6;
    doc.moveDown(0);

    drawPartyCards(doc, model);

    doc.fillColor(TEXT);
    doc.font("Times-Roman", 9.7);
    doc.text(model.leadIn, { width: COL_W, align: "justify", lineGap: 1.45, paragraphGap: 3 });
    doc.moveDown(4.5);

    for (const sec of model.sections) {
      ensureSectionPageLayout(doc, sec.title, sec.paragraphs);
      sectionBlock(doc, sec.title, sec.paragraphs);
    }

    ensureClosingBlockLayout(doc, model.closing);
    doc.moveDown(0.5);
    const yCloseLabel = doc.y;
    const closeTitle = "Cierre y asentimiento de lectura";
    doc.fillColor(TEXT);
    doc.font("Times-Bold", 9.2);
    doc.text(closeTitle, M, yCloseLabel, { width: COL_W, align: "left" });
    const yC = doc.y;
    doc.save();
    doc.lineWidth(0.32);
    doc.strokeColor(ACCENT);
    doc
      .moveTo(M, yC + 1)
      .lineTo(M + 200, yC + 1)
      .stroke();
    doc.restore();
    doc.y = yC + 3;

    doc.fillColor(TEXT);
    doc.font("Times-Roman", 9.5);
    for (const c of model.closing) {
      if (c.trim()) {
        doc.text(c.trim(), { width: COL_W, align: "justify", lineGap: 1.4, paragraphGap: 2.5 });
      }
    }
    doc.moveDown(4);

    doc.save();
    doc.lineWidth(0.25);
    doc.strokeColor(BORDER);
    const yN = doc.y;
    doc.moveTo(M, yN).lineTo(M + COL_W, yN).stroke();
    doc.restore();
    doc.moveDown(3);
    doc.fillColor(MUTED);
    doc.font("Times-Italic", 7.4);
    doc.text(CONTRATO_PDF_NOTA_PIE, { width: COL_W, align: "center" });
    doc.fillColor(TEXT);

    /* Hoja de firmas */
    doc.addPage();
    doc.x = M;
    doc.y = M;
    const yH0 = doc.y;
    doc.save();
    doc.lineWidth(2.2);
    doc.strokeColor(ACCENT);
    doc.moveTo(M, yH0 + 0.2).lineTo(M + 54, yH0 + 0.2).stroke();
    doc.restore();
    doc.moveDown(8);
    doc.fillColor(TEXT);
    doc.font("Times-Bold", 13.5);
    doc.text("Firmas y constancias", { width: COL_W, align: "left" });
    const yU = doc.y;
    doc.save();
    doc.lineWidth(0.35);
    doc.strokeColor(PAGE_LINE);
    doc
      .moveTo(M, yU + 2)
      .lineTo(M + 200, yU + 2)
      .stroke();
    doc.restore();
    doc.y = yU + 3;
    doc.moveDown(6);

    doc.fillColor(TEXT);
    doc.font("Times-Roman", 9.1);
    doc.text(sign.colaboradoresIntro, { width: COL_W, align: "justify", lineGap: 1.25 });
    doc.moveDown(6);

    const w = 140;
    const h = 54;
    const gap = 20;
    const ySig = doc.y;
    for (let i = 0; i < 3; i++) {
      const x = M + i * (w + gap);
      const boxH = h * 0.75;
      const buf = signatureImages[i];
      if (buf && buf.length > 0) {
        try {
          doc.image(buf, x, ySig, { fit: [w, boxH] });
        } catch {
          doc.save();
          doc.lineWidth(0.35);
          doc.fillColor("#f8fafc");
          doc.strokeColor(BORDER);
          doc.roundedRect(x, ySig, w, boxH, 2).fill();
          doc.roundedRect(x, ySig, w, boxH, 2).stroke();
          doc.restore();
          doc.fillColor(MUTED);
          doc.font("Times-Italic", 6.3);
          doc.text("Firma no incorporada", x, ySig + boxH * 0.4, { width: w, align: "center" });
          doc.fillColor(TEXT);
        }
      } else {
        doc.save();
        doc.lineWidth(0.4);
        doc.strokeColor(BORDER);
        doc.fillColor("#f8fafc");
        doc.roundedRect(x, ySig, w, boxH, 2).fill();
        doc.roundedRect(x, ySig, w, boxH, 2).stroke();
        doc.restore();
        doc.fillColor(MUTED);
        doc.font("Times-Italic", 6.8);
        doc.text("Firma manuscrita", x, ySig + 14, { width: w, align: "center" });
        doc.fillColor(TEXT);
      }
      doc.font("Times-Roman", 6.6);
      doc.fillColor(MUTED);
      doc.text(`Colaborador ${i + 1}`, x, ySig + h + 5, { width: w, align: "center" });
      doc.fillColor(TEXT);
    }
    const afterS = ySig + h + 32;
    doc.y = afterS;
    doc.moveDown(2);
    doc.save();
    doc.lineWidth(0.25);
    doc.strokeColor(BORDER);
    doc
      .moveTo(M, doc.y)
      .lineTo(M + COL_W, doc.y)
      .stroke();
    doc.restore();
    doc.moveDown(5);
    doc.fillColor(MUTED);
    doc.font("Times-Italic", 7.3);
    doc.text(sign.proveedorRolLabel, { width: COL_W });
    doc.moveDown(0.8);
    doc.fillColor(TEXT);
    doc.font("Times-Roman", 9.2);
    doc.text(data.empresaProveedor, { width: COL_W });
    doc.text(data.repProveedor, { width: COL_W, lineGap: 1.15 });
    doc.moveDown(8);

    doc.save();
    doc.lineWidth(0.25);
    doc.strokeColor(BORDER);
    doc
      .moveTo(M, doc.y)
      .lineTo(M + COL_W, doc.y)
      .stroke();
    doc.restore();
    doc.moveDown(3.5);
    doc.fillColor(MUTED);
    doc.font("Times-Italic", 7.3);
    doc.text("EL CLIENTE", { width: COL_W });
    doc.moveDown(0.8);
    doc.font("Times-Roman", 9.2);
    doc.fillColor(TEXT);
    doc.text(data.nombreCliente, { width: COL_W });
    doc.text(data.clienteEmpresa, { width: COL_W, lineGap: 1.15 });
    doc.moveDown(3.5);
    doc.fillColor(MUTED);
    doc.font("Times-Italic", 7.5);
    doc.text("Firma o sello (en original, si aplica).", { width: COL_W });
    doc.text("—".repeat(42), { width: COL_W, align: "left" });
    doc.font("Times-Roman", 9.1);
    doc.fillColor(TEXT);

    addPageFooters(doc);
    doc.end();
  });
}
