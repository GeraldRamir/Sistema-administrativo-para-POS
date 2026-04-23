"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const nav = [
  { href: "/dashboard", label: "Inicio" },
  { href: "/clients", label: "Clientes" },
  { href: "/documents", label: "Documentos" },
  { href: "/revenue", label: "Ingresos" },
  { href: "/comms", label: "Comunicados" },
  { href: "/activity", label: "Actividad" },
  { href: "/docs", label: "API" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-full">
      <aside className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="border-b border-sidebar-border px-4 py-4">
          <p className="text-sm font-semibold tracking-tight">POS Ops</p>
          <p className="text-xs text-muted-foreground">Consola de operaciones</p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {nav.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "rounded-lg bg-sidebar-accent px-3 py-2 text-sm font-medium text-sidebar-accent-foreground shadow-sm"
                    : "rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="border-b border-border bg-card px-6 py-3 shadow-sm">
          <h1 className="text-sm font-medium text-muted-foreground">Consola de operaciones</h1>
        </header>
        <main className="bg-background p-6">{children}</main>
      </div>
    </div>
  );
}
