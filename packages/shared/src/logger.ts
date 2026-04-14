export interface Logger {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

export const createConsoleLogger = (prefix: string): Logger => {
  return {
    info: (message, meta) => console.log(`[INFO] [${prefix}] ${message}`, meta ? meta : ''),
    warn: (message, meta) => console.warn(`[WARN] [${prefix}] ${message}`, meta ? meta : ''),
    error: (message, meta) => console.error(`[ERROR] [${prefix}] ${message}`, meta ? meta : ''),
    debug: (message, meta) => console.debug(`[DEBUG] [${prefix}] ${message}`, meta ? meta : '')
  };
};
