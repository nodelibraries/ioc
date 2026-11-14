import { CircularDependencyError, DisposedError, ScopeError, ServiceNotFoundError } from './errors.ts';
import { ServiceLifetime, tokenName, type ServiceDescriptor, type ServiceKey, type Token } from './types.ts';

/** One resolution of one descriptor (cached for singletons and scoped services). */
interface Entry {
  readonly desc: ServiceDescriptor;
  promise?: Promise<unknown>;
  instance?: unknown;
  /** The constructor (or factory) has returned: `instance` is usable. */
  constructed: boolean;
  /** `onInit` has finished too. */
  done: boolean;
  /** Pending entries this one is awaiting: lets two concurrent chains detect that they wait on each other. */
  readonly waitingFor: Set<Entry>;
  proxy?: object;
  /** Provider caching this entry (none for transients). */
  owner?: ServiceProvider;
  /**
   * Entries that may hold this entry's proxy: those created while it was being built, and chains it was handed to.
   * If this entry fails after handing out its proxy, they are evicted so a retry rebuilds them. Cleared on success.
   */
  tainted: Entry[];
}

/** The chain of services being resolved, outermost first. Each top-level call starts its own. */
interface Context {
  readonly stack: readonly Entry[];
}

const isObject = (value: unknown): value is object => (typeof value === 'object' && value !== null) || typeof value === 'function';

/** The instance callers get: the proxy if a cycle handed one out (keeps identity), else the instance itself. */
const canonical = (entry: Entry): unknown => (entry.proxy && isObject(entry.instance) ? entry.proxy : entry.instance);

const hasDisposer = (value: unknown): boolean =>
  typeof value === 'object' &&
  value !== null &&
  (typeof (value as any).onDestroy === 'function' ||
    typeof (value as any)[Symbol.asyncDispose] === 'function' ||
    typeof (value as any)[Symbol.dispose] === 'function');

async function disposeOne(value: any): Promise<void> {
  if (typeof value.onDestroy === 'function') await value.onDestroy();
  else if (typeof value[Symbol.asyncDispose] === 'function') await value[Symbol.asyncDispose]();
  else value[Symbol.dispose]();
}

/**
 * Resolves services registered in a {@link ServiceCollection}. The root provider owns singletons;
 * {@link createScope} returns a scope that owns its scoped services. Modeled on .NET's `IServiceProvider`.
 *
 * Supports `await using`: `await using scope = provider.createScope();`.
 */
export class ServiceProvider {
  private readonly root: ServiceProvider;
  private readonly isScope: boolean;
  /** Cached entries: singletons on the root, scoped services on each scope. Keyed by descriptor, so every registration has its own instance. */
  private readonly cache = new Map<ServiceDescriptor, Entry>();
  /** Instances to dispose, in creation order. */
  private readonly disposables: unknown[] = [];
  private disposed = false;
  private disposing?: Promise<void>;
  /** The real provider; factory views (created with Object.create) inherit it. */
  private readonly self: ServiceProvider;
  /** Set only on the per-resolution view handed to factories, so their nested resolutions join the chain. */
  private readonly context?: Context;

  private readonly services: Map<Token, ServiceDescriptor[]>;
  private readonly keyed: Map<Token, Map<ServiceKey, ServiceDescriptor>>;
  private readonly validateScopes: boolean;

  /** @internal Use {@link ServiceCollection.buildServiceProvider} or {@link createScope}. */
  constructor(
    services: Map<Token, ServiceDescriptor[]>,
    keyed: Map<Token, Map<ServiceKey, ServiceDescriptor>>,
    validateScopes: boolean,
    root?: ServiceProvider,
  ) {
    this.services = services;
    this.keyed = keyed;
    this.validateScopes = validateScopes;
    this.self = this;
    this.root = root ?? this;
    this.isScope = root !== undefined;
  }

  /** Resolves `token`, or returns `undefined` if it is not registered. With several registrations, the last one wins. */
  getService<T>(token: Token<T>): Promise<T | undefined>;
  async getService(token: Token): Promise<unknown> {
    this.assertAlive();
    const desc = this.services.get(token)?.at(-1);
    return desc && this.resolve(desc, this.context ?? { stack: [] });
  }

  /** Resolves `token`, throwing `ServiceNotFoundError` if it is not registered. */
  getRequiredService<T>(token: Token<T>): Promise<T>;
  async getRequiredService(token: Token): Promise<unknown> {
    this.assertAlive();
    return this.resolveToken(token, this.context ?? { stack: [] });
  }

  /** Resolves every registration of `token`, in registration order. Empty if none. */
  getServices<T>(token: Token<T>): Promise<T[]>;
  async getServices(token: Token): Promise<unknown[]> {
    this.assertAlive();
    const results: unknown[] = [];
    for (const desc of this.services.get(token) ?? []) results.push(await this.resolve(desc, this.context ?? { stack: [] }));
    return results;
  }

