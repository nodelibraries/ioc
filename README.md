# @nodelibraries/ioc

> Type-Safe IoC Container for Node.js, TypeScript and JavaScript

A lightweight, type-safe Inversion of Control (IoC) container inspired by .NET Core's dependency injection system. **No decorators required** - clean code with flexible registration for both **concrete classes** and **abstract interfaces**. Works with both TypeScript and JavaScript. Supports Singleton, Scoped, and Transient service lifetimes.

## Features

- 🎯 **Type-safe** - Full TypeScript support with type inference
- 🔄 **Multiple Lifetimes** - Singleton, Scoped, and Transient service lifetimes
- 🏗️ **Dependency Injection** - Automatic dependency resolution
- 📦 **Lightweight** - Zero dependencies
- 🎨 **Flexible Registration** - Register both concrete classes and abstract interfaces
- 🚫 **No Decorators** - Clean code without decorator pollution
- 🏭 **Factory Pattern** - Support for factory functions and async initialization
- 🔢 **Multiple Implementations** - Register and retrieve multiple implementations of same interface
- 🔑 **Keyed Services** - Key-based service lookup (with getRequiredKeyedService)
- ✅ **TryAdd Pattern** - Safe registration without overriding
- 🛡️ **Scope Validation** - Detect lifetime mismatches at build time (validateScopes & validateOnBuild)
- 🔍 **Service Checking** - Check service existence with isService() without resolving
- 🗑️ **Service Management** - Remove, replace, and manage services dynamically
- 🔄 **Lifecycle Hooks** - onInit() and onDestroy() callbacks
- 💎 **Value Registration** - Register pre-created values (JSON, primitives, instances)
- 🔄 **Circular Dependency Support** - Automatic resolution of circular dependencies (like .NET Core)

## Installation

```bash
npm install @nodelibraries/ioc
```

**Note:** If the `@nodelibraries` scope is not available, you can use the unscoped package:

```bash
npm install @nodelibraries/ioc
```

## Quick Start

### TypeScript

```typescript
import { ServiceCollection, ServiceProvider } from '@nodelibraries/ioc';

// Define interfaces
interface ILogger {
  log(message: string): void;
}

interface IUserService {
  getUsers(): string[];
}

// Implement services
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

// Setup container
const services = new ServiceCollection();

// Create tokens
const ILoggerToken = Symbol('ILogger');
const IUserServiceToken = Symbol('IUserService');

// Register services (dependencies parameter is optional - defaults to [] if not provided)
services.addSingleton<ILogger>(ILoggerToken, Logger); // No dependencies needed
services.addScoped<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);

// Build provider
const provider = services.buildServiceProvider();

// Use services
const userService = await provider.getRequiredService<IUserService>(IUserServiceToken);
const users = userService.getUsers();
```

### JavaScript (CommonJS)

```javascript
const { ServiceCollection, ServiceProvider, ServiceLifetime } = require('nodelibs-ioc');

// Define services
class Logger {
  log(message) {
    console.log(`[LOG] ${message}`);
  }
}

class UserService {
  constructor(logger) {
    // Optional: Runtime validation for safety in JavaScript
    if (!logger || typeof logger.log !== 'function') {
      throw new TypeError('UserService requires a valid logger');
    }
    this.logger = logger;
  }

  getUsers() {
    this.logger.log('Fetching users...');
    return ['Alice', 'Bob'];
  }
}

// Setup container
const services = new ServiceCollection();

// Create tokens
const ILoggerToken = Symbol('ILogger');
const IUserServiceToken = Symbol('IUserService');

// Register services
services.addSingleton(ILoggerToken, Logger);
services.addScoped(IUserServiceToken, UserService, [ILoggerToken]);

// Build provider
const provider = services.buildServiceProvider();

// Use services
(async () => {
  const userService = await provider.getRequiredService(IUserServiceToken);
  const users = userService.getUsers();
  console.log(users); // ['Alice', 'Bob']
})();
```

### JavaScript (ES Modules)

```javascript
import { ServiceCollection, ServiceProvider } from 'nodelibs-ioc';

// ... same as TypeScript example above
```

### JavaScript Safety Notes

