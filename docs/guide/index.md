# Introduction

`@nodelibraries/ioc` is a lightweight, type-safe Inversion of Control (IoC) container for Node.js and TypeScript, inspired by .NET Core's dependency injection system. It provides dependency injection capabilities similar to .NET's built-in DI container, but designed specifically for TypeScript/JavaScript.

> **@nodelibraries/ioc** - A lightweight, type-safe IoC container designed for Node.js and TypeScript. Learn more in our [About](/guide/about) page.

## Key Features

- 🎯 **Type-safe** - Full TypeScript support with type inference
- 📜 **JavaScript Support** - Works with both TypeScript and JavaScript
- 🔄 **Multiple Lifetimes** - Singleton, Scoped, and Transient service lifetimes
- 🏗️ **Dependency Injection** - Automatic dependency resolution
- 📦 **Lightweight** - Zero dependencies
- 🎨 **Flexible Registration** - Register both concrete classes and abstract interfaces
- 🚫 **No Decorators** - Clean code without decorator pollution
- 🏭 **Factory Pattern** - Support for factory functions and async initialization
- 🔢 **Multiple Implementations** - Register and retrieve multiple implementations
- 🔑 **Keyed Services** - Key-based service lookup (with getRequiredKeyedService)
- ✅ **TryAdd Pattern** - Safe registration without overriding
- 🛡️ **Scope Validation** - Detect lifetime mismatches at build time (validateScopes & validateOnBuild)
- 🔄 **Circular Dependencies** - Automatic resolution of circular dependencies for all lifetimes
- 🔍 **Service Checking** - Check service existence with isService() without resolving
- 🗑️ **Service Management** - Remove, replace, and manage services dynamically
- 🔄 **Lifecycle Hooks** - onInit() and onDestroy() callbacks for service initialization and cleanup
- 💎 **Value Registration** - Register pre-created values (JSON, primitives, instances)

## What is Dependency Injection?

Dependency Injection (DI) is a design pattern where objects receive their dependencies from an external source rather than creating them internally. This makes your code more modular, testable, and maintainable.

### Without Dependency Injection

```typescript
class UserService {
  private logger = new Logger(); // Tight coupling!

  getUsers() {
    this.logger.log('Fetching users...');
    return [];
  }
}
```

### With Dependency Injection

```typescript
class UserService {
  constructor(private logger: ILogger) {} // Loose coupling!

  getUsers() {
    this.logger.log('Fetching users...');
    return [];
  }
}
```

## Why Use an IoC Container?

An IoC container manages the creation and lifetime of your services, automatically resolving dependencies. This means:

1. **Less boilerplate** - No need to manually wire dependencies
2. **Better testability** - Easy to mock dependencies in tests
3. **Lifetime management** - Automatic handling of singleton, scoped, and transient services
4. **Type safety** - Compile-time checking of dependencies

## Comparison with .NET DI

This container is inspired by .NET's dependency injection system. It provides similar features:

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

For a detailed comparison, see the [COMPARISON.md](https://github.com/nodelibraries/ioc/blob/main/COMPARISON.md) file in the repository.

## Next Steps

- [Installation](/guide/installation)
- [Quick Start](/guide/quick-start)
- [Service Lifetimes](/guide/service-lifetimes)
