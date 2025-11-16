import {
  ServiceLifetime,
  type Token,
  type Newable,
  type ServiceFactory,
  type ServiceDescriptor,
  type DependencyTreeNode,
  type CircularDependency,
  type LifecycleHooks,
} from './types';

/**
 * Service collection for registering and managing service descriptors.
 * This class provides methods to register services with different lifetimes
 * (Singleton, Scoped, Transient) and build a ServiceProvider.
 *
 * @example
 * ```typescript
 * const services = new ServiceCollection();
 * services.addSingleton(ILogger, Logger);
 * services.addScoped(IUserService, UserService, [ILogger]);
 * const provider = services.buildServiceProvider();
 * ```
 */
export class ServiceCollection {
  private readonly descriptors = new Map<Token, ServiceDescriptor[]>();
  private readonly tokenMap = new Map<Token, Newable<unknown>>();
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

  /**
   * Removes all registrations for the specified token.
   *
   * @template T The service type
   * @param token - The service token to remove
   * @returns This instance for method chaining
   *
   * @example
   * ```typescript
   * services.remove(ILogger);
   * ```
   */
  remove<T>(token: Token<T>): this {
    this.descriptors.delete(token);
    this.tokenMap.delete(token);
    return this;
  }

  /**
   * Alias for {@link remove}. Removes all registrations for the specified token.
   *
   * @template T The service type
   * @param token - The service token to remove
   * @returns This instance for method chaining
   */
  removeAll<T>(token: Token<T>): this {
    return this.remove(token);
  }

  /**
   * Replaces an existing service registration with a new implementation or factory.
   * The new registration will use the same lifetime as the previous registration (defaults to Singleton).
   *
   * @template T The service type
   * @param token - The service token to replace
   * @param implementation - The new implementation class
   * @param dependencies - Optional array of dependency tokens (required if constructor has parameters)
   * @returns This instance for method chaining
   *
   * @example
   * ```typescript
   * // Replace with new implementation
   * services.replace(ILogger, NewLogger);
   *
   * // Replace with factory
   * services.replace(ILogger, (provider) => new Logger());
   * ```
   */
  replace<T>(token: Token<T>, implementation: Newable<T>, dependencies?: Token[]): this;
  /**
   * Replaces an existing service registration with a factory function.
   *
   * @template T The service type
   * @param token - The service token to replace
   * @param factory - The factory function that creates the service instance
   * @returns This instance for method chaining
   */
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

  /**
   * Parses the registration parameters to extract implementation, factory, and dependencies.
   * This helper method eliminates code duplication across add* and tryAdd* methods.
   */
  private parseRegistrationParams<T>(
    token: Token<T>,
    implementationOrDependencies?: Newable<T> | Token[] | ServiceFactory<T>,
    dependencies?: Token[],
  ): {
    implementation: Newable<T> | undefined;
    factory: ServiceFactory<T> | undefined;
    dependencies: Token[] | undefined;
    finalImplementation: Newable<T> | undefined;
    finalDependencies: Token[] | undefined;
  } {
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

    const finalImplementation = implementation ?? (factory ? undefined : (token as Newable<T>));
    // If implementation exists and dependencies is undefined, default to empty array
    const finalDeps = finalImplementation && deps === undefined ? [] : deps;

    return {
      implementation,
      factory,
      dependencies: deps,
      finalImplementation,
      finalDependencies: finalDeps,
    };
  }

  /**
   * Internal helper to register a service with a specific lifetime.
   * This eliminates code duplication across addSingleton, addScoped, and addTransient.
   */
  private registerService<T>(
    token: Token<T>,
    lifetime: ServiceLifetime,
    implementationOrDependencies?: Newable<T> | Token[] | ServiceFactory<T>,
    dependencies?: Token[],
  ): this {
    const { finalImplementation, factory, finalDependencies } = this.parseRegistrationParams(
      token,
      implementationOrDependencies,
      dependencies,
    );

    this.addDescriptor({
      token,
      lifetime,
      implementation: finalImplementation,
      factory,
      dependencies: finalDependencies,
    });

    return this;
  }

  /**
   * Internal helper to register a service with tryAdd pattern (only if not already registered).
   * This eliminates code duplication across tryAddSingleton, tryAddScoped, and tryAddTransient.
   */
  private tryRegisterService<T>(
    token: Token<T>,
    lifetime: ServiceLifetime,
    implementationOrDependencies?: Newable<T> | Token[] | ServiceFactory<T>,
    dependencies?: Token[],
  ): this {
    if (this.hasDescriptor(token)) return this;

    const {
      finalImplementation,
      factory,
      dependencies: deps,
    } = this.parseRegistrationParams(token, implementationOrDependencies, dependencies);

    this.addDescriptor({
      token,
      lifetime,
      implementation: finalImplementation,
      factory,
      dependencies: deps,
    });

    return this;
  }

