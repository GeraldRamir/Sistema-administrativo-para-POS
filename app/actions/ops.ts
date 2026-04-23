"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, ClientStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { sendMailMessage } from "@/lib/mail";
import { buildDocumentText, documentFileName } from "@/lib/document-template";
import {
  createClientSchema,
  createDocumentSchema,
  createRevenueSchema,
  createActivitySchema,
  updateClientSchema,
  sendEmailSchema,
  testEmailSchema,
} from "@/lib/validators";

export type FormMessage = { ok: false; error: string } | { ok: true; message?: string };

export type RevenueFormState = null | (FormMessage & { amountHint?: string });
export type CommsFormState = null | FormMessage;
export type ActivityFormState = null | FormMessage;
export type DocumentFormState =
  | null
  | (FormMessage & { download?: { name: string; text: string } });

function err(m: string): { ok: false; error: string } {
  return { ok: false, error: m };
}

function parseEmpty(s: unknown): string | null {
  const t = typeof s === "string" ? s.trim() : "";
  return t.length > 0 ? t : null;
}

export async function createClientFormAction(
  _prev: FormMessage | null,
  formData: FormData,
): Promise<FormMessage> {
  const raw = {
    companyName: String(formData.get("companyName") ?? ""),
    contactEmail: String(formData.get("contactEmail") ?? ""),
    contactName: parseEmpty(formData.get("contactName")),
    phone: parseEmpty(formData.get("phone")),
    status: (String(formData.get("status") ?? "") || undefined) as ClientStatus | undefined,
    posOrganizationId: parseEmpty(formData.get("posOrganizationId")),
    posClientBaseUrl: parseEmpty(formData.get("posClientBaseUrl")),
    notes: parseEmpty(formData.get("notes")),
  };
  const parsed = createClientSchema.safeParse({
    companyName: raw.companyName,
    contactEmail: raw.contactEmail,
    contactName: raw.contactName,
    phone: raw.phone,
    status: raw.status,
    posOrganizationId: raw.posOrganizationId,
    posClientBaseUrl: raw.posClientBaseUrl,
    notes: raw.notes,
  });
  if (!parsed.success) {
    return err("Revise los campos obligatorios (empresa, correo válido).");
  }
  const d = parsed.data;
  let created: { id: string; companyName: string };
  try {
    const row = await prisma.client.create({
      data: {
        companyName: d.companyName,
        contactEmail: d.contactEmail,
        contactName: d.contactName ?? undefined,
        phone: d.phone ?? undefined,
        status: d.status ?? ClientStatus.LEAD,
        posOrganizationId: d.posOrganizationId ?? undefined,
        posClientBaseUrl: d.posClientBaseUrl ?? undefined,
        notes: d.notes ?? undefined,
      },
    });
    created = { id: row.id, companyName: row.companyName };
    await logActivity({
      action: "client.created",
      clientId: row.id,
      detail: row.id,
      metadata: { companyName: row.companyName },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return err("Email u organización POS duplicada.");
    }
    return err("No se pudo crear el cliente.");
  }
  revalidatePath("/clients");
  revalidatePath("/dashboard");
  redirect(`/clients/${created.id}?created=1`);
}

export async function updateClientFormAction(
  _prev: FormMessage | null,
  formData: FormData,
): Promise<FormMessage> {
  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) {
    return err("Falta el identificador del cliente.");
  }
  const json = {
    companyName: String(formData.get("companyName") ?? "") || undefined,
    contactEmail: String(formData.get("contactEmail") ?? "") || undefined,
    contactName: parseEmpty(formData.get("contactName")),
    phone: parseEmpty(formData.get("phone")),
    status: (String(formData.get("status") ?? "") || undefined) as ClientStatus | undefined,
    posOrganizationId: parseEmpty(formData.get("posOrganizationId")),
    posClientBaseUrl: parseEmpty(formData.get("posClientBaseUrl")),
    notes: parseEmpty(formData.get("notes")),
  };
  const parsed = updateClientSchema.safeParse(json);
  if (!parsed.success) {
    return err("Valide el formulario (correo, textos en rango, etc.).");
  }
  const d = parsed.data;
  if (Object.keys(d).length === 0) {
    return err("No hay cambios que guardar.");
  }
  try {
    await prisma.client.update({
      where: { id: clientId },
      data: {
        ...d,
        contactName: d.contactName === null ? null : d.contactName,
        phone: d.phone === null ? null : d.phone,
        posOrganizationId: d.posOrganizationId === null ? null : d.posOrganizationId,
        posClientBaseUrl: d.posClientBaseUrl === null ? null : d.posClientBaseUrl,
        notes: d.notes === null ? null : d.notes,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return err("Valores duplicados (email u organización POS).");
    }
    return err("No se pudo actualizar el cliente.");
  }
  await logActivity({ action: "client.updated", clientId, metadata: d as import("@prisma/client").Prisma.JsonObject });
  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/dashboard");
  redirect(`/clients/${clientId}?saved=1`);
}

export async function deleteClientFormAction(
  _prev: FormMessage | null,
  formData: FormData,
): Promise<FormMessage> {
  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) {
    return err("Identificador inválido.");
  }
  try {
    await prisma.client.delete({ where: { id: clientId } });
    await logActivity({ action: "client.deleted", clientId });
  } catch {
    return err("No se pudo eliminar (¿ya fue borrado?).");
  }
  revalidatePath("/clients");
  revalidatePath("/dashboard");
  revalidatePath("/documents");
  revalidatePath("/revenue");
  redirect("/clients?deleted=1");
}

/**
 * useActionState: devuelve estado (error o descarga) sin redirect salvo idempotencia.
 */
export async function createDocumentFormState(
  _prev: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const clientId = String(formData.get("clientId") ?? "");
  const withTemplate = formData.get("withTemplate") === "on" || formData.get("withTemplate") === "true";
  const raw = {
    kind: String(formData.get("kind") ?? "OTHER"),
    title: String(formData.get("title") ?? ""),
    fileKey: parseEmpty(formData.get("fileKey")),
  };
  const parsed = createDocumentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Indique título y tipo de documento válido." };
  }
  if (!clientId) {
    return { ok: false, error: "Elija un cliente." };
  }
  const d = parsed.data;
  const parent = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, companyName: true, contactEmail: true, contactName: true },
  });
  if (!parent) {
    return { ok: false, error: "Cliente no encontrado." };
  }
  const created = await prisma.clientDocument.create({
    data: {
      clientId,
      kind: d.kind,
      title: d.title,
      fileKey: d.fileKey ?? undefined,
    },
  });
  await logActivity({
    action: "document.created",
    clientId,
    detail: created.id,
    metadata: { kind: d.kind, title: d.title },
  });
  revalidatePath("/documents");
  revalidatePath("/dashboard");
  revalidatePath(`/clients/${clientId}`);

  let download: { name: string; text: string } | undefined;
  if (withTemplate) {
    const text = buildDocumentText(d.kind, d.title, parent);
    const name = documentFileName(d.title, d.kind);
    await prisma.clientDocument.update({
      where: { id: created.id },
      data: { fileKey: `generated:${name}` },
    });
    download = { name, text };
  }

  revalidatePath("/documents");
  revalidatePath(`/clients/${clientId}`);

  return { ok: true, message: "Documento registrado.", download };
}

