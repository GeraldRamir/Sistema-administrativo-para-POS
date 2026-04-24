import PDFDocument from "pdfkit";
import type { DesarrolloSoftwareInput } from "@/lib/contract-templates/desarrollo-software";
import {
  buildDesarrolloSoftwareContractPdfBody,
  CONTRATO_PDF_NOTA_PIE,
} from "@/lib/contract-templates/desarrollo-software";

/**
 * Genera el PDF (buffer) del contrato con apartado de firmas para 3 imágenes de colaboradores.
 */
export function buildDesarrolloSoftwarePdf(
  data: DesarrolloSoftwareInput,
  signatureImages: [Buffer | null, Buffer | null, Buffer | null],
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const body = buildDesarrolloSoftwareContractPdfBody(data);
    doc.font("Helvetica");
    doc.fontSize(10);
    doc.text(body, { width: 500, align: "left" });
    doc.moveDown(0.5);
    doc.fontSize(8);
    doc.fillColor("#444444");
    doc.text(CONTRATO_PDF_NOTA_PIE, { width: 500, align: "left" });
    doc.fillColor("#000000");

    doc.addPage();
    doc.x = 50;
    doc.y = 50;
    doc.fontSize(16);
    doc.text("FIRMAS", { width: 500 });
    const lineY = doc.y + 4;
    doc.moveTo(50, lineY).lineTo(545, lineY).stroke();
    doc.y = lineY + 14;
    doc.fontSize(10.5);
    doc.text("EL DESARROLLADOR (colaboradores comerciales / equipo de venta)", { width: 500 });
    doc.moveDown(0.2);
    doc.fontSize(8.5);
    doc.fillColor("#333333");
    doc.text(
      "Cada recuadro corresponde a la firma manuscrita (dibujada en el sistema) de un colaborador de venta. Si quedó vacío, imprima o firme en el espacio indicado.",
      { width: 500 },
    );
    doc.fillColor("#000000");
    doc.moveDown(0.6);

    const w = 145;
    const h = 55;
    const gap = 15;
    const left0 = 50;
    const y0 = doc.y;
    for (let i = 0; i < 3; i++) {
      const x = left0 + i * (w + gap);
      const buf = signatureImages[i];
      if (buf && buf.length > 0) {
        try {
          doc.image(buf, x, y0, { fit: [w, h] });
        } catch {
          doc.lineWidth(0.5);
          doc.rect(x, y0, w, h * 0.7).stroke();
          doc.font("Helvetica");
          doc.fontSize(7);
          doc.text("(imagen no soportada o corrupta)", x + 4, y0 + 20, { width: w - 8, align: "center" });
        }
      } else {
        doc.lineWidth(0.5);
        doc.rect(x, y0, w, h * 0.7).stroke();
        doc.font("Helvetica");
        doc.fontSize(7.5);
        doc.fillColor("#666666");
        doc.text("Sin firma\nen pantalla", x + 4, y0 + 16, { width: w - 8, align: "center" });
        doc.fillColor("#000000");
      }
      doc.font("Helvetica");
      doc.fontSize(7);
      doc.text(`Colaborador ${i + 1}`, x, y0 + h + 4, { width: w, align: "center" });
    }

    const afterImages = y0 + h + 32;
    doc.y = afterImages;
    doc.x = 50;
    doc.moveDown(0.2);
    doc.fontSize(9.5);
    doc.text(`Empresa desarrolladora: ${data.empresaDesarrolladora}`);
    doc.text(`Representante: ${data.representanteDesarrollador}`);

    doc.moveDown(1.2);
    doc.fontSize(12);
    doc.text("EL CLIENTE", { width: 500, underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10.5);
    doc.text(data.nombreCliente, { width: 500 });
    doc.text(data.clienteEmpresa, { width: 500 });
    doc.moveDown(0.5);
    doc.fontSize(9);
    doc.text("__________________________________________");
    doc.moveDown(0.15);
    doc.fontSize(8);
    doc.fillColor("#555555");
    doc.text("Nombre y firma / sello (si aplica).", { oblique: true, width: 500 });
    doc.fillColor("#000000");

    doc.end();
  });
}