  /**
   * Internal helper to register a keyed service with a specific lifetime.
   * This eliminates code duplication across addKeyedSingleton, addKeyedScoped, and addKeyedTransient.
   */
  private registerKeyedService<T>(
    token: Token<T>,
    lifetime: ServiceLifetime,
    implementationOrFactory: Newable<T> | ServiceFactory<T>,
    key: string | symbol,
  ): this {
    const isFactory = typeof implementationOrFactory === 'function' && !implementationOrFactory.prototype;
    this.addDescriptor({
      token,
      lifetime,
      implementation: isFactory ? undefined : (implementationOrFactory as Newable<T>),
      factory: isFactory ? (implementationOrFactory as ServiceFactory<T>) : undefined,
      key,
    });
    return this;
  }

  /**
   * Registers a service as a singleton. A single instance will be created and reused for all requests.
   *
   * @template T The service type
   * @param token - The service token (class constructor, string, or symbol)
   * @returns This instance for method chaining
   *
   * @example
   * ```typescript
   * // Register class as singleton (token is the class itself)
   * services.addSingleton(Logger);
   *
   * // Register with dependencies
   * services.addSingleton(Logger, [IConfig]);
   * ```
   */
  addSingleton<T>(token: Token<T>): this;
  /**
   * Registers a service as a singleton with explicit dependencies.
   *
   * @template T The service type
   * @param token - The service token
   * @param dependencies - Array of dependency tokens (required if constructor has parameters)
   * @returns This instance for method chaining
   */
  addSingleton<T>(token: Token<T>, dependencies: Token[]): this;
  /**
   * Registers a service as a singleton with a specific implementation.
   *
   * @template T The service type
   * @param token - The service token (interface or abstract class)
   * @param implementation - The concrete implementation class
   * @returns This instance for method chaining
   *
   * @example
   * ```typescript
   * services.addSingleton(ILogger, Logger);
   * ```
   */
  addSingleton<T>(token: Token<T>, implementation: Newable<T>): this;
  /**
   * Registers a service as a singleton with implementation and dependencies.
   *
   * @template T The service type
   * @param token - The service token
   * @param implementation - The concrete implementation class
   * @param dependencies - Array of dependency tokens (required if constructor has parameters)
   * @returns This instance for method chaining
   *
   * @example
   * ```typescript
   * services.addSingleton(IUserService, UserService, [ILogger, IDatabase]);
   * ```
   */
  addSingleton<T>(token: Token<T>, implementation: Newable<T>, dependencies: Token[]): this;
  /**
   * Registers a service as a singleton using a factory function.
   *
   * @template T The service type
   * @param token - The service token
   * @param factory - Factory function that creates the service instance
   * @returns This instance for method chaining
   *
   * @example
   * ```typescript
   * services.addSingleton(ILogger, (provider) => new Logger(provider.getRequiredService(IConfig)));
   * ```
   */
  addSingleton<T>(token: Token<T>, factory: ServiceFactory<T>): this;
  addSingleton<T>(
    token: Token<T>,
    implementationOrDependencies?: Newable<T> | Token[] | ServiceFactory<T>,
    dependencies?: Token[],
  ): this {
    return this.registerService(token, ServiceLifetime.Singleton, implementationOrDependencies, dependencies);
  }

  /**
   * Registers a service as scoped. A new instance is created per scope (e.g., per HTTP request).
   * The same instance is reused within the same scope.
   *
   * @template T The service type
   * @param token - The service token (class constructor, string, or symbol)
   * @returns This instance for method chaining
   *
   * @example
   * ```typescript
   * services.addScoped(UserService);
   * const scope = provider.createScope();
   * const userService = await scope.getRequiredService(UserService);
   * ```
   */
  addScoped<T>(token: Token<T>): this;
  /**
   * Registers a scoped service with explicit dependencies.
   *
   * @template T The service type
   * @param token - The service token
   * @param dependencies - Array of dependency tokens (required if constructor has parameters)
   * @returns This instance for method chaining
   */
  addScoped<T>(token: Token<T>, dependencies: Token[]): this;
  /**
   * Registers a scoped service with a specific implementation.
   *
   * @template T The service type
   * @param token - The service token (interface or abstract class)
   * @param implementation - The concrete implementation class
   * @returns This instance for method chaining
   */
  addScoped<T>(token: Token<T>, implementation: Newable<T>): this;
  /**
   * Registers a scoped service with implementation and dependencies.
   *
   * @template T The service type
   * @param token - The service token
   * @param implementation - The concrete implementation class
   * @param dependencies - Array of dependency tokens (required if constructor has parameters)
   * @returns This instance for method chaining
   */
  addScoped<T>(token: Token<T>, implementation: Newable<T>, dependencies: Token[]): this;
  /**
   * Registers a scoped service using a factory function.
   *
   * @template T The service type
   * @param token - The service token
   * @param factory - Factory function that creates the service instance
   * @returns This instance for method chaining
   */
  addScoped<T>(token: Token<T>, factory: ServiceFactory<T>): this;
  addScoped<T>(
    token: Token<T>,
    implementationOrDependencies?: Newable<T> | Token[] | ServiceFactory<T>,
    dependencies?: Token[],
  ): this {
    return this.registerService(token, ServiceLifetime.Scoped, implementationOrDependencies, dependencies);
  }

