import { NextRequest, NextResponse } from "next/server";
import { sendMailMessage } from "@/lib/mail";
import { testEmailSchema } from "@/lib/validators";

/**
 * Envía un correo de prueba (mismo pipeline que /emails/send, sin guardar Client).
 */
export async function POST(request: NextRequest) {
  try {
    const json: unknown = await request.json();
    const parsed = testEmailSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validación", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const to = parsed.data.to;
    const result = await sendMailMessage({
      to,
      subject: "Prueba POS Ops",
      text: "Si recibe este mensaje, el envío SMTP (o MAIL_LOG_ONLY) está operativo.",
      html: "<p>Si recibe este mensaje, el envío SMTP (o <code>MAIL_LOG_ONLY</code>) está operativo.</p>",
    });
    if (!result.ok) {
      return NextResponse.json({ message: result.error }, { status: 502 });
    }
    return NextResponse.json({
      ok: true,
      logOnly: "logOnly" in result ? result.logOnly : false,
      messageId: "messageId" in result ? result.messageId : undefined,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error del servidor";
    return NextResponse.json({ message }, { status: 500 });
  }
}
