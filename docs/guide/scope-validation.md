# Scope Validation

Scope validation helps catch lifetime mismatches and missing dependencies at build time, preventing runtime errors.

## Overview

The IoC container provides two validation options:

- **`validateScopes`** - Validates lifetime mismatches (e.g., scoped service injected into singleton)
- **`validateOnBuild`** - Validates all dependencies exist at build time

Both options default to `false`. Enable them explicitly for validation.

## Comparison with .NET Core

In .NET Core, these options work similarly:

```csharp
// .NET Core - ServiceProviderOptions
builder.Host.UseDefaultServiceProvider(options =>
{
    options.ValidateScopes = true;    // Default: false
    options.ValidateOnBuild = true;   // Default: false (available in .NET 6+)
});
```

**Default Behavior in .NET Core:**

- `ValidateScopes`: **`false`** (default) - No validation, allows problematic lifetime combinations
- `ValidateOnBuild`: **`false`** (default) - No build-time validation, errors appear at runtime

**Best Practice in .NET Core:**

- Enable `ValidateScopes` and `ValidateOnBuild` in **development** environment
- Disable them in **production** for better performance
- This is exactly the same approach you should use with this library!

```csharp
// .NET Core - Typical usage pattern
builder.Host.UseDefaultServiceProvider(options =>
{
    options.ValidateScopes = builder.Environment.IsDevelopment();
    options.ValidateOnBuild = builder.Environment.IsDevelopment();
});
```

**Our Implementation:**
Our library follows the same pattern as .NET Core - both options default to `false` and work identically. The validation logic and error messages are also similar to .NET Core's implementation.

## `validateScopes` Option

### `validateScopes: false` (default)

No validation, allows any lifetime combination:

```typescript
// ⚠️ WARNING: This works but can cause issues!
services.addScoped<ILogger>(ILoggerToken, Logger);
services.addSingleton<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);

const provider = services.buildServiceProvider({ validateScopes: false });
// ✅ Provider created successfully, but this is problematic!
// Scoped service injected into singleton can cause issues in production

const userService = await provider.getRequiredService<IUserService>(IUserServiceToken);
// ⚠️ Works, but the scoped logger instance will be shared across all singleton instances
// This breaks the scoped lifetime guarantee!
```

### `validateScopes: true`

Validates lifetime mismatches at runtime:

```typescript
// ❌ ERROR: Scoped service injected into singleton
services.addScoped<ILogger>(ILoggerToken, Logger);
services.addSingleton<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);

const provider = services.buildServiceProvider({ validateScopes: true });
// ❌ Throws immediately: "Cannot inject scoped service 'ILogger' into singleton service 'IUserService'"
// This prevents the problematic configuration!

// ✅ CORRECT: Scoped service used within scope
services.addSingleton<ILogger>(ILoggerToken, Logger);
services.addScoped<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);

const provider = services.buildServiceProvider({ validateScopes: true });
const scope = provider.createScope();
const userService = await scope.getRequiredService<IUserService>(IUserServiceToken); // ✅ Works!
// Scoped service is correctly resolved from a scope, not from root provider
```

### Additional `validateScopes` Examples

**Example 1: Root provider cannot resolve scoped services when validation is enabled**

```typescript
services.addScoped<IUserService>(IUserServiceToken, UserService);
const provider = services.buildServiceProvider({ validateScopes: true });

// ❌ ERROR: Cannot resolve scoped service from root provider
await provider.getRequiredService<IUserService>(IUserServiceToken);
// Throws: "Cannot resolve scoped service 'IUserService' from root provider. Create a scope first."

// ✅ CORRECT: Resolve from scope
const scope = provider.createScope();
await scope.getRequiredService<IUserService>(IUserServiceToken); // ✅ Works!
```

**Example 2: Factory with scoped dependency**

```typescript
services.addScoped<ILogger>(ILoggerToken, Logger);
services.addSingleton<IUserService>(IUserServiceToken, (provider) => {
  const logger = provider.getRequiredService<ILogger>(ILoggerToken); // ❌ ERROR with validateScopes: true
  return new UserService(logger);
});

const provider = services.buildServiceProvider({ validateScopes: true });
// ❌ Throws when factory tries to resolve scoped service from root provider
```

