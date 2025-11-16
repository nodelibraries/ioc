/**
 * Core types and interfaces for the IoC Container
 */

export enum ServiceLifetime {
  Singleton = 'SINGLETON',
  Scoped = 'SCOPED',
  Transient = 'TRANSIENT',
}

/**
 * A service token can be a string, symbol, or class constructor
 */
export type Token<T = unknown> = string | symbol | Newable<T>;

/**
 * A class constructor type
 * Note: Constructor parameters use any[] to allow flexible dependency injection
 * at runtime, as the IoC container handles type resolution dynamically.
 */
export type Newable<T = unknown> = { new (...args: any[]): T };

/**
 * Factory function that creates a service instance
 * @template T The type of service instance to create
 */
export type ServiceFactory<T = unknown> = (provider: any) => T | Promise<T>;

/**
 * Describes how a service should be registered and resolved
 */
export interface ServiceDescriptor<T = unknown> {
  token: Token<T>;
  lifetime: ServiceLifetime;
  implementation?: Newable<T>;
  factory?: ServiceFactory<T>;
  value?: T;
  dependencies?: Token[];
  key?: string | symbol; // For keyed services
}

/**
 * Represents a node in the dependency tree
 */
export interface DependencyTreeNode {
  token: Token;
  name: string;
  lifetime: ServiceLifetime | 'CIRCULAR' | 'NOT_REGISTERED';
  dependencies: DependencyTreeNode[];
  depth: number;
  isCircular?: boolean;
  circularPath?: Token[];
}

/**
 * Represents a circular dependency path
 */
export interface CircularDependency {
  path: Token[];
  tokens: Array<{ token: Token; name: string }>;
}

/**
 * Lifecycle hook interface for services
 */
export interface LifecycleHooks {
  onInit?(): void | Promise<void>;
  onDestroy?(): void | Promise<void>;
}
