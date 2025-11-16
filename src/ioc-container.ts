export enum ServiceLifetime {
  Singleton = 'SINGLETON',
  Scoped = 'SCOPED',
  Transient = 'TRANSIENT',
}

export type Token<T = any> = string | symbol | Newable<T>;
export type Newable<T = any> = { new (...args: any[]): T };

export type ServiceFactory<T = any> = (provider: ServiceProvider) => T | Promise<T>;

export interface ServiceDescriptor<T = any> {
  token: Token<T>;
  lifetime: ServiceLifetime;
  implementation?: Newable<T>;
  factory?: ServiceFactory<T>;
  value?: T;
  dependencies?: Token[];
  key?: string | symbol; // For keyed services
}

export class ServiceCollection {
  private readonly descriptors = new Map<Token, ServiceDescriptor[]>();
  private readonly tokenMap = new Map<Token, Newable>();
  private readonly keyedDescriptors = new Map<string | symbol, Map<Token, ServiceDescriptor>>();

  private addDescriptor(descriptor: ServiceDescriptor): this {
    const existing = this.descriptors.get(descriptor.token) || [];
    existing.push(descriptor);
    this.descriptors.set(descriptor.token, existing);

    if (descriptor.implementation) {
      this.tokenMap.set(descriptor.token, descriptor.implementation);
    }

    if (descriptor.key !== undefined) {
      if (!this.keyedDescriptors.has(descriptor.key)) {
        this.keyedDescriptors.set(descriptor.key, new Map());
      }
      this.keyedDescriptors.get(descriptor.key)!.set(descriptor.token, descriptor);
    }

    return this;
  }

  private getLastDescriptor(token: Token): ServiceDescriptor | undefined {
    const descriptors = this.descriptors.get(token);
    return descriptors && descriptors.length > 0 ? descriptors[descriptors.length - 1] : undefined;
  }

  private lookup(token: Token): ServiceDescriptor | undefined {
    const descriptors = this.descriptors.get(token);
    return descriptors && descriptors.length > 0 ? descriptors[descriptors.length - 1] : undefined;
  }

  remove<T>(token: Token<T>): this {
    this.descriptors.delete(token);
    this.tokenMap.delete(token);
    return this;
  }

  removeAll<T>(token: Token<T>): this {
    return this.remove(token);
  }

  replace<T>(token: Token<T>, implementation: Newable<T>, dependencies?: Token[]): this;
  replace<T>(token: Token<T>, factory: ServiceFactory<T>): this;
  replace<T>(token: Token<T>, implementationOrFactory: Newable<T> | ServiceFactory<T>, dependencies?: Token[]): this {
    // Remove existing
    this.remove(token);
    // Determine if it's a factory or implementation
    const isFactory = typeof implementationOrFactory === 'function' && !implementationOrFactory.prototype;
    // Get lifetime from existing descriptor if any, default to Singleton
    const existing = this.descriptors.get(token);
    const lifetime =
      existing && existing.length > 0 ? existing[existing.length - 1].lifetime : ServiceLifetime.Singleton;
    // Add new with same lifetime
    if (isFactory) {
      this.addDescriptor({
        token,
        lifetime,
        factory: implementationOrFactory as ServiceFactory<T>,
        dependencies,
      });
    } else {
      this.addDescriptor({
        token,
        lifetime,
        implementation: implementationOrFactory as Newable<T>,
        dependencies,
      });
    }
    return this;
  }

  private hasDescriptor(token: Token): boolean {
    return this.descriptors.has(token) && (this.descriptors.get(token)?.length ?? 0) > 0;
  }

  // Overloads for addSingleton
  addSingleton<T>(token: Token<T>): this;
  addSingleton<T>(token: Token<T>, dependencies: Token[]): this;
  addSingleton<T>(token: Token<T>, implementation: Newable<T>): this;
  addSingleton<T>(token: Token<T>, implementation: Newable<T>, dependencies: Token[]): this;
  addSingleton<T>(token: Token<T>, factory: ServiceFactory<T>): this;
  addSingleton<T>(
    token: Token<T>,
    implementationOrDependencies?: Newable<T> | Token[] | ServiceFactory<T>,
    dependencies?: Token[],
  ): this {
    let implementation: Newable<T> | undefined;
    let factory: ServiceFactory<T> | undefined;
    let deps: Token[] | undefined;

    // Determine if second parameter is dependencies array, implementation, or factory
    if (Array.isArray(implementationOrDependencies)) {
      // Second parameter is dependencies array
      deps = implementationOrDependencies;
      implementation = undefined;
    } else if (typeof implementationOrDependencies === 'function' && !implementationOrDependencies.prototype) {
      // It's a factory function (not a class constructor)
      factory = implementationOrDependencies as ServiceFactory<T>;
      implementation = undefined;
    } else {
      // Second parameter is implementation (or undefined)
      implementation = implementationOrDependencies as Newable<T> | undefined;
      deps = dependencies;
    }

    const impl = implementation ?? (factory ? undefined : (token as Newable<T>));
    // If implementation exists and dependencies is undefined, default to empty array
    const finalDeps = impl && deps === undefined ? [] : deps;
    this.addDescriptor({
      token,
      lifetime: ServiceLifetime.Singleton,
      implementation: impl,
      factory,
      dependencies: finalDeps,
    });
    return this;
  }

