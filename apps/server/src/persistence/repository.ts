import type { PluginManifest, PluginSourceType } from '@meewmeew/plugin-sdk';

// ---------------------------------------------------------------------------
// Shared domain types for persistence (memory / JSON file)
// ---------------------------------------------------------------------------

export type InstallationStatus =
  | 'installed'
  | 'validated'
  | 'active'
  | 'inactive'
  | 'error'
  | 'removed';

export type ExecutionMode = 'sandbox' | 'host-direct';

export type HealthLevel = 'info' | 'warn' | 'error' | 'fatal';

export type AuditEventType =
  | 'plugin_installed'
  | 'plugin_enabled'
  | 'plugin_disabled'
  | 'plugin_config_updated'
  | 'plugin_policy_changed'
  | 'plugin_activation_failed'
  | 'plugin_removed';

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export interface PluginRecord {
  id: string;
  pluginKey: string;
  name: string;
  description: string | null;
  sourceType: PluginSourceType;
  sourceRef: string;
  manifestJson: PluginManifest;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePluginInput {
  pluginKey: string;
  name: string;
  description?: string;
  sourceType: PluginSourceType;
  sourceRef: string;
  manifestJson: PluginManifest;
}

export interface PluginRepository {
  create(input: CreatePluginInput): Promise<PluginRecord>;
  findById(id: string): Promise<PluginRecord | null>;
  findByKey(pluginKey: string): Promise<PluginRecord | null>;
  findAll(): Promise<PluginRecord[]>;
  update(id: string, patch: Partial<Pick<PluginRecord, 'name' | 'description' | 'manifestJson'>>): Promise<PluginRecord>;
}

// ---------------------------------------------------------------------------
// Plugin Version
// ---------------------------------------------------------------------------

export interface PluginVersionRecord {
  id: string;
  pluginId: string;
  version: string;
  checksum: string | null;
  manifestJson: PluginManifest;
  artifactRef: string | null;
  createdAt: Date;
}

export interface CreatePluginVersionInput {
  pluginId: string;
  version: string;
  checksum?: string;
  manifestJson: PluginManifest;
  artifactRef?: string;
}

export interface PluginVersionRepository {
  create(input: CreatePluginVersionInput): Promise<PluginVersionRecord>;
  findById(id: string): Promise<PluginVersionRecord | null>;
  findByPluginId(pluginId: string): Promise<PluginVersionRecord[]>;
  findByPluginIdAndVersion(pluginId: string, version: string): Promise<PluginVersionRecord | null>;
}

// ---------------------------------------------------------------------------
// Plugin Installation
// ---------------------------------------------------------------------------

export interface PluginInstallationRecord {
  id: string;
  pluginVersionId: string;
  status: InstallationStatus;
  isEnabled: boolean;
  requestedExecutionMode: ExecutionMode;
  effectiveExecutionMode: ExecutionMode;
  lastError: string | null;
  installedAt: Date;
  enabledAt: Date | null;
  disabledAt: Date | null;
  updatedAt: Date;
}

export interface CreatePluginInstallationInput {
  pluginVersionId: string;
  requestedExecutionMode: ExecutionMode;
  effectiveExecutionMode: ExecutionMode;
}

export interface PluginInstallationRepository {
  create(input: CreatePluginInstallationInput): Promise<PluginInstallationRecord>;
  findById(id: string): Promise<PluginInstallationRecord | null>;
  findByVersionId(pluginVersionId: string): Promise<PluginInstallationRecord[]>;
  findAllEnabled(): Promise<PluginInstallationRecord[]>;
  updateStatus(id: string, status: InstallationStatus, lastError?: string): Promise<void>;
  setEnabled(id: string, enabled: boolean): Promise<void>;
  updateEffectiveExecutionMode(id: string, mode: ExecutionMode): Promise<void>;
}

// ---------------------------------------------------------------------------
// Plugin Config
// ---------------------------------------------------------------------------

export interface PluginConfigRecord {
  id: string;
  pluginInstallationId: string;
  configJson: Record<string, unknown>;
  configVersion: number;
  updatedAt: Date;
  updatedBy: string | null;
}

export interface PluginConfigRepository {
  upsert(
    pluginInstallationId: string,
    configJson: Record<string, unknown>,
    updatedBy?: string,
  ): Promise<PluginConfigRecord>;
  findByInstallationId(pluginInstallationId: string): Promise<PluginConfigRecord | null>;
}

// ---------------------------------------------------------------------------
// Plugin Permission
// ---------------------------------------------------------------------------

export interface PluginPermissionRecord {
  id: string;
  pluginInstallationId: string;
  permissionKey: string;
  permissionValue: unknown;
  grantedAt: Date;
  grantedBy: string | null;
}

export interface GrantPermissionInput {
  pluginInstallationId: string;
  permissionKey: string;
  permissionValue: unknown;
  grantedBy?: string;
}

export interface PluginPermissionRepository {
  grant(input: GrantPermissionInput): Promise<PluginPermissionRecord>;
  findByInstallationId(pluginInstallationId: string): Promise<PluginPermissionRecord[]>;
  findByKey(pluginInstallationId: string, permissionKey: string): Promise<PluginPermissionRecord | null>;
  revoke(pluginInstallationId: string, permissionKey: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Plugin Audit Log
// ---------------------------------------------------------------------------

export interface PluginAuditLogRecord {
  id: string;
  pluginInstallationId: string;
  eventType: AuditEventType;
  payloadJson: Record<string, unknown>;
  actor: string | null;
  createdAt: Date;
}

export interface CreateAuditLogInput {
  pluginInstallationId: string;
  eventType: AuditEventType;
  payloadJson?: Record<string, unknown>;
  actor?: string;
}

export interface PluginAuditLogRepository {
  create(input: CreateAuditLogInput): Promise<PluginAuditLogRecord>;
  findByInstallationId(pluginInstallationId: string): Promise<PluginAuditLogRecord[]>;
}

// ---------------------------------------------------------------------------
// Plugin Health Event
// ---------------------------------------------------------------------------

export interface PluginHealthEventRecord {
  id: string;
  pluginInstallationId: string;
  level: HealthLevel;
  message: string;
  metaJson: Record<string, unknown> | null;
  createdAt: Date;
}

export interface CreateHealthEventInput {
  pluginInstallationId: string;
  level: HealthLevel;
  message: string;
  metaJson?: Record<string, unknown>;
}

export interface PluginHealthEventRepository {
  create(input: CreateHealthEventInput): Promise<PluginHealthEventRecord>;
  findByInstallationId(pluginInstallationId: string): Promise<PluginHealthEventRecord[]>;
}

// ---------------------------------------------------------------------------
// PlatformPersistence — the single injectable boundary
// ---------------------------------------------------------------------------

export interface PlatformPersistence {
  plugins: PluginRepository;
  pluginVersions: PluginVersionRepository;
  pluginInstallations: PluginInstallationRepository;
  pluginConfigs: PluginConfigRepository;
  pluginPermissions: PluginPermissionRepository;
  pluginAuditLogs: PluginAuditLogRepository;
  pluginHealthEvents: PluginHealthEventRepository;
}

// ---------------------------------------------------------------------------
// Legacy compatibility alias — preserved for existing code
// ---------------------------------------------------------------------------

/** @deprecated Use PluginRecord from the full persistence model instead. */
export interface CatalogPluginEntry {
  id: string;
  source: import('@meewmeew/plugin-sdk').PluginSource;
  manifest: PluginManifest;
  installedAt: number;
  updatedAt: number;
  enabled: boolean;
}

/** @deprecated Use PlatformPersistence instead. */
export interface PluginCatalogRepository {
  upsert(entry: CatalogPluginEntry): Promise<void>;
  delete(id: string): Promise<void>;
  getById(id: string): Promise<CatalogPluginEntry | null>;
  getAll(): Promise<CatalogPluginEntry[]>;
  setEnabled(id: string, enabled: boolean): Promise<void>;
}
