/**
 * Circular Dependency Detection Example
 * 
 * Demonstrates how to detect and visualize circular dependencies
 */

import { ServiceCollection, ServiceProvider } from '@nodelibraries/ioc';

// Simple circular dependency: A -> B -> A
interface IServiceA {
  getB(): any;
}

interface IServiceB {
  getA(): any;
}

class ServiceA implements IServiceA {
  constructor(private serviceB: IServiceB) {}
  getB() {
    return this.serviceB;
  }
}

class ServiceB implements IServiceB {
  constructor(private serviceA: IServiceA) {}
  getA() {
    return this.serviceA;
  }
}

// Complex circular dependency: A -> B -> C -> A
interface IServiceC {
  getA(): any;
}

class ServiceC implements IServiceC {
  constructor(private serviceA: IServiceA) {}
  getA() {
    return this.serviceA;
  }
}

// Multiple circular dependencies
interface IServiceD {
  getE(): any;
}

interface IServiceE {
  getF(): any;
}

interface IServiceF {
  getD(): any;
}

class ServiceD implements IServiceD {
  constructor(private serviceE: IServiceE) {}
  getE() {
    return this.serviceE;
  }
}

class ServiceE implements IServiceE {
  constructor(private serviceF: IServiceF) {}
  getF() {
    return this.serviceF;
  }
}

class ServiceF implements IServiceF {
  constructor(private serviceD: IServiceD) {}
  getD() {
    return this.serviceD;
  }
}

