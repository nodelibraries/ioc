# Circular Dependency Detection

This example demonstrates how to detect and visualize all circular dependencies in your service collection using `getCircularDependencies()` and `visualizeCircularDependencies()` methods.

## Code

```typescript
import { ServiceCollection } from '@nodelibraries/ioc';

const services = new ServiceCollection();
const ServiceAToken = Symbol('ServiceA');
const ServiceBToken = Symbol('ServiceB');
const ServiceCToken = Symbol('ServiceC');

// Create circular dependency: A -> B -> C -> A
services.addSingleton(ServiceAToken, ServiceA, [ServiceBToken]);
services.addSingleton(ServiceBToken, ServiceB, [ServiceCToken]);
services.addSingleton(ServiceCToken, ServiceC, [ServiceAToken]);

// Detect circular dependencies
const circularDeps = services.getCircularDependencies();
console.log(services.visualizeCircularDependencies());
```

## Output

```
Found 1 circular dependency/ies:

Circular Dependency 1:
  Symbol(ServiceA) → Symbol(ServiceB) → Symbol(ServiceC) → Symbol(ServiceA)
```

## Methods

### `getCircularDependencies(): CircularDependency[]`

Finds all circular dependencies in the service collection.

**Returns:**
- Array of `CircularDependency` objects, each containing:
  - `path`: Array of tokens forming the circular path
  - `tokens`: Array of objects with `token` and `name` properties

### `visualizeCircularDependencies(): string`

Returns a formatted string representation of all circular dependencies.

**Returns:**
- Formatted string showing all circular dependency paths
- Returns "No circular dependencies found." if none exist

## Examples

### Simple Circular Dependency (A -> B -> A)

```typescript
services.addSingleton(ServiceAToken, ServiceA, [ServiceBToken]);
services.addSingleton(ServiceBToken, ServiceB, [ServiceAToken]);

console.log(services.visualizeCircularDependencies());
// Found 1 circular dependency/ies:
// Circular Dependency 1:
//   Symbol(ServiceA) → Symbol(ServiceB) → Symbol(ServiceA)
```

### Complex Circular Dependency (A -> B -> C -> A)

```typescript
services.addSingleton(ServiceAToken, ServiceA, [ServiceBToken]);
services.addSingleton(ServiceBToken, ServiceB, [ServiceCToken]);
services.addSingleton(ServiceCToken, ServiceC, [ServiceAToken]);

console.log(services.visualizeCircularDependencies());
// Found 1 circular dependency/ies:
// Circular Dependency 1:
//   Symbol(ServiceA) → Symbol(ServiceB) → Symbol(ServiceC) → Symbol(ServiceA)
```

### Multiple Circular Dependencies

```typescript
// First cycle: A -> B -> C -> A
services.addSingleton(ServiceAToken, ServiceA, [ServiceBToken]);
services.addSingleton(ServiceBToken, ServiceB, [ServiceCToken]);
services.addSingleton(ServiceCToken, ServiceC, [ServiceAToken]);

// Second cycle: D -> E -> F -> D
services.addSingleton(ServiceDToken, ServiceD, [ServiceEToken]);
services.addSingleton(ServiceEToken, ServiceE, [ServiceFToken]);
services.addSingleton(ServiceFToken, ServiceF, [ServiceDToken]);

console.log(services.visualizeCircularDependencies());
// Found 2 circular dependency/ies:
// Circular Dependency 1:
//   Symbol(ServiceA) → Symbol(ServiceB) → Symbol(ServiceC) → Symbol(ServiceA)
// Circular Dependency 2:
//   Symbol(ServiceD) → Symbol(ServiceE) → Symbol(ServiceF) → Symbol(ServiceD)
```

## Features

- **Automatic Detection**: Finds all circular dependencies in your service collection
- **Path Visualization**: Shows the complete path of each circular dependency
- **Multiple Cycles**: Detects multiple independent circular dependencies
- **Runtime Compatible**: Circular dependencies are still resolved correctly at runtime

## Important Notes

- **Detection vs Resolution**: These methods detect circular dependencies, but the container still resolves them correctly at runtime
- **All Lifetimes**: Circular dependencies work for Singleton, Scoped, and Transient services
- **No Errors**: The container handles circular dependencies gracefully without throwing errors

## Run This Example

```bash
npx ts-node examples/19-circular-dependency-detection.ts
```

**Full Example:** [Source Code](../../examples/19-circular-dependency-detection.ts)

