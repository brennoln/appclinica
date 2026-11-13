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

// Fila de serialização em memória para transações de escrita no SQLite,
// evitando erros de bloqueio (SQLITE_BUSY / P2034) e condições de corrida sob alta concorrência.
let writeQueue: Promise<unknown> = Promise.resolve();

export function withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(fn, fn);
  writeQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}
