import type { ServiceProvider } from './service-provider.ts';

/** How long a resolved instance lives. */
export const ServiceLifetime = {
  /** One instance for the whole root provider, shared by every scope. */
  Singleton: 'SINGLETON',
  /** One instance per scope. */
  Scoped: 'SCOPED',
  /** A new instance on every resolution. */
  Transient: 'TRANSIENT',
} as const;
export type ServiceLifetime = (typeof ServiceLifetime)[keyof typeof ServiceLifetime];

/** A class constructor. `A` is the constructor's parameter list. */
export type Newable<T = unknown, A extends unknown[] = any[]> = new (...args: A) => T;

/** A class constructor that may be abstract: usable as a token, not as an implementation. */
export type AbstractNewable<T = unknown> = abstract new (...args: any[]) => T;

/**
 * A typed token for interfaces and values, created with {@link createToken}.
 * Resolving it infers `T`, so no generic argument is needed at the call site.
 */
export class InjectionToken<T = unknown> {
  /** Phantom field: carries `T` at the type level only. */
  declare readonly __type?: T;
  /** Makes the type nominal: a class is not mistaken for an InjectionToken. */
  readonly #brand = true;
  readonly name: string;
  constructor(name: string) {
    this.name = name;
  }
  toString(): string {
    return `InjectionToken(${this.name})`;
  }
}

/**
 * Creates a typed token.
 *
 * @example
 * ```ts
 * interface Logger { log(msg: string): void }
 * const Logger = createToken<Logger>('Logger');
 * services.addSingleton(Logger, ConsoleLogger);
 * const logger = await provider.getRequiredService(Logger); // typed as Logger
 * ```
 */
export function createToken<T>(name: string): InjectionToken<T> {
  return new InjectionToken<T>(name);
}

/** Identifies a service: a string, a symbol, a typed {@link InjectionToken} or a class. */
export type Token<T = unknown> = string | symbol | InjectionToken<T> | AbstractNewable<T>;

/** Key of a keyed service. */
export type ServiceKey = string | symbol;

/** Dependency tokens for a constructor, checked against its parameter list. */
export type Dependencies<A extends readonly unknown[]> = { readonly [K in keyof A]: Token<A[K]> };

/** Creates a service instance. Receives the provider resolving it (and the key for keyed services). */
export type ServiceFactory<T = unknown> = (provider: ServiceProvider, key?: ServiceKey) => T | Promise<T>;

/** A registration, as stored by {@link ServiceCollection}. */
export interface ServiceDescriptor<T = unknown> {
  readonly token: Token<T>;
  readonly lifetime: ServiceLifetime;
  readonly implementation?: Newable<T>;
  readonly factory?: ServiceFactory<T>;
  /** Present (possibly `undefined`/`null`) for value registrations; check with `'value' in descriptor`. */
  readonly value?: T;
  readonly dependencies: readonly Token[];
  readonly key?: ServiceKey;
}

/** A node in the tree returned by {@link ServiceCollection.getDependencyTree}. */
export interface DependencyTreeNode {
  token: Token;
  name: string;
  lifetime: ServiceLifetime | 'CIRCULAR' | 'NOT_REGISTERED';
  dependencies: DependencyTreeNode[];
  depth: number;
  isCircular?: boolean;
  circularPath?: Token[];
}

/** A dependency cycle, returned by {@link ServiceCollection.getCircularDependencies}. */
export interface CircularDependency {
  path: Token[];
  tokens: Array<{ token: Token; name: string }>;
}

/**
 * Optional lifecycle hooks. `onInit` runs after construction (class registrations);
 * `onDestroy` runs when the owning provider or scope is disposed.
 * `[Symbol.asyncDispose]` and `[Symbol.dispose]` are honored too.
 */
export interface LifecycleHooks {
  onInit?(): void | Promise<void>;
  onDestroy?(): void | Promise<void>;
}

/** Readable name of a token, for messages and diagnostics. */
export function tokenName(token: Token | undefined): string {
  if (token === undefined) return 'unknown';
  if (typeof token === 'string') return token;
  if (typeof token === 'symbol') return token.description ? `Symbol(${token.description})` : 'Symbol()';
  if (token instanceof InjectionToken) return token.name;
  return token.name || 'anonymous class';
}
