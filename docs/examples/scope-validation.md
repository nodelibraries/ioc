# Scope Validation Example

Demonstrates scope validation feature - `validateScopes` and `validateOnBuild` options to catch lifetime mismatches and missing dependencies.

## Code

```typescript
import { ServiceCollection, ServiceProvider } from '@nodelibraries/ioc';

/**
 * Scope Validation Example
 *
 * This example demonstrates scope validation feature.
 *
 * Features:
 * - validateScopes option: Enable lifetime validation
 * - validateOnBuild option: Validate all dependencies at build time
 * - Error detection: Catch scoped services injected into singletons
 * - Root provider validation: Prevent resolving scoped services from root
 * - Best practices: When to enable validation
 */

interface ILogger {
  log(message: string): void;
}

interface IUserService {
  getUsers(): string[];
}

class Logger implements ILogger {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }
}

class UserService implements IUserService {
  constructor(private logger: ILogger) {}

  getUsers(): string[] {
    this.logger.log('Fetching users...');
    return ['Alice', 'Bob'];
  }
}

async function main() {
  console.log('=== Scope Validation Examples ===\n');

  // ============================================
  // 1. Scope Validation Enabled
  // ============================================
  console.log('--- 1. Scope Validation Enabled ---');

  const services = new ServiceCollection();
  const ILoggerToken = Symbol('ILogger');
  const IUserServiceToken = Symbol('IUserService');

  // Scoped service
  services.addScoped<ILogger>(ILoggerToken, Logger);
  // Singleton service depends on scoped service
  services.addSingleton<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);

  // Create provider with validation
  try {
    const provider = services.buildServiceProvider({ validateScopes: true });
    console.log('⚠️  Provider created with validation');

    // This will error: Cannot inject scoped service into singleton
    const userService = await provider.getRequiredService<IUserService>(IUserServiceToken);
    console.log('❌ This line should not execute!');
  } catch (error: any) {
    console.log('✅ Validation worked!');
    console.log(`   Error: ${error.message}`);
  }

  // ============================================
  // 2. Scope Validation Disabled (Default)
  // ============================================
  console.log('\n--- 2. Scope Validation Disabled (Default) ---');

  const services2 = new ServiceCollection();
  services2.addScoped<ILogger>(ILoggerToken, Logger);
  services2.addSingleton<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);

  // Create provider without validation
  const provider2 = services2.buildServiceProvider({ validateScopes: false });
  console.log('✅ Provider created without validation');

  // This works but it's a wrong pattern (scoped service injected into singleton)
  const userService2 = await provider2.getRequiredService<IUserService>(IUserServiceToken);
  const users = userService2.getUsers();
  console.log('Users:', users);
  console.log("⚠️  This works but it's a wrong pattern!");

  // ============================================
  // 3. Correct Usage - Within Scope
  // ============================================
  console.log('\n--- 3. Correct Usage - Within Scope ---');

  const services3 = new ServiceCollection();
  services3.addSingleton<ILogger>(ILoggerToken, Logger); // Singleton
  services3.addScoped<IUserService>(IUserServiceToken, UserService, [ILoggerToken]); // Scoped, depends on singleton (OK)

  const provider3 = services3.buildServiceProvider({ validateScopes: true });

  // Create scope
  const scope = provider3.createScope();
  const userService3 = await scope.getRequiredService<IUserService>(IUserServiceToken);
  const users3 = userService3.getUsers();
  console.log('Users:', users3);
  console.log('✅ Correct usage - within scope');

  await scope.dispose();

  // ============================================
  // 4. Getting Scoped Service from Root Provider
  // ============================================
  console.log('\n--- 4. Getting Scoped Service from Root Provider ---');

  const services4 = new ServiceCollection();
  services4.addScoped<ILogger>(ILoggerToken, Logger);

  const provider4 = services4.buildServiceProvider({ validateScopes: true });

  try {
    // Getting scoped service from root provider will error
    const logger = await provider4.getRequiredService<ILogger>(ILoggerToken);
    console.log('❌ This line should not execute!');
  } catch (error: any) {
    console.log('✅ Validation worked!');
    console.log(`   Error: ${error.message}`);
  }

  // Correct usage: Create scope
  const scope2 = provider4.createScope();
  const logger2 = await scope2.getRequiredService<ILogger>(ILoggerToken);
  logger2.log('This works!');
  await scope2.dispose();

  // ============================================
  // 5. ValidateOnBuild (Dependency Validation)
  // ============================================
  console.log('\n--- 5. ValidateOnBuild (Dependency Validation) ---');

  // Without validation (error happens at runtime)
  console.log('5.1 Without ValidateOnBuild:');
  const services5a = new ServiceCollection();
  const MissingToken = Symbol('Missing');
  services5a.addSingleton<IUserService>(IUserServiceToken, UserService, [MissingToken]); // Missing dependency!

  try {
    const provider5a = services5a.buildServiceProvider(); // Builds successfully
    console.log('⚠️  Provider built (but will fail at runtime)');
    // Error happens here (at runtime, when user makes request)
    await provider5a.getRequiredService<IUserService>(IUserServiceToken);
  } catch (error: any) {
    console.log('❌ Runtime error:', error.message);
  }

  // With validation (error happens at build time)
  console.log('\n5.2 With ValidateOnBuild:');
  const services5b = new ServiceCollection();
  services5b.addSingleton<IUserService>(IUserServiceToken, UserService, [MissingToken]); // Missing dependency!

  try {
    const provider5b = services5b.buildServiceProvider({ validateOnBuild: true });
    console.log('❌ This should not execute!');
  } catch (error: any) {
    console.log('✅ Build-time validation works!');
    console.log(`   Error: ${error.message}`);
  }

  // Correct usage
  console.log('\n5.3 Correct Usage:');
  const services5c = new ServiceCollection();
  services5c.addSingleton<ILogger>(ILoggerToken, Logger);
  services5c.addSingleton<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);

  try {
    const provider5c = services5c.buildServiceProvider({ validateOnBuild: true });
    console.log('✅ Provider built successfully with validation');
    const userService = await provider5c.getRequiredService<IUserService>(IUserServiceToken);
    const users = userService.getUsers();
    console.log('   Users:', users);
  } catch (error: any) {
    console.log('❌ Unexpected error:', error.message);
  }

  console.log('\n✅ Scope validation is working!');
  console.log('\n📌 Best Practices:');
  console.log('  - Use validateScopes: true in development');
  console.log('  - Use validateOnBuild: true in production (catch errors early)');
  console.log('  - Use scoped services within scope');
  console.log('  - Do not inject scoped service into singleton');
}

main().catch(console.error);
```

