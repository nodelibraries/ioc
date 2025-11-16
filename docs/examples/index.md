# Examples

This section contains practical examples of using `@nodelibraries/ioc`. All examples are available in the `examples/` directory and can be run directly.

## Running Examples

First, make sure you have installed dependencies:

```bash
npm install
npm run build
```

**Note:** The Express examples (`16-express.ts` and `17-express-advanced.ts`) require additional dependencies:

```bash
npm install --save-dev express @types/express ts-node
```

Then run examples using `ts-node`:

```bash
npx ts-node examples/1-basic.ts
```

Or compile and run:

```bash
npm run build
node dist/examples/1-basic.js
```

---

## Examples Overview

Examples are organized from basic to advanced. Click on any example to see the full code and output.

### Basic Examples (1-3)

#### 1. Basic Example

Simplest usage of the IoC Container - class registration, service resolution, dependency injection, and creating scopes.

**Code Snippet:**

```typescript
import { ServiceCollection, ServiceProvider } from '@nodelibraries/ioc';

class Logger {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }
}

class UserService {
  constructor(private logger: Logger) {
    this.logger.log('UserService initialized');
  }

  getUsers(): string[] {
    return ['Alice', 'Bob', 'Charlie'];
  }
}

const services = new ServiceCollection();
services.addSingleton(Logger);
services.addScoped(UserService, [Logger]);

const provider = services.buildServiceProvider();
const userService = await provider.getRequiredService(UserService);
const users = userService.getUsers();
```

**Output:**

```
=== Basic Example ===
[LOG] UserService initialized
[LOG] Fetching all users
Users: [ 'Alice', 'Bob', 'Charlie' ]
```

**Full Example:** [basic.md](./basic) | [Source Code](../../examples/1-basic.ts)

---

#### 2. Interface Registration

Interface-based registration using Symbol tokens - the recommended approach for loose coupling and testability.

**Code Snippet:**

```typescript
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

const ILoggerToken = Symbol('ILogger');
const IUserServiceToken = Symbol('IUserService');

services.addSingleton<ILogger>(ILoggerToken, Logger);
services.addScoped<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);

const userService = await provider.getRequiredService<IUserService>(IUserServiceToken);
```

**Output:**

```
=== Interface Registration Example ===
[LOG] <timestamp> - UserService initialized
Users: [ 'Alice', 'Bob', 'Charlie' ]
```

**Full Example:** [interface-registration.md](./interface-registration) | [Source Code](../../examples/2-interface-registration.ts)

---

#### 3. String Token Registration

Using string tokens instead of Symbol tokens - simpler but less type-safe.

**Code Snippet:**

```typescript
services.addSingleton<ILogger>('ILogger', Logger);
services.addScoped<IUserService>('IUserService', UserService, ['ILogger']);

const logger = await provider.getRequiredService<ILogger>('ILogger');
```

**Output:**

```
=== String Token Registration Example ===
[LOG] Logger from string token
[LOG] Fetching users...
Users: [ 'Alice', 'Bob' ]
```

**Full Example:** [string-token.md](./string-token) | [Source Code](../../examples/3-string-token.ts)

---

### Core Concepts (4-6)

#### 4. Service Lifetimes

Demonstrates the differences between Singleton, Scoped, and Transient service lifetimes.

**Code Snippet:**

```typescript
services.addSingleton<Counter>(CounterToken, Counter);
services.addScoped<ScopedService>(ScopedToken, ScopedService);
services.addTransient<TransientService>(TransientToken, TransientService);

// Singleton - same instance
const singleton1 = await provider.getRequiredService<SingletonService>(SingletonToken);
const singleton2 = await provider.getRequiredService<SingletonService>(SingletonToken);
console.log('Same instance?', singleton1 === singleton2); // true

// Scoped - same within scope, different across scopes
const scope1 = provider.createScope();
const scoped1 = await scope1.getRequiredService<ScopedService>(ScopedToken);
const scoped2 = await scope1.getRequiredService<ScopedService>(ScopedToken);
console.log('Same in scope?', scoped1 === scoped2); // true

// Transient - new instance every time
const transient1 = await provider.getRequiredService<TransientService>(TransientToken);
const transient2 = await provider.getRequiredService<TransientService>(TransientToken);
console.log('Same instance?', transient1 === transient2); // false
```

**Output:**

