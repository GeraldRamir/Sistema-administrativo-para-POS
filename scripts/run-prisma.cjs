/**
 * Carga .env en la raíz de pos-ops (donde está package.json) y ejecuta el CLI de Prisma.
 * Si no existe .env pero sí .env.example, la copia una vez (aviso en consola).
 */
/* eslint-disable @typescript-eslint/no-require-imports, no-console */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const envFile = path.join(root, ".env");
const localEnv = path.join(root, ".env.local");
const exampleFile = path.join(root, ".env.example");

function readEnv() {
  // override: el .env de pos-ops debe imponerse a una DATABASE_URL=localhost "pegada" en el shell o en el entorno de Cursor/IDE
  if (fs.existsSync(envFile)) {
    require("dotenv").config({ path: envFile, override: true });
  }
  if (!String(process.env.DATABASE_URL ?? "").trim().length && fs.existsSync(localEnv)) {
    require("dotenv").config({ path: localEnv, override: true });
  }
}

if (!fs.existsSync(envFile) && fs.existsSync(exampleFile)) {
  try {
    fs.copyFileSync(exampleFile, envFile);
    console.log(
      "\n[pos-ops] Se creó .env desde .env.example. Revisa y ajusta DATABASE_URL a tu PostgreSQL real antes de migrate o db push.\n",
    );
  } catch (e) {
    console.error("[pos-ops] No se pudo copiar .env.example → .env:", e instanceof Error ? e.message : e);
  }
}

readEnv();

if (!String(process.env.DATABASE_URL ?? "").trim().length) {
  console.error(
    "\n[pos-ops] Falta DATABASE_URL (Neon u otra instancia PostgreSQL alcanzable).\n" +
      "  1) En pos-ops, en .env: pega el \"Connection string\" (URI) de https://console.neon.tech (con ?sslmode=require).\n" +
      "  2) Puede dejar una sola línea DATABASE_URL=; DIRECT_URL se iguala sola al ejecutar npm run prisma:* \n" +
      "  3) Vuelve a: npm run prisma:generate  y  npm run prisma:deploy\n" +
      "  (Ejecute siempre desde la carpeta pos-ops, no desde la raíz de otro workspace.)\n",
  );
  process.exit(1);
}
const prismaArgs = process.argv.slice(2);
if (prismaArgs.length === 0) {
  console.error("Uso: node scripts/run-prisma.cjs <comando de prisma> [args…]\nEj: node scripts/run-prisma.cjs generate");
  process.exit(1);
}

const result = spawnSync("npx", ["--yes", "prisma", ...prismaArgs], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});
process.exit(result.status !== null && result.status !== undefined ? result.status : 1);
