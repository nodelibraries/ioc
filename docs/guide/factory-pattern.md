# Factory Pattern

Factory pattern allows you to create services with complex initialization logic.

## Basic Factory

```typescript
const httpClientFactory = (provider: ServiceProvider) => {
  const config = provider.getRequiredService<IConfig>(IConfigToken);
  return new HttpClient(config.apiUrl, config.timeout);
};

services.addSingleton<IHttpClient>(IHttpClientToken, httpClientFactory);
```

## Async Factory

Factories can be async for asynchronous initialization:

```typescript
const databaseFactory = async (provider: ServiceProvider) => {
  const connectionString = await provider.getRequiredService<string>(ConnectionStringToken);
  const db = new Database(connectionString);
  await db.connect(); // Async initialization
  return db;
};

services.addSingleton<IDatabase>(IDatabaseToken, databaseFactory);
```

## Conditional Logic

Use factories to choose implementations based on configuration:

```typescript
const loggerFactory = async (provider: ServiceProvider) => {
  const logType = await provider.getRequiredService<string>(LogTypeToken);
  if (logType === 'file') {
    return new FileLogger();
  }
  return new ConsoleLogger();
};

services.addSingleton<ILogger>(ILoggerToken, loggerFactory);
```

## Complex Object Creation

Factories are perfect for creating objects with multiple dependencies:

```typescript
const apiClientFactory = async (provider: ServiceProvider) => {
  const config = await provider.getRequiredService<IConfig>(IConfigToken);
  const apiKey = await provider.getRequiredService<string>(ApiKeyToken);
  return new ApiClient(config.apiUrl, config.timeout, apiKey);
};

services.addSingleton<IApiClient>(IApiClientToken, apiClientFactory);
```

## Use Cases

- **Async initialization** - Database connections, HTTP clients
- **Conditional logic** - Environment-based implementations
- **Complex dependencies** - Multiple configuration values
- **Dynamic creation** - Runtime decision making

## Next Steps

- [Multiple Implementations](/guide/multiple-implementations)
- [Keyed Services](/guide/keyed-services)
