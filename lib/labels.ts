import { ClientStatus, DocumentKind } from "@prisma/client";

export const clientStatusLabel: Record<ClientStatus, string> = {
  LEAD: "Lead",
  PROVISIONED: "Aprovisionado",
  ACTIVE: "Activo",
  PAUSED: "Pausado",
  CHURNED: "Baja",
};

export const documentKindLabel: Record<DocumentKind, string> = {
  LICENSE: "Licencia",
  CONTRACT: "Contrato",
  OTHER: "Otro",
};
