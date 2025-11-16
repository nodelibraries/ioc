# ServiceProvider

The `ServiceProvider` is used to resolve and manage service instances. It's created by calling `buildServiceProvider()` on a `ServiceCollection`.

## Methods

### Service Resolution

#### `getService<T>(token)`

Get a service instance. Returns `undefined` if the service is not registered.

```typescript
getService<T>(token: Token<T>): Promise<T | undefined>;
```

**Examples:**

```typescript
// 1. Optional service resolution
const logger = await provider.getService<ILogger>(ILoggerToken);
if (logger) {
  logger.log('Service found');
} else {
  console.log('Service not registered');
}

// 2. Conditional usage
const cache = await provider.getService<ICache>(ICacheToken);
if (cache) {
  const value = cache.get('key');
} else {
  // Fallback behavior
  console.log('Cache not available, using fallback');
}

// 3. Multiple optional services
const logger = await provider.getService<ILogger>(ILoggerToken);
const cache = await provider.getService<ICache>(ICacheToken);
const config = await provider.getService<IConfig>(IConfigToken);

if (logger && cache && config) {
  // All services available
} else {
  // Some services missing
}
```

#### `getRequiredService<T>(token)`

Get a service instance. Throws an error if the service is not registered.

```typescript
getRequiredService<T>(token: Token<T>): Promise<T>;
```

**Examples:**

```typescript
// 1. Required service (throws if not found)
const logger = await provider.getRequiredService<ILogger>(ILoggerToken);
logger.log('Service found');

// 2. With error handling
try {
  const userService = await provider.getRequiredService<IUserService>(IUserServiceToken);
  const users = userService.getUsers();
} catch (error) {
  console.error('Service not registered:', error);
}

// 3. Multiple required services
const logger = await provider.getRequiredService<ILogger>(ILoggerToken);
const config = await provider.getRequiredService<IConfig>(IConfigToken);
const db = await provider.getRequiredService<IDatabase>(IDatabaseToken);

// 4. In async function
async function processOrder() {
  const orderService = await provider.getRequiredService<IOrderService>(IOrderServiceToken);
  const paymentService = await provider.getRequiredService<IPaymentService>(IPaymentServiceToken);
  // Use services...
}
```

#### `getServices<T>(token)`

Get all implementations of a service registered with the same token.

```typescript
getServices<T>(token: Token<T>): Promise<T[]>;
```

**Examples:**

```typescript
// 1. Get all implementations
services.addSingleton<IMessageWriter>(IMessageWriterToken, ConsoleWriter);
services.addSingleton<IMessageWriter>(IMessageWriterToken, FileWriter);
services.addSingleton<IMessageWriter>(IMessageWriterToken, EmailWriter);

const writers = await provider.getServices<IMessageWriter>(IMessageWriterToken);
writers.forEach((writer) => writer.write('Message'));

// 2. Use in service (via factory)
const notificationFactory = async (provider: ServiceProvider) => {
  const writers = await provider.getServices<IMessageWriter>(IMessageWriterToken);
  return new NotificationService(writers);
};

// 3. Filter implementations
const writers = await provider.getServices<IMessageWriter>(IMessageWriterToken);
const asyncWriters = writers.filter((w) => w instanceof AsyncWriter);

// 4. Check if any implementations exist
const writers = await provider.getServices<IMessageWriter>(IMessageWriterToken);
if (writers.length > 0) {
  console.log(`Found ${writers.length} message writers`);
}
```

### Keyed Services

#### `getKeyedService<T>(token, key)`

Get a keyed service instance. Returns `undefined` if not found.

```typescript
getKeyedService<T>(token: Token<T>, key: string | symbol): Promise<T | undefined>;
```

**Examples:**

```typescript
// 1. Retrieve by string key
services.addKeyedSingleton<ICache>(ICacheToken, BigCache, 'big');
services.addKeyedSingleton<ICache>(ICacheToken, SmallCache, 'small');

const bigCache = await provider.getKeyedService<ICache>(ICacheToken, 'big');
if (bigCache) {
  bigCache.set('key', 'value');
}

// 2. Retrieve by symbol key
const memoryKey = Symbol('memory');
services.addKeyedSingleton<IStorage>(IStorageToken, MemoryStorage, memoryKey);

const memoryStorage = await provider.getKeyedService<IStorage>(IStorageToken, memoryKey);

// 3. Conditional usage
const cache = await provider.getKeyedService<ICache>(ICacheToken, 'big');
if (cache) {
  const value = cache.get('key');
} else {
  // Fallback to default cache
  const defaultCache = await provider.getKeyedService<ICache>(ICacheToken, 'default');
}

// 4. Multiple keyed services
const userCache = await provider.getKeyedService<ICache>(ICacheToken, 'user');
const sessionCache = await provider.getKeyedService<ICache>(ICacheToken, 'session');
```

#### `getRequiredKeyedService<T>(token, key)`

Get a keyed service instance. Throws an error if not found.

```typescript
getRequiredKeyedService<T>(token: Token<T>, key: string | symbol): Promise<T>;
```

**Examples:**

