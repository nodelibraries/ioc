# ServiceCollection

The `ServiceCollection` is used to register services before building a `ServiceProvider`.

## Methods

### Registration Methods

#### `addSingleton<T>(token, implementation?, dependencies?)`

Register a service as a singleton. A single instance is created and shared across the entire application lifetime.

**Overloads:**

```typescript
addSingleton<T>(token: Token<T>): this;
addSingleton<T>(token: Token<T>, dependencies: Token[]): this;
addSingleton<T>(token: Token<T>, implementation: Newable<T>): this;
addSingleton<T>(token: Token<T>, implementation: Newable<T>, dependencies: Token[]): this;
addSingleton<T>(token: Token<T>, factory: ServiceFactory<T>): this;
```

**Parameters:**

- `token`: Token to identify the service (Symbol, string, or class constructor)
- `implementation`: (Optional) Class constructor implementing the service
- `dependencies`: **Required if the class constructor has parameters**. Array of dependency tokens. If the constructor has dependencies, you **must** provide them in this array, otherwise the container cannot resolve them. If the constructor has no parameters, you can omit this (defaults to `[]`).
- `factory`: (Optional) Factory function that creates the service instance

**Examples:**

```typescript
// 1. Class registration (simplest) - no dependencies (constructor has no parameters)
services.addSingleton(Logger);

// 2. Interface registration - no dependencies (Logger constructor has no parameters)
services.addSingleton<ILogger>(ILoggerToken, Logger);

// 3. With explicit dependencies
// ⚠️ IMPORTANT: If UserService constructor requires ILogger, you MUST provide [ILoggerToken]
services.addSingleton<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);

// 4. Factory pattern - complex initialization
services.addSingleton<IHttpClient>(IHttpClientToken, async (provider) => {
  const config = await provider.getRequiredService<IConfig>(IConfigToken);
  return new HttpClient(config.apiUrl, config.timeout);
});

// 5. Multiple dependencies
services.addSingleton<IOrderService>(IOrderServiceToken, OrderService, [
  ILoggerToken,
  IUserServiceToken,
  IPaymentServiceToken,
]);

// 6. Token only (for later factory registration)
services.addSingleton<IConfig>(IConfigToken);
```

#### `addScoped<T>(token, implementation?, dependencies?)`

Register a service as scoped. A new instance is created for each scope.

**Overloads:**

```typescript
addScoped<T>(token: Token<T>): this;
addScoped<T>(token: Token<T>, dependencies: Token[]): this;
addScoped<T>(token: Token<T>, implementation: Newable<T>): this;
addScoped<T>(token: Token<T>, implementation: Newable<T>, dependencies: Token[]): this;
addScoped<T>(token: Token<T>, factory: ServiceFactory<T>): this;
```

**Examples:**

```typescript
// 1. Basic scoped service
services.addScoped<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);

// 2. Scoped service with factory
services.addScoped<IDatabase>(IDatabaseToken, async (provider) => {
  const config = await provider.getRequiredService<IConfig>(IConfigToken);
  const db = new Database(config.connectionString);
  await db.connect();
  return db;
});

// 3. Scoped service with multiple dependencies
services.addScoped<IOrderService>(IOrderServiceToken, OrderService, [
  ILoggerToken,
  IUserServiceToken,
  IPaymentServiceToken,
]);

// Usage: Create scope and use
const scope = provider.createScope();
try {
  const userService = await scope.getRequiredService<IUserService>(IUserServiceToken);
  const users = userService.getUsers();
} finally {
  await scope.dispose(); // Calls onDestroy() on scoped services
}
```

#### `addTransient<T>(token, implementation?, dependencies?)`

Register a service as transient. A new instance is created every time the service is requested.

**Overloads:**

```typescript
addTransient<T>(token: Token<T>): this;
addTransient<T>(token: Token<T>, dependencies: Token[]): this;
addTransient<T>(token: Token<T>, implementation: Newable<T>): this;
addTransient<T>(token: Token<T>, implementation: Newable<T>, dependencies: Token[]): this;
addTransient<T>(token: Token<T>, factory: ServiceFactory<T>): this;
```