```
=== Service Lifetimes Example ===
--- Singleton ---
Same instance? true

--- Scoped ---
Same instance in scope? true
Different from scope 1? true

--- Transient ---
Same instance? false
```

**Full Example:** [lifetimes.md](./lifetimes) | [Source Code](../../examples/4-lifetimes.ts)

---

#### 5. Lifecycle Hooks

Demonstrates lifecycle hooks - `onInit()` and `onDestroy()` methods for service initialization and cleanup.

**Code Snippet:**

```typescript
class DatabaseConnection {
  async onInit() {
    console.log('  → DatabaseConnection.onInit() called');
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.connected = true;
    console.log('  → Database connected');
  }

  async onDestroy() {
    console.log('  → DatabaseConnection.onDestroy() called');
    this.connection = null;
    console.log('  → Database connection closed');
  }
}

services.addScoped<DatabaseConnection>(DatabaseToken, DatabaseConnection);

const scope = provider.createScope();
const db = await scope.getRequiredService<DatabaseConnection>(DatabaseToken);
await scope.dispose(); // onDestroy() is called automatically
```

**Output:**

```
=== Lifecycle Hooks Example ===
Getting DatabaseConnection...
  → DatabaseConnection.onInit() called
  → Database connected
Database connected? true

--- Disposing scope 1 ---
  → DatabaseConnection.onDestroy() called
  → Database connection closed
```

**Full Example:** [lifecycle.md](./lifecycle) | [Source Code](../../examples/5-lifecycle.ts)

---

#### 6. Value Registration

Demonstrates registering pre-created values (JSON objects, primitives, arrays, instances, environment variables).

**Code Snippet:**

```typescript
// JSON object
const configValue: IConfig = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  features: { enableCache: true, enableLogging: true },
};
services.addValue<IConfig>(configToken, configValue);

// Primitives
services.addValue<string>(apiKeyToken, 'secret-api-key-12345');
services.addValue<number>(maxRetriesToken, 3);
services.addValue<boolean>(isProductionToken, false);

// Arrays
services.addValue<string[]>(allowedOriginsToken, ['http://localhost:3000', 'https://example.com']);

// Pre-created instance
const loggerInstance = new Logger();
services.addValue<Logger>(loggerToken, loggerInstance);

const config = await provider.getRequiredService<IConfig>(configToken);
```

**Output:**

```
=== Value Registration Examples ===
Config: {
  "apiUrl": "https://api.example.com",
  "timeout": 5000,
  "features": {
    "enableCache": true,
    "enableLogging": true
  }
}
API URL: https://api.example.com
Max Retries: 3
Is Production: false
```

**Full Example:** [value-registration.md](./value-registration) | [Source Code](../../examples/6-value-registration.ts)

---

### Advanced Features (7-13)

#### 7. Generic Type Parameters

Explains the purpose of generic type parameters (`<T>`) - type safety, IntelliSense, and compile-time checking.

**Code Snippet:**

```typescript
// ✅ Type-safe registration
services.addSingleton<ILogger>(ILoggerToken, Logger);

// ✅ Type inference works
const logger = await provider.getRequiredService<ILogger>(ILoggerToken);
logger.log('Hello'); // TypeScript knows this method exists

// ❌ Without generic type - no type safety
const logger2 = await provider.getRequiredService(ILoggerToken);
// logger2 type: any - no autocomplete, no type checking
```

**Output:**

```
=== Generic Type Parameter Usage ===
--- 2. Return Type Inference ---
[LOG] Hello from logger
Sending email to user@example.com: Hello

✅ Generic type parameter usage:
  - Provides type safety
  - IDE autocomplete works
  - Compile-time error checking
```

**Full Example:** [generic-types.md](./generic-types) | [Source Code](../../examples/7-generic-types.ts)

---

#### 8. Factory Pattern

Demonstrates factory pattern for service creation - factory functions, async initialization, conditional logic.

**Code Snippet:**

```typescript
// Simple factory
const httpClientFactory: ServiceFactory<IHttpClient> = async (provider) => {
  const config = await provider.getRequiredService<IConfig>(IConfigToken);
  return new HttpClient(config);
};
services.addSingleton<IHttpClient>(IHttpClientToken, httpClientFactory);

// Async factory with initialization
const databaseFactory: ServiceFactory<IDatabase> = async (provider) => {
  const connectionString = await provider.getRequiredService<string>(ConnectionStringToken);
  const db = new Database(connectionString);
  await db.connect(); // Async initialization
  return db;
};

// Conditional factory
const loggerFactory: ServiceFactory<ILogger> = async (provider) => {
  const logType = await provider.getRequiredService<string>(LogTypeToken);
  return logType === 'file' ? new FileLogger() : new ConsoleLogger();
};
```

