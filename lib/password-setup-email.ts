import "server-only";
import { getPosAppPublicUrl } from "@/lib/pos-app-url";

type BuildInput = {
  to: string;
  displayName?: string | null;
  /** Token de un solo uso; el enlace /setup/claim?token= vincula la contraseña al correo en base de datos */
  token: string;
};

/**
 * Colores aproximados al tema claro de pos-project (:root --primary, --background, --border, etc.)
 * (HTML de correo: solo estilos inline; sin oklch por compatibilidad con clientes antiguos).
 */
const E = {
  pageBg: "#f4f4f5",
  cardBg: "#ffffff",
  text: "#18181b",
  muted: "#71717a",
  border: "#e4e4e7",
  /** ≈ --primary (oklch 0.2795 0.0368 260) */
  primary: "#1e293b",
  onPrimary: "#f8fafc",
  /** acento sutil (sidebar / zinc) */
  brandBar: "#1e293b",
} as const;

/**
 * Plantilla fija: invitación a completar acceso (asistente de configuración / inicio de sesión).
 * No usa el módulo Comunicados: es un envío transaccional desde pos-ops.
 */
export function buildPasswordSetupEmail(input: BuildInput): { subject: string; text: string; html: string } {
  const base = getPosAppPublicUrl();
  const tokenQ = new URLSearchParams({ token: input.token });
  const setupUrl = `${base}/setup?${tokenQ.toString()}`;
  const loginUrl = `${base}/login`;
  const greet = input.displayName?.trim() ? `Hola ${input.displayName.trim()},` : "Hola,";

  const subject = "Active su acceso al sistema POS";
  const text = [
    greet,
    "",
    "Un administrador le solicita completar su cuenta en el Sistema POS.",
    "",
    "Definir contraseña (enlace personal, no lo comparta):",
    setupUrl,
    "",
    "O inicie sesión si ya tiene cuenta:",
    loginUrl,
    "",
    "Si un enlace no abre, confirme con su equipo la URL del despliegue (POS_APP_PUBLIC_URL en operaciones).",
    "",
    "—",
    "Mensaje automático; no responda a este correo.",
  ].join("\n");

  const safeGreet = escapeHtml(greet);
  const urlForText = escapeHtml(setupUrl);

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>Sistema POS</title>
  <!-- Fuentes como en pos-project (Inter) — algunos clientes las ignoran; hay fallback. -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background-color:${E.pageBg};-webkit-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${E.pageBg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;border-collapse:separate;border-radius:12px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.05),0 1px 2px rgba(0,0,0,0.05);border:1px solid ${E.border};background-color:${E.cardBg};">
          <tr>
            <td style="background-color:${E.brandBar};padding:20px 28px;">
              <p style="margin:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;">Consola de operaciones</p>
              <p style="margin:6px 0 0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:20px;font-weight:600;letter-spacing:-0.02em;color:${E.onPrimary};">Sistema POS</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px;">
              <p style="margin:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:16px;line-height:1.5;color:${E.text};">${safeGreet}</p>
              <p style="margin:16px 0 0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:${E.text};">
                Un administrador le pide <strong>definir su contraseña</strong>. El botón le lleva a una pantalla donde <strong>no</strong> tendrá que volver a escribir su correo: el enlace ya lo identifica.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 24px;" align="center">
              <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:separate;">
                <tr>
                  <td style="border-radius:8px;background-color:${E.primary};">
                    <a href="${setupUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 32px;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;font-weight:600;letter-spacing:-0.01em;color:${E.onPrimary};text-decoration:none;">Establecer contraseña</a>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;line-height:1.5;color:${E.muted};">Si el botón no responde, copie y pegue en el navegador:<br />
                <a href="${setupUrl}" style="color:#3b4a5c;word-break:break-all;">${urlForText}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid ${E.border};border-radius:8px;background-color:#fafafa;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0 0 8px;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;font-weight:600;color:${E.muted};text-transform:uppercase;letter-spacing:0.06em;">¿Ya tiene contraseña?</p>
                    <a href="${loginUrl}" target="_blank" rel="noopener noreferrer" style="font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:500;color:#334155;text-decoration:underline;">Iniciar sesión en el Sistema POS →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;">
              <p style="margin:0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;line-height:1.5;color:#a1a1aa;">Si un enlace no abre, confirme con su administrador la URL pública del POS (variable <code style="font-size:11px;">POS_APP_PUBLIC_URL</code> en operaciones). Este mensaje es automático; no responda a este remitente.</p>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;color:#a1a1aa;">Punto de venta · Sistema interno</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
