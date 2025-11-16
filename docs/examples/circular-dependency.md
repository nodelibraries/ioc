# Circular Dependency Example

Demonstrates circular dependency resolution - singleton, scoped, and transient circular dependencies are all supported.

## Code

```typescript
import { ServiceCollection, ServiceProvider } from '@nodelibraries/ioc';

/**
 * Circular Dependency Example
 *
 * This example demonstrates circular dependency resolution.
 *
 * Features:
 * - Singleton circular dependencies: Full support for circular references
 * - Scoped circular dependencies: Works within the same scope
 * - Transient circular dependencies: Works within the same resolution call
 * - Resolution stack mechanism: How the container handles circular dependencies
 * - Instance verification: Verifying that circular references are correctly established
 */

const ServiceAToken = Symbol('ServiceA');
const ServiceBToken = Symbol('ServiceB');

class ServiceA {
  constructor(private serviceB: ServiceB) {}

  getName(): string {
    return 'ServiceA';
  }

  getServiceBName(): string {
    return this.serviceB.getName();
  }
}

class ServiceB {
  constructor(private serviceA: ServiceA) {}

  getName(): string {
    return 'ServiceB';
  }

  getServiceAName(): string {
    return this.serviceA.getName();
  }
}

async function testSingletonCircularDependency() {
  console.log('=== Testing Singleton Circular Dependency ===\n');

  const services = new ServiceCollection();

  // Register with circular dependency
  services.addSingleton(ServiceAToken, ServiceA, [ServiceBToken]);
  services.addSingleton(ServiceBToken, ServiceB, [ServiceAToken]);

  const provider = services.buildServiceProvider();

  try {
    const serviceA = await provider.getRequiredService<ServiceA>(ServiceAToken);
    const serviceB = await provider.getRequiredService<ServiceB>(ServiceBToken);

    console.log('✅ Circular dependency resolved successfully!');
    console.log('ServiceA name:', serviceA.getName());
    console.log('ServiceB name:', serviceB.getName());
    console.log('ServiceA -> ServiceB name:', serviceA.getServiceBName());
    console.log('ServiceB -> ServiceA name:', serviceB.getServiceAName());
    console.log('Same ServiceA instance?', serviceA === (await provider.getRequiredService<ServiceA>(ServiceAToken)));
    console.log('Same ServiceB instance?', serviceB === (await provider.getRequiredService<ServiceB>(ServiceBToken)));
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function testScopedCircularDependency() {
  console.log('\n=== Testing Scoped Circular Dependency ===\n');

  const services = new ServiceCollection();

  // Register with circular dependency
  services.addScoped(ServiceAToken, ServiceA, [ServiceBToken]);
  services.addScoped(ServiceBToken, ServiceB, [ServiceAToken]);

  const provider = services.buildServiceProvider();
  const scope = provider.createScope();

  try {
    const serviceA = await scope.getRequiredService<ServiceA>(ServiceAToken);
    const serviceB = await scope.getRequiredService<ServiceB>(ServiceBToken);

    console.log('✅ Circular dependency resolved successfully in scope!');
    console.log('ServiceA name:', serviceA.getName());
    console.log('ServiceB name:', serviceB.getName());
    console.log('ServiceA -> ServiceB name:', serviceA.getServiceBName());
    console.log('ServiceB -> ServiceA name:', serviceB.getServiceAName());
    console.log(
      'Same ServiceA instance in scope?',
      serviceA === (await scope.getRequiredService<ServiceA>(ServiceAToken)),
    );
    console.log(
      'Same ServiceB instance in scope?',
      serviceB === (await scope.getRequiredService<ServiceB>(ServiceBToken)),
    );

    await scope.dispose();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function testTransientCircularDependency() {
  console.log('\n=== Testing Transient Circular Dependency ===\n');

  const services = new ServiceCollection();

  // Register with circular dependency
  services.addTransient(ServiceAToken, ServiceA, [ServiceBToken]);
  services.addTransient(ServiceBToken, ServiceB, [ServiceAToken]);

  const provider = services.buildServiceProvider();

  try {
    const serviceA1 = await provider.getRequiredService<ServiceA>(ServiceAToken);
    const serviceB1 = await provider.getRequiredService<ServiceB>(ServiceBToken);

    console.log('✅ Circular dependency resolved successfully for transient services!');
    console.log('ServiceA1 name:', serviceA1.getName());
    console.log('ServiceB1 name:', serviceB1.getName());
    console.log('ServiceA1 -> ServiceB1 name:', serviceA1.getServiceBName());
    console.log('ServiceB1 -> ServiceA1 name:', serviceB1.getServiceAName());

    // Each call creates a new instance (transient behavior)
    const serviceA2 = await provider.getRequiredService<ServiceA>(ServiceAToken);
    const serviceB2 = await provider.getRequiredService<ServiceB>(ServiceBToken);

    console.log('\nTransient behavior check:');
    console.log('serviceA1 === serviceA2?', serviceA1 === serviceA2); // Should be false
    console.log('serviceB1 === serviceB2?', serviceB1 === serviceB2); // Should be false
    console.log('But within same resolution:');
    console.log('serviceA1.getServiceBName() works:', serviceA1.getServiceBName());
    console.log('serviceB1.getServiceAName() works:', serviceB1.getServiceAName());
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function testDetailedCircularDependency() {
  console.log('\n=== Detailed Circular Dependency Test ===\n');

  const services = new ServiceCollection();
  services.addSingleton(ServiceAToken, ServiceA, [ServiceBToken]);
  services.addSingleton(ServiceBToken, ServiceB, [ServiceAToken]);

  const provider = services.buildServiceProvider();

  try {
    // Only resolve ServiceA - ServiceB will be automatically resolved
    const serviceA = await provider.getRequiredService<ServiceA>(ServiceAToken);

    // Get ServiceB from inside ServiceA
    const serviceBFromA = (serviceA as any).serviceB;

    // Resolve ServiceB directly
    const serviceB = await provider.getRequiredService<ServiceB>(ServiceBToken);

    // Get ServiceA from inside ServiceB
    const serviceAFromB = (serviceB as any).serviceA;

    console.log('✅ Detailed test passed!');
    console.log('serviceA === serviceAFromB?', serviceA === serviceAFromB); // Should be true
    console.log('serviceB === serviceBFromA?', serviceB === serviceBFromA); // Should be true
    console.log('serviceA === serviceB.serviceA?', serviceA === serviceAFromB); // Should be true
    console.log('serviceB === serviceA.serviceB?', serviceB === serviceBFromA); // Should be true

    // Circular reference test
    console.log('\nCircular reference verification:');
    console.log('serviceA -> serviceB -> serviceA:', serviceA === serviceBFromA.serviceA); // Should be true
    console.log('serviceB -> serviceA -> serviceB:', serviceB === serviceAFromB.serviceB); // Should be true

    // Method calls work
    console.log('\nMethod calls work correctly:');
    console.log('serviceA.getServiceBName():', serviceA.getServiceBName());
    console.log('serviceB.getServiceAName():', serviceB.getServiceAName());
    console.log('serviceAFromB.getServiceBName():', serviceAFromB.getServiceBName());
    console.log('serviceBFromA.getServiceAName():', serviceBFromA.getServiceAName());
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

async function main() {
  await testSingletonCircularDependency();
  await testScopedCircularDependency();
  await testTransientCircularDependency();
  await testDetailedCircularDependency();
}

main().catch(console.error);
```