**Output:**

```
=== Factory Pattern Examples ===
--- 1. Simple Factory Pattern ---
GET https://api.example.com/users (timeout: 5000ms)

--- 2. Factory with Async Initialization ---
Connecting to database: postgresql://localhost:5432/mydb
Database connected!
Executing query: SELECT * FROM users
```

**Full Example:** [factory-pattern.md](./factory-pattern) | [Source Code](../../examples/8-factory-pattern.ts)

---

#### 9. Multiple Implementations

Shows how to register and retrieve multiple implementations of the same interface using `getServices()`.

**Code Snippet:**

```typescript
// Register multiple implementations with same token
services.addSingleton<IMessageWriter>(IMessageWriterToken, ConsoleWriter);
services.addSingleton<IMessageWriter>(IMessageWriterToken, FileWriter);
services.addSingleton<IMessageWriter>(IMessageWriterToken, EmailWriter);

// Get all implementations
const writers = await provider.getServices<IMessageWriter>(IMessageWriterToken);
console.log(`Total writers: ${writers.length}`); // 3

writers.forEach((writer) => {
  writer.write('Hello from multiple implementations!');
});

// Get last registered (default)
const lastWriter = await provider.getService<IMessageWriter>(IMessageWriterToken);
```

**Output:**

```
=== Multiple Implementations Examples ===
Total writers: 3
Writer 1:
[CONSOLE] Hello from multiple implementations!
Writer 2:
[FILE] Hello from multiple implementations!
Writer 3:
[EMAIL] Hello from multiple implementations!
```

**Full Example:** [multiple-implementations.md](./multiple-implementations) | [Source Code](../../examples/9-multiple-implementations.ts)

---

#### 10. TryAdd Pattern

Demonstrates safe registration without overriding - `tryAddSingleton`, `tryAddScoped`, `tryAddTransient` methods.

**Code Snippet:**

```typescript
// TryAdd - only register if not exists
services.tryAddSingleton<ILogger>(ILoggerToken, DefaultLogger);
services.tryAddSingleton<ILogger>(ILoggerToken, CustomLogger); // Ignored - already exists

// Normal Add - overrides
services.addSingleton<ILogger>(ILoggerToken2, DefaultLogger);
services.addSingleton<ILogger>(ILoggerToken2, CustomLogger); // Overrides!

// Library pattern - preserve user overrides
function registerDefaultServices(services: ServiceCollection) {
  services.tryAddSingleton<ILogger>(ILoggerToken, DefaultLogger);
}

function registerUserServices(services: ServiceCollection) {
  services.addSingleton<ILogger>(ILoggerToken, CustomLogger);
}

registerUserServices(services);
registerDefaultServices(services); // User's logger is preserved
```

**Output:**

```
=== TryAdd Pattern Examples ===
✅ DefaultLogger registered with tryAddSingleton
⚠️  CustomLogger tryAddSingleton - ignored (already exists)
[DEFAULT] Test message

--- 3. Library/Module Registration Pattern ---
User: Registered custom logger
Library: Registered default logger
[CUSTOM] Test message
```

**Full Example:** [tryadd-pattern.md](./tryadd-pattern) | [Source Code](../../examples/10-tryadd-pattern.ts)

---

#### 11. Keyed Services

Shows key-based service lookup - register services with string or symbol keys and retrieve them using `getKeyedService()`.

**Code Snippet:**

```typescript
// Register with keys
services.addKeyedSingleton<ICache>(ICacheToken, BigCache, 'big');
services.addKeyedSingleton<ICache>(ICacheToken, SmallCache, 'small');

// Retrieve by key
const bigCache = await provider.getKeyedService<ICache>(ICacheToken, 'big');
const smallCache = await provider.getKeyedService<ICache>(ICacheToken, 'small');

// Required version with error handling
const cache = await provider.getRequiredKeyedService<ICache>(ICacheToken, 'big');
```

**Output:**