  /**
   * Registers a service as transient. A new instance is created every time the service is requested.
   *
   * @template T The service type
   * @param token - The service token (class constructor, string, or symbol)
   * @returns This instance for method chaining
   *
   * @example
   * ```typescript
   * services.addTransient(EmailService);
   * // Each call to getService creates a new instance
   * ```
   */
  addTransient<T>(token: Token<T>): this;
  /**
   * Registers a transient service with explicit dependencies.
   *
   * @template T The service type
   * @param token - The service token
   * @param dependencies - Array of dependency tokens (required if constructor has parameters)
   * @returns This instance for method chaining
   */
  addTransient<T>(token: Token<T>, dependencies: Token[]): this;
  /**
   * Registers a transient service with a specific implementation.
   *
   * @template T The service type
   * @param token - The service token (interface or abstract class)
   * @param implementation - The concrete implementation class
   * @returns This instance for method chaining
   */
  addTransient<T>(token: Token<T>, implementation: Newable<T>): this;
  /**
   * Registers a transient service with implementation and dependencies.
   *
   * @template T The service type
   * @param token - The service token
   * @param implementation - The concrete implementation class
   * @param dependencies - Array of dependency tokens (required if constructor has parameters)
   * @returns This instance for method chaining
   */
  addTransient<T>(token: Token<T>, implementation: Newable<T>, dependencies: Token[]): this;
  /**
   * Registers a transient service using a factory function.
   *
   * @template T The service type
   * @param token - The service token
   * @param factory - Factory function that creates the service instance
   * @returns This instance for method chaining
   */
  addTransient<T>(token: Token<T>, factory: ServiceFactory<T>): this;
  addTransient<T>(
    token: Token<T>,
    implementationOrDependencies?: Newable<T> | Token[] | ServiceFactory<T>,
    dependencies?: Token[],
  ): this {
    return this.registerService(token, ServiceLifetime.Transient, implementationOrDependencies, dependencies);
  }

  /**
   * Registers a pre-created value instance. Values are always treated as singletons.
   *
   * @template T The service type
   * @param token - The service token
   * @param value - The pre-created instance to register
   * @returns This instance for method chaining
   *
   * @example
   * ```typescript
   * services.addValue(IConfig, { apiKey: '123', baseUrl: 'https://api.example.com' });
   * ```
   */
  addValue<T>(token: Token<T>, value: T): this {
    this.addDescriptor({
      token,
      lifetime: ServiceLifetime.Singleton, // Values are always singleton
      value,
    });
    return this;
  }

  /**
   * Attempts to register a service as singleton only if it's not already registered.
   * This is useful for conditional registration scenarios.
   *
   * @template T The service type
   * @param token - The service token
   * @returns This instance for method chaining
   *
   * @example
   * ```typescript
   * // Only register if not already registered
   * services.tryAddSingleton(ILogger, Logger);
   * ```
   */
  tryAddSingleton<T>(token: Token<T>): this;
  /**
   * Attempts to register a singleton service with dependencies.
   *
   * @template T The service type
   * @param token - The service token
   * @param dependencies - Array of dependency tokens
   * @returns This instance for method chaining
   */
  tryAddSingleton<T>(token: Token<T>, dependencies: Token[]): this;
  /**
   * Attempts to register a singleton service with implementation.
   *
   * @template T The service type
   * @param token - The service token
   * @param implementation - The concrete implementation class
   * @returns This instance for method chaining
   */
  tryAddSingleton<T>(token: Token<T>, implementation: Newable<T>): this;
  /**
   * Attempts to register a singleton service with implementation and dependencies.
   *
   * @template T The service type
   * @param token - The service token
   * @param implementation - The concrete implementation class
   * @param dependencies - Array of dependency tokens
   * @returns This instance for method chaining
   */
  tryAddSingleton<T>(token: Token<T>, implementation: Newable<T>, dependencies: Token[]): this;
  /**
   * Attempts to register a singleton service using a factory function.
   *
   * @template T The service type
   * @param token - The service token
   * @param factory - Factory function that creates the service instance
   * @returns This instance for method chaining
   */
  tryAddSingleton<T>(token: Token<T>, factory: ServiceFactory<T>): this;
  tryAddSingleton<T>(
    token: Token<T>,
    implementationOrDependencies?: Newable<T> | Token[] | ServiceFactory<T>,
    dependencies?: Token[],
  ): this {
    return this.tryRegisterService(token, ServiceLifetime.Singleton, implementationOrDependencies, dependencies);
  }

