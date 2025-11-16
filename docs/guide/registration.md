# Registration

This guide covers different ways to register services in the IoC container.

## Basic Registration

### Interface with Symbol Token

```typescript
interface ILogger {
  log(message: string): void;
}

const ILoggerToken = Symbol('ILogger');
services.addSingleton<ILogger>(ILoggerToken, Logger);
```

### Class Constructor Token

```typescript
class Database {
  connect() {
    console.log('Database connected');
  }
}

// Token is the class itself
services.addSingleton(Database);
```

### String Token

```typescript
const ILoggerToken = 'ILogger';
services.addSingleton<ILogger>(ILoggerToken, Logger);
```

## Registration Methods

### addSingleton

Register a service as a singleton (one instance for the entire application):

```typescript
services.addSingleton<ILogger>(ILoggerToken, Logger);
```

### addScoped

Register a service as scoped (one instance per scope):

```typescript
services.addScoped<IUserService>(IUserServiceToken, UserService);
```

### addTransient

Register a service as transient (new instance every time):

```typescript
services.addTransient<IValidator>(IValidatorToken, Validator);
```

## With Dependencies

Specify dependencies when registering:

```typescript
services.addScoped<IUserService>(
  IUserServiceToken,
  UserService,
  [ILoggerToken, IDatabaseToken], // Dependencies array
);
```

## Factory Pattern

Register services using factory functions:

```typescript
const httpClientFactory = async (provider: ServiceProvider) => {
  const config = await provider.getRequiredService<IConfig>(IConfigToken);
  return new HttpClient(config.apiUrl, config.timeout);
};

services.addSingleton<IHttpClient>(IHttpClientToken, httpClientFactory);
```

## Value Registration

Register pre-created values (JSON objects, primitives, instances):

```typescript
// JSON object
services.addValue<IConfig>(IConfigToken, {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
});

// Primitive
services.addValue<string>(ApiKeyToken, 'secret-key-12345');

// Pre-created instance
const logger = new Logger();
services.addValue<Logger>(LoggerToken, logger);
```

## TryAdd Pattern

Register services only if they don't already exist:

```typescript
// Only registers if not already registered
services.tryAddSingleton<ILogger>(ILoggerToken, DefaultLogger);
services.tryAddSingleton<ILogger>(ILoggerToken, CustomLogger); // Ignored if already exists
```

Useful for library defaults that shouldn't override user registrations.

## Keyed Services

Register multiple implementations with keys:

```typescript
services.addKeyedSingleton<ICache>(ICacheToken, BigCache, 'big');
services.addKeyedSingleton<ICache>(ICacheToken, SmallCache, 'small');

// Retrieve by key
const bigCache = await provider.getKeyedService<ICache>(ICacheToken, 'big');
```

## Multiple Implementations

Register multiple implementations of the same interface:

```typescript
services.addSingleton<IMessageWriter>(IMessageWriterToken, ConsoleWriter);
services.addSingleton<IMessageWriter>(IMessageWriterToken, FileWriter);
services.addSingleton<IMessageWriter>(IMessageWriterToken, EmailWriter);

// Get all implementations
const allWriters = await provider.getServices<IMessageWriter>(IMessageWriterToken);

// Get last registered (default)
const writer = await provider.getService<IMessageWriter>(IMessageWriterToken);
```

## Best Practices

1. **Use Symbol tokens for interfaces** - Prevents naming conflicts
2. **Use class constructors for concrete classes** - Simpler syntax
3. **Register all services before building provider** - Provider is immutable
4. **Use TryAdd for library defaults** - Preserve user overrides
5. **Specify dependencies explicitly** - More readable and maintainable

## Next Steps

- [Dependency Injection](/guide/dependency-injection)
- [Factory Pattern](/guide/factory-pattern)
- [Multiple Implementations](/guide/multiple-implementations)