  /** Resolves the keyed registration of `token` for `key`, or `undefined`. */
  getKeyedService<T>(token: Token<T>, key: ServiceKey): Promise<T | undefined>;
  async getKeyedService(token: Token, key: ServiceKey): Promise<unknown> {
    this.assertAlive();
    const desc = this.keyed.get(token)?.get(key);
    return desc && this.resolve(desc, this.context ?? { stack: [] });
  }

  /** Resolves the keyed registration of `token` for `key`, throwing `ServiceNotFoundError` if there is none. */
  getRequiredKeyedService<T>(token: Token<T>, key: ServiceKey): Promise<T>;
  async getRequiredKeyedService(token: Token, key: ServiceKey): Promise<unknown> {
    this.assertAlive();
    const desc = this.keyed.get(token)?.get(key);
    if (!desc) throw new ServiceNotFoundError(token, key, this.context?.stack.map((e) => e.desc.token));
    return this.resolve(desc, this.context ?? { stack: [] });
  }

  /** True if `token` (or `token` with `key`) is registered. False once disposed. */
  isService<T>(token: Token<T>, key?: ServiceKey): boolean {
    if (this.self.disposed || this.root.disposed) return false;
    return key === undefined ? this.services.has(token) : (this.keyed.get(token)?.has(key) ?? false);
  }

  /** Creates a scope: scoped services resolve once per scope. Dispose it when done (or use `await using`). */
  createScope(): ServiceProvider {
    this.assertAlive();
    return new ServiceProvider(this.services, this.keyed, this.validateScopes, this.root);
  }

  /**
   * Disposes every instance this provider (or scope) created, in reverse creation order:
   * `onDestroy()`, else `[Symbol.asyncDispose]()`, else `[Symbol.dispose]()`. Disposing the root
   * disposes singletons; disposing a scope disposes its scoped and transient instances.
   * Every instance is disposed even if some throw; the errors are rethrown afterwards
   * (an `AggregateError` if more than one). Later calls wait for the first one and do not rethrow.
   */
  dispose(): Promise<void> {
    const self = this.self;
    if (self.disposing) return self.disposing.catch(() => {});
    return (self.disposing = self.disposeAll());
  }

  private async disposeAll(): Promise<void> {
    this.disposed = true;
    const errors: unknown[] = [];
    for (const instance of this.disposables.splice(0).reverse()) {
      try {
        await disposeOne(instance);
      } catch (error) {
        errors.push(error);
      }
    }
    this.cache.clear();
    if (errors.length === 1) throw errors[0];
    if (errors.length > 1) throw new AggregateError(errors, `${errors.length} services failed to dispose.`);
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.dispose();
  }

  private assertAlive(): void {
    if (this.self.disposed || this.root.disposed) throw new DisposedError();
  }

  private resolveToken(token: Token, ctx: Context): Promise<unknown> {
    const desc = this.services.get(token)?.at(-1);
    if (!desc) throw new ServiceNotFoundError(token, undefined, ctx.stack.map((e) => e.desc.token));
    return this.resolve(desc, ctx);
  }

  private async resolve(desc: ServiceDescriptor, ctx: Context): Promise<unknown> {
    if ('value' in desc) return desc.value;

    const owner = this.ownerFor(desc, ctx);

    // A cycle within this chain: hand out a proxy to the instance being built.
    const inChain = ctx.stack.find((e) => e.desc === desc);
    if (inChain) return this.proxyFor(inChain, ctx);

    let entry = owner?.cache.get(desc);
    if (entry) {
      if (entry.done) return canonical(entry);
      // Two concurrent chains waiting on each other would deadlock: treat it as a cycle.
      if (waitsOn(entry, ctx.stack)) return this.proxyFor(entry, ctx);
    } else {
      const created: Entry = (entry = { desc, owner, constructed: false, done: false, waitingFor: new Set(), tainted: [] });
      owner?.cache.set(desc, created);
      for (const ancestor of ctx.stack) ancestor.tainted.push(created);
      created.promise = (owner ?? this).create(created, { stack: [...ctx.stack, created] }).then(
        (instance) => {
          created.tainted = [];
          return instance;
        },
        (error) => {
          ServiceProvider.evict(created);
          // Anything that captured this entry's proxy now holds a dead reference: rebuild it next time.
          if (created.proxy) created.tainted.forEach(ServiceProvider.evict);
          throw error;
        },
      );
    }
    const waiter = ctx.stack.at(-1);
    waiter?.waitingFor.add(entry);
    try {
      return await entry.promise;
    } finally {
      waiter?.waitingFor.delete(entry);
    }
  }

  /** Provider that caches the instance: the root for singletons, the scope for scoped services, none for transients. */
  private ownerFor(desc: ServiceDescriptor, ctx: Context): ServiceProvider | undefined {
    if (desc.lifetime === ServiceLifetime.Singleton) return this.root;
    if (desc.lifetime === ServiceLifetime.Transient) return undefined;
    if (this.validateScopes) {
      const singleton = ctx.stack.find((e) => e.desc.lifetime === ServiceLifetime.Singleton);
      if (singleton) {
        const path = ctx.stack.slice(ctx.stack.indexOf(singleton)).map((e) => tokenName(e.desc.token));
        throw new ScopeError(
          `Scoped service '${tokenName(desc.token)}' cannot be injected into singleton '${tokenName(singleton.desc.token)}' ` +
            `(${[...path, tokenName(desc.token)].join(' → ')}): the singleton would keep one scope's instance forever.`,
        );
      }
      if (!this.isScope) {
        throw new ScopeError(
          `Scoped service '${tokenName(desc.token)}' cannot be resolved from the root provider. ` +
            'Create a scope first: `await using scope = provider.createScope();`',
        );
      }
    }
    return this.isScope ? this : this.root;
  }

