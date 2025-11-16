# Complex Dependency Chain Example

Demonstrates a complex dependency chain: ServiceA -> ServiceB -> ServiceC -> ServiceD, ServiceE with different lifetimes.

## Code

```typescript
import { ServiceCollection, ServiceProvider } from '@nodelibraries/ioc';

/**
 * Complex Dependency Chain Example
 *
 * This example demonstrates a complex dependency chain:
 * ServiceA -> ServiceB -> ServiceC -> ServiceD, ServiceE
 *
 * Tests if the container correctly resolves deep dependency chains.
 */

// Define interfaces
interface IServiceD {
  getName(): string;
}

interface IServiceE {
  getName(): string;
}

interface IServiceC {
  getName(): string;
  getDependency(): IServiceD;
  getOtherDependency(): IServiceE;
}

interface IServiceB {
  getName(): string;
  getDependency(): IServiceC;
}

interface IServiceA {
  getName(): string;
  getDependency(): IServiceB;
}

// Implement services
class ServiceD implements IServiceD {
  getName(): string {
    return 'ServiceD';
  }
}

class ServiceE implements IServiceE {
  getName(): string {
    return 'ServiceE';
  }
}

class ServiceC implements IServiceC {
  constructor(private serviceD: IServiceD, private serviceE: IServiceE) {
    console.log(`[ServiceC] Initialized with ${serviceD.getName()} and ${serviceE.getName()}`);
  }

  getName(): string {
    return 'ServiceC';
  }

  getDependency(): IServiceD {
    return this.serviceD;
  }

  getOtherDependency(): IServiceE {
    return this.serviceE;
  }
}

class ServiceB implements IServiceB {
  constructor(private serviceC: IServiceC) {
    console.log(`[ServiceB] Initialized with ${serviceC.getName()}`);
  }

  getName(): string {
    return 'ServiceB';
  }

  getDependency(): IServiceC {
    return this.serviceC;
  }
}

class ServiceA implements IServiceA {
  constructor(private serviceB: IServiceB) {
    console.log(`[ServiceA] Initialized with ${serviceB.getName()}`);
  }

  getName(): string {
    return 'ServiceA';
  }

  getDependency(): IServiceB {
    return this.serviceB;
  }
}

// Create tokens
const ServiceAToken = Symbol('ServiceA');
const ServiceBToken = Symbol('ServiceB');
const ServiceCToken = Symbol('ServiceC');
const ServiceDToken = Symbol('ServiceD');
const ServiceEToken = Symbol('ServiceE');

async function main() {
  console.log('=== Complex Dependency Chain Example ===\n');

  // Setup container
  const services = new ServiceCollection();

  // Register services in dependency order (bottom-up)
  // ServiceD and ServiceE have no dependencies
  services.addSingleton<IServiceD>(ServiceDToken, ServiceD);
  services.addSingleton<IServiceE>(ServiceEToken, ServiceE);

  // ServiceC depends on ServiceD and ServiceE
  services.addSingleton<IServiceC>(ServiceCToken, ServiceC, [ServiceDToken, ServiceEToken]);

  // ServiceB depends on ServiceC
  services.addSingleton<IServiceB>(ServiceBToken, ServiceB, [ServiceCToken]);

  // ServiceA depends on ServiceB
  services.addSingleton<IServiceA>(ServiceAToken, ServiceA, [ServiceBToken]);

  // Build provider
  const provider = services.buildServiceProvider();

  console.log('--- Resolving ServiceA (top of chain) ---\n');

  // Resolve ServiceA - should automatically resolve entire chain
  const serviceA = await provider.getRequiredService<IServiceA>(ServiceAToken);

  console.log('\n--- Verifying Dependency Chain ---\n');

  // Verify the chain
  console.log(`ServiceA name: ${serviceA.getName()}`);
  const serviceB = serviceA.getDependency();
  console.log(`ServiceB name: ${serviceB.getName()}`);
  const serviceC = serviceB.getDependency();
  console.log(`ServiceC name: ${serviceC.getName()}`);
  const serviceD = serviceC.getDependency();
  console.log(`ServiceD name: ${serviceD.getName()}`);
  const serviceE = serviceC.getOtherDependency();
  console.log(`ServiceE name: ${serviceE.getName()}`);

  console.log('\n--- Testing Singleton Behavior ---\n');

  // Get ServiceA again - should be the same instance
  const serviceA2 = await provider.getRequiredService<IServiceA>(ServiceAToken);
  console.log(`Same ServiceA instance? ${serviceA === serviceA2}`);

  // Get ServiceD directly - should be the same instance used in ServiceC
  const serviceD2 = await provider.getRequiredService<IServiceD>(ServiceDToken);
  console.log(`Same ServiceD instance? ${serviceD === serviceD2}`);

  // Get ServiceE directly - should be the same instance used in ServiceC
  const serviceE2 = await provider.getRequiredService<IServiceE>(ServiceEToken);
  console.log(`Same ServiceE instance? ${serviceE === serviceE2}`);

  console.log('\n--- Testing Scoped Services ---\n');

  // Test with scoped services
  const services2 = new ServiceCollection();
  services2.addScoped<IServiceD>(ServiceDToken, ServiceD);
  services2.addScoped<IServiceE>(ServiceEToken, ServiceE);
  services2.addScoped<IServiceC>(ServiceCToken, ServiceC, [ServiceDToken, ServiceEToken]);
  services2.addScoped<IServiceB>(ServiceBToken, ServiceB, [ServiceCToken]);
  services2.addScoped<IServiceA>(ServiceAToken, ServiceA, [ServiceBToken]);

  const provider2 = services2.buildServiceProvider();
  const scope1 = provider2.createScope();
  const scope2 = provider2.createScope();

  const scopedA1 = await scope1.getRequiredService<IServiceA>(ServiceAToken);
  const scopedA2 = await scope2.getRequiredService<IServiceA>(ServiceAToken);

  console.log(`Different scopes, different ServiceA? ${scopedA1 !== scopedA2}`);
  console.log(`Scope1 ServiceA name: ${scopedA1.getName()}`);
  console.log(`Scope2 ServiceA name: ${scopedA2.getName()}`);

  // Verify that dependencies within same scope are same instance
  const scopedB1 = scopedA1.getDependency();
  const scopedB1Again = await scope1.getRequiredService<IServiceB>(ServiceBToken);
  console.log(`Same scope, same ServiceB? ${scopedB1 === scopedB1Again}`);

  await scope1.dispose();
  await scope2.dispose();

  console.log('\n--- Testing Shared Dependencies (ServiceC used in multiple places) ---\n');

  // Test scenario: ServiceC is used by both ServiceB and ServiceF
  interface IServiceF {
    getName(): string;
    getDependency(): IServiceC;
  }

  class ServiceF implements IServiceF {
    constructor(private serviceC: IServiceC) {
      console.log(`[ServiceF] Initialized with ${serviceC.getName()}`);
    }

    getName(): string {
      return 'ServiceF';
    }

    getDependency(): IServiceC {
      return this.serviceC;
    }
  }

  const ServiceFToken = Symbol('ServiceF');

  const services3 = new ServiceCollection();
  services3.addSingleton<IServiceD>(ServiceDToken, ServiceD);
  services3.addSingleton<IServiceE>(ServiceEToken, ServiceE);
  services3.addSingleton<IServiceC>(ServiceCToken, ServiceC, [ServiceDToken, ServiceEToken]);
  services3.addSingleton<IServiceB>(ServiceBToken, ServiceB, [ServiceCToken]);
  services3.addSingleton<IServiceA>(ServiceAToken, ServiceA, [ServiceBToken]);
  services3.addSingleton<IServiceF>(ServiceFToken, ServiceF, [ServiceCToken]); // ServiceF also uses ServiceC

  const provider3 = services3.buildServiceProvider();

  const serviceA3 = await provider3.getRequiredService<IServiceA>(ServiceAToken);
  const serviceF = await provider3.getRequiredService<IServiceF>(ServiceFToken);

  const serviceCFromA = serviceA3.getDependency().getDependency();
  const serviceCFromF = serviceF.getDependency();

  console.log(`ServiceC from ServiceA chain: ${serviceCFromA.getName()}`);
  console.log(`ServiceC from ServiceF: ${serviceCFromF.getName()}`);
  console.log(`Same ServiceC instance? ${serviceCFromA === serviceCFromF}`); // Should be true (singleton)

  console.log('\n--- Testing Transient Services ---\n');

  // Test with transient services
  const services4 = new ServiceCollection();
  services4.addTransient<IServiceD>(ServiceDToken, ServiceD);
  services4.addTransient<IServiceE>(ServiceEToken, ServiceE);
  services4.addTransient<IServiceC>(ServiceCToken, ServiceC, [ServiceDToken, ServiceEToken]);
  services4.addTransient<IServiceB>(ServiceBToken, ServiceB, [ServiceCToken]);
  services4.addTransient<IServiceA>(ServiceAToken, ServiceA, [ServiceBToken]);

  const provider4 = services4.buildServiceProvider();

  const transientA1 = await provider4.getRequiredService<IServiceA>(ServiceAToken);
  const transientA2 = await provider4.getRequiredService<IServiceA>(ServiceAToken);

  console.log(`Different ServiceA instances? ${transientA1 !== transientA2}`); // Should be true (transient)
  console.log(`TransientA1 name: ${transientA1.getName()}`);
  console.log(`TransientA2 name: ${transientA2.getName()}`);

  console.log('\n✅ Complex dependency chain is working correctly!');
}

main().catch(console.error);
```

