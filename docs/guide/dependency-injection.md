# Dependency Injection

Dependency Injection (DI) is a design pattern where objects receive their dependencies from an external source rather than creating them internally.

## Why Dependency Injection?

### Without DI

```typescript
class UserService {
  private logger = new Logger(); // Tight coupling!
  private database = new Database(); // Hard to test!

  getUsers() {
    this.logger.log('Fetching users...');
    return this.database.query('SELECT * FROM users');
  }
}
```

**Problems:**

- Tight coupling to concrete implementations
- Hard to test (can't mock dependencies)
- Difficult to swap implementations

### With DI

```typescript
class UserService {
  constructor(private logger: ILogger, private database: IDatabase) {}

  getUsers() {
    this.logger.log('Fetching users...');
    return this.database.query('SELECT * FROM users');
  }
}
```

**Benefits:**

- Loose coupling to interfaces
- Easy to test (can inject mocks)
- Easy to swap implementations

## Automatic Dependency Resolution

The container automatically resolves dependencies:

```typescript
services.addSingleton<ILogger>(ILoggerToken, Logger);
services.addSingleton<IDatabase>(IDatabaseToken, Database);
services.addScoped<IUserService>(
  IUserServiceToken,
  UserService,
  [ILoggerToken, IDatabaseToken], // Dependencies
);

// Container automatically injects ILogger and IDatabase
const userService = await provider.getRequiredService<IUserService>(IUserServiceToken);
```

## Explicit Dependencies

**⚠️ IMPORTANT:** If your class constructor has parameters (dependencies), you **MUST** provide them in the dependencies array. The container cannot automatically infer dependencies from the constructor.

```typescript
// ✅ CORRECT: Constructor has ILogger parameter, so we provide [ILoggerToken]
class UserService {
  constructor(private logger: ILogger) {} // Has dependency
}
services.addScoped<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);

// ❌ WRONG: Constructor has dependency but dependencies array is missing
// This will fail - container cannot resolve ILogger
services.addScoped<IUserService>(IUserServiceToken, UserService); // Missing [ILoggerToken]!

// ✅ CORRECT: No dependencies - constructor has no parameters
class Logger {
  log(message: string) {} // No constructor parameters
}
services.addSingleton<ILogger>(ILoggerToken, Logger); // No dependencies array needed
```

## Dependency Injection Rules

### Lifetime Rules

- **Singleton** can depend on Singleton
- **Scoped** can depend on Singleton or Scoped
- **Transient** can depend on anything

### Circular Dependencies

Circular dependencies are now supported for **all service lifetimes** (Singleton, Scoped, and Transient). The container uses a resolution stack mechanism to detect and handle circular dependencies automatically.

```typescript
class A {
  constructor(private b: B) {}
}

class B {
  constructor(private a: A) {} // Circular!
}

// ✅ This works for all lifetimes (Singleton, Scoped, and Transient)
services.addSingleton(AToken, A, [BToken]);
services.addSingleton(BToken, B, [AToken]);

// Or with Transient (works within the same resolution call)
services.addTransient(AToken, A, [BToken]);
services.addTransient(BToken, B, [AToken]);
```

**Note:** For Transient services, circular dependencies are resolved within the same resolution call. Each new `getRequiredService` call creates a new instance (maintaining transient behavior). See the [Circular Dependencies Guide](/guide/circular-dependencies) for more details and best practices.

## Best Practices

1. **Depend on interfaces, not implementations** - Enables loose coupling
2. **Use constructor injection** - Most common and recommended pattern
3. **Keep constructors simple** - Avoid complex logic in constructors
4. **Specify dependencies explicitly** - More readable and maintainable
5. **Avoid circular dependencies** - Refactor if needed

## Next Steps

- [Service Lifetimes](/guide/service-lifetimes)
- [Registration](/guide/registration)
- [Tokens](/guide/tokens)
