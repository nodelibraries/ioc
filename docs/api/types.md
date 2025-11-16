# Types

Type definitions for the IoC container.

## Token

A token used to identify services. Can be a string, symbol, or class constructor.

```typescript
type Token<T = any> = string | symbol | Newable<T>;
```

**Examples:**

```typescript
// Symbol token
const ILoggerToken = Symbol('ILogger');

// String token
const ILoggerToken = 'ILogger';

// Class constructor token
class Logger {}
// Logger is the token
```

## Newable

A class constructor type.

```typescript
type Newable<T = any> = { new (...args: any[]): T };
```

## ServiceFactory

A factory function that creates a service instance.

```typescript
type ServiceFactory<T = any> = (provider: ServiceProvider) => T | Promise<T>;
```

**Example:**

```typescript
const factory: ServiceFactory<IHttpClient> = async (provider) => {
  const config = await provider.getRequiredService<IConfig>(IConfigToken);
  return new HttpClient(config);
};
```

## ServiceLifetime

Enumeration of service lifetimes.

```typescript
enum ServiceLifetime {
  Singleton = 'SINGLETON',
  Scoped = 'SCOPED',
  Transient = 'TRANSIENT',
}
```

## ServiceDescriptor

Describes a service registration.

```typescript
interface ServiceDescriptor<T = any> {
  token: Token<T>;
  lifetime: ServiceLifetime;
  implementation?: Newable<T>;
  factory?: ServiceFactory<T>;
  value?: T;
  dependencies?: Token[];
  key?: string | symbol;
}
```

## ServiceCollection

Collection of service registrations.

```typescript
class ServiceCollection {
  addSingleton<T>(...): this;
  addScoped<T>(...): this;
  addTransient<T>(...): this;
  addValue<T>(token: Token<T>, value: T): this;
  tryAddSingleton<T>(...): this;
  tryAddScoped<T>(...): this;
  tryAddTransient<T>(...): this;
  addKeyedSingleton<T>(...): this;
  addKeyedScoped<T>(...): this;
  addKeyedTransient<T>(...): this;
  buildServiceProvider(options?: { validateScopes?: boolean }): ServiceProvider;
}
```

## ServiceProvider

Provides service instances.

```typescript
class ServiceProvider {
  getService<T>(token: Token<T>): Promise<T | undefined>;
  getRequiredService<T>(token: Token<T>): Promise<T>;
  getServices<T>(token: Token<T>): Promise<T[]>;
  getKeyedService<T>(token: Token<T>, key: string | symbol): Promise<T | undefined>;
  createScope(): ServiceProvider;
  dispose(): Promise<void>;
}
```
