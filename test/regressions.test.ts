// One test per defect found in @nodelibraries/ioc 1.3.x (all reproduced against that version before the rewrite).
import {
  CircularDependencyError,
  createToken,
  DisposedError,
  RegistrationError,
  ScopeError,
  ServiceCollection,
  ServiceNotFoundError,
  ValidationError,
} from '../src/index.ts';

const tick = (ms = 5) => new Promise((r) => setTimeout(r, ms));

describe('regressions from 1.3.x', () => {
  it('1. classes with #private fields resolve (no placeholder copy)', async () => {
    class Counter {
      #n = 1;
      get n() {
        return this.#n;
      }
      inc() {
        return ++this.#n;
      }
    }
    const services = new ServiceCollection().addSingleton(Counter).addTransient('t', Counter);
    const p = services.buildServiceProvider();
    const c = await p.getRequiredService(Counter);
    expect(c.n).toBe(1);
    expect(c.inc()).toBe(2);
    expect(c).toBeInstanceOf(Counter);
    expect((await p.getRequiredService<Counter>('t')).inc()).toBe(2);
  });

  it('1b. #private fields work inside a circular dependency too', async () => {
    class A {
      #secret = 'a';
      constructor(public b: B) {}
      secret() {
        return this.#secret;
      }
    }
    class B {
      constructor(public a: A) {}
    }
    const p = new ServiceCollection().addSingleton(A, [B]).addSingleton(B, [A]).buildServiceProvider();
    const a = await p.getRequiredService(A);
    expect(a.b.a.secret()).toBe('a');
    expect(a.b.a).toBe(a);
  });

  it('2. concurrent transient resolutions get distinct instances', async () => {
    class T {
      async onInit() {
        await tick();
      }
    }
    const p = new ServiceCollection().addTransient(T).buildServiceProvider();
    const [a, b, c] = await Promise.all([p.getRequiredService(T), p.getRequiredService(T), p.getRequiredService(T)]);
    expect(new Set([a, b, c]).size).toBe(3);
  });

  it('2b. concurrent singleton/scoped resolutions share one fully initialised instance', async () => {
    let constructed = 0;
    class S {
      ready = false;
      constructor() {
        constructed++;
      }
      async onInit() {
        await tick();
        this.ready = true;
      }
    }
    const p = new ServiceCollection().addSingleton(S).addScoped('scoped', S).buildServiceProvider();
    const all = await Promise.all([p.getRequiredService(S), p.getRequiredService(S)]);
    expect(all[0]).toBe(all[1]);
    expect(all.every((s) => s.ready)).toBe(true);
    const scope = p.createScope();
    const scoped = await Promise.all([scope.getRequiredService<S>('scoped'), scope.getRequiredService<S>('scoped')]);
    expect(scoped[0]).toBe(scoped[1]);
    expect(constructed).toBe(2);
  });

  it('3. keyed singletons of the same class are distinct per key', async () => {
    class L {}
    const p = new ServiceCollection().addKeyedSingleton('L', L, 'a').addKeyedSingleton('L', L, 'b').addSingleton('L', L).buildServiceProvider();
    const a = await p.getRequiredKeyedService<L>('L', 'a');
    const b = await p.getRequiredKeyedService<L>('L', 'b');
    const plain = await p.getRequiredService<L>('L');
    expect(new Set([a, b, plain]).size).toBe(3);
    expect(await p.getRequiredKeyedService('L', 'a')).toBe(a);
  });

  it('3b. different symbols with the same description are different tokens', async () => {
    class L {}
    const A = Symbol('X');
    const B = Symbol('X');
    const p = new ServiceCollection().addSingleton(A, L).addSingleton(B, L).buildServiceProvider();
    expect(await p.getRequiredService(A)).not.toBe(await p.getRequiredService(B));
  });

  it('3c. two classes with the same name do not share a singleton', async () => {
    const make = () => class Service {};
    const S1 = make();
    const S2 = make();
    const p = new ServiceCollection().addSingleton('s', S1).addSingleton('s', S2).buildServiceProvider();
    const [a, b] = await p.getServices('s');
    expect(a).toBeInstanceOf(S1);
    expect(b).toBeInstanceOf(S2);
  });

  it('4. factories with identical source (registered in a loop) resolve independently', async () => {
    const services = new ServiceCollection();
    for (const v of [1, 2, 3]) services.addSingleton('cfg', () => ({ v }));
    const p = services.buildServiceProvider();
    expect(await p.getServices('cfg')).toEqual([{ v: 1 }, { v: 2 }, { v: 3 }]);
  });

  it('5. scoped multiple implementations are distinct and cached per scope', async () => {
    class M1 {}
    class M2 {}
    const p = new ServiceCollection().addScoped('m', M1).addScoped('m', M2).buildServiceProvider();
    const scope = p.createScope();
    const first = await scope.getServices('m');
    expect(first.map((x: any) => x.constructor.name)).toEqual(['M1', 'M2']);
    expect(await scope.getServices('m')).toEqual(first);
    expect(await scope.getRequiredService('m')).toBe(first[1]);
    const other = await p.createScope().getServices('m');
    expect(other[0]).not.toBe(first[0]);
  });

  it('6. dispose reaches every implementation, in reverse creation order', async () => {
    const order: string[] = [];
    class D1 {
      onDestroy() {
        order.push('D1');
      }
    }
    class D2 {
      onDestroy() {
        order.push('D2');
      }
    }
    class Uses {
      constructor(public d: D1) {}
      onDestroy() {
        order.push('Uses');
      }
    }
    const p = new ServiceCollection().addSingleton('d', D1).addSingleton('d', D2).addSingleton(D1).addSingleton(Uses, [D1]).buildServiceProvider();
    await p.getServices('d');
    await p.getRequiredService(Uses);
    await p.dispose();
    expect(order).toEqual(['Uses', 'D1', 'D2', 'D1']);
  });

  it('7. keyed registrations never leak into getService/getServices', async () => {
    class Plain {}
    class Keyed {}
    const p = new ServiceCollection().addSingleton('svc', Plain).addKeyedSingleton('svc', Keyed, 'k').buildServiceProvider();
    expect(await p.getService('svc')).toBeInstanceOf(Plain);
    expect((await p.getServices('svc')).length).toBe(1);
    const onlyKeyed = new ServiceCollection().addKeyedSingleton('x', Keyed, 'k').buildServiceProvider();
    expect(await onlyKeyed.getService('x')).toBeUndefined();
    expect(onlyKeyed.isService('x')).toBe(false);
    expect(onlyKeyed.isService('x', 'k')).toBe(true);
  });

  it('7b. keyed services accept dependencies', async () => {
    class Db {}
    class Repo {
      constructor(public db: Db) {}
    }
    const p = new ServiceCollection().addSingleton(Db).addKeyedScoped('repo', Repo, 'main', [Db]).buildServiceProvider();
    const repo = await p.createScope().getRequiredKeyedService<Repo>('repo', 'main');
    expect(repo.db).toBe(await p.getRequiredService(Db));
  });

  it('8. replace keeps the previous lifetime', async () => {
    class Old {}
    class New {}
    const p = new ServiceCollection().addTransient('x', Old).replace('x', New).buildServiceProvider();
    const a = await p.getRequiredService('x');
    expect(a).toBeInstanceOf(New);
    expect(await p.getRequiredService('x')).not.toBe(a);
  });

  it('9. remove also drops keyed registrations', () => {
    class K {}
    const services = new ServiceCollection().addKeyedSingleton('x', K, 'k').remove('x');
    expect(services.has('x', 'k')).toBe(false);
  });

  it('9b. changing the collection after build does not affect the provider', async () => {
    class A {}
    class B {}
    const services = new ServiceCollection().addSingleton('x', A);
    const p = services.buildServiceProvider();
    services.addSingleton('x', B).addSingleton('y', B).remove('x');
    expect(await p.getRequiredService('x')).toBeInstanceOf(A);
    expect(p.isService('y')).toBe(false);
  });

  it('10. values can be null, undefined, 0 or false', async () => {
    const p = new ServiceCollection().addValue('nul', null).addValue('undef', undefined).addValue('zero', 0).addValue('no', false).buildServiceProvider();
    expect(await p.getRequiredService('nul')).toBeNull();
    expect(await p.getRequiredService('undef')).toBeUndefined();
    expect(await p.getRequiredService('zero')).toBe(0);
    expect(await p.getRequiredService('no')).toBe(false);
    expect(p.isService('undef')).toBe(true);
  });

  it('11. plain functions are factories, not constructors', async () => {
    const p = new ServiceCollection()
      .addSingleton('fn', function () {
        return { made: 'by factory' };
      })
      .buildServiceProvider();
    expect(await p.getRequiredService('fn')).toEqual({ made: 'by factory' });
  });

  it('12. messages name class tokens instead of printing their source', async () => {
    class Missing {}
    class Needs {
      constructor(public m: Missing) {}
    }
    const p = new ServiceCollection().addSingleton(Needs, [Missing]).buildServiceProvider();
    const err = await p.getRequiredService(Needs).catch((e) => e);
    expect(err).toBeInstanceOf(ServiceNotFoundError);
    expect(err.message).toBe("No service registered for 'Missing' (required by Needs).");
    expect(err.message).not.toContain('class');
    expect(err.path).toEqual([Needs]);
  });

  it('13. validateOnBuild reports every problem, including captive scoped services', () => {
    class Scoped {}
    class Middle {
      constructor(public s: Scoped) {}
    }
    class Single {
      constructor(public m: Middle, public x: unknown) {}
    }
    const services = new ServiceCollection().addScoped(Scoped).addTransient(Middle, [Scoped]).addSingleton(Single, [Middle, 'nope']);
    const err = (() => {
      try {
        services.buildServiceProvider({ validateOnBuild: true, validateScopes: true });
      } catch (e) {
        return e as ValidationError;
      }
    })()!;
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.errors).toEqual([
      "'Single' depends on 'nope', which is not registered.",
      "Singleton 'Single' captures scoped 'Scoped' (Single → Middle → Scoped).",
    ]);
    // Captive checks only apply with validateScopes.
    expect(() => services.addValue('nope', 1).buildServiceProvider({ validateOnBuild: true })).not.toThrow();
  });
});