## Expected Output

```
=== Scope Validation Examples ===

--- 1. Scope Validation Enabled ---
⚠️  Provider created with validation
✅ Validation worked!
   Error: Cannot resolve scoped service 'Symbol(ILogger)' from root provider. Create a scope first.

--- 2. Scope Validation Disabled (Default) ---
✅ Provider created without validation
[LOG] Fetching users...
Users: [ 'Alice', 'Bob' ]
⚠️  This works but it's a wrong pattern!

--- 3. Correct Usage - Within Scope ---
[LOG] Fetching users...
Users: [ 'Alice', 'Bob' ]
✅ Correct usage - within scope

--- 4. Getting Scoped Service from Root Provider ---
✅ Validation worked!
   Error: Cannot resolve scoped service 'Symbol(ILogger)' from root provider. Create a scope first.
[LOG] This works!

✅ Scope validation is working!

--- 5. ValidateOnBuild (Dependency Validation) ---
5.1 Without ValidateOnBuild:
⚠️  Provider built (but will fail at runtime)
❌ Runtime error: No provider found for token: Symbol(Missing)

5.2 With ValidateOnBuild:
✅ Build-time validation works!
   Error: Validation failed on build:
Missing dependency: Symbol(Missing) required by Symbol(IUserService)

5.3 Correct Usage:
✅ Provider built successfully with validation
[LOG] Fetching users...
   Users: [ 'Alice', 'Bob' ]

📌 Best Practices:
  - Use validateScopes: true in development
  - Use validateOnBuild: true in production (catch errors early)
  - Use scoped services within scope
  - Do not inject scoped service into singleton
```

## Run This Example

```bash
npx ts-node examples/13-scope-validation.ts
```

## Key Points

- **validateScopes**: Enable lifetime validation to catch scoped services injected into singletons
- **validateOnBuild**: Validate all dependencies at build time (catches missing dependencies early)
- **Error Detection**: Catches lifetime mismatches and missing dependencies
- **Best Practices**: Use in development and production to catch errors early