## `validateOnBuild` Option

### `validateOnBuild: false` (default)

No validation at build time, errors appear at runtime:

```typescript
// ⚠️ Missing dependency - not detected until runtime!
services.addScoped<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);
// ILoggerToken is not registered!

const provider = services.buildServiceProvider({ validateOnBuild: false });
// ✅ Provider created successfully, but the error will occur later

// Later, when trying to use the service:
try {
  const scope = provider.createScope();
  await scope.getRequiredService<IUserService>(IUserServiceToken);
  // ❌ Throws: "No provider found for token: Symbol(ILogger)"
  // Error discovered at runtime, not at build time!
} catch (error) {
  console.error('Runtime error:', error);
}
```

### `validateOnBuild: true`

Validates all dependencies at build time (catches missing dependencies early):

```typescript
// ❌ ERROR: Missing dependency detected at build time
services.addScoped<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);
// ILoggerToken is not registered!

try {
  const provider = services.buildServiceProvider({ validateOnBuild: true });
  // ❌ Throws immediately: "Validation failed on build: Missing dependency: ILogger required by IUserService"
  // Error caught at build time, before any services are used!
} catch (error) {
  console.error('Build-time validation error:', error);
  // You can fix the issue before deploying to production
}

// ✅ CORRECT: All dependencies registered
services.addSingleton<ILogger>(ILoggerToken, Logger);
services.addScoped<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);
const provider = services.buildServiceProvider({ validateOnBuild: true }); // ✅ No errors!
// All dependencies are validated and confirmed to exist
```

### Additional `validateOnBuild` Examples

**Example 1: Multiple missing dependencies - all are reported**

```typescript
services.addSingleton<IServiceA>(IServiceAToken, ServiceA, [IServiceBToken, IServiceCToken]);
// Both IServiceBToken and IServiceCToken are missing!

const provider = services.buildServiceProvider({ validateOnBuild: true });
// ❌ Throws: "Validation failed on build: Missing dependency: IServiceB required by IServiceA"
// All missing dependencies are reported in the error message
```

**Example 2: Deep dependency chain validation**

```typescript
services.addSingleton<IServiceA>(IServiceAToken, ServiceA, [IServiceBToken]);
services.addSingleton<IServiceB>(IServiceBToken, ServiceB, [IServiceCToken]);
// IServiceCToken is missing!

const provider = services.buildServiceProvider({ validateOnBuild: true });
// ❌ Throws: "Validation failed on build: Missing dependency: IServiceC required by IServiceB"
// Validates the entire dependency chain recursively, not just direct dependencies
```

## Using Both Options Together

Best practice: Enable both validations in development:

```typescript
// Best practice: Enable both validations in development
const provider = services.buildServiceProvider({
  validateScopes: true, // Catch lifetime mismatches
  validateOnBuild: true, // Catch missing dependencies early
});

// This ensures:
// 1. All dependencies exist (validateOnBuild)
// 2. Lifetime rules are followed (validateScopes)
// 3. Errors are caught before production deployment
```

## When to Enable

### Development

Always enable in development to catch issues early:

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';
const provider = services.buildServiceProvider({
  validateScopes: isDevelopment,
  validateOnBuild: isDevelopment,
});
```

### Production

You can disable in production for better performance, but it's recommended to keep them enabled to prevent runtime errors.

## Error Messages

Validation provides clear error messages:

**Scope Validation Errors:**

```
Cannot resolve scoped service 'ILogger' from root provider. Create a scope first.
```

```
Cannot inject scoped service 'ILogger' into singleton service 'IUserService'.
```

**Build Validation Errors:**

```
Validation failed on build: Missing dependency: ILogger required by IUserService
```

## Best Practices

1. **Enable in development** - Catch lifetime and dependency issues early
2. **Keep enabled in production** - Prevents runtime errors (optional, for performance you can disable)
3. **Read error messages carefully** - They tell you exactly what's wrong
4. **Fix the root cause** - Don't disable validation to work around issues

## Next Steps

- [Service Lifetimes](/guide/service-lifetimes)
- [Registration](/guide/registration)
- [Dependency Injection](/guide/dependency-injection)
