export interface Logger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

export const createConsoleLogger = (prefix: string): Logger => {
  return {
    info: (message, meta) => console.log(`[INFO] [${prefix}] ${message}`, meta ? meta : ''),
    warn: (message, meta) => console.warn(`[WARN] [${prefix}] ${message}`, meta ? meta : ''),
    error: (message, meta) => console.error(`[ERROR] [${prefix}] ${message}`, meta ? meta : ''),
    debug: (message, meta) => console.debug(`[DEBUG] [${prefix}] ${message}`, meta ? meta : '')
  };
};