export async function addRevenueFormAction(
  _prev: RevenueFormState,
  formData: FormData,
): Promise<RevenueFormState> {
  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) {
    return err("Elija un cliente.");
  }
  const amountStr = String(formData.get("amount") ?? "");
  const json = {
    amount: amountStr,
    currency: (String(formData.get("currency") ?? "DOP") || "DOP") as string,
    label: parseEmpty(formData.get("label")),
    occurredOn: parseEmpty(formData.get("occurredOn")) ?? undefined,
  };
  const parsed = createRevenueSchema.safeParse({
    amount: json.amount,
    currency: json.currency,
    label: json.label,
    occurredOn: json.occurredOn,
  });
  if (!parsed.success) {
    return err("Monto o fecha no válidos.");
  }
  const d = parsed.data;
  const occurred = d.occurredOn ? new Date(d.occurredOn) : new Date();
  await prisma.revenueEntry.create({
    data: {
      clientId,
      amount: new Prisma.Decimal(String(d.amount)),
      currency: d.currency,
      label: d.label ?? undefined,
      occurredOn: occurred,
    },
  });
  await logActivity({
    action: "revenue.entry_created",
    clientId,
    metadata: { amount: d.amount, currency: d.currency },
  });
  revalidatePath("/revenue");
  revalidatePath("/dashboard");
  revalidatePath(`/clients/${clientId}`);
  return { ok: true, message: "Ingreso registrado." };
}

