# .NET Dependency Injection vs @nodelibs/ioc Comparison

This document compares our `@nodelibs/ioc` implementation with .NET's built-in dependency injection system.

## ✅ Features We Have

### Core Features

- ✅ **Singleton, Scoped, Transient lifetimes** - Full support
- ✅ **Interface and Class registration** - Both concrete and abstract
- ✅ **Type-safe generics** - Full TypeScript support
- ✅ **Dependency injection** - Automatic resolution
- ✅ **Scope management** - Create and dispose scopes
- ✅ **Value registration** - Register pre-created instances/values
- ✅ **Lifecycle hooks** - `onInit()` and `onDestroy()` callbacks
- ✅ **No decorators** - Clean code without annotations
- ✅ **Multiple token types** - Symbol, string, or class constructor
- ✅ **Circular dependency support** - Automatic resolution for all lifetimes (like .NET Core)

### Advanced Features

- ✅ **TryAdd Pattern** - `tryAddSingleton`, `tryAddScoped`, `tryAddTransient` - Safe registration without overriding
- ✅ **Multiple Implementations** - `getServices<T>()` - Get all implementations of same interface
- ✅ **Keyed Services** - `addKeyedSingleton/Scoped/Transient` - Key-based service lookup
- ✅ **GetRequiredKeyedService** - Required version of keyed service resolution
- ✅ **Factory Pattern** - `ServiceFactory<T>` - Factory functions for complex initialization
- ✅ **Scope Validation** - `validateScopes` and `validateOnBuild` options
- ✅ **Service Checking** - `isService<T>()` - Check service existence without resolving
- ✅ **Service Management** - `remove()`, `removeAll()`, `replace()` - Dynamic service management

## ❌ Missing Features (Compared to .NET)

### 1. Open Generics Support

**.NET:**

```csharp
services.AddSingleton(typeof(ILogger<>), typeof(Logger<>));
// Automatically resolves ILogger<AnyType>
```

**Our Implementation:**

- ❌ No open generics support
- Must register each generic type separately
- **Impact:** More verbose for generic services
- **Note:** TypeScript generics are compile-time only, making this difficult to implement

### 2. IDisposable Automatic Handling

**.NET:**

- Automatically calls `Dispose()` on `IDisposable` services
- Handles disposal based on lifetime

**Our Implementation:**

- ⚠️ Has `onDestroy()` lifecycle hook (custom)
- No automatic `IDisposable` support
- **Impact:** Different pattern, but similar functionality

### 3. ServiceDescriptor API

**.NET:**

```csharp
var descriptor = new ServiceDescriptor(
    typeof(IMyService),
    typeof(MyService),
    ServiceLifetime.Singleton);
services.Add(descriptor);
```

**Our Implementation:**

- ❌ No low-level ServiceDescriptor API
- Only high-level registration methods
- **Impact:** Less flexibility for advanced scenarios

### 4. Extension Methods Convention

**.NET:**

```csharp
// Convention: Add{GROUP_NAME}
services.AddControllers();
services.AddDbContext<AppDbContext>();
```

**Our Implementation:**

- ❌ No extension method convention
- All registration through ServiceCollection
- **Impact:** Less modular registration patterns
- **Note:** TypeScript uses different patterns for this

### 5. Constructor Selection Logic

**.NET:**

- Automatically selects constructor with most DI-resolvable parameters
- Handles multiple constructors intelligently

**Our Implementation:**

- ⚠️ Uses first constructor or explicit dependencies
- No automatic constructor selection
- **Impact:** Less flexible constructor injection

### 7. Open Generics Support

**.NET:**

```csharp
services.AddSingleton(typeof(ILogger<>), typeof(Logger<>));
// Automatically resolves ILogger<AnyType>
```

**Our Implementation:**

- ❌ No open generics support
- Must register each generic type separately
- **Impact:** More verbose for generic services

### 8. Service Descriptor Pattern

**.NET:**

```csharp
var descriptor = new ServiceDescriptor(
    typeof(IMyService),
    typeof(MyService),
    ServiceLifetime.Singleton);
services.Add(descriptor);
```

**Our Implementation:**

- ❌ No low-level ServiceDescriptor API
- Only high-level registration methods
- **Impact:** Less flexibility for advanced scenarios

### 9. IDisposable Automatic Handling

**.NET:**

- Automatically calls `Dispose()` on `IDisposable` services
- Handles disposal based on lifetime

**Our Implementation:**

- ⚠️ Has `onDestroy()` lifecycle hook (custom)
- No automatic `IDisposable` support
- **Impact:** Different pattern, but similar functionality

### 10. Extension Methods Convention

**.NET:**

```csharp
// Convention: Add{GROUP_NAME}
services.AddControllers();
services.AddDbContext<AppDbContext>();
```

**Our Implementation:**

- ❌ No extension method convention
- All registration through ServiceCollection
- **Impact:** Less modular registration patterns

