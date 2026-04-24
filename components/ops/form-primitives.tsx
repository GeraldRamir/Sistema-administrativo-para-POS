import type { ReactNode } from "react";

/** Clase reutilizable para enlaces de navegación secundaria (header de página, vuelta atrás) */
export const appShellLink = "text-sm font-medium text-primary underline-offset-2 hover:underline";

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
        {description ? <div className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function FormAlert({
  type,
  message,
  fieldErrors,
}: {
  type: "ok" | "err";
  message: string;
  /** Mapea nombre de campo (Zod) → etiqueta y mensaje para listas legibles. */
  fieldErrors?: { fieldKey: string; fieldLabel: string; message: string }[];
}) {
  if (!message) {
    return null;
  }
  return (
    <div
      role="status"
      aria-live={type === "err" ? "assertive" : "polite"}
      className={
        type === "ok"
          ? "rounded-md border border-success/30 bg-success/5 px-3 py-2 text-sm text-foreground"
          : "rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-foreground"
      }
    >
      <p className="font-medium">{message}</p>
      {type === "err" && fieldErrors && fieldErrors.length > 0 ? (
        <ul className="mt-2 list-inside list-disc text-sm" aria-label="Errores por campo">
          {fieldErrors.map((e) => (
            <li key={e.fieldKey}>
              <span className="text-muted-foreground">{e.fieldLabel}:</span> {e.message}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function Label({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-muted-foreground">
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30";

export const selectClass = inputClass;

export const labelBoxClass = "space-y-1";

export function PrimaryButton({ children, disabled, type = "submit" }: { children: ReactNode; disabled?: boolean; type?: "button" | "submit" | "reset" }) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm transition hover:bg-muted"
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={"rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm " + className}>
      {children}
    </div>
  );
}

export function Muted({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}
