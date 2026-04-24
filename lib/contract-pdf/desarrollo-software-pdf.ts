import PDFDocument from "pdfkit";
import type { DesarrolloSoftwareInput } from "@/lib/contract-templates/desarrollo-software";
import {
  type DesarrolloSoftwarePdfModel,
  CONTRATO_PDF_NOTA_PIE,
  getDesarrolloSoftwareContractPdfModel,
} from "@/lib/contract-templates/desarrollo-software";

const M = 56;
const LINE = "#1a1a1a";
const BORDER = "#b8b8b8";
const BG_MUTED = "#f3f1ec";
const TEXT = "#1a1a1a";
const MUTED = "#3d3d3d";
const W_PT = 595.28;
const H_PT = 841.89;
const COL_W = W_PT - 2 * M;

type PdfDoc = InstanceType<typeof PDFDocument>;

const COL_ROLE = M + 20;
const W_ROLE = 155;
const COL_NAME = COL_ROLE + W_ROLE + 12;
const W_NAME = W_PT - M - COL_NAME - 4;

/**
 * Añade pie (centrado) cerca del borde inferior de cada página en búfer.
 */
function addPageFooters(doc: PdfDoc) {
  const range = doc.bufferedPageRange();
  for (let p = 0; p < range.count; p++) {
    doc.switchToPage(range.start + p);
    const h = doc.page?.height ?? H_PT;
    const yLine = h - 28;
    const yText = h - 22;
    doc.save();
    doc.lineWidth(0.2);
    doc.strokeColor("#d0d0d0");
    doc.moveTo(M, yLine).lineTo(M + COL_W, yLine).stroke();
    doc.fillColor(MUTED);
    doc.font("Helvetica", 7.5);
    const footer = `POS Ops · documento de trabajo · pág. ${p + 1} de ${range.count}`;
    doc.text(footer, M, yText, { width: COL_W, align: "center" });
    doc.restore();
  }
}

function measurePartyBlockHeight(doc: PdfDoc, model: DesarrolloSoftwarePdfModel) {
  const inner = 10;
  let h = inner;
  for (const r of model.partyRows) {
    const lab = (r.label ?? "").trim();
    if (lab) {
      doc.font("Times-Bold", 10);
      h += doc.heightOfString(lab, { width: COL_W - 2 * inner, lineGap: 1 });
      h += 2;
      doc.font("Times-Italic", 8.8);
      const hR = doc.heightOfString(r.role, { width: W_ROLE, lineGap: 1 });
      doc.font("Times-Roman", 9.7);
      const hN = doc.heightOfString(r.name, { width: W_NAME, lineGap: 1.2 });
      h += Math.max(hR, hN) + 4;
    } else {
      doc.font("Times-Italic", 8.8);
      const hR = doc.heightOfString(r.role, { width: 42, lineGap: 1 });
      doc.font("Times-Roman", 9.7);
      const hN = doc.heightOfString(r.name, { width: W_NAME, lineGap: 1.2 });
      h += Math.max(hR, hN) + 2;
    }
  }
  h += inner;
  return h;
}

function drawPartyTable(doc: PdfDoc, model: DesarrolloSoftwarePdfModel) {
  const top = doc.y;
  const inner = 10;
  const h = measurePartyBlockHeight(doc, model);

  doc.save();
  doc.lineWidth(0.45);
  doc.roundedRect(M, top, COL_W, h, 2).fillAndStroke(BG_MUTED, BORDER);
  doc.restore();

  let y = top + inner;
  for (const r of model.partyRows) {
    const lab = (r.label ?? "").trim();
    if (lab) {
      doc.fillColor(LINE);
      doc.font("Times-Bold", 10);
      doc.text(lab, M + inner, y, { width: COL_W - 2 * inner, align: "left" });
      y = doc.y;
      const lineY = y;
      doc.fillColor(MUTED);
      doc.font("Times-Italic", 8.8);
      const hR = doc.heightOfString(r.role, { width: W_ROLE, lineGap: 1 });
      doc.text(r.role, COL_ROLE, lineY, { width: W_ROLE });
      doc.fillColor(TEXT);
      doc.font("Times-Roman", 9.7);
      const hN = doc.heightOfString(r.name, { width: W_NAME, lineGap: 1.2 });
      doc.text(r.name, COL_NAME, lineY, { width: W_NAME, align: "left" });
      y = lineY + Math.max(hR, hN) + 2;
    } else {
      const lineY = y;
      doc.fillColor(MUTED);
      doc.font("Times-Italic", 8.8);
      const hR = doc.heightOfString(r.role, { width: 42, lineGap: 1 });
      doc.text(r.role, COL_ROLE, lineY, { width: 42 });
      doc.fillColor(TEXT);
      doc.font("Times-Roman", 9.7);
      const hN = doc.heightOfString(r.name, { width: W_NAME, lineGap: 1.2 });
      doc.text(r.name, COL_NAME, lineY, { width: W_NAME, align: "left" });
      y = lineY + Math.max(hR, hN) + 1;
    }
  }

  doc.y = top + h + 14;
}