```
=== Keyed Services Examples ===
Using keyed services:
[BIG CACHE] Setting: user:1
[BIG CACHE] Getting: user:1
[SMALL CACHE] Setting: session:abc
[SMALL CACHE] Getting: session:abc
```

**Full Example:** [keyed-services.md](./keyed-services) | [Source Code](../../examples/11-keyed-services.ts)

---

#### 12. Duplicate Registration

Explains what happens when registering the same interface multiple times - last registration wins, using different tokens, and the `Replace()` method.

**Code Snippet:**

```typescript
// Same token - last registration wins
services.addSingleton<ILogger>(ILoggerToken, ConsoleLogger);
services.addSingleton<ILogger>(ILoggerToken, FileLogger); // Overrides ConsoleLogger

// Different tokens - both coexist
const ConsoleLoggerToken = Symbol('ConsoleLogger');
const FileLoggerToken = Symbol('FileLogger');
services.addSingleton<ILogger>(ConsoleLoggerToken, ConsoleLogger);
services.addSingleton<ILogger>(FileLoggerToken, FileLogger);

// Replace() - explicit replacement
services.replace<ILogger>(ILoggerToken, FileLogger);
```

**Output:**

```
=== Registering 2 Concrete Classes with Same Interface ===
✅ ConsoleLogger registered
⚠️  FileLogger registered (same token)
[FILE] Test message

📌 Result: Last registration overrides previous!
```

**Full Example:** [duplicate-registration.md](./duplicate-registration) | [Source Code](../../examples/12-duplicate-registration.ts)

---

#### 13. Scope Validation

Demonstrates scope validation feature - `validateScopes` and `validateOnBuild` options to catch lifetime mismatches.

**Code Snippet:**

```typescript
// Enable validation
const provider = services.buildServiceProvider({
  validateScopes: true,
  validateOnBuild: true,
});

// This will error: scoped service injected into singleton
services.addScoped<ILogger>(ILoggerToken, Logger);
services.addSingleton<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);
// Error: Cannot inject scoped service into singleton

// Validate dependencies at build time
services.addSingleton<IUserService>(IUserServiceToken, UserService, [MissingToken]);
// Error: Missing dependency: Symbol(Missing) required by Symbol(IUserService)
```

**Output:**

```
=== Scope Validation Examples ===
✅ Validation worked!
   Error: Cannot inject scoped service 'Symbol(ILogger)' into singleton service

--- 5. ValidateOnBuild (Dependency Validation) ---
✅ Build-time validation works!
   Error: Validation failed on build:
Missing dependency: Symbol(Missing) required by Symbol(IUserService)
```

**Full Example:** [scope-validation.md](./scope-validation) | [Source Code](../../examples/13-scope-validation.ts)

---

### Complex Scenarios (14-15)

#### 14. Circular Dependency Resolution

Demonstrates circular dependency resolution - singleton, scoped, and transient circular dependencies are all supported.

**Code Snippet:**

```typescript
const ServiceAToken = Symbol('ServiceA');
const ServiceBToken = Symbol('ServiceB');

class ServiceA {
  constructor(private serviceB: ServiceB) {}
  getName(): string {
    return 'ServiceA';
  }
  getServiceBName(): string {
    return this.serviceB.getName();
  }
  getServiceB(): ServiceB {
    return this.serviceB;
  }
}

class ServiceB {
  constructor(private serviceA: ServiceA) {}
  getName(): string {
    return 'ServiceB';
  }
  getServiceAName(): string {
    return this.serviceA.getName();
  }
  getServiceA(): ServiceA {
    return this.serviceA;
  }
}

// Singleton circular dependency
services.addSingleton(ServiceAToken, ServiceA, [ServiceBToken]);
services.addSingleton(ServiceBToken, ServiceB, [ServiceAToken]);

// Scoped circular dependency
services.addScoped(ServiceAToken, ServiceA, [ServiceBToken]);
services.addScoped(ServiceBToken, ServiceB, [ServiceAToken]);

// Transient circular dependency
services.addTransient(ServiceAToken, ServiceA, [ServiceBToken]);
services.addTransient(ServiceBToken, ServiceB, [ServiceAToken]);

const serviceA = await provider.getRequiredService<ServiceA>(ServiceAToken);
console.log(serviceA.getServiceBName()); // ServiceB
console.log(serviceA.getServiceB().getServiceAName()); // ServiceA
```

**Output:**

