---
layout: home

hero:
  name: '@nodelibs/ioc'
  text: Type-Safe IoC Container
  tagline: |
    Seamless dependency injection for Node.js, TypeScript and JavaScript
    Clean,fully type-safe with zero external libraries and no decorators required

    Inspired by .NET Core's DI system.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/
    - theme: alt
      text: View on GitHub
      link: https://github.com/nodelibs/ioc

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
    details: Automatic resolution of circular dependencies (like .NET Core)
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
---

## Quick Start

```bash
npm install @nodelibs/ioc
```

```typescript
import { ServiceCollection, ServiceProvider } from '@nodelibs/ioc';

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

services.addSingleton<ILogger>(ILoggerToken, Logger);
services.addScoped<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);

// Build provider
const provider = services.buildServiceProvider();

// Use services
const scope = provider.createScope();
const userService = await scope.getRequiredService<IUserService>(IUserServiceToken);
const users = userService.getUsers();
```

## Why @nodelibs/ioc?

**@nodelibs/ioc** - A lightweight, type-safe IoC container designed for Node.js and TypeScript, inspired by .NET Core's dependency injection system. Seamlessly inject dependencies into your application with zero dependencies and no decorators required.

> Learn more about our philosophy and design principles in the [About](/guide/about) guide.

### No Decorators - Clean Code

Unlike many IoC containers, `@nodelibs/ioc` doesn't require decorators. Write clean, readable code without decorator pollution.

### Flexible Registration - Concrete & Abstract

Register services using:

- **Concrete classes** - Direct class registration
- **Abstract interfaces** - Interface-based registration with tokens
- **Factory functions** - Complex initialization logic
- **Pre-created values** - JSON objects, primitives, instances

### Type-Safe

Full TypeScript support ensures type safety at compile-time. Get autocomplete, type checking, and IntelliSense support.

### Production Ready

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

## Installation

```bash
npm install @nodelibs/ioc
```

No additional configuration required! The library has zero dependencies and works out of the box.

## Next Steps

- Read the [Getting Started Guide](/guide/)
- Check out [Examples](/examples/)
- Browse the [API Reference](/api/service-collection)
