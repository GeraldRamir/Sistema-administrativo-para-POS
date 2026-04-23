import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMailMessage } from "@/lib/mail";
import { logActivity } from "@/lib/activity";
import { sendEmailSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const json: unknown = await request.json();
    const parsed = sendEmailSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validación", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const d = parsed.data;
    if (!d.text && !d.html) {
      return NextResponse.json(
        { message: "Debe enviar text o html" },
        { status: 400 },
      );
    }
    if (d.clientId) {
      const c = await prisma.client.findUnique({ where: { id: d.clientId }, select: { id: true } });
      if (!c) {
        return NextResponse.json({ message: "clientId no existe" }, { status: 400 });
      }
    }

    const result = await sendMailMessage({
      to: d.to,
      subject: d.subject,
      text: d.text,
      html: d.html,
      replyTo: d.replyTo,
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
      return NextResponse.json({ message: result.error, logged: true }, { status: 502 });
    }

    const log = await prisma.outboundEmailLog.create({
      data: {
        toEmail: d.to,
        subject: d.subject,
        template: d.template,
        clientId: d.clientId,
        status: result.logOnly ? "LOG_ONLY" : "SENT",
        error: null,
      },
    });

    await logActivity({
      action: "email.sent",
      clientId: d.clientId,
      detail: log.id,
      metadata: { to: d.to, subject: d.subject, template: d.template },
    });

    return NextResponse.json({
      ok: true,
      logId: log.id,
      messageId: "messageId" in result ? result.messageId : undefined,
      logOnly: "logOnly" in result ? result.logOnly : false,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error del servidor";
    return NextResponse.json({ message }, { status: 500 });
  }
}