  /**
   * Attempts to register a service as scoped only if it's not already registered.
   *
   * @template T The service type
   * @param token - The service token
   * @returns This instance for method chaining
   */
  tryAddScoped<T>(token: Token<T>): this;
  /**
   * Attempts to register a scoped service with dependencies.
   *
   * @template T The service type
   * @param token - The service token
   * @param dependencies - Array of dependency tokens
   * @returns This instance for method chaining
   */
  tryAddScoped<T>(token: Token<T>, dependencies: Token[]): this;
  /**
   * Attempts to register a scoped service with implementation.
   *
   * @template T The service type
   * @param token - The service token
   * @param implementation - The concrete implementation class
   * @returns This instance for method chaining
   */
  tryAddScoped<T>(token: Token<T>, implementation: Newable<T>): this;
  /**
   * Attempts to register a scoped service with implementation and dependencies.
   *
   * @template T The service type
   * @param token - The service token
   * @param implementation - The concrete implementation class
   * @param dependencies - Array of dependency tokens
   * @returns This instance for method chaining
   */
  tryAddScoped<T>(token: Token<T>, implementation: Newable<T>, dependencies: Token[]): this;
  /**
   * Attempts to register a scoped service using a factory function.
   *
   * @template T The service type
   * @param token - The service token
   * @param factory - Factory function that creates the service instance
   * @returns This instance for method chaining
   */
  tryAddScoped<T>(token: Token<T>, factory: ServiceFactory<T>): this;
  tryAddScoped<T>(
    token: Token<T>,
    implementationOrDependencies?: Newable<T> | Token[] | ServiceFactory<T>,
    dependencies?: Token[],
  ): this {
    return this.tryRegisterService(token, ServiceLifetime.Scoped, implementationOrDependencies, dependencies);
  }

  /**
   * Attempts to register a service as transient only if it's not already registered.
   *
   * @template T The service type
   * @param token - The service token
   * @returns This instance for method chaining
   */
  tryAddTransient<T>(token: Token<T>): this;
  /**
   * Attempts to register a transient service with dependencies.
   *
   * @template T The service type
   * @param token - The service token
   * @param dependencies - Array of dependency tokens
   * @returns This instance for method chaining
   */
  tryAddTransient<T>(token: Token<T>, dependencies: Token[]): this;
  /**
   * Attempts to register a transient service with implementation.
   *
   * @template T The service type
   * @param token - The service token
   * @param implementation - The concrete implementation class
   * @returns This instance for method chaining
   */
  tryAddTransient<T>(token: Token<T>, implementation: Newable<T>): this;
  /**
   * Attempts to register a transient service with implementation and dependencies.
   *
   * @template T The service type
   * @param token - The service token
   * @param implementation - The concrete implementation class
   * @param dependencies - Array of dependency tokens
   * @returns This instance for method chaining
   */
  tryAddTransient<T>(token: Token<T>, implementation: Newable<T>, dependencies: Token[]): this;
  /**
   * Attempts to register a transient service using a factory function.
   *
   * @template T The service type
   * @param token - The service token
   * @param factory - Factory function that creates the service instance
   * @returns This instance for method chaining
   */
  tryAddTransient<T>(token: Token<T>, factory: ServiceFactory<T>): this;
  tryAddTransient<T>(
    token: Token<T>,
    implementationOrDependencies?: Newable<T> | Token[] | ServiceFactory<T>,
    dependencies?: Token[],
  ): this {
    return this.tryRegisterService(token, ServiceLifetime.Transient, implementationOrDependencies, dependencies);
  }

  /**
   * Registers a keyed service as singleton. Keyed services allow multiple implementations
   * of the same token to be registered with different keys.
   *
   * @template T The service type
   * @param token - The service token
   * @param implementation - The concrete implementation class
   * @param key - The key to identify this specific implementation
   * @returns This instance for method chaining
   *
   * @example
   * ```typescript
   * services.addKeyedSingleton(ILogger, FileLogger, 'file');
   * services.addKeyedSingleton(ILogger, ConsoleLogger, 'console');
   * const logger = await provider.getKeyedService(ILogger, 'file');
   * ```
   */
  addKeyedSingleton<T>(token: Token<T>, implementation: Newable<T>, key: string | symbol): this;
  /**
   * Registers a keyed singleton service using a factory function.
   *
   * @template T The service type
   * @param token - The service token
   * @param factory - Factory function that creates the service instance
   * @param key - The key to identify this specific implementation
   * @returns This instance for method chaining
   */
  addKeyedSingleton<T>(token: Token<T>, factory: ServiceFactory<T>, key: string | symbol): this;
  addKeyedSingleton<T>(
    token: Token<T>,
    implementationOrFactory: Newable<T> | ServiceFactory<T>,
    key: string | symbol,
  ): this {
    return this.registerKeyedService(token, ServiceLifetime.Singleton, implementationOrFactory, key);
  }

  /**
   * Registers a keyed service as scoped.
   *
   * @template T The service type
   * @param token - The service token
   * @param implementation - The concrete implementation class
   * @param key - The key to identify this specific implementation
   * @returns This instance for method chaining
   */
  addKeyedScoped<T>(token: Token<T>, implementation: Newable<T>, key: string | symbol): this;
  /**
   * Registers a keyed scoped service using a factory function.
   *
   * @template T The service type
   * @param token - The service token
   * @param factory - Factory function that creates the service instance
   * @param key - The key to identify this specific implementation
   * @returns This instance for method chaining
   */
  addKeyedScoped<T>(token: Token<T>, factory: ServiceFactory<T>, key: string | symbol): this;
  addKeyedScoped<T>(
    token: Token<T>,
    implementationOrFactory: Newable<T> | ServiceFactory<T>,
    key: string | symbol,
  ): this {
    return this.registerKeyedService(token, ServiceLifetime.Scoped, implementationOrFactory, key);
  }

