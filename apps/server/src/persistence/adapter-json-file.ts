import fs from 'node:fs';
import path from 'node:path';
import type {
  PlatformPersistence,
  PluginRecord,
  PluginVersionRecord,
  PluginInstallationRecord,
  PluginConfigRecord,
  PluginPermissionRecord,
  PluginHealthEventRecord,
} from './repository.js';
import {
  createEmptyStores,
  createPlatformPersistenceFromStores,
  type PersistenceStores,
} from './adapter-memory.js';
import { createWinstonAuditLogRepository } from './audit-log-winston.js';

const STORE_VERSION = 1;
const STORE_FILENAME = 'store.json';
const LOGS_SUBDIR = 'logs';

/** JSON snapshot shape — maps are arrays of values; dates serialized as ISO strings. Audit logs use Winston, not this file. */
interface JsonSnapshot {
  version: typeof STORE_VERSION;
  plugins: unknown[];
  pluginVersions: unknown[];
  pluginInstallations: unknown[];
  pluginConfigs: unknown[];
  pluginPermissions: unknown[];
  pluginHealthEvents: unknown[];
  /** @deprecated Legacy field; ignored on load. */
  pluginAuditLogs?: unknown[];
}

function isIsoDateString(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(s);
}

function reviveDates(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'string' && isIsoDateString(value)) {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) return d;
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(reviveDates);
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = reviveDates(v);
  }
  return out;
}

function replaceDates(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(replaceDates);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = replaceDates(v);
  }
  return out;
}

function mapsById<T extends { id: string }>(rows: T[]): Map<string, T> {
  const m = new Map<string, T>();
  for (const row of rows) {
    m.set(row.id, row);
  }
  return m;
}

function configMap(rows: PluginConfigRecord[]): Map<string, PluginConfigRecord> {
  const m = new Map<string, PluginConfigRecord>();
  for (const row of rows) {
    m.set(row.pluginInstallationId, row);
  }
  return m;
}

function permissionMap(rows: PluginPermissionRecord[]): Map<string, PluginPermissionRecord> {
  const m = new Map<string, PluginPermissionRecord>();
  for (const row of rows) {
    m.set(`${row.pluginInstallationId}::${row.permissionKey}`, row);
  }
  return m;
}

function snapshotToStores(raw: JsonSnapshot): PersistenceStores {
  const plugins = reviveDates(raw.plugins) as PluginRecord[];
  const pluginVersions = reviveDates(raw.pluginVersions) as PluginVersionRecord[];
  const pluginInstallations = reviveDates(raw.pluginInstallations) as PluginInstallationRecord[];
  const pluginConfigs = reviveDates(raw.pluginConfigs) as PluginConfigRecord[];
  const pluginPermissions = reviveDates(raw.pluginPermissions) as PluginPermissionRecord[];
  const pluginHealthEvents = reviveDates(raw.pluginHealthEvents) as PluginHealthEventRecord[];

  return {
    plugins: mapsById(plugins),
    pluginVersions: mapsById(pluginVersions),
    pluginInstallations: mapsById(pluginInstallations),
    pluginConfigs: configMap(pluginConfigs),
    pluginPermissions: permissionMap(pluginPermissions),
    pluginHealthEvents,
  };
}

function storesToSnapshot(stores: PersistenceStores): JsonSnapshot {
  return {
    version: STORE_VERSION,
    plugins: Array.from(stores.plugins.values()).map((r) => replaceDates(r) as object),
    pluginVersions: Array.from(stores.pluginVersions.values()).map((r) => replaceDates(r) as object),
    pluginInstallations: Array.from(stores.pluginInstallations.values()).map((r) => replaceDates(r) as object),
    pluginConfigs: Array.from(stores.pluginConfigs.values()).map((r) => replaceDates(r) as object),
    pluginPermissions: Array.from(stores.pluginPermissions.values()).map((r) => replaceDates(r) as object),
    pluginHealthEvents: stores.pluginHealthEvents.map((r) => replaceDates(r) as object),
  };
}

function loadSnapshot(filePath: string): PersistenceStores {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as JsonSnapshot;
  if (raw.version !== STORE_VERSION) {
    throw new Error(`Unsupported store version: ${String(raw.version)}`);
  }
  return snapshotToStores(raw);
}

function saveSnapshot(filePath: string, stores: PersistenceStores): void {
  const snap = storesToSnapshot(stores);
  fs.writeFileSync(filePath, `${JSON.stringify(snap, null, 2)}\n`, 'utf8');
}

export class JsonFilePlatformPersistence implements PlatformPersistence {
  public readonly plugins: PlatformPersistence['plugins'];
  public readonly pluginVersions: PlatformPersistence['pluginVersions'];
  public readonly pluginInstallations: PlatformPersistence['pluginInstallations'];
  public readonly pluginConfigs: PlatformPersistence['pluginConfigs'];
  public readonly pluginPermissions: PlatformPersistence['pluginPermissions'];
  public readonly pluginAuditLogs: PlatformPersistence['pluginAuditLogs'];
  public readonly pluginHealthEvents: PlatformPersistence['pluginHealthEvents'];

  private readonly stores: PersistenceStores;
  private readonly storePath: string;

  constructor(dataDir: string) {
    fs.mkdirSync(dataDir, { recursive: true });
    this.storePath = path.join(dataDir, STORE_FILENAME);
    const logsDir = path.join(dataDir, LOGS_SUBDIR);
    fs.mkdirSync(logsDir, { recursive: true });

    if (fs.existsSync(this.storePath)) {
      this.stores = loadSnapshot(this.storePath);
    } else {
      this.stores = createEmptyStores();
      saveSnapshot(this.storePath, this.stores);
    }

    const onMutate = (): void => {
      saveSnapshot(this.storePath, this.stores);
    };

    const auditLogs = createWinstonAuditLogRepository(logsDir);
    const p = createPlatformPersistenceFromStores(this.stores, onMutate, auditLogs);
    this.plugins = p.plugins;
    this.pluginVersions = p.pluginVersions;
    this.pluginInstallations = p.pluginInstallations;
    this.pluginConfigs = p.pluginConfigs;
    this.pluginPermissions = p.pluginPermissions;
    this.pluginAuditLogs = p.pluginAuditLogs;
    this.pluginHealthEvents = p.pluginHealthEvents;
  }
}
