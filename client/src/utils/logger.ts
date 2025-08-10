export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';

const LEVEL: LogLevel =
  (import.meta as any).env?.MODE === 'production' ? 'silent' : 'info'; // Allow info logs in dev

const order: Record<LogLevel, number> = { silent: 5, error: 1, warn: 2, info: 3, debug: 4 };

export const log = {
  debug: (ns: string, msg: () => any) => {
    if (order[LEVEL] >= order.debug) console.debug(`[${ns}]`, msg());
  },
  info: (ns: string, msg: () => any) => {
    if (order[LEVEL] >= order.info) console.info(`[${ns}]`, msg());
  },
  warn: (ns: string, msg: () => any) => {
    if (order[LEVEL] >= order.warn) console.warn(`[${ns}]`, msg());
  },
  error: (ns: string, ...args: any[]) => {
    if (order[LEVEL] >= order.error) console.error(`[${ns}]`, ...args);
  },
};