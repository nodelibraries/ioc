# Circular Dependencies

Circular dependencies occur when two or more services depend on each other, creating a cycle. This can lead to infinite loops or stack overflow errors during service resolution.

## Understanding Circular Dependencies

### Example of Circular Dependency

```typescript
class ServiceA {
  constructor(private serviceB: ServiceB) {}
}

class ServiceB {
  constructor(private serviceA: ServiceA) {} // Circular!
}
```

In this example:

- `ServiceA` depends on `ServiceB`
- `ServiceB` depends on `ServiceA`
- This creates a cycle: `ServiceA → ServiceB → ServiceA → ...`

## How .NET Core Handles Circular Dependencies

.NET Core's dependency injection container (`Microsoft.Extensions.DependencyInjection`) **does not automatically resolve circular dependencies**. In most cases, circular dependencies will cause:

- **Stack overflow exceptions** during service resolution
- **Infinite loops** when trying to resolve services
- **Application startup failures**

### .NET Core Behavior

1. **Singleton Services**: May sometimes work due to object reference creation order, but **not guaranteed** and can still fail
2. **Scoped Services**: Typically **fails** with stack overflow
3. **Transient Services**: **Always fails** with stack overflow

### Example in .NET Core

```csharp
// This will typically FAIL in .NET Core
public class ServiceA
{
    public ServiceA(ServiceB serviceB) { }
}

public class ServiceB
{
    public ServiceB(ServiceA serviceA) { } // Circular!
}

// Registration
services.AddSingleton<ServiceA>();
services.AddSingleton<ServiceB>();

// Resolution will likely throw:
// System.InvalidOperationException: A circular dependency was detected
// or StackOverflowException
```

### Key Differences

| Aspect                | .NET Core                   | @nodelibraries/ioc                |
| --------------------- | --------------------------- | --------------------------------- |
| **Detection**         | Runtime (throws exception)  | ✅ Runtime (via resolution stack) |
| **Singleton Support** | ⚠️ May fail                 | ✅ Works                          |
| **Scoped Support**    | ❌ Fails                    | ✅ Works (within scope)           |
| **Transient Support** | ❌ Fails                    | ✅ Works (within same resolution) |
| **Error Messages**    | Stack overflow or exception | ✅ Clear error messages           |

## How @nodelibraries/ioc Handles Circular Dependencies

### Current Behavior

**@nodelibraries/ioc now supports circular dependencies for all service lifetimes** (Singleton, Scoped, and Transient). The container uses a resolution stack mechanism to detect and handle circular dependencies:

- ✅ **Singleton services** - Circular dependencies are fully supported
- ✅ **Scoped services** - Circular dependencies work within the same scope
- ✅ **Transient services** - Circular dependencies work within the same resolution call (each new call creates a new instance, maintaining transient behavior)

### How It Works

The container maintains a **resolution stack** that tracks services currently being constructed:

1. When resolving a service, it's added to the resolution stack
2. If a dependency is already in the resolution stack (circular dependency detected):
   - Returns the partially constructed instance (works for all lifetimes)
   - For **Transient**: The same instance is used within the same resolution call, but each new `getRequiredService` call creates a new instance
3. Once construction is complete, the service is removed from the resolution stack

### Example: Working Circular Dependency (Singleton)

```typescript
const services = new ServiceCollection();
const ServiceAToken = Symbol('ServiceA');
const ServiceBToken = Symbol('ServiceB');

class ServiceA {
  constructor(private serviceB: ServiceB) {}

  getName(): string {
    return 'ServiceA';
  }

  getServiceBName(): string {
    return this.serviceB.getName();
  }
}

class ServiceB {
  constructor(private serviceA: ServiceA) {}

  getName(): string {
    return 'ServiceB';
  }

  getServiceAName(): string {
    return this.serviceA.getName();
  }
}

services.addSingleton(ServiceAToken, ServiceA, [ServiceBToken]);
services.addSingleton(ServiceBToken, ServiceB, [ServiceAToken]);

const provider = services.buildServiceProvider();

// ✅ This now works! Circular dependency is handled automatically
const serviceA = await provider.getRequiredService<ServiceA>(ServiceAToken);
const serviceB = await provider.getRequiredService<ServiceB>(ServiceBToken);

console.log(serviceA.getName()); // "ServiceA"
console.log(serviceB.getName()); // "ServiceB"
console.log(serviceA.getServiceBName()); // "ServiceB"
console.log(serviceB.getServiceAName()); // "ServiceA"
```

### Example: Transient Circular Dependency (Now Works!)

```typescript
// Transient services now support circular dependencies
services.addTransient(ServiceAToken, ServiceA, [ServiceBToken]);
services.addTransient(ServiceBToken, ServiceB, [ServiceAToken]);

const provider = services.buildServiceProvider();

// ✅ This now works! Circular dependency is handled within the same resolution call
const serviceA1 = await provider.getRequiredService<ServiceA>(ServiceAToken);
const serviceB1 = await provider.getRequiredService<ServiceB>(ServiceBToken);

console.log(serviceA1.getName()); // "ServiceA"
console.log(serviceB1.getName()); // "ServiceB"
console.log(serviceA1.getServiceBName()); // "ServiceB"
console.log(serviceB1.getServiceAName()); // "ServiceA"

// Each new call creates a new instance (transient behavior)
const serviceA2 = await provider.getRequiredService<ServiceA>(ServiceAToken);
console.log(serviceA1 === serviceA2); // false - different instances
```