  /**
   * Registers a keyed service as transient.
   *
   * @template T The service type
   * @param token - The service token
   * @param implementation - The concrete implementation class
   * @param key - The key to identify this specific implementation
   * @returns This instance for method chaining
   */
  addKeyedTransient<T>(token: Token<T>, implementation: Newable<T>, key: string | symbol): this;
  /**
   * Registers a keyed transient service using a factory function.
   *
   * @template T The service type
   * @param token - The service token
   * @param factory - Factory function that creates the service instance
   * @param key - The key to identify this specific implementation
   * @returns This instance for method chaining
   */
  addKeyedTransient<T>(token: Token<T>, factory: ServiceFactory<T>, key: string | symbol): this;
  addKeyedTransient<T>(
    token: Token<T>,
    implementationOrFactory: Newable<T> | ServiceFactory<T>,
    key: string | symbol,
  ): this {
    return this.registerKeyedService(token, ServiceLifetime.Transient, implementationOrFactory, key);
  }

  /**
   * Builds a ServiceProvider from the registered service descriptors.
   *
   * @param options - Optional configuration options
   * @param options.validateScopes - If true, validates that scoped services are not resolved from root provider (default: false)
   * @param options.validateOnBuild - If true, validates all dependencies are registered at build time (default: false)
   * @returns A new ServiceProvider instance
   *
   * @example
   * ```typescript
   * const provider = services.buildServiceProvider({
   *   validateScopes: true,
   *   validateOnBuild: true
   * });
   * ```
   */
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
   * Gets the dependency tree for a specific service token.
   * This method analyzes all dependencies recursively and detects circular dependencies.
   *
   * @param token - The service token to analyze
   * @returns A tree structure showing all dependencies, their lifetimes, and circular dependency information
   *
   * @example
   * ```typescript
   * const tree = services.getDependencyTree(IUserService);
   * console.log(tree.name); // "IUserService"
   * console.log(tree.dependencies); // Array of dependency nodes
   * ```
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
   * Finds all circular dependencies in the service collection.
   * Scans all registered services and their dependencies to detect circular reference patterns.
   *
   * @returns Array of circular dependency paths, each containing the tokens involved in the cycle
   *
   * @example
   * ```typescript
   * const circularDeps = services.getCircularDependencies();
   * if (circularDeps.length > 0) {
   *   console.log('Found circular dependencies:', circularDeps);
   * }
   * ```
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
   * Visualizes the dependency tree as a formatted string.
   * Creates a tree-like text representation showing the service hierarchy and dependencies.
   *
   * @param token - The service token to visualize
   * @returns A formatted string representation of the dependency tree with tree characters (├──, └──)
   *
   * @example
   * ```typescript
   * const visualization = services.visualizeDependencyTree(IUserService);
   * console.log(visualization);
   * // Output:
   * // └── IUserService [SINGLETON]
   * //     ├── ILogger [SINGLETON]
   * //     └── IDatabase [SINGLETON]
   * ```
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
   * Visualizes all circular dependencies as a formatted string.
   * Creates a human-readable representation of all detected circular dependency cycles.
   *
   * @returns A formatted string listing all circular dependencies, or a message if none are found
   *
   * @example
   * ```typescript
   * const visualization = services.visualizeCircularDependencies();
   * console.log(visualization);
   * // Output:
   * // Found 1 circular dependency/ies:
   * //
   * // Circular Dependency 1:
   * //   ServiceA → ServiceB → ServiceA
   * ```
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

/**
 * Service provider for resolving and managing service instances.
 * This class handles service resolution, instance caching, scope management,
 * and circular dependency resolution for all service lifetimes.
 *
 * @example
 * ```typescript
 * const provider = services.buildServiceProvider();
 * const logger = await provider.getRequiredService<ILogger>(ILogger);
 *
 * // Create a scope for scoped services
 * const scope = provider.createScope();
 * const userService = await scope.getRequiredService<IUserService>(IUserService);
 * await scope.dispose(); // Clean up scoped instances
 * ```
 */
export class ServiceProvider {
  private instances = new Map<Token, unknown>();
  private descriptorInstances = new Map<string, unknown>(); // Cache instances per descriptor key for multiple implementations
  private scopedInstances = new Map<Token, unknown>();
  private destroyed = false;
  private readonly validateScopes: boolean;
  // Resolution stack for circular dependency detection
  private resolutionStack = new Set<Token>();
  // Track instances currently being constructed (for circular dependencies)
  private constructingInstances = new Map<Token, unknown>();

