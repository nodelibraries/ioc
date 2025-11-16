---
layout: home

hero:
  name: '@nodelibraries/ioc'
  text: Type-Safe IoC Container
  tagline: |
    Seamless dependency injection for Node.js, TypeScript and JavaScript.
    Clean, fully type-safe with zero external libraries and no decorators required.

    Inspired by .NET Core's DI system.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/
    - theme: alt
      text: View on GitHub
      link: https://github.com/nodelibraries/ioc

features:
  - icon: 🎯
    title: Type-Safe
    details: Full TypeScript support with type inference and compile-time safety
  - icon: 🔄
    title: Multiple Lifetimes
    details: Singleton, Scoped, and Transient service lifetimes
  - icon: 🏗️
    title: Dependency Injection
    details: Automatic dependency resolution
  - icon: 📦
    title: Lightweight
    details: Zero dependencies - pure TypeScript implementation
  - icon: 🎨
    title: Flexible Registration
    details: Register both concrete classes and abstract interfaces
  - icon: 🚫
    title: No Decorators
    details: Clean code without decorator pollution
  - icon: 🏭
    title: Factory Pattern
    details: Support for factory functions and async initialization
  - icon: 🔢
    title: Multiple Implementations
    details: Register and retrieve multiple implementations of same interface
  - icon: 🔑
    title: Keyed Services
    details: Key-based service lookup with getRequiredKeyedService
  - icon: ✅
    title: TryAdd Pattern
    details: Safe registration without overriding existing services
  - icon: 🛡️
    title: Scope Validation
    details: Detect lifetime mismatches at build time with validateScopes and validateOnBuild
  - icon: 🔄
    title: Circular Dependencies
    details: Automatic resolution of circular dependencies for all lifetimes (Singleton, Scoped, Transient)
  - icon: 🔍
    title: Service Checking
    details: Check service existence with isService() without resolving
  - icon: 🗑️
    title: Service Management
    details: Remove, replace, and manage services dynamically
  - icon: 🔄
    title: Lifecycle Hooks
    details: onInit() and onDestroy() callbacks for service initialization and cleanup
  - icon: 💎
    title: Value Registration
    details: Register pre-created values (JSON, primitives, instances)
  - icon: 📜
    title: JavaScript Support
    details: Works with both TypeScript and JavaScript. All features available in JavaScript without type safety.
  - icon: 📊
    title: Dependency Tree
    details: Visualize with getDependencyTree() and visualizeDependencyTree()
  - icon: 🔍
    title: Circular Dependency Detection
    details: Detect and visualize all circular dependencies in your service collection
---

## Quick Start

```bash
npm install @nodelibraries/ioc
```

```typescript
import { ServiceCollection, ServiceProvider } from '@nodelibraries/ioc';

// Define interfaces
interface ILogger {
  log(message: string): void;
}

interface IUserService {
  getUsers(): string[];
}

// Implementations
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

// Register services
const services = new ServiceCollection();
const ILoggerToken = Symbol('ILogger');
const IUserServiceToken = Symbol('IUserService');

// ⚠️ IMPORTANT: If a class constructor has parameters (dependencies), you MUST provide them in the dependencies array
services.addSingleton<ILogger>(ILoggerToken, Logger); // No dependencies - constructor has no parameters
services.addScoped<IUserService>(IUserServiceToken, UserService, [ILoggerToken]); // Has dependency - MUST provide [ILoggerToken]

// Build provider
const provider = services.buildServiceProvider();

// Use services
const scope = provider.createScope();
const userService = await scope.getRequiredService<IUserService>(IUserServiceToken);
const users = userService.getUsers();
```

## Why @nodelibraries/ioc?

**@nodelibraries/ioc** is a production-ready, type-safe IoC container designed for Node.js and TypeScript, inspired by .NET Core's dependency injection system. Seamlessly inject dependencies into your application with zero dependencies and no decorators required.

> Learn more about our philosophy and design principles in the [About](/guide/about) guide.

### 🎯 Clean & Simple

No decorators, no annotations, no framework lock-in. Your code remains pure and framework-agnostic.