  private async create(entry: Entry, ctx: Context): Promise<unknown> {
    this.assertAlive();
    const { desc } = entry;
    let instance: unknown;
    if (desc.factory) {
      // A view of this provider that carries the chain while the factory runs, so its own resolutions join it.
      // After the factory settles the view behaves like the provider itself (factories may keep it).
      let active = true;
      const view = Object.create(this, { context: { get: () => (active ? ctx : undefined) } }) as ServiceProvider;
      try {
        const factory = desc.factory; // called unbound: `this` is undefined, not the descriptor
        instance = await factory(view, desc.key);
      } finally {
        active = false;
      }
      this.track(entry, instance);
    } else {
      const args: unknown[] = [];
      for (const dep of desc.dependencies) args.push(await this.resolveToken(dep, ctx));
      instance = new desc.implementation!(...args);
      // Tracked before onInit, so an instance whose onInit throws is still disposed with its owner.
      this.track(entry, instance);
      if (typeof (instance as any)?.onInit === 'function') await (instance as any).onInit();
    }
    if (this.self.disposed || this.root.disposed) {
      // The owner was disposed while this was being built: clean it up instead of leaking it.
      // (If dispose() already took it from the list, it was disposed there.)
      const at = this.disposables.indexOf(instance);
      if (at !== -1) {
        this.disposables.splice(at, 1);
        await disposeOne(instance);
      }
      throw new DisposedError();
    }
    entry.done = true;
    return canonical(entry);
  }

  private static evict(entry: Entry): void {
    if (entry.owner?.cache.get(entry.desc) === entry) entry.owner.cache.delete(entry.desc);
  }

  private track(entry: Entry, instance: unknown): void {
    entry.instance = instance;
    entry.constructed = true;
    if (hasDisposer(instance)) this.disposables.push(instance);
  }

  /** A stand-in for an instance still being built, forwarding to it once its constructor has returned. */
  private proxyFor(entry: Entry, ctx: Context): object {
    // A chain handed this proxy from outside (concurrent cycle) must be rebuilt if the entry later fails.
    if (!ctx.stack.includes(entry)) entry.tainted.push(...ctx.stack);
    if (entry.proxy) return entry.proxy;
    const start = ctx.stack.indexOf(entry);
    const path = [...ctx.stack.slice(start === -1 ? 0 : start), entry].map((e) => e.desc.token);
    const proto = entry.desc.implementation?.prototype ?? Object.prototype;
    const target = (): any => {
      if (!entry.constructed) throw new CircularDependencyError(path);
      return Object(entry.instance);
    };
    // Bound methods are cached so `proxy.fn === proxy.fn` holds (listener removal, memoisation).
    const bound = new WeakMap<Function, Function>();
    return (entry.proxy = new Proxy(Object.create(proto), {
      get(_, prop) {
        // Promise machinery probes `then`; answer it without forcing the instance.
        if (prop === 'then' && !entry.constructed) return undefined;
        const instance = target();
        const value = Reflect.get(instance, prop, instance);
        if (typeof value !== 'function' || prop === 'constructor') return value;
        // Bind methods so `#private` fields and `this` refer to the real instance.
        let fn = bound.get(value);
        if (!fn) bound.set(value, (fn = value.bind(instance)));
        return fn;
      },
      set: (_, prop, value) => Reflect.set(target(), prop, value),
      has: (_, prop) => Reflect.has(target(), prop),
      ownKeys: () => Reflect.ownKeys(target()),
      getOwnPropertyDescriptor(_, prop) {
        const d = Reflect.getOwnPropertyDescriptor(target(), prop);
        // The proxy target is empty, so a reported property must be configurable.
        if (d) d.configurable = true;
        return d;
      },
      defineProperty: (_, prop, d) => Reflect.defineProperty(target(), prop, d),
      deleteProperty: (_, prop) => Reflect.deleteProperty(target(), prop),
      getPrototypeOf: () => (entry.constructed ? Reflect.getPrototypeOf(target()) : proto),
      // The empty proxy target must stay extensible for the traps above to be valid: cycle proxies cannot be frozen.
      isExtensible: () => true,
      preventExtensions: () => false,
    }));
  }
}

/** True if `entry` is in `stack` or (transitively) waiting on an entry that is. */
function waitsOn(entry: Entry, stack: readonly Entry[]): boolean {
  const seen = new Set<Entry>();
  const queue = [entry];
  while (queue.length) {
    const next = queue.pop()!;
    if (stack.includes(next)) return true;
    if (seen.has(next)) continue;
    seen.add(next);
    queue.push(...next.waitingFor);
  }
  return false;
}