async function main() {
  console.log('=== Circular Dependency Detection Example ===\n');

  // Example 1: Simple circular dependency (A -> B -> A)
  console.log('Example 1: Simple Circular Dependency (A -> B -> A)\n');
  const services1 = new ServiceCollection();
  const ServiceAToken1 = Symbol('ServiceA');
  const ServiceBToken1 = Symbol('ServiceB');

  services1.addSingleton<IServiceA>(ServiceAToken1, ServiceA, [ServiceBToken1]);
  services1.addSingleton<IServiceB>(ServiceBToken1, ServiceB, [ServiceAToken1]);

  console.log('Circular Dependencies:');
  console.log(services1.visualizeCircularDependencies());
  console.log('\n');

  const circularDeps1 = services1.getCircularDependencies();
  console.log('Circular Dependency Details:');
  circularDeps1.forEach((circular, index) => {
    console.log(`  ${index + 1}. Path: ${circular.tokens.map((t) => t.name).join(' → ')}`);
  });
  console.log('\n');

  // Example 2: Complex circular dependency (A -> B -> C -> A)
  console.log('Example 2: Complex Circular Dependency (A -> B -> C -> A)\n');
  const services2 = new ServiceCollection();
  const ServiceAToken2 = Symbol('ServiceA');
  const ServiceBToken2 = Symbol('ServiceB');
  const ServiceCToken2 = Symbol('ServiceC');

  services2.addSingleton<IServiceA>(ServiceAToken2, ServiceA, [ServiceBToken2]);
  services2.addSingleton<IServiceB>(ServiceBToken2, ServiceB, [ServiceCToken2]);
  services2.addSingleton<IServiceC>(ServiceCToken2, ServiceC, [ServiceAToken2]);

  console.log('Circular Dependencies:');
  console.log(services2.visualizeCircularDependencies());
  console.log('\n');

  // Example 3: Multiple circular dependencies
  console.log('Example 3: Multiple Circular Dependencies\n');
  const services3 = new ServiceCollection();
  const ServiceAToken3 = Symbol('ServiceA');
  const ServiceBToken3 = Symbol('ServiceB');
  const ServiceCToken3 = Symbol('ServiceC');
  const ServiceDToken3 = Symbol('ServiceD');
  const ServiceEToken3 = Symbol('ServiceE');
  const ServiceFToken3 = Symbol('ServiceF');

  // First cycle: A -> B -> C -> A
  services3.addSingleton<IServiceA>(ServiceAToken3, ServiceA, [ServiceBToken3]);
  services3.addSingleton<IServiceB>(ServiceBToken3, ServiceB, [ServiceCToken3]);
  services3.addSingleton<IServiceC>(ServiceCToken3, ServiceC, [ServiceAToken3]);

  // Second cycle: D -> E -> F -> D
  services3.addSingleton<IServiceD>(ServiceDToken3, ServiceD, [ServiceEToken3]);
  services3.addSingleton<IServiceE>(ServiceEToken3, ServiceE, [ServiceFToken3]);
  services3.addSingleton<IServiceF>(ServiceFToken3, ServiceF, [ServiceDToken3]);

  console.log('Circular Dependencies:');
  console.log(services3.visualizeCircularDependencies());
  console.log('\n');

  const circularDeps3 = services3.getCircularDependencies();
  console.log('All Circular Dependency Details:');
  circularDeps3.forEach((circular, index) => {
    console.log(`  ${index + 1}. Path: ${circular.tokens.map((t) => t.name).join(' → ')}`);
  });
  console.log('\n');

  // Example 4: No circular dependencies
  console.log('Example 4: No Circular Dependencies\n');
  const services4 = new ServiceCollection();
  const ILoggerToken = Symbol('ILogger');
  const IConfigToken = Symbol('IConfig');
  const IDatabaseToken = Symbol('IDatabase');

  class Logger {
    log(message: string) {
      console.log(message);
    }
  }

  class Config {
    get(key: string): string {
      return `value-${key}`;
    }
  }

  class Database {
    constructor(private config: any) {}
    connect() {
      console.log('Connected');
    }
  }

  services4.addSingleton(ILoggerToken, Logger);
  services4.addSingleton(IConfigToken, Config);
  services4.addSingleton(IDatabaseToken, Database, [IConfigToken]);

  console.log('Circular Dependencies:');
  console.log(services4.visualizeCircularDependencies());
  console.log('\n');

  // Example 5: Verify circular dependencies still work at runtime
  console.log('Example 5: Runtime Verification (Circular Dependencies Still Work)\n');
  const provider = services1.buildServiceProvider();
  try {
    const serviceA = await provider.getRequiredService<IServiceA>(ServiceAToken1);
    const serviceB = serviceA.getB();
    const serviceA2 = serviceB.getA();

    console.log('✅ Circular dependency resolved successfully!');
    console.log(`ServiceA instance: ${serviceA.constructor.name}`);
    console.log(`ServiceB instance: ${serviceB.constructor.name}`);
    console.log(`ServiceA === ServiceA2: ${serviceA === serviceA2}`);
    console.log(`ServiceA.getB() === ServiceB: ${serviceA.getB() === serviceB}`);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

main().catch(console.error);

/* Expected Output:

=== Circular Dependency Detection Example ===

Example 1: Simple Circular Dependency (A -> B -> A)

Circular Dependencies:
Found 1 circular dependency/ies:

Circular Dependency 1:
  Symbol(ServiceA) → Symbol(ServiceB) → Symbol(ServiceA)



Circular Dependency Details:
  1. Path: Symbol(ServiceA) → Symbol(ServiceB) → Symbol(ServiceA)


Example 2: Complex Circular Dependency (A -> B -> C -> A)

Circular Dependencies:
Found 1 circular dependency/ies:

Circular Dependency 1:
  Symbol(ServiceA) → Symbol(ServiceB) → Symbol(ServiceC) → Symbol(ServiceA)



Example 3: Multiple Circular Dependencies

Circular Dependencies:
Found 2 circular dependency/ies:

Circular Dependency 1:
  Symbol(ServiceA) → Symbol(ServiceB) → Symbol(ServiceC) → Symbol(ServiceA)

Circular Dependency 2:
  Symbol(ServiceD) → Symbol(ServiceE) → Symbol(ServiceF) → Symbol(ServiceD)



All Circular Dependency Details:
  1. Path: Symbol(ServiceA) → Symbol(ServiceB) → Symbol(ServiceC) → Symbol(ServiceA)
  2. Path: Symbol(ServiceD) → Symbol(ServiceE) → Symbol(ServiceF) → Symbol(ServiceD)


Example 4: No Circular Dependencies

Circular Dependencies:
No circular dependencies found.


Example 5: Runtime Verification (Circular Dependencies Still Work)

✅ Circular dependency resolved successfully!
ServiceA instance: ServiceA
ServiceB instance: ServiceB
ServiceA === ServiceA2: true
ServiceA.getB() === ServiceB: true

*/