```
=== Testing Singleton Circular Dependency ===
✅ Circular dependency resolved successfully!
ServiceA name: ServiceA
ServiceB name: ServiceB
ServiceA -> ServiceB name: ServiceB
ServiceB -> ServiceA name: ServiceA
Same ServiceA instance? true
Same ServiceB instance? true

=== Testing Scoped Circular Dependency ===
✅ Circular dependency resolved successfully in scope!
ServiceA name: ServiceA
ServiceB name: ServiceB
ServiceA -> ServiceB name: ServiceB
ServiceB -> ServiceA name: ServiceA
Same ServiceA instance in scope? true
Same ServiceB instance in scope? true

=== Testing Transient Circular Dependency ===
✅ Circular dependency resolved successfully for transient services!
ServiceA1 name: ServiceA
ServiceB1 name: ServiceB
ServiceA1 -> ServiceB1 name: ServiceB
ServiceB1 -> ServiceA1 name: ServiceA
Transient behavior check:
serviceA1 === serviceA2? false
serviceB1 === serviceB2? false
```

**Full Example:** [circular-dependency.md](./circular-dependency) | [Source Code](../../examples/14-circular-dependency.ts)

---

#### 15. Complex Dependency Chain

Demonstrates a complex dependency chain: ServiceA -> ServiceB -> ServiceC -> ServiceD, ServiceE with different lifetimes.

**Code Snippet:**

```typescript
// Deep dependency chain: ServiceA -> ServiceB -> ServiceC -> ServiceD, ServiceE
interface IServiceD {
  getName(): string;
}
interface IServiceE {
  getName(): string;
}
interface IServiceC {
  getName(): string;
  getDependency(): IServiceD;
  getOtherDependency(): IServiceE;
}
interface IServiceB {
  getName(): string;
  getDependency(): IServiceC;
}
interface IServiceA {
  getName(): string;
  getDependency(): IServiceB;
}

class ServiceD implements IServiceD {
  getName(): string {
    return 'ServiceD';
  }
}
class ServiceE implements IServiceE {
  getName(): string {
    return 'ServiceE';
  }
}
class ServiceC implements IServiceC {
  constructor(private serviceD: IServiceD, private serviceE: IServiceE) {
    console.log(`[ServiceC] Initialized with ${serviceD.getName()} and ${serviceE.getName()}`);
  }
  getName(): string {
    return 'ServiceC';
  }
  getDependency(): IServiceD {
    return this.serviceD;
  }
  getOtherDependency(): IServiceE {
    return this.serviceE;
  }
}
class ServiceB implements IServiceB {
  constructor(private serviceC: IServiceC) {
    console.log(`[ServiceB] Initialized with ${serviceC.getName()}`);
  }
  getName(): string {
    return 'ServiceB';
  }
  getDependency(): IServiceC {
    return this.serviceC;
  }
}
class ServiceA implements IServiceA {
  constructor(private serviceB: IServiceB) {
    console.log(`[ServiceA] Initialized with ${serviceB.getName()}`);
  }
  getName(): string {
    return 'ServiceA';
  }
  getDependency(): IServiceB {
    return this.serviceB;
  }
}

// Register services in dependency order (bottom-up)
services.addSingleton<IServiceD>(ServiceDToken, ServiceD);
services.addSingleton<IServiceE>(ServiceEToken, ServiceE);
services.addSingleton<IServiceC>(ServiceCToken, ServiceC, [ServiceDToken, ServiceEToken]);
services.addSingleton<IServiceB>(ServiceBToken, ServiceB, [ServiceCToken]);
services.addSingleton<IServiceA>(ServiceAToken, ServiceA, [ServiceBToken]);

// Resolve top of chain - automatically resolves entire chain
const serviceA = await provider.getRequiredService<IServiceA>(ServiceAToken);
const serviceD = serviceA.getDependency().getDependency().getDependency();
console.log(serviceD.getName()); // ServiceD
```

**Output:**

```
=== Complex Dependency Chain Example ===
--- Resolving ServiceA (top of chain) ---
[ServiceC] Initialized with ServiceD and ServiceE
[ServiceB] Initialized with ServiceC
[ServiceA] Initialized with ServiceB

--- Verifying Dependency Chain ---
ServiceA name: ServiceA
ServiceB name: ServiceB
ServiceC name: ServiceC
ServiceD name: ServiceD
ServiceE name: ServiceE

--- Testing Singleton Behavior ---
Same ServiceA instance? true
Same ServiceD instance? true
Same ServiceE instance? true

--- Testing Scoped Services ---
Different scopes, different ServiceA? true
Same scope, same ServiceB? true
```