```typescript
// Clean, simple registration
// ⚠️ IMPORTANT: If a class constructor has parameters (dependencies), you MUST provide them in the dependencies array
services.addSingleton<ILogger>(ILoggerToken, Logger); // No dependencies - constructor has no parameters
services.addScoped<IUserService>(IUserServiceToken, UserService, [ILoggerToken]); // Has dependency - MUST provide [ILoggerToken]
```

### 🔒 Type-Safe by Design

Built from the ground up for TypeScript. Full type inference, autocomplete, and compile-time safety.

```typescript
// Full type safety with autocomplete
const logger = await provider.getRequiredService<ILogger>(ILoggerToken);
logger.log('Hello'); // ✅ TypeScript knows this method exists
```

### 🚀 Production Ready

Battle-tested features including scope validation, lifecycle hooks, and comprehensive error handling.

```typescript
// Build with validation
const provider = services.buildServiceProvider({
  validateScopes: true, // Catch lifetime mismatches
  validateOnBuild: true, // Validate all dependencies
});
```

#### What do these options do?

> **Note:** Both options default to `false`. Enable them explicitly for validation.

**Comparison with .NET Core:**

In .NET Core, these options work similarly:

```csharp
// .NET Core - ServiceProviderOptions
builder.Host.UseDefaultServiceProvider(options =>
{
    options.ValidateScopes = true;    // Default: false
    options.ValidateOnBuild = true;   // Default: false (available in .NET 6+)
});
```

**Default Behavior in .NET Core:**

- `ValidateScopes`: **`false`** (default) - No validation, allows problematic lifetime combinations
- `ValidateOnBuild`: **`false`** (default) - No build-time validation, errors appear at runtime

**Best Practice in .NET Core:**

- Enable `ValidateScopes` and `ValidateOnBuild` in **development** environment
- Disable them in **production** for better performance
- This is exactly the same approach you should use with this library!

```csharp
// .NET Core - Typical usage pattern
builder.Host.UseDefaultServiceProvider(options =>
{
    options.ValidateScopes = builder.Environment.IsDevelopment();
    options.ValidateOnBuild = builder.Environment.IsDevelopment();
});
```

**Our Implementation:**
Our library follows the same pattern as .NET Core - both options default to `false` and work identically. The validation logic and error messages are also similar to .NET Core's implementation.

##### `validateScopes` Option

**`validateScopes: false`** (default) - No validation, allows any lifetime combination:

```typescript
// ⚠️ WARNING: This works but can cause issues!
services.addScoped<ILogger>(ILoggerToken, Logger);
services.addSingleton<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);

const provider = services.buildServiceProvider({ validateScopes: false });
// ✅ Provider created successfully, but this is problematic!
// Scoped service injected into singleton can cause issues in production

const userService = await provider.getRequiredService<IUserService>(IUserServiceToken);
// ⚠️ Works, but the scoped logger instance will be shared across all singleton instances
// This breaks the scoped lifetime guarantee!
```

**`validateScopes: true`** - Validates lifetime mismatches at runtime:

```typescript
// ❌ ERROR: Scoped service injected into singleton
services.addScoped<ILogger>(ILoggerToken, Logger);
services.addSingleton<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);

const provider = services.buildServiceProvider({ validateScopes: true });
// ❌ Throws immediately: "Cannot inject scoped service 'ILogger' into singleton service 'IUserService'"
// This prevents the problematic configuration!

// ✅ CORRECT: Scoped service used within scope
services.addSingleton<ILogger>(ILoggerToken, Logger);
services.addScoped<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);

const provider = services.buildServiceProvider({ validateScopes: true });
const scope = provider.createScope();
const userService = await scope.getRequiredService<IUserService>(IUserServiceToken); // ✅ Works!
// Scoped service is correctly resolved from a scope, not from root provider
```

**Additional `validateScopes` examples:**

```typescript
// Example: Root provider cannot resolve scoped services when validation is enabled
services.addScoped<IUserService>(IUserServiceToken, UserService);
const provider = services.buildServiceProvider({ validateScopes: true });

// ❌ ERROR: Cannot resolve scoped service from root provider
await provider.getRequiredService<IUserService>(IUserServiceToken);
// Throws: "Cannot resolve scoped service 'IUserService' from root provider. Create a scope first."

// ✅ CORRECT: Resolve from scope
const scope = provider.createScope();
await scope.getRequiredService<IUserService>(IUserServiceToken); // ✅ Works!
```

