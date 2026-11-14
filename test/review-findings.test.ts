// Defects found by an independent review of the rewritten core (D1–D8); each failed before its fix.
import { ServiceCollection, ServiceProvider, CircularDependencyError, DisposedError } from '../src/index.ts';

const tick = (ms = 5) => new Promise((r) => setTimeout(r, ms));

describe('review findings', () => {
  it('D1 stored factory provider: later self-resolution returns a proxy and flips the cached identity', async () => {
    class Svc { constructor(public p: ServiceProvider) {} }
    const sc = new ServiceCollection();
    sc.addSingleton(Svc, (p) => new Svc(p));
    const root = sc.buildServiceProvider();
    const a = await root.getRequiredService(Svc);
    const viaStored = await a.p.getRequiredService(Svc); // stale context still has Svc on the stack
    const again = await root.getRequiredService(Svc);
    expect(viaStored).toBe(a);
    expect(again).toBe(a);
  });

  it('D1b stored factory provider: transient resolved later via stored provider returns proxy of the old instance', async () => {
    let n = 0;
    class T { id = ++n; constructor(public p: ServiceProvider) {} }
    const sc = new ServiceCollection();
    sc.addTransient(T, (p) => new T(p));
    const root = sc.buildServiceProvider();
    const t1 = await root.getRequiredService(T);
    const t2 = await t1.p.getRequiredService(T);
    expect(t2.id).not.toBe(t1.id);
  });

  it('D2 failed construction leaves the cycle partner cached with a dead proxy', async () => {
    let fail = true;
    class A { constructor(public b: any) { if (fail) throw new Error('boom'); } }
    class B { constructor(public a: any) {} }
    const sc = new ServiceCollection();
    sc.addSingleton(A, A, [B as any]);
    sc.addSingleton(B, B, [A as any]);
    const root = sc.buildServiceProvider();
    await expect(root.getRequiredService(A)).rejects.toThrow('boom');
    fail = false;
    const a = await root.getRequiredService(A);
    const b = await root.getRequiredService(B);
    expect(b.a === a).toBe(true);
    let err: unknown; try { (b.a as any).b; } catch (e) { err = e; }
    expect(err).toBeUndefined();
  });

  it('D3 onInit throwing: constructed disposable instance is never disposed', async () => {
    let destroyed = 0;
    class R { onInit() { throw new Error('init'); } onDestroy() { destroyed++; } }
    const sc = new ServiceCollection();
    sc.addSingleton(R);
    const root = sc.buildServiceProvider();
    await expect(root.getRequiredService(R)).rejects.toThrow('init');
    await root.dispose();
    expect(destroyed).toBe(1);
  });

  it('D4 an instance finished after its scope was disposed is disposed, not leaked', async () => {
    let destroyed = 0;
    class Slow { async onInit() { await tick(); } onDestroy() { destroyed++; } }
    const sc = new ServiceCollection();
    sc.addScoped(Slow);
    const root = sc.buildServiceProvider();
    const scope = root.createScope();
    const p = scope.getRequiredService(Slow);
    await tick(1);
    await scope.dispose();
    // The scope was disposed mid-construction: the instance is disposed, not leaked, and the caller is told.
    await expect(p).rejects.toBeInstanceOf(DisposedError);
    expect(destroyed).toBe(1);
  });

  it('D5 proxy (canonical instance in a cycle) breaks function identity and constructor', async () => {
    class A { handler = () => 1; constructor(public b: any) {} }
    class B { constructor(public a: any) {} }
    const sc = new ServiceCollection();
    sc.addSingleton(A, A, [B as any]);
    sc.addSingleton(B, B, [A as any]);
    const root = sc.buildServiceProvider();
    const a = await root.getRequiredService(A); // A -> B -> proxy(A): A becomes the proxy
    expect(a === (await root.getRequiredService(B)).a).toBe(true);
    expect(a.constructor === A).toBe(true);
    expect(a.handler === a.handler).toBe(true);
  });

  it('D6 freezing a cycle proxy fails with a plain TypeError, not an invariant violation, and the proxy keeps working', async () => {
    class A { x = 1; constructor(public b: any) {} }
    class B { constructor(public a: any) {} }
    const sc = new ServiceCollection();
    sc.addSingleton(A, A, [B as any]);
    sc.addSingleton(B, B, [A as any]);
    const root = sc.buildServiceProvider();
    const a = await root.getRequiredService(A);
    expect(() => Object.freeze(a)).toThrow(TypeError);
    expect(Object.isExtensible(a)).toBe(true);
    expect(a.x).toBe(1);
  });

  it('D7 concurrent dispose(): second caller resolves before disposal finishes', async () => {
    let done = false;
    class R { async onDestroy() { await tick(); done = true; } }
    const sc = new ServiceCollection();
    sc.addSingleton(R);
    const root = sc.buildServiceProvider();
    await root.getRequiredService(R);
    const first = root.dispose();
    await root.dispose();
    expect(done).toBe(true);
    await first;
  });

  it('D8 a factory-built cycle partner reports its real prototype', async () => {
    class A { constructor(public b: any) {} }
    class B { constructor(public a: any) {} }
    const sc = new ServiceCollection();
    sc.addSingleton(A, async (p) => new A(await p.getRequiredService(B)));
    sc.addSingleton(B, B, [A as any]);
    const root = sc.buildServiceProvider();
    const a = await root.getRequiredService(A);
    expect(a).toBeInstanceOf(A);
    expect(Object.getPrototypeOf(a)).toBe(A.prototype);
    expect(() => Object.preventExtensions(a)).toThrow(TypeError);
  });
  it('D4b a transient still initialising when the root is disposed is disposed by its scope, not leaked', async () => {
    let destroyed = 0;
    class Slow { async onInit() { await tick(); } onDestroy() { destroyed++; } }
    const root = new ServiceCollection().addTransient(Slow).buildServiceProvider();
    const pending = root.createScope().getRequiredService(Slow);
    await tick(1);
    await root.dispose();
    await expect(pending).rejects.toBeInstanceOf(DisposedError);
    expect(destroyed).toBe(1);
  });
});
