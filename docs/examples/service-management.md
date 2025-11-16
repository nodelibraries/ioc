# Service Management Example

Demonstrates service management features - `Remove/RemoveAll()` methods for dynamic service management.

## Code

```typescript
import { ServiceCollection, ServiceProvider } from '@nodelibraries/ioc';

/**
 * Service Management Example
 *
 * This example demonstrates service management features:
 * - Remove/RemoveAll() - Remove services from collection
 * - Dynamic service management patterns
 * - Test scenarios with service replacement
 */

// ============================================
// Interfaces
// ============================================

interface ILogger {
  log(message: string): void;
}

interface ICache {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
}

interface IConfig {
  get(key: string): string | undefined;
}

// ============================================
// Implementations
// ============================================

class Logger implements ILogger {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }
}

class ConsoleLogger implements ILogger {
  log(message: string) {
    console.log(`[CONSOLE] ${message}`);
  }
}

class FileLogger implements ILogger {
  log(message: string) {
    console.log(`[FILE] ${message}`);
  }
}

class BigCache implements ICache {
  private data = new Map<string, string>();

  get(key: string): string | undefined {
    return this.data.get(key);
  }

  set(key: string, value: string): void {
    this.data.set(key, value);
  }
}

class Config implements IConfig {
  private values = new Map<string, string>();

  constructor() {
    this.values.set('appName', 'MyApp');
    this.values.set('version', '1.0.0');
  }

  get(key: string): string | undefined {
    return this.values.get(key);
  }
}

// ============================================
// Tokens
// ============================================

const ILoggerToken = Symbol('ILogger');
const ICacheToken = Symbol('ICache');
const IConfigToken = Symbol('IConfig');

async function main() {
  console.log('=== Service Management Example ===\n');

  // ============================================
  // 1. Remove/RemoveAll() - Remove Services
  // ============================================
  console.log('--- 1. Remove/RemoveAll() - Remove Services ---\n');

  const services1 = new ServiceCollection();
  services1.addSingleton<ILogger>(ILoggerToken, Logger);
  services1.addSingleton<ICache>(ICacheToken, BigCache);
  services1.addSingleton<IConfig>(IConfigToken, Config);

  // Check services exist
  const provider1a = services1.buildServiceProvider();
  console.log(`Logger exists? ${await provider1a.isService<ILogger>(ILoggerToken)}`); // true
  console.log(`Cache exists? ${await provider1a.isService<ICache>(ICacheToken)}`); // true
  console.log(`Config exists? ${await provider1a.isService<IConfig>(IConfigToken)}`); // true

  // Remove a service
  services1.remove<ILogger>(ILoggerToken);
  const provider1b = services1.buildServiceProvider();
  console.log(`\nLogger exists after remove? ${await provider1b.isService<ILogger>(ILoggerToken)}`); // false
  console.log(`Cache exists after remove? ${await provider1b.isService<ICache>(ICacheToken)}`); // true
  console.log(`Config exists after remove? ${await provider1b.isService<IConfig>(IConfigToken)}`); // true

  // RemoveAll (same as remove)
  services1.removeAll<ICache>(ICacheToken);
  const provider1c = services1.buildServiceProvider();
  console.log(`\nCache exists after removeAll? ${await provider1c.isService<ICache>(ICacheToken)}`); // false
  console.log(`Config exists after removeAll? ${await provider1c.isService<IConfig>(IConfigToken)}`); // true

  // ============================================
  // 2. Test Scenario - Mock Replacement
  // ============================================
  console.log('\n--- 2. Test Scenario - Mock Replacement ---\n');

  const testServices = new ServiceCollection();
  testServices.addSingleton<ILogger>(ILoggerToken, Logger);

  // In test, replace with mock
  testServices.remove<ILogger>(ILoggerToken);
  testServices.addSingleton<ILogger>(ILoggerToken, ConsoleLogger); // Mock logger

  const testProvider = testServices.buildServiceProvider();
  const testLogger = await testProvider.getRequiredService<ILogger>(ILoggerToken);
  testLogger.log('This is from mock logger');

  // ============================================
  // 3. Dynamic Service Management
  // ============================================
  console.log('\n--- 3. Dynamic Service Management ---\n');

  const dynamicServices = new ServiceCollection();
  dynamicServices.addSingleton<ILogger>(ILoggerToken, Logger);

  // Conditionally remove and add services
  const useFileLogger = process.env.USE_FILE_LOGGER === 'true';

  if (useFileLogger) {
    dynamicServices.remove<ILogger>(ILoggerToken);
    dynamicServices.addSingleton<ILogger>(ILoggerToken, FileLogger);
  }

  const dynamicProvider = dynamicServices.buildServiceProvider();
  const dynamicLogger = await dynamicProvider.getRequiredService<ILogger>(ILoggerToken);
  dynamicLogger.log('Dynamic logger');

  // ============================================
  // 4. Service Cleanup Pattern
  // ============================================
  console.log('\n--- 4. Service Cleanup Pattern ---\n');

  const cleanupServices = new ServiceCollection();
  cleanupServices.addSingleton<ILogger>(ILoggerToken, Logger);
  cleanupServices.addSingleton<ICache>(ICacheToken, BigCache);
  cleanupServices.addSingleton<IConfig>(IConfigToken, Config);

  console.log('Before cleanup:');
  const provider4a = cleanupServices.buildServiceProvider();
  console.log(`  Logger: ${await provider4a.isService<ILogger>(ILoggerToken)}`);
  console.log(`  Cache: ${await provider4a.isService<ICache>(ICacheToken)}`);
  console.log(`  Config: ${await provider4a.isService<IConfig>(IConfigToken)}`);

  // Remove all services
  cleanupServices.remove<ILogger>(ILoggerToken);
  cleanupServices.remove<ICache>(ICacheToken);
  cleanupServices.remove<IConfig>(IConfigToken);

  console.log('\nAfter cleanup:');
  const provider4b = cleanupServices.buildServiceProvider();
  console.log(`  Logger: ${await provider4b.isService<ILogger>(ILoggerToken)}`);
  console.log(`  Cache: ${await provider4b.isService<ICache>(ICacheToken)}`);
  console.log(`  Config: ${await provider4b.isService<IConfig>(IConfigToken)}`);

  console.log('\n✅ Service management features are working!');
  console.log('\n📌 Use Cases:');
  console.log('  - Test scenarios (replace with mocks)');
  console.log('  - Dynamic service configuration');
  console.log('  - Service cleanup and reconfiguration');
  console.log('  - Conditional service registration');
}

main().catch(console.error);
```

## Expected Output

```
=== Service Management Example ===

--- 1. Remove/RemoveAll() - Remove Services ---

Logger exists? true
Cache exists? true
Config exists? true

Logger exists after remove? false
Cache exists after remove? true
Config exists after remove? true

Cache exists after removeAll? false
Config exists after removeAll? true

--- 2. Test Scenario - Mock Replacement ---

[CONSOLE] This is from mock logger

--- 3. Dynamic Service Management ---

[LOG] Dynamic logger

--- 4. Service Cleanup Pattern ---

Before cleanup:
  Logger: true
  Cache: true
  Config: true

After cleanup:
  Logger: false
  Cache: false
  Config: false

✅ Service management features are working!

📌 Use Cases:
  - Test scenarios (replace with mocks)
  - Dynamic service configuration
  - Service cleanup and reconfiguration
  - Conditional service registration
```

## Run This Example

```bash
npx ts-node examples/16-service-management.ts
```

## Key Points

- **Remove/RemoveAll()**: Remove services from collection
- **Dynamic Management**: Conditionally add/remove services
- **Test Scenarios**: Replace services with mocks for testing
- **Service Cleanup**: Remove services when no longer needed
