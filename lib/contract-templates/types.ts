/**
 * Catálogo de contratos (extensible). No vinculado a clientes ni usuarios del POS.
 */
export const CONTRACT_CATALOG = [
  {
    id: "DESARROLLO_SOFTWARE" as const,
    label: "Desarrollo de software",
    description: "Proyecto a medida, precio, plazos, IP y soporte",
    available: true,
  },
  {
    id: "SAAS" as const,
    label: "SaaS / suscripción",
    description: "Acuerdo de servicio en la nube y facturación recurrente",
    available: false,
  },
  {
    id: "MANTENIMIENTO" as const,
    label: "Mantenimiento y soporte",
    description: "Niveles de servicio, tiempos de respuesta, exclusiones",
    available: false,
  },
  {
    id: "NDA" as const,
    label: "NDA / confidencialidad",
    description: "Obligaciones de no divulgación y uso de la información",
    available: false,
  },
  {
    id: "LICENCIA" as const,
    label: "Licencia de uso de software",
    description: "Alcance, limitaciones y actualizaciones",
    available: false,
  },
  {
    id: "FREELANCE" as const,
    label: "Freelance programador",
    description: "Entregables, propiedad intelectual y pago por hitos",
    available: false,
  },
  {
    id: "IMPLEMENTACION" as const,
    label: "Implementación y capacitación",
    description: "Alcance de puesta en marcha, formación y aceptación",
    available: false,
  },
] as const;

export type ContractTemplateId = (typeof CONTRACT_CATALOG)[number]["id"];
