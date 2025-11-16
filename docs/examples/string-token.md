# String Token Registration Example

Using string tokens instead of Symbol tokens - simpler but less type-safe.

## Code

```typescript
import { ServiceCollection, ServiceProvider } from '@nodelibraries/ioc';

/**
 * String Token Registration Example
 *
 * This example demonstrates using string tokens instead of Symbol tokens.
 * String tokens are simpler but less type-safe than Symbol tokens.
 *
 * Features:
 * - String token registration
 * - Interface-based registration with strings
 * - Dependency injection
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
  console.log('=== String Token Registration Example ===\n');

  const services = new ServiceCollection();

  // Register services using string tokens instead of Symbol tokens
  services.addSingleton<ILogger>('ILogger', Logger);
  services.addScoped<IUserService>('IUserService', UserService, ['ILogger']);

  const provider = services.buildServiceProvider();

  // Get services using string tokens
  const logger = await provider.getRequiredService<ILogger>('ILogger');
  logger.log('Logger from string token');

  const userService = await provider.getRequiredService<IUserService>('IUserService');
  const users = userService.getUsers();
  console.log('Users:', users);
}

main().catch(console.error);
```

## Expected Output

```
=== String Token Registration Example ===

[LOG] Logger from string token
[LOG] Fetching users...
Users: [ 'Alice', 'Bob' ]
```

## Run This Example

```bash
npx ts-node examples/3-string-token.ts
```

## Key Points

- **String Tokens**: Simpler syntax than Symbol tokens
- **Less Type-Safe**: String tokens can collide if not careful
- **Use Cases**: Good for simple scenarios where type safety is less critical
