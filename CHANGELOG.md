# Changelog

## 2.0.0 (2026-11-14)

Published as `@ylcnfrht/ioc` (1.x was `@nodelibraries/ioc`, now deprecated). The resolution engine was rewritten; the registration API keeps its shape. Upgrade guide: https://ioc.ferhatyalcin.dev/migration/v1-to-v2/

### Fixed (defects present in 1.3.x)

- Classes with `#private` fields failed to resolve (every instance was copied onto a placeholder object).
- Concurrent resolutions of a transient service returned the same object.
- Singletons were cached by `token.toString()` + class name: keyed singletons of one class shared an instance, different symbols with the same description collided, factories with identical source code (e.g. registered in a loop) were reported as circular.
- Scoped services with several implementations returned the same instance from `getServices`.
- `dispose()` skipped all but the first implementation of a token and disposed in creation order.
- Keyed registrations leaked into `getService(token)` and could not declare dependencies.
- `replace()` always switched the lifetime to singleton.
- `remove()` left keyed registrations behind; providers shared mutable state with their collection.
- `addValue(token, null)` made `getRequiredService` throw "No provider found".
- Plain `function` factories were called with `new`.
- Error messages printed the full source of class tokens.

### Added

- `createToken<T>(name)` / `InjectionToken<T>`: typed tokens; resolution infers `T`.
- Compile-time checks: dependency lists against constructor parameters; implementations, factories and values against the token type. Abstract classes as tokens.
- Typed errors: `IocError`, `ServiceNotFoundError` (with `token`, `key`, resolution `path`), `CircularDependencyError` (`path`), `ScopeError`, `RegistrationError`, `ValidationError` (`errors`), `DisposedError`.
- Circular dependencies for every lifetime through a proxy that keeps identity and `#private` fields; deadlock detection for concurrent cycles, also through async factories.
- `validateOnBuild` reports missing dependencies of keyed services and, with `validateScopes`, singletons that capture scoped services. `validateScopes` reports the capture path at runtime.
- `await using scope = provider.createScope()`; `Symbol.asyncDispose` / `Symbol.dispose` on services; scopes dispose the transients they created; dispose errors are rethrown after every service ran (`AggregateError` for several).
- Keyed services take a dependency list (`addKeyedScoped(token, Impl, key, [deps])`); keyed factories receive the key.
- `ServiceCollection.has(token, key?)`.
- ESM + CommonJS builds with an `exports` map.

### Changed

- Registrations are snapshotted by `buildServiceProvider()`: register everything before building.
- Dependency counts are checked when registering (`RegistrationError`), not when resolving.
- A token-only registration (`addSingleton(token)`) requires a class. Only `class` syntax is treated as an implementation; plain and arrow functions are factories.
- `isService()` is synchronous. `removeAll()` was removed (`remove()` does the same).
- Factories receive a provider view that carries the resolution chain (not the provider object itself).
- Node.js ≥ 20, TypeScript ≥ 5.4. Docs moved to https://ioc.ferhatyalcin.dev.

## [1.3.11] - 2025-11-19

### Added

- GitHub Actions workflow `PR Tests` to automatically run lint/unit tests for every pull request and manual trigger.
- npm publish automation now runs on every merge to `main`, ensuring package releases stay up to date without manual steps.

### Changed

- Scoped service resolution attempts from the root provider now emit a more professional message with explicit remediation steps.
- Constructor dependency errors now report expected vs. provided dependency counts and list the supplied tokens.
- `ServiceCollection` tests now cover missing-dependency scenarios to guard against regressions.

## [1.3.5] - 2025-11-16

### Added

- Automated npm publish workflow
- Improved error handling and troubleshooting in CI/CD

### Changed

- Enhanced npm publish workflow with better authentication and scope access checks

## [1.3.4] - 2025-11-16

### Added

- Comprehensive JSDoc comments for all public APIs
- Missing tests for `replace()`, `remove()`, `removeAll()`, `getRequiredKeyedService()`, `isService()`, and `dispose()`
- Pre-push Git hook to ensure all tests pass before pushing

### Changed

- Improved type safety throughout the codebase
- Moved all types and interfaces to `src/types.ts` for better organization
- Enhanced error messages and validation

## [1.3.0] - 2025-11-15

### Added

- Dependency tree visualization (`getDependencyTree`, `visualizeDependencyTree`)
- Circular dependency detection (`getCircularDependencies`, `visualizeCircularDependencies`)
- Comprehensive examples for new analysis features
- Updated documentation with visualization examples

### Changed

- Improved circular dependency error messages
- Enhanced documentation structure

## [1.2.0] - 2025-11-14

### Added

- `validateScopes` option for runtime scope validation
- `validateOnBuild` option for build-time dependency validation
- Detailed documentation for validation options
- Comparison with .NET Core's validation features

### Changed

- Default validation behavior documented
- Improved error messages for validation failures

## [1.1.0] - 2025-11-13

### Added

- JavaScript support documentation
- JavaScript examples
- JSDoc comments for better IDE support
- Runtime validation recommendations for JavaScript

### Changed

- Improved documentation structure
- Enhanced examples organization

## [1.0.0] - 2025-11-12

### Added

- Initial release
- Core IoC container functionality
- TypeScript support
- Service lifetimes (Singleton, Scoped, Transient)
- Dependency injection
- Factory pattern support
- Keyed services
- Multiple implementations
- TryAdd pattern
- Lifecycle hooks (onInit, onDestroy)
- Value registration
- Circular dependency resolution
- Scope validation
- Service management (remove, replace)
- Comprehensive documentation
- GitHub Pages documentation site

[Unreleased]: https://github.com/ylcnfrht/ioc/compare/v1.3.11...HEAD
[1.3.11]: https://github.com/ylcnfrht/ioc/compare/v1.3.5...v1.3.11
[1.3.5]: https://github.com/ylcnfrht/ioc/compare/v1.3.4...v1.3.5
[1.3.4]: https://github.com/ylcnfrht/ioc/compare/v1.3.0...v1.3.4
[1.3.0]: https://github.com/ylcnfrht/ioc/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/ylcnfrht/ioc/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/ylcnfrht/ioc/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/ylcnfrht/ioc/releases/tag/v1.0.0