**Full Example:** [complex-dependency-chain.md](./complex-dependency-chain) | [Source Code](../../examples/15-complex-dependency-chain.ts)

---

### Real-World Applications (16-18)

#### 16. Service Management

Demonstrates service management features - `Remove/RemoveAll()` methods for dynamic service management.

**Code Snippet:**

```typescript
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
class BigCache implements ICache {
  private data = new Map<string, string>();
  get(key: string): string | undefined {
    return this.data.get(key);
  }
  set(key: string, value: string): void {
    this.data.set(key, value);
  }
}

// 1. Remove services
services.addSingleton<ILogger>(ILoggerToken, Logger);
services.addSingleton<ICache>(ICacheToken, BigCache);
services.addSingleton<IConfig>(IConfigToken, Config);

console.log(`Logger exists? ${await provider.isService<ILogger>(ILoggerToken)}`); // true
console.log(`Cache exists? ${await provider.isService<ICache>(ICacheToken)}`); // true

services.remove<ILogger>(ILoggerToken);
services.removeAll<ICache>(ICacheToken); // Alias for remove

console.log(`Logger exists after remove? ${await provider.isService<ILogger>(ILoggerToken)}`); // false
console.log(`Cache exists after removeAll? ${await provider.isService<ICache>(ICacheToken)}`); // false

// 2. Test scenario - replace with mock
services.remove<ILogger>(ILoggerToken);
services.addSingleton<ILogger>(ILoggerToken, ConsoleLogger); // Mock logger

// 3. Dynamic service management
const useFileLogger = process.env.USE_FILE_LOGGER === 'true';
if (useFileLogger) {
  services.remove<ILogger>(ILoggerToken);
  services.addSingleton<ILogger>(ILoggerToken, FileLogger);
}
```

**Output:**

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
```

**Full Example:** [service-management.md](./service-management) | [Source Code](../../examples/16-service-management.ts)

---

#### 17. Express Integration

Complete example of using the IoC container with Express.js - request-scoped services, middleware, and RESTful API.

**Code Snippet:**

```typescript
import express, { Request, Response } from 'express';
import { ServiceCollection, ServiceProvider } from '@nodelibraries/ioc';

interface ILogger {
  log(message: string): void;
}
interface IUserRepository {
  findAll(): User[];
  findById(id: number): User | null;
  create(user: { name: string; email: string }): User;
}
interface IUserService {
  getUsers(): User[];
  getUserById(id: number): User | null;
  createUser(name: string, email: string): User;
}

class Logger implements ILogger {
  log(message: string) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
}
class UserRepository implements IUserRepository {
  constructor(private logger: ILogger) {
    this.logger.log('UserRepository initialized');
  }
  findAll() {
    this.logger.log('Repository: Finding all users');
    return this.users;
  }
  // ... other methods
}
class UserService implements IUserService {
  constructor(private repository: IUserRepository, private logger: ILogger) {
    this.logger.log('UserService initialized');
  }
  getUsers() {
    this.logger.log('Service: Getting all users');
    return this.repository.findAll();
  }
  // ... other methods
}

// Setup DI Container
const services = new ServiceCollection();
const ILoggerToken = Symbol('ILogger');
const IUserRepositoryToken = Symbol('IUserRepository');
const IUserServiceToken = Symbol('IUserService');

services.addSingleton<ILogger>(ILoggerToken, Logger);
services.addScoped<IUserRepository>(IUserRepositoryToken, UserRepository, [ILoggerToken]);
services.addScoped<IUserService>(IUserServiceToken, UserService, [IUserRepositoryToken, ILoggerToken]);

const provider = services.buildServiceProvider();

// Express App
const app = express();
app.use(express.json());

// Middleware: Create scoped container per request
app.use(async (req: Request, res: Response, next) => {
  const scope = provider.createScope();
  (req as any).scope = scope;
  res.on('finish', async () => {
    await scope.dispose();
  });
  next();
});

