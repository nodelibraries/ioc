import { RegistrationError, ValidationError } from './errors.ts';
import { ServiceProvider } from './service-provider.ts';
import {
  ServiceLifetime,
  tokenName,
  type CircularDependency,
  type Dependencies,
  type DependencyTreeNode,
  type Newable,
  type ServiceDescriptor,
  type ServiceFactory,
  type ServiceKey,
  type Token,
} from './types.ts';

/** Options for {@link ServiceCollection.buildServiceProvider}. */
export interface BuildOptions {
  /**
   * Throw a `ScopeError` when a scoped service is resolved from the root provider
   * or captured by a singleton. Recommended in development.
   */
  validateScopes?: boolean;
  /** Check every registration up front (missing dependencies, captive scoped services) and throw a `ValidationError`. */
  validateOnBuild?: boolean;
}

/** True for `class` syntax. Plain functions and arrow functions are treated as factories. */
const isClass = (fn: unknown): fn is Newable =>
  typeof fn === 'function' && /^class[\s{]/.test(Function.prototype.toString.call(fn));

/**
 * Collects service registrations, then builds a {@link ServiceProvider}.
 * Modeled on .NET's `IServiceCollection`.
 *
 * @example
 * ```ts
 * const services = new ServiceCollection();
 * services.addSingleton(Logger, ConsoleLogger);
 * services.addScoped(UserService, [Logger]);
 * const provider = services.buildServiceProvider({ validateScopes: true });
 * ```
 */
export class ServiceCollection {
  private readonly services = new Map<Token, ServiceDescriptor[]>();
  private readonly keyed = new Map<Token, Map<ServiceKey, ServiceDescriptor>>();

  /**
   * Registers a singleton: one instance for the root provider and all its scopes.
   *
   * - `addSingleton(Class)` / `addSingleton(Class, [deps])`: the class is its own token.
   * - `addSingleton(token, Implementation, [deps])`: `deps` are checked against the constructor's parameters.
   * - `addSingleton(token, (provider) => instance)`: a factory, may be async.
   */
  addSingleton<T>(token: Token<T>, factory: ServiceFactory<NoInfer<T>>): this;
  addSingleton<T>(token: Newable<T, []>): this;
  addSingleton<T, A extends unknown[] = any[]>(token: Newable<T, A>, dependencies: Dependencies<A>): this;
  addSingleton<T>(token: Token<T>, implementation: Newable<NoInfer<T>, []>): this;
  addSingleton<T, A extends unknown[] = any[]>(token: Token<T>, implementation: Newable<NoInfer<T>, A>, dependencies: Dependencies<A>): this;
  addSingleton(token: Token, second?: unknown, third?: readonly Token[]): this {
    return this.add(ServiceLifetime.Singleton, token, second, third);
  }

  /** Registers a scoped service: one instance per scope. Same forms as {@link addSingleton}. */
  addScoped<T>(token: Token<T>, factory: ServiceFactory<NoInfer<T>>): this;
  addScoped<T>(token: Newable<T, []>): this;
  addScoped<T, A extends unknown[] = any[]>(token: Newable<T, A>, dependencies: Dependencies<A>): this;
  addScoped<T>(token: Token<T>, implementation: Newable<NoInfer<T>, []>): this;
  addScoped<T, A extends unknown[] = any[]>(token: Token<T>, implementation: Newable<NoInfer<T>, A>, dependencies: Dependencies<A>): this;
  addScoped(token: Token, second?: unknown, third?: readonly Token[]): this {
    return this.add(ServiceLifetime.Scoped, token, second, third);
  }

  /** Registers a transient service: a new instance on every resolution. Same forms as {@link addSingleton}. */
  addTransient<T>(token: Token<T>, factory: ServiceFactory<NoInfer<T>>): this;
  addTransient<T>(token: Newable<T, []>): this;
  addTransient<T, A extends unknown[] = any[]>(token: Newable<T, A>, dependencies: Dependencies<A>): this;
  addTransient<T>(token: Token<T>, implementation: Newable<NoInfer<T>, []>): this;
  addTransient<T, A extends unknown[] = any[]>(token: Token<T>, implementation: Newable<NoInfer<T>, A>, dependencies: Dependencies<A>): this;
  addTransient(token: Token, second?: unknown, third?: readonly Token[]): this {
    return this.add(ServiceLifetime.Transient, token, second, third);
  }

  /** Like {@link addSingleton}, but does nothing if `token` is already registered. */
  tryAddSingleton<T>(token: Token<T>, factory: ServiceFactory<NoInfer<T>>): this;
  tryAddSingleton<T>(token: Newable<T, []>): this;
  tryAddSingleton<T, A extends unknown[] = any[]>(token: Newable<T, A>, dependencies: Dependencies<A>): this;
  tryAddSingleton<T>(token: Token<T>, implementation: Newable<NoInfer<T>, []>): this;
  tryAddSingleton<T, A extends unknown[] = any[]>(token: Token<T>, implementation: Newable<NoInfer<T>, A>, dependencies: Dependencies<A>): this;
  tryAddSingleton(token: Token, second?: unknown, third?: readonly Token[]): this {
    return this.services.has(token) ? this : this.add(ServiceLifetime.Singleton, token, second, third);
  }

  /** Like {@link addScoped}, but does nothing if `token` is already registered. */
  tryAddScoped<T>(token: Token<T>, factory: ServiceFactory<NoInfer<T>>): this;
  tryAddScoped<T>(token: Newable<T, []>): this;
  tryAddScoped<T, A extends unknown[] = any[]>(token: Newable<T, A>, dependencies: Dependencies<A>): this;
  tryAddScoped<T>(token: Token<T>, implementation: Newable<NoInfer<T>, []>): this;
  tryAddScoped<T, A extends unknown[] = any[]>(token: Token<T>, implementation: Newable<NoInfer<T>, A>, dependencies: Dependencies<A>): this;
  tryAddScoped(token: Token, second?: unknown, third?: readonly Token[]): this {
    return this.services.has(token) ? this : this.add(ServiceLifetime.Scoped, token, second, third);
  }

  /** Like {@link addTransient}, but does nothing if `token` is already registered. */
  tryAddTransient<T>(token: Token<T>, factory: ServiceFactory<NoInfer<T>>): this;
  tryAddTransient<T>(token: Newable<T, []>): this;
  tryAddTransient<T, A extends unknown[] = any[]>(token: Newable<T, A>, dependencies: Dependencies<A>): this;
  tryAddTransient<T>(token: Token<T>, implementation: Newable<NoInfer<T>, []>): this;
  tryAddTransient<T, A extends unknown[] = any[]>(token: Token<T>, implementation: Newable<NoInfer<T>, A>, dependencies: Dependencies<A>): this;
  tryAddTransient(token: Token, second?: unknown, third?: readonly Token[]): this {
    return this.services.has(token) ? this : this.add(ServiceLifetime.Transient, token, second, third);
  }

  /**
   * Registers a keyed singleton, resolved with `getKeyedService(token, key)`.
   * Keyed registrations are separate from plain ones: `getService(token)` never returns them.
   */
  addKeyedSingleton<T>(token: Token<T>, factory: ServiceFactory<NoInfer<T>>, key: ServiceKey): this;
  addKeyedSingleton<T, A extends unknown[] = any[]>(token: Token<T>, implementation: Newable<NoInfer<T>, A>, key: ServiceKey, dependencies: Dependencies<A>): this;
  addKeyedSingleton<T>(token: Token<T>, implementation: Newable<NoInfer<T>, []>, key: ServiceKey): this;
  addKeyedSingleton(token: Token, second: unknown, key: ServiceKey, dependencies?: readonly Token[]): this {
    return this.add(ServiceLifetime.Singleton, token, second, dependencies, key);
  }

  /** Registers a keyed scoped service. See {@link addKeyedSingleton}. */
  addKeyedScoped<T>(token: Token<T>, factory: ServiceFactory<NoInfer<T>>, key: ServiceKey): this;
  addKeyedScoped<T, A extends unknown[] = any[]>(token: Token<T>, implementation: Newable<NoInfer<T>, A>, key: ServiceKey, dependencies: Dependencies<A>): this;
  addKeyedScoped<T>(token: Token<T>, implementation: Newable<NoInfer<T>, []>, key: ServiceKey): this;
  addKeyedScoped(token: Token, second: unknown, key: ServiceKey, dependencies?: readonly Token[]): this {
    return this.add(ServiceLifetime.Scoped, token, second, dependencies, key);
  }

  /** Registers a keyed transient service. See {@link addKeyedSingleton}. */
  addKeyedTransient<T>(token: Token<T>, factory: ServiceFactory<NoInfer<T>>, key: ServiceKey): this;
  addKeyedTransient<T, A extends unknown[] = any[]>(token: Token<T>, implementation: Newable<NoInfer<T>, A>, key: ServiceKey, dependencies: Dependencies<A>): this;
  addKeyedTransient<T>(token: Token<T>, implementation: Newable<NoInfer<T>, []>, key: ServiceKey): this;
  addKeyedTransient(token: Token, second: unknown, key: ServiceKey, dependencies?: readonly Token[]): this {
    return this.add(ServiceLifetime.Transient, token, second, dependencies, key);
  }

  /** Registers an existing value (config, constants, an instance you built). Any value works, `null` and `undefined` included. Never disposed by the container. */
  addValue<T>(token: Token<T>, value: NoInfer<T>): this {
    return this.push({ token, lifetime: ServiceLifetime.Singleton, value, dependencies: [] });
  }

  /** Removes every registration of `token`, keyed ones included. */
  remove<T>(token: Token<T>): this {
    this.services.delete(token);
    this.keyed.delete(token);
    return this;
  }

  /** Replaces the plain registrations of `token`, keeping the lifetime of the last one (singleton if there was none). */
  replace<T>(token: Token<T>, factory: ServiceFactory<NoInfer<T>>): this;
  replace<T, A extends unknown[] = any[]>(token: Token<T>, implementation: Newable<NoInfer<T>, A>, dependencies: Dependencies<A>): this;
  replace<T>(token: Token<T>, implementation: Newable<NoInfer<T>, []>): this;
  replace(token: Token, second: unknown, dependencies?: readonly Token[]): this {
    const lifetime = this.services.get(token)?.at(-1)?.lifetime ?? ServiceLifetime.Singleton;
    this.services.delete(token);
    return this.add(lifetime, token, second, dependencies);
  }

  /** True if `token` (or `token` with `key`) is registered. */
  has<T>(token: Token<T>, key?: ServiceKey): boolean {
    return key === undefined ? this.services.has(token) : (this.keyed.get(token)?.has(key) ?? false);
  }

  /**
   * Builds the provider. Registrations are copied, so changing this collection afterwards
   * does not affect providers already built.
   */
  buildServiceProvider(options: BuildOptions = {}): ServiceProvider {
    if (options.validateOnBuild) this.validate(options.validateScopes ?? false);
    const services = new Map([...this.services].map(([token, list]) => [token, [...list]]));
    const keyed = new Map([...this.keyed].map(([token, byKey]) => [token, new Map(byKey)]));
    return new ServiceProvider(services, keyed, options.validateScopes ?? false);
  }

  /** Dependency tree of `token`, following the last registration of each dependency. */
  getDependencyTree(token: Token): DependencyTreeNode {
    const build = (current: Token, depth: number, path: Token[]): DependencyTreeNode => {
      const name = tokenName(current);
      if (path.includes(current)) {
        return { token: current, name, lifetime: 'CIRCULAR', dependencies: [], depth, isCircular: true, circularPath: [...path, current] };
      }
      const desc = this.services.get(current)?.at(-1);
      if (!desc) return { token: current, name, lifetime: 'NOT_REGISTERED', dependencies: [], depth };
      const next = [...path, current];
      return { token: current, name, lifetime: desc.lifetime, depth, dependencies: desc.dependencies.map((dep) => build(dep, depth + 1, next)) };
    };
    return build(token, 0, []);
  }

  /** Every dependency cycle among plain registrations. */
  getCircularDependencies(): CircularDependency[] {
    const cycles: CircularDependency[] = [];
    const visited = new Set<Token>();
    const visiting: Token[] = [];
    const visit = (token: Token): void => {
      const at = visiting.indexOf(token);
      if (at !== -1) {
        const path = [...visiting.slice(at), token];
        cycles.push({ path, tokens: path.map((t) => ({ token: t, name: tokenName(t) })) });
        return;
      }
      if (visited.has(token)) return;
      visited.add(token);
      visiting.push(token);
      for (const dep of this.services.get(token)?.at(-1)?.dependencies ?? []) visit(dep);
      visiting.pop();
    };
    for (const token of this.services.keys()) visit(token);
    return cycles;
  }

  /** The dependency tree of `token` as text. */
  visualizeDependencyTree(token: Token): string {
    const lines: string[] = [];
    const format = (node: DependencyTreeNode, prefix: string, isLast: boolean): void => {
      const mark = node.isCircular ? ' ⚠️ CIRCULAR' : '';
      lines.push(`${prefix}${isLast ? '└── ' : '├── '}${node.name} [${node.lifetime}]${mark}`);
      const childPrefix = prefix + (isLast ? '    ' : '│   ');
      node.dependencies.forEach((child, i) => format(child, childPrefix, i === node.dependencies.length - 1));
    };
    format(this.getDependencyTree(token), '', true);
    return lines.join('\n');
  }

  /** Every dependency cycle as text. */
  visualizeCircularDependencies(): string {
    const cycles = this.getCircularDependencies();
    if (cycles.length === 0) return 'No circular dependencies found.';
    const lines = [`Found ${cycles.length} circular ${cycles.length === 1 ? 'dependency' : 'dependencies'}:`, ''];
    cycles.forEach((cycle, i) => lines.push(`Circular Dependency ${i + 1}:`, `  ${cycle.tokens.map((t) => t.name).join(' → ')}`, ''));
    return lines.join('\n');
  }

  private add(lifetime: ServiceLifetime, token: Token, second: unknown, deps: readonly Token[] | undefined, key?: ServiceKey): this {
    if (Array.isArray(second) || second === undefined) {
      // The token is its own implementation: any constructor function is accepted here.
      if (typeof token !== 'function' || !token.prototype) {
        throw new RegistrationError(`'${tokenName(token)}' is not a class: register it with an implementation or a factory.`);
      }
      return this.withClass(lifetime, token, token as Newable, (second as Token[] | undefined) ?? [], key);
    }
    if (isClass(second)) return this.withClass(lifetime, token, second, deps ?? [], key);
    if (typeof second === 'function') {
      return this.push({ token, lifetime, factory: second as ServiceFactory, dependencies: [], key });
    }
    throw new RegistrationError(`Invalid registration for '${tokenName(token)}': expected a class, a factory function or a dependency array.`);
  }

  private withClass(lifetime: ServiceLifetime, token: Token, implementation: Newable, deps: readonly Token[], key?: ServiceKey): this {
    if (implementation.length > deps.length) {
      throw new RegistrationError(
        `'${implementation.name}' has ${implementation.length} constructor parameter(s) but ${deps.length} dependency token(s) were given ` +
          `for '${tokenName(token)}'. Pass one token per parameter, e.g. services.addSingleton(Token, ${implementation.name}, [DepA, DepB]).`,
      );
    }
    return this.push({ token, lifetime, implementation, dependencies: [...deps], key });
  }

  private push(descriptor: ServiceDescriptor): this {
    Object.freeze(descriptor);
    if (descriptor.key !== undefined) {
      let byKey = this.keyed.get(descriptor.token);
      if (!byKey) this.keyed.set(descriptor.token, (byKey = new Map()));
      byKey.set(descriptor.key, descriptor);
    } else {
      const list = this.services.get(descriptor.token);
      if (list) list.push(descriptor);
      else this.services.set(descriptor.token, [descriptor]);
    }
    return this;
  }

  private validate(validateScopes: boolean): void {
    const errors: string[] = [];
    const all = [...[...this.services.values()].flat(), ...[...this.keyed.values()].flatMap((m) => [...m.values()])];
    for (const desc of all) {
      const owner = desc.key === undefined ? `'${tokenName(desc.token)}'` : `'${tokenName(desc.token)}' (key '${String(desc.key)}')`;
      for (const dep of desc.dependencies) {
        if (!this.services.has(dep)) errors.push(`${owner} depends on '${tokenName(dep)}', which is not registered.`);
      }
      if (validateScopes && desc.lifetime === ServiceLifetime.Singleton) {
        const path = this.findScoped(desc, [desc.token], new Set());
        if (path) errors.push(`Singleton ${owner} captures scoped '${tokenName(path.at(-1))}' (${path.map(tokenName).join(' → ')}).`);
      }
    }
    if (errors.length) throw new ValidationError(errors);
  }

  /** Path from a singleton to a scoped service it would capture, if any. */
  private findScoped(desc: ServiceDescriptor, path: Token[], seen: Set<Token>): Token[] | undefined {
    for (const dep of desc.dependencies) {
      if (seen.has(dep)) continue;
      seen.add(dep);
      const depDesc = this.services.get(dep)?.at(-1);
      if (!depDesc || depDesc.lifetime === ServiceLifetime.Singleton) continue;
      if (depDesc.lifetime === ServiceLifetime.Scoped) return [...path, dep];
      const found = this.findScoped(depDesc, [...path, dep], seen);
      if (found) return found;
    }
    return undefined;
  }
}
