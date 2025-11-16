# Interface Registration Example

Interface-based registration using Symbol tokens - the recommended approach for loose coupling and testability.

## Code

```typescript
import { ServiceCollection, ServiceProvider } from '@nodelibraries/ioc';

/**
 * Interface Registration Example
 *
 * This example demonstrates interface registration using Symbol tokens.
 * This is the recommended approach for loose coupling and testability.
 *
 * Features:
 * - Interface-based registration
 * - Symbol tokens
 * - Dependency injection with interfaces
 * - Scoped services
 * - IsService<T>() method
 */

// Define interfaces
interface ILogger {
  log(message: string): void;
}

interface IUserService {
  getUsers(): string[];
  getUserById(id: number): string | null;
}

// Implement services
class Logger implements ILogger {
  log(message: string) {
    console.log(`[LOG] ${new Date().toISOString()} - ${message}`);
  }
}

class UserService implements IUserService {
  private users = ['Alice', 'Bob', 'Charlie'];

  constructor(private logger: ILogger) {
    this.logger.log('UserService initialized');
  }

  getUsers(): string[] {
    this.logger.log('Fetching all users');
    return this.users;
  }

  getUserById(id: number): string | null {
    this.logger.log(`Fetching user with id: ${id}`);
    return this.users[id] || null;
  }
}

// Setup container
const services = new ServiceCollection();

// Create Symbol tokens for interfaces
const ILoggerToken = Symbol('ILogger');
const IUserServiceToken = Symbol('IUserService');

// Register services using interfaces with Symbol tokens
services.addSingleton<ILogger>(ILoggerToken, Logger); // No dependencies needed - automatically defaults to []
services.addScoped<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);

// Build provider
const provider = services.buildServiceProvider();

// Use services
async function main() {
  console.log('=== Interface Registration Example ===\n');

  // Get services using Symbol tokens
  const userService = await provider.getRequiredService<IUserService>(IUserServiceToken);

  // Use the service
  const users = userService.getUsers();
  console.log('Users:', users);

  const user = userService.getUserById(1);
  console.log('User at index 1:', user);

  // Create a new scope
  console.log('\n--- Creating new scope ---');
  const scope = provider.createScope();
  const scopedUserService = await scope.getRequiredService<IUserService>(IUserServiceToken);
  const scopedUsers = scopedUserService.getUsers();
  console.log('Users from scoped service:', scopedUsers);

  // Dispose scope
  await scope.dispose();
  console.log('\nScope disposed');

  // ============================================
  // IsService<T>() - Check Service Existence
  // ============================================
  console.log('\n--- IsService<T>() - Check Service Existence ---');

  // Check if services are registered
  const hasLogger = await provider.isService<ILogger>(ILoggerToken);
  const hasUserService = await provider.isService<IUserService>(IUserServiceToken);
  const IUnknownToken = Symbol('IUnknown');
  const hasUnknown = await provider.isService(IUnknownToken);

  console.log(`Logger registered? ${hasLogger}`); // true
  console.log(`UserService registered? ${hasUserService}`); // true
  console.log(`Unknown service registered? ${hasUnknown}`); // false

  // Use case: Conditional service resolution
  if (await provider.isService<ILogger>(ILoggerToken)) {
    const logger = await provider.getRequiredService<ILogger>(ILoggerToken);
    logger.log('Logger is available!');
  }

  // Comparison: Old way (requires actual resolution)
  const logger2 = await provider.getService<ILogger>(ILoggerToken);
  if (logger2) {
    console.log('✅ Old way works (but resolves service unnecessarily)');
  }
}

main().catch(console.error);
```

## Expected Output

```
=== Interface Registration Example ===

[LOG] <timestamp> - UserService initialized
[LOG] <timestamp> - Fetching all users
Users: [ 'Alice', 'Bob', 'Charlie' ]
[LOG] <timestamp> - Fetching user with id: 1
User at index 1: Bob

--- Creating new scope ---
[LOG] <timestamp> - UserService initialized
[LOG] <timestamp> - Fetching all users
Users from scoped service: [ 'Alice', 'Bob', 'Charlie' ]

Scope disposed

--- IsService<T>() - Check Service Existence ---
Logger registered? true
UserService registered? true
Unknown service registered? false
[LOG] <timestamp> - Logger is available!
✅ Old way works (but resolves service unnecessarily)
```

## Run This Example

```bash
npx ts-node examples/2-interface-registration.ts
```

## Key Points

- **Interface Registration**: Use Symbol tokens for interface-based registration
- **Loose Coupling**: Depend on abstractions (interfaces), not implementations
- **Testability**: Easy to swap implementations for testing
- **IsService()**: Check if a service is registered without resolving it