export async function addActivityFormAction(
  _prev: ActivityFormState,
  formData: FormData,
): Promise<ActivityFormState> {
  const json = {
    action: String(formData.get("action") ?? "").trim(),
    detail: parseEmpty(formData.get("detail")),
    clientId: parseEmpty(formData.get("clientId")),
  };
  const parsed = createActivitySchema.safeParse({
    action: json.action,
    detail: json.detail,
    clientId: json.clientId,
  });
  if (!parsed.success || !json.action) {
    return err("Escriba una acción o revise el cliente.");
  }
  const d = parsed.data;
  if (d.clientId) {
    const c = await prisma.client.findUnique({ where: { id: d.clientId }, select: { id: true } });
    if (!c) {
      return err("El cliente no existe.");
    }
  }
  await logActivity({
    action: d.action,
    detail: d.detail ?? undefined,
    clientId: d.clientId ?? undefined,
  });
  revalidatePath("/activity");
  revalidatePath("/dashboard");
  if (d.clientId) {
    revalidatePath(`/clients/${d.clientId}`);
  }
  return { ok: true, message: "Evento añadido a la bitácora." };
}

export async function sendCommsFormAction(
  _prev: CommsFormState,
  formData: FormData,
): Promise<CommsFormState> {
  const to = String(formData.get("to") ?? "");
  const subject = String(formData.get("subject") ?? "");
  const text = parseEmpty(formData.get("text")) ?? undefined;
  const html = parseEmpty(formData.get("html")) ?? undefined;
  const clientId = parseEmpty(formData.get("clientId")) ?? undefined;
  const template = parseEmpty(formData.get("template")) ?? undefined;
  const parsed = sendEmailSchema.safeParse({ to, subject, text, html, clientId, template });
  if (!parsed.success) {
    return err("Destinatario, asunto o cuerpo inválido.");
  }
  const d = parsed.data;
  if (!d.text && !d.html) {
    return err("Añada texto o HTML al mensaje.");
  }
  if (d.clientId) {
    const c = await prisma.client.findUnique({ where: { id: d.clientId }, select: { id: true } });
    if (!c) {
      return err("clientId no existe.");
    }
  }
  const result = await sendMailMessage({
    to: d.to,
    subject: d.subject,
    text: d.text,
    html: d.html,
  });
  if (!result.ok) {
    await prisma.outboundEmailLog.create({
      data: {
        toEmail: d.to,
        subject: d.subject,
        template: d.template,
        clientId: d.clientId,
        status: "FAILED",
        error: result.error,
      },
    });
    revalidatePath("/comms");
    return err(result.error);
  }
  const log = await prisma.outboundEmailLog.create({
    data: {
      toEmail: d.to,
      subject: d.subject,
      template: d.template,
      clientId: d.clientId,
      status: result.logOnly ? "LOG_ONLY" : "SENT",
    },
  });
  await logActivity({
    action: "email.sent",
    clientId: d.clientId,
    detail: log.id,
    metadata: { to: d.to, subject: d.subject },
  });
  revalidatePath("/comms");
  revalidatePath("/dashboard");
  return { ok: true, message: "Mensaje enviado o registrado en log." };
}

export async function testCommsFormAction(
  _prev: CommsFormState,
  formData: FormData,
): Promise<CommsFormState> {
  const to = String(formData.get("to") ?? "");
  const parsed = testEmailSchema.safeParse({ to });
  if (!parsed.success) {
    return err("Dirección de prueba no válida.");
  }
  const result = await sendMailMessage({
    to: parsed.data.to,
    subject: "POS Ops — prueba (Comunicados)",
    text: `Mensaje de prueba. ${new Date().toISOString()}`,
  });
  if (!result.ok) {
    return err(result.error);
  }
  revalidatePath("/comms");
  return { ok: true, message: "Prueba de envío registrada o solo log en consola." };
}
