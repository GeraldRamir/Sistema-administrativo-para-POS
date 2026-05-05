import { getSaaSContractPdfModel, type SaasInput, sanitizeSaaSInputForPdf } from "@/lib/contract-templates/saas";
import { buildFormalContractPdf } from "./formal-contract-pdf";

export function buildSaaSContractPdf(
  data: SaasInput,
  signatureImages: [Buffer | null, Buffer | null, Buffer | null],
): Promise<Buffer> {
  const d = sanitizeSaaSInputForPdf(data);
  const model = getSaaSContractPdfModel(d);
  return buildFormalContractPdf(
    model,
    {
      pdfSubject: "Borrador · contrato de provisión de servicio SaaS",
      colaboradoresIntro:
        "Firmas de colaboradores (comercial, vinculados a EL PROVEEDOR). Trazo capturado en el formulario; si un recuadro queda vacío, resérvelo para firma manuscrita al imprimir.",
      proveedorRolLabel: "EL PROVEEDOR",
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
