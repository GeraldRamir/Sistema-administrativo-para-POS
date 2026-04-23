import Link from "next/link";
import type { MailDeliveryStatus } from "@/lib/mail";
import type { PosUsersFetchResult } from "@/lib/pos-users";
import { PosUsersMailTable } from "@/components/ops/pos-users-mail-table";

type Q = { [k: string]: string | string[] | undefined };

function first(q: Q, k: string): string | undefined {
  const v = q[k];
  if (Array.isArray(v)) return v[0];
  return v;
}

function countByRole(members: { role: string }[]) {
  const o: Record<string, number> = {};
  for (const m of members) {
    o[m.role] = (o[m.role] ?? 0) + 1;
  }
  return o;
}

type Props = {
  result: PosUsersFetchResult;
  posApiBase: string | null;
  hasServiceKey: boolean;
  hasDbUrl: boolean;
  posAppUrl: string;
  mailDelivery: MailDeliveryStatus;
  searchParams: Q;
};

export function PosClientsWorkspace({
  result,
  posApiBase,
  hasServiceKey,
  hasDbUrl,
  posAppUrl,
  mailDelivery,
  searchParams,
}: Props) {
  const mailOk = first(searchParams, "mailOk");
  const mailError = first(searchParams, "mailError");
  const toAddr = first(searchParams, "to");
  const logOnly = first(searchParams, "logOnly");
  const reason = first(searchParams, "reason");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Clientes (POS System)</h1>
        <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Administración de <strong>usuarios</strong> de la instancia conectada al producto. El botón <strong>Enviar
          correo</strong> dispara de forma inmediata un correo con plantilla fija para el asistente de acceso
          (configuración o inicio de sesión). Es independiente de{" "}
          <Link className="text-primary underline-offset-2 hover:underline" href="/comms">
            Comunicados
          </Link>{" "}
          (redacción libre).
        </p>
      </div>

      {mailDelivery.mode === "missing" ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="font-medium">Configuración de envío requerida</p>
          <p className="mt-1 text-amber-900/90 dark:text-amber-100/90">{mailDelivery.hint}</p>
        </div>
      ) : mailDelivery.mode === "log_only" ? (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground">
          {mailDelivery.hint}
        </div>
      ) : null}

      {mailOk ? (
        <div
          className={
            logOnly
              ? "rounded-lg border border-amber-500/50 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100"
              : "rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm"
          }
        >
          {logOnly ? (
            <>
              <p className="font-medium">No se envió un correo real a la bandeja</p>
              <p className="mt-1 text-amber-900/90 dark:text-amber-100/90">
                <code className="rounded bg-amber-100/80 px-1 font-mono text-xs dark:bg-amber-900/50">MAIL_LOG_ONLY=true</code> : el mensaje
                solo se imprimió en la <strong>consola</strong> del servidor (línea <code className="text-xs">[MAIL_LOG_ONLY]</code>). A{" "}
                {toAddr ? <span className="font-mono">{toAddr}</span> : "ese correo"}{" "}
                <strong>no le llega nada</strong> todavía.
              </p>
              <p className="mt-2 text-sm">
                Para entrega real: ponga <code className="font-mono">MAIL_LOG_ONLY=false</code>, reinicie{" "}
                <code className="font-mono">npm run dev</code> y asegure SMTP (EMAIL_*) en <code className="font-mono">.env</code>.
              </p>
            </>
          ) : (
            <p>
              <span className="text-success">Correo enviado</span> a{" "}
              {toAddr ? <span className="font-mono">{toAddr}</span> : "el destinatario"}.
            </p>
          )}
        </div>
      ) : null}
      {mailError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-foreground">
          <p>
            <span className="font-medium text-destructive">No se pudo enviar el correo</span>
            {reason ? null : (
              <span className="ml-1 text-muted-foreground">— Revise el motivo abajo o la configuración SMTP/MAIL_LOG_ONLY.</span>
            )}
          </p>
          {reason ? (
            <p className="mt-2 whitespace-pre-wrap break-words rounded border border-border bg-background p-2 font-mono text-xs text-foreground">
              {reason}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Usuarios (API)</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {result.ok ? result.members.length : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Correo verificado</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {result.ok ? result.members.filter((m) => m.emailVerified).length : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sin verificar</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {result.ok ? result.members.filter((m) => !m.emailVerified).length : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Enlaces</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <Link className="text-primary underline-offset-2 hover:underline" href="/docs">
                Documentación API
              </Link>
            </li>
            <li>
              <a
                className="text-primary underline-offset-2 hover:underline"
                href={posAppUrl}
                rel="noreferrer"
                target="_blank"
              >
                App POS (nueva ventana)
              </a>
            </li>
          </ul>
        </div>
      </div>

      {result.ok ? (
        <div className="rounded-xl border border-border bg-muted/20 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-foreground">Distribución por rol</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(countByRole(result.members)).map(([role, n]) => (
              <span
                key={role}
                className="inline-flex items-center rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground"
              >
                {role}
                <span className="ml-1.5 text-muted-foreground">({n})</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-sm sm:p-5">
          <h2 className="text-sm font-semibold text-foreground">Conexión al producto</h2>
          <ul className="mt-3 space-y-2">
            <li>
              <span className="text-foreground">API (POS)</span>{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">{posApiBase ?? "no configurada"}</code>
            </li>
            <li>
              <span className="text-foreground">Clave de integración</span>{" "}
              {hasServiceKey ? <span className="text-success">definida</span> : <span>falta POS_SERVICE_KEY</span>}
            </li>
            <li>
              <span className="text-foreground">Lectura directa BD</span>{" "}
              {hasDbUrl ? <span className="text-success">POS_DATABASE_URL</span> : <span>no configurada</span>}
            </li>
            <li>
              <span className="text-foreground">Enlace en correo de acceso (plantilla)</span>{" "}
              <code className="break-all rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">{posAppUrl}</code>
            </li>
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-sm sm:p-5">
          <h2 className="text-sm font-semibold text-foreground">Tareas de administración</h2>
          <ul className="mt-3 list-inside list-disc space-y-1.5">
            <li>Envíe el correo de <strong>activación de contraseña</strong> solo al destinatario: el enlace le abre <code className="text-xs">/setup/claim</code> con un código; no tendrá que escribir su correo. Luego podrá ir a <code className="text-xs">/login</code>.</li>
            <li>Ajuste <code className="text-xs">POS_APP_PUBLIC_URL</code> en pos-ops para que los enlaces apunten al despliegue real.</li>
            <li>Compruebe SMTP: <code className="text-xs">SMTP_HOST</code>, <code className="text-xs">MAIL_FROM</code> o <code className="text-xs">MAIL_LOG_ONLY</code>.</li>
            <li>Para mensajes de marketing o convocatoria use el módulo <Link className="text-primary underline" href="/comms">Comunicados</Link>.</li>
          </ul>
        </div>
      </div>

      {!result.ok ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <p className="font-medium text-destructive">{result.message}</p>
          {result.detail ? (
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-background p-2 text-xs text-muted-foreground">
              {result.detail}
            </pre>
          ) : null}
        </div>
      ) : result.members.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay usuarios en la base del POS o la integración no devolvió filas.
        </p>
      ) : null}

      {result.ok && result.members.length > 0 ? <PosUsersMailTable members={result.members} /> : null}
    </div>
  );
}
