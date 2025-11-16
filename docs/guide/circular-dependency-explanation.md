# Circular Dependency Resolution - Detailed Explanation

## Problem

```typescript
class ServiceA {
  constructor(private serviceB: ServiceB) {}
}

class ServiceB {
  constructor(private serviceA: ServiceA) {} // Circular!
}
```

**Issue:** ServiceA needs ServiceB to be created, ServiceB needs ServiceA to be created. This leads to an infinite loop.

## Solution: Resolution Stack + Partial Instance

### Main Idea

1. **Resolution Stack**: Tracks which services are currently being created
2. **Partial Instance**: When a circular dependency is detected, returns a partially created instance
3. **Instance Update**: After dependencies are resolved, updates the partial instance with real dependencies

## Step-by-Step Operation

### Scenario: ServiceA and ServiceB Circular Dependency

```typescript
services.addSingleton(ServiceAToken, ServiceA, [ServiceBToken]);
services.addSingleton(ServiceBToken, ServiceB, [ServiceAToken]);

const serviceA = await provider.getRequiredService(ServiceAToken);
```

### Step 1: ServiceA Resolution Starts

```
1. getRequiredService(ServiceAToken) is called
2. resolveService(ServiceA) is called
3. resolutionStack.add(ServiceAToken) → Stack: [ServiceAToken]
4. createInstance(ServiceA) is called
```

**Code:**

```typescript
// Inside resolveService
rootProvider.resolutionStack.add(token); // ServiceAToken added
const instance = await rootProvider.createInstance(desc, rootProvider, token);
```

### Step 2: Partial Instance Created for ServiceA

```
5. Inside createInstance:
   - Parameter count is determined: 1 (ServiceB)
   - Placeholder instance is created: new ServiceA(undefined)
   - constructingInstances.set(ServiceAToken, placeholderInstance)
```

**Code:**

```typescript
// Inside createInstance
const args = new Array(paramCount).fill(undefined); // [undefined]
instance = new desc.implementation(...args); // new ServiceA(undefined)
resolver.constructingInstances.set(token, instance); // ServiceAToken -> partial ServiceA
```

**State:**

- `resolutionStack`: [ServiceAToken]
- `constructingInstances`: { ServiceAToken: partialServiceA }
- `instances`: {} (no completed instances yet)

### Step 3: ServiceA's Dependencies Are Resolved

```
6. ServiceA's dependencies are attempted to be resolved: [ServiceBToken]
7. getRequiredService(ServiceBToken) is called
8. resolveService(ServiceB) is called
```

**Code:**

```typescript
// Inside createInstance
deps = await Promise.all(desc.dependencies.map((depToken) => resolver.getRequiredService(depToken)));
// getRequiredService is called for ServiceBToken
```

### Step 4: ServiceB Resolution Starts

```
9. resolveService(ServiceB) is called
10. resolutionStack.has(ServiceBToken)? → No
11. resolutionStack.add(ServiceBToken) → Stack: [ServiceAToken, ServiceBToken]
12. createInstance(ServiceB) is called
```

**State:**

- `resolutionStack`: [ServiceAToken, ServiceBToken]
- `constructingInstances`: { ServiceAToken: partialServiceA }

### Step 5: Partial Instance Created for ServiceB

```
13. Inside createInstance:
    - Parameter count: 1 (ServiceA)
    - Placeholder instance: new ServiceB(undefined)
    - constructingInstances.set(ServiceBToken, placeholderInstance)
```

**State:**

- `resolutionStack`: [ServiceAToken, ServiceBToken]
- `constructingInstances`: {
  ServiceAToken: partialServiceA,
  ServiceBToken: partialServiceB
  }

### Step 6: ServiceB's Dependencies Are Resolved

```
14. ServiceB's dependencies are attempted to be resolved: [ServiceAToken]
15. getRequiredService(ServiceAToken) is called
16. resolveService(ServiceA) is called
```

### Step 7: Circular Dependency Detected! 🔄

```
17. Inside resolveService(ServiceA):
    - resolutionStack.has(ServiceAToken)? → YES! (already in stack)
    - Circular dependency detected!
    - constructingInstances.get(ServiceAToken) → partialServiceA is returned
```

**Code:**

```typescript
// Inside resolveService
if (rootProvider.resolutionStack.has(token)) {
  // Circular dependency detected!
  const partialInstance = rootProvider.constructingInstances.get(token);
  if (partialInstance !== undefined) {
    return partialInstance; // ✅ partialServiceA is returned
  }
}
```

**State:**

- ServiceB receives ServiceA as a dependency
- But ServiceA is not yet completed (partial instance)
- This is not a problem! Because ServiceA's constructor has already run

### Step 8: ServiceB Is Completed

```
18. ServiceB's dependencies: [partialServiceA]
19. ServiceB instance is updated:
    - tempInstance = new ServiceB(partialServiceA)
    - All properties are copied to partialServiceB
20. ServiceB is completed!
```

**Code:**

