# Quick Start

This guide will walk you through creating your first IoC container setup.

## Basic Example

```typescript
import { ServiceCollection, ServiceProvider } from '@nodelibraries/ioc';

// 1. Define interfaces
interface ILogger {
  log(message: string): void;
}

interface IUserService {
  getUsers(): string[];
}

// 2. Create implementations
class Logger implements ILogger {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }
}

class UserService implements IUserService {
  constructor(private logger: ILogger) {}

  getUsers(): string[] {
    this.logger.log('Fetching users...');
    return ['Alice', 'Bob', 'Charlie'];
  }
}

// 3. Register services
const services = new ServiceCollection();
const ILoggerToken = Symbol('ILogger');
const IUserServiceToken = Symbol('IUserService');

services.addSingleton<ILogger>(ILoggerToken, Logger);
services.addScoped<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);

// 4. Build provider
const provider = services.buildServiceProvider();

// 5. Use services
async function main() {
  const scope = provider.createScope();
  const userService = await scope.getRequiredService<IUserService>(IUserServiceToken);
  const users = userService.getUsers();
  console.log('Users:', users);

  await scope.dispose();
}

main();
```

## Step-by-Step Explanation

### 1. Define Interfaces

Interfaces define contracts for your services. This allows for loose coupling and easier testing.

```typescript
interface ILogger {
  log(message: string): void;
}
```

### 2. Create Implementations

Implement the interfaces with concrete classes:

```typescript
class Logger implements ILogger {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }
}
```

### 3. Register Services

Create a `ServiceCollection` and register your services:

```typescript
const services = new ServiceCollection();
const ILoggerToken = Symbol('ILogger');

services.addSingleton<ILogger>(ILoggerToken, Logger);
```

**Service Lifetimes:**

- `addSingleton` - One instance for the entire application
- `addScoped` - One instance per scope
- `addTransient` - New instance every time

### 4. Build Provider

Create a `ServiceProvider` from the collection:

```typescript
const provider = services.buildServiceProvider();
```

### 5. Resolve Services

Use the provider to get service instances:

```typescript
const logger = await provider.getRequiredService<ILogger>(ILoggerToken);
```

## With Dependencies

When a service depends on other services, specify them in the registration:

```typescript
services.addScoped<IUserService>(
  IUserServiceToken,
  UserService,
  [ILoggerToken], // Dependencies array
);
```

The container will automatically inject `ILogger` when creating `UserService`.

## Using Scopes

For scoped services, create a scope:

```typescript
const scope = provider.createScope();
const userService = await scope.getRequiredService<IUserService>(IUserServiceToken);
// ... use service
await scope.dispose(); // Clean up
```

## Next Steps

- Learn about [Service Lifetimes](/guide/service-lifetimes)
- Explore [Registration Options](/guide/registration)
- Check out [Examples](/examples/)
