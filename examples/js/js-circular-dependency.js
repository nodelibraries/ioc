/**
 * JavaScript Circular Dependency Example
 * 
 * Demonstrates circular dependency resolution in JavaScript:
 * - Singleton circular dependencies
 * - Scoped circular dependencies
 * - Transient circular dependencies
 */

const { ServiceCollection, ServiceProvider } = require('../../dist/index.js');

// Define services with circular dependencies
class ServiceA {
  constructor(serviceB) {
    if (!serviceB) {
      throw new TypeError('ServiceA requires ServiceB');
    }
    this.serviceB = serviceB;
  }

  getName() {
    return 'ServiceA';
  }

  getServiceBName() {
    return this.serviceB.getName();
  }
}

class ServiceB {
  constructor(serviceA) {
    if (!serviceA) {
      throw new TypeError('ServiceB requires ServiceA');
    }
    this.serviceA = serviceA;
  }

  getName() {
    return 'ServiceB';
  }

  getServiceAName() {
    return this.serviceA.getName();
  }
}

// Setup container
const services = new ServiceCollection();

// Create tokens
const ServiceAToken = Symbol('ServiceA');
const ServiceBToken = Symbol('ServiceB');

// Register services with circular dependency
services.addSingleton(ServiceAToken, ServiceA, [ServiceBToken]);
services.addSingleton(ServiceBToken, ServiceB, [ServiceAToken]);

// Build provider
const provider = services.buildServiceProvider();

// Use services
(async () => {
  try {
    console.log('=== Singleton Circular Dependency ===');
    const serviceA = await provider.getRequiredService(ServiceAToken);
    const serviceB = await provider.getRequiredService(ServiceBToken);

    console.log(`ServiceA name: ${serviceA.getName()}`);
    console.log(`ServiceB name: ${serviceB.getName()}`);
    console.log(`ServiceA -> ServiceB: ${serviceA.getServiceBName()}`);
    console.log(`ServiceB -> ServiceA: ${serviceB.getServiceAName()}`);

    // Verify they reference each other
    console.log(`\nServiceA.serviceB === ServiceB: ${serviceA.serviceB === serviceB}`);
    console.log(`ServiceB.serviceA === ServiceA: ${serviceB.serviceA === serviceA}`);

    // Verify singleton behavior
    const serviceA2 = await provider.getRequiredService(ServiceAToken);
    console.log(`\nServiceA === ServiceA2 (singleton): ${serviceA === serviceA2}`);

    console.log('\n=== Scoped Circular Dependency ===');
    const scopedServices = new ServiceCollection();
    scopedServices.addScoped(ServiceAToken, ServiceA, [ServiceBToken]);
    scopedServices.addScoped(ServiceBToken, ServiceB, [ServiceAToken]);
    const scopedProvider = scopedServices.buildServiceProvider();

    const scope1 = scopedProvider.createScope();
    const scope2 = scopedProvider.createScope();

    const scopedA1 = await scope1.getRequiredService(ServiceAToken);
    const scopedB1 = await scope1.getRequiredService(ServiceBToken);
    const scopedA2 = await scope2.getRequiredService(ServiceAToken);
    const scopedB2 = await scope2.getRequiredService(ServiceBToken);

    console.log(`Scope1 - ServiceA name: ${scopedA1.getName()}`);
    console.log(`Scope1 - ServiceB name: ${scopedB1.getName()}`);
    console.log(`Scope2 - ServiceA name: ${scopedA2.getName()}`);
    console.log(`Scope2 - ServiceB name: ${scopedB2.getName()}`);

    // Verify scoped behavior
    console.log(`\nScope1 ServiceA === Scope2 ServiceA: ${scopedA1 === scopedA2}`);
    console.log(`Scope1 ServiceB === Scope2 ServiceB: ${scopedB1 === scopedB2}`);
    console.log(`Scope1 ServiceA.serviceB === Scope1 ServiceB: ${scopedA1.serviceB === scopedB1}`);

    await scope1.dispose();
    await scope2.dispose();

    console.log('\n=== Transient Circular Dependency ===');
    const transientServices = new ServiceCollection();
    transientServices.addTransient(ServiceAToken, ServiceA, [ServiceBToken]);
    transientServices.addTransient(ServiceBToken, ServiceB, [ServiceAToken]);
    const transientProvider = transientServices.buildServiceProvider();

    const transientA1 = await transientProvider.getRequiredService(ServiceAToken);
    const transientA2 = await transientProvider.getRequiredService(ServiceAToken);

    console.log(`TransientA1 name: ${transientA1.getName()}`);
    console.log(`TransientA2 name: ${transientA2.getName()}`);
    console.log(`TransientA1 === TransientA2: ${transientA1 === transientA2}`);
    console.log(`TransientA1.serviceB === TransientA2.serviceB: ${transientA1.serviceB === transientA2.serviceB}`);

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
})();

/* Expected Console Output:

=== Singleton Circular Dependency ===
ServiceA name: ServiceA
ServiceB name: ServiceB
ServiceA -> ServiceB: ServiceB
ServiceB -> ServiceA: ServiceA

ServiceA.serviceB === ServiceB: true
ServiceB.serviceA === ServiceA: true

ServiceA === ServiceA2 (singleton): true

=== Scoped Circular Dependency ===
Scope1 - ServiceA name: ServiceA
Scope1 - ServiceB name: ServiceB
Scope2 - ServiceA name: ServiceA
Scope2 - ServiceB name: ServiceB

Scope1 ServiceA === Scope2 ServiceA: false
Scope1 ServiceB === Scope2 ServiceB: false
Scope1 ServiceA.serviceB === Scope1 ServiceB: true

=== Transient Circular Dependency ===
TransientA1 name: ServiceA
TransientA2 name: ServiceA
TransientA1 === TransientA2: false
TransientA1.serviceB === TransientA2.serviceB: false

*/