// Routes
app.get('/users', async (req: Request, res: Response) => {
  const scope: ServiceProvider = (req as any).scope;
  const userService = await scope.getRequiredService<IUserService>(IUserServiceToken);
  const users = userService.getUsers();
  res.json(users);
});

app.get('/users/:id', async (req: Request, res: Response) => {
  const scope: ServiceProvider = (req as any).scope;
  const userService = await scope.getRequiredService<IUserService>(IUserServiceToken);
  const id = parseInt(req.params.id, 10);
  const user = userService.getUserById(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

app.post('/users', async (req: Request, res: Response) => {
  const scope: ServiceProvider = (req as any).scope;
  const userService = await scope.getRequiredService<IUserService>(IUserServiceToken);
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  const newUser = userService.createUser(name, email);
  res.status(201).json(newUser);
});

app.listen(3000, () => {
  console.log('🚀 Express server with IoC Container running on http://localhost:3000');
});
```

**Output:**

```
🚀 Express server with IoC Container running on http://localhost:3000

Available endpoints:
  GET  http://localhost:3000/users
  GET  http://localhost:3000/users/:id
  POST http://localhost:3000/users

[<timestamp>] UserRepository initialized
[<timestamp>] UserService initialized
[<timestamp>] Repository: Finding all users
[<timestamp>] Service: Getting all users
```

**Full Example:** [express.md](./express) | [Source Code](../../examples/16-express.ts)

---

#### 17. Advanced Express Integration

More complex Express.js application with multiple services, middleware, authentication, error handling, and request context.

**Code Snippet:**

```typescript
import express, { Request, Response, NextFunction } from 'express';
import { ServiceCollection, ServiceProvider } from '@nodelibraries/ioc';

interface ILogger {
  log(message: string, level?: string): void;
  error(message: string, error?: Error): void;
}
interface IConfig {
  get(key: string): string | undefined;
}
interface IUserRepository {
  findById(id: number): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(user: Partial<User>): Promise<User>;
}
interface IUserService {
  getUserById(id: number): Promise<User | null>;
  getAllUsers(): Promise<User[]>;
  createUser(data: CreateUserDto): Promise<User>;
}
interface IAuthService {
  validateToken(token: string): Promise<boolean>;
  getUserIdFromToken(token: string): Promise<number | null>;
}
interface IRequestContext {
  userId?: number;
  requestId: string;
  startTime: number;
}

// Setup services
const services = new ServiceCollection();
services.addSingleton<IConfig>(IConfigToken, Config);
services.addSingleton<ILogger>(ILoggerToken, Logger, [IConfigToken]);
services.addScoped<IUserRepository>(IUserRepositoryToken, UserRepository, [ILoggerToken]);
services.addScoped<IUserService>(IUserServiceToken, UserService, [IUserRepositoryToken, ILoggerToken]);
services.addScoped<IAuthService>(IAuthServiceToken, AuthService, [IConfigToken, ILoggerToken]);

const provider = services.buildServiceProvider();

// Request context middleware
function createRequestScopeMiddleware(provider: ServiceProvider) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const requestId = `req-${Date.now()}`;
    const scope = provider.createScope();
    (req as any).scope = scope;
    (req as any).requestContext = { requestId, startTime: Date.now() };

    const logger = await scope.getRequiredService<ILogger>(ILoggerToken);
    logger.log(`Request started: ${req.method} ${req.path} [${requestId}]`);

    res.on('finish', async () => {
      const duration = Date.now() - (req as any).requestContext.startTime;
      logger.log(`Request finished: ${req.method} ${req.path} [${requestId}] - ${duration}ms`);
      await scope.dispose();
    });
    next();
  };
}

// Authentication middleware
function createAuthMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const scope: ServiceProvider = (req as any).scope;
    const authService = await scope.getRequiredService<IAuthService>(IAuthServiceToken);
    const token = req.headers.authorization;

    if (!(await authService.validateToken(token))) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = await authService.getUserIdFromToken(token);
    (req as any).requestContext.userId = userId;
    next();
  };
}

// Error handling middleware
function createErrorHandler() {
  return async (err: Error, req: Request, res: Response, next: NextFunction) => {
    const scope: ServiceProvider = (req as any).scope;
    const logger = await scope.getRequiredService<ILogger>(ILoggerToken);
    logger.error('Request error', err);
    res.status(500).json({ error: 'Internal server error' });
  };
}

const app = express();
app.use(express.json());
app.use(createRequestScopeMiddleware(provider));

