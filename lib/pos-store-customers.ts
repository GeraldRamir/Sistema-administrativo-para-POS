import "server-only";
import { getPosApiBaseUrl, posApiFetch } from "@/lib/pos-api";

const ORG_CUSTOMERS_PATH = "organization/customers";

/**
 * Cliente del catálogo del POS (`GET /organization/customers`, sin Bearer, todas las sucursales).
 */
export type PosStoreCustomer = {
  id: string;
  branchId: string;
  name: string;
  identification: string;
  phone: string;
  email: string;
  balance: number;
  creditLimit: number;
  active: boolean;
};

export type PosStoreCustomersResult =
  | { ok: true; customers: PosStoreCustomer[] }
  | { ok: false; message: string; detail?: string };

function mapRow(item: unknown): PosStoreCustomer | null {
  if (item == null || typeof item !== "object") return null;
  const o = item as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.name !== "string" || typeof o.identification !== "string") {
    return null;
  }
  return {
    id: o.id,
    branchId: typeof o.branchId === "string" ? o.branchId : "",
    name: o.name,
    identification: o.identification,
    phone: typeof o.phone === "string" ? o.phone : "",
    email: typeof o.email === "string" ? o.email : "",
    balance: typeof o.balance === "number" ? o.balance : Number(o.balance) || 0,
    creditLimit: typeof o.creditLimit === "number" ? o.creditLimit : Number(o.creditLimit) || 0,
    active: Boolean(o.active),
  };
}

/**
 * Lista todo el catálogo de clientes del POS (API pública, sin id de sucursal en pos-ops).
 * Requiere `POS_API_BASE_URL`. Llama a `GET /organization/customers`.
 */
export async function getPosStoreCustomers(): Promise<PosStoreCustomersResult> {
  const base = getPosApiBaseUrl();
  if (!base) {
    return { ok: false, message: "Falta POS_API_BASE_URL." };
  }

  try {
    const res = await posApiFetch(ORG_CUSTOMERS_PATH, { method: "GET" }, { omitAuth: true });
    if (!res.ok) {
      const text = await res.text();
      return {
        ok: false,
        message: `El API del POS respondió ${res.status} al listar clientes.`,
        detail: text.length > 500 ? `${text.slice(0, 500)}…` : text,
      };
    }
    const raw: unknown = await res.json();
    if (!Array.isArray(raw)) {
      return { ok: false, message: "El API no devolvió un arreglo de clientes." };
    }
    const customers: PosStoreCustomer[] = [];
    for (const row of raw) {
      const m = mapRow(row);
      if (m) customers.push(m);
    }
    if (customers.length === 0 && raw.length > 0) {
      return { ok: false, message: "Formato de clientes inesperado en la respuesta del POS." };
    }
    return { ok: true, customers };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    return { ok: false, message: "Error al contactar el API del POS.", detail: err };
  }
}
