# Keyed Services

Keyed services allow you to register multiple implementations of the same interface with different keys.

## Basic Usage

```typescript
interface ICache {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
}

class BigCache implements ICache {
  // Large cache implementation
}

class SmallCache implements ICache {
  // Small cache implementation
}

// Register with keys
const ICacheToken = Symbol('ICache');
services.addKeyedSingleton<ICache>(ICacheToken, BigCache, 'big');
services.addKeyedSingleton<ICache>(ICacheToken, SmallCache, 'small');
```

## Retrieving Keyed Services

Use `getKeyedService()` to retrieve by key:

```typescript
const bigCache = await provider.getKeyedService<ICache>(ICacheToken, 'big');
const smallCache = await provider.getKeyedService<ICache>(ICacheToken, 'small');
```

## String and Symbol Keys

You can use both string and symbol keys:

```typescript
// String key
services.addKeyedSingleton<ICache>(ICacheToken, BigCache, 'big');

// Symbol key
const smallKey = Symbol('small');
services.addKeyedSingleton<ICache>(ICacheToken, SmallCache, smallKey);

// Retrieve
const big = await provider.getKeyedService<ICache>(ICacheToken, 'big');
const small = await provider.getKeyedService<ICache>(ICacheToken, smallKey);
```

## Using in Services

Use factories to inject keyed services:

```typescript
class UserService {
  constructor(private cache: ICache) {}

  async getUser(id: number) {
    const cached = this.cache.get(`user:${id}`);
    if (cached) return cached;
    // ... fetch from database
  }
}

const userServiceFactory = async (provider: ServiceProvider) => {
  const cache = await provider.getKeyedService<ICache>(ICacheToken, 'big');
  if (!cache) {
    throw new Error('Big cache not found');
  }
  return new UserService(cache);
};

services.addScoped<IUserService>(IUserServiceToken, userServiceFactory);
```

## Use Cases

- **Different cache strategies** - Big cache, small cache, distributed cache
- **Storage backends** - Memory storage, disk storage, cloud storage
- **Database connections** - Read replica, write database
- **API clients** - Production API, staging API, mock API

## Keyed vs Multiple Implementations

### Keyed Services

- Explicit key-based lookup
- Good when you need to choose specific implementation
- Use `getKeyedService(token, key)`

### Multiple Implementations

- Get all implementations
- Good when you need all implementations
- Use `getServices(token)`

## Best Practices

1. **Use descriptive keys** - `'big'`, `'small'`, `'production'`, etc.
2. **Use constants for keys** - Avoid magic strings
3. **Check for null** - `getKeyedService()` returns `undefined` if not found
4. **Use factories** - For injecting keyed services into other services

## Next Steps

- [Multiple Implementations](/guide/multiple-implementations)
- [Factory Pattern](/guide/factory-pattern)
