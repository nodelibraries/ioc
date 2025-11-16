# Basic Example

Simplest usage of the IoC Container - class registration, service resolution, dependency injection, and creating scopes.

## Code

```typescript
import { ServiceCollection, ServiceProvider } from '@nodelibraries/ioc';

/**
 * Basic Example - Simplest usage of the IoC Container
 *
 * This example demonstrates the most basic usage:
 * - Class registration (simplest method)
 * - Service resolution
 * - Dependency injection
 * - Creating scopes
 */

// Simple classes without interfaces
class Logger {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }
}

class UserService {
  private users = ['Alice', 'Bob', 'Charlie'];

  constructor(private logger: Logger) {
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

// Register services using class constructors directly as tokens
// This is the simplest registration method - no need for Symbol or string tokens
services.addSingleton(Logger); // No dependencies needed - automatically defaults to []
services.addScoped(UserService, [Logger]);

// Build provider
const provider = services.buildServiceProvider();

// Use services
async function main() {
  console.log('=== Basic Example ===\n');

  // Get services using class constructors as tokens
  const userService = await provider.getRequiredService(UserService);

  // Use the service
  const users = userService.getUsers();
  console.log('Users:', users);

  const user = userService.getUserById(1);
  console.log('User at index 1:', user);

  // Create a new scope
  console.log('\n--- Creating new scope ---');
  const scope = provider.createScope();
  const scopedUserService = await scope.getRequiredService(UserService);
  const scopedUsers = scopedUserService.getUsers();
  console.log('Users from scoped service:', scopedUsers);

  // Dispose scope
  await scope.dispose();
  console.log('\nScope disposed');
}

main().catch(console.error);
```

## Expected Output

```
=== Basic Example ===

[LOG] UserService initialized
[LOG] Fetching all users
Users: [ 'Alice', 'Bob', 'Charlie' ]
[LOG] Fetching user with id: 1
User at index 1: Bob

--- Creating new scope ---
[LOG] UserService initialized
[LOG] Fetching all users
Users from scoped service: [ 'Alice', 'Bob', 'Charlie' ]

Scope disposed
```

## Run This Example

```bash
npx ts-node examples/1-basic.ts
```

## Key Points

- **Class Registration**: Simplest method - use class constructors directly as tokens
- **No Tokens Needed**: No need for Symbol or string tokens when using classes
- **Dependency Injection**: Constructor injection works automatically
- **Scopes**: Create scopes for scoped services and dispose when done