**Examples:**

```typescript
// 1. Basic transient service
services.addTransient<IValidator>(IValidatorToken, Validator);

// 2. Transient service with dependencies
services.addTransient<IEmailService>(IEmailServiceToken, EmailService, [ILoggerToken, IConfigToken]);

// 3. Transient service with factory
services.addTransient<IRequestHandler>(IRequestHandlerToken, async (provider) => {
  const logger = await provider.getRequiredService<ILogger>(ILoggerToken);
  return new RequestHandler(logger);
});

// Usage: Each call creates a new instance
const validator1 = await provider.getRequiredService<IValidator>(IValidatorToken);
const validator2 = await provider.getRequiredService<IValidator>(IValidatorToken);
console.log(validator1 === validator2); // false - different instances
```

#### `addValue<T>(token, value)`

Register a pre-created value (JSON objects, primitives, instances, etc.). Values are always registered as singletons.

```typescript
addValue<T>(token: Token<T>, value: T): this;
```

**Examples:**

```typescript
// 1. Configuration object
services.addValue<IConfig>(IConfigToken, {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  features: { enableCache: true },
});

// 2. String values
services.addValue<string>(ApiKeyToken, 'secret-api-key-12345');
services.addValue<string>(DatabaseUrlToken, 'postgresql://localhost:5432/mydb');

// 3. Primitive values
services.addValue<number>(MaxRetriesToken, 3);
services.addValue<boolean>(IsProductionToken, false);

// 4. Arrays
services.addValue<string[]>(AllowedOriginsToken, ['http://localhost:3000', 'https://example.com']);

// 5. Pre-created instances
const loggerInstance = new Logger();
loggerInstance.configure({ level: 'info' });
services.addValue<Logger>(LoggerToken, loggerInstance);

// 6. Environment-based values
services.addValue<IAppSettings>(AppSettingsToken, {
  environment: process.env.NODE_ENV || 'development',
  version: process.env.APP_VERSION || '1.0.0',
  debug: process.env.DEBUG === 'true',
});
```

### TryAdd Methods (Safe Registration)

#### `tryAddSingleton<T>(token, implementation?, dependencies?)`

Register a service as singleton only if it doesn't already exist. Useful for library defaults.

**Overloads:**

```typescript
tryAddSingleton<T>(token: Token<T>): this;
tryAddSingleton<T>(token: Token<T>, dependencies: Token[]): this;
tryAddSingleton<T>(token: Token<T>, implementation: Newable<T>): this;
tryAddSingleton<T>(token: Token<T>, implementation: Newable<T>, dependencies: Token[]): this;
tryAddSingleton<T>(token: Token<T>, factory: ServiceFactory<T>): this;
```

**Examples:**

```typescript
// 1. Library default registration
services.tryAddSingleton<ILogger>(ILoggerToken, DefaultLogger);

// 2. User override (preserved - tryAdd won't override)
services.addSingleton<ILogger>(ILoggerToken, CustomLogger);
// CustomLogger is used, DefaultLogger is ignored

// 3. Conditional registration
if (!(await provider.isService<ICache>(ICacheToken))) {
  services.tryAddSingleton<ICache>(ICacheToken, DefaultCache);
}

// 4. Library registration pattern
function registerLibraryDefaults(services: ServiceCollection) {
  services.tryAddSingleton<ILogger>(ILoggerToken, DefaultLogger);
  services.tryAddSingleton<ICache>(ICacheToken, DefaultCache);
}

// User registers first
services.addSingleton<ILogger>(ILoggerToken, CustomLogger);

// Library registers defaults (won't override user's choice)
registerLibraryDefaults(services);
```

#### `tryAddScoped<T>(token, implementation?, dependencies?)`

Register a service as scoped only if it doesn't already exist.

**Overloads:**

```typescript
tryAddScoped<T>(token: Token<T>): this;
tryAddScoped<T>(token: Token<T>, dependencies: Token[]): this;
tryAddScoped<T>(token: Token<T>, implementation: Newable<T>): this;
tryAddScoped<T>(token: Token<T>, implementation: Newable<T>, dependencies: Token[]): this;
tryAddScoped<T>(token: Token<T>, factory: ServiceFactory<T>): this;
```