##### `validateOnBuild` Option

**`validateOnBuild: false`** (default) - No validation at build time, errors appear at runtime:

```typescript
// ⚠️ Missing dependency - not detected until runtime!
services.addScoped<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);
// ILoggerToken is not registered!

const provider = services.buildServiceProvider({ validateOnBuild: false });
// ✅ Provider created successfully, but the error will occur later

// Later, when trying to use the service:
try {
  const scope = provider.createScope();
  await scope.getRequiredService<IUserService>(IUserServiceToken);
  // ❌ Throws: "No provider found for token: Symbol(ILogger)"
  // Error discovered at runtime, not at build time!
} catch (error) {
  console.error('Runtime error:', error);
}
```

**`validateOnBuild: true`** - Validates all dependencies at build time (catches missing dependencies early):

```typescript
// ❌ ERROR: Missing dependency detected at build time
services.addScoped<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);
// ILoggerToken is not registered!

try {
  const provider = services.buildServiceProvider({ validateOnBuild: true });
  // ❌ Throws immediately: "Validation failed on build: Missing dependency: ILogger required by IUserService"
  // Error caught at build time, before any services are used!
} catch (error) {
  console.error('Build-time validation error:', error);
  // You can fix the issue before deploying to production
}

// ✅ CORRECT: All dependencies registered
services.addSingleton<ILogger>(ILoggerToken, Logger);
services.addScoped<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);
const provider = services.buildServiceProvider({ validateOnBuild: true }); // ✅ No errors!
// All dependencies are validated and confirmed to exist
```

**Additional `validateOnBuild` examples:**

```typescript
// Example 1: Multiple missing dependencies - all are reported
services.addSingleton<IServiceA>(IServiceAToken, ServiceA, [IServiceBToken, IServiceCToken]);
// Both IServiceBToken and IServiceCToken are missing!

const provider = services.buildServiceProvider({ validateOnBuild: true });
// ❌ Throws: "Validation failed on build: Missing dependency: IServiceB required by IServiceA"
// All missing dependencies are reported in the error message

// Example 2: Deep dependency chain validation
services.addSingleton<IServiceA>(IServiceAToken, ServiceA, [IServiceBToken]);
services.addSingleton<IServiceB>(IServiceBToken, ServiceB, [IServiceCToken]);
// IServiceCToken is missing!

const provider = services.buildServiceProvider({ validateOnBuild: true });
// ❌ Throws: "Validation failed on build: Missing dependency: IServiceC required by IServiceB"
// Validates the entire dependency chain recursively, not just direct dependencies
```

##### Using Both Options Together

```typescript
// Best practice: Enable both validations in development
const provider = services.buildServiceProvider({
  validateScopes: true, // Catch lifetime mismatches
  validateOnBuild: true, // Catch missing dependencies early
});

// This ensures:
// 1. All dependencies exist (validateOnBuild)
// 2. Lifetime rules are followed (validateScopes)
// 3. Errors are caught before production deployment
```

### 🔄 Enhanced Circular Dependency Support

Circular dependencies are automatically resolved for all service lifetimes, including Transient services (which .NET Core doesn't support).

```typescript
// Circular dependencies work seamlessly
class ServiceA {
  constructor(private serviceB: ServiceB) {}
}

class ServiceB {
  constructor(private serviceA: ServiceA) {} // ✅ Works!
}
```

### 🎨 Flexible Registration

Register services using:

- **Concrete classes** - Direct class registration
- **Abstract interfaces** - Interface-based registration with tokens
- **Factory functions** - Complex initialization logic
- **Pre-created values** - JSON objects, primitives, instances

## Installation

```bash
npm install @nodelibraries/ioc
```

No additional configuration required! The library has zero dependencies and works out of the box.

## Next Steps

- Read the [Getting Started Guide](/guide/)
- Check out [Examples](/examples/)
- Browse the [API Reference](/api/service-collection)
