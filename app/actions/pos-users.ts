"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { issuePasswordSetupToken } from "@/lib/issue-password-setup-token";
import { buildPasswordSetupEmail } from "@/lib/password-setup-email";
import { sendMailMessage } from "@/lib/mail";

const emailIn = z.string().trim().email("Correo no válido");

export async function sendPasswordSetupEmailAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const displayNameRaw = String(formData.get("displayName") ?? "");
  const displayName = displayNameRaw.trim() ? displayNameRaw.trim() : null;

  const parsed = emailIn.safeParse(email);
  if (!parsed.success) {
    redirect("/clients?mailError=1");
  }

  let token: string;
  try {
    const r = await issuePasswordSetupToken(parsed.data);
    token = r.token;
  } catch (e) {
    const reason =
      e instanceof Error && e.message
        ? e.message.length <= 600
          ? e.message
          : `${e.message.slice(0, 590)}…`
        : "No se pudo generar el enlace de activación (api o clave de servicio).";
    redirect(`/clients?mailError=1&reason=${encodeURIComponent(reason)}`);
  }

  const { subject, text, html } = buildPasswordSetupEmail({ to: parsed.data, displayName, token });
  const result = await sendMailMessage({ to: parsed.data, subject, text, html });
  revalidatePath("/clients");

  if (!result.ok) {
    const reason =
      result.error.length <= 600 ? result.error : `${result.error.slice(0, 590)}…`;
    redirect(`/clients?mailError=1&reason=${encodeURIComponent(reason)}`);
  }

  redirect(
    `/clients?mailOk=1&to=${encodeURIComponent(parsed.data)}${result.logOnly ? "&logOnly=1" : ""}`,
  );
}
