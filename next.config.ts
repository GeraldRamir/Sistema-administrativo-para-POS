import { config } from "dotenv";
import path from "node:path";
import type { NextConfig } from "next";

// Que la DATABASE_URL de .env gane frente a variables heredadas del shell/IDE (p. ej. localhost).
config({ path: path.join(process.cwd(), ".env"), override: true });
config({ path: path.join(process.cwd(), ".env.local"), override: true });

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