```typescript
// 1. Required keyed service (throws if not found)
const bigCache = await provider.getRequiredKeyedService<ICache>(ICacheToken, 'big');
bigCache.set('key', 'value');

// 2. With error handling
try {
  const cache = await provider.getRequiredKeyedService<ICache>(ICacheToken, 'big');
  cache.set('key', 'value');
} catch (error) {
  console.error('Cache not found:', error);
}

// 3. Multiple required keyed services
const userCache = await provider.getRequiredKeyedService<ICache>(ICacheToken, 'user');
const sessionCache = await provider.getRequiredKeyedService<ICache>(ICacheToken, 'session');

// 4. Symbol key
const memoryKey = Symbol('memory');
const storage = await provider.getRequiredKeyedService<IStorage>(IStorageToken, memoryKey);
```

### Service Checking

#### `isService<T>(token)`

Check if a service is registered without resolving it.

```typescript
isService<T>(token: Token<T>): Promise<boolean>;
```

**Examples:**

```typescript
// 1. Check before using
if (await provider.isService<ILogger>(ILoggerToken)) {
  const logger = await provider.getRequiredService<ILogger>(ILoggerToken);
  logger.log('Logger is available');
}

// 2. Conditional registration
if (!(await provider.isService<ICache>(ICacheToken))) {
  services.addSingleton<ICache>(ICacheToken, DefaultCache);
}

// 3. Feature flags
const hasAdvancedFeatures = await provider.isService<IAdvancedService>(IAdvancedServiceToken);
if (hasAdvancedFeatures) {
  const advancedService = await provider.getRequiredService<IAdvancedService>(IAdvancedServiceToken);
  advancedService.enable();
}

// 4. Multiple checks
const hasLogger = await provider.isService<ILogger>(ILoggerToken);
const hasCache = await provider.isService<ICache>(ICacheToken);
const hasConfig = await provider.isService<IConfig>(IConfigToken);

if (hasLogger && hasCache && hasConfig) {
  // All required services available
}
```

### Scope Management

#### `createScope()`

Create a new scope for scoped services. Each scope has its own instances of scoped services.

```typescript
createScope(): ServiceProvider;
```

**Examples:**

```typescript
// 1. Basic scope usage
const scope = provider.createScope();
try {
  const userService = await scope.getRequiredService<IUserService>(IUserServiceToken);
  const users = userService.getUsers();
} finally {
  await scope.dispose(); // Always dispose
}

// 2. Multiple scoped services in same scope
const scope = provider.createScope();
try {
  const userService = await scope.getRequiredService<IUserService>(IUserServiceToken);
  const orderService = await scope.getRequiredService<IOrderService>(IOrderServiceToken);
  // Both share the same scope - same instances if requested multiple times
} finally {
  await scope.dispose();
}

// 3. Nested scopes (not recommended - use separate scopes)
const scope1 = provider.createScope();
const scope2 = provider.createScope();
try {
  const service1 = await scope1.getRequiredService<IService>(IServiceToken);
  const service2 = await scope2.getRequiredService<IService>(IServiceToken);
  // service1 !== service2 (different scopes)
} finally {
  await scope1.dispose();
  await scope2.dispose();
}

// 4. Express.js request scope pattern
app.use(async (req, res, next) => {
  const scope = provider.createScope();
  (req as any).scope = scope;
  res.on('finish', async () => {
    await scope.dispose();
  });
  next();
});
```

**Important:**

- Scoped services are shared within the same scope
- Different scopes have different instances of scoped services
- Always dispose scopes when done to clean up resources

### Lifecycle Management

#### `dispose()`

Dispose of the provider and call `onDestroy()` hooks on all services that implement it.

```typescript
dispose(): Promise<void>;
```

**Example:**

```typescript
class DatabaseConnection {
  async onDestroy() {
    await this.connection.close();
    console.log('Database connection closed');
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

**Note:**

- Only scoped services' `onDestroy()` hooks are called when a scope is disposed
- Singleton services' `onDestroy()` hooks are not called automatically
- Always dispose scopes in a `try/finally` block to ensure cleanup

## Complete Example

```typescript
// Build provider
const provider = services.buildServiceProvider();

// Check if service exists
if (await provider.isService<ILogger>(ILoggerToken)) {
  // Get service (optional)
  const logger = await provider.getService<ILogger>(ILoggerToken);

  // Get required service (throws if not found)
  const requiredLogger = await provider.getRequiredService<ILogger>(ILoggerToken);
}

// Get all implementations
const writers = await provider.getServices<IMessageWriter>(IMessageWriterToken);

// Get keyed service
const cache = await provider.getKeyedService<ICache>(ICacheToken, 'big');
const requiredCache = await provider.getRequiredKeyedService<ICache>(ICacheToken, 'big');

// Create and use scope
const scope = provider.createScope();
try {
  const userService = await scope.getRequiredService<IUserService>(IUserServiceToken);
  const users = userService.getUsers();
} finally {
  await scope.dispose(); // Cleanup
}
```

## Service Resolution Flow

1. **Singleton**: Same instance shared across all scopes
2. **Scoped**: One instance per scope
3. **Transient**: New instance every time

## Error Handling

- `getRequiredService()` and `getRequiredKeyedService()` throw errors if service is not found
- `getService()` and `getKeyedService()` return `undefined` if service is not found
- Always use `try/catch` or check for `undefined` when using required methods

## Best Practices

1. **Use `getRequiredService()`** when the service is essential
2. **Use `getService()`** for optional services
3. **Always dispose scopes** in `try/finally` blocks
4. **Use `isService()`** to check service existence without resolving
5. **Use `getServices()`** to get all implementations of an interface