**Examples:**

```typescript
// 1. Library default scoped service
services.tryAddScoped<IUserService>(IUserServiceToken, DefaultUserService, [ILoggerToken]);

// 2. User override (preserved)
services.addScoped<IUserService>(IUserServiceToken, CustomUserService, [ILoggerToken]);
// CustomUserService is used

// 3. Conditional scoped registration
if (!(await provider.isService<IDatabase>(IDatabaseToken))) {
  services.tryAddScoped<IDatabase>(IDatabaseToken, DefaultDatabase);
}
```

#### `tryAddTransient<T>(token, implementation?, dependencies?)`

Register a service as transient only if it doesn't already exist.

**Overloads:**

```typescript
tryAddTransient<T>(token: Token<T>): this;
tryAddTransient<T>(token: Token<T>, dependencies: Token[]): this;
tryAddTransient<T>(token: Token<T>, implementation: Newable<T>): this;
tryAddTransient<T>(token: Token<T>, implementation: Newable<T>, dependencies: Token[]): this;
tryAddTransient<T>(token: Token<T>, factory: ServiceFactory<T>): this;
```

**Examples:**

```typescript
// 1. Library default transient service
services.tryAddTransient<IValidator>(IValidatorToken, DefaultValidator);

// 2. User override (preserved)
services.addTransient<IValidator>(IValidatorToken, CustomValidator);
// CustomValidator is used

// 3. Conditional transient registration
if (!(await provider.isService<IRequestHandler>(IRequestHandlerToken))) {
  services.tryAddTransient<IRequestHandler>(IRequestHandlerToken, DefaultRequestHandler);
}
```

### Keyed Services

#### `addKeyedSingleton<T>(token, implementation, key)`

Register a singleton service with a key.

```typescript
addKeyedSingleton<T>(
  token: Token<T>,
  implementation: Newable<T>,
  key: string | symbol
): this;
addKeyedSingleton<T>(
  token: Token<T>,
  factory: ServiceFactory<T>,
  key: string | symbol
): this;
```

**Examples:**

```typescript
// 1. String keys
services.addKeyedSingleton<ICache>(ICacheToken, BigCache, 'big');
services.addKeyedSingleton<ICache>(ICacheToken, SmallCache, 'small');

// 2. Symbol keys
const memoryKey = Symbol('memory');
const diskKey = Symbol('disk');
services.addKeyedSingleton<IStorage>(IStorageToken, MemoryStorage, memoryKey);
services.addKeyedSingleton<IStorage>(IStorageToken, DiskStorage, diskKey);

// 3. Keyed service with factory
services.addKeyedSingleton<ICache>(
  ICacheToken,
  async (provider) => {
    const config = await provider.getRequiredService<IConfig>(IConfigToken);
    return new DistributedCache(config.cacheUrl);
  },
  'distributed',
);

// 4. Retrieve by key
const bigCache = await provider.getKeyedService<ICache>(ICacheToken, 'big');
const memoryStorage = await provider.getKeyedService<IStorage>(IStorageToken, memoryKey);
```

#### `addKeyedScoped<T>(token, implementation, key)`

Register a scoped service with a key.

```typescript
addKeyedScoped<T>(
  token: Token<T>,
  implementation: Newable<T>,
  key: string | symbol
): this;
addKeyedScoped<T>(
  token: Token<T>,
  factory: ServiceFactory<T>,
  key: string | symbol
): this;
```

**Examples:**

```typescript
// 1. String key
services.addKeyedScoped<IUserRepository>(IUserRepositoryToken, UserRepository, 'default');

// 2. Symbol key
const readOnlyKey = Symbol('readonly');
services.addKeyedScoped<IUserRepository>(IUserRepositoryToken, ReadOnlyUserRepository, readOnlyKey);

// 3. With factory
services.addKeyedScoped<IDatabase>(
  IDatabaseToken,
  async (provider) => {
    const config = await provider.getRequiredService<IConfig>(IConfigToken);
    return new Database(config.connectionString);
  },
  'primary',
);

// Usage: Create scope and retrieve by key
const scope = provider.createScope();
const userRepo = await scope.getKeyedService<IUserRepository>(IUserRepositoryToken, 'default');
await scope.dispose();
```

