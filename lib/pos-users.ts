import "server-only";
import * as pg from "pg";
import { getPosApiBaseUrl, posApiFetch } from "@/lib/pos-api";

type PgPool = InstanceType<typeof pg.Pool>;

const INTEGRATION_MEMBERS_PATH = "auth/integration/organization/members";

/**
 * Fila de `User` en el POS, vía API de integración o base de datos.
 */
export type PosOrganizationMember = {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  createdAt: string;
  emailVerified: boolean;
  /** Nombre de la organización (API de integración o join en BD). */
  organizationName: string | null;
};

export type PosUsersFetchResult =
  | { ok: true; members: PosOrganizationMember[] }
  | { ok: false; message: string; detail?: string };

let pool: PgPool | undefined;

function getPool(): PgPool | null {
  const url = process.env.POS_DATABASE_URL?.trim();
  if (!url) return null;
  if (!pool) {
    pool = new pg.Pool({ connectionString: url, max: 4 });
  }
  return pool;
}

function toIdString(v: unknown): string | null {
  if (typeof v === "string" && v.length > 0) return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

function mapApiMember(item: unknown): PosOrganizationMember | null {
  if (item == null || typeof item !== "object") return null;
  const o = item as Record<string, unknown>;
  const id = toIdString(o.id);
  if (!id || typeof o.email !== "string" || typeof o.role !== "string") {
    return null;
  }
  return {
    id,
    email: o.email,
    displayName: o.displayName === null || typeof o.displayName === "string" ? (o.displayName as string | null) : null,
    role: o.role,
    createdAt: typeof o.createdAt === "string" ? o.createdAt : String(o.createdAt ?? ""),
    emailVerified: Boolean(o.emailVerified),
    organizationName:
      o.organizationName == null ? null : typeof o.organizationName === "string" ? o.organizationName : null,
  };
}

/** Intento vía API; `skip` = no hay base+clave para llamar. */
async function tryFetchUsersViaPosApi(): Promise<PosUsersFetchResult | "skip"> {
  const base = getPosApiBaseUrl();
  const key = process.env.POS_SERVICE_KEY?.trim() ?? "";
  if (!base || !key) {
    return "skip";
  }
  const res = await posApiFetch(INTEGRATION_MEMBERS_PATH, { method: "GET" });
  if (!res.ok) {
    const text = await res.text();
    return {
      ok: false,
      message: `El API del POS respondió ${res.status} al listar usuarios (integración).`,
      detail: text.length > 500 ? `${text.slice(0, 500)}…` : text,
    };
  }
  const raw: unknown = await res.json();
  if (!Array.isArray(raw)) {
    return { ok: false, message: "El API del POS no devolvió un arreglo de usuarios." };
  }
  const members: PosOrganizationMember[] = [];
  for (const row of raw) {
    const m = mapApiMember(row);
    if (m) members.push(m);
  }
  if (members.length === 0 && raw.length > 0) {
    return { ok: false, message: "Respuesta de usuarios con formato inesperado." };
  }
  return { ok: true, members };
}

async function fetchUsersViaDatabase(): Promise<PosUsersFetchResult | "skip"> {
  const p = getPool();
  if (!p) {
    return "skip";
  }
  const sql = `
    SELECT
      u.id,
      u.email,
      u."displayName" AS "displayName",
      u."organizationId" AS "organizationId",
      u.role::text AS role,
      u."createdAt"::timestamptz AS "createdAt",
      (u."emailVerifiedAt" IS NOT NULL) AS "emailVerified",
      o.name AS "organizationName"
    FROM "User" u
    LEFT JOIN "Organization" o ON o.id = u."organizationId"
    ORDER BY u.email ASC
  `;

  type UserRow = {
    id: string;
    email: string;
    displayName: string | null;
    role: string;
    createdAt: Date;
    emailVerified: boolean;
    organizationName: string | null;
  };

  try {
    const { rows } = await p.query<UserRow>(sql);
    const members: PosOrganizationMember[] = rows.map((r: UserRow) => ({
      id: r.id,
      email: r.email,
      displayName: r.displayName,
      role: r.role,
      createdAt: r.createdAt.toISOString(),
      emailVerified: r.emailVerified,
      organizationName: r.organizationName,
    }));
    return { ok: true, members };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      message: "No se pudo leer la base de datos del POS.",
      detail: err,
    };
  }
}

/**
 * Lista usuarios del POS: primero `GET /auth/integration/organization/members` (si hay POS_API_BASE_URL
 * y POS_SERVICE_KEY). Si la API falla o no está disponible, intenta `POS_DATABASE_URL` (misma base que el backend).
 */
export async function getPosSystemUsers(): Promise<PosUsersFetchResult> {
  const viaApi = await tryFetchUsersViaPosApi();
  if (viaApi !== "skip" && viaApi.ok) {
    return viaApi;
  }

  const viaDb = await fetchUsersViaDatabase();
  if (viaDb !== "skip" && viaDb.ok) {
    return viaDb;
  }

  if (viaApi !== "skip" && !viaApi.ok) {
    if (viaDb !== "skip" && !viaDb.ok) {
      const dbPart = `${viaDb.message}${viaDb.detail ? ` — ${viaDb.detail}` : ""}`;
      return {
        ok: false,
        message: "No se pudo leer usuarios por API ni por base de datos.",
        detail: `API: ${viaApi.message}${viaApi.detail ? ` — ${viaApi.detail}` : ""}. BD: ${dbPart}.`,
      };
    }
    return viaApi;
  }

  if (viaDb !== "skip") {
    return viaDb;
  }

  const base = getPosApiBaseUrl();
  const key = process.env.POS_SERVICE_KEY?.trim();
  if (base && !key) {
    return {
      ok: false,
      message: "Falta POS_SERVICE_KEY o POS_DATABASE_URL.",
      detail:
        "Con POS_API_BASE_URL definido, añada POS_SERVICE_KEY (igual que en el .env del backend) o " +
        "defina POS_DATABASE_URL para leer la tabla User directamente.",
    };
  }

  return {
    ok: false,
    message: "No hay forma de leer los usuarios del POS.",
    detail:
      "Defina en pos-ops: (1) POS_API_BASE_URL + POS_SERVICE_KEY, o (2) solo POS_DATABASE_URL hacia el PostgreSQL del " +
      "pos-backend. El backend debe tener POS_SERVICE_KEY para el endpoint de integración.",
  };
}

/** Mismo dato que `getPosSystemUsers` (alias para componentes existentes). */
export const getPosOrganizationMembers = getPosSystemUsers;
