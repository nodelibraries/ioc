# Service Lifetimes Example

Demonstrates the differences between Singleton, Scoped, and Transient service lifetimes.

## Code

```typescript
import { ServiceCollection, ServiceProvider } from '@nodelibraries/ioc';

/**
 * Service Lifetimes Example
 *
 * This example shows the difference between service lifetimes.
 *
 * Lifetimes:
 * - Singleton: Same instance shared across the application
 * - Scoped: Same instance within a scope, different across scopes
 * - Transient: New instance every time
 */
class Counter {
  private count = 0;

  increment() {
    this.count++;
    return this.count;
  }

  getCount() {
    return this.count;
  }
}

class SingletonService {
  private id = Math.random().toString(36).substring(7);

  getId() {
    return this.id;
  }
}

class ScopedService {
  private id = Math.random().toString(36).substring(7);

  getId() {
    return this.id;
  }
}

class TransientService {
  private id = Math.random().toString(36).substring(7);

  getId() {
    return this.id;
  }
}

// Setup
const services = new ServiceCollection();

const CounterToken = Symbol('Counter');
const SingletonToken = Symbol('Singleton');
const ScopedToken = Symbol('Scoped');
const TransientToken = Symbol('Transient');

services.addSingleton<Counter>(CounterToken, Counter);
services.addSingleton<SingletonService>(SingletonToken, SingletonService);
services.addScoped<ScopedService>(ScopedToken, ScopedService);
services.addTransient<TransientService>(TransientToken, TransientService);

const provider = services.buildServiceProvider();

async function main() {
  console.log('=== Service Lifetimes Example ===\n');

  // Singleton - same instance every time
  console.log('--- Singleton ---');
  const singleton1 = await provider.getRequiredService<SingletonService>(SingletonToken);
  const singleton2 = await provider.getRequiredService<SingletonService>(SingletonToken);
  console.log('Singleton 1 ID:', singleton1.getId());
  console.log('Singleton 2 ID:', singleton2.getId());
  console.log('Same instance?', singleton1 === singleton2);

  // Counter as singleton - shared state
  const counter1 = await provider.getRequiredService<Counter>(CounterToken);
  const counter2 = await provider.getRequiredService<Counter>(CounterToken);
  console.log('\nCounter 1:', counter1.increment());
  console.log('Counter 2:', counter2.increment());
  console.log('Counter 1 again:', counter1.getCount());
  console.log('Same instance?', counter1 === counter2);

  // Scoped - same instance within scope, different across scopes
  console.log('\n--- Scoped ---');
  const scope1 = provider.createScope();
  const scoped1a = await scope1.getRequiredService<ScopedService>(ScopedToken);
  const scoped1b = await scope1.getRequiredService<ScopedService>(ScopedToken);
  console.log('Scope 1 - Instance A ID:', scoped1a.getId());
  console.log('Scope 1 - Instance B ID:', scoped1b.getId());
  console.log('Same instance in scope?', scoped1a === scoped1b);

  const scope2 = provider.createScope();
  const scoped2 = await scope2.getRequiredService<ScopedService>(ScopedToken);
  console.log('Scope 2 - Instance ID:', scoped2.getId());
  console.log('Different from scope 1?', scoped1a !== scoped2);

  await scope1.dispose();
  await scope2.dispose();

  // Transient - new instance every time
  console.log('\n--- Transient ---');
  const transient1 = await provider.getRequiredService<TransientService>(TransientToken);
  const transient2 = await provider.getRequiredService<TransientService>(TransientToken);
  console.log('Transient 1 ID:', transient1.getId());
  console.log('Transient 2 ID:', transient2.getId());
  console.log('Same instance?', transient1 === transient2);
}

main().catch(console.error);
```

## Expected Output

```
=== Service Lifetimes Example ===

--- Singleton ---
Singleton 1 ID: <random-id>
Singleton 2 ID: <random-id>
Same instance? true

Counter 1: 1
Counter 2: 2
Counter 1 again: 2
Same instance? true

--- Scoped ---
Scope 1 - Instance A ID: <random-id>
Scope 1 - Instance B ID: <random-id>
Same instance in scope? true
Scope 2 - Instance ID: <random-id>
Different from scope 1? true

--- Transient ---
Transient 1 ID: <random-id>
Transient 2 ID: <random-id>
Same instance? false
```

## Run This Example

```bash
npx ts-node examples/4-lifetimes.ts
```

## Key Points

- **Singleton**: One instance shared across entire application
- **Scoped**: One instance per scope (perfect for request-scoped services)
- **Transient**: New instance every time (stateless services)
