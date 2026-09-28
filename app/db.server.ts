import { PrismaClient } from "@prisma/client";

declare global {
  var __db: PrismaClient | undefined;
}

/**
 * O Portainer às vezes guarda o valor da variável com as aspas do .env
 * (`"mongodb+srv://..."`), e o Prisma recusa a URL. Tira aspas em volta, se houver.
 */
function urlDoBanco(): string | undefined {
  return process.env.DATABASE_URL?.trim().replace(/^(["'])(.*)\1$/, "$2");
}

// Reaproveita a instância entre reloads do HMR para não abrir várias conexões em dev
export const db = globalThis.__db ?? new PrismaClient({ datasourceUrl: urlDoBanco() });

if (process.env.NODE_ENV !== "production") {
  globalThis.__db = db;
}