## Solutions and Best Practices

### 1. Refactor to Break the Cycle

The best solution is to refactor your code to eliminate the circular dependency:

#### Option A: Extract Common Interface

```typescript
// Create a common interface
interface ICommonService {
  doSomething(): void;
}

class ServiceA implements ICommonService {
  constructor(private serviceB: ServiceB) {}

  doSomething() {
    this.serviceB.doSomething();
  }
}

class ServiceB implements ICommonService {
  constructor(private commonService: ICommonService) {} // No cycle!

  doSomething() {
    // Implementation
  }
}
```

#### Option B: Use Dependency Inversion

```typescript
// ServiceA depends on an interface
interface IServiceB {
  doSomething(): void;
}

class ServiceA {
  constructor(private serviceB: IServiceB) {}
}

class ServiceB implements IServiceB {
  // ServiceB doesn't need ServiceA anymore
  doSomething() {
    // Implementation
  }
}
```

#### Option C: Introduce a Mediator

```typescript
// Create a mediator service
class ServiceMediator {
  constructor(private serviceA: ServiceA, private serviceB: ServiceB) {}

  // Coordinate between services
  coordinate() {
    // Implementation
  }
}

class ServiceA {
  // No direct dependency on ServiceB
}

class ServiceB {
  // No direct dependency on ServiceA
}
```

### 2. Use Lazy Initialization

For cases where you truly need bidirectional communication, consider lazy initialization:

```typescript
class ServiceA {
  private serviceB?: ServiceB;

  setServiceB(serviceB: ServiceB) {
    this.serviceB = serviceB;
  }

  doSomething() {
    if (this.serviceB) {
      this.serviceB.doSomething();
    }
  }
}

class ServiceB {
  constructor(private serviceA: ServiceA) {}

  doSomething() {
    this.serviceA.doSomething();
  }
}

// Register and wire manually
const services = new ServiceCollection();
services.addSingleton(ServiceAToken, ServiceA);
services.addSingleton(ServiceBToken, ServiceB, [ServiceAToken]);

const provider = services.buildServiceProvider();
const serviceA = await provider.getRequiredService<ServiceA>(ServiceAToken);
const serviceB = await provider.getRequiredService<ServiceB>(ServiceBToken);

// Manually wire the circular reference
serviceA.setServiceB(serviceB);
```

### 3. Use Factory Pattern

Factories can help break circular dependencies by deferring instantiation:

```typescript
const services = new ServiceCollection();

services.addSingleton(ServiceAToken, (provider) => {
  const serviceB = provider.getRequiredService<ServiceB>(ServiceBToken);
  return new ServiceA(serviceB);
});

services.addSingleton(ServiceBToken, (provider) => {
  const serviceA = provider.getRequiredService<ServiceA>(ServiceAToken);
  return new ServiceB(serviceA);
});
```

**Note:** This approach may still cause issues depending on the resolution order.

## Detection and Prevention

### Manual Detection

Before registering services, review your dependency graph:

1. **Draw a dependency graph** - Visualize service dependencies
2. **Look for cycles** - Check if any path leads back to itself
3. **Test in isolation** - Create minimal examples to test dependencies

### Future Improvements

Future versions of `@nodelibraries/ioc` may include:

- ✅ **Resolution stack tracking** - ✅ Implemented! Circular dependencies are now supported for Singleton and Scoped services
- ✅ **Partial instance support** - ✅ Implemented! Partially constructed instances are used for circular dependencies
- 🔄 **Build-time detection** - Detect circular dependencies when building the provider (optional validation)
- 🔄 **Clear error messages** - Show the dependency cycle path in error messages
- 🔄 **Graph visualization** - Help developers understand their dependency structure

## Summary

| Approach      | Pros                          | Cons                         |
| ------------- | ----------------------------- | ---------------------------- |
| **Refactor**  | Clean architecture, no cycles | Requires code changes        |
| **Lazy Init** | Works for bidirectional needs | Manual wiring required       |
| **Factory**   | Flexible                      | May still have issues        |
| **Mediator**  | Decouples services            | Additional abstraction layer |

## Best Practices

1. ✅ **Design with dependency direction in mind** - Prefer one-way dependencies
2. ✅ **Use interfaces** - Depend on abstractions, not concrete classes
3. ✅ **Keep dependencies minimal** - Fewer dependencies = fewer cycles
4. ✅ **Review dependency graphs** - Regularly check for potential cycles
5. ❌ **Avoid circular dependencies** - Refactor when possible

## Related Topics

- [Dependency Injection](/guide/dependency-injection)
- [Service Lifetimes](/guide/service-lifetimes)
- [Factory Pattern](/guide/factory-pattern)
- [Registration](/guide/registration)
