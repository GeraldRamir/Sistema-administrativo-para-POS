import { Card, PageHeader } from "@/components/ops/form-primitives";
import { ContractGeneratorForm } from "@/components/ops/contract-generator-form";
import { CONTRACT_CATALOG } from "@/lib/contract-templates/types";

export default function ContratosPage() {
  const pronto = CONTRACT_CATALOG.filter((c) => !c.available).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contratos"
        description={
          <>
            Generación de <strong>PDF</strong> sin vinculación a clientes ni usuarios del POS. Las
            <strong> firmas de los colaboradores</strong> se dibujan en pantalla. Use el formulario, descargue el PDF
            y revise con un asesor antes de firmar. Hay {pronto} modelos adicionales previstos en el catálogo.
          </>
        }
      />
      <Card>
        <ContractGeneratorForm />
      </Card>
    </div>
  );
}
