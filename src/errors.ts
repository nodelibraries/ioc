import { tokenName, type ServiceKey, type Token } from './types.ts';

const formatPath = (path: readonly Token[]) => path.map(tokenName).join(' → ');

/** Base class of every error thrown by the container. */
export class IocError extends Error {
  override name = 'IocError';
}

/** A required service (or one of its dependencies) has no registration. */
export class ServiceNotFoundError extends IocError {
  override name = 'ServiceNotFoundError';
  readonly token: Token;
  readonly key?: ServiceKey;
  /** Services that were being resolved when the missing one was needed, outermost first. */
  readonly path: readonly Token[];
  constructor(token: Token, key?: ServiceKey, path: readonly Token[] = []) {
    const keyed = key === undefined ? '' : ` with key '${String(key)}'`;
    const via = path.length ? ` (required by ${formatPath(path)})` : '';
    super(`No service registered for '${tokenName(token)}'${keyed}${via}.`);
    this.token = token;
    this.key = key;
    this.path = path;
  }
}

/** A service in a dependency cycle was used before its constructor finished. */
export class CircularDependencyError extends IocError {
  override name = 'CircularDependencyError';
  readonly path: readonly Token[];
  constructor(path: readonly Token[]) {
    super(
      `Circular dependency ${formatPath(path)}: '${tokenName(path[0])}' was used before its constructor finished. ` +
        'Inside a cycle, keep the injected reference and use it later (in a method), not in the constructor.',
    );
    this.path = path;
  }
}

/** Scope rules were broken while `validateScopes` is on. */
export class ScopeError extends IocError {
  override name = 'ScopeError';
}

/** A registration is invalid (e.g. a constructor needs more dependencies than were given). */
export class RegistrationError extends IocError {
  override name = 'RegistrationError';
}

/** `validateOnBuild` found problems. Every problem is listed in {@link ValidationError.errors}. */
export class ValidationError extends IocError {
  override name = 'ValidationError';
  readonly errors: readonly string[];
  constructor(errors: readonly string[]) {
    super(`Service collection is invalid:\n- ${errors.join('\n- ')}`);
    this.errors = errors;
  }
}

/** The provider or scope was used after `dispose()`. */
export class DisposedError extends IocError {
  override name = 'DisposedError';
  constructor() {
    super('Cannot use a disposed service provider or scope.');
  }
}
