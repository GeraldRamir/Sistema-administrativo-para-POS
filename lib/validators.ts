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
