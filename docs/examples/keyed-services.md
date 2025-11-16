# Keyed Services Example

Shows key-based service lookup - register services with string or symbol keys and retrieve them using `getKeyedService()` or `getRequiredKeyedService()`.

## Code

```typescript
import { ServiceCollection, ServiceProvider } from '@nodelibraries/ioc';

/**
 * Keyed Services Example
 *
 * This example shows key-based service lookup.
 *
 * Features:
 * - Keyed registration: Register services with string or symbol keys
 * - getKeyedService(): Retrieve services by key
 * - getRequiredKeyedService(): Required version with error handling
 * - Multiple implementations: Same interface, different keys
 * - Use cases: Different cache strategies, storage backends, etc.
 */

interface ICache {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
}

class BigCache implements ICache {
  private cache = new Map<string, any>();

  get<T>(key: string): T | null {
    console.log(`[BIG CACHE] Getting: ${key}`);
    return (this.cache.get(key) as T) || null;
  }

  set<T>(key: string, value: T): void {
    console.log(`[BIG CACHE] Setting: ${key}`);
    this.cache.set(key, value);
  }
}

class SmallCache implements ICache {
  private cache = new Map<string, any>();

  get<T>(key: string): T | null {
    console.log(`[SMALL CACHE] Getting: ${key}`);
    return (this.cache.get(key) as T) || null;
  }

  set<T>(key: string, value: T): void {
    console.log(`[SMALL CACHE] Setting: ${key}`);
    this.cache.set(key, value);
  }
}

async function main() {
  console.log('=== Keyed Services Examples ===\n');

  const services = new ServiceCollection();
  const ICacheToken = Symbol('ICache');

  // ============================================
  // 1. Keyed Services - With Different Keys
  // ============================================
  console.log('--- 1. Keyed Services Registration ---');

  // Same interface, different keys
  services.addKeyedSingleton<ICache>(ICacheToken, BigCache, 'big');
  services.addKeyedSingleton<ICache>(ICacheToken, SmallCache, 'small');

  const provider = services.buildServiceProvider();

  // Get service by key
  const bigCache = await provider.getKeyedService<ICache>(ICacheToken, 'big');
  const smallCache = await provider.getKeyedService<ICache>(ICacheToken, 'small');

  console.log('\nUsing keyed services:');
  bigCache?.set('user:1', { id: 1, name: 'Alice' });
  bigCache?.get('user:1');

  smallCache?.set('session:abc', { userId: 1 });
  smallCache?.get('session:abc');

  // ============================================
  // 2. Using Keyed Services in Services
  // ============================================
  console.log('\n--- 2. Service with Keyed Dependencies ---');

  interface IUserService {
    getUser(id: number): Promise<{ id: number; name: string }>;
  }

  class UserService implements IUserService {
    constructor(private cache: ICache) {}

    async getUser(id: number): Promise<{ id: number; name: string }> {
      const cached = this.cache.get<{ id: number; name: string }>(`user:${id}`);
      if (cached) {
        console.log('Returning from cache');
        return cached;
      }

      // Simulate database fetch
      const user = { id, name: `User ${id}` };
      this.cache.set(`user:${id}`, user);
      return user;
    }
  }

  const IUserServiceToken = Symbol('IUserService');

  // Inject keyed service using factory
  const userServiceFactory = async (provider: ServiceProvider) => {
    const cache = await provider.getKeyedService<ICache>(ICacheToken, 'big');
    if (!cache) {
      throw new Error('Big cache not found');
    }
    return new UserService(cache);
  };

  services.addScoped<IUserService>(IUserServiceToken, userServiceFactory);

  const scope = provider.createScope();
  const userService = await scope.getRequiredService<IUserService>(IUserServiceToken);
  const user = await userService.getUser(1);
  console.log('User:', user);

  await scope.dispose();

  // ============================================
  // 3. String and Symbol Keys
  // ============================================
  console.log('\n--- 3. String and Symbol Keys ---');

  const services2 = new ServiceCollection();
  const IStorageToken = Symbol('IStorage');

  class MemoryStorage implements ICache {
    get<T>(key: string): T | null {
      console.log(`[MEMORY] Getting: ${key}`);
      return null;
    }
    set<T>(key: string, value: T): void {
      console.log(`[MEMORY] Setting: ${key}`);
    }
  }

  class DiskStorage implements ICache {
    get<T>(key: string): T | null {
      console.log(`[DISK] Getting: ${key}`);
      return null;
    }
    set<T>(key: string, value: T): void {
      console.log(`[DISK] Setting: ${key}`);
    }
  }

  // String key
  services2.addKeyedSingleton<ICache>(IStorageToken, MemoryStorage, 'memory');
  // Symbol key
  const diskKey = Symbol('disk');
  services2.addKeyedSingleton<ICache>(IStorageToken, DiskStorage, diskKey);

  const provider2 = services2.buildServiceProvider();

  const memoryStorage = await provider2.getKeyedService<ICache>(IStorageToken, 'memory');
  const diskStorage = await provider2.getKeyedService<ICache>(IStorageToken, diskKey);

  memoryStorage?.set('key1', 'value1');
  diskStorage?.set('key2', 'value2');

  // ============================================
  // 4. GetRequiredKeyedService (Required Version)
  // ============================================
  console.log('\n--- 4. GetRequiredKeyedService (Required Version) ---');

  const services3 = new ServiceCollection();
  services3.addKeyedSingleton<ICache>(IStorageToken, BigCache, 'big');
  services3.addKeyedSingleton<ICache>(IStorageToken, SmallCache, 'small');

  const provider3 = services3.buildServiceProvider();

  // Old way (manual null check)
  const cache1 = await provider3.getKeyedService<ICache>(IStorageToken, 'big');
  if (!cache1) {
    throw new Error('Cache not found'); // Manual check required
  }
  cache1.set('key1', 'value1');
  console.log('✅ Old way works (with manual check)');

  // New way (automatic error if not found)
  const cache2 = await provider3.getRequiredKeyedService<ICache>(IStorageToken, 'big');
  cache2.set('key2', 'value2');
  console.log('✅ GetRequiredKeyedService works!');
  console.log(`   Cache value: ${cache2.get('key2')}`);

  // Error handling
  try {
    await provider3.getRequiredKeyedService<ICache>(IStorageToken, 'nonexistent');
  } catch (error: any) {
    console.log('✅ Error handling works:', error.message);
  }

  console.log('\n✅ Keyed services are working!');
}

main().catch(console.error);
```