function sectionBlock(doc: PdfDoc, title: string, paragraphs: string[]) {
  doc.moveDown(1.2);
  doc.fillColor(LINE);
  doc.font("Times-Bold", 10.6);
  const y0 = doc.y;
  doc.text(title, M, y0, { width: COL_W, align: "left" });
  const yAfterTitle = doc.y;
  doc.save();
  doc.lineWidth(0.3);
  doc.strokeColor(BORDER);
  doc
    .moveTo(M, yAfterTitle + 3)
    .lineTo(M + COL_W, yAfterTitle + 3)
    .stroke();
  doc.restore();
  doc.y = yAfterTitle + 5;

  doc.fillColor(TEXT);
  doc.font("Times-Roman", 10.4);
  for (const p of paragraphs) {
    if (p && p.trim()) {
      doc.text(p.trim(), { width: COL_W, align: "justify", lineGap: 2, paragraphGap: 4 });
    }
  }
  doc.moveDown(7);
}

export function buildDesarrolloSoftwarePdf(
  data: DesarrolloSoftwareInput,
  signatureImages: [Buffer | null, Buffer | null, Buffer | null],
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const model = getDesarrolloSoftwareContractPdfModel(data);
    const doc = new PDFDocument({
      size: "A4",
      bufferPages: true,
      margin: M,
      info: {
        Title: model.mainTitle,
        Author: "POS Ops",
        Subject: "Borrador · contrato de desarrollo de software",
      },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    /* Portada: cabecera, título, subtítulo */
    doc.x = M;
    doc.y = M + 4;
    doc.save();
    doc.lineWidth(0.6);
    doc.strokeColor(LINE);
    doc.moveTo(M, doc.y).lineTo(M + COL_W, doc.y).stroke();
    doc.lineWidth(0.25);
    doc.strokeColor(BORDER);
    doc
      .moveTo(M, doc.y + 1.5)
      .lineTo(M + COL_W, doc.y + 1.5)
      .stroke();
    doc.restore();
    doc.moveDown(10);

    doc.fillColor(MUTED);
    doc.font("Times-Italic", 9.2);
    doc.text(model.documentKind.toUpperCase(), { width: COL_W, align: "center" });
    doc.moveDown(18);

    doc.fillColor(LINE);
    doc.font("Times-Bold", 17.5);
    doc.text(model.mainTitle, { width: COL_W, align: "center" });
    doc.moveDown(12);
    const yR = doc.y;
    doc.save();
    doc.lineWidth(0.4);
    doc.strokeColor(LINE);
    doc
      .moveTo(M + 48, yR)
      .lineTo(M + COL_W - 48, yR)
      .stroke();
    doc.restore();
    doc.moveDown(20);

    doc.fillColor(LINE);
    doc.font("Times-Bold", 10.8);
    doc.text("IDENTIFICACIÓN DE LAS PARTES", { width: COL_W, align: "left" });
    doc.moveDown(3);

    drawPartyTable(doc, model);

    doc.fillColor(TEXT);
    doc.font("Times-Roman", 10.6);
    doc.text(model.leadIn, { width: COL_W, align: "justify", lineGap: 3, paragraphGap: 8 });
    doc.moveDown(14);

    for (const sec of model.sections) {
      sectionBlock(doc, sec.title, sec.paragraphs);
    }

    doc.moveDown(4);
    doc.fillColor(LINE);
    doc.font("Times-Bold", 10.6);
    doc.text("Cierre y asentimiento de lectura", { width: COL_W, align: "left" });
    const yC = doc.y;
    doc.save();
    doc.lineWidth(0.4);
    doc.strokeColor(LINE);
    doc
      .moveTo(M, yC - 1)
      .lineTo(M + 170, yC - 1)
      .stroke();
    doc.restore();
    doc.y = yC + 2;
    doc.moveDown(2);

    doc.fillColor(TEXT);
    doc.font("Times-Roman", 10.2);
    for (const c of model.closing) {
      if (c.trim()) {
        doc.text(c.trim(), { width: COL_W, align: "justify", lineGap: 2.5, paragraphGap: 4 });
      }
    }
    doc.moveDown(8);

    doc.fillColor(MUTED);
    doc.font("Times-Italic", 8.2);
    doc.text("—  " + CONTRATO_PDF_NOTA_PIE, { width: COL_W, align: "center" });
    doc.fillColor(TEXT);

    /* Hoja de firmas */
    doc.addPage();
    doc.x = M;
    doc.y = M + 6;
    doc.font("Times-Bold", 15.5);
    doc.text("FIRMAS Y CONSTANCIAS", { width: COL_W, align: "left" });
    const yU = doc.y;
    doc.save();
    doc.lineWidth(0.5);
    doc.strokeColor(LINE);
    doc
      .moveTo(M, yU + 2)
      .lineTo(M + 180, yU + 2)
      .stroke();
    doc.restore();
    doc.y = yU + 6;
    doc.moveDown(14);

    doc.font("Times-Roman", 10.4);
    doc.text(
      "FIRMA DE LOS COLABORADORES (equipo de venta / comercial vinculado a EL DESARROLLADOR). Cada trazo se capturó en el formulario; si quedó vacío, se podrá consignar la firma manuscrita al imprimir el documento.",
      { width: COL_W, align: "justify", lineGap: 2 },
    );
    doc.moveDown(12);

    const w = 140;
    const h = 54;
    const gap = 20;
    const ySig = doc.y;
    for (let i = 0; i < 3; i++) {
      const x = M + i * (w + gap);
      const buf = signatureImages[i];
      if (buf && buf.length > 0) {
        try {
          doc.image(buf, x, ySig, { fit: [w, h] });
        } catch {
          doc.lineWidth(0.4);
          doc.rect(x, ySig, w, h * 0.72).stroke();
          doc.font("Times-Italic", 6.5);
          doc.text("(firma no incorporada al PDF)", x, ySig + h * 0.3, { width: w, align: "center" });
        }
      } else {
        doc.lineWidth(0.4);
        doc.rect(x, ySig, w, h * 0.72).stroke();
        doc.fillColor(MUTED);
        doc.font("Times-Italic", 7.2);
        doc.text("Reservado para\nfirma manuscrita", x, ySig + 14, { width: w, align: "center" });
        doc.fillColor(TEXT);
      }
      doc.font("Times-Roman", 6.5);
      doc.text(`Colaborador ${i + 1}`, x, ySig + h + 5, { width: w, align: "center" });
    }
    const afterS = ySig + h + 32;
    doc.y = afterS;
    doc.moveDown(2);
    doc.font("Times-Roman", 9.8);
    doc.text("Por EL DESARROLLADOR: " + data.empresaDesarrolladora, { width: COL_W });
    doc.text("Quien comparece: " + data.representanteDesarrollador, { width: COL_W });
    doc.moveDown(16);

    doc.font("Times-Bold", 12);
    doc.text("EL CLIENTE", { width: COL_W });
    doc.moveDown(2);
    doc.font("Times-Roman", 10.4);
    doc.text(data.nombreCliente, { width: COL_W });
    doc.text(data.clienteEmpresa, { width: COL_W });
    doc.moveDown(6);
    doc.font("Times-Italic", 8.4);
    doc.text("Línea para rúbrica, firma o sello, si aplica, en el original impreso —", { width: COL_W });
    doc.text("_______________________________", { width: COL_W });
    doc.font("Times-Roman", 9.5);

    addPageFooters(doc);
    doc.end();
  });
}
