import { CircularDependencyError, ServiceCollection, tokenName, ValidationError } from '../src/index.ts';

describe('edge cases', () => {
  it('tokenName handles every token shape', () => {
    expect(tokenName(undefined)).toBe('unknown');
    expect(tokenName(Symbol())).toBe('Symbol()');
    expect(tokenName(Symbol('x'))).toBe('Symbol(x)');
    expect(tokenName((() => class {})())).toBe('anonymous class');
  });

  it('a cycle partner can be checked with instanceof and stored during construction', async () => {
    let sawInstance = false;
    class A {
      constructor(public b: B) {}
    }
    class B {
      constructor(public a: A) {
        sawInstance = a instanceof A; // prototype is known before A is built
      }
    }
    const p = new ServiceCollection().addSingleton(A, [B]).addSingleton(B, [A]).buildServiceProvider();
    const a = await p.getRequiredService(A);
    expect(sawInstance).toBe(true);
    expect(Object.getOwnPropertyDescriptor(a, 'missing')).toBeUndefined();
    expect(Object.getOwnPropertyDescriptor(a, 'b')?.value).toBe(a.b);
  });

  it('writing to a cycle partner during construction also throws', async () => {
    class A {
      constructor(public b: B) {}
    }
    class B {
      constructor(a: A) {
        (a as any).touched = true;
      }
    }
    const p = new ServiceCollection().addSingleton(A, [B]).addSingleton(B, [A]).buildServiceProvider();
    await expect(p.getRequiredService(A)).rejects.toBeInstanceOf(CircularDependencyError);
  });

  it('three-node scoped cycle shares one instance per scope', async () => {
    class A {
      constructor(public b: B) {}
    }
    class B {
      constructor(public c: C) {}
    }
    class C {
      constructor(public a: A) {}
    }
    const p = new ServiceCollection().addScoped(A, [B]).addScoped(B, [C]).addScoped(C, [A]).buildServiceProvider();
    const s1 = p.createScope();
    const a = await s1.getRequiredService(A);
    expect(a.b.c.a).toBe(a);
    expect(await s1.getRequiredService(C)).toBe(a.b.c);
    expect(await p.createScope().getRequiredService(A)).not.toBe(a);
  });

  it('captive detection walks diamonds once and stops at singletons', () => {
    class Leaf {}
    class Single2 {
      constructor(public l: Leaf) {}
    }
    class Left {
      constructor(public l: Leaf) {}
    }
    class Right {
      constructor(public l: Leaf) {}
    }
    class Top {
      constructor(
        public a: Left,
        public b: Right,
        public s: Single2,
      ) {}
    }
    const ok = new ServiceCollection()
      .addTransient(Leaf)
      .addTransient(Left, [Leaf])
      .addTransient(Right, [Leaf])
      .addSingleton(Single2, [Leaf])
      .addSingleton(Top, [Left, Right, Single2]);
    expect(() => ok.buildServiceProvider({ validateOnBuild: true, validateScopes: true })).not.toThrow();
    ok.addScoped(Leaf);
    const err = (() => {
      try {
        ok.buildServiceProvider({ validateOnBuild: true, validateScopes: true });
      } catch (e) {
        return e as ValidationError;
      }
    })()!;
    expect(err.errors).toEqual([
      "Singleton 'Single2' captures scoped 'Leaf' (Single2 → Leaf).",
      "Singleton 'Top' captures scoped 'Leaf' (Top → Left → Leaf).",
    ]);
  });

  it('validateOnBuild reports missing dependencies of keyed registrations', () => {
    class Repo {
      constructor(public db: unknown) {}
    }
    const services = new ServiceCollection().addKeyedSingleton('repo', Repo, 'k', ['db']);
    expect(() => services.buildServiceProvider({ validateOnBuild: true })).toThrow("'repo' (key 'k') depends on 'db', which is not registered.");
  });

  it('a resolution error inside a scope does not poison other scopes', async () => {
    let fail = true;
    class S {
      onInit() {
        if (fail) throw new Error('nope');
      }
    }
    const p = new ServiceCollection().addScoped(S).buildServiceProvider();
    await expect(p.createScope().getRequiredService(S)).rejects.toThrow('nope');
    fail = false;
    await expect(p.createScope().getRequiredService(S)).resolves.toBeInstanceOf(S);
  });

  it('transient factories run every time and nested factory resolutions see the scope', async () => {
    let n = 0;
    class Scoped {}
    const p = new ServiceCollection()
      .addScoped(Scoped)
      .addTransient('pair', async (sp) => ({ n: ++n, scoped: await sp.getRequiredService(Scoped) }))
      .buildServiceProvider({ validateScopes: true });
    const scope = p.createScope();
    const a = await scope.getRequiredService<{ n: number; scoped: Scoped }>('pair');
    const b = await scope.getRequiredService<{ n: number; scoped: Scoped }>('pair');
    expect([a.n, b.n]).toEqual([1, 2]);
    expect(a.scoped).toBe(b.scoped);
  });
});
