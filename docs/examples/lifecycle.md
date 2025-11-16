# Lifecycle Hooks Example

Demonstrates lifecycle hooks - `onInit()` and `onDestroy()` methods for service initialization and cleanup.

## Code

```typescript
import { ServiceCollection, ServiceProvider } from '@nodelibraries/ioc';

/**
 * Lifecycle Hooks Example
 *
 * This example demonstrates lifecycle hooks.
 *
 * Features:
 * - onInit(): Called after service instantiation
 * - onDestroy(): Called when scope is disposed
 */
class DatabaseConnection {
  private connection: any = null;
  private connected = false;

  async onInit() {
    console.log('  → DatabaseConnection.onInit() called');
    // Simulate database connection
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.connection = { connected: true };
    this.connected = true;
    console.log('  → Database connected');
  }

  async onDestroy() {
    console.log('  → DatabaseConnection.onDestroy() called');
    if (this.connection) {
      // Simulate closing connection
      await new Promise((resolve) => setTimeout(resolve, 50));
      this.connection = null;
      this.connected = false;
      console.log('  → Database connection closed');
    }
  }

  isConnected() {
    return this.connected;
  }

  query(sql: string) {
    if (!this.connected) {
      throw new Error('Database not connected');
    }
    console.log(`  → Executing query: ${sql}`);
    return { rows: [] };
  }
}

class CacheService {
  private cache = new Map<string, any>();

  async onInit() {
    console.log('  → CacheService.onInit() called');
    console.log('  → Cache initialized');
  }

  async onDestroy() {
    console.log('  → CacheService.onDestroy() called');
    this.cache.clear();
    console.log('  → Cache cleared');
  }

  set(key: string, value: any) {
    this.cache.set(key, value);
  }

  get(key: string) {
    return this.cache.get(key);
  }
}

// Setup
const services = new ServiceCollection();

const DatabaseToken = Symbol('Database');
const CacheToken = Symbol('Cache');

services.addScoped<DatabaseConnection>(DatabaseToken, DatabaseConnection);
services.addScoped<CacheService>(CacheToken, CacheService);

const provider = services.buildServiceProvider();

async function main() {
  console.log('=== Lifecycle Hooks Example ===\n');

  console.log('--- Creating scope 1 ---');
  const scope1 = provider.createScope();

  console.log('Getting DatabaseConnection...');
  const db1 = await scope1.getRequiredService<DatabaseConnection>(DatabaseToken);
  console.log('Database connected?', db1.isConnected());

  console.log('\nGetting CacheService...');
  const cache1 = await scope1.getRequiredService<CacheService>(CacheToken);
  cache1.set('key1', 'value1');
  console.log('Cache value:', cache1.get('key1'));

  console.log('\n--- Disposing scope 1 ---');
  await scope1.dispose();

  console.log('\n--- Creating scope 2 ---');
  const scope2 = provider.createScope();

  console.log('Getting DatabaseConnection...');
  const db2 = await scope2.getRequiredService<DatabaseConnection>(DatabaseToken);
  console.log('Database connected?', db2.isConnected());

  console.log('\n--- Disposing scope 2 ---');
  await scope2.dispose();
}

main().catch(console.error);
```

## Expected Output

```
=== Lifecycle Hooks Example ===

--- Creating scope 1 ---
Getting DatabaseConnection...
  → DatabaseConnection.onInit() called
  → Database connected
Database connected? true

Getting CacheService...
  → CacheService.onInit() called
  → Cache initialized
Cache value: value1

--- Disposing scope 1 ---
  → DatabaseConnection.onDestroy() called
  → Database connection closed
  → CacheService.onDestroy() called
  → Cache cleared

--- Creating scope 2 ---
Getting DatabaseConnection...
  → DatabaseConnection.onInit() called
  → Database connected
Database connected? true

--- Disposing scope 2 ---
  → DatabaseConnection.onDestroy() called
  → Database connection closed
```

## Run This Example

```bash
npx ts-node examples/5-lifecycle.ts
```

## Key Points

- **onInit()**: Called automatically after service instantiation
- **onDestroy()**: Called automatically when scope is disposed
- **Async Support**: Both hooks support async operations
- **Use Cases**: Database connections, cache initialization, resource cleanup
