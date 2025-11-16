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
// Build with validation (recommended for development)
const provider = services.buildServiceProvider({
  validateScopes: true, // Catch lifetime mismatches (e.g., scoped service in singleton)
  validateOnBuild: true, // Validate all dependencies exist at build time
});
```

> **Note:** Both options default to `false`. Enable them explicitly for validation. For detailed explanations, examples, and .NET Core comparison, see the [Scope Validation Guide](/guide/scope-validation).

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