describe('cycles', () => {
  it('a cycle partner used inside a constructor throws CircularDependencyError with the path', async () => {
    class A {
      constructor(public b: B) {}
      hello() {
        return 'hi';
      }
    }
    class B {
      greeting: string;
      constructor(a: A) {
        this.greeting = a.hello();
      }
    }
    const p = new ServiceCollection().addSingleton(A, [B]).addSingleton(B, [A]).buildServiceProvider();
    const err = await p.getRequiredService(A).catch((e) => e);
    expect(err).toBeInstanceOf(CircularDependencyError);
    expect(err.path).toEqual([A, B, A]);
    expect(err.message).toContain('A → B → A');
    // A failed resolution is not cached: fixing nothing still fails the same way, no hang.
    await expect(p.getRequiredService(A)).rejects.toBeInstanceOf(CircularDependencyError);
  });

  it('transient cycles resolve within one chain and stay distinct across calls', async () => {
    class A {
      constructor(public b: B) {}
    }
    class B {
      constructor(public a: A) {}
    }
    const p = new ServiceCollection().addTransient(A, [B]).addTransient(B, [A]).buildServiceProvider();
    const a1 = await p.getRequiredService(A);
    const a2 = await p.getRequiredService(A);
    expect(a1.b.a).toBe(a1);
    expect(a1).not.toBe(a2);
  });

  it('two concurrent chains entering a cycle from opposite ends do not deadlock', async () => {
    class A {
      constructor(public b: B) {}
      async onInit() {
        await tick();
      }
    }
    class B {
      constructor(public a: A) {}
      async onInit() {
        await tick();
      }
    }
    const p = new ServiceCollection().addSingleton(A, [B]).addSingleton(B, [A]).buildServiceProvider();
    const [a, b] = await Promise.race([
      Promise.all([p.getRequiredService(A), p.getRequiredService(B)]),
      tick(500).then(() => {
        throw new Error('deadlock');
      }),
    ]);
    expect(a.b).toBe(b);
    expect(b.a).toBe(a);
  });

  it('cycles through async factories are detected instead of hanging', async () => {
    const A = createToken<{ b: unknown }>('A');
    const B = createToken<{ a: unknown }>('B');
    const p = new ServiceCollection()
      .addSingleton(A, async (sp) => ({ b: await sp.getRequiredService(B) }))
      .addSingleton(B, async (sp) => ({ a: await sp.getRequiredService(A) }))
      .buildServiceProvider();
    const a = await Promise.race([p.getRequiredService(A), tick(500).then(() => 'deadlock')]);
    expect(a).not.toBe('deadlock');
    expect(((a as any).b.a as any).b).toBe((a as any).b);
  });

  it('a proxy that is awaited before construction does not trip the cycle check', async () => {
    const A = createToken<object>('A');
    const p = new ServiceCollection().addSingleton(A, async (sp) => {
      await sp.getRequiredService(A); // self-reference through a factory: gets the not-yet-built proxy, must not throw on `then`
      return { ok: true };
    });
    await expect(p.buildServiceProvider().getRequiredService(A)).resolves.toEqual({ ok: true });
  });

  it('proxies support reflection and assignment once constructed', async () => {
    class A {
      x = 1;
      constructor(public b: B) {}
    }
    class B {
      constructor(public a: A) {}
    }
    const p = new ServiceCollection().addSingleton(A, [B]).addSingleton(B, [A]).buildServiceProvider();
    const a = await p.getRequiredService(A);
    expect(a).toBeInstanceOf(A);
    expect(Object.keys(a).sort()).toEqual(['b', 'x']);
    expect('x' in a).toBe(true);
    a.x = 5;
    expect(a.b.a.x).toBe(5);
    Object.defineProperty(a, 'y', { value: 2, enumerable: true, configurable: true });
    expect((a as any).y).toBe(2);
    delete (a as any).y;
    expect('y' in a).toBe(false);
  });
});

