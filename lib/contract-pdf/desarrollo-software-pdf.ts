import {
  type DesarrolloSoftwareInput,
  getDesarrolloSoftwareContractPdfModel,
  sanitizeDesarrolloSoftwareInputForPdf,
} from "@/lib/contract-templates/desarrollo-software";
import { buildFormalContractPdf } from "./formal-contract-pdf";

export function buildDesarrolloSoftwarePdf(
  data: DesarrolloSoftwareInput,
  signatureImages: [Buffer | null, Buffer | null, Buffer | null],
): Promise<Buffer> {
  const d = sanitizeDesarrolloSoftwareInputForPdf(data);
  const model = getDesarrolloSoftwareContractPdfModel(d);
  return buildFormalContractPdf(
    model,
    {
      pdfSubject: "Borrador · contrato de prestación de servicios de desarrollo de software",
      colaboradoresIntro:
        "Firmas de colaboradores (comercial, EL PRESTADOR). Trazo capturado en el formulario; si un recuadro queda vacío, resérvelo para firma manuscrita al imprimir.",
      proveedorRolLabel: "EL PRESTADOR",
    },
    {
      empresaProveedor: d.empresaDesarrolladora,
      repProveedor: d.representanteDesarrollador,
      nombreCliente: d.nombreCliente,
      clienteEmpresa: d.clienteEmpresa,
    },
    signatureImages,
  );
}