## 📊 Feature Comparison Table

| Feature                  | .NET DI | @nodelibs/ioc | Status |
| ------------------------ | ------- | ------------- | ------ |
| Basic Lifetimes          | ✅      | ✅            | ✅     |
| Interface Registration   | ✅      | ✅            | ✅     |
| Class Registration       | ✅      | ✅            | ✅     |
| Type Safety              | ✅      | ✅            | ✅     |
| TryAdd Pattern           | ✅      | ✅            | ✅     |
| Multiple Implementations | ✅      | ✅            | ✅     |
| Keyed Services           | ✅      | ✅            | ✅     |
| GetRequiredKeyedService  | ✅      | ✅            | ✅     |
| Factory Pattern          | ✅      | ✅            | ✅     |
| Scope Validation         | ✅      | ✅            | ✅     |
| ValidateOnBuild          | ✅      | ✅            | ✅     |
| Service Checking         | ✅      | ✅            | ✅     |
| Service Management       | ✅      | ✅            | ✅     |
| Constructor Selection    | ✅      | ⚠️            | ⚠️     |
| Open Generics            | ✅      | ❌            | ❌     |
| Service Descriptor       | ✅      | ❌            | ❌     |
| IDisposable Support      | ✅      | ⚠️            | ⚠️     |
| Extension Methods        | ✅      | ❌            | ❌     |
| Value Registration       | ✅      | ✅            | ✅     |
| Lifecycle Hooks          | ❌      | ✅            | ✅     |
| No Decorators            | ✅      | ✅            | ✅     |
| Circular Dependencies    | ✅      | ✅            | ✅     |

## ✅ Recently Added Features

The following features have been implemented and are now available:

1. **TryAdd Pattern** ✅

   ```typescript
   services.tryAddSingleton<ILogger>(ILoggerToken, Logger);
   // Only adds if not already registered
   ```

2. **Multiple Implementations** ✅

   ```typescript
   services.addSingleton<ILogger>(ConsoleLoggerToken, ConsoleLogger);
   services.addSingleton<ILogger>(FileLoggerToken, FileLogger);

   // Get all
   const loggers = await provider.getServices<ILogger>(ILoggerToken);
   ```

3. **Keyed Services** ✅

   ```typescript
   services.addKeyedSingleton<ICache>(ICacheToken, BigCache, 'big');
   services.addKeyedSingleton<ICache>(ICacheToken, SmallCache, 'small');

   // Get by key
   const cache = await provider.getKeyedService<ICache>(ICacheToken, 'big');
   const requiredCache = await provider.getRequiredKeyedService<ICache>(ICacheToken, 'big');
   ```

4. **Factory Pattern** ✅

   ```typescript
   services.addSingleton<IService>(token, (provider) => {
     const config = provider.getRequiredService<IConfig>(configToken);
     return new Service(config);
   });
   ```

5. **Scope Validation** ✅

   ```typescript
   const provider = services.buildServiceProvider({
     validateScopes: true,
     validateOnBuild: true,
   });
   // Throws if scoped service injected into singleton
   // Validates all dependencies at build time
   ```

6. **Service Checking** ✅

   ```typescript
   if (await provider.isService<ILogger>(ILoggerToken)) {
     const logger = await provider.getRequiredService<ILogger>(ILoggerToken);
   }
   ```

7. **Service Management** ✅

   ```typescript
   services.remove<ILogger>(ILoggerToken);
   services.removeAll<ICache>(ICacheToken);
   services.replace<ILogger>(ILoggerToken, NewLogger);
   ```

## 🎯 Remaining Missing Features

### Low Priority

1. **Open Generics** - Less common in TypeScript/JavaScript, difficult to implement
2. **Service Descriptor API** - Advanced use case, not needed for most users
3. **Constructor Selection** - Current approach works fine
4. **Extension Methods Convention** - TypeScript uses different patterns
5. **IDisposable Pattern** - `onDestroy()` hook provides similar functionality

## 💡 Unique Features in @nodelibs/ioc

1. **Lifecycle Hooks** - `onInit()` and `onDestroy()` callbacks
2. **No Decorators** - Cleaner code than many .NET DI libraries
3. **Value Registration** - Direct value registration (JSON, primitives)
4. **TypeScript-First** - Better type inference than .NET's reflection-based approach
5. **Zero Dependencies** - Pure TypeScript implementation

## 📝 Notes

- Our implementation is **lighter** and **simpler** than .NET's
- Focus on **TypeScript/JavaScript** ecosystem needs
- Some .NET features may not be relevant for Node.js
- Our lifecycle hooks provide similar functionality to IDisposable
- No decorators is a **key differentiator** and advantage
- Most critical features from .NET DI are now implemented

## 📊 Summary

**Implemented:** 13/18 core features (72%)

- All high-priority features ✅
- Most medium-priority features ✅
- Remaining features are low-priority or TypeScript-specific limitations
