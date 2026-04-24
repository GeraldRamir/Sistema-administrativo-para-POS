import { z } from "zod";
import { ClientStatus, DocumentKind } from "@prisma/client";

export const createClientSchema = z.object({
  companyName: z.string().min(1).max(200),
  contactEmail: z.string().email(),
  contactName: z.string().max(200).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  status: z.nativeEnum(ClientStatus).optional(),
  posOrganizationId: z.string().min(1).max(200).optional().nullable(),
  posClientBaseUrl: z.string().max(500).optional().nullable(),
  notes: z.string().max(20000).optional().nullable(),
});

export const updateClientSchema = createClientSchema.partial();

export const createDocumentSchema = z.object({
  kind: z.nativeEnum(DocumentKind),
  title: z.string().min(1).max(300),
  fileKey: z.string().max(500).optional().nullable(),
});

export const createRevenueSchema = z.object({
  amount: z.coerce.number().finite(),
  currency: z.string().min(2).max(8).default("DOP"),
  label: z.string().max(500).optional().nullable(),
  occurredOn: z.coerce.date().optional(),
});

export const createActivitySchema = z.object({
  action: z.string().min(1).max(200),
  detail: z.string().max(10000).optional().nullable(),
  clientId: z.string().cuid().optional().nullable(),
  metadata: z.unknown().optional().nullable(),
});

export const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(500),
  text: z.string().max(100000).optional(),
  html: z.string().max(500000).optional(),
  clientId: z.string().cuid().optional(),
  template: z.string().max(200).optional(),
  replyTo: z.string().email().optional(),
});

export const testEmailSchema = z.object({
  to: z.string().email(),
});

/** Contrato de desarrollo de software (módulo Contratos; sin vínculo a BD) */
export const desarrolloSoftwareContractSchema = z.object({
  empresaDesarrolladora: z.string().min(1).max(300),
  representanteDesarrollador: z.string().min(1).max(200),
  clienteEmpresa: z.string().min(1).max(300),
  nombreCliente: z.string().min(1).max(200),
  proyecto: z.string().min(1).max(500),
  modulos: z.string().min(1).max(20000),
  montoTotal: z.string().min(1).max(200),
  inicial: z.string().min(1).max(200),
  cuotas: z.string().min(1).max(2000),
  diasHabiles: z.coerce.number().int().positive("Use un entero mayor a 0 en días hábiles.").max(3650),
  fechaInicio: z.string().min(1).max(32),
  fechaEntrega: z.string().max(32).optional().or(z.literal("")),
  tecnologias: z.string().max(5000).optional().or(z.literal("")),
  mesesSoporte: z.coerce.number().int().min(0, "Mínimo 0 meses").max(120),
  quienPoseeCodigo: z.string().min(1).max(500),
  penalidadAtrasoPago: z.string().max(2000).optional().or(z.literal("")),
  jurisdiccion: z.string().min(1).max(500),
  fechaHoy: z.string().min(1).max(32),
});