  // Overloads for addScoped
  addScoped<T>(token: Token<T>): this;
  addScoped<T>(token: Token<T>, dependencies: Token[]): this;
  addScoped<T>(token: Token<T>, implementation: Newable<T>): this;
  addScoped<T>(token: Token<T>, implementation: Newable<T>, dependencies: Token[]): this;
  addScoped<T>(token: Token<T>, factory: ServiceFactory<T>): this;
  addScoped<T>(
    token: Token<T>,
    implementationOrDependencies?: Newable<T> | Token[] | ServiceFactory<T>,
    dependencies?: Token[],
  ): this {
    let implementation: Newable<T> | undefined;
    let factory: ServiceFactory<T> | undefined;
    let deps: Token[] | undefined;

    // Determine if second parameter is dependencies array, implementation, or factory
    if (Array.isArray(implementationOrDependencies)) {
      deps = implementationOrDependencies;
      implementation = undefined;
    } else if (typeof implementationOrDependencies === 'function' && !implementationOrDependencies.prototype) {
      factory = implementationOrDependencies as ServiceFactory<T>;
      implementation = undefined;
    } else {
      implementation = implementationOrDependencies as Newable<T> | undefined;
      deps = dependencies;
    }

    const impl = implementation ?? (factory ? undefined : (token as Newable<T>));
    // If implementation exists and dependencies is undefined, default to empty array
    const finalDeps = impl && deps === undefined ? [] : deps;
    this.addDescriptor({
      token,
      lifetime: ServiceLifetime.Scoped,
      implementation: impl,
      factory,
      dependencies: finalDeps,
    });
    return this;
  }

  // Overloads for addTransient
  addTransient<T>(token: Token<T>): this;
  addTransient<T>(token: Token<T>, dependencies: Token[]): this;
  addTransient<T>(token: Token<T>, implementation: Newable<T>): this;
  addTransient<T>(token: Token<T>, implementation: Newable<T>, dependencies: Token[]): this;
  addTransient<T>(token: Token<T>, factory: ServiceFactory<T>): this;
  addTransient<T>(
    token: Token<T>,
    implementationOrDependencies?: Newable<T> | Token[] | ServiceFactory<T>,
    dependencies?: Token[],
  ): this {
    let implementation: Newable<T> | undefined;
    let factory: ServiceFactory<T> | undefined;
    let deps: Token[] | undefined;

    // Determine if second parameter is dependencies array, implementation, or factory
    if (Array.isArray(implementationOrDependencies)) {
      deps = implementationOrDependencies;
      implementation = undefined;
    } else if (typeof implementationOrDependencies === 'function' && !implementationOrDependencies.prototype) {
      factory = implementationOrDependencies as ServiceFactory<T>;
      implementation = undefined;
    } else {
      implementation = implementationOrDependencies as Newable<T> | undefined;
      deps = dependencies;
    }

    const impl = implementation ?? (factory ? undefined : (token as Newable<T>));
    // If implementation exists and dependencies is undefined, default to empty array
    const finalDeps = impl && deps === undefined ? [] : deps;
    this.addDescriptor({
      token,
      lifetime: ServiceLifetime.Transient,
      implementation: impl,
      factory,
      dependencies: finalDeps,
    });
    return this;
  }

  // Value registration methods
  addValue<T>(token: Token<T>, value: T): this {
    this.addDescriptor({
      token,
      lifetime: ServiceLifetime.Singleton, // Values are always singleton
      value,
    });
    return this;
  }

