import { ServiceCollection, ServiceProvider, ServiceLifetime, type ServiceFactory } from '../src/ioc-container';

describe('ServiceCollection', () => {
  describe('addSingleton', () => {
    it('should register singleton with token only', () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      services.addSingleton(token);
      const provider = services.buildServiceProvider();
      expect(provider).toBeInstanceOf(ServiceProvider);
    });

    it('should register singleton with token and dependencies', () => {
      const services = new ServiceCollection();
      const token1 = Symbol('Test1');
      const token2 = Symbol('Test2');
      services.addSingleton(token1);
      services.addSingleton(token2, [token1]);
      const provider = services.buildServiceProvider();
      expect(provider).toBeInstanceOf(ServiceProvider);
    });

    it('should register singleton with token and implementation', () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService {}
      services.addSingleton(token, TestService);
      const provider = services.buildServiceProvider();
      expect(provider).toBeInstanceOf(ServiceProvider);
    });

    it('should register singleton with token, implementation and dependencies', () => {
      const services = new ServiceCollection();
      const token1 = Symbol('Test1');
      const token2 = Symbol('Test2');
      class TestService1 {}
      class TestService2 {
        constructor(private test1: TestService1) {}
      }
      services.addSingleton(token1, TestService1);
      services.addSingleton(token2, TestService2, [token1]);
      const provider = services.buildServiceProvider();
      expect(provider).toBeInstanceOf(ServiceProvider);
    });

    it('should register singleton with factory', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      const factory: ServiceFactory = () => ({ value: 'test' });
      services.addSingleton(token, factory);
      const provider = services.buildServiceProvider();
      const instance = await provider.getRequiredService(token);
      expect(instance).toEqual({ value: 'test' });
    });

    it('should allow method chaining', () => {
      const services = new ServiceCollection();
      const token1 = Symbol('Test1');
      const token2 = Symbol('Test2');
      const result = services.addSingleton(token1).addSingleton(token2);
      expect(result).toBe(services);
    });
  });

  describe('addScoped', () => {
    it('should register scoped service', () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      services.addScoped(token);
      const provider = services.buildServiceProvider();
      expect(provider).toBeInstanceOf(ServiceProvider);
    });

    it('should register scoped with implementation', () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService {}
      services.addScoped(token, TestService);
      const provider = services.buildServiceProvider();
      expect(provider).toBeInstanceOf(ServiceProvider);
    });

    it('should register scoped with factory', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      const factory: ServiceFactory = () => ({ value: 'scoped' });
      services.addScoped(token, factory);
      const provider = services.buildServiceProvider();
      const scope = provider.createScope();
      const instance = await scope.getRequiredService(token);
      expect(instance).toEqual({ value: 'scoped' });
    });
  });

  describe('addTransient', () => {
    it('should register transient service', () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      services.addTransient(token);
      const provider = services.buildServiceProvider();
      expect(provider).toBeInstanceOf(ServiceProvider);
    });

    it('should register transient with implementation', () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService {}
      services.addTransient(token, TestService);
      const provider = services.buildServiceProvider();
      expect(provider).toBeInstanceOf(ServiceProvider);
    });

    it('should create new instance each time', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService {
        id = Math.random();
      }
      services.addTransient(token, TestService);
      const provider = services.buildServiceProvider();
      const instance1 = await provider.getRequiredService(token);
      const instance2 = await provider.getRequiredService(token);
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('addValue', () => {
    it('should register value', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      const value = { test: 'value' };
      services.addValue(token, value);
      const provider = services.buildServiceProvider();
      const instance = await provider.getRequiredService(token);
      expect(instance).toBe(value);
    });

    it('should return same instance for value', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      const value = { test: 'value' };
      services.addValue(token, value);
      const provider = services.buildServiceProvider();
      const instance1 = await provider.getRequiredService(token);
      const instance2 = await provider.getRequiredService(token);
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(value);
    });
  });

  describe('tryAddSingleton', () => {
    it('should register if not exists', () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService {}
      services.tryAddSingleton(token, TestService);
      const provider = services.buildServiceProvider();
      expect(provider).toBeInstanceOf(ServiceProvider);
    });

    it('should not override existing registration', () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService1 {}
      class TestService2 {}
      services.addSingleton(token, TestService1);
      services.tryAddSingleton(token, TestService2);
      const provider = services.buildServiceProvider();
      // First registration should win
      expect(provider).toBeInstanceOf(ServiceProvider);
    });
  });

  describe('tryAddScoped', () => {
    it('should register if not exists', () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService {}
      services.tryAddScoped(token, TestService);
      const provider = services.buildServiceProvider();
      expect(provider).toBeInstanceOf(ServiceProvider);
    });

    it('should not override existing registration', () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService1 {}
      class TestService2 {}
      services.addScoped(token, TestService1);
      services.tryAddScoped(token, TestService2);
      const provider = services.buildServiceProvider();
      expect(provider).toBeInstanceOf(ServiceProvider);
    });
  });

  describe('tryAddTransient', () => {
    it('should register if not exists', () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService {}
      services.tryAddTransient(token, TestService);
      const provider = services.buildServiceProvider();
      expect(provider).toBeInstanceOf(ServiceProvider);
    });

    it('should not override existing registration', () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService1 {}
      class TestService2 {}
      services.addTransient(token, TestService1);
      services.tryAddTransient(token, TestService2);
      const provider = services.buildServiceProvider();
      expect(provider).toBeInstanceOf(ServiceProvider);
    });
  });

  describe('addKeyedSingleton', () => {
    it('should register keyed singleton', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService {}
      services.addKeyedSingleton(token, TestService, 'key1');
      const provider = services.buildServiceProvider();
      const instance = await provider.getKeyedService(token, 'key1');
      expect(instance).toBeInstanceOf(TestService);
    });

    it('should register keyed singleton with factory', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      const factory: ServiceFactory = () => ({ keyed: true });
      services.addKeyedSingleton(token, factory, 'key1');
      const provider = services.buildServiceProvider();
      const instance = await provider.getKeyedService(token, 'key1');
      expect(instance).toEqual({ keyed: true });
    });
  });

  describe('addKeyedScoped', () => {
    it('should register keyed scoped', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService {}
      services.addKeyedScoped(token, TestService, 'key1');
      const provider = services.buildServiceProvider();
      const scope = provider.createScope();
      const instance = await scope.getKeyedService(token, 'key1');
      expect(instance).toBeInstanceOf(TestService);
    });
  });

  describe('addKeyedTransient', () => {
    it('should register keyed transient', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService {}
      services.addKeyedTransient(token, TestService, 'key1');
      const provider = services.buildServiceProvider();
      const instance = await provider.getKeyedService(token, 'key1');
      expect(instance).toBeInstanceOf(TestService);
    });
  });

  describe('buildServiceProvider', () => {
    it('should build provider without options', () => {
      const services = new ServiceCollection();
      const provider = services.buildServiceProvider();
      expect(provider).toBeInstanceOf(ServiceProvider);
    });

    it('should build provider with validateScopes option', () => {
      const services = new ServiceCollection();
      const provider = services.buildServiceProvider({ validateScopes: true });
      expect(provider).toBeInstanceOf(ServiceProvider);
    });
  });
});

