# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.5] - 2024-11-16

### Added
- Automated npm publish workflow
- Improved error handling and troubleshooting in CI/CD

### Changed
- Enhanced npm publish workflow with better authentication and scope access checks

## [1.3.4] - 2024-11-16

### Added
- Comprehensive JSDoc comments for all public APIs
- Missing tests for `replace()`, `remove()`, `removeAll()`, `getRequiredKeyedService()`, `isService()`, and `dispose()`
- Pre-push Git hook to ensure all tests pass before pushing

### Changed
- Improved type safety throughout the codebase
- Moved all types and interfaces to `src/types.ts` for better organization
- Enhanced error messages and validation

## [1.3.0] - 2024-11-15

### Added
- Dependency tree visualization (`getDependencyTree`, `visualizeDependencyTree`)
- Circular dependency detection (`getCircularDependencies`, `visualizeCircularDependencies`)
- Comprehensive examples for new analysis features
- Updated documentation with visualization examples

### Changed
- Improved circular dependency error messages
- Enhanced documentation structure

## [1.2.0] - 2024-11-14

### Added
- `validateScopes` option for runtime scope validation
- `validateOnBuild` option for build-time dependency validation
- Detailed documentation for validation options
- Comparison with .NET Core's validation features

### Changed
- Default validation behavior documented
- Improved error messages for validation failures

## [1.1.0] - 2024-11-13

### Added
- JavaScript support documentation
- JavaScript examples
- JSDoc comments for better IDE support
- Runtime validation recommendations for JavaScript

### Changed
- Improved documentation structure
- Enhanced examples organization

## [1.0.0] - 2024-11-12

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

[Unreleased]: https://github.com/nodelibraries/ioc/compare/v1.3.5...HEAD
[1.3.5]: https://github.com/nodelibraries/ioc/compare/v1.3.4...v1.3.5
[1.3.4]: https://github.com/nodelibraries/ioc/compare/v1.3.0...v1.3.4
[1.3.0]: https://github.com/nodelibraries/ioc/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/nodelibraries/ioc/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/nodelibraries/ioc/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/nodelibraries/ioc/releases/tag/v1.0.0