describe('errors and scopes', () => {
  it('validateScopes: scoped from root and captive scoped both throw ScopeError', async () => {
    class Scoped {}
    class Single {
      constructor(public s: Scoped) {}
    }
    const p = new ServiceCollection().addScoped(Scoped).addSingleton(Single, [Scoped]).buildServiceProvider({ validateScopes: true });
    await expect(p.getRequiredService(Scoped)).rejects.toThrow(ScopeError);
    const err = await p.createScope().getRequiredService(Single).catch((e) => e);
    expect(err).toBeInstanceOf(ScopeError);
    expect(err.message).toContain('Single → Scoped');
  });

  it('without validateScopes, scoped from root behaves as a root-level instance', async () => {
    class Scoped {}
    const p = new ServiceCollection().addScoped(Scoped).buildServiceProvider();
    expect(await p.getRequiredService(Scoped)).toBe(await p.getRequiredService(Scoped));
  });

  it('singletons resolved from a scope are shared with the root and survive the scope', async () => {
    let destroyed = 0;
    class S {
      onDestroy() {
        destroyed++;
      }
    }
    const p = new ServiceCollection().addSingleton(S).buildServiceProvider();
    const scope = p.createScope();
    const fromScope = await scope.getRequiredService(S);
    await scope.dispose();
    expect(destroyed).toBe(0);
    expect(await p.getRequiredService(S)).toBe(fromScope);
    await p.dispose();
    expect(destroyed).toBe(1);
  });

  it('a scope disposes transients it created; Symbol.dispose and asyncDispose are honored', async () => {
    const log: string[] = [];
    class T {
      [Symbol.dispose]() {
        log.push('sync');
      }
    }
    class U {
      async [Symbol.asyncDispose]() {
        log.push('async');
      }
    }
    const p = new ServiceCollection().addTransient(T).addScoped(U).addValue('v', { onDestroy: () => log.push('value') }).buildServiceProvider();
    {
      await using scope = p.createScope();
      await scope.getRequiredService(T);
      await scope.getRequiredService(U);
      await scope.getRequiredService('v');
    }
    expect(log).toEqual(['async', 'sync']);
  });

  it('several dispose failures surface as an AggregateError after everything ran', async () => {
    const ran: number[] = [];
    const make = (i: number) =>
      class {
        onDestroy() {
          ran.push(i);
          throw new Error(`e${i}`);
        }
      };
    const p = new ServiceCollection().addSingleton('a', make(1)).addSingleton('b', make(2)).buildServiceProvider();
    await p.getRequiredService('a');
    await p.getRequiredService('b');
    const err: any = await p.dispose().catch((e) => e);
    expect(err).toBeInstanceOf(AggregateError);
    expect(err.errors.map((e: Error) => e.message)).toEqual(['e2', 'e1']);
    expect(ran).toEqual([2, 1]);
    await expect(p.dispose()).resolves.toBeUndefined();
  });

  it('a disposed root makes its scopes unusable', async () => {
    class S {}
    const p = new ServiceCollection().addScoped(S).buildServiceProvider();
    const scope = p.createScope();
    await p.dispose();
    await expect(scope.getRequiredService(S)).rejects.toThrow(DisposedError);
    expect(() => p.createScope()).toThrow(DisposedError);
    expect(p.isService(S)).toBe(false);
  });

  it('a failed construction is not cached and can be retried', async () => {
    let attempts = 0;
    class Flaky {
      async onInit() {
        if (++attempts === 1) throw new Error('boom');
      }
    }
    const p = new ServiceCollection().addSingleton(Flaky).buildServiceProvider();
    await expect(p.getRequiredService(Flaky)).rejects.toThrow('boom');
    await expect(p.getRequiredService(Flaky)).resolves.toBeInstanceOf(Flaky);
  });

  it('keyed lookups report token and key', async () => {
    const p = new ServiceCollection().buildServiceProvider();
    const err: any = await p.getRequiredKeyedService('svc', 'k').catch((e) => e);
    expect(err).toBeInstanceOf(ServiceNotFoundError);
    expect(err.message).toBe("No service registered for 'svc' with key 'k'.");
    expect(err.key).toBe('k');
  });

  it('factories receive the key of keyed registrations', async () => {
    const p = new ServiceCollection().addKeyedTransient('conn', (_sp, key) => `db:${String(key)}`, 'eu').buildServiceProvider();
    expect(await p.getRequiredKeyedService('conn', 'eu')).toBe('db:eu');
  });

  it('registration errors are explicit', () => {
    const services = new ServiceCollection();
    expect(() => services.addSingleton('x', 42 as any)).toThrow(RegistrationError);
    expect(() => services.addSingleton(createToken('t') as any)).toThrow(RegistrationError);
  });

  it('abstract classes and InjectionTokens work as tokens', async () => {
    abstract class Clock {
      abstract now(): number;
    }
    class Fixed extends Clock {
      now() {
        return 42;
      }
    }
    const Name = createToken<string>('Name');
    const p = new ServiceCollection().addSingleton(Clock, Fixed).addValue(Name, 'ioc').buildServiceProvider();
    expect((await p.getRequiredService(Clock)).now()).toBe(42);
    expect(await p.getRequiredService(Name)).toBe('ioc');
    expect(String(Name)).toBe('InjectionToken(Name)');
  });
});