```typescript
// Inside createInstance
const tempInstance = new desc.implementation(...deps); // new ServiceB(partialServiceA)
// All properties are copied to partialServiceB
Object.setPrototypeOf(instance, Object.getPrototypeOf(tempInstance));
// ... property copying ...
```

**State:**

- `resolutionStack`: [ServiceAToken, ServiceBToken]
- `constructingInstances`: {
  ServiceAToken: partialServiceA,
  ServiceBToken: completedServiceB
  }
- `instances`: {} (none added to instances yet)

### Step 9: ServiceB Added to Instances

```
21. resolveService(ServiceB) completes
22. instances.set(ServiceBToken, completedServiceB)
23. resolutionStack.delete(ServiceBToken) → Stack: [ServiceAToken]
24. constructingInstances.delete(ServiceBToken)
```

**State:**

- `resolutionStack`: [ServiceAToken]
- `constructingInstances`: { ServiceAToken: partialServiceA }
- `instances`: { ServiceBToken: completedServiceB }

### Step 10: ServiceA Is Completed

```
25. ServiceA's dependencies: [completedServiceB]
26. ServiceA instance is updated:
    - tempInstance = new ServiceA(completedServiceB)
    - All properties are copied to partialServiceA
27. ServiceA is completed!
```

**State:**

- `resolutionStack`: [ServiceAToken]
- `constructingInstances`: { ServiceAToken: completedServiceA }
- `instances`: { ServiceBToken: completedServiceB }

### Step 11: ServiceA Added to Instances

```
28. resolveService(ServiceA) completes
29. instances.set(ServiceAToken, completedServiceA)
30. resolutionStack.delete(ServiceAToken) → Stack: []
31. constructingInstances.delete(ServiceAToken)
```

**Final State:**

- `resolutionStack`: [] (empty)
- `constructingInstances`: {} (empty)
- `instances`: {
  ServiceAToken: completedServiceA,
  ServiceBToken: completedServiceB
  }

## Important Points

### 1. Why Does Partial Instance Work?

In JavaScript/TypeScript, when a constructor is called:

- Instance is created (memory is allocated)
- Constructor runs
- Instance reference is returned

If an assignment is made to a property inside the constructor (e.g., `this.serviceB = serviceB`), this assignment can be done later. That's why we can first create an instance with `undefined`, then assign the real value later.

### 2. Why Is Property Copying Necessary?

```typescript
// Initial creation (with undefined)
const partialInstance = new ServiceA(undefined);
// partialInstance.serviceB = undefined

// Then new instance with real dependency
const tempInstance = new ServiceA(completedServiceB);
// tempInstance.serviceB = completedServiceB

// Copy properties
Object.assign(partialInstance, tempInstance);
// Now partialInstance.serviceB = completedServiceB
```

### 3. Transient vs Singleton/Scoped Difference

**Singleton/Scoped:**

- Instance is created once and cached
- Circular dependency is completely resolved

**Transient:**

- Each `getRequiredService` call creates a new instance
- But circular dependency is resolved within the same resolution call
- Example:

  ```typescript
  // First call
  const a1 = await provider.getRequiredService(ServiceAToken); // New instance
  const b1 = await provider.getRequiredService(ServiceBToken); // New instance

  // Second call
  const a2 = await provider.getRequiredService(ServiceAToken); // NEW instance (a1 !== a2)
  ```

## Visual Flow Diagram

```
getRequiredService(ServiceAToken)
  │
  ├─> resolutionStack: [ServiceAToken]
  ├─> createInstance(ServiceA)
  │     │
  │     ├─> partialServiceA = new ServiceA(undefined)
  │     ├─> constructingInstances[ServiceAToken] = partialServiceA
  │     │
  │     ├─> getRequiredService(ServiceBToken)  ← Dependency
  │     │     │
  │     │     ├─> resolutionStack: [ServiceAToken, ServiceBToken]
  │     │     ├─> createInstance(ServiceB)
  │     │     │     │
  │     │     │     ├─> partialServiceB = new ServiceB(undefined)
  │     │     │     ├─> constructingInstances[ServiceBToken] = partialServiceB
  │     │     │     │
  │     │     │     ├─> getRequiredService(ServiceAToken)  ← Circular!
  │     │     │     │     │
  │     │     │     │     ├─> resolutionStack.has(ServiceAToken)? → YES!
  │     │     │     │     └─> return partialServiceA  ✅
  │     │     │     │
  │     │     │     ├─> Update partialServiceB with partialServiceA
  │     │     │     └─> return completedServiceB
  │     │     │
  │     │     └─> instances[ServiceBToken] = completedServiceB
  │     │
  │     ├─> Update partialServiceA with completedServiceB
  │     └─> return completedServiceA
  │
  └─> instances[ServiceAToken] = completedServiceA
```

## Summary

Circular dependency resolution works with 3 basic mechanisms:

1. **Resolution Stack**: Tracks which services are currently being created
2. **Partial Instance**: When a circular dependency is detected, returns a partially created instance
3. **Property Copying**: After dependencies are resolved, updates the partial instance with real values

This approach uses a resolution stack mechanism to detect and handle circular dependencies, and is valid for all service lifetimes (Singleton, Scoped, and Transient).
