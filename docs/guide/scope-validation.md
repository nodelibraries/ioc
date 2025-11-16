# Scope Validation

Scope validation helps catch lifetime mismatches at build time, preventing runtime errors.

## Enabling Validation

Enable scope validation when building the provider:

```typescript
const provider = services.buildServiceProvider({ validateScopes: true });
```

## What It Validates

### Scoped Services in Root Provider

```typescript
services.addScoped<ILogger>(ILoggerToken, Logger);

const provider = services.buildServiceProvider({ validateScopes: true });

// This will throw an error:
// "Cannot resolve scoped service 'ILogger' from root provider. Create a scope first."
const logger = await provider.getRequiredService<ILogger>(ILoggerToken);
```

### Scoped Services in Singletons

```typescript
services.addScoped<ILogger>(ILoggerToken, Logger);
services.addSingleton<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);

const provider = services.buildServiceProvider({ validateScopes: true });

// This will throw an error:
// "Cannot inject scoped service 'ILogger' into singleton service 'IUserService'."
const userService = await provider.getRequiredService<IUserService>(IUserServiceToken);
```

## Correct Usage

### Scoped Services in Scopes

```typescript
services.addScoped<ILogger>(ILoggerToken, Logger);

const provider = services.buildServiceProvider({ validateScopes: true });

// This works correctly
const scope = provider.createScope();
const logger = await scope.getRequiredService<ILogger>(ILoggerToken);
await scope.dispose();
```

### Singleton Dependencies

```typescript
services.addSingleton<ILogger>(ILoggerToken, Logger);
services.addScoped<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);

// This works - scoped can depend on singleton
const scope = provider.createScope();
const userService = await scope.getRequiredService<IUserService>(IUserServiceToken);
```

## When to Enable

### Development

Always enable in development to catch issues early:

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';
const provider = services.buildServiceProvider({
  validateScopes: isDevelopment,
});
```

### Production

You can disable in production for better performance, but it's recommended to keep it enabled.

## Error Messages

Validation provides clear error messages:

```
Cannot resolve scoped service 'ILogger' from root provider. Create a scope first.
```

```
Cannot inject scoped service 'ILogger' into singleton service 'IUserService'.
```

## Best Practices

1. **Enable in development** - Catch lifetime issues early
2. **Keep enabled in production** - Prevents runtime errors
3. **Read error messages carefully** - They tell you exactly what's wrong
4. **Fix the root cause** - Don't disable validation to work around issues

## Next Steps

- [Service Lifetimes](/guide/service-lifetimes)
- [Registration](/guide/registration)
