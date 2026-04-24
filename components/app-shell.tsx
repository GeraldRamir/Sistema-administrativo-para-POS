"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const nav = [
  {
    href: "/dashboard",
    label: "Inicio",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/clients",
    label: "Clientes",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/documents",
    label: "Documentos",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
        <path d="M10 9H8" />
      </svg>
    ),
  },
  {
    href: "/contratos",
    label: "Contratos",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M4 4.5A2.5 2.5 0 0 0 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z" />
        <path d="M8 7h8" />
        <path d="M8 11h5" />
      </svg>
    ),
  },
  {
    href: "/revenue",
    label: "Ingresos",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
        <path d="M6 15h.01M10 15h4" />
      </svg>
    ),
  },
  {
    href: "/comms",
    label: "Comunicados",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
        <path d="m22 6-10 7L2 6" />
      </svg>
    ),
  },
  {
    href: "/activity",
    label: "Actividad",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    href: "/docs",
    label: "API",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M16 18l6-6-6-6" />
        <path d="M8 6l-6 6 6 6" />
      </svg>
    ),
  },
] as const;

function headerForPath(pathname: string) {
  if (pathname === "/dashboard") {
    return { title: "Inicio", hint: "Resumen operativo" as string | null };
  }
  if (pathname === "/clients/new") {
    return { title: "Nuevo cliente", hint: "Registro comercial en pos-ops" };
  }
  if (pathname === "/clients" || pathname.startsWith("/clients/")) {
    if (pathname === "/clients") {
      return { title: "Clientes (POS)", hint: "Usuarios e integración" };
    }
    return { title: "Ficha de cliente", hint: "pos-ops" };
  }
  if (pathname === "/documents") {
    return { title: "Documentos", hint: "Contratos y referencias" };
  }
  if (pathname === "/contratos") {
    return { title: "Contratos", hint: "Plantillas generales (sin vínculo a clientes)" };
  }
  if (pathname === "/revenue") {
    return { title: "Ingresos", hint: "Seguimiento interno" };
  }
  if (pathname === "/comms") {
    return { title: "Comunicados", hint: "Correo y registro" };
  }
  if (pathname === "/activity") {
    return { title: "Actividad", hint: "Bitácora" };
  }
  if (pathname === "/docs") {
    return { title: "API", hint: "REST v1" };
  }
  return { title: "Consola", hint: null as string | null };
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { title, hint } = headerForPath(pathname);

  return (
    <div className="flex min-h-full">
      <aside className="sticky top-0 flex h-svh w-64 shrink-0 flex-col border-r border-sidebar-border bg-gradient-to-b from-sidebar via-sidebar to-sidebar/95 text-sidebar-foreground shadow-[inset_-1px_0_0_0] shadow-black/[0.03] dark:shadow-white/[0.04]">
        <div className="border-b border-sidebar-border/80 px-4 py-5">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/90 to-primary text-primary-foreground shadow-sm"
              aria-hidden
            >
              <span className="text-xs font-bold tabular-nums">POS</span>
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight tracking-tight">POS Ops</p>
              <p className="text-[11px] text-muted-foreground/90">Consola de operaciones</p>
            </div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2 pb-4" aria-label="Módulos">
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
                  "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors " +
                  (active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground/85 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground")
                }
                aria-current={active ? "page" : undefined}
              >
                <span className={active ? "text-primary" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground/90"}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-h-svh min-w-0 flex-1 flex-col bg-gradient-to-b from-background to-muted/20">
        <header className="shrink-0 border-b border-border/80 bg-card/90 px-6 py-3.5 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <h1 className="text-sm font-medium text-foreground">{title}</h1>
          {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
        </header>
        <main className="flex-1 p-6 lg:px-8 lg:py-7">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