**⚠️ Important:** JavaScript doesn't provide compile-time type safety. For safer code:

1. **Add runtime validation** in constructors (as shown above)
2. **Use TypeScript** for compile-time type safety
3. **Use JSDoc** for better IDE support:

   ```javascript
   /**
    * @typedef {Object} ILogger
    * @property {function(string): void} log
    */

   /**
    * @param {ILogger} logger
    */
   constructor(logger) {
     this.logger = logger;
   }
   ```

**✅ IoC Container Protection:**

- The container ensures dependencies are resolved before construction
- Missing dependencies throw errors at resolution time
- You don't need to manually check for `null`/`undefined` if using the container correctly

## JavaScript Support

### ✅ Fully Supported Features

All features work in JavaScript, but without compile-time type safety:

- ✅ **Service Registration** - `addSingleton`, `addScoped`, `addTransient`
- ✅ **Value Registration** - `addValue` for pre-created values
- ✅ **Factory Pattern** - Factory functions (sync and async)
- ✅ **Multiple Implementations** - `getServices()` for multiple registrations
- ✅ **Keyed Services** - `addKeyed*`, `getKeyedService`, `getRequiredKeyedService`
- ✅ **TryAdd Pattern** - `tryAddSingleton`, `tryAddScoped`, `tryAddTransient`
- ✅ **Service Management** - `remove`, `removeAll`, `replace`
- ✅ **Service Checking** - `isService()` method
- ✅ **Service Resolution** - `getService`, `getRequiredService`, `getServices`
- ✅ **Scopes** - `createScope()`, `dispose()`
- ✅ **Lifecycle Hooks** - `onInit()`, `onDestroy()` methods
- ✅ **Scope Validation** - `validateScopes`, `validateOnBuild` options
- ✅ **Circular Dependencies** - Automatic resolution

### ⚠️ JavaScript Limitations

- ❌ **No Compile-time Type Safety** - Type errors only appear at runtime
- ❌ **No IntelliSense/Autocomplete** - Without TypeScript, IDE support is limited
- ❌ **No Type Inference** - Must manually track types
- ⚠️ **Runtime Validation Recommended** - Add checks in constructors for safety

### 📝 JavaScript Examples

