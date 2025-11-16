# Examples

This directory contains runnable examples demonstrating various features of `@nodelibraries/ioc`, ordered from basic to advanced.

## JavaScript Examples

The library works with both TypeScript and JavaScript. JavaScript examples are available:

- **js/js-basic.js** - Basic JavaScript usage (registration, resolution, scopes, dependency injection)
- **js/js-advanced.js** - Advanced JavaScript features (factory, keyed services, multiple implementations, value registration)
- **js/js-express.js** - Express.js integration (request-scoped services, middleware, routes)
- **js/js-lifecycle.js** - Lifecycle hooks (onInit, onDestroy)
- **js/js-circular-dependency.js** - Circular dependency resolution (singleton, scoped, transient)

Run JavaScript examples:

```bash
# Make sure to build first
npm run build

# Then run JavaScript examples
node examples/js/js-basic.js
node examples/js/js-advanced.js
node examples/js/js-express.js
node examples/js/js-lifecycle.js
node examples/js/js-circular-dependency.js
```

**Note:**

- JavaScript examples use CommonJS `require()`. For ES Modules, use `import` syntax.
- All JavaScript features work identically to TypeScript, but without compile-time type safety.
- See the main README for JavaScript best practices and limitations.

## Running Examples

First, make sure you have installed dependencies:

```bash
npm install
npm run build
```

**Note:** The Express examples (`16-express.ts` and `17-express-advanced.ts`) require additional dependencies. Install them with:

```bash
npm install --save-dev express @types/express ts-node
```

Then run examples using `ts-node` or compile and run with Node.js:

### Using ts-node (recommended)

```bash
npx ts-node examples/1-basic.ts
npx ts-node examples/2-interface-registration.ts
npx ts-node examples/3-string-token.ts
npx ts-node examples/4-lifetimes.ts
npx ts-node examples/5-lifecycle.ts
npx ts-node examples/6-value-registration.ts
npx ts-node examples/7-generic-types.ts
npx ts-node examples/8-factory-pattern.ts
npx ts-node examples/9-multiple-implementations.ts
npx ts-node examples/10-tryadd-pattern.ts
npx ts-node examples/11-keyed-services.ts
npx ts-node examples/12-duplicate-registration.ts
npx ts-node examples/13-scope-validation.ts
npx ts-node examples/14-circular-dependency.ts
npx ts-node examples/15-complex-dependency-chain.ts
npx ts-node examples/16-service-management.ts
npx ts-node examples/16-express.ts
npx ts-node examples/17-express-advanced.ts
npx ts-node examples/18-dependency-tree.ts
npx ts-node examples/19-circular-dependency-detection.ts
```

### Using Node.js (after build)

```bash
# Build the project first
npm run build

# Run compiled examples
node dist/examples/1-basic.js
node dist/examples/2-interface-registration.js
node dist/examples/3-string-token.js
node dist/examples/4-lifetimes.js
node dist/examples/5-lifecycle.js
node dist/examples/6-value-registration.js
node dist/examples/7-generic-types.js
node dist/examples/8-factory-pattern.js
node dist/examples/9-multiple-implementations.js
node dist/examples/10-tryadd-pattern.js
node dist/examples/11-keyed-services.js
node dist/examples/12-duplicate-registration.js
node dist/examples/13-scope-validation.js
node dist/examples/14-circular-dependency.js
node dist/examples/15-complex-dependency-chain.js
node dist/examples/16-service-management.js
node dist/examples/16-express.js
node dist/examples/17-express-advanced.js
node dist/examples/18-dependency-tree.js
node dist/examples/19-circular-dependency-detection.js
```

## Examples Overview

Examples are organized from basic to advanced:

### Basic Examples (1-3)

**1. 1-basic.ts** - Simplest usage of the IoC Container

- Class registration (simplest method)
- Service resolution
- Dependency injection
- Creating scopes

**2. 2-interface-registration.ts** - Interface Registration

- Interface-based registration using Symbol tokens
- Recommended approach for loose coupling
- Dependency injection with interfaces
- Scoped services
- IsService<T>() method

**3. 3-string-token.ts** - String Token Registration

- String tokens as alternative to Symbol tokens
- Simpler but less type-safe
- Interface-based registration with strings

### Core Concepts (4-6)

**4. 4-lifetimes.ts** - Service Lifetimes

- Singleton: Same instance shared across the application
- Scoped: Same instance within a scope, different across scopes
- Transient: New instance every time

**5. 5-lifecycle.ts** - Lifecycle Hooks

- onInit(): Called after service instantiation
- onDestroy(): Called when scope is disposed

**6. 6-value-registration.ts** - Value Registration