  constructor(
    private readonly descriptors: Map<Token, ServiceDescriptor[]>,
    private readonly tokenMap: Map<Token, Newable<unknown>>,
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

  /**
   * Creates a unique descriptor key for a service descriptor.
   * This allows multiple implementations with the same token to have separate instances.
   */
  private getDescriptorKey(token: Token, desc: ServiceDescriptor): string {
    if (desc.implementation) {
      return `${token.toString()}:${desc.implementation.name || desc.implementation.toString()}`;
    }
    if (desc.factory) {
      return `${token.toString()}:factory:${desc.factory.toString()}`;
    }
    return `${token.toString()}:value:${desc.value?.toString()}`;
  }

  /**
   * Gets a service instance by token. Returns undefined if the service is not registered.
   *
   * @template T The service type
   * @param token - The service token to resolve
   * @returns A promise that resolves to the service instance, or undefined if not registered
   *
   * @example
   * ```typescript
   * const logger = await provider.getService<ILogger>(ILogger);
   * if (logger) {
   *   logger.log('Service found');
   * }
   * ```
   */
  async getService<T>(token: Token<T>): Promise<T | undefined> {
    if (this.destroyed) throw new Error('Provider disposed');

    const desc = this.lookup(token);
    if (!desc) return undefined;

    return this.resolveService(desc, token) as Promise<T | undefined>;
  }

  /**
   * Gets all registered implementations for a token. Useful when multiple implementations
   * are registered for the same token.
   *
   * @template T The service type
   * @param token - The service token to resolve
   * @returns A promise that resolves to an array of all registered service instances
   *
   * @example
   * ```typescript
   * services.addSingleton(ILogger, FileLogger);
   * services.addSingleton(ILogger, ConsoleLogger);
   * const loggers = await provider.getServices<ILogger>(ILogger);
   * // Returns [FileLogger instance, ConsoleLogger instance]
   * ```
   */
  async getServices<T>(token: Token<T>): Promise<T[]> {
    if (this.destroyed) throw new Error('Provider disposed');

    const descriptors = this.descriptors.get(token);
    if (!descriptors || descriptors.length === 0) return [];

    const results = await Promise.all(
      descriptors.map((desc) => {
        const descriptorKey = this.getDescriptorKey(token, desc);
        return this.resolveService(desc, token, descriptorKey);
      }),
    );
    return results.filter((r) => r !== undefined) as T[];
  }

  /**
   * Gets a keyed service instance by token and key.
   *
   * @template T The service type
   * @param token - The service token
   * @param key - The key identifying the specific implementation
   * @returns A promise that resolves to the service instance, or undefined if not found
   *
   * @example
   * ```typescript
   * const fileLogger = await provider.getKeyedService<ILogger>(ILogger, 'file');
   * ```
   */
  async getKeyedService<T>(token: Token<T>, key: string | symbol): Promise<T | undefined> {
    if (this.destroyed) throw new Error('Provider disposed');

    const keyedMap = this.keyedDescriptors.get(key);
    if (!keyedMap) return undefined;

    const desc = keyedMap.get(token);
    if (!desc) return undefined;

    return this.resolveService(desc, token) as Promise<T | undefined>;
  }

  /**
   * Gets a required keyed service instance. Throws an error if the service is not found.
   *
   * @template T The service type
   * @param token - The service token
   * @param key - The key identifying the specific implementation
   * @returns A promise that resolves to the service instance
   * @throws Error if the service is not registered
   *
   * @example
   * ```typescript
   * const logger = await provider.getRequiredKeyedService<ILogger>(ILogger, 'file');
   * ```
   */
  async getRequiredKeyedService<T>(token: Token<T>, key: string | symbol): Promise<T> {
    const instance = await this.getKeyedService(token, key);
    if (instance === undefined || instance === null) {
      throw new Error(`No provider found for keyed service: token=${token.toString()}, key=${key.toString()}`);
    }
    return instance;
  }

  /**
   * Checks if a service is registered for the given token.
   *
   * @template T The service type
   * @param token - The service token to check
   * @returns A promise that resolves to true if the service is registered, false otherwise
   *
   * @example
   * ```typescript
   * if (await provider.isService(ILogger)) {
   *   const logger = await provider.getRequiredService(ILogger);
   * }
   * ```
   */
  async isService<T>(token: Token<T>): Promise<boolean> {
    if (this.destroyed) return false;
    const desc = this.lookup(token);
    return desc !== undefined;
  }

  private async resolveService(desc: ServiceDescriptor, token: Token, descriptorKey?: string): Promise<unknown> {
    // Early return for value registrations
    if (desc.value !== undefined) {
      return desc.value;
    }

    // Validate scoped service resolution
    this.validateScopedResolution(desc, token);

    switch (desc.lifetime) {
      case ServiceLifetime.Singleton:
        return this.resolveSingleton(desc, token, descriptorKey);

      case ServiceLifetime.Scoped:
        return this.resolveScoped(desc, token);

      case ServiceLifetime.Transient:
        return this.resolveTransient(desc, token);

      default:
        throw new Error('Unknown lifetime');
    }
  }

  /**
   * Gets a required service instance. Throws an error if the service is not registered.
   *
   * @template T The service type
   * @param token - The service token to resolve
   * @returns A promise that resolves to the service instance
   * @throws Error if the service is not registered
   *
   * @example
   * ```typescript
   * const logger = await provider.getRequiredService<ILogger>(ILogger);
   * logger.log('Service resolved');
   * ```
   */
  async getRequiredService<T>(token: Token<T>): Promise<T> {
    const instance = await this.getService(token);
    if (instance === undefined || instance === null)
      throw new Error(`No provider found for token: ${token.toString()}`);
    return instance;
  }

  /**
   * Creates a new scope for scoped services. Scoped services are cached per scope
   * and disposed when the scope is disposed.
   *
   * @returns A new ServiceProvider instance representing the scope
   *
   * @example
   * ```typescript
   * const scope = provider.createScope();
   * const userService = await scope.getRequiredService<IUserService>(IUserService);
   * // ... use userService
   * await scope.dispose(); // Clean up scoped instances
   * ```
   */
  createScope(): ServiceProvider {
    return new ServiceProvider(this.descriptors, this.tokenMap, this.keyedDescriptors, this.validateScopes, this);
  }

  /**
   * Disposes the provider and all scoped instances. Calls onDestroy lifecycle hooks
   * on all disposable instances. After disposal, the provider cannot be used.
   *
   * @returns A promise that resolves when disposal is complete
   *
   * @example
   * ```typescript
   * await provider.dispose();
   * // Provider is now disposed and cannot be used
   * ```
   */
  async dispose(): Promise<void> {
    if (this.destroyed) return;
    const all = [...this.instances.values(), ...this.scopedInstances.values()];
    for (const inst of all) {
      const lifecycle = inst as LifecycleHooks;
      if (lifecycle && typeof lifecycle.onDestroy === 'function') {
        try {
          await lifecycle.onDestroy();
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

  /**
   * Validates that scoped services are not resolved from root provider.
   */
  private validateScopedResolution(desc: ServiceDescriptor, token: Token): void {
    if (this.validateScopes && desc.lifetime === ServiceLifetime.Scoped && this.parent === undefined) {
      throw new Error(`Cannot resolve scoped service '${token.toString()}' from root provider. Create a scope first.`);
    }
  }

  /**
   * Resolves a singleton service instance.
   * Singleton instances are cached at the root provider level.
   */
  private async resolveSingleton(desc: ServiceDescriptor, token: Token, descriptorKey?: string): Promise<unknown> {
    const rootProvider = this.getRootProvider();
    const finalDescriptorKey = descriptorKey || this.getDescriptorKey(token, desc);

    // Check cached instance by descriptor key (supports multiple implementations)
    if (rootProvider.descriptorInstances.has(finalDescriptorKey)) {
      return rootProvider.descriptorInstances.get(finalDescriptorKey);
    }

    // Check cached instance by token (backward compatibility for single implementation)
    const descriptorsForToken = rootProvider.descriptors.get(token);
    if (descriptorsForToken?.length === 1 && rootProvider.instances.has(token)) {
      return rootProvider.instances.get(token);
    }

    // Handle circular dependency
    const descriptorKeyAsToken = finalDescriptorKey as Token;
    const partialInstance = this.getPartialInstance(
      rootProvider.resolutionStack,
      rootProvider.constructingInstances,
      descriptorKeyAsToken,
    );
    if (partialInstance !== undefined) {
      return partialInstance;
    }

    if (rootProvider.resolutionStack.has(descriptorKeyAsToken)) {
      throw this.createCircularDependencyError('singleton', token);
    }

    // Create and cache instance
    return this.withResolutionTracking(
      descriptorKeyAsToken,
      rootProvider.resolutionStack,
      rootProvider.constructingInstances,
      async () => {
        const instance = await rootProvider.createInstance(desc, rootProvider, token, finalDescriptorKey);
        rootProvider.descriptorInstances.set(finalDescriptorKey, instance);
        if (!rootProvider.instances.has(token)) {
          rootProvider.instances.set(token, instance);
        }
        return instance;
      },
    );
  }

  /**
   * Resolves a scoped service instance.
   * Scoped instances are cached per scope and shared within the same scope.
   */
  private async resolveScoped(desc: ServiceDescriptor, token: Token): Promise<unknown> {
    if (this.validateScopes && this.parent === undefined) {
      throw new Error(`Cannot resolve scoped service '${token.toString()}' from root provider.`);
    }

    // Return cached instance if already resolved in this scope
    if (this.scopedInstances.has(token)) {
      return this.scopedInstances.get(token);
    }

    // Handle circular dependency
    const partialInstance = this.getPartialInstance(this.resolutionStack, this.constructingInstances, token);
    if (partialInstance !== undefined) {
      return partialInstance;
    }

    if (this.resolutionStack.has(token)) {
      throw this.createCircularDependencyError('scoped', token);
    }

    // Create and cache instance in this scope
    return this.withResolutionTracking(token, this.resolutionStack, this.constructingInstances, async () => {
      const instance = await this.createInstance(desc, this, token);
      this.scopedInstances.set(token, instance);
      return instance;
    });
  }

  /**
   * Resolves a transient service instance.
   * Transient instances are created fresh on each resolution, but circular dependencies
   * within the same resolution call are supported.
   */
  private async resolveTransient(desc: ServiceDescriptor, token: Token): Promise<unknown> {
    // Handle circular dependency within the same resolution call
    const partialInstance = this.getPartialInstance(this.resolutionStack, this.constructingInstances, token);
    if (partialInstance !== undefined) {
      return partialInstance;
    }

    if (this.resolutionStack.has(token)) {
      throw this.createCircularDependencyError('transient', token);
    }

    // Create new instance (not cached)
    return this.withResolutionTracking(token, this.resolutionStack, this.constructingInstances, async () => {
      return await this.createInstance(desc, this, token);
    });
  }

  /**
   * Creates a standardized error message for circular dependency issues.
   */
  private createCircularDependencyError(lifetime: string, token: Token): Error {
    return new Error(
      `Circular dependency detected for ${lifetime} service '${token.toString()}'. Service is in resolution stack but no partial instance found.`,
    );
  }

  /**
   * Creates a placeholder instance for circular dependency support.
   * The placeholder is stored in constructingInstances so circular dependencies can reference it.
   */
  private createPlaceholderInstance(
    desc: ServiceDescriptor,
    resolver: ServiceProvider,
    token: Token,
    instanceKey?: string | Token,
  ): unknown {
    const prototype = desc.implementation!.prototype || Object.prototype;
    const placeholder = Object.create(prototype);
    const key = instanceKey !== undefined ? instanceKey : token;
    resolver.constructingInstances.set(key as Token, placeholder);
    return placeholder;
  }

  /**
   * Constructs an instance using a placeholder for circular dependency support.
   * Uses Reflect.construct to call the constructor on the existing placeholder instance.
   */
  private constructWithPlaceholder(
    implementation: Newable<unknown>,
    dependencies: unknown[],
    placeholder: unknown,
  ): unknown {
    const constructed = Reflect.construct(implementation, dependencies, implementation);
    this.copyInstanceProperties(constructed, placeholder);
    return placeholder;
  }

  /**
   * Copies all own properties from source to target instance.
   * Used for circular dependency support when updating placeholder instances.
   */
  private copyInstanceProperties(source: unknown, target: unknown): void {
    if (typeof source !== 'object' || source === null || typeof target !== 'object' || target === null) {
      return;
    }

    const sourceObj = source as Record<string, unknown>;
    const targetObj = target as Record<string, unknown>;

    for (const key of Object.getOwnPropertyNames(sourceObj)) {
      if (key !== 'constructor') {
        try {
          const descriptor = Object.getOwnPropertyDescriptor(sourceObj, key);
          if (descriptor) {
            Object.defineProperty(targetObj, key, descriptor);
          } else {
            targetObj[key] = sourceObj[key];
          }
        } catch (e) {
          // If defineProperty fails, try direct assignment
          try {
            targetObj[key] = sourceObj[key];
          } catch (e2) {
            // Ignore errors for non-configurable properties
          }
        }
      }
    }
  }

  /**
   * Checks if a token is in the resolution stack (circular dependency detection).
   * Returns the partial instance if found, undefined otherwise.
   */
  private getPartialInstance(
    resolutionStack: Set<Token>,
    constructingInstances: Map<Token, unknown>,
    key: Token,
  ): unknown | undefined {
    if (resolutionStack.has(key)) {
      return constructingInstances.get(key);
    }
    return undefined;
  }

  /**
   * Executes a resolution function with circular dependency tracking.
   * Automatically manages resolution stack and constructing instances.
   */
  private async withResolutionTracking<T>(
    key: Token,
    resolutionStack: Set<Token>,
    constructingInstances: Map<Token, unknown>,
    resolutionFn: () => Promise<T>,
  ): Promise<T> {
    resolutionStack.add(key);
    try {
      return await resolutionFn();
    } finally {
      resolutionStack.delete(key);
      constructingInstances.delete(key);
    }
  }

  private async createInstance(
    desc: ServiceDescriptor,
    resolver: ServiceProvider = this,
    token?: Token,
    instanceKey?: string | Token,
  ): Promise<unknown> {
    // Early returns for value and factory registrations
    if (desc.value !== undefined) return desc.value;
    if (desc.factory) {
      if (this.validateScopes) {
        this.validateDependencies(desc, resolver);
      }
      return desc.factory(resolver);
    }

    if (!desc.implementation) {
      throw new Error(`Invalid service descriptor for token '${desc.token.toString()}': ${JSON.stringify(desc)}`);
    }

    const dependencies = desc.dependencies ?? [];
    const supportsCircularDependency = token !== undefined;

    // Create placeholder instance for circular dependency support
    const placeholder =
      supportsCircularDependency && token ? this.createPlaceholderInstance(desc, resolver, token, instanceKey) : null;

    // Resolve all dependencies (circular ones will get the placeholder)
    const resolvedDependencies = await Promise.all(
      dependencies.map((depToken) => resolver.getRequiredService(depToken)),
    );

    // Validate scope constraints if enabled
    if (this.validateScopes) {
      this.validateDependencies(desc, resolver);
    }

    // Create or update instance
    const instance = placeholder
      ? this.constructWithPlaceholder(desc.implementation, resolvedDependencies, placeholder)
      : new desc.implementation(...resolvedDependencies);

    // Call lifecycle hook if present
    const lifecycle = instance as LifecycleHooks;
    if (lifecycle && typeof lifecycle.onInit === 'function') {
      await lifecycle.onInit();
    }

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