## Expected Output

```
=== Complex Dependency Chain Example ===

--- Resolving ServiceA (top of chain) ---

[ServiceC] Initialized with ServiceD and ServiceE
[ServiceB] Initialized with ServiceC
[ServiceA] Initialized with ServiceB

--- Verifying Dependency Chain ---

ServiceA name: ServiceA
ServiceB name: ServiceB
ServiceC name: ServiceC
ServiceD name: ServiceD
ServiceE name: ServiceE

--- Testing Singleton Behavior ---

Same ServiceA instance? true
Same ServiceD instance? true
Same ServiceE instance? true

--- Testing Scoped Services ---

[ServiceC] Initialized with ServiceD and ServiceE
[ServiceB] Initialized with ServiceC
[ServiceA] Initialized with ServiceB
[ServiceC] Initialized with ServiceD and ServiceE
[ServiceB] Initialized with ServiceC
[ServiceA] Initialized with ServiceB
Different scopes, different ServiceA? true
Scope1 ServiceA name: ServiceA
Scope2 ServiceA name: ServiceA
Same scope, same ServiceB? true

--- Testing Shared Dependencies (ServiceC used in multiple places) ---

[ServiceC] Initialized with ServiceD and ServiceE
[ServiceB] Initialized with ServiceC
[ServiceA] Initialized with ServiceB
[ServiceF] Initialized with ServiceC
ServiceC from ServiceA chain: ServiceC
ServiceC from ServiceF: ServiceC
Same ServiceC instance? true

--- Testing Transient Services ---

[ServiceC] Initialized with ServiceD and ServiceE
[ServiceB] Initialized with ServiceC
[ServiceA] Initialized with ServiceB
[ServiceC] Initialized with ServiceD and ServiceE
[ServiceB] Initialized with ServiceC
[ServiceA] Initialized with ServiceB
Different ServiceA instances? true
TransientA1 name: ServiceA
TransientA2 name: ServiceA

✅ Complex dependency chain is working correctly!
```

## Run This Example

```bash
npx ts-node examples/15-complex-dependency-chain.ts
```

## Key Points

- **Deep Chains**: Supports deep dependency chains (ServiceA -> ServiceB -> ServiceC -> ServiceD, ServiceE)
- **Multiple Dependencies**: ServiceC depends on both ServiceD and ServiceE
- **Shared Dependencies**: Same service used in multiple places (ServiceC in ServiceB and ServiceF)
- **All Lifetimes**: Works with Singleton, Scoped, and Transient lifetimes