#### `addKeyedTransient<T>(token, implementation, key)`

Register a transient service with a key.

```typescript
addKeyedTransient<T>(
  token: Token<T>,
  implementation: Newable<T>,
  key: string | symbol
): this;
addKeyedTransient<T>(
  token: Token<T>,
  factory: ServiceFactory<T>,
  key: string | symbol
): this;
```

**Examples:**

```typescript
// 1. String key
services.addKeyedTransient<IValidator>(IValidatorToken, EmailValidator, 'email');
services.addKeyedTransient<IValidator>(IValidatorToken, PhoneValidator, 'phone');

// 2. Symbol key
const strictKey = Symbol('strict');
services.addKeyedTransient<IValidator>(IValidatorToken, StrictValidator, strictKey);

// 3. With factory
services.addKeyedTransient<IRequestHandler>(
  IRequestHandlerToken,
  async (provider) => {
    const logger = await provider.getRequiredService<ILogger>(ILoggerToken);
    return new RequestHandler(logger);
  },
  'api',
);

// Usage: Each call creates a new instance
const validator1 = await provider.getKeyedService<IValidator>(IValidatorToken, 'email');
const validator2 = await provider.getKeyedService<IValidator>(IValidatorToken, 'email');
console.log(validator1 === validator2); // false - different instances
```

### Service Management

#### `remove<T>(token)` / `removeAll<T>(token)`

Remove a service from the collection. `removeAll` is an alias for `remove`.

```typescript
remove<T>(token: Token<T>): this;
removeAll<T>(token: Token<T>): this;
```

**Examples:**

```typescript
// 1. Remove a service
services.remove<ILogger>(ILoggerToken);

// 2. RemoveAll (alias for remove)
services.removeAll<ICache>(ICacheToken);

// 3. Remove before replacing (test scenario)
services.remove<ILogger>(ILoggerToken);
services.addSingleton<ILogger>(ILoggerToken, MockLogger);

// 4. Conditional removal
if (process.env.NODE_ENV === 'production') {
  services.remove<IDebugService>(IDebugServiceToken);
}

// 5. Cleanup pattern
services.remove<ILogger>(ILoggerToken);
services.remove<ICache>(ICacheToken);
services.remove<IConfig>(IConfigToken);
```

#### `replace<T>(token, implementation, dependencies?)`

Remove existing registrations for a token and add a new one, preserving the original lifetime if possible.

**Overloads:**

```typescript
replace<T>(token: Token<T>, implementation: Newable<T>, dependencies?: Token[]): this;
replace<T>(token: Token<T>, factory: ServiceFactory<T>): this;
```

**Examples:**

```typescript
// 1. Replace with different implementation
services.replace<ILogger>(ILoggerToken, FileLogger);

// 2. Replace with factory
services.replace<ILogger>(ILoggerToken, async (provider) => {
  const config = await provider.getRequiredService<IConfig>(IConfigToken);
  return config.logToFile ? new FileLogger() : new ConsoleLogger();
});

// 3. Replace with dependencies
services.replace<IUserService>(IUserServiceToken, CustomUserService, [ILoggerToken, IConfigToken]);

// 4. Test scenario - replace with mock
services.replace<IDatabase>(IDatabaseToken, MockDatabase);

// 5. Environment-based replacement
if (process.env.NODE_ENV === 'test') {
  services.replace<ICache>(ICacheToken, InMemoryCache);
}
```

### Building Provider

#### `buildServiceProvider(options?)`

Build a `ServiceProvider` from the collection.

```typescript
buildServiceProvider(options?: {
  validateScopes?: boolean;
  validateOnBuild?: boolean;
}): ServiceProvider;
```

**Options:**

