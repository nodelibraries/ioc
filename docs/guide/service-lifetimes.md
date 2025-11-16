# Service Lifetimes

Service lifetime determines how long a service instance lives and when it's created.

## Singleton

A singleton service is created once and shared across the entire application.

```typescript
services.addSingleton<ILogger>(ILoggerToken, Logger);

// All calls return the same instance
const logger1 = await provider.getRequiredService<ILogger>(ILoggerToken);
const logger2 = await provider.getRequiredService<ILogger>(ILoggerToken);
console.log(logger1 === logger2); // true
```

**Use cases:**

- Loggers
- Configuration services
- Caches
- Database connections (usually)

## Scoped

A scoped service is created once per scope. Each scope gets its own instance.

```typescript
services.addScoped<IUserService>(IUserServiceToken, UserService);

// Different scopes get different instances
const scope1 = provider.createScope();
const service1 = await scope1.getRequiredService<IUserService>(IUserServiceToken);

const scope2 = provider.createScope();
const service2 = await scope2.getRequiredService<IUserService>(IUserServiceToken);

console.log(service1 === service2); // false
```

**Use cases:**

- Request-scoped services (web applications)
- Unit of Work pattern
- Per-request database contexts

## Transient

A transient service is created new every time it's requested.

```typescript
services.addTransient<IValidator>(IValidatorToken, Validator);

// Each call creates a new instance
const validator1 = await provider.getRequiredService<IValidator>(IValidatorToken);
const validator2 = await provider.getRequiredService<IValidator>(IValidatorToken);
console.log(validator1 === validator2); // false
```

**Use cases:**

- Validators
- Mappers
- Stateless services
- Services that should be fresh each time

## Lifetime Rules

### Dependency Injection Rules

- **Singleton** can depend on Singleton
- **Scoped** can depend on Singleton or Scoped
- **Transient** can depend on anything

### Scope Validation

Enable scope validation to catch lifetime mismatches:

```typescript
const provider = services.buildServiceProvider({ validateScopes: true });

// This will throw an error:
// "Cannot inject scoped service 'ILogger' into singleton service 'IUserService'"
services.addSingleton<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);
services.addScoped<ILogger>(ILoggerToken, Logger);
```

## Best Practices

1. **Use Singleton for stateless services** - Loggers, configuration, caches
2. **Use Scoped for request-scoped services** - User context, database context
3. **Use Transient for stateless, lightweight services** - Validators, mappers
4. **Enable scope validation in development** - Catch lifetime issues early

## Next Steps

- [Registration Guide](/guide/registration)
- [Scope Validation](/guide/scope-validation)
