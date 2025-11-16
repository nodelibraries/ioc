# TryAdd Pattern Example

Demonstrates safe registration without overriding - `tryAddSingleton`, `tryAddScoped`, `tryAddTransient` methods.

## Code

```typescript
import { ServiceCollection, ServiceProvider } from '@nodelibraries/ioc';

/**
 * TryAdd Pattern Example
 *
 * This example demonstrates safe registration without overriding.
 *
 * Features:
 * - tryAddSingleton/Scoped/Transient: Only register if not already registered
 * - Library defaults: Safe way to register default services
 * - User overrides: Preserve user's custom registrations
 * - Use cases: When to use TryAdd vs regular Add
 */

interface ILogger {
  log(message: string): void;
}

class DefaultLogger implements ILogger {
  log(message: string) {
    console.log(`[DEFAULT] ${message}`);
  }
}

class CustomLogger implements ILogger {
  log(message: string) {
    console.log(`[CUSTOM] ${message}`);
  }
}

async function main() {
  console.log('=== TryAdd Pattern Examples ===\n');

  // ============================================
  // 1. TryAdd - Only Add If Not Exists
  // ============================================
  console.log('--- 1. TryAdd - Safe Registration ---');

  const services = new ServiceCollection();
  const ILoggerToken = Symbol('ILogger');

  // First registration
  services.tryAddSingleton<ILogger>(ILoggerToken, DefaultLogger);
  console.log('✅ DefaultLogger registered with tryAddSingleton');

  // Second registration - only add if not exists (in this case, it won't be added)
  services.tryAddSingleton<ILogger>(ILoggerToken, CustomLogger);
  console.log('⚠️  CustomLogger tryAddSingleton - ignored (already exists)');

  const provider = services.buildServiceProvider();
  const logger = await provider.getRequiredService<ILogger>(ILoggerToken);
  logger.log('Test message');
  // Result: DefaultLogger is used (CustomLogger was ignored)

  // ============================================
  // 2. Normal Add vs TryAdd
  // ============================================
  console.log('\n--- 2. Normal Add vs TryAdd ---');

  const services2 = new ServiceCollection();
  const ILoggerToken2 = Symbol('ILogger2');

  // Normal add - overrides
  services2.addSingleton<ILogger>(ILoggerToken2, DefaultLogger);
  services2.addSingleton<ILogger>(ILoggerToken2, CustomLogger); // Override!

  const provider2 = services2.buildServiceProvider();
  const logger2 = await provider2.getRequiredService<ILogger>(ILoggerToken2);
  logger2.log('Test message');
  // Result: CustomLogger is used (DefaultLogger was overridden)

  // TryAdd - does not override
  const services3 = new ServiceCollection();
  const ILoggerToken3 = Symbol('ILogger3');

  services3.tryAddSingleton<ILogger>(ILoggerToken3, DefaultLogger);
  services3.tryAddSingleton<ILogger>(ILoggerToken3, CustomLogger); // Ignored!

  const provider3 = services3.buildServiceProvider();
  const logger3 = await provider3.getRequiredService<ILogger>(ILoggerToken3);
  logger3.log('Test message');
  // Result: DefaultLogger is used (CustomLogger was ignored)

  // ============================================
  // 3. Library/Module Registration Pattern
  // ============================================
  console.log('\n--- 3. Library/Module Registration Pattern ---');

  // Scenario: A library registers a default logger
  // But if the user has registered their own logger, use that instead

  function registerDefaultServices(services: ServiceCollection) {
    // Register library defaults
    services.tryAddSingleton<ILogger>(ILoggerToken, DefaultLogger);
    console.log('Library: Registered default logger');
  }

  function registerUserServices(services: ServiceCollection) {
    // User registers their own logger
    services.addSingleton<ILogger>(ILoggerToken, CustomLogger);
    console.log('User: Registered custom logger');
  }

  const services4 = new ServiceCollection();

  // First, user registers their own services
  registerUserServices(services4);

  // Then library registers defaults (using tryAdd)
  registerDefaultServices(services4);
  // Thanks to tryAdd, user's logger is preserved

  const provider4 = services4.buildServiceProvider();
  const logger4 = await provider4.getRequiredService<ILogger>(ILoggerToken);
  logger4.log('Test message');
  // Result: CustomLogger is used (user's choice is preserved)

  // ============================================
  // 4. TryAddScoped and TryAddTransient
  // ============================================
  console.log('\n--- 4. TryAddScoped and TryAddTransient ---');

  const services5 = new ServiceCollection();
  const IServiceToken = Symbol('IService');

  class Service implements ILogger {
    log(message: string) {
      console.log(`[SERVICE] ${message}`);
    }
  }

  // TryAddScoped
  services5.tryAddScoped<ILogger>(IServiceToken, Service);
  services5.tryAddScoped<ILogger>(IServiceToken, CustomLogger); // Ignored

  // TryAddTransient
  services5.tryAddTransient<ILogger>(IServiceToken, Service);
  services5.tryAddTransient<ILogger>(IServiceToken, CustomLogger); // Ignored

  console.log('\n✅ TryAdd pattern is working!');
  console.log('\n📌 Use Cases:');
  console.log('  - When registering library default services');
  console.log('  - To preserve user overrides');
  console.log('  - When doing conditional registration');
}

main().catch(console.error);
```

## Expected Output

```
=== TryAdd Pattern Examples ===

--- 1. TryAdd - Safe Registration ---
✅ DefaultLogger registered with tryAddSingleton
⚠️  CustomLogger tryAddSingleton - ignored (already exists)
[DEFAULT] Test message

--- 2. Normal Add vs TryAdd ---
[CUSTOM] Test message
[DEFAULT] Test message

--- 3. Library/Module Registration Pattern ---
User: Registered custom logger
Library: Registered default logger
[CUSTOM] Test message

--- 4. TryAddScoped and TryAddTransient ---

✅ TryAdd pattern is working!

📌 Use Cases:
  - When registering library default services
  - To preserve user overrides
  - When doing conditional registration
```

## Run This Example

```bash
npx ts-node examples/10-tryadd-pattern.ts
```

## Key Points

- **Safe Registration**: Only register if not already registered
- **Library Defaults**: Perfect for registering default services in libraries
- **User Overrides**: Preserves user's custom registrations
- **All Lifetimes**: Available for Singleton, Scoped, and Transient
