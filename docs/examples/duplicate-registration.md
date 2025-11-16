# Duplicate Registration Example

Explains what happens when registering the same interface multiple times - last registration wins, using different tokens, and the `Replace()` method.

## Code

```typescript
import { ServiceCollection, ServiceProvider } from '@nodelibraries/ioc';

/**
 * Duplicate Registration Example
 *
 * This example explains what happens when registering the same interface multiple times.
 *
 * Features:
 * - Same token, different implementations: Last registration wins (overrides previous)
 * - Different tokens, same interface: Both implementations can coexist
 * - Class tokens: Each class has its own token automatically
 * - Replace(): Explicit service replacement method
 * - Best practices: How to handle multiple implementations correctly
 */

interface ILogger {
  log(message: string): void;
}

// Two different implementations
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

async function main() {
  console.log('=== Registering 2 Concrete Classes with Same Interface ===\n');

  const services = new ServiceCollection();
  const ILoggerToken = Symbol('ILogger');

  // ============================================
  // Scenario 1: 2 Different Implementations with Same Token
  // ============================================
  console.log('--- Scenario 1: 2 Different Implementations with Same Token ---');

  // First registration
  services.addSingleton<ILogger>(ILoggerToken, ConsoleLogger);
  console.log('✅ ConsoleLogger registered');

  // Second registration - with SAME TOKEN!
  services.addSingleton<ILogger>(ILoggerToken, FileLogger);
  console.log('⚠️  FileLogger registered (same token)');

  const provider = services.buildServiceProvider();

  // Which implementation is returned?
  const logger = await provider.getRequiredService<ILogger>(ILoggerToken);
  logger.log('Test message');
  // Result: FileLogger is returned (last registration overrides previous)

  console.log('\n📌 Result: Last registration overrides previous!');
  console.log('   Second registration replaces the first one.\n');

  // ============================================
  // Scenario 2: Same Interface with Different Tokens
  // ============================================
  console.log('--- Scenario 2: Same Interface with Different Tokens ---');

  const services2 = new ServiceCollection();

  // Use different tokens
  const ConsoleLoggerToken = Symbol('ConsoleLogger');
  const FileLoggerToken = Symbol('FileLogger');

  services2.addSingleton<ILogger>(ConsoleLoggerToken, ConsoleLogger);
  services2.addSingleton<ILogger>(FileLoggerToken, FileLogger);

  const provider2 = services2.buildServiceProvider();

  const consoleLogger = await provider2.getRequiredService<ILogger>(ConsoleLoggerToken);
  const fileLogger = await provider2.getRequiredService<ILogger>(FileLoggerToken);

  console.log('Console Logger:');
  consoleLogger.log('Test message');

  console.log('\nFile Logger:');
  fileLogger.log('Test message');

  console.log('\n✅ Both implementations can be used with separate tokens\n');

  // ============================================
  // Scenario 3: Same Interface with Class Token
  // ============================================
  console.log('--- Scenario 3: Same Interface with Class Token ---');

  const services3 = new ServiceCollection();

  // Use classes directly as tokens
  services3.addSingleton(ConsoleLogger);
  services3.addSingleton(FileLogger);

  const provider3 = services3.buildServiceProvider();

  const consoleLogger2 = await provider3.getRequiredService(ConsoleLogger);
  const fileLogger2 = await provider3.getRequiredService(FileLogger);

  console.log('Console Logger (class token):');
  consoleLogger2.log('Test message');

  console.log('\nFile Logger (class token):');
  fileLogger2.log('Test message');

  console.log('\n✅ When using class token, each class becomes its own token\n');

  // ============================================
  // Scenario 4: Which Logger Will Be Used in Service?
  // ============================================
  console.log('--- Scenario 4: Service Dependency Injection ---');

  interface IUserService {
    getUsers(): string[];
  }

  class UserService implements IUserService {
    constructor(private logger: ILogger) {}

    getUsers(): string[] {
      this.logger.log('Fetching users...');
      return ['Alice', 'Bob'];
    }
  }

  const services4 = new ServiceCollection();
  const IUserServiceToken = Symbol('IUserService');

  // Register first logger
  services4.addSingleton<ILogger>(ILoggerToken, ConsoleLogger);
  services4.addScoped<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);

  const provider4 = services4.buildServiceProvider();
  const userService1 = await provider4.getRequiredService<IUserService>(IUserServiceToken);
  console.log('UserService 1 (ConsoleLogger):');
  userService1.getUsers();

  // Now change the logger (override)
  services4.addSingleton<ILogger>(ILoggerToken, FileLogger);
  const provider4_2 = services4.buildServiceProvider(); // Create new provider
  const userService2 = await provider4_2.getRequiredService<IUserService>(IUserServiceToken);
  console.log('\nUserService 2 (FileLogger - after override):');
  userService2.getUsers();

  console.log('\n⚠️  IMPORTANT: Changes made AFTER buildServiceProvider() will only apply to new providers!');
  console.log("   Singleton instances in existing provider won't change.\n");

  // ============================================
  // 5. Replace() - Explicit Service Replacement
  // ============================================
  console.log('--- 5. Replace() - Explicit Service Replacement ---\n');

  const services5 = new ServiceCollection();
  services5.addSingleton<ILogger>(ILoggerToken, ConsoleLogger);

  const provider5a = services5.buildServiceProvider();
  const logger5a = await provider5a.getRequiredService<ILogger>(ILoggerToken);
  logger5a.log('Original logger');

  // Replace with different implementation
  services5.replace<ILogger>(ILoggerToken, FileLogger);
  const provider5b = services5.buildServiceProvider();
  const logger5b = await provider5b.getRequiredService<ILogger>(ILoggerToken);
  logger5b.log('Replaced logger');

  // Replace with factory
  services5.replace<ILogger>(ILoggerToken, (provider: ServiceProvider) => {
    console.log('Factory creating logger');
    return new ConsoleLogger();
  });
  const provider5c = services5.buildServiceProvider();
  const logger5c = await provider5c.getRequiredService<ILogger>(ILoggerToken);
  logger5c.log('Factory-created logger');

  console.log('\n✅ Replace() works!');

  // ============================================
  // Summary and Recommendations
  // ============================================
  console.log('=== Summary and Recommendations ===\n');

  console.log('1. 2 different implementations with same token:');
  console.log('   ❌ Last registration overrides previous');
  console.log('   ✅ Use different tokens\n');

  console.log('2. To use multiple implementations:');
  console.log('   ✅ Use different token for each implementation');
  console.log('   ✅ Or use class directly as token\n');

  console.log('3. After buildServiceProvider():');
  console.log('   ⚠️  You need to create a new provider');
  console.log("   ⚠️  Singleton instances in existing provider won't change\n");

  console.log('4. Best Practice:');
  console.log('   ✅ Use unique token for each implementation');
  console.log('   ✅ Do service registration before buildServiceProvider()');
  console.log('   ✅ If you need different implementations for same interface:');
  console.log('      - Use different tokens');
  console.log('      - Or use factory pattern');
}

main().catch(console.error);
```