## Expected Output

```
=== Testing Singleton Circular Dependency ===

✅ Circular dependency resolved successfully!
ServiceA name: ServiceA
ServiceB name: ServiceB
ServiceA -> ServiceB name: ServiceB
ServiceB -> ServiceA name: ServiceA
Same ServiceA instance? true
Same ServiceB instance? true

=== Testing Scoped Circular Dependency ===

✅ Circular dependency resolved successfully in scope!
ServiceA name: ServiceA
ServiceB name: ServiceB
ServiceA -> ServiceB name: ServiceB
ServiceB -> ServiceA name: ServiceA
Same ServiceA instance in scope? true
Same ServiceB instance in scope? true

=== Testing Transient Circular Dependency ===

✅ Circular dependency resolved successfully for transient services!
ServiceA1 name: ServiceA
ServiceB1 name: ServiceB
ServiceA1 -> ServiceB1 name: ServiceB
ServiceB1 -> ServiceA1 name: ServiceA

Transient behavior check:
serviceA1 === serviceA2? false
serviceB1 === serviceB2? false
But within same resolution:
serviceA1.getServiceBName() works: ServiceB
serviceB1.getServiceAName() works: ServiceA

=== Detailed Circular Dependency Test ===

✅ Detailed test passed!
serviceA === serviceAFromB? true
serviceB === serviceBFromA? true
serviceA === serviceB.serviceA? true
serviceB === serviceA.serviceB? true

Circular reference verification:
serviceA -> serviceB -> serviceA: true
serviceB -> serviceA -> serviceB: true

Method calls work correctly:
serviceA.getServiceBName(): ServiceB
serviceB.getServiceAName(): ServiceA
serviceAFromB.getServiceBName(): ServiceB
serviceBFromA.getServiceAName(): ServiceA
```

## Run This Example

```bash
npx ts-node examples/14-circular-dependency.ts
```

## Key Points

- **Full Support**: Singleton, Scoped, and Transient circular dependencies all work
- **Automatic Resolution**: Container automatically handles circular references
- **Instance Verification**: Circular references are correctly established
- **Method Calls**: All method calls work correctly with circular dependencies