  // TryAdd methods - only register if not already registered
  tryAddSingleton<T>(token: Token<T>): this;
  tryAddSingleton<T>(token: Token<T>, dependencies: Token[]): this;
  tryAddSingleton<T>(token: Token<T>, implementation: Newable<T>): this;
  tryAddSingleton<T>(token: Token<T>, implementation: Newable<T>, dependencies: Token[]): this;
  tryAddSingleton<T>(token: Token<T>, factory: ServiceFactory<T>): this;
  tryAddSingleton<T>(
    token: Token<T>,
    implementationOrDependencies?: Newable<T> | Token[] | ServiceFactory<T>,
    dependencies?: Token[],
  ): this {
    if (this.hasDescriptor(token)) return this;

    // Manually handle registration to avoid overload resolution issues
    let implementation: Newable<T> | undefined;
    let factory: ServiceFactory<T> | undefined;
    let deps: Token[] | undefined;

    if (Array.isArray(implementationOrDependencies)) {
      deps = implementationOrDependencies;
      implementation = undefined;
    } else if (typeof implementationOrDependencies === 'function' && !implementationOrDependencies.prototype) {
      factory = implementationOrDependencies as ServiceFactory<T>;
      implementation = undefined;
    } else {
      implementation = implementationOrDependencies as Newable<T> | undefined;
      deps = dependencies;
    }

    const impl = implementation ?? (factory ? undefined : (token as Newable<T>));
    this.addDescriptor({
      token,
      lifetime: ServiceLifetime.Singleton,
      implementation: impl,
      factory,
      dependencies: deps,
    });
    return this;
  }

  tryAddScoped<T>(token: Token<T>): this;
  tryAddScoped<T>(token: Token<T>, dependencies: Token[]): this;
  tryAddScoped<T>(token: Token<T>, implementation: Newable<T>): this;
  tryAddScoped<T>(token: Token<T>, implementation: Newable<T>, dependencies: Token[]): this;
  tryAddScoped<T>(token: Token<T>, factory: ServiceFactory<T>): this;
  tryAddScoped<T>(
    token: Token<T>,
    implementationOrDependencies?: Newable<T> | Token[] | ServiceFactory<T>,
    dependencies?: Token[],
  ): this {
    if (this.hasDescriptor(token)) return this;

    let implementation: Newable<T> | undefined;
    let factory: ServiceFactory<T> | undefined;
    let deps: Token[] | undefined;

    if (Array.isArray(implementationOrDependencies)) {
      deps = implementationOrDependencies;
      implementation = undefined;
    } else if (typeof implementationOrDependencies === 'function' && !implementationOrDependencies.prototype) {
      factory = implementationOrDependencies as ServiceFactory<T>;
      implementation = undefined;
    } else {
      implementation = implementationOrDependencies as Newable<T> | undefined;
      deps = dependencies;
    }

    const impl = implementation ?? (factory ? undefined : (token as Newable<T>));
    this.addDescriptor({
      token,
      lifetime: ServiceLifetime.Scoped,
      implementation: impl,
      factory,
      dependencies: deps,
    });
    return this;
  }

  tryAddTransient<T>(token: Token<T>): this;
  tryAddTransient<T>(token: Token<T>, dependencies: Token[]): this;
  tryAddTransient<T>(token: Token<T>, implementation: Newable<T>): this;
  tryAddTransient<T>(token: Token<T>, implementation: Newable<T>, dependencies: Token[]): this;
  tryAddTransient<T>(token: Token<T>, factory: ServiceFactory<T>): this;
  tryAddTransient<T>(
    token: Token<T>,
    implementationOrDependencies?: Newable<T> | Token[] | ServiceFactory<T>,
    dependencies?: Token[],
  ): this {
    if (this.hasDescriptor(token)) return this;

    let implementation: Newable<T> | undefined;
    let factory: ServiceFactory<T> | undefined;
    let deps: Token[] | undefined;

    if (Array.isArray(implementationOrDependencies)) {
      deps = implementationOrDependencies;
      implementation = undefined;
    } else if (typeof implementationOrDependencies === 'function' && !implementationOrDependencies.prototype) {
      factory = implementationOrDependencies as ServiceFactory<T>;
      implementation = undefined;
    } else {
      implementation = implementationOrDependencies as Newable<T> | undefined;
      deps = dependencies;
    }

    const impl = implementation ?? (factory ? undefined : (token as Newable<T>));
    this.addDescriptor({
      token,
      lifetime: ServiceLifetime.Transient,
      implementation: impl,
      factory,
      dependencies: deps,
    });
    return this;
  }

