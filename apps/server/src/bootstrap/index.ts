import { config } from '../config/index.js';
import { createConsoleLogger } from '@meewmeew/shared';
import { PluginLoaderRegistry } from '../plugin-loader/index.js';
import { BuiltinLoader } from '../plugin-loader/builtin-loader.js';
import { PluginRegistry } from '../plugin-registry/index.js';
import { MCPRuntimeRegistry } from '../mcp-runtime/index.js';
import { ExecutionPolicy } from '../security/policy.js';
import { PluginManager } from '../plugin-manager/index.js';
import { MCPServerAdapter } from '../mcp-server/index.js';
import { PathLoader } from '../plugin-loader/path-loader.js';
import { PackageLoader } from '../plugin-loader/package-loader.js';
import { BundleLoader } from '../plugin-loader/bundle-loader.js';
import { createPersistence } from '../persistence/factory.js';
import { getServerVersion } from '../version.js';

const logger = createConsoleLogger('Bootstrap');

async function bootstrap() {
  const serverVersion = getServerVersion();
  logger.info(`MCP Core Server v${serverVersion} — ${config.env} mode`);

  // Initialize persistence layer
  const persistence = createPersistence({
    dataDir: config.persistence.dataDir,
    useInMemory: config.persistence.useInMemory,
  });

  // Initialize core services
  const loaderRegistry = new PluginLoaderRegistry(config.allowExternalPlugins);
  const pluginRegistry = new PluginRegistry();
  const runtimeRegistry = new MCPRuntimeRegistry();
  const executionPolicy = new ExecutionPolicy();
  const mcpAdapter = new MCPServerAdapter(runtimeRegistry, 'mcp-core-server', serverVersion);

  // Register loaders
  loaderRegistry.registerLoader(new BuiltinLoader());
  loaderRegistry.registerLoader(new PathLoader());
  loaderRegistry.registerLoader(new PackageLoader());
  loaderRegistry.registerLoader(new BundleLoader());

  // Initialize plugin manager with persistence boundary
  const pluginManager = new PluginManager(
    loaderRegistry,
    pluginRegistry,
    runtimeRegistry,
    executionPolicy,
    persistence,
    () => mcpAdapter.notifyCapabilitiesChanged(),
  );

  try {
    logger.info('Loading all built-in plugins...');
    const loadedIds = await pluginManager.loadAllBuiltinPlugins();
    logger.info(`Loaded ${loadedIds.length} built-in plugin(s): ${loadedIds.join(', ')}`);

    logger.info('System bootstrapped successfully.');

    const tools = runtimeRegistry.getTools();
    logger.info(`Registered tools total: ${tools.length}`);

    await mcpAdapter.connectStdio();
    logger.info('Listening on stdio for MCP protocol requests.');
  } catch (err: unknown) {
    logger.error('Failed to bootstrap the server:', {
      error: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  }
}

bootstrap();