## Expected Output

```
=== Registering 2 Concrete Classes with Same Interface ===

--- Scenario 1: 2 Different Implementations with Same Token ---
✅ ConsoleLogger registered
⚠️  FileLogger registered (same token)
[FILE] Test message

📌 Result: Last registration overrides previous!
   Second registration replaces the first one.

--- Scenario 2: Same Interface with Different Tokens ---
Console Logger:
[CONSOLE] Test message

File Logger:
[FILE] Test message

✅ Both implementations can be used with separate tokens

--- Scenario 3: Same Interface with Class Token ---
Console Logger (class token):
[CONSOLE] Test message

File Logger (class token):
[FILE] Test message

✅ When using class token, each class becomes its own token

--- Scenario 4: Service Dependency Injection ---
UserService 1 (ConsoleLogger):
[CONSOLE] Fetching users...

UserService 2 (FileLogger - after override):
[FILE] Fetching users...

⚠️  IMPORTANT: Changes made AFTER buildServiceProvider() will only apply to new providers!
   Singleton instances in existing provider won't change.

--- 5. Replace() - Explicit Service Replacement ---

[CONSOLE] Original logger
[FILE] Replaced logger
Factory creating logger
[CONSOLE] Factory-created logger

✅ Replace() works!

=== Summary and Recommendations ===

1. 2 different implementations with same token:
   ❌ Last registration overrides previous
   ✅ Use different tokens

2. To use multiple implementations:
   ✅ Use different token for each implementation
   ✅ Or use class directly as token

3. After buildServiceProvider():
   ⚠️  You need to create a new provider
   ⚠️  Singleton instances in existing provider won't change

4. Best Practice:
   ✅ Use unique token for each implementation
   ✅ Do service registration before buildServiceProvider()
   ✅ If you need different implementations for same interface:
      - Use different tokens
      - Or use factory pattern
```

## Run This Example

```bash
npx ts-node examples/12-duplicate-registration.ts
```

## Key Points

- **Last Registration Wins**: Same token, different implementations - last one overrides
- **Different Tokens**: Use different tokens to have both implementations coexist
- **Class Tokens**: Each class becomes its own token automatically
- **Replace()**: Explicit method to replace service registrations