  // Keyed services
  addKeyedSingleton<T>(token: Token<T>, implementation: Newable<T>, key: string | symbol): this;
  addKeyedSingleton<T>(token: Token<T>, factory: ServiceFactory<T>, key: string | symbol): this;
  addKeyedSingleton<T>(
    token: Token<T>,
    implementationOrFactory: Newable<T> | ServiceFactory<T>,
    key: string | symbol,
  ): this {
    const isFactory = typeof implementationOrFactory === 'function' && !implementationOrFactory.prototype;
    this.addDescriptor({
      token,
      lifetime: ServiceLifetime.Singleton,
      implementation: isFactory ? undefined : (implementationOrFactory as Newable<T>),
      factory: isFactory ? (implementationOrFactory as ServiceFactory<T>) : undefined,
      key,
    });
    return this;
  }

  addKeyedScoped<T>(token: Token<T>, implementation: Newable<T>, key: string | symbol): this;
  addKeyedScoped<T>(token: Token<T>, factory: ServiceFactory<T>, key: string | symbol): this;
  addKeyedScoped<T>(
    token: Token<T>,
    implementationOrFactory: Newable<T> | ServiceFactory<T>,
    key: string | symbol,
  ): this {
    const isFactory = typeof implementationOrFactory === 'function' && !implementationOrFactory.prototype;
    this.addDescriptor({
      token,
      lifetime: ServiceLifetime.Scoped,
      implementation: isFactory ? undefined : (implementationOrFactory as Newable<T>),
      factory: isFactory ? (implementationOrFactory as ServiceFactory<T>) : undefined,
      key,
    });
    return this;
  }

  addKeyedTransient<T>(token: Token<T>, implementation: Newable<T>, key: string | symbol): this;
  addKeyedTransient<T>(token: Token<T>, factory: ServiceFactory<T>, key: string | symbol): this;
  addKeyedTransient<T>(
    token: Token<T>,
    implementationOrFactory: Newable<T> | ServiceFactory<T>,
    key: string | symbol,
  ): this {
    const isFactory = typeof implementationOrFactory === 'function' && !implementationOrFactory.prototype;
    this.addDescriptor({
      token,
      lifetime: ServiceLifetime.Transient,
      implementation: isFactory ? undefined : (implementationOrFactory as Newable<T>),
      factory: isFactory ? (implementationOrFactory as ServiceFactory<T>) : undefined,
      key,
    });
    return this;
  }

  buildServiceProvider(options?: { validateScopes?: boolean; validateOnBuild?: boolean }): ServiceProvider {
    const provider = new ServiceProvider(
      this.descriptors,
      this.tokenMap,
      this.keyedDescriptors,
      options?.validateScopes ?? false,
    );

    // Validate on build if requested
    if (options?.validateOnBuild) {
      this.validateOnBuild();
    }

    return provider;
  }

