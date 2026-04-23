"use client";

import { useFormStatus } from "react-dom";
import type { PosOrganizationMember } from "@/lib/pos-users";
import { sendPasswordSetupEmailAction } from "@/app/actions/pos-users";

function SubmitSendMail() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-8 min-w-[6.5rem] items-center justify-center rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Enviando…" : "Enviar correo"}
    </button>
  );
}

const roleLabel: Record<string, string> = {
  OWNER: "Propietario",
  MANAGER: "Administrador",
  SUPERVISOR: "Supervisor",
  CASHIER: "Cajero",
  SALES: "Ventas",
};

function roleOf(role: string) {
  return roleLabel[role] ?? role;
}

export function PosUsersMailTable({ members }: { members: PosOrganizationMember[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="bg-muted/60 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Organización</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Verif.</th>
              <th className="w-[1%] px-4 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((m) => (
              <tr key={m.id} className="bg-card text-card-foreground transition-colors hover:bg-muted/30">
                <td className="px-4 py-2.5 font-mono text-xs text-foreground">{m.email}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{m.displayName ?? "—"}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{m.organizationName ?? "—"}</td>
                <td className="px-4 py-2.5 text-sm">{roleOf(m.role)}</td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">
                  {m.emailVerified ? (
                    <span className="text-success">Sí</span>
                  ) : (
                    "No"
                  )}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <form action={sendPasswordSetupEmailAction} className="inline">
                    <input type="hidden" name="email" value={m.email} />
                    <input type="hidden" name="displayName" value={m.displayName ?? ""} />
                    <SubmitSendMail />
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