## Expected Output

```
=== Keyed Services Examples ===

--- 1. Keyed Services Registration ---

Using keyed services:
[BIG CACHE] Setting: user:1
[BIG CACHE] Getting: user:1
[SMALL CACHE] Setting: session:abc
[SMALL CACHE] Getting: session:abc

--- 2. Service with Keyed Dependencies ---
[BIG CACHE] Getting: user:1
Returning from cache
User: { id: 1, name: 'Alice' }

--- 3. String and Symbol Keys ---
[MEMORY] Setting: key1
[DISK] Setting: key2

--- 4. GetRequiredKeyedService (Required Version) ---
[BIG CACHE] Setting: key1
✅ Old way works (with manual check)
[BIG CACHE] Setting: key2
✅ GetRequiredKeyedService works!
[BIG CACHE] Getting: key2
   Cache value: value2
✅ Error handling works: No provider found for keyed service: token=Symbol(IStorage), key=nonexistent

✅ Keyed services are working!
```

## Run This Example

```bash
npx ts-node examples/11-keyed-services.ts
```

## Key Points

- **Keyed Registration**: Register services with string or symbol keys
- **getKeyedService()**: Retrieve services by key (returns undefined if not found)
- **getRequiredKeyedService()**: Required version with automatic error handling
- **Use Cases**: Different cache strategies, storage backends, database connections
