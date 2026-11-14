// Randomised invariant checks: random registration graphs, random lifetimes, random async init,
// resolved concurrently from random scopes. Seeded, so a failure prints a reproducible seed.
import { ServiceCollection, ServiceLifetime, type ServiceProvider } from '../src/index.ts';

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LIFETIMES = [ServiceLifetime.Singleton, ServiceLifetime.Scoped, ServiceLifetime.Transient] as const;

interface Node {
  id: number;
  deps: unknown[];
  destroyed: number;
}

function buildGraph(seed: number, size: number, allowCycles: boolean) {
  const rand = rng(seed);
  const lifetimes = Array.from({ length: size }, () => LIFETIMES[Math.floor(rand() * 3)]);
  // Edges go to lower indexes (a DAG); with allowCycles, some go back up.
  const edges = lifetimes.map((_, i) =>
    Array.from({ length: size }, (_, j) => j).filter((j) => (j < i ? rand() < 0.35 : allowCycles && j > i && rand() < 0.08)),
  );
  const tokens = lifetimes.map((_, i) => `s${i}`);
  const services = new ServiceCollection();
  const created: Node[] = [];
  lifetimes.forEach((lifetime, i) => {
    const asyncInit = rand() < 0.5;
    const delay = Math.floor(rand() * 3);
    const Impl = class {
      id = created.length;
      deps: unknown[];
      destroyed = 0;
      constructor(...deps: unknown[]) {
        this.deps = deps;
        created.push(this);
      }
      async onInit() {
        if (asyncInit) await new Promise((r) => setTimeout(r, delay));
      }
      onDestroy() {
        this.destroyed++;
      }
    };
    const deps = edges[i].map((j) => tokens[j]);
    if (lifetime === ServiceLifetime.Singleton) services.addSingleton(tokens[i], Impl, deps);
    else if (lifetime === ServiceLifetime.Scoped) services.addScoped(tokens[i], Impl, deps);
    else services.addTransient(tokens[i], Impl, deps);
  });
  return { services, lifetimes, edges, tokens, created };
}

const withTimeout = <T,>(p: Promise<T>, seed: number) =>
  Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error(`deadlock (seed ${seed})`)), 2000))]);

describe('random graphs', () => {
  const SEEDS = Array.from({ length: 60 }, (_, i) => 1000 + i);

  it.each(SEEDS)('acyclic graph, seed %i: lifetimes hold under concurrency, dispose runs once each', async (seed) => {
    const { services, lifetimes, edges, tokens, created } = buildGraph(seed, 8, false);
    const rand = rng(seed * 7);
    const root = services.buildServiceProvider();
    const scopes = [root.createScope(), root.createScope(), root.createScope()];
    const calls: Array<{ scope: ServiceProvider; i: number; p: Promise<any> }> = [];
    for (let k = 0; k < 40; k++) {
      const scope = scopes[Math.floor(rand() * scopes.length)];
      const i = Math.floor(rand() * tokens.length);
      calls.push({ scope, i, p: scope.getRequiredService(tokens[i]) });
    }
    const results = await withTimeout(Promise.all(calls.map((c) => c.p)), seed);

    const singletonOf = new Map<number, unknown>();
    const scopedOf = new Map<string, unknown>();
    const transients = new Set<unknown>();
    results.forEach((instance, k) => {
      const { scope, i } = calls[k];
      const lifetime = lifetimes[i];
      if (lifetime === ServiceLifetime.Singleton) {
        if (singletonOf.has(i)) expect(instance).toBe(singletonOf.get(i));
        singletonOf.set(i, instance);
      } else if (lifetime === ServiceLifetime.Scoped) {
        const key = `${scopes.indexOf(scope)}:${i}`;
        if (scopedOf.has(key)) expect(instance).toBe(scopedOf.get(key));
        scopedOf.set(key, instance);
      } else {
        expect(transients.has(instance)).toBe(false);
        transients.add(instance);
      }
      // Each injected dependency is the instance its lifetime dictates.
      edges[i].forEach((j, pos) => {
        const dep = instance.deps[pos];
        if (lifetimes[j] === ServiceLifetime.Singleton && singletonOf.has(j)) expect(dep).toBe(singletonOf.get(j));
      });
    });
    // Scoped instances differ between scopes.
    for (let i = 0; i < tokens.length; i++) {
      if (lifetimes[i] !== ServiceLifetime.Scoped) continue;
      const perScope = scopes.map((_, s) => scopedOf.get(`${s}:${i}`)).filter(Boolean);
      expect(new Set(perScope).size).toBe(perScope.length);
    }

    for (const scope of scopes) await scope.dispose();
    await root.dispose();
    for (const node of created) expect(node.destroyed).toBe(1);
  });

  it.each(SEEDS.slice(0, 40))('cyclic graph, seed %i: never deadlocks, every instance disposed once', async (seed) => {
    const { services, tokens, created } = buildGraph(seed, 7, true);
    const rand = rng(seed * 13);
    const root = services.buildServiceProvider();
    const scopes = [root.createScope(), root.createScope()];
    const calls = Array.from({ length: 30 }, () => {
      const scope = scopes[Math.floor(rand() * scopes.length)];
      return scope.getRequiredService<Node>(tokens[Math.floor(rand() * tokens.length)]);
    });
    const results = await withTimeout(Promise.all(calls), seed);
    // Instances (or their cycle proxies) are fully built once resolution returns.
    for (const r of results) expect(typeof r.id).toBe('number');
    for (const scope of scopes) await scope.dispose();
    await root.dispose();
    for (const node of created) expect(node.destroyed).toBe(1);
  });
});
