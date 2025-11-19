<div align="left">

# @nodelibraries/ioc

### Type-Safe IoC Container for Node.js, TypeScript and JavaScript

**A lightweight, production-ready Inversion of Control (IoC) container inspired by .NET Core's dependency injection system.**

Built with TypeScript for full type safety • Zero dependencies • No decorators required

[📖 Documentation](https://nodelibraries.github.io/ioc/) • [💡 Examples](./examples) • [📚 API Reference](https://nodelibraries.github.io/ioc/api/) • [⭐ GitHub](https://github.com/nodelibraries/ioc)

[![npm version](https://img.shields.io/npm/v/@nodelibraries/ioc.svg?logo=npm)](https://www.npmjs.com/package/@nodelibraries/ioc) [![npm downloads](https://img.shields.io/npm/dm/@nodelibraries/ioc.svg?logo=npm)](https://www.npmjs.com/package/@nodelibraries/ioc) [![License](https://img.shields.io/npm/l/@nodelibraries/ioc.svg)](https://github.com/nodelibraries/ioc/blob/main/LICENSE) [![Node.js Version](https://img.shields.io/node/v/@nodelibraries/ioc.svg?logo=node.js)](https://nodejs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg?logo=typescript)](https://www.typescriptlang.org/)

</div>

---

## ✨ Features

### Core Features

- 🎯 **Fully Type-Safe** - Complete TypeScript support with type inference and compile-time safety
- 📦 **Zero Dependencies** - Lightweight, pure TypeScript implementation
- 🚫 **No Decorators** - Clean, readable code without decorator pollution
- 🔄 **Multiple Lifetimes** - Singleton, Scoped, and Transient service lifetimes
- 🏗️ **Automatic DI** - Seamless dependency resolution and injection

### Advanced Features

- 🏭 **Factory Pattern** - Support for factory functions and async initialization
- 🔢 **Multiple Implementations** - Register and retrieve multiple implementations of the same interface
- 🔑 **Keyed Services** - Key-based service lookup with `getRequiredKeyedService`
- ✅ **TryAdd Pattern** - Safe registration without overriding existing services
- 🛡️ **Scope Validation** - Detect lifetime mismatches at build time
- 🔍 **Service Checking** - Check service existence with `isService()` without resolving
- 🗑️ **Service Management** - Remove, replace, and manage services dynamically
- 🔄 **Lifecycle Hooks** - `onInit()` and `onDestroy()` callbacks for initialization and cleanup
- 💎 **Value Registration** - Register pre-created values (JSON, primitives, instances)
- 🔄 **Circular Dependencies** - Automatic resolution for all lifetimes (including Transient, unlike .NET Core)
- 📊 **Dependency Tree Visualization** - Visualize and analyze service dependency trees
- 🔍 **Circular Dependency Detection** - Detect and visualize all circular dependencies

### JavaScript Support

- 📜 **Full JavaScript Support** - All features work in JavaScript (CommonJS and ES Modules)
- 🔧 **JSDoc Support** - Comprehensive JSDoc comments for IntelliSense and autocomplete
- ⚠️ **Runtime Validation Recommended** - Use `validateOnBuild` and `validateScopes` for better error detection

---

## 🚀 Quick Start

### Installation

```bash
npm install @nodelibraries/ioc
```

### TypeScript Example

```typescript
import { ServiceCollection, ServiceProvider } from '@nodelibraries/ioc';

// Define interfaces
interface ILogger {
  log(message: string): void;
}

interface IUserService {
  getUsers(): string[];
}

// Implement services
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

// Setup container
const services = new ServiceCollection();
const ILoggerToken = Symbol('ILogger');
const IUserServiceToken = Symbol('IUserService');

// Register services
// ⚠️ IMPORTANT: If a class constructor has parameters (dependencies), you MUST provide them in the dependencies array.
services.addSingleton<ILogger>(ILoggerToken, Logger); // No dependencies - constructor has no parameters

// ⚠️ IMPORTANT: The order of dependency tokens must match the constructor parameter order.
services.addScoped<IUserService>(IUserServiceToken, UserService, [ILoggerToken]); // Has dependency - MUST provide [ILoggerToken]

// Build provider
const provider = services.buildServiceProvider();

// Use services
const scope = provider.createScope();
const userService = await scope.getRequiredService<IUserService>(IUserServiceToken);
const users = userService.getUsers();

// Cleanup
await scope.dispose();
```

### JavaScript Example (CommonJS)

```javascript
const { ServiceCollection, ServiceProvider } = require('@nodelibraries/ioc');

class Logger {
  log(message) {
    console.log(`[LOG] ${message}`);
  }
}

class UserService {
  constructor(logger) {
    this.logger = logger;
  }

  getUsers() {
    this.logger.log('Fetching users...');
    return ['Alice', 'Bob'];
  }
}

const services = new ServiceCollection();
const ILoggerToken = Symbol('ILogger');
const IUserServiceToken = Symbol('IUserService');

// ⚠️ IMPORTANT: If a class constructor has parameters (dependencies), you MUST provide them in the dependencies array
services.addSingleton(ILoggerToken, Logger);

// ⚠️ IMPORTANT: The order of dependency tokens must match the constructor parameter order.
services.addScoped(IUserServiceToken, UserService, [ILoggerToken]);

const provider = services.buildServiceProvider();

(async () => {
  const scope = provider.createScope();
  const userService = await scope.getRequiredService(IUserServiceToken);
  const users = userService.getUsers();
  await scope.dispose();
})();
```

---

## 📚 Documentation

- **[📖 Getting Started Guide](https://nodelibraries.github.io/ioc/guide/)** - Learn the basics
- **[📚 API Reference](https://nodelibraries.github.io/ioc/api/)** - Complete API documentation
- **[💡 Examples](./examples)** - 19+ practical examples with code
- **[🔍 JavaScript Support](https://nodelibraries.github.io/ioc/guide/)** - JavaScript-specific documentation

---

## 🎯 Why @nodelibraries/ioc?

### ✨ Clean & Simple

No decorators, no annotations, no framework lock-in. Your code remains pure and framework-agnostic.

```typescript
// Clean, simple registration
services.addSingleton<ILogger>(ILoggerToken, Logger);
services.addScoped<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);
```

### 🔒 Type-Safe by Design

Built from the ground up for TypeScript. Full type inference, autocomplete, and compile-time safety.

```typescript
// Full type safety with autocomplete
const logger = await provider.getRequiredService<ILogger>(ILoggerToken);
logger.log('Hello'); // ✅ TypeScript knows this method exists
```

### 🚀 Production Ready

Battle-tested features including scope validation, lifecycle hooks, and comprehensive error handling. Enable validation in development to catch issues early:

```typescript
// Build with validation (recommended for development)
const provider = services.buildServiceProvider({
  validateScopes: true, // Catch lifetime mismatches (e.g., scoped service in singleton)
  validateOnBuild: true, // Validate all dependencies exist at build time
});
```

> **Note:** Both options default to `false`. Enable them explicitly for validation. For detailed explanations and examples, see the [documentation](https://nodelibraries.github.io/ioc/).

### 🔄 Enhanced Circular Dependency Support

Circular dependencies are automatically resolved for **all service lifetimes**, including Transient services (which .NET Core doesn't support).

```typescript
// Circular dependencies work seamlessly for Singleton, Scoped, and Transient
class ServiceA {
  constructor(private serviceB: ServiceB) {}
}

class ServiceB {
  constructor(private serviceA: ServiceA) {} // ✅ Works for all lifetimes!
}

services.addSingleton(ServiceA, ServiceA, [ServiceB]);
services.addSingleton(ServiceB, ServiceB, [ServiceA]);
// ✅ No errors - circular dependencies are automatically resolved
```

---

## 📖 Key Concepts

### Service Lifetimes

| Lifetime      | Description                             | Use Case                                    |
| ------------- | --------------------------------------- | ------------------------------------------- |
| **Singleton** | One instance for the entire application | Loggers, Configuration, Caches              |
| **Scoped**    | One instance per scope                  | Request-scoped services, Unit of Work       |
| **Transient** | New instance every time                 | Validators, Calculators, Stateless services |

### Registration Methods

```typescript
// 1. Class registration (no dependencies - constructor has no parameters)
services.addSingleton(Logger);

// 2. Interface registration with dependencies
// ⚠️ IMPORTANT: If UserService constructor requires ILogger, you MUST provide [ILoggerToken]
services.addScoped<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);

// 3. Factory pattern (supports async initialization)
services.addSingleton<IHttpClient>(IHttpClientToken, async (provider) => {
  const config = await provider.getRequiredService<IConfig>(IConfigToken);
  return new HttpClient(config.apiUrl);
});

// 4. Value registration (pre-created instances)
services.addValue<IConfig>(IConfigToken, { apiUrl: 'https://api.example.com' });

// 5. Keyed services (multiple implementations with keys)
services.addKeyedSingleton<ICache>(ICacheToken, BigCache, 'big');
services.addKeyedSingleton<ICache>(ICacheToken, SmallCache, 'small');

// 6. TryAdd pattern (safe registration - won't override existing)
services.tryAddSingleton<ILogger>(ILoggerToken, Logger); // Only registers if not already registered

// 7. Service management
services.remove(ILoggerToken); // Remove service
services.replace(ILoggerToken, NewLogger); // Replace with new implementation
```

### Service Resolution

```typescript
// 1. Optional resolution (returns undefined if not found)
const logger = await provider.getService<ILogger>(ILoggerToken);
if (logger) {
  logger.log('Service found');
}

// 2. Required resolution (throws if not found)
const userService = await provider.getRequiredService<IUserService>(IUserServiceToken);

// 3. Get all implementations (for multiple registrations)
const writers = await provider.getServices<IMessageWriter>(IMessageWriterToken);
// Returns array of all registered implementations

// 4. Keyed service resolution
const cache = await provider.getRequiredKeyedService<ICache>(ICacheToken, 'big');

// 5. Check if service exists (without resolving)
if (await provider.isService<ILogger>(ILoggerToken)) {
  // Service is registered
}
```

---

## 🔍 Advanced Features

### Dependency Tree Visualization

Visualize and analyze your service dependency trees:

```typescript
// Visualize dependency tree as formatted string
console.log(services.visualizeDependencyTree(IUserServiceToken));
// Output:
// └── Symbol(IUserService) [SINGLETON]
//     ├── Symbol(IUserRepository) [SINGLETON]
//     │   └── Symbol(IDatabase) [SINGLETON]
//     └── Symbol(ILogger) [SINGLETON]

// Get tree as structured object
const tree = services.getDependencyTree(IUserServiceToken);
console.log(tree.dependencies); // Array of dependency nodes
```

### Circular Dependency Detection

Detect and visualize all circular dependencies in your service collection:

```typescript
// Detect all circular dependencies
const circularDeps = services.getCircularDependencies();
if (circularDeps.length > 0) {
  console.log(services.visualizeCircularDependencies());
  // Output:
  // Found 1 circular dependency/ies:
  // Circular Dependency 1:
  //   Symbol(ServiceA) → Symbol(ServiceB) → Symbol(ServiceA)
}
```

### Lifecycle Hooks

Handle service initialization and cleanup with lifecycle hooks:

```typescript
class DatabaseConnection {
  async onInit() {
    // Called after instance creation
    await this.connect();
  }

  async onDestroy() {
    // Called when scope/provider is disposed
    await this.disconnect();
  }
}

services.addScoped(DatabaseConnection);
const scope = provider.createScope();
const db = await scope.getRequiredService(DatabaseConnection);
// onInit() is automatically called

await scope.dispose();
// onDestroy() is automatically called
```

---

## 📦 Examples

We provide **19+ comprehensive examples** covering all features:

| Category          | Examples | Topics                                                                                     |
| ----------------- | -------- | ------------------------------------------------------------------------------------------ |
| **Basic**         | 1-3      | Basic usage, interface registration, string tokens                                         |
| **Core Concepts** | 4-6      | Service lifetimes, lifecycle hooks, value registration                                     |
| **Advanced**      | 7-13     | Generic types, factory pattern, multiple implementations, keyed services, scope validation |
| **Complex**       | 14-15    | Circular dependencies, complex dependency chains                                           |
| **Real-World**    | 16-17    | Service management, Express.js integration                                                 |
| **Analysis**      | 18-19    | Dependency tree visualization, circular dependency detection                               |

**Run an example:**

```bash
npx ts-node examples/1-basic.ts
```

See [examples/README.md](./examples/README.md) for detailed descriptions and running instructions.

---

## 🔄 Comparison with .NET Core DI

This container is inspired by .NET Core's dependency injection system but designed for TypeScript/Node.js.

| Feature                       | .NET Core DI | @nodelibraries/ioc         |
| ----------------------------- | ------------ | -------------------------- |
| Singleton Lifetime            | ✅           | ✅                         |
| Scoped Lifetime               | ✅           | ✅                         |
| Transient Lifetime            | ✅           | ✅                         |
| Factory Pattern               | ✅           | ✅                         |
| Multiple Implementations      | ✅           | ✅                         |
| Keyed Services                | ✅           | ✅                         |
| TryAdd Pattern                | ✅           | ✅                         |
| Scope Validation              | ✅           | ✅                         |
| Circular Dependencies         | ⚠️ May fail  | ✅ Works for all lifetimes |
| Dependency Tree Visualization | ❌           | ✅                         |
| Circular Dependency Detection | ❌           | ✅                         |

---

## 🛠️ Requirements

- **Node.js** >= 18.0.0 (LTS recommended)
- **TypeScript** >= 5.0.0 (optional, but recommended)

---

## 📝 License

ISC License - see [LICENSE](./LICENSE) file for details.

---

## 👤 Author

**ylcnfrht**

- GitHub: [@ylcnfrht](https://github.com/ylcnfrht)
- ☕ [Buy me a coffee](https://buymeacoffee.com/ylcnfrht) - If you find this project helpful, consider supporting it!

---

## 📞 Support

- 📖 [Documentation](https://nodelibraries.github.io/ioc/)
- 💬 [GitHub Issues](https://github.com/nodelibraries/ioc/issues)
- 📧 [GitHub Discussions](https://github.com/nodelibraries/ioc/discussions)
- ☕ [Buy me a coffee](https://buymeacoffee.com/ylcnfrht) - If you find this project helpful, consider supporting it!

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<div align="center">

**Made with ❤️ for the TypeScript/Node.js community**

[⭐ Star us on GitHub](https://github.com/nodelibraries/ioc) • [📦 npm](https://www.npmjs.com/package/@nodelibraries/ioc) • [📚 Documentation](https://nodelibraries.github.io/ioc/)

</div>
