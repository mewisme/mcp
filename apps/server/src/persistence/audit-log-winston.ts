import fs from 'node:fs';
import path from 'node:path';
import winston from 'winston';
import type {
  CreateAuditLogInput,
  PluginAuditLogRecord,
  PluginAuditLogRepository,
} from './repository.js';

const AUDIT_KIND = 'plugin_audit';
const LOG_FILENAME = 'plugin-audit.log';

function uuid(): string {
  return crypto.randomUUID();
}

/**
 * Plugin audit trail: Winston writes JSON lines to `{logsDir}/plugin-audit.log` (not `store.json`).
 */
export class WinstonAuditLogRepository implements PluginAuditLogRepository {
  private readonly logFilePath: string;
  private readonly logger: winston.Logger;

  constructor(logsDir: string) {
    fs.mkdirSync(logsDir, { recursive: true });
    this.logFilePath = path.join(logsDir, LOG_FILENAME);
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.File({
          filename: this.logFilePath,
          options: { flags: 'a' },
        }),
      ],
    });
  }

  async create(input: CreateAuditLogInput): Promise<PluginAuditLogRecord> {
    const record: PluginAuditLogRecord = {
      id: uuid(),
      pluginInstallationId: input.pluginInstallationId,
      eventType: input.eventType,
      payloadJson: input.payloadJson ?? {},
      actor: input.actor ?? null,
      createdAt: new Date(),
    };

    this.logger.info({
      kind: AUDIT_KIND,
      id: record.id,
      pluginInstallationId: record.pluginInstallationId,
      eventType: record.eventType,
      payloadJson: record.payloadJson,
      actor: record.actor,
      createdAt: record.createdAt.toISOString(),
    });

    return record;
  }

  async findByInstallationId(pluginInstallationId: string): Promise<PluginAuditLogRecord[]> {
    if (!fs.existsSync(this.logFilePath)) {
      return [];
    }
    const text = await fs.promises.readFile(this.logFilePath, 'utf8');
    const out: PluginAuditLogRecord[] = [];
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const row = JSON.parse(trimmed) as {
          kind?: string;
          id?: string;
          pluginInstallationId?: string;
          eventType?: PluginAuditLogRecord['eventType'];
          payloadJson?: Record<string, unknown>;
          actor?: string | null;
          createdAt?: string;
        };
        if (row.kind !== AUDIT_KIND || row.pluginInstallationId !== pluginInstallationId) continue;
        if (
          !row.id ||
          !row.eventType ||
          row.createdAt === undefined ||
          row.payloadJson === undefined
        ) {
          continue;
        }
        out.push({
          id: row.id,
          pluginInstallationId: row.pluginInstallationId,
          eventType: row.eventType,
          payloadJson: row.payloadJson,
          actor: row.actor ?? null,
          createdAt: new Date(row.createdAt),
        });
      } catch {
        // skip malformed lines
      }
    }
    return out;
  }
}

export function createWinstonAuditLogRepository(logsDir: string): PluginAuditLogRepository {
  return new WinstonAuditLogRepository(logsDir);
}
