import fs from 'node:fs';
import path from 'node:path';
import { InMemoryPlatformPersistence } from './adapter-memory.js';
import { JsonFilePlatformPersistence } from './adapter-json-file.js';
import type { PlatformPersistence } from './repository.js';
import { createConsoleLogger } from '@meewmeew/shared';

const logger = createConsoleLogger('PersistenceFactory');

function assertDataDirWritable(dataDir: string): void {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    const probe = path.join(dataDir, '.write-probe');
    fs.writeFileSync(probe, 'ok');
    fs.unlinkSync(probe);
  } catch (err) {
    logger.error(`MCP data directory is not usable (create/write failed): ${dataDir}`, err);
    process.exit(1);
  }
}

export interface CreatePersistenceOptions {
  dataDir: string;
  useInMemory: boolean;
}

export function createPersistence(options: CreatePersistenceOptions): PlatformPersistence {
  if (options.useInMemory) {
    logger.info('Using in-memory persistence (NODE_ENV=test or MCP_IN_MEMORY_PERSISTENCE=true).');
    return new InMemoryPlatformPersistence();
  }

  assertDataDirWritable(options.dataDir);
  logger.info(`Using JSON file persistence under ${options.dataDir}`);
  return new JsonFilePlatformPersistence(options.dataDir);
}