- `validateScopes`: (Optional) Enable scope validation to catch lifetime mismatches. Default: `false`
- `validateOnBuild`: (Optional) Validate all dependencies at build time. Default: `false`

**Example:**

```typescript
// Basic build
const provider = services.buildServiceProvider();

// With validation
const provider = services.buildServiceProvider({
  validateScopes: true, // Catch scoped services injected into singletons
  validateOnBuild: true, // Validate all dependencies at build time
});
```

## Complete Example

```typescript
const services = new ServiceCollection();

// Register services
services
  .addSingleton<ILogger>(ILoggerToken, Logger) // No dependencies - defaults to []
  .addScoped<IUserService>(IUserServiceToken, UserService, [ILoggerToken])
  .addValue<IConfig>(IConfigToken, { apiUrl: 'https://api.example.com' })
  .addKeyedSingleton<ICache>(ICacheToken, BigCache, 'big')
  .addKeyedSingleton<ICache>(ICacheToken, SmallCache, 'small');

// TryAdd for library defaults
services.tryAddSingleton<ILogger>(ILoggerToken, DefaultLogger);

// Build provider with validation
const provider = services.buildServiceProvider({
  validateScopes: true,
  validateOnBuild: true,
});
```

## Method Chaining

All registration methods return `this`, allowing method chaining:

```typescript
services
  .addSingleton<ILogger>(ILoggerToken, Logger)
  .addScoped<IUserService>(IUserServiceToken, UserService, [ILoggerToken])
  .addTransient<IValidator>(IValidatorToken, Validator);
```

### Analysis Methods

#### `getDependencyTree(token: Token): DependencyTreeNode`

Get dependency tree for a specific token. Returns a tree structure showing all dependencies.

**Parameters:**

- `token`: The service token to analyze

**Returns:**

- `DependencyTreeNode` object with:
  - `token`: The service token
  - `name`: Human-readable name
  - `lifetime`: Service lifetime (SINGLETON, SCOPED, TRANSIENT, CIRCULAR, NOT_REGISTERED)
  - `dependencies`: Array of dependency nodes
  - `depth`: Depth in the tree
  - `isCircular`: Whether this node is part of a circular dependency
  - `circularPath`: Path showing the circular dependency (if applicable)

**Example:**

```typescript
const tree = services.getDependencyTree(IUserServiceToken);
console.log(tree);
```

#### `getCircularDependencies(): CircularDependency[]`

Find all circular dependencies in the service collection.

**Returns:**

- Array of `CircularDependency` objects, each containing:
  - `path`: Array of tokens forming the circular path
  - `tokens`: Array of objects with `token` and `name` properties

**Example:**

```typescript
const circularDeps = services.getCircularDependencies();
circularDeps.forEach((circular) => {
  console.log('Circular path:', circular.tokens.map((t) => t.name).join(' → '));
});
```

#### `visualizeDependencyTree(token: Token): string`

Visualize dependency tree as a formatted string.

**Parameters:**

- `token`: The service token to visualize

**Returns:**

- Formatted string representation of the dependency tree

**Example:**

```typescript
console.log(services.visualizeDependencyTree(IUserServiceToken));
// └── Symbol(IUserService) [SINGLETON]
//     ├── Symbol(IUserRepository) [SINGLETON]
//     │   └── Symbol(IDatabase) [SINGLETON]
//     └── Symbol(ILogger) [SINGLETON]
```

#### `visualizeCircularDependencies(): string`

Visualize all circular dependencies as a formatted string.

**Returns:**

- Formatted string representation of circular dependencies
- Returns "No circular dependencies found." if none exist

**Example:**

```typescript
console.log(services.visualizeCircularDependencies());
// Found 1 circular dependency/ies:
// Circular Dependency 1:
//   Symbol(ServiceA) → Symbol(ServiceB) → Symbol(ServiceA)
```

## See Also

- [ServiceProvider API](./service-provider) - Service resolution and management
- [Examples](/examples/) - Practical examples
- [Dependency Tree Example](/examples/dependency-tree) - Visualize dependency trees
- [Circular Dependency Detection Example](/examples/circular-dependency-detection) - Detect circular dependencies
