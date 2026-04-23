import "server-only";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

const logOnly = (): boolean =>
  (process.env.MAIL_LOG_ONLY ?? "false").toLowerCase() === "true";

function envFirst(...keys: string[]): string {
  for (const k of keys) {
    const v = process.env[k]?.trim();
    if (v) return v;
  }
  return "";
}

function smtpHost() {
  return envFirst("SMTP_HOST", "EMAIL_HOST");
}

function smtpUser() {
  return envFirst("SMTP_USER", "EMAIL_USER");
}

function smtpPass() {
  return envFirst("SMTP_PASS", "EMAIL_PASSWORD");
}

/** Gmail “contraseña de aplicación” a veces viene con espacios; el login SMTP va sin espacios. */
function smtpAuthPass() {
  return smtpPass().replace(/\s+/g, "");
}

function smtpPort() {
  const raw = envFirst("SMTP_PORT", "EMAIL_PORT");
  if (!raw) return 587;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 587;
}

function smtpSecure() {
  const s = envFirst("SMTP_SECURE", "EMAIL_SECURE");
  if (s) return s.toLowerCase() === "true";
  return false;
}

function mailFrom() {
  return envFirst("MAIL_FROM", "EMAIL_FROM") || "pos-ops@localhost";
}

function isLikelyGmailSmtp() {
  const h = smtpHost().toLowerCase();
  return h.includes("gmail.com") || h.includes("googlemail.com");
}

function extractFirstEmail(s: string): string | null {
  const t = s.trim();
  const angle = t.match(/<([^>]+)>/);
  if (angle?.[1]) {
    return angle[1].replace(/[\s\u200b]+/g, "").trim() || null;
  }
  if (/^[^\s<>"']+@[^\s<>"']+\.[^\s<>"']+$/i.test(t)) {
    return t;
  }
  return null;
}

/**
 * Gmail SMTP suele sustituir o no entregar si `From` ≠ la cuenta con la que se autentica.
 * Ajustamos el remitente al mismo correo que EMAIL_USER.
 */
function resolveSmtpFromHeader(): string {
  const user = smtpUser();
  const raw = mailFrom();
  if (!isLikelyGmailSmtp() || !user) {
    return raw;
  }
  const userEmail = extractFirstEmail(user) ?? user.trim();
  const fromEmail = extractFirstEmail(raw);
  if (fromEmail && fromEmail.toLowerCase() === userEmail.toLowerCase()) {
    return raw;
  }
  if (raw.includes("<") && raw.includes(">")) {
    return raw.replace(/<[^>]+>/, `<${userEmail}>`);
  }
  return `POS <${userEmail}>`;
}

const getTransporter = (): Transporter | null => {
  if (logOnly()) {
    return null;
  }
  if (transporter) {
    return transporter;
  }
  const host = smtpHost();
  const user = smtpUser();
  const pass = smtpAuthPass();
  if (!host || !user || !pass) {
    return null;
  }
  const port = smtpPort();
  const secure = smtpSecure();
  transporter = nodemailer.createTransport({
    host,
    port: Number.isFinite(port) ? port : 587,
    secure,
    requireTLS: !secure && port === 587,
    auth: { user, pass },
  });
  return transporter;
};

export type SendMailInput = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
};

/**
 * Envía un correo. Si SMTP no está configurado y MAIL_LOG_ONLY=true, solo registra en consola (dev).
 * Devuelve { ok: true, messageId? } o { ok: false, error: string }.
 */
export async function sendMailMessage(
  input: SendMailInput,
): Promise<{ ok: true; messageId?: string; logOnly?: boolean } | { ok: false; error: string }> {
  if (!input.text && !input.html) {
    return { ok: false, error: "Falta cuerpo del mensaje (text o html)" };
  }

  if (logOnly()) {
    // eslint-disable-next-line no-console
    console.log(
      "[MAIL_LOG_ONLY] to=%s subject=%s\n---\n%s",
      input.to,
      input.subject,
      input.text ?? input.html ?? "",
    );
    return { ok: true, logOnly: true };
  }

  const t = getTransporter();
  if (!t) {
    return {
      ok: false,
      error:
        "Correo no configurado. Defina EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD (o SMTP_*) o MAIL_LOG_ONLY=true para solo consola.",
    };
  }

  const from = resolveSmtpFromHeader();

  try {
    const info = await t.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo,
    });
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log("[mail] sent ok to=%s messageId=%s from=%s", input.to, info.messageId, from);
    }
    return { ok: true, messageId: info.messageId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al enviar el mensaje";
    return { ok: false, error: msg };
  }
}

export function isMailConfigured(): boolean {
  if (logOnly()) {
    return true;
  }
  return Boolean(smtpHost() && smtpUser() && getTransporter());
}

export type MailDeliveryStatus = {
  mode: "log_only" | "smtp" | "missing";
  hint: string;
};

/** Para la UI: cómo está configurado el envío (consola vs SMTP vs sin nada). */
export function getMailDeliveryStatus(): MailDeliveryStatus {
  if (logOnly()) {
    return {
      mode: "log_only",
      hint:
        "MAIL_LOG_ONLY=true: no se envía por internet; el mensaje aparece en la consola del proceso `next dev` o `next start`. Para envío real, ponga MAIL_LOG_ONLY=false y configure SMTP abajo.",
    };
  }
  if (smtpHost() && smtpUser()) {
    return {
      mode: "smtp",
      hint: "Correo (EMAIL_* o SMTP_*) listo: los envíos usan su servidor. Si falla, revise `next dev` (auth Gmail, “contraseña de aplicación”, etc.).",
    };
  }
  return {
    mode: "missing",
    hint:
      "Falta correo: ponga MAIL_LOG_ONLY=true (solo consola) o defina EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD, EMAIL_FROM (o equivalencias SMTP_*) y reinicie.",
  };
}
