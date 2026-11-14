import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const isTestEnv = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);
const databaseUrl = isTestEnv
  ? process.env.TEST_DATABASE_URL || 'file:./test.db'
  : process.env.DATABASE_URL || 'file:./dev.db';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

// Configura PRAGMAs do SQLite sequencialmente antes da primeira operação de escrita
const initPragmas = async () => {
  try {
    await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;');
    await prisma.$queryRawUnsafe('PRAGMA busy_timeout = 10000;');
    await prisma.$queryRawUnsafe('PRAGMA foreign_keys = ON;');
  } catch {
    // Ignora caso o banco ainda esteja sendo inicializado
  }
};

// Fila de serialização em memória com retry para transações de escrita no SQLite,
// evitando erros de bloqueio (SQLITE_BUSY / P2034) e condições de corrida sob alta concorrência.
let writeQueue: Promise<unknown> = initPragmas();

export function withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
  const runWithRetry = async (): Promise<T> => {
    let lastError: unknown;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        const code = err?.code;
        const msg = String(err?.message || '');
        const isTransientLock =
          code === 'P2034' ||
          code === 'P2024' ||
          msg.includes('SQLITE_BUSY') ||
          msg.includes('database is locked') ||
          msg.includes('write conflict') ||
          msg.includes('deadlock') ||
          msg.includes('Socket timeout');

        if (!isTransientLock || attempt === 4) {
          throw err;
        }
        lastError = err;
        await new Promise((resolve) => setTimeout(resolve, 15 * (attempt + 1)));
      }
    }
    throw lastError;
  };

  const next = writeQueue.then(runWithRetry, runWithRetry);
  writeQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}
