# Tokens

Tokens are used to identify services in the IoC container. You can use Symbol, string, or class constructor as tokens.

## Symbol Tokens

Symbol tokens are recommended for interfaces to prevent naming conflicts:

```typescript
const ILoggerToken = Symbol('ILogger');
services.addSingleton<ILogger>(ILoggerToken, Logger);
```

**Advantages:**

- Unique - No naming conflicts
- Type-safe
- Recommended for interfaces

## String Tokens

String tokens are simple but can have naming conflicts:

```typescript
const ILoggerToken = 'ILogger';
services.addSingleton<ILogger>(ILoggerToken, Logger);
```

**Use cases:**

- Simple applications
- Configuration values
- When you need serializable tokens

## Class Constructor Tokens

Class constructors can be used directly as tokens:

```typescript
class Database {
  connect() {
    console.log('Database connected');
  }
}

// Token is the class itself
services.addSingleton(Database);

// Resolve using the class
const db = await provider.getRequiredService(Database);
```

**Advantages:**

- No need to define separate tokens
- Simpler syntax
- Good for concrete classes

## Choosing the Right Token

### Use Symbol for Interfaces

```typescript
interface ILogger {
  log(message: string): void;
}

const ILoggerToken = Symbol('ILogger');
services.addSingleton<ILogger>(ILoggerToken, Logger);
```

### Use Class for Concrete Classes

```typescript
class Database {
  // ...
}

services.addSingleton(Database);
```

### Use String for Simple Cases

```typescript
const ApiKeyToken = 'ApiKey';
services.addValue<string>(ApiKeyToken, 'secret-key');
```

## Token Best Practices

1. **Use Symbol for interfaces** - Prevents conflicts
2. **Use class for concrete classes** - Simpler syntax
3. **Use descriptive names** - Makes code more readable
4. **Export tokens** - Share tokens across modules
5. **Group related tokens** - Organize in token files

## Token Organization

Create a `tokens.ts` file to organize tokens:

```typescript
// tokens.ts
export const ILoggerToken = Symbol('ILogger');
export const IUserServiceToken = Symbol('IUserService');
export const IDatabaseToken = Symbol('IDatabase');
```

Then import and use:

```typescript
import { ILoggerToken, IUserServiceToken } from './tokens';

services.addSingleton<ILogger>(ILoggerToken, Logger);
services.addScoped<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);
```

## Next Steps

- [Registration](/guide/registration)
- [Dependency Injection](/guide/dependency-injection)
