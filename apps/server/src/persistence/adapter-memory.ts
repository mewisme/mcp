import type {
  PlatformPersistence,
  PluginRepository,
  PluginVersionRepository,
  PluginInstallationRepository,
  PluginConfigRepository,
  PluginPermissionRepository,
  PluginAuditLogRepository,
  PluginHealthEventRepository,
  PluginRecord,
  PluginVersionRecord,
  PluginInstallationRecord,
  PluginConfigRecord,
  PluginPermissionRecord,
  PluginAuditLogRecord,
  PluginHealthEventRecord,
  CreatePluginInput,
  CreatePluginVersionInput,
  CreatePluginInstallationInput,
  GrantPermissionInput,
  CreateAuditLogInput,
  CreateHealthEventInput,
  InstallationStatus,
  ExecutionMode,
  CatalogPluginEntry,
  PluginCatalogRepository,
} from './repository.js';
import { createConsoleLogger } from '@meewmeew/shared';

const logger = createConsoleLogger('MemoryPersistence');

function uuid(): string {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// Shared storage (used by in-memory and JSON file persistence)
// ---------------------------------------------------------------------------

export interface PersistenceStores {
  plugins: Map<string, PluginRecord>;
  pluginVersions: Map<string, PluginVersionRecord>;
  pluginInstallations: Map<string, PluginInstallationRecord>;
  pluginConfigs: Map<string, PluginConfigRecord>;
  pluginPermissions: Map<string, PluginPermissionRecord>;
  pluginHealthEvents: PluginHealthEventRecord[];
}

export function createEmptyStores(): PersistenceStores {
  return {
    plugins: new Map(),
    pluginVersions: new Map(),
    pluginInstallations: new Map(),
    pluginConfigs: new Map(),
    pluginPermissions: new Map(),
    pluginHealthEvents: [],
  };
}

// ---------------------------------------------------------------------------
// In-memory implementations
// ---------------------------------------------------------------------------

class InMemoryPluginRepository implements PluginRepository {
  constructor(
    private readonly store: Map<string, PluginRecord>,
    private readonly onMutate?: () => void,
  ) {}

  private touch(): void {
    this.onMutate?.();
  }

  async create(input: CreatePluginInput): Promise<PluginRecord> {
    const now = new Date();
    const record: PluginRecord = {
      id: uuid(),
      pluginKey: input.pluginKey,
      name: input.name,
      description: input.description ?? null,
      sourceType: input.sourceType,
      sourceRef: input.sourceRef,
      manifestJson: input.manifestJson,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(record.id, record);
    this.touch();
    return record;
  }

  async findById(id: string): Promise<PluginRecord | null> {
    return this.store.get(id) ?? null;
  }

  async findByKey(pluginKey: string): Promise<PluginRecord | null> {
    for (const record of this.store.values()) {
      if (record.pluginKey === pluginKey) return record;
    }
    return null;
  }

  async findAll(): Promise<PluginRecord[]> {
    return Array.from(this.store.values());
  }

  async update(
    id: string,
    patch: Partial<Pick<PluginRecord, 'name' | 'description' | 'manifestJson'>>,
  ): Promise<PluginRecord> {
    const record = this.store.get(id);
    if (!record) throw new Error(`Plugin not found: ${id}`);
    Object.assign(record, patch, { updatedAt: new Date() });
    this.touch();
    return record;
  }
}

class InMemoryPluginVersionRepository implements PluginVersionRepository {
  constructor(
    private readonly store: Map<string, PluginVersionRecord>,
    private readonly onMutate?: () => void,
  ) {}

  private touch(): void {
    this.onMutate?.();
  }

  async create(input: CreatePluginVersionInput): Promise<PluginVersionRecord> {
    const record: PluginVersionRecord = {
      id: uuid(),
      pluginId: input.pluginId,
      version: input.version,
      checksum: input.checksum ?? null,
      manifestJson: input.manifestJson,
      artifactRef: input.artifactRef ?? null,
      createdAt: new Date(),
    };
    this.store.set(record.id, record);
    this.touch();
    return record;
  }

  async findById(id: string): Promise<PluginVersionRecord | null> {
    return this.store.get(id) ?? null;
  }

  async findByPluginId(pluginId: string): Promise<PluginVersionRecord[]> {
    return Array.from(this.store.values()).filter((r) => r.pluginId === pluginId);
  }

  async findByPluginIdAndVersion(pluginId: string, version: string): Promise<PluginVersionRecord | null> {
    for (const record of this.store.values()) {
      if (record.pluginId === pluginId && record.version === version) return record;
    }
    return null;
  }
}

class InMemoryPluginInstallationRepository implements PluginInstallationRepository {
  constructor(
    private readonly store: Map<string, PluginInstallationRecord>,
    private readonly onMutate?: () => void,
  ) {}

  private touch(): void {
    this.onMutate?.();
  }

  async create(input: CreatePluginInstallationInput): Promise<PluginInstallationRecord> {
    const now = new Date();
    const record: PluginInstallationRecord = {
      id: uuid(),
      pluginVersionId: input.pluginVersionId,
      status: 'installed',
      isEnabled: false,
      requestedExecutionMode: input.requestedExecutionMode,
      effectiveExecutionMode: input.effectiveExecutionMode,
      lastError: null,
      installedAt: now,
      enabledAt: null,
      disabledAt: null,
      updatedAt: now,
    };
    this.store.set(record.id, record);
    this.touch();
    return record;
  }

  async findById(id: string): Promise<PluginInstallationRecord | null> {
    return this.store.get(id) ?? null;
  }

  async findByVersionId(pluginVersionId: string): Promise<PluginInstallationRecord[]> {
    return Array.from(this.store.values()).filter((r) => r.pluginVersionId === pluginVersionId);
  }

  async findAllEnabled(): Promise<PluginInstallationRecord[]> {
    return Array.from(this.store.values()).filter((r) => r.isEnabled);
  }

  async updateStatus(id: string, status: InstallationStatus, lastError?: string): Promise<void> {
    const record = this.store.get(id);
    if (!record) throw new Error(`Installation not found: ${id}`);
    record.status = status;
    record.lastError = lastError ?? null;
    record.updatedAt = new Date();
    this.touch();
  }

  async setEnabled(id: string, enabled: boolean): Promise<void> {
    const record = this.store.get(id);
    if (!record) throw new Error(`Installation not found: ${id}`);
    record.isEnabled = enabled;
    record.updatedAt = new Date();
    if (enabled) {
      record.enabledAt = new Date();
    } else {
      record.disabledAt = new Date();
    }
    this.touch();
  }

  async updateEffectiveExecutionMode(id: string, mode: ExecutionMode): Promise<void> {
    const record = this.store.get(id);
    if (!record) throw new Error(`Installation not found: ${id}`);
    record.effectiveExecutionMode = mode;
    record.updatedAt = new Date();
    this.touch();
  }
}

class InMemoryPluginConfigRepository implements PluginConfigRepository {
  constructor(
    private readonly store: Map<string, PluginConfigRecord>,
    private readonly onMutate?: () => void,
  ) {}

  private touch(): void {
    this.onMutate?.();
  }

  async upsert(
    pluginInstallationId: string,
    configJson: Record<string, unknown>,
    updatedBy?: string,
  ): Promise<PluginConfigRecord> {
    const existing = this.store.get(pluginInstallationId);
    const now = new Date();
    const record: PluginConfigRecord = {
      id: existing?.id ?? uuid(),
      pluginInstallationId,
      configJson,
      configVersion: (existing?.configVersion ?? 0) + 1,
      updatedAt: now,
      updatedBy: updatedBy ?? null,
    };
    this.store.set(pluginInstallationId, record);
    this.touch();
    return record;
  }

  async findByInstallationId(pluginInstallationId: string): Promise<PluginConfigRecord | null> {
    return this.store.get(pluginInstallationId) ?? null;
  }
}

class InMemoryPluginPermissionRepository implements PluginPermissionRepository {
  constructor(
    private readonly store: Map<string, PluginPermissionRecord>,
    private readonly onMutate?: () => void,
  ) {}

  private touch(): void {
    this.onMutate?.();
  }

  private key(installationId: string, permissionKey: string): string {
    return `${installationId}::${permissionKey}`;
  }

  async grant(input: GrantPermissionInput): Promise<PluginPermissionRecord> {
    const record: PluginPermissionRecord = {
      id: uuid(),
      pluginInstallationId: input.pluginInstallationId,
      permissionKey: input.permissionKey,
      permissionValue: input.permissionValue,
      grantedAt: new Date(),
      grantedBy: input.grantedBy ?? null,
    };
    this.store.set(this.key(input.pluginInstallationId, input.permissionKey), record);
    this.touch();
    return record;
  }

  async findByInstallationId(pluginInstallationId: string): Promise<PluginPermissionRecord[]> {
    return Array.from(this.store.values()).filter((r) => r.pluginInstallationId === pluginInstallationId);
  }

  async findByKey(pluginInstallationId: string, permissionKey: string): Promise<PluginPermissionRecord | null> {
    return this.store.get(this.key(pluginInstallationId, permissionKey)) ?? null;
  }

  async revoke(pluginInstallationId: string, permissionKey: string): Promise<void> {
    this.store.delete(this.key(pluginInstallationId, permissionKey));
    this.touch();
  }
}

/** In-memory audit log (tests / MCP_IN_MEMORY_PERSISTENCE). Production JSON persistence uses Winston. */
export class InMemoryPluginAuditLogRepository implements PluginAuditLogRepository {
  constructor(private readonly store: PluginAuditLogRecord[]) {}

  async create(input: CreateAuditLogInput): Promise<PluginAuditLogRecord> {
    const record: PluginAuditLogRecord = {
      id: uuid(),
      pluginInstallationId: input.pluginInstallationId,
      eventType: input.eventType,
      payloadJson: input.payloadJson ?? {},
      actor: input.actor ?? null,
      createdAt: new Date(),
    };
    this.store.push(record);
    return record;
  }

  async findByInstallationId(pluginInstallationId: string): Promise<PluginAuditLogRecord[]> {
    return this.store.filter((r) => r.pluginInstallationId === pluginInstallationId);
  }
}

class InMemoryPluginHealthEventRepository implements PluginHealthEventRepository {
  constructor(
    private readonly store: PluginHealthEventRecord[],
    private readonly onMutate?: () => void,
  ) {}

  private touch(): void {
    this.onMutate?.();
  }

  async create(input: CreateHealthEventInput): Promise<PluginHealthEventRecord> {
    const record: PluginHealthEventRecord = {
      id: uuid(),
      pluginInstallationId: input.pluginInstallationId,
      level: input.level,
      message: input.message,
      metaJson: input.metaJson ?? null,
      createdAt: new Date(),
    };
    this.store.push(record);
    this.touch();
    return record;
  }

  async findByInstallationId(pluginInstallationId: string): Promise<PluginHealthEventRecord[]> {
    return this.store.filter((r) => r.pluginInstallationId === pluginInstallationId);
  }
}

// ---------------------------------------------------------------------------
// Factory — shared stores + optional persist hook
// ---------------------------------------------------------------------------

export function createPlatformPersistenceFromStores(
  stores: PersistenceStores,
  onMutate?: () => void,
  pluginAuditLogs?: PluginAuditLogRepository,
): PlatformPersistence {
  return {
    plugins: new InMemoryPluginRepository(stores.plugins, onMutate),
    pluginVersions: new InMemoryPluginVersionRepository(stores.pluginVersions, onMutate),
    pluginInstallations: new InMemoryPluginInstallationRepository(stores.pluginInstallations, onMutate),
    pluginConfigs: new InMemoryPluginConfigRepository(stores.pluginConfigs, onMutate),
    pluginPermissions: new InMemoryPluginPermissionRepository(stores.pluginPermissions, onMutate),
    pluginAuditLogs: pluginAuditLogs ?? new InMemoryPluginAuditLogRepository([]),
    pluginHealthEvents: new InMemoryPluginHealthEventRepository(stores.pluginHealthEvents, onMutate),
  };
}

// ---------------------------------------------------------------------------
// InMemoryPlatformPersistence — full PlatformPersistence backed by memory
// ---------------------------------------------------------------------------

export class InMemoryPlatformPersistence implements PlatformPersistence {
  public readonly plugins: PluginRepository;
  public readonly pluginVersions: PluginVersionRepository;
  public readonly pluginInstallations: PluginInstallationRepository;
  public readonly pluginConfigs: PluginConfigRepository;
  public readonly pluginPermissions: PluginPermissionRepository;
  public readonly pluginAuditLogs: PluginAuditLogRepository;
  public readonly pluginHealthEvents: PluginHealthEventRepository;

  constructor() {
    const p = createPlatformPersistenceFromStores(createEmptyStores(), undefined, new InMemoryPluginAuditLogRepository([]));
    this.plugins = p.plugins;
    this.pluginVersions = p.pluginVersions;
    this.pluginInstallations = p.pluginInstallations;
    this.pluginConfigs = p.pluginConfigs;
    this.pluginPermissions = p.pluginPermissions;
    this.pluginAuditLogs = p.pluginAuditLogs;
    this.pluginHealthEvents = p.pluginHealthEvents;
  }
}

// ---------------------------------------------------------------------------
// Legacy compatibility — preserved to avoid breaking existing references
// ---------------------------------------------------------------------------

/** @deprecated Use InMemoryPlatformPersistence instead. */
export class InMemoryPluginCatalog implements PluginCatalogRepository {
  private memoryStore = new Map<string, CatalogPluginEntry>();

  async upsert(entry: CatalogPluginEntry): Promise<void> {
    this.memoryStore.set(entry.id, entry);
    logger.debug(`Upserted plugin catalog record: ${entry.id}`);
  }

  async delete(id: string): Promise<void> {
    this.memoryStore.delete(id);
    logger.debug(`Deleted plugin catalog record: ${id}`);
  }

  async getById(id: string): Promise<CatalogPluginEntry | null> {
    return this.memoryStore.get(id) ?? null;
  }

  async getAll(): Promise<CatalogPluginEntry[]> {
    return Array.from(this.memoryStore.values());
  }

  async setEnabled(id: string, enabled: boolean): Promise<void> {
    const record = this.memoryStore.get(id);
    if (!record) throw new Error(`Plugin record not found: ${id}`);
    record.enabled = enabled;
    record.updatedAt = Date.now();
    logger.debug(`Set plugin ${id} enabled=${enabled}`);
  }
}