// Protected routes
app.get('/users', createAuthMiddleware(), async (req: Request, res: Response) => {
  const scope: ServiceProvider = (req as any).scope;
  const userService = await scope.getRequiredService<IUserService>(IUserServiceToken);
  const users = await userService.getAllUsers();
  res.json(users);
});

app.use(createErrorHandler());
app.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});
```

**Output:**

```
🚀 Server running on http://localhost:3000

[INFO] <timestamp> - Request started: GET /users [req-...]
[INFO] <timestamp> - UserRepository initialized
[INFO] <timestamp> - UserService initialized
[INFO] <timestamp> - Fetching all users [req-...]
[INFO] <timestamp> - Request finished: GET /users [req-...] - <duration>ms
```

**Full Example:** [express-advanced.md](./express-advanced) | [Source Code](../../examples/17-express-advanced.ts)

---

---

#### 18. Dependency Tree Visualization

Visualize and analyze service dependency trees. See the complete dependency hierarchy, detect circular dependencies, and get structured tree data.

**Code Snippet:**

```typescript
import { ServiceCollection } from '@nodelibraries/ioc';

const services = new ServiceCollection();
// ... register services ...

// Visualize dependency tree
console.log(services.visualizeDependencyTree(IUserServiceToken));

// Get tree as object
const tree = services.getDependencyTree(IUserServiceToken);
```

**Output:**

```
└── Symbol(IUserService) [SINGLETON]
    ├── Symbol(IUserRepository) [SINGLETON]
    │   ├── Symbol(IDatabase) [SINGLETON]
    │   └── Symbol(ILogger) [SINGLETON]
    └── Symbol(ILogger) [SINGLETON]
```

**Full Example:** [dependency-tree.md](./dependency-tree) | [Source Code](../../examples/18-dependency-tree.ts)

---

#### 19. Circular Dependency Detection

Detect and visualize all circular dependencies in your service collection. Works with simple and complex circular dependencies, and multiple independent cycles.

**Code Snippet:**

```typescript
import { ServiceCollection } from '@nodelibraries/ioc';

const services = new ServiceCollection();
// ... register services with circular dependencies ...

// Detect circular dependencies
const circularDeps = services.getCircularDependencies();
console.log(services.visualizeCircularDependencies());
```

**Output:**

```
Found 1 circular dependency/ies:

Circular Dependency 1:
  Symbol(ServiceA) → Symbol(ServiceB) → Symbol(ServiceC) → Symbol(ServiceA)
```

**Full Example:** [circular-dependency-detection.md](./circular-dependency-detection) | [Source Code](../../examples/19-circular-dependency-detection.ts)

---

## JavaScript Examples

The library works with both TypeScript and JavaScript. All features are available in JavaScript, but without compile-time type safety.

### JS Basic Example

**File:** [js/js-basic.js](../../examples/js/js-basic.js) | [Documentation](./js-basic)

Basic JavaScript usage - service registration, resolution, dependency injection, and scopes.

**Run:**

```bash
node examples/js/js-basic.js
```

### JS Advanced Example

**File:** [js/js-advanced.js](../../examples/js/js-advanced.js) | [Documentation](./js-advanced)

Advanced JavaScript features - factory pattern, keyed services, multiple implementations, value registration, service checking, and TryAdd pattern.

**Run:**

```bash
node examples/js/js-advanced.js
```

**Key Points:**

- All features work in JavaScript (same API as TypeScript)
- No compile-time type safety
- Runtime validation recommended in constructors
- CommonJS `require()` syntax (ES Modules also supported)

## Learning Path

1. **Start with basics**: Examples 1-3 introduce the fundamental concepts
2. **Understand lifetimes**: Example 4 is crucial for understanding how services are managed
3. **Learn lifecycle**: Example 5 shows how to handle initialization and cleanup
4. **Explore advanced features**: Examples 7-13 cover more sophisticated patterns
5. **Handle edge cases**: Examples 14-15 demonstrate complex scenarios
6. **Build real applications**: Examples 16-18 show practical usage
7. **JavaScript users**: Check out `js/js-basic.js` and `js/js-advanced.js` for JavaScript examples

## Notes

- All examples include expected console output at the end of each file
- Examples are self-contained and can be run independently
- Each example focuses on specific features to avoid confusion
- Examples progress from simple to complex, building on previous concepts
