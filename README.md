# POS Ops

Aplicación **interna** (Next.js + Prisma) para que el equipo gestione clientes del producto POS, documentos, seguimiento de ingresos, registro de correos y actividad. Se conecta al **API del POS** (`pos-backend-project`) mediante variables de entorno; la base de datos es **propia** (no es la de cada tenant en el POS).

## Requisitos

- Node.js 20+
- PostgreSQL accesible (por ejemplo Neon u otro proveedor en la nube, o su propia instalación local en el puerto que defina)

## Puesta en marcha

1. Trabaja siempre **dentro de la carpeta `pos-ops`** (donde está `package.json`). El error `Set-Location ... PathNotFound` en PowerShell suele indicar que la ruta a `pos-ops` es incorrecta.

2. Entorno. Copia el ejemplo a `.env` (o deja que `npm run prisma:generate` lo haga la primera vez):

   ```bash
   cp .env.example .env
   ```

   En **`DATABASE_URL`**, use la cadena de conexión que le dé su proveedor (p. ej. Neon) o la de su Postgres local, con usuario, host, puerto y base creados previamente.

3. **Error P1001** (*Can't reach database server*): el servidor al que apunta `DATABASE_URL` no está aceptando conexiones. Compruebe que el servicio PostgreSQL esté en marcha, que el host y el puerto sean correctos y que el firewall permita la conexión.

4. En **`.env`**, `DATABASE_URL` debe ser el **Connection string (URI) completo** de Neon (desde [console.neon.tech](https://console.neon.tech)), no un host de ejemplo con `XXXXX` ni `localhost` salvo que tenga un Postgres allí.

5. Instale dependencias, genere el cliente y aplique migraciones a Neon (comandos desde `pos-ops`):

   ```bash
   npm install
   npm run prisma:generate
   npm run prisma:deploy
   ```
   (`prisma:deploy` ejecuta `prisma migrate deploy` contra su base.) Alternativa: `npm run prisma:push` o `npm run prisma:migrate` en desarrollo. Existe `prisma/migrations/20250423120000_init/`.

6. Desarrollo:

   ```bash
   npm run dev
   ```

   Abre [http://localhost:3000](http://localhost:3000) (o el puerto que indique Next). La raíz redirige a `/dashboard`.

## Módulos (esqueleto)

| Ruta            | Contenido previsto                          | Modelo Prisma      |
|-----------------|-----------------------------------------------|--------------------|
| `/dashboard`    | Resumen y estado de conexión con el API      | —                  |
| `/clients`      | Clientes comerciales                        | `Client`           |
| `/documents`    | Licencias, contratos, etc.                    | `ClientDocument`   |
| `/revenue`      | Ingresos internos por cliente (no facturación fiscal) | `RevenueEntry` |
| `/comms`        | Log de envíos de correo                       | `OutboundEmailLog` |
| `/activity`     | Bitácora de acciones                          | `ActivityLog`      |
| `/docs`         | Resumen de rutas REST (misma app)            | —                  |

## API REST (esta aplicación)

Todas las rutas bajo `https://<host>/api/v1/...` (o `http://localhost:3000/api/v1/...` en local). `GET /api/health` y `GET /api/v1/health` son de comprobación; el resto puede exigir clave si define `OPS_API_KEY` (ver `middleware.ts` y `.env.example`).

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | `/api/v1/clients` | Listar y crear clientes comerciales |
| GET/PATCH/DELETE | `/api/v1/clients/{id}` | Detalle, actualizar, eliminar |
| GET/POST | `/api/v1/clients/{id}/documents` | Documentos del cliente |
| GET/POST | `/api/v1/clients/{id}/revenue` | Ingresos internos (montos en JSON como string) |
| GET/POST | `/api/v1/activity` | Bitácora |
| GET | `/api/v1/emails` | Log de envíos |
| POST | `/api/v1/emails/send`, `/api/v1/emails/test` | Enviar / probar correo (Nodemailer) |
| GET | `/api/v1/pos/ping` | Llamada al `health` del API del POS |

Más detalle en la app: **/docs** (navegación lateral «API»).

## Variables de entorno (resumen)

| Variable | Uso |
|----------|-----|
| `DATABASE_URL` | PostgreSQL (base propia) |
| `POS_API_BASE_URL` | Origen del backend del producto POS (sin barra final) |
| `POS_SERVICE_KEY` | Opcional, header `Authorization` al POS |
| `OPS_API_KEY` | Opcional; si existe, autenticación a `/api/*` (excepto health) |
| `MAIL_FROM` | Remitente |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | Envío real de correo |
| `MAIL_LOG_ONLY` | `true` = no SMTP, solo log en consola |

## Relación con el POS

- `Client.posOrganizationId` puede almacenar el `id` de `Organization` en el API del POS cuando conozcáis el tenant.
- `lib/pos-api.ts` concentra llamadas HTTP al backend del producto; ampliad endpoints según vuestro contrato (service key, rutas de admin, etc.).

## Nota

Autenticación de usuarios en el navegador: **aún no implementada**. Para el API de integración use `OPS_API_KEY` o despliegue en red aislada.