- JSON objects: Configuration objects, settings
- Primitives: Strings, numbers, booleans
- Arrays and objects: Pre-defined data structures
- Pre-created instances: Already instantiated objects
- Environment variables: Runtime configuration

### Advanced Features (7-13)

**7. 7-generic-types.ts** - Generic Type Parameters

- Type safety: Ensures implementation matches the interface
- IntelliSense/Autocomplete: IDE can suggest correct methods
- Compile-time checking: Catches type errors before runtime
- Return type inference: getService<T>() returns the correct type

**8. 8-factory-pattern.ts** - Factory Pattern

- Factory functions: Create services with complex initialization logic
- Async factories: Support for asynchronous service initialization
- Conditional logic: Choose implementation based on configuration
- Multiple dependencies: Factory functions receive ServiceProvider for dependency resolution

**9. 9-multiple-implementations.ts** - Multiple Implementations

- Same token, multiple implementations: Register multiple services with same token
- getServices(): Retrieve all implementations of an interface
- getService(): Get the last registered implementation (default)
- Factory pattern: Use factories to inject all implementations into a service

**10. 10-tryadd-pattern.ts** - TryAdd Pattern

- tryAddSingleton/Scoped/Transient: Only register if not already registered
- Library defaults: Safe way to register default services
- User overrides: Preserve user's custom registrations
- Use cases: When to use TryAdd vs regular Add

**11. 11-keyed-services.ts** - Keyed Services

- Keyed registration: Register services with string or symbol keys
- getKeyedService(): Retrieve services by key
- getRequiredKeyedService(): Required version with error handling
- Multiple implementations: Same interface, different keys
- Use cases: Different cache strategies, storage backends, etc.

**12. 12-duplicate-registration.ts** - Duplicate Registration

- Same token, different implementations: Last registration wins (overrides previous)
- Different tokens, same interface: Both implementations can coexist
- Class tokens: Each class has its own token automatically
- Replace(): Explicit service replacement method
- Best practices: How to handle multiple implementations correctly

**13. 13-scope-validation.ts** - Scope Validation

- validateScopes option: Enable lifetime validation
- validateOnBuild option: Validate all dependencies at build time
- Error detection: Catch scoped services injected into singletons
- Root provider validation: Prevent resolving scoped services from root
- Best practices: When to enable validation

### Complex Scenarios (14-15)

**14. 14-circular-dependency.ts** - Circular Dependency Resolution

- Singleton circular dependencies: Full support for circular references
- Scoped circular dependencies: Works within the same scope
- Transient circular dependencies: Works within the same resolution call
- Resolution stack mechanism: How the container handles circular dependencies
- Instance verification: Verifying that circular references are correctly established

**15. 15-complex-dependency-chain.ts** - Complex Dependency Chain

- Deep dependency chains: ServiceA -> ServiceB -> ServiceC -> ServiceD, ServiceE
- Multiple shared dependencies
- Different lifetimes in the same chain
- Singleton, scoped, and transient services working together

### Real-World Applications (16-18)

### Analysis & Visualization (18-19)

**16. 16-service-management.ts** - Service Management

- Remove/RemoveAll(): Remove services from collection
- Dynamic service management patterns
- Test scenarios with service replacement
- Configuration-based service replacement

**17. 16-express.ts** - Express Integration

- Request-scoped services
- Middleware for scope management
- RESTful API with dependency injection

**18. 17-express-advanced.ts** - Advanced Express Integration

- Multiple services with dependencies
- Middleware using IoC container
- Error handling with dependency injection
- Request-scoped services
- Service lifecycle management
- Authentication middleware
- Request context

**18. 18-dependency-tree.ts** - Dependency Tree Visualization

- Visualize dependency trees for services
- Get dependency tree as object structure
- Detect circular dependencies in trees
- Format dependency trees as strings

**19. 19-circular-dependency-detection.ts** - Circular Dependency Detection

- Detect all circular dependencies in service collection
- Visualize circular dependency paths
- Handle simple and complex circular dependencies
- Multiple circular dependency detection
- Runtime verification that circular dependencies still work

## Learning Path

1. **Start with basics**: Examples 1-3 introduce the fundamental concepts
2. **Understand lifetimes**: Example 4 is crucial for understanding how services are managed
3. **Learn lifecycle**: Example 5 shows how to handle initialization and cleanup
4. **Explore advanced features**: Examples 7-13 cover more sophisticated patterns
5. **Handle edge cases**: Examples 14-15 demonstrate complex scenarios
6. **Build real applications**: Examples 16-18 show practical usage

## Notes

- All examples include expected console output at the end of each file
- Examples are self-contained and can be run independently
- Each example focuses on specific features to avoid confusion
- Examples progress from simple to complex, building on previous concepts