  private validateOnBuild(): void {
    const errors: string[] = [];

    // Check all registered services and their dependencies
    for (const [token, descriptors] of this.descriptors.entries()) {
      for (const desc of descriptors) {
        if (desc.dependencies && desc.dependencies.length > 0) {
          for (const depToken of desc.dependencies) {
            // Check if dependency is registered
            const depDesc = this.lookup(depToken);
            if (!depDesc) {
              errors.push(`Missing dependency: ${depToken.toString()} required by ${token.toString()}`);
            }
          }
        }
      }
    }

    // Check keyed services
    for (const [key, keyedMap] of this.keyedDescriptors.entries()) {
      for (const [token, desc] of keyedMap.entries()) {
        if (desc.dependencies && desc.dependencies.length > 0) {
          for (const depToken of desc.dependencies) {
            const depDesc = this.lookup(depToken);
            if (!depDesc) {
              errors.push(
                `Missing dependency: ${depToken.toString()} required by keyed service ${token.toString()} (key: ${key.toString()})`,
              );
            }
          }
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed on build:\n${errors.join('\n')}`);
    }
  }

  /**
   * Get dependency tree for a specific token
   * @param token The service token to analyze
   * @returns A tree structure showing all dependencies
   */
  getDependencyTree(token: Token): DependencyTreeNode {
    const visited = new Set<Token>();
    const buildTree = (currentToken: Token, depth: number = 0, path: Token[] = []): DependencyTreeNode => {
      // Detect circular dependency in path
      if (path.includes(currentToken)) {
        return {
          token: currentToken,
          name: this.getTokenName(currentToken),
          lifetime: 'CIRCULAR',
          dependencies: [],
          depth,
          isCircular: true,
          circularPath: [...path, currentToken],
        };
      }

      const desc = this.lookup(currentToken);
      if (!desc) {
        return {
          token: currentToken,
          name: this.getTokenName(currentToken),
          lifetime: 'NOT_REGISTERED',
          dependencies: [],
          depth,
        };
      }

      const node: DependencyTreeNode = {
        token: currentToken,
        name: this.getTokenName(currentToken),
        lifetime: desc.lifetime,
        dependencies: [],
        depth,
      };

      if (desc.dependencies && desc.dependencies.length > 0) {
        const newPath = [...path, currentToken];
        node.dependencies = desc.dependencies.map((dep) => buildTree(dep, depth + 1, newPath));
      }

      return node;
    };

    return buildTree(token);
  }

  /**
   * Find all circular dependencies in the service collection
   * @returns Array of circular dependency paths
   */
  getCircularDependencies(): CircularDependency[] {
    const circularDeps: CircularDependency[] = [];
    const visited = new Set<Token>();
    const visiting = new Set<Token>();

    const findCircular = (token: Token, path: Token[] = []): void => {
      if (visiting.has(token)) {
        // Found circular dependency
        const cycleStart = path.indexOf(token);
        const cycle = [...path.slice(cycleStart), token];
        circularDeps.push({
          path: cycle,
          tokens: cycle.map((t) => ({ token: t, name: this.getTokenName(t) })),
        });
        return;
      }

      if (visited.has(token)) {
        return;
      }

      visited.add(token);
      visiting.add(token);

      const desc = this.lookup(token);
      if (desc && desc.dependencies) {
        for (const dep of desc.dependencies) {
          findCircular(dep, [...path, token]);
        }
      }

      visiting.delete(token);
    };

    // Check all registered tokens
    for (const token of this.descriptors.keys()) {
      if (!visited.has(token)) {
        findCircular(token);
      }
    }

    return circularDeps;
  }

  /**
   * Visualize dependency tree as a string
   * @param token The service token to visualize
   * @returns Formatted string representation of the dependency tree
   */
  visualizeDependencyTree(token: Token): string {
    const tree = this.getDependencyTree(token);
    const lines: string[] = [];

    const formatNode = (node: DependencyTreeNode, prefix: string = '', isLast: boolean = true): void => {
      const connector = isLast ? '└── ' : '├── ';
      const lifetimeStr = node.lifetime === 'CIRCULAR' ? ' [CIRCULAR]' : ` [${node.lifetime}]`;
      const circularStr = node.isCircular ? ' ⚠️ CIRCULAR' : '';
      lines.push(`${prefix}${connector}${node.name}${lifetimeStr}${circularStr}`);

      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      for (let i = 0; i < node.dependencies.length; i++) {
        formatNode(node.dependencies[i], newPrefix, i === node.dependencies.length - 1);
      }
    };

    formatNode(tree);
    return lines.join('\n');
  }

  /**
   * Visualize all circular dependencies as a string
   * @returns Formatted string representation of circular dependencies
   */
  visualizeCircularDependencies(): string {
    const circularDeps = this.getCircularDependencies();
    if (circularDeps.length === 0) {
      return 'No circular dependencies found.';
    }

    const lines: string[] = [`Found ${circularDeps.length} circular dependency/ies:\n`];
    circularDeps.forEach((circular, index) => {
      lines.push(`Circular Dependency ${index + 1}:`);
      const pathStr = circular.tokens.map((t) => t.name).join(' → ');
      lines.push(`  ${pathStr}`);
      lines.push('');
    });

    return lines.join('\n');
  }

  private getTokenName(token: Token): string {
    if (typeof token === 'string') {
      return token;
    }
    if (typeof token === 'symbol') {
      return token.toString();
    }
    // It's a class constructor
    return token.name || token.toString();
  }
}

export interface DependencyTreeNode {
  token: Token;
  name: string;
  lifetime: ServiceLifetime | 'CIRCULAR' | 'NOT_REGISTERED';
  dependencies: DependencyTreeNode[];
  depth: number;
  isCircular?: boolean;
  circularPath?: Token[];
}

export interface CircularDependency {
  path: Token[];
  tokens: Array<{ token: Token; name: string }>;
}

export class ServiceProvider {
  private instances = new Map<Token, any>();
  private descriptorInstances = new Map<string, any>(); // Cache instances per descriptor key for multiple implementations
  private scopedInstances = new Map<Token, any>();
  private destroyed = false;
  private readonly validateScopes: boolean;
  // Resolution stack for circular dependency detection
  private resolutionStack = new Set<Token>();
  // Track instances currently being constructed (for circular dependencies)
  private constructingInstances = new Map<Token, any>();

  constructor(
    private readonly descriptors: Map<Token, ServiceDescriptor[]>,
    private readonly tokenMap: Map<Token, Newable>,
    private readonly keyedDescriptors: Map<string | symbol, Map<Token, ServiceDescriptor>>,
    validateScopes: boolean = false,
    private readonly parent?: ServiceProvider,
  ) {
    this.validateScopes = validateScopes;
  }

  private getRootProvider(): ServiceProvider {
    let current: ServiceProvider = this;
    while (current.parent) {
      current = current.parent;
    }
    return current;
  }

  async getService<T>(token: Token<T>): Promise<T | undefined> {
    if (this.destroyed) throw new Error('Provider disposed');

    const desc = this.lookup(token);
    if (!desc) return undefined;

    return this.resolveService(desc, token);
  }

  async getServices<T>(token: Token<T>): Promise<T[]> {
    if (this.destroyed) throw new Error('Provider disposed');

    const descriptors = this.descriptors.get(token);
    if (!descriptors || descriptors.length === 0) return [];

    const results = await Promise.all(
      descriptors.map((desc) => {
        // Create descriptorKey same way as resolveService does
        const descriptorKey = desc.implementation
          ? `${token.toString()}:${desc.implementation.name || desc.implementation.toString()}`
          : desc.factory
          ? `${token.toString()}:factory:${desc.factory.toString()}`
          : `${token.toString()}:value:${desc.value?.toString()}`;
        return this.resolveService(desc, token, descriptorKey);
      }),
    );
    return results.filter((r) => r !== undefined) as T[];
  }

  async getKeyedService<T>(token: Token<T>, key: string | symbol): Promise<T | undefined> {
    if (this.destroyed) throw new Error('Provider disposed');

    const keyedMap = this.keyedDescriptors.get(key);
    if (!keyedMap) return undefined;

    const desc = keyedMap.get(token);
    if (!desc) return undefined;

    return this.resolveService(desc, token);
  }

  async getRequiredKeyedService<T>(token: Token<T>, key: string | symbol): Promise<T> {
    const instance = await this.getKeyedService(token, key);
    if (instance === undefined || instance === null) {
      throw new Error(`No provider found for keyed service: token=${token.toString()}, key=${key.toString()}`);
    }
    return instance;
  }

  async isService<T>(token: Token<T>): Promise<boolean> {
    if (this.destroyed) return false;
    const desc = this.lookup(token);
    return desc !== undefined;
  }

  private async resolveService(desc: ServiceDescriptor, token: Token, descriptorKey?: string): Promise<any> {
    // If this is a value registration, return it directly
    if (desc.value !== undefined) {
      return desc.value;
    }

    if (this.validateScopes && desc.lifetime === ServiceLifetime.Scoped) {
      if (this.parent === undefined) {
        throw new Error(
          `Cannot resolve scoped service '${token.toString()}' from root provider. Create a scope first.`,
        );
      }
    }

    switch (desc.lifetime) {
      case ServiceLifetime.Singleton:
        const rootProvider = this.getRootProvider();
        // Create a unique key for this descriptor (token + implementation/factory)
        // This allows multiple implementations with the same token to have separate instances
        // Use provided descriptorKey if available, otherwise create it
        const finalDescriptorKey =
          descriptorKey ||
          (desc.implementation
            ? `${token.toString()}:${desc.implementation.name || desc.implementation.toString()}`
            : desc.factory
            ? `${token.toString()}:factory:${desc.factory.toString()}`
            : `${token.toString()}:value:${desc.value?.toString()}`);

        // Check if this specific descriptor already has an instance (for multiple implementations with same token)
        // Use a Map with string keys for reliable comparison
        if (rootProvider.descriptorInstances.has(finalDescriptorKey)) {
          return rootProvider.descriptorInstances.get(finalDescriptorKey);
        }

        // Check if already resolved (backward compatibility for single implementation per token)
        // Only check token cache if there's only one descriptor for this token
        const descriptorsForToken = rootProvider.descriptors.get(token);
        if (descriptorsForToken && descriptorsForToken.length === 1 && rootProvider.instances.has(token)) {
          return rootProvider.instances.get(token);
        }
        // Check for circular dependency - if already in resolution stack, return partially constructed instance
        // Use descriptorKey for resolution stack to support multiple implementations
        if (rootProvider.resolutionStack.has(finalDescriptorKey as any)) {
          const partialInstance = rootProvider.constructingInstances.get(finalDescriptorKey as any);
          if (partialInstance !== undefined) {
            return partialInstance;
          }
          // If no partial instance yet, this is a problem (shouldn't happen, but handle gracefully)
          throw new Error(
            `Circular dependency detected for singleton service '${token.toString()}'. Service is in resolution stack but no partial instance found.`,
          );
        }
        // Add to resolution stack and create instance
        rootProvider.resolutionStack.add(finalDescriptorKey as any);
        try {
          const instance = await rootProvider.createInstance(desc, rootProvider, token, finalDescriptorKey);
          // Cache by descriptor key for multiple implementations support
          rootProvider.descriptorInstances.set(finalDescriptorKey, instance);
          // Also cache by token for backward compatibility (only if this is the first descriptor for this token)
          if (!rootProvider.instances.has(token)) {
            rootProvider.instances.set(token, instance);
          }
          return instance;
        } finally {
          rootProvider.resolutionStack.delete(finalDescriptorKey as any);
          rootProvider.constructingInstances.delete(finalDescriptorKey as any);
        }

      case ServiceLifetime.Scoped:
        if (this.validateScopes && this.parent === undefined) {
          throw new Error(`Cannot resolve scoped service '${token.toString()}' from root provider.`);
        }
        // Check if already resolved in this scope
        if (this.scopedInstances.has(token)) {
          return this.scopedInstances.get(token);
        }
        // Check for circular dependency within the same scope
        if (this.resolutionStack.has(token)) {
          const partialInstance = this.constructingInstances.get(token);
          if (partialInstance !== undefined) {
            return partialInstance;
          }
          throw new Error(
            `Circular dependency detected for scoped service '${token.toString()}'. Service is in resolution stack but no partial instance found.`,
          );
        }
        // Add to resolution stack and create instance
        this.resolutionStack.add(token);
        try {
          const instance = await this.createInstance(desc, this, token);
          this.scopedInstances.set(token, instance);
          return instance;
        } finally {
          this.resolutionStack.delete(token);
          this.constructingInstances.delete(token);
        }

      case ServiceLifetime.Transient:
        // For transient services, we support circular dependencies within the same resolution call
        // This means: within a single getRequiredService call, if there's a circular dependency,
        // we return the same instance being constructed. But each new getRequiredService call
        // will create a new instance (maintaining transient behavior)
        if (this.resolutionStack.has(token)) {
          // Circular dependency detected - return the partially constructed instance
          const partialInstance = this.constructingInstances.get(token);
          if (partialInstance !== undefined) {
            return partialInstance;
          }
          // This shouldn't happen, but handle gracefully
          throw new Error(
            `Circular dependency detected for transient service '${token.toString()}'. Service is in resolution stack but no partial instance found.`,
          );
        }
        // Add to resolution stack and create instance
        this.resolutionStack.add(token);
        try {
          const instance = await this.createInstance(desc, this, token);
          return instance;
        } finally {
          this.resolutionStack.delete(token);
          this.constructingInstances.delete(token);
        }

      default:
        throw new Error('Unknown lifetime');
    }
  }

  async getRequiredService<T>(token: Token<T>): Promise<T> {
    const instance = await this.getService(token);
    if (instance === undefined || instance === null)
      throw new Error(`No provider found for token: ${token.toString()}`);
    return instance;
  }

  createScope(): ServiceProvider {
    return new ServiceProvider(this.descriptors, this.tokenMap, this.keyedDescriptors, this.validateScopes, this);
  }

  async dispose(): Promise<void> {
    if (this.destroyed) return;
    const all = [...this.instances.values(), ...this.scopedInstances.values()];
    for (const inst of all) {
      if (inst && typeof inst.onDestroy === 'function') {
        try {
          await inst.onDestroy();
        } catch (e) {
          console.error(e);
        }
      }
    }
    this.instances.clear();
    this.scopedInstances.clear();
    this.destroyed = true;
  }

  private lookup(token: Token): ServiceDescriptor | undefined {
    // Get the last registered descriptor (most recent registration wins)
    const descriptors = this.descriptors.get(token);
    return descriptors && descriptors.length > 0 ? descriptors[descriptors.length - 1] : undefined;
  }

  private async createInstance(
    desc: ServiceDescriptor,
    resolver: ServiceProvider = this,
    token?: Token,
    instanceKey?: string | Token,
  ): Promise<any> {
    if (desc.value !== undefined) return desc.value;
    if (desc.factory) {
      // Validate scope if factory uses scoped dependencies
      if (this.validateScopes) {
        this.validateDependencies(desc, resolver);
      }
      return desc.factory(resolver);
    }

    if (!desc.implementation) {
      throw new Error('Invalid service descriptor: ' + JSON.stringify(desc) + ' for token: ' + desc.token.toString());
    }

    // For circular dependency support:
    // When a constructor is called, if a dependency is already being constructed
    // (in resolution stack), the partially constructed instance is returned.
    // In TypeScript/JavaScript, we need to:
    // 1. Create instance first (with placeholders for circular deps)
    // 2. Store it in constructingInstances before resolving dependencies
    // 3. Resolve dependencies (circular ones will get the partial instance)
    // 4. Update the instance with actual dependencies

    // Support circular dependencies for Singleton, Scoped, and Transient services
    // For Transient: circular dependency is resolved within the same resolution call
    const supportsCircular = token !== undefined;

    // Get parameter count to create instance with correct number of parameters
    // If dependencies is undefined, default to empty array (for implementations without dependencies)
    const deps = desc.dependencies ?? [];
    const paramCount = deps.length;

    // Create a placeholder instance first (for circular dependency support)
    // This allows circular dependencies to reference the instance being constructed
    // We use Object.create() to avoid calling constructor with undefined parameters
    let instance: any;
    let needsPlaceholder = false;
    if (supportsCircular && token) {
      // Always create placeholder when token is provided (for circular dependency support)
      // We can't know in advance if there will be a circular dependency
      // Create placeholder using Object.create to avoid constructor call
      // This allows circular dependencies to reference the instance being constructed
      // Ensure prototype exists (for JavaScript compatibility)
      const prototype = desc.implementation.prototype || Object.prototype;
      instance = Object.create(prototype);
      // Use instanceKey if provided (for multiple implementations support), otherwise use token
      const key = instanceKey !== undefined ? instanceKey : token;
      resolver.constructingInstances.set(key as any, instance);
      needsPlaceholder = true;
    }

    // Now resolve dependencies
    // If there's a circular dependency, it will get the partial instance from constructingInstances
    // Dependencies default to empty array if not provided
    const resolvedDeps = await Promise.all(deps.map((depToken) => resolver.getRequiredService(depToken)));

    // Validate scope if dependencies include scoped services
    if (this.validateScopes) {
      this.validateDependencies(desc, resolver);
    }

    // If we created a placeholder, update it with actual dependencies
    // Otherwise, create a new instance
    if (needsPlaceholder && instance) {
      // Update the placeholder instance with actual dependencies
      // Use Reflect.construct to call constructor on the placeholder
      // This allows us to call the constructor with 'new' semantics on existing instance
      const constructed = Reflect.construct(desc.implementation, resolvedDeps, desc.implementation);

      // Copy all own properties from constructed instance to placeholder
      for (const key of Object.getOwnPropertyNames(constructed)) {
        if (key !== 'constructor') {
          try {
            const descriptor = Object.getOwnPropertyDescriptor(constructed, key);
            if (descriptor) {
              Object.defineProperty(instance, key, descriptor);
            } else {
              instance[key] = constructed[key];
            }
          } catch (e) {
            // If defineProperty fails, try direct assignment
            try {
              instance[key] = constructed[key];
            } catch (e2) {
              // Ignore errors for non-configurable properties
            }
          }
        }
      }
    } else {
      // No circular dependency support needed, create instance normally
      instance = new desc.implementation(...resolvedDeps);
    }

    if (typeof instance.onInit === 'function') await instance.onInit();
    return instance;
  }

  private validateDependencies(desc: ServiceDescriptor, resolver: ServiceProvider): void {
    if (!desc.dependencies || desc.dependencies.length === 0) return;

    const rootProvider = this.getRootProvider();
    const isRoot = resolver === rootProvider;

    for (const depToken of desc.dependencies) {
      const depDescriptors = this.descriptors.get(depToken);
      if (!depDescriptors || depDescriptors.length === 0) continue;

      const depDesc = depDescriptors[depDescriptors.length - 1];
      if (depDesc.lifetime === ServiceLifetime.Scoped && isRoot) {
        throw new Error(
          `Cannot inject scoped service '${depToken.toString()}' into ${
            desc.lifetime === ServiceLifetime.Singleton ? 'singleton' : 'root'
          } service '${desc.token.toString()}'.`,
        );
      }
    }
  }
}
