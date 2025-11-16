# API Reference

Complete API reference for `@nodelibraries/ioc`.

## Core Classes

### [ServiceCollection](./service-collection)

Used to register services before building a `ServiceProvider`.

**Key Methods:**

- `addSingleton<T>()` - Register singleton service
- `addScoped<T>()` - Register scoped service
- `addTransient<T>()` - Register transient service
- `addValue<T>()` - Register pre-created value
- `tryAddSingleton<T>()` - Safe singleton registration
- `tryAddScoped<T>()` - Safe scoped registration
- `tryAddTransient<T>()` - Safe transient registration
- `addKeyedSingleton<T>()` - Register keyed singleton
- `addKeyedScoped<T>()` - Register keyed scoped
- `addKeyedTransient<T>()` - Register keyed transient
- `remove<T>()` / `removeAll<T>()` - Remove service
- `replace<T>()` - Replace service registration
- `buildServiceProvider()` - Build service provider

### [ServiceProvider](./service-provider)

Used to resolve and manage service instances.

**Key Methods:**

- `getService<T>()` - Get service (returns undefined if not found)
- `getRequiredService<T>()` - Get service (throws if not found)
- `getServices<T>()` - Get all implementations
- `getKeyedService<T>()` - Get keyed service
- `getRequiredKeyedService<T>()` - Get required keyed service
- `isService<T>()` - Check if service is registered
- `createScope()` - Create new scope
- `dispose()` - Dispose provider and call onDestroy hooks

### [Types](./types)

Type definitions and enums.

**Key Types:**

- `ServiceLifetime` - Enum: Singleton, Scoped, Transient
- `Token<T>` - Service token type (`string | symbol | Newable<T>`)
- `Newable<T>` - Class constructor type
- `ServiceFactory<T>` - Factory function type
- `ServiceDescriptor<T>` - Service descriptor interface

## Features Overview

### Service Lifetimes

- **Singleton**: One instance shared across entire application
- **Scoped**: One instance per scope
- **Transient**: New instance every time

### Registration Methods

- **Class Registration**: Direct class constructor registration
- **Interface Registration**: Token-based registration with Symbol/string
- **Factory Pattern**: Factory functions for complex initialization
- **Value Registration**: Pre-created values (JSON, primitives, instances)
- **Keyed Services**: Multiple implementations with keys
- **TryAdd Pattern**: Safe registration without overriding

### Service Resolution

- **Optional Resolution**: `getService()` returns undefined if not found
- **Required Resolution**: `getRequiredService()` throws if not found
- **Multiple Implementations**: `getServices()` returns all implementations
- **Keyed Resolution**: `getKeyedService()` / `getRequiredKeyedService()`
- **Service Checking**: `isService()` checks existence without resolving

### Advanced Features

- **Scope Management**: Create scopes for scoped services
- **Lifecycle Hooks**: `onInit()` and `onDestroy()` support
- **Circular Dependencies**: Automatic resolution for all lifetimes
- **Scope Validation**: Detect lifetime mismatches at build time
- **Dependency Validation**: Validate all dependencies at build time
- **Service Management**: Remove and replace services dynamically

## Quick Reference

### Registration

```typescript
const services = new ServiceCollection();

// Singleton
services.addSingleton<ILogger>(ILoggerToken, Logger);

// Scoped
services.addScoped<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);

// Transient
services.addTransient<IValidator>(IValidatorToken, Validator);

// Value
services.addValue<IConfig>(IConfigToken, { apiUrl: 'https://api.example.com' });

// Keyed
services.addKeyedSingleton<ICache>(ICacheToken, BigCache, 'big');

// TryAdd
services.tryAddSingleton<ILogger>(ILoggerToken, DefaultLogger);
```

### Resolution

```typescript
const provider = services.buildServiceProvider();

// Get service
const logger = await provider.getService<ILogger>(ILoggerToken);

// Get required service
const userService = await provider.getRequiredService<IUserService>(IUserServiceToken);

// Get all implementations
const writers = await provider.getServices<IMessageWriter>(IMessageWriterToken);

// Get keyed service
const cache = await provider.getKeyedService<ICache>(ICacheToken, 'big');

// Check if service exists
if (await provider.isService<ILogger>(ILoggerToken)) {
  // Service is registered
}

// Create scope
const scope = provider.createScope();
try {
  const scopedService = await scope.getRequiredService<IScopedService>(IScopedServiceToken);
} finally {
  await scope.dispose();
}
```

## See Also

- [Examples](/examples/) - Practical examples
- [Guide](/guide/) - Detailed guides and tutorials
- [ServiceCollection API](./service-collection) - Complete ServiceCollection reference
- [ServiceProvider API](./service-provider) - Complete ServiceProvider reference
- [Types](./types) - Type definitions
