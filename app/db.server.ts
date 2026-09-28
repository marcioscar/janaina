import { PrismaClient } from "@prisma/client";
import { variavelAmbiente } from "~/lib/env.server";

declare global {
  var __db: PrismaClient | undefined;
}

// Reaproveita a instância entre reloads do HMR para não abrir várias conexões em dev.
// A URL passa por variavelAmbiente porque o Portainer pode guardá-la entre aspas.
export const db =
  globalThis.__db ?? new PrismaClient({ datasourceUrl: variavelAmbiente("DATABASE_URL") });

if (process.env.NODE_ENV !== "production") {
  globalThis.__db = db;
}