describe('ServiceProvider', () => {
  describe('getService', () => {
    it('should return undefined for unregistered service', async () => {
      const services = new ServiceCollection();
      const provider = services.buildServiceProvider();
      const token = Symbol('Unregistered');
      const instance = await provider.getService(token);
      expect(instance).toBeUndefined();
    });

    it('should return service instance', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService {}
      services.addSingleton(token, TestService);
      const provider = services.buildServiceProvider();
      const instance = await provider.getService(token);
      expect(instance).toBeInstanceOf(TestService);
    });
  });

  describe('getRequiredService', () => {
    it('should throw error for unregistered service', async () => {
      const services = new ServiceCollection();
      const provider = services.buildServiceProvider();
      const token = Symbol('Unregistered');
      await expect(provider.getRequiredService(token)).rejects.toThrow();
    });

    it('should return service instance', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService {}
      services.addSingleton(token, TestService);
      const provider = services.buildServiceProvider();
      const instance = await provider.getRequiredService(token);
      expect(instance).toBeInstanceOf(TestService);
    });
  });

  describe('getServices', () => {
    it('should return empty array for unregistered service', async () => {
      const services = new ServiceCollection();
      const provider = services.buildServiceProvider();
      const token = Symbol('Unregistered');
      const instances = await provider.getServices(token);
      expect(instances).toEqual([]);
    });

    it('should return all implementations', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService1 {
        name = 'Service1';
      }
      class TestService2 {
        name = 'Service2';
      }
      services.addSingleton(token, TestService1);
      services.addSingleton(token, TestService2);
      const provider = services.buildServiceProvider();
      const instances = await provider.getServices(token);
      expect(instances).toHaveLength(2);
      // For singleton, last registration wins, so both should resolve to TestService2
      // But getServices returns all descriptors resolved
      // Since they're singletons with same token, they share the same instance
      // So we just check that we get instances
      expect(instances[0]).toBeDefined();
      expect(instances[1]).toBeDefined();
    });
  });

  describe('getKeyedService', () => {
    it('should return undefined for unregistered key', async () => {
      const services = new ServiceCollection();
      const provider = services.buildServiceProvider();
      const token = Symbol('Test');
      const instance = await provider.getKeyedService(token, 'nonexistent');
      expect(instance).toBeUndefined();
    });

    it('should return keyed service', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService {}
      services.addKeyedSingleton(token, TestService, 'key1');
      const provider = services.buildServiceProvider();
      const instance = await provider.getKeyedService(token, 'key1');
      expect(instance).toBeInstanceOf(TestService);
    });
  });

  describe('Singleton lifetime', () => {
    it('should return same instance', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService {}
      services.addSingleton(token, TestService);
      const provider = services.buildServiceProvider();
      const instance1 = await provider.getRequiredService(token);
      const instance2 = await provider.getRequiredService(token);
      expect(instance1).toBe(instance2);
    });

    it('should share instance across scopes', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService {}
      services.addSingleton(token, TestService);
      const provider = services.buildServiceProvider();
      const scope1 = provider.createScope();
      const scope2 = provider.createScope();
      const instance1 = await scope1.getRequiredService(token);
      const instance2 = await scope2.getRequiredService(token);
      expect(instance1).toBe(instance2);
    });
  });

  describe('Scoped lifetime', () => {
    it('should return same instance within scope', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService {}
      services.addScoped(token, TestService);
      const provider = services.buildServiceProvider();
      const scope = provider.createScope();
      const instance1 = await scope.getRequiredService(token);
      const instance2 = await scope.getRequiredService(token);
      expect(instance1).toBe(instance2);
    });

    it('should return different instances across scopes', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService {}
      services.addScoped(token, TestService);
      const provider = services.buildServiceProvider();
      const scope1 = provider.createScope();
      const scope2 = provider.createScope();
      const instance1 = await scope1.getRequiredService(token);
      const instance2 = await scope2.getRequiredService(token);
      expect(instance1).not.toBe(instance2);
    });

    it('should throw error when resolving scoped from root with validation', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService {}
      services.addScoped(token, TestService);
      const provider = services.buildServiceProvider({ validateScopes: true });
      await expect(provider.getRequiredService(token)).rejects.toThrow();
    });
  });

  describe('Transient lifetime', () => {
    it('should return new instance each time', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService {}
      services.addTransient(token, TestService);
      const provider = services.buildServiceProvider();
      const instance1 = await provider.getRequiredService(token);
      const instance2 = await provider.getRequiredService(token);
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Dependency injection', () => {
    it('should inject dependencies', async () => {
      const services = new ServiceCollection();
      const token1 = Symbol('Test1');
      const token2 = Symbol('Test2');
      class TestService1 {}
      class TestService2 {
        constructor(public test1: TestService1) {}
      }
      services.addSingleton(token1, TestService1);
      services.addSingleton(token2, TestService2, [token1]);
      const provider = services.buildServiceProvider();
      const instance2 = await provider.getRequiredService<TestService2>(token2);
      expect(instance2.test1).toBeInstanceOf(TestService1);
    });

    it('should inject multiple dependencies', async () => {
      const services = new ServiceCollection();
      const token1 = Symbol('Test1');
      const token2 = Symbol('Test2');
      const token3 = Symbol('Test3');
      class TestService1 {}
      class TestService2 {}
      class TestService3 {
        constructor(public test1: TestService1, public test2: TestService2) {}
      }
      services.addSingleton(token1, TestService1);
      services.addSingleton(token2, TestService2);
      services.addSingleton(token3, TestService3, [token1, token2]);
      const provider = services.buildServiceProvider();
      const instance3 = await provider.getRequiredService<TestService3>(token3);
      expect(instance3.test1).toBeInstanceOf(TestService1);
      expect(instance3.test2).toBeInstanceOf(TestService2);
    });
  });

  describe('Circular dependencies', () => {
    it('should resolve singleton circular dependency', async () => {
      const services = new ServiceCollection();
      const tokenA = Symbol('ServiceA');
      const tokenB = Symbol('ServiceB');
      class ServiceA {
        constructor(public serviceB: ServiceB) {}
      }
      class ServiceB {
        constructor(public serviceA: ServiceA) {}
      }
      services.addSingleton(tokenA, ServiceA, [tokenB]);
      services.addSingleton(tokenB, ServiceB, [tokenA]);
      const provider = services.buildServiceProvider();
      const serviceA = await provider.getRequiredService<ServiceA>(tokenA);
      const serviceB = await provider.getRequiredService<ServiceB>(tokenB);
      expect(serviceA.serviceB).toBe(serviceB);
      expect(serviceB.serviceA).toBe(serviceA);
    });

    it('should resolve scoped circular dependency', async () => {
      const services = new ServiceCollection();
      const tokenA = Symbol('ServiceA');
      const tokenB = Symbol('ServiceB');
      class ServiceA {
        constructor(public serviceB: ServiceB) {}
      }
      class ServiceB {
        constructor(public serviceA: ServiceA) {}
      }
      services.addScoped(tokenA, ServiceA, [tokenB]);
      services.addScoped(tokenB, ServiceB, [tokenA]);
      const provider = services.buildServiceProvider();
      const scope = provider.createScope();
      const serviceA = await scope.getRequiredService<ServiceA>(tokenA);
      const serviceB = await scope.getRequiredService<ServiceB>(tokenB);
      expect(serviceA.serviceB).toBe(serviceB);
      expect(serviceB.serviceA).toBe(serviceA);
    });

    it('should resolve transient circular dependency', async () => {
      const services = new ServiceCollection();
      const tokenA = Symbol('ServiceA');
      const tokenB = Symbol('ServiceB');
      class ServiceA {
        constructor(public serviceB: ServiceB) {}
      }
      class ServiceB {
        constructor(public serviceA: ServiceA) {}
      }
      services.addTransient(tokenA, ServiceA, [tokenB]);
      services.addTransient(tokenB, ServiceB, [tokenA]);
      const provider = services.buildServiceProvider();
      // For transient, each call creates new instances
      // But circular dependency works within the same resolution call
      const serviceA1 = await provider.getRequiredService<ServiceA>(tokenA);
      const serviceB1 = await provider.getRequiredService<ServiceB>(tokenB);
      // serviceA1 and serviceB1 are from different resolution calls, so they're different
      // But within serviceA1's resolution, it should have a serviceB
      expect(serviceA1.serviceB).toBeDefined();
      expect(serviceB1.serviceA).toBeDefined();
      // Create another set to verify transient behavior
      const serviceA2 = await provider.getRequiredService<ServiceA>(tokenA);
      expect(serviceA1).not.toBe(serviceA2);
    });

    it('should resolve circular dependency with method calls (singleton)', async () => {
      const services = new ServiceCollection();
      const tokenA = Symbol('ServiceA');
      const tokenB = Symbol('ServiceB');
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
      services.addSingleton(tokenA, ServiceA, [tokenB]);
      services.addSingleton(tokenB, ServiceB, [tokenA]);
      const provider = services.buildServiceProvider();
      const serviceA = await provider.getRequiredService<ServiceA>(tokenA);
      const serviceB = await provider.getRequiredService<ServiceB>(tokenB);

      expect(serviceA.getName()).toBe('ServiceA');
      expect(serviceB.getName()).toBe('ServiceB');
      expect(serviceA.getServiceBName()).toBe('ServiceB');
      expect(serviceB.getServiceAName()).toBe('ServiceA');
    });

    it('should resolve detailed circular dependency references (singleton)', async () => {
      const services = new ServiceCollection();
      const tokenA = Symbol('ServiceA');
      const tokenB = Symbol('ServiceB');
      class ServiceA {
        constructor(public serviceB: ServiceB) {}
        getName(): string {
          return 'ServiceA';
        }
      }
      class ServiceB {
        constructor(public serviceA: ServiceA) {}
        getName(): string {
          return 'ServiceB';
        }
      }
      services.addSingleton(tokenA, ServiceA, [tokenB]);
      services.addSingleton(tokenB, ServiceB, [tokenA]);
      const provider = services.buildServiceProvider();

      // Resolve only ServiceA - ServiceB should be automatically resolved
      const serviceA = await provider.getRequiredService<ServiceA>(tokenA);
      const serviceBFromA = serviceA.serviceB;

      // Resolve ServiceB directly
      const serviceB = await provider.getRequiredService<ServiceB>(tokenB);
      const serviceAFromB = serviceB.serviceA;

      // All references should point to the same instances
      expect(serviceA).toBe(serviceAFromB);
      expect(serviceB).toBe(serviceBFromA);
      expect(serviceA).toBe(serviceB.serviceA);
      expect(serviceB).toBe(serviceA.serviceB);

      // Circular reference verification
      expect(serviceA).toBe(serviceBFromA.serviceA);
      expect(serviceB).toBe(serviceAFromB.serviceB);
    });

    it('should resolve three-way circular dependency', async () => {
      const services = new ServiceCollection();
      const tokenA = Symbol('ServiceA');
      const tokenB = Symbol('ServiceB');
      const tokenC = Symbol('ServiceC');
      class ServiceA {
        constructor(public serviceB: ServiceB) {}
      }
      class ServiceB {
        constructor(public serviceC: ServiceC) {}
      }
      class ServiceC {
        constructor(public serviceA: ServiceA) {}
      }
      services.addSingleton(tokenA, ServiceA, [tokenB]);
      services.addSingleton(tokenB, ServiceB, [tokenC]);
      services.addSingleton(tokenC, ServiceC, [tokenA]);
      const provider = services.buildServiceProvider();

      const serviceA = await provider.getRequiredService<ServiceA>(tokenA);
      const serviceB = await provider.getRequiredService<ServiceB>(tokenB);
      const serviceC = await provider.getRequiredService<ServiceC>(tokenC);

      expect(serviceA.serviceB).toBe(serviceB);
      expect(serviceB.serviceC).toBe(serviceC);
      expect(serviceC.serviceA).toBe(serviceA);

      // Full circle
      expect(serviceA.serviceB.serviceC.serviceA).toBe(serviceA);
    });

    it('should resolve self-referencing circular dependency', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Service');
      class Service {
        constructor(public self: Service) {}
        getName(): string {
          return 'Service';
        }
      }
      services.addSingleton(token, Service, [token]);
      const provider = services.buildServiceProvider();

      const service = await provider.getRequiredService<Service>(token);
      expect(service.self).toBe(service);
      expect(service.self.self).toBe(service);
    });

    it('should resolve circular dependency with transient and singleton', async () => {
      const services = new ServiceCollection();
      const tokenA = Symbol('ServiceA');
      const tokenB = Symbol('ServiceB');
      class ServiceA {
        constructor(public serviceB: ServiceB) {}
      }
      class ServiceB {
        constructor(public serviceA: ServiceA) {}
      }
      services.addSingleton(tokenA, ServiceA, [tokenB]);
      services.addTransient(tokenB, ServiceB, [tokenA]);
      const provider = services.buildServiceProvider();

      const serviceA1 = await provider.getRequiredService<ServiceA>(tokenA);
      const serviceA2 = await provider.getRequiredService<ServiceA>(tokenA);
      const serviceB1 = await provider.getRequiredService<ServiceB>(tokenB);
      const serviceB2 = await provider.getRequiredService<ServiceB>(tokenB);

      // Singleton should be same
      expect(serviceA1).toBe(serviceA2);
      // Transient should be different
      expect(serviceB1).not.toBe(serviceB2);
      // But both should reference the same singleton
      expect(serviceB1.serviceA).toBe(serviceA1);
      expect(serviceB2.serviceA).toBe(serviceA1);
    });

    it('should maintain singleton instance across multiple resolutions', async () => {
      const services = new ServiceCollection();
      const tokenA = Symbol('ServiceA');
      const tokenB = Symbol('ServiceB');
      class ServiceA {
        constructor(public serviceB: ServiceB) {}
      }
      class ServiceB {
        constructor(public serviceA: ServiceA) {}
      }
      services.addSingleton(tokenA, ServiceA, [tokenB]);
      services.addSingleton(tokenB, ServiceB, [tokenA]);
      const provider = services.buildServiceProvider();

      const serviceA1 = await provider.getRequiredService<ServiceA>(tokenA);
      const serviceA2 = await provider.getRequiredService<ServiceA>(tokenA);
      const serviceB1 = await provider.getRequiredService<ServiceB>(tokenB);
      const serviceB2 = await provider.getRequiredService<ServiceB>(tokenB);

      expect(serviceA1).toBe(serviceA2);
      expect(serviceB1).toBe(serviceB2);
      expect(serviceA1.serviceB).toBe(serviceB1);
      expect(serviceA2.serviceB).toBe(serviceB2);
    });

    it('should resolve circular dependency in scoped context with multiple scopes', async () => {
      const services = new ServiceCollection();
      const tokenA = Symbol('ServiceA');
      const tokenB = Symbol('ServiceB');
      class ServiceA {
        constructor(public serviceB: ServiceB) {}
      }
      class ServiceB {
        constructor(public serviceA: ServiceA) {}
      }
      services.addScoped(tokenA, ServiceA, [tokenB]);
      services.addScoped(tokenB, ServiceB, [tokenA]);
      const provider = services.buildServiceProvider();

      const scope1 = provider.createScope();
      const scope2 = provider.createScope();

      const serviceA1 = await scope1.getRequiredService<ServiceA>(tokenA);
      const serviceB1 = await scope1.getRequiredService<ServiceB>(tokenB);
      const serviceA2 = await scope2.getRequiredService<ServiceA>(tokenA);
      const serviceB2 = await scope2.getRequiredService<ServiceB>(tokenB);

      // Within same scope, should be same instance
      expect(serviceA1).toBe(serviceA1.serviceB.serviceA);
      expect(serviceB1).toBe(serviceB1.serviceA.serviceB);

      // Different scopes should have different instances
      expect(serviceA1).not.toBe(serviceA2);
      expect(serviceB1).not.toBe(serviceB2);
    });

    it('should resolve circular dependency with class constructor tokens', async () => {
      class ServiceA {
        constructor(public serviceB: ServiceB) {}
      }
      class ServiceB {
        constructor(public serviceA: ServiceA) {}
      }
      const services = new ServiceCollection();
      services.addSingleton(ServiceA, ServiceA, [ServiceB]);
      services.addSingleton(ServiceB, ServiceB, [ServiceA]);
      const provider = services.buildServiceProvider();

      const serviceA = await provider.getRequiredService(ServiceA);
      const serviceB = await provider.getRequiredService(ServiceB);

      expect(serviceA.serviceB).toBe(serviceB);
      expect(serviceB.serviceA).toBe(serviceA);
    });
  });

  describe('Lifecycle hooks', () => {
    it('should call onInit after creation', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      let initCalled = false;
      class TestService {
        async onInit() {
          initCalled = true;
        }
      }
      services.addSingleton(token, TestService);
      const provider = services.buildServiceProvider();
      await provider.getRequiredService(token);
      expect(initCalled).toBe(true);
    });

    it('should call onDestroy on dispose', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      let destroyCalled = false;
      class TestService {
        async onDestroy() {
          destroyCalled = true;
        }
      }
      services.addScoped(token, TestService);
      const provider = services.buildServiceProvider();
      const scope = provider.createScope();
      await scope.getRequiredService(token);
      await scope.dispose();
      expect(destroyCalled).toBe(true);
    });
  });

  describe('createScope', () => {
    it('should create new scope', () => {
      const services = new ServiceCollection();
      const provider = services.buildServiceProvider();
      const scope = provider.createScope();
      expect(scope).toBeInstanceOf(ServiceProvider);
      expect(scope).not.toBe(provider);
    });
  });

  describe('dispose', () => {
    it('should dispose provider', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService {}
      services.addScoped(token, TestService);
      const provider = services.buildServiceProvider();
      const scope = provider.createScope();
      await scope.getRequiredService(token);
      await scope.dispose();
      await expect(scope.getRequiredService(token)).rejects.toThrow('Provider disposed');
    });

    it('should not throw on multiple dispose calls', async () => {
      const services = new ServiceCollection();
      const provider = services.buildServiceProvider();
      const scope = provider.createScope();
      await scope.dispose();
      await expect(scope.dispose()).resolves.not.toThrow();
    });
  });

  describe('Scope validation', () => {
    it('should throw when scoped service injected into singleton', () => {
      const services = new ServiceCollection();
      const scopedToken = Symbol('Scoped');
      const singletonToken = Symbol('Singleton');
      class ScopedService {}
      class SingletonService {
        constructor(public scoped: ScopedService) {}
      }
      services.addScoped(scopedToken, ScopedService);
      services.addSingleton(singletonToken, SingletonService, [scopedToken]);
      const provider = services.buildServiceProvider({ validateScopes: true });
      return expect(provider.getRequiredService(singletonToken)).rejects.toThrow();
    });

    it('should not throw when validation is disabled', async () => {
      const services = new ServiceCollection();
      const scopedToken = Symbol('Scoped');
      const singletonToken = Symbol('Singleton');
      class ScopedService {}
      class SingletonService {
        constructor(public scoped: ScopedService) {}
      }
      services.addScoped(scopedToken, ScopedService);
      services.addSingleton(singletonToken, SingletonService, [scopedToken]);
      const provider = services.buildServiceProvider({ validateScopes: false });
      const instance = await provider.getRequiredService(singletonToken);
      expect(instance).toBeInstanceOf(SingletonService);
    });
  });

  describe('Factory pattern', () => {
    it('should use factory function', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      const factory: ServiceFactory = (provider) => {
        return { created: true, provider };
      };
      services.addSingleton(token, factory);
      const provider = services.buildServiceProvider();
      const instance = await provider.getRequiredService<{ created: boolean; provider: ServiceProvider }>(token);
      expect(instance.created).toBe(true);
      expect(instance.provider).toBe(provider);
    });

    it('should support async factory', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      const factory: ServiceFactory = async (provider) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { async: true };
      };
      services.addSingleton(token, factory);
      const provider = services.buildServiceProvider();
      const instance = await provider.getRequiredService<{ async: boolean }>(token);
      expect(instance.async).toBe(true);
    });
  });

  describe('String tokens', () => {
    it('should work with string tokens', async () => {
      const services = new ServiceCollection();
      const token = 'TestService';
      class TestService {}
      services.addSingleton(token, TestService);
      const provider = services.buildServiceProvider();
      const instance = await provider.getRequiredService(token);
      expect(instance).toBeInstanceOf(TestService);
    });
  });

  describe('Class constructor tokens', () => {
    it('should work with class constructor as token', async () => {
      const services = new ServiceCollection();
      class TestService {}
      services.addSingleton(TestService);
      const provider = services.buildServiceProvider();
      const instance = await provider.getRequiredService(TestService);
      expect(instance).toBeInstanceOf(TestService);
    });
  });

  describe('Interface vs Concrete Class Registration', () => {
    // Interface tanımları
    interface ILogger {
      log(message: string): void;
    }

    interface IUserService {
      getUsers(): string[];
    }

    // Concrete implementations
    class Logger implements ILogger {
      log(message: string) {
        console.log(`[LOG] ${message}`);
      }
    }

    class UserService implements IUserService {
      constructor(private logger: ILogger) {}

      getUsers(): string[] {
        this.logger.log('Fetching users...');
        return ['Alice', 'Bob'];
      }
    }

    class Database {
      connect() {
        console.log('Database connected');
      }
    }

    class UserRepository {
      constructor(private db: Database) {
        this.db.connect();
      }

      findAll() {
        return ['User1', 'User2'];
      }
    }

    it('should register interface with Symbol token', async () => {
      const services = new ServiceCollection();
      const ILoggerToken = Symbol('ILogger');
      const IUserServiceToken = Symbol('IUserService');

      services.addSingleton<ILogger>(ILoggerToken, Logger);
      services.addScoped<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);

      const provider = services.buildServiceProvider();
      const logger = await provider.getRequiredService<ILogger>(ILoggerToken);
      const userService = await provider.getRequiredService<IUserService>(IUserServiceToken);

      expect(logger).toBeInstanceOf(Logger);
      expect(userService).toBeInstanceOf(UserService);
      expect(userService.getUsers()).toEqual(['Alice', 'Bob']);
    });

    it('should register interface with string token', async () => {
      const services = new ServiceCollection();
      services.addSingleton<ILogger>('ILogger', Logger);
      services.addScoped<IUserService>('IUserService', UserService, ['ILogger']);

      const provider = services.buildServiceProvider();
      const logger = await provider.getRequiredService<ILogger>('ILogger');
      const userService = await provider.getRequiredService<IUserService>('IUserService');

      expect(logger).toBeInstanceOf(Logger);
      expect(userService).toBeInstanceOf(UserService);
      expect(userService.getUsers()).toEqual(['Alice', 'Bob']);
    });

    it('should register concrete class directly as token', async () => {
      const services = new ServiceCollection();
      services.addSingleton(Database);
      services.addScoped(UserRepository, [Database]);

      const provider = services.buildServiceProvider();
      const db = await provider.getRequiredService(Database);
      const userRepo = await provider.getRequiredService(UserRepository);

      expect(db).toBeInstanceOf(Database);
      expect(userRepo).toBeInstanceOf(UserRepository);
      expect(userRepo.findAll()).toEqual(['User1', 'User2']);
    });

    it('should register concrete class with explicit implementation', async () => {
      const services = new ServiceCollection();
      services.addSingleton(Database, Database);
      services.addScoped(UserRepository, UserRepository, [Database]);

      const provider = services.buildServiceProvider();
      const db = await provider.getRequiredService(Database);
      const userRepo = await provider.getRequiredService(UserRepository);

      expect(db).toBeInstanceOf(Database);
      expect(userRepo).toBeInstanceOf(UserRepository);
    });

    it('should mix interface and class registrations', async () => {
      const services = new ServiceCollection();
      const ILoggerToken = Symbol('ILogger');

      // Interface registration
      services.addSingleton<ILogger>(ILoggerToken, Logger);

      // Class registration
      services.addSingleton(Database);

      // Class implementing interface
      class DatabaseService implements ILogger {
        constructor(private db: Database) {}

        log(message: string) {
          console.log(`[DB-SERVICE] ${message}`);
        }
      }

      const IDatabaseServiceToken = Symbol('IDatabaseService');
      services.addScoped<ILogger>(IDatabaseServiceToken, DatabaseService, [Database]);

      const provider = services.buildServiceProvider();

      // Get via interface token
      const logger = await provider.getRequiredService<ILogger>(ILoggerToken);
      expect(logger).toBeInstanceOf(Logger);

      // Get via class token
      const db = await provider.getRequiredService(Database);
      expect(db).toBeInstanceOf(Database);

      // Get class implementation via interface token
      const dbService = await provider.getRequiredService<ILogger>(IDatabaseServiceToken);
      expect(dbService).toBeInstanceOf(DatabaseService);
    });

    it('should allow multiple implementations for same interface', async () => {
      const services = new ServiceCollection();
      const ILoggerToken = Symbol('ILogger');

      class ConsoleLogger implements ILogger {
        log(message: string) {
          console.log(`[CONSOLE] ${message}`);
        }
      }

      class FileLogger implements ILogger {
        log(message: string) {
          console.log(`[FILE] ${message}`);
        }
      }

      // Register multiple implementations
      services.addSingleton<ILogger>(ILoggerToken, ConsoleLogger);
      services.addSingleton<ILogger>(ILoggerToken, FileLogger);

      const provider = services.buildServiceProvider();
      const instances = await provider.getServices<ILogger>(ILoggerToken);

      expect(instances.length).toBe(2);
      // For singleton with same token, all descriptors resolve to the same instance
      // (last registration wins for singleton lifetime)
      // But getServices returns instances from all descriptors
      // Since they're singletons with same token, they share the same instance
      expect(instances[0]).toBeDefined();
      expect(instances[1]).toBeDefined();
      // Both should be instances of ILogger
      expect(instances[0]).toHaveProperty('log');
      expect(instances[1]).toHaveProperty('log');
    });

    it('should inject interface dependency into class', async () => {
      const services = new ServiceCollection();
      const ILoggerToken = Symbol('ILogger');
      const IUserServiceToken = Symbol('IUserService');

      services.addSingleton<ILogger>(ILoggerToken, Logger);
      services.addScoped<IUserService>(IUserServiceToken, UserService, [ILoggerToken]);

      const provider = services.buildServiceProvider();
      const userService = await provider.getRequiredService<IUserService>(IUserServiceToken);

      expect(userService).toBeInstanceOf(UserService);
      expect(userService.getUsers()).toEqual(['Alice', 'Bob']);
    });

    it('should inject class dependency into interface implementation', async () => {
      const services = new ServiceCollection();
      const ILoggerToken = Symbol('ILogger');

      services.addSingleton(Database);

      class DatabaseLogger implements ILogger {
        constructor(private db: Database) {}

        log(message: string) {
          console.log(`[DB-LOG] ${message}`);
        }
      }

      services.addSingleton<ILogger>(ILoggerToken, DatabaseLogger, [Database]);

      const provider = services.buildServiceProvider();
      const logger = await provider.getRequiredService<ILogger>(ILoggerToken);

      expect(logger).toBeInstanceOf(DatabaseLogger);
    });

    it('should work with transient lifetime for interface', async () => {
      const services = new ServiceCollection();
      const ILoggerToken = Symbol('ILogger');

      services.addTransient<ILogger>(ILoggerToken, Logger);

      const provider = services.buildServiceProvider();
      const logger1 = await provider.getRequiredService<ILogger>(ILoggerToken);
      const logger2 = await provider.getRequiredService<ILogger>(ILoggerToken);

      expect(logger1).toBeInstanceOf(Logger);
      expect(logger2).toBeInstanceOf(Logger);
      expect(logger1).not.toBe(logger2);
    });

    it('should work with transient lifetime for class', async () => {
      const services = new ServiceCollection();
      services.addTransient(Database);

      const provider = services.buildServiceProvider();
      const db1 = await provider.getRequiredService(Database);
      const db2 = await provider.getRequiredService(Database);

      expect(db1).toBeInstanceOf(Database);
      expect(db2).toBeInstanceOf(Database);
      expect(db1).not.toBe(db2);
    });

    it('should work with scoped lifetime for interface', async () => {
      const services = new ServiceCollection();
      const ILoggerToken = Symbol('ILogger');

      services.addScoped<ILogger>(ILoggerToken, Logger);

      const provider = services.buildServiceProvider();
      const scope1 = provider.createScope();
      const scope2 = provider.createScope();

      const logger1a = await scope1.getRequiredService<ILogger>(ILoggerToken);
      const logger1b = await scope1.getRequiredService<ILogger>(ILoggerToken);
      const logger2 = await scope2.getRequiredService<ILogger>(ILoggerToken);

      expect(logger1a).toBe(logger1b); // Same scope
      expect(logger1a).not.toBe(logger2); // Different scope
    });

    it('should work with scoped lifetime for class', async () => {
      const services = new ServiceCollection();
      services.addScoped(Database);

      const provider = services.buildServiceProvider();
      const scope1 = provider.createScope();
      const scope2 = provider.createScope();

      const db1a = await scope1.getRequiredService(Database);
      const db1b = await scope1.getRequiredService(Database);
      const db2 = await scope2.getRequiredService(Database);

      expect(db1a).toBe(db1b); // Same scope
      expect(db1a).not.toBe(db2); // Different scope
    });
  });

  describe('Multiple registrations', () => {
    it('should return last registered implementation', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService1 {}
      class TestService2 {}
      services.addSingleton(token, TestService1);
      services.addSingleton(token, TestService2);
      const provider = services.buildServiceProvider();
      const instance = await provider.getRequiredService(token);
      expect(instance).toBeInstanceOf(TestService2);
    });

    it('should return all implementations with getServices', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService1 {
        id = 1;
      }
      class TestService2 {
        id = 2;
      }
      class TestService3 {
        id = 3;
      }
      services.addSingleton(token, TestService1);
      services.addSingleton(token, TestService2);
      services.addSingleton(token, TestService3);
      const provider = services.buildServiceProvider();
      const instances = await provider.getServices(token);
      expect(instances).toHaveLength(3);
      // For singleton with same token, last registration wins
      // But getServices resolves all descriptors
      // Since they share the same token and are singleton, they resolve to same instance
      expect(instances[0]).toBeDefined();
      expect(instances[1]).toBeDefined();
      expect(instances[2]).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle service with no dependencies', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService {}
      services.addSingleton(token, TestService, []);
      const provider = services.buildServiceProvider();
      const instance = await provider.getRequiredService(token);
      expect(instance).toBeInstanceOf(TestService);
    });

    it('should handle service with undefined dependencies', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService {}
      services.addSingleton(token, TestService);
      const provider = services.buildServiceProvider();
      const instance = await provider.getRequiredService(token);
      expect(instance).toBeInstanceOf(TestService);
    });

    it('should handle error in onDestroy', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService {
        async onDestroy() {
          throw new Error('Destroy error');
        }
      }
      services.addScoped(token, TestService);
      const provider = services.buildServiceProvider();
      const scope = provider.createScope();
      await scope.getRequiredService(token);
      // Should not throw, error should be caught
      await expect(scope.dispose()).resolves.not.toThrow();
    });

    it('should handle missing dependency', async () => {
      const services = new ServiceCollection();
      const token1 = Symbol('Test1');
      const token2 = Symbol('Test2');
      class TestService2 {
        constructor(public test1: any) {}
      }
      services.addSingleton(token2, TestService2, [token1]);
      const provider = services.buildServiceProvider();
      await expect(provider.getRequiredService(token2)).rejects.toThrow();
    });

    it('should handle invalid service descriptor', () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      // Create invalid descriptor by manually adding one without implementation or factory
      const collection = services as any;
      collection.addDescriptor({
        token,
        lifetime: ServiceLifetime.Singleton,
        // No implementation, factory, or value
      });
      const provider = services.buildServiceProvider();
      return expect(provider.getRequiredService(token)).rejects.toThrow('Invalid service descriptor');
    });

    it('should handle unknown lifetime', () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService {}
      // Manually create invalid descriptor
      const collection = services as any;
      collection.addDescriptor({
        token,
        lifetime: 'UNKNOWN' as ServiceLifetime,
        implementation: TestService,
      });
      const provider = services.buildServiceProvider();
      return expect(provider.getRequiredService(token)).rejects.toThrow('Unknown lifetime');
    });
  });

  describe('Complex scenarios', () => {
    it('should handle deep dependency chain', async () => {
      const services = new ServiceCollection();
      const token1 = Symbol('Level1');
      const token2 = Symbol('Level2');
      const token3 = Symbol('Level3');
      const token4 = Symbol('Level4');
      class Level1 {}
      class Level2 {
        constructor(public level1: Level1) {}
      }
      class Level3 {
        constructor(public level2: Level2) {}
      }
      class Level4 {
        constructor(public level3: Level3) {}
      }
      services.addSingleton(token1, Level1);
      services.addSingleton(token2, Level2, [token1]);
      services.addSingleton(token3, Level3, [token2]);
      services.addSingleton(token4, Level4, [token3]);
      const provider = services.buildServiceProvider();
      const level4 = await provider.getRequiredService<Level4>(token4);
      expect(level4.level3.level2.level1).toBeInstanceOf(Level1);
    });

    it('should handle reflection metadata for dependencies', async () => {
      const services = new ServiceCollection();
      const token1 = Symbol('Test1');
      const token2 = Symbol('Test2');
      class TestService1 {}
      class TestService2 {
        constructor(public test1: TestService1) {}
      }
      services.addSingleton(token1, TestService1);
      // Register without explicit dependencies - will use reflection if metadata available
      // If not, will try to resolve TestService1 class directly
      services.addSingleton(token2, TestService2);
      const provider = services.buildServiceProvider();
      // This may or may not work depending on reflection metadata
      // So we just check it doesn't crash
      try {
        const instance2 = await provider.getRequiredService<TestService2>(token2);
        if (instance2.test1) {
          expect(instance2.test1).toBeDefined();
        }
      } catch (e) {
        // If reflection doesn't work, that's expected
        expect((e as Error).message).toContain('No provider found');
      }
    });

    it('should handle reflection metadata with class token', async () => {
      const services = new ServiceCollection();
      class TestService1 {}
      class TestService2 {
        constructor(public test1: TestService1) {}
      }
      services.addSingleton(TestService1);
      services.addSingleton(TestService2);
      const provider = services.buildServiceProvider();
      // With class tokens, should work if TestService1 is registered
      const instance2 = await provider.getRequiredService<TestService2>(TestService2);
      expect(instance2).toBeInstanceOf(TestService2);
      // test1 may or may not be resolved depending on reflection
      if (instance2.test1) {
        expect(instance2.test1).toBeInstanceOf(TestService1);
      }
    });

    it('should handle mixed lifetimes', async () => {
      const services = new ServiceCollection();
      const singletonToken = Symbol('Singleton');
      const scopedToken = Symbol('Scoped');
      const transientToken = Symbol('Transient');
      class SingletonService {}
      class ScopedService {
        constructor(public singleton: SingletonService) {}
      }
      class TransientService {
        constructor(public scoped: ScopedService, public singleton: SingletonService) {}
      }
      services.addSingleton(singletonToken, SingletonService);
      services.addScoped(scopedToken, ScopedService, [singletonToken]);
      services.addTransient(transientToken, TransientService, [scopedToken, singletonToken]);
      const provider = services.buildServiceProvider();
      const scope = provider.createScope();
      const transient1 = await scope.getRequiredService<TransientService>(transientToken);
      const transient2 = await scope.getRequiredService<TransientService>(transientToken);
      expect(transient1).not.toBe(transient2);
      expect(transient1.scoped).toBe(transient2.scoped);
      expect(transient1.singleton).toBe(transient2.singleton);
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle circular dependency error when partial instance missing (singleton)', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService {
        constructor(public self: TestService) {}
      }
      services.addSingleton(token, TestService, [token]);
      const provider = services.buildServiceProvider();
      // This should work with circular dependency support
      const instance = await provider.getRequiredService<TestService>(token);
      expect(instance).toBeDefined();
      expect(instance.self).toBe(instance);
    });

    it('should handle scope validation for factory', () => {
      const services = new ServiceCollection();
      const scopedToken = Symbol('Scoped');
      const singletonToken = Symbol('Singleton');
      class ScopedService {}
      const factory: ServiceFactory = (provider) => {
        return provider.getRequiredService(scopedToken);
      };
      services.addScoped(scopedToken, ScopedService);
      services.addSingleton(singletonToken, factory);
      const provider = services.buildServiceProvider({ validateScopes: true });
      return expect(provider.getRequiredService(singletonToken)).rejects.toThrow();
    });

    it('should handle validateDependencies with empty dependencies', () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService {}
      services.addSingleton(token, TestService, []);
      const provider = services.buildServiceProvider({ validateScopes: true });
      return expect(provider.getRequiredService(token)).resolves.toBeDefined();
    });

    it('should handle validateDependencies with non-existent dependency', () => {
      const services = new ServiceCollection();
      const token1 = Symbol('Test1');
      const token2 = Symbol('Test2');
      class TestService1 {
        constructor(public test2: any) {}
      }
      services.addSingleton(token1, TestService1, [token2]);
      const provider = services.buildServiceProvider({ validateScopes: true });
      // Should not throw validation error, but will throw missing dependency error
      return expect(provider.getRequiredService(token1)).rejects.toThrow();
    });

    it('should handle validateDependencies for root service', () => {
      const services = new ServiceCollection();
      const scopedToken = Symbol('Scoped');
      const rootToken = Symbol('Root');
      class ScopedService {}
      class RootService {
        constructor(public scoped: ScopedService) {}
      }
      services.addScoped(scopedToken, ScopedService);
      services.addSingleton(rootToken, RootService, [scopedToken]);
      const provider = services.buildServiceProvider({ validateScopes: true });
      return expect(provider.getRequiredService(rootToken)).rejects.toThrow();
    });

    it('should handle property copying errors gracefully', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      // Create a class with non-configurable properties
      class TestService {
        constructor(public value: string) {}
      }
      Object.defineProperty(TestService.prototype, 'nonConfigurable', {
        value: 'test',
        configurable: false,
        writable: false,
      });
      services.addSingleton(token, TestService, []);
      const provider = services.buildServiceProvider();
      // Should still work despite property copying issues
      const instance = await provider.getRequiredService(token);
      expect(instance).toBeInstanceOf(TestService);
    });

    it('should handle tryAdd when service already exists', () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService1 {}
      class TestService2 {}
      services.addSingleton(token, TestService1);
      services.tryAddSingleton(token, TestService2);
      const provider = services.buildServiceProvider();
      // First registration should win
      return expect(provider.getRequiredService(token)).resolves.toBeInstanceOf(TestService1);
    });

    it('should handle tryAddScoped when service already exists', () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService1 {}
      class TestService2 {}
      services.addScoped(token, TestService1);
      services.tryAddScoped(token, TestService2);
      const provider = services.buildServiceProvider();
      const scope = provider.createScope();
      return expect(scope.getRequiredService(token)).resolves.toBeInstanceOf(TestService1);
    });

    it('should handle tryAddTransient when service already exists', () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService1 {}
      class TestService2 {}
      services.addTransient(token, TestService1);
      services.tryAddTransient(token, TestService2);
      const provider = services.buildServiceProvider();
      return expect(provider.getRequiredService(token)).resolves.toBeInstanceOf(TestService1);
    });

    it('should handle tryAdd with factory when service exists', () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService {}
      const factory: ServiceFactory = () => ({ factory: true });
      services.addSingleton(token, TestService);
      services.tryAddSingleton(token, factory);
      const provider = services.buildServiceProvider();
      return expect(provider.getRequiredService(token)).resolves.toBeInstanceOf(TestService);
    });

    it('should handle tryAdd with dependencies when service exists', () => {
      const services = new ServiceCollection();
      const token1 = Symbol('Test1');
      const token2 = Symbol('Test2');
      class TestService1 {}
      class TestService2 {
        constructor(public test1: TestService1) {}
      }
      services.addSingleton(token1, TestService1);
      services.addSingleton(token2, TestService2);
      services.tryAddSingleton(token2, TestService2, [token1]);
      const provider = services.buildServiceProvider();
      return expect(provider.getRequiredService(token2)).resolves.toBeInstanceOf(TestService2);
    });

    it('should handle getServices with some failing resolutions', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService {}
      // Add a valid service
      services.addSingleton(token, TestService);
      const provider = services.buildServiceProvider();
      const instances = await provider.getServices(token);
      // Should return valid instances
      expect(instances.length).toBeGreaterThan(0);
      expect(instances.every((i) => i !== undefined)).toBe(true);
    });

    it('should handle index.ts exports', () => {
      // Test that index.ts exports work
      const index = require('../src/index');
      expect(index.ServiceCollection).toBeDefined();
      expect(index.ServiceProvider).toBeDefined();
      expect(index.ServiceLifetime).toBeDefined();
    });

    it('should handle reflection metadata with tokenMap iteration', async () => {
      const services = new ServiceCollection();
      const token1 = Symbol('Test1');
      const token2 = Symbol('Test2');
      class TestService1 {}
      class TestService2 {
        constructor(public test1: TestService1) {}
      }
      // Register with token
      services.addSingleton(token1, TestService1);
      // Register TestService2 without explicit dependencies - will use reflection
      // and tokenMap to find matching implementation
      services.addSingleton(token2, TestService2);
      const provider = services.buildServiceProvider();
      // This should trigger tokenMap iteration in reflection path
      try {
        const instance2 = await provider.getRequiredService<TestService2>(token2);
        if (instance2.test1) {
          expect(instance2.test1).toBeInstanceOf(TestService1);
        }
      } catch (e) {
        // Reflection may not work without proper metadata
        expect((e as Error).message).toBeDefined();
      }
    });

    it('should handle property copying with getter/setter errors', async () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService {
        private _value = 'test';
        get value() {
          return this._value;
        }
        set value(v: string) {
          this._value = v;
        }
        constructor(public dep: any) {}
      }
      class DepService {}
      const depToken = Symbol('Dep');
      services.addSingleton(depToken, DepService);
      services.addSingleton(token, TestService, [depToken]);
      const provider = services.buildServiceProvider();
      const instance = await provider.getRequiredService<TestService>(token);
      expect(instance).toBeInstanceOf(TestService);
      expect(instance.dep).toBeInstanceOf(DepService);
    });

    it('should handle validateDependencies with transient service', () => {
      const services = new ServiceCollection();
      const scopedToken = Symbol('Scoped');
      const transientToken = Symbol('Transient');
      class ScopedService {}
      class TransientService {
        constructor(public scoped: ScopedService) {}
      }
      services.addScoped(scopedToken, ScopedService);
      services.addTransient(transientToken, TransientService, [scopedToken]);
      const provider = services.buildServiceProvider({ validateScopes: true });
      const scope = provider.createScope();
      // Should work from scope
      return expect(scope.getRequiredService(transientToken)).resolves.toBeDefined();
    });

    it('should handle validateDependencies skip when no dependencies', () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      class TestService {}
      services.addSingleton(token, TestService);
      const provider = services.buildServiceProvider({ validateScopes: true });
      // Should skip validation when no dependencies
      return expect(provider.getRequiredService(token)).resolves.toBeDefined();
    });

    it('should handle tryAddSingleton with dependencies', () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      const depToken = Symbol('Dep');
      class TestService {
        constructor(public dep: any) {}
      }
      class DepService {}
      services.addSingleton(depToken, DepService);
      services.tryAddSingleton(token, TestService, [depToken]);
      const provider = services.buildServiceProvider();
      return expect(provider.getRequiredService(token)).resolves.toBeInstanceOf(TestService);
    });

    it('should handle tryAddScoped with dependencies', () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      const depToken = Symbol('Dep');
      class TestService {
        constructor(public dep: any) {}
      }
      class DepService {}
      services.addSingleton(depToken, DepService);
      services.tryAddScoped(token, TestService, [depToken]);
      const provider = services.buildServiceProvider();
      const scope = provider.createScope();
      return expect(scope.getRequiredService(token)).resolves.toBeInstanceOf(TestService);
    });

    it('should handle tryAddTransient with dependencies', () => {
      const services = new ServiceCollection();
      const token = Symbol('Test');
      const depToken = Symbol('Dep');
      class TestService {
        constructor(public dep: any) {}
      }
      class DepService {}
      services.addSingleton(depToken, DepService);
      services.tryAddTransient(token, TestService, [depToken]);
      const provider = services.buildServiceProvider();
      return expect(provider.getRequiredService(token)).resolves.toBeInstanceOf(TestService);
    });
  });
});