See the [JavaScript Examples](./examples#javascript-examples) section for complete examples.

## Why @nodelibraries/ioc?

**@nodelibraries/ioc** - A lightweight, type-safe IoC container designed for Node.js and TypeScript, inspired by .NET Core's dependency injection system. Seamlessly inject dependencies into your application with zero dependencies and no decorators required.

> 💡 **Learn more**: Check out our [documentation](https://nodelibs.github.io/ioc/guide/about) to understand our philosophy and design principles.

### 🚫 No Decorators - Clean Code

Unlike many IoC containers, `@nodelibraries/ioc` doesn't require decorators or annotations that pollute your code. Your classes remain clean and framework-agnostic:

```typescript
// ❌ Other containers require decorators
// @Injectable()
// @Inject(ILogger)
class UserService {
  // ...
}

// ✅ @nodelibraries/ioc - No decorators needed!
class UserService {
  constructor(private logger: ILogger) {
    // Clean, simple constructor injection
  }
}
```

### 🎨 Flexible Registration - Concrete & Abstract

Register services using either concrete classes or abstract interfaces, depending on your needs:

**Concrete Classes** - Simple and straightforward:

```typescript
services.addSingleton(Logger);
services.addScoped(UserService, [Logger]);
```

**Abstract Interfaces** - Loose coupling and testability:

```typescript
const ILoggerToken = Symbol('ILogger');
services.addSingleton<ILogger>(ILoggerToken, Logger);
services.addScoped<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);
```

**Mixed Approach** - Use both in the same application:

```typescript
// Concrete for stable classes
services.addSingleton(Database);

// Abstract for swappable services
services.addSingleton<ILogger>(ILoggerToken, Logger);

// Mix them together
services.addScoped(UserService, [ILoggerToken, Database]);
```

This flexibility allows you to:

- Start simple with concrete classes
- Gradually introduce interfaces where needed
- Maintain clean, readable code without decorator noise
- Achieve loose coupling without sacrificing simplicity

## Service Lifetimes

### Singleton

A single instance is created and shared across the entire application lifetime.

```typescript
services.addSingleton<ILogger>(ILoggerToken, Logger);
```

### Scoped

A new instance is created for each scope. Perfect for request-scoped services in web applications.

```typescript
services.addScoped<IUserService>(IUserServiceToken, UserService);

// Create a scope
const scope = provider.createScope();
const userService = await scope.getRequiredService<IUserService>(IUserServiceToken);

// Dispose when done
await scope.dispose();
```

### Transient

A new instance is created every time the service is requested.

```typescript
services.addTransient<IValidator>(IValidatorToken, Validator);
```

## Usage with Express.js

```typescript
import express from 'express';
import { ServiceCollection, ServiceProvider } from '@nodelibraries/ioc';

const services = new ServiceCollection();
// ... register services ...
const provider = services.buildServiceProvider();

const app = express();

// Middleware to create scoped container per request
app.use(async (req, res, next) => {
  const scope = provider.createScope();
  (req as any).scope = scope;
  res.on('finish', async () => await scope.dispose());
  next();
});

app.get('/users', async (req, res) => {
  const scope: ServiceProvider = (req as any).scope;
  const userService = await scope.getRequiredService<IUserService>(IUserServiceToken);
  const users = userService.getUsers();
  res.json(users);
});
```

## API Reference

### ServiceCollection

#### `addSingleton<T>(token, implementation?, dependencies?)`

Registers a service as a singleton.

#### `addScoped<T>(token, implementation?, dependencies?)`

Registers a service as scoped.

#### `addTransient<T>(token, implementation?, dependencies?)`

Registers a service as transient.

#### `addValue<T>(token, value)`

Registers a pre-created value (JSON objects, primitives, instances).

#### `addKeyedSingleton<T>(token, implementation, key, dependencies?)`

Registers a keyed service as a singleton.

#### `addKeyedScoped<T>(token, implementation, key, dependencies?)`

Registers a keyed service as scoped.

#### `addKeyedTransient<T>(token, implementation, key, dependencies?)`

Registers a keyed service as transient.

#### `tryAddSingleton<T>(token, implementation?, dependencies?)`

Registers a service as singleton only if not already registered.

#### `tryAddScoped<T>(token, implementation?, dependencies?)`

Registers a service as scoped only if not already registered.

#### `tryAddTransient<T>(token, implementation?, dependencies?)`

Registers a service as transient only if not already registered.

#### `remove<T>(token)`

Removes a service from the collection.

#### `removeAll<T>(token)`

Removes all registrations for a token (alias for `remove`).

#### `replace<T>(token, implementation, dependencies?)`

Replaces an existing service registration.

#### `buildServiceProvider(options?): ServiceProvider`

Builds and returns a service provider. Options:

- `validateScopes?: boolean` - Validate that scoped services aren't injected into singletons
- `validateOnBuild?: boolean` - Validate all dependencies at build time

### ServiceProvider

#### `getService<T>(token): Promise<T | undefined>`

Gets a service instance. Returns `undefined` if not found.

#### `getRequiredService<T>(token): Promise<T>`

Gets a service instance. Throws an error if not found.

#### `getServices<T>(token): Promise<T[]>`

Gets all implementations of a service registered with the same token.

#### `getKeyedService<T>(token, key): Promise<T | undefined>`

Gets a keyed service instance. Returns `undefined` if not found.

#### `getRequiredKeyedService<T>(token, key): Promise<T>`

Gets a keyed service instance. Throws an error if not found.

#### `isService<T>(token): Promise<boolean>`

Checks if a service is registered without resolving it.

#### `createScope(): ServiceProvider`

Creates a new scoped service provider.

#### `dispose(): Promise<void>`

Disposes the provider and all scoped instances. Calls `onDestroy()` on services that implement it.

## Lifecycle Hooks

Services can implement lifecycle hooks:

```typescript
class MyService {
  async onInit() {
    // Called after instance creation
  }

  async onDestroy() {
    // Called when scope is disposed
  }
}
```

## Advanced Examples

### Interface vs Class Registration

The container supports both interface-based and class-based registration:

#### Interface Registration (Recommended for Loose Coupling)

Interfaces don't exist at runtime in JavaScript/TypeScript, so you need to use tokens (Symbol or string):

```typescript
interface ILogger {
  log(message: string): void;
}

class Logger implements ILogger {
  log(message: string) {
    console.log(message);
  }
}

// Use Symbol token for interface
const ILoggerToken = Symbol('ILogger');
// <ILogger> generic type parameter:
// - Ensures Logger implements ILogger (type safety)
// - Enables IntelliSense/autocomplete
// - Provides compile-time type checking
services.addSingleton<ILogger>(ILoggerToken, Logger);

// Resolve using the token (generic type ensures correct return type)
const logger = await provider.getRequiredService<ILogger>(ILoggerToken);
// logger is typed as ILogger, so TypeScript knows about log() method
```

**Advantages:**

- Loose coupling (depend on abstractions, not implementations)
- Easy to swap implementations
- Better for testing (can mock interfaces)

#### Class Registration (Simpler for Concrete Classes)

You can use class constructors directly as tokens:

```typescript
class Logger {
  log(message: string) {
    console.log(message);
  }
}

// Use class directly as token (implementation is optional)
services.addSingleton(Logger); // Same as: services.addSingleton(Logger, Logger)

// Resolve using the class
const logger = await provider.getRequiredService(Logger);
```

**Advantages:**

- Simpler syntax
- No need for tokens
- Good for concrete classes that won't be swapped

#### Multiple Implementations of the Same Interface

If you need multiple implementations of the same interface, use different tokens:

```typescript
// ❌ WRONG: Second registration overrides the first
services.addSingleton<ILogger>(ILoggerToken, ConsoleLogger);
services.addSingleton<ILogger>(ILoggerToken, FileLogger); // Overrides ConsoleLogger!

// ✅ CORRECT: Use different tokens for each implementation
const ConsoleLoggerToken = Symbol('ConsoleLogger');
const FileLoggerToken = Symbol('FileLogger');

services.addSingleton<ILogger>(ConsoleLoggerToken, ConsoleLogger);
services.addSingleton<ILogger>(FileLoggerToken, FileLogger);

// Use the appropriate one
const consoleLogger = await provider.getRequiredService<ILogger>(ConsoleLoggerToken);
const fileLogger = await provider.getRequiredService<ILogger>(FileLoggerToken);
```

**Important:** Registering the same token twice will override the previous registration. The last registration wins.

#### Mixed Usage

You can mix both approaches:

```typescript
// Interface with Symbol token
const ILoggerToken = Symbol('ILogger');
services.addSingleton<ILogger>(ILoggerToken, Logger);

// Class directly (implementation optional - token is used automatically)
services.addSingleton(Database);

// Class depending on interface (with dependencies)
services.addScoped(UserService, [ILoggerToken, Database]); // Dependencies direkt ikinci parametre!
```

### Using String Tokens

You can use strings as tokens instead of Symbols:

```typescript
const services = new ServiceCollection();

services.addSingleton<ILogger>('ILogger', Logger);
services.addScoped<IUserService>('IUserService', UserService, ['ILogger']);

const provider = services.buildServiceProvider();
const logger = await provider.getRequiredService<ILogger>('ILogger');
```

### Using Class Constructors as Tokens

You can use class constructors directly as tokens:

```typescript
const services = new ServiceCollection();

// Register using class as token
services.addSingleton(Logger); // Implementation optional
services.addScoped(UserService, [Logger]); // Dependencies as second parameter

const provider = services.buildServiceProvider();
const logger = await provider.getRequiredService(Logger);
```

### Value Registration

Register pre-created values (JSON objects, primitives, instances, etc.):

```typescript
interface IConfig {
  apiUrl: string;
  timeout: number;
}

const configToken = Symbol('IConfig');
const configValue: IConfig = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
};

// Register the value directly
services.addValue<IConfig>(configToken, configValue);

const provider = services.buildServiceProvider();
const config = await provider.getRequiredService<IConfig>(configToken);
console.log(config.apiUrl); // 'https://api.example.com'
```

**Use cases:**

- **String values**: API keys, URLs, connection strings, etc.
- **Configuration objects**: JSON configuration objects
- **Environment variables**: Runtime configuration
- **Pre-created instances**: Already instantiated objects
- **Primitive values**: Numbers, booleans, etc.
- **Arrays and object literals**: Pre-defined data structures

**Examples:**

```typescript
// String values
services.addValue<string>(Symbol('ApiKey'), 'secret-api-key-12345');
services.addValue<string>(Symbol('DatabaseUrl'), 'postgresql://localhost:5432/mydb');

// Configuration object
const config = { apiUrl: 'https://api.example.com', timeout: 5000 };
services.addValue<IConfig>(Symbol('IConfig'), config);

// Primitive values
services.addValue<number>(Symbol('MaxRetries'), 3);
services.addValue<boolean>(Symbol('IsProduction'), false);
```

**Note:** Values are always registered as singletons (same instance returned every time).

### Factory Pattern

Register services using factory functions for complex initialization:

```typescript
interface IConfig {
  apiUrl: string;
  timeout: number;
}

interface IHttpClient {
  get(url: string): Promise<any>;
}

// Factory function receives ServiceProvider
const httpClientFactory = async (provider: ServiceProvider) => {
  const config = await provider.getRequiredService<IConfig>(IConfigToken);
  return new HttpClient(config.apiUrl, config.timeout);
};

services.addSingleton<IHttpClient>(IHttpClientToken, httpClientFactory);

// Async factory support
const databaseFactory = async (provider: ServiceProvider) => {
  const config = await provider.getRequiredService<IConfig>(IConfigToken);
  const db = new Database(config.connectionString);
  await db.connect(); // Async initialization
  return db;
};

services.addSingleton<IDatabase>(IDatabaseToken, databaseFactory);
```

### Multiple Implementations

Register multiple implementations of the same interface and retrieve all of them:

```typescript
// Register multiple implementations with the same token
services.addSingleton<IMessageWriter>(IMessageWriterToken, ConsoleWriter);
services.addSingleton<IMessageWriter>(IMessageWriterToken, FileWriter);
services.addSingleton<IMessageWriter>(IMessageWriterToken, EmailWriter);

// Get the last registered (default)
const writer = await provider.getService<IMessageWriter>(IMessageWriterToken);

// Get all implementations
const allWriters = await provider.getServices<IMessageWriter>(IMessageWriterToken);
allWriters.forEach((writer) => writer.write('Message'));
```

**Note:** `getService()` returns the last registered implementation. Use `getServices()` to get all implementations.

### TryAdd Pattern

Register services only if they don't already exist (safe for library defaults):

```typescript
// Only registers if not already registered
services.tryAddSingleton<ILogger>(ILoggerToken, DefaultLogger);
services.tryAddSingleton<ILogger>(ILoggerToken, CustomLogger); // Ignored if already exists

// Useful for library defaults
function registerLibraryDefaults(services: ServiceCollection) {
  services.tryAddSingleton<ILogger>(ILoggerToken, DefaultLogger);
  // Won't override user's custom logger
}
```

### Keyed Services

Register multiple implementations of the same interface with different keys:

```typescript
// Register with keys
services.addKeyedSingleton<ICache>(ICacheToken, BigCache, 'big');
services.addKeyedSingleton<ICache>(ICacheToken, SmallCache, 'small');

// Retrieve by key
const bigCache = await provider.getKeyedService<ICache>(ICacheToken, 'big');
const smallCache = await provider.getKeyedService<ICache>(ICacheToken, 'small');

// Or use getRequiredKeyedService (throws if not found)
const requiredCache = await provider.getRequiredKeyedService<ICache>(ICacheToken, 'big');
```

### Scope Validation

Validate that scoped services aren't injected into singletons (catches lifetime mismatches):

```typescript
// Enable validation
const provider = services.buildServiceProvider({
  validateScopes: true,
  validateOnBuild: true,
});

// validateScopes: Throws an error if a scoped service is injected into a singleton
// Error: "Cannot inject scoped service 'ILogger' into singleton service 'IUserService'"

// validateOnBuild: Validates all dependencies at build time
// Error: "Validation failed on build: Missing dependency: ILogger required by IUserService"
```

**Best Practice:** Enable `validateScopes: true` and `validateOnBuild: true` in development to catch lifetime issues early.

### Circular Dependencies

Circular dependencies are automatically resolved for all service lifetimes (similar to .NET Core):

```typescript
class ServiceA {
  constructor(private serviceB: ServiceB) {}
}

class ServiceB {
  constructor(private serviceA: ServiceA) {} // Circular!
}

// Register with circular dependency
services.addSingleton(ServiceAToken, ServiceA, [ServiceBToken]);
services.addSingleton(ServiceBToken, ServiceB, [ServiceAToken]);

// ✅ Works automatically! Container handles circular dependencies
const serviceA = await provider.getRequiredService<ServiceA>(ServiceAToken);
const serviceB = await provider.getRequiredService<ServiceB>(ServiceBToken);

// Both services are properly injected
console.log(serviceA.getServiceBName()); // "ServiceB"
console.log(serviceB.getServiceAName()); // "ServiceA"
```

**Supported for:**

- ✅ **Singleton** - Full support
- ✅ **Scoped** - Works within the same scope
- ✅ **Transient** - Works within the same resolution call

See the [Circular Dependencies Guide](https://nodelibs.github.io/ioc/guide/circular-dependencies) for detailed explanation.

### Dependencies Parameter

**Note:** The dependencies parameter is optional. If not provided, it defaults to an empty array `[]`:

```typescript
// Service with no dependencies - dependencies parameter can be omitted
services.addSingleton<ILogger>(ILoggerToken, Logger); // Automatically defaults to []

// Service with dependencies - provide dependencies array
services.addScoped<IUserService>(IUserServiceToken, UserService, [ILoggerToken, IRepositoryToken]);
```

### Complex Dependency Chain

Example with multiple levels of dependencies:

```typescript
interface IDatabase {
  connect(): Promise<void>;
}

interface IRepository<T> {
  findAll(): Promise<T[]>;
}

interface IUserRepository extends IRepository<User> {
  findById(id: number): Promise<User | null>;
}

class Database implements IDatabase {
  async connect() {
    console.log('Database connected');
  }
}

class UserRepository implements IUserRepository {
  constructor(private db: IDatabase, private logger: ILogger) {}

  async findAll(): Promise<User[]> {
    this.logger.log('Fetching all users');
    return [];
  }

  async findById(id: number): Promise<User | null> {
    this.logger.log(`Fetching user ${id}`);
    return null;
  }
}

class UserService {
  constructor(private userRepo: IUserRepository, private logger: ILogger) {}

  async getUsers() {
    return this.userRepo.findAll();
  }
}

// Registration
const services = new ServiceCollection();
const IDatabaseToken = Symbol('IDatabase');
const IUserRepositoryToken = Symbol('IUserRepository');
const IUserServiceToken = Symbol('IUserService');

services.addSingleton<IDatabase>(IDatabaseToken, Database);
services.addSingleton<ILogger>(ILoggerToken, Logger);
services.addScoped<IUserRepository>(IUserRepositoryToken, UserRepository, [IDatabaseToken, ILoggerToken]);
services.addTransient<UserService>(IUserServiceToken, UserService, [IUserRepositoryToken, ILoggerToken]);
```

### Service Checking

Check if a service exists before using it (without resolving):

```typescript
// Using isService() - more efficient (doesn't resolve the service)
if (await provider.isService<IOptionalService>(IOptionalServiceToken)) {
  const optionalService = await provider.getRequiredService<IOptionalService>(IOptionalServiceToken);
  optionalService.doSomething();
} else {
  console.log('Optional service not registered');
}

// Or using getService() - resolves the service
const optionalService = await provider.getService<IOptionalService>(IOptionalServiceToken);
if (optionalService) {
  optionalService.doSomething();
}
```

### Service Disposal

Properly dispose of scoped services:

```typescript
class DatabaseConnection {
  private connection: any;

  async onInit() {
    this.connection = await connectToDatabase();
  }

  async onDestroy() {
    if (this.connection) {
      await this.connection.close();
      console.log('Database connection closed');
    }
  }
}

// Usage
const scope = provider.createScope();
try {
  const db = await scope.getRequiredService<DatabaseConnection>(IDatabaseToken);
  // Use database...
} finally {
  await scope.dispose(); // Calls onDestroy() on all scoped services
}
```

### Service Management

Remove, replace, and manage services dynamically:

```typescript
// Remove a service
services.remove<ILogger>(ILoggerToken);

// Remove all registrations for a token
services.removeAll<ICache>(ICacheToken);

// Replace an existing service
services.replace<ILogger>(ILoggerToken, NewLogger);

// Check if service exists
if (await provider.isService<ILogger>(ILoggerToken)) {
  // Service is registered
}
```

## Examples

Check out the [examples](./examples) directory for complete, runnable examples:

### Basic Examples (1-3)

- **1-basic.ts** - Simplest usage of the IoC Container (class registration, service resolution, dependency injection, scopes)
- **2-interface-registration.ts** - Interface Registration (Symbol tokens, loose coupling, IsService<T>() method)
- **3-string-token.ts** - String Token Registration (alternative to Symbol tokens)

### Core Concepts (4-6)

- **4-lifetimes.ts** - Service Lifetimes (Singleton, Scoped, Transient)
- **5-lifecycle.ts** - Lifecycle Hooks (onInit, onDestroy)
- **6-value-registration.ts** - Value Registration (JSON objects, primitives, pre-created instances)

### Advanced Features (7-13)

- **7-generic-types.ts** - Generic Type Parameters (type safety, IntelliSense, compile-time checking)
- **8-factory-pattern.ts** - Factory Pattern (factory functions, async initialization, conditional logic)
- **9-multiple-implementations.ts** - Multiple Implementations (getServices, same token multiple implementations)
- **10-tryadd-pattern.ts** - TryAdd Pattern (safe registration without overriding)
- **11-keyed-services.ts** - Keyed Services (key-based lookup, getRequiredKeyedService)
- **12-duplicate-registration.ts** - Duplicate Registration (Replace method, best practices)
- **13-scope-validation.ts** - Scope Validation (validateScopes, validateOnBuild)

### Complex Scenarios (14-15)

- **14-circular-dependency.ts** - Circular Dependency Resolution (Singleton, Scoped, Transient support)
- **15-complex-dependency-chain.ts** - Complex Dependency Chain (deep chains, multiple shared dependencies)

### Real-World Applications (16-18)

- **16-service-management.ts** - Service Management (Remove/RemoveAll, dynamic management)
- **17-express.ts** - Express Integration (request-scoped services, middleware)
- **18-express-advanced.ts** - Advanced Express Integration (authentication, error handling, request context)

See [examples/README.md](./examples/README.md) for detailed descriptions and running instructions.

### JavaScript Examples

- **js-basic.js** - Basic JavaScript usage (registration, resolution, scopes)
- **js-advanced.js** - Advanced JavaScript features (factory, keyed services, multiple implementations)

Run JavaScript examples:
```bash
node examples/js-basic.js
node examples/js-advanced.js
```

## Comparison with .NET Core Dependency Injection

This container is inspired by .NET Core's dependency injection system but designed for TypeScript/Node.js. For a detailed comparison, see [COMPARISON.md](./COMPARISON.md).

### Key Features

**Core Features:**

- ✅ Singleton, Scoped, Transient lifetimes
- ✅ Factory pattern support
- ✅ Multiple implementations
- ✅ Keyed services (with getRequiredKeyedService)
- ✅ TryAdd pattern
- ✅ Scope validation (validateScopes & validateOnBuild)
- ✅ Service checking (isService)
- ✅ Service management (remove, removeAll, replace)
- ✅ Lifecycle hooks
- ✅ Value registration
- ✅ Circular dependency support

**Still missing (compared to .NET):**

- ❌ Open generics support (less common in TypeScript)

**Unique features:**

- 🎯 TypeScript-first design with better type inference
- 🚫 No decorator pollution
- 🔄 Custom lifecycle hooks
- 📦 Lighter weight for Node.js ecosystem

## Requirements

- Node.js >= 14.0.0
- TypeScript >= 5.0.0 (for development)

## License

ISC

## Author

ylcnfrht
