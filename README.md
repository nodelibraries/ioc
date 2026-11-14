<div align="center">

# @ylcnfrht/ioc

**Dependency injection that tells you what's wrong before production does.**

A type-safe IoC container for TypeScript and JavaScript, modeled on .NET's `ServiceCollection`:<br>
singleton, scoped and transient lifetimes, keyed services, lifecycle hooks and circular dependencies. No decorators, no `reflect-metadata`.

[![npm](https://img.shields.io/npm/v/@ylcnfrht/ioc?color=a78bfa&label=npm)](https://www.npmjs.com/package/@ylcnfrht/ioc)
[![CI](https://github.com/ylcnfrht/ioc/actions/workflows/ci.yml/badge.svg)](https://github.com/ylcnfrht/ioc/actions/workflows/ci.yml)
[![zero dependencies](https://img.shields.io/badge/dependencies-0-a78bfa)](package.json)
[![types](https://img.shields.io/npm/types/@ylcnfrht/ioc?color=a78bfa)](https://www.npmjs.com/package/@ylcnfrht/ioc)
[![license](https://img.shields.io/npm/l/@ylcnfrht/ioc?color=a78bfa)](LICENSE)
[![Buy me a coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-ffdd00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/ylcnfrht)

[**Documentation**](https://ioc.ferhatyalcin.dev) · [Quick start](https://ioc.ferhatyalcin.dev/start/quick-start/) · [Playground](https://ioc.ferhatyalcin.dev/playground/)

</div>

---

```sh
npm i @ylcnfrht/ioc
```

```ts
import { ServiceCollection, createToken } from '@ylcnfrht/ioc';

interface Logger {
  log(message: string): void;
}
const Logger = createToken<Logger>('Logger');

class UserRepository {
  constructor(private logger: Logger) {}
  find(id: number) {
    this.logger.log(`find ${id}`);
    return { id, name: 'Ada' };
  }
}

const services = new ServiceCollection()
  .addSingleton(Logger, () => ({ log: (m: string) => console.log(m) }))
  .addScoped(UserRepository, [Logger]); // checked against the constructor at compile time

const provider = services.buildServiceProvider({ validateScopes: true, validateOnBuild: true });

await using scope = provider.createScope(); // one scope per request
const users = await scope.getRequiredService(UserRepository); // typed as UserRepository
users.find(1);
```

Dependencies are listed explicitly, one token per constructor parameter. TypeScript checks the list against the constructor, so a missing or wrong dependency is a compile error, not a 3 a.m. stack trace.

## Why @ylcnfrht/ioc

- **The .NET model, in TypeScript.** `addSingleton`, `addScoped`, `addTransient`, `tryAdd*`, keyed services, `createScope`, `getServices`: if you know `Microsoft.Extensions.DependencyInjection`, you already know the API.
- **Typed end to end.** `createToken<T>()` gives interfaces a typed token; resolving it returns `T` with no generic argument. Implementations, factories and values are checked against the token type, dependency lists against the constructor.
- **Mistakes fail early, with a path.** `validateOnBuild` reports missing dependencies and scoped services captured by singletons before the first request. Runtime errors are typed (`ServiceNotFoundError`, `CircularDependencyError`, `ScopeError`, ...) and name the chain: `No service registered for 'Db' (required by UserController → UserService)`.
- **Circular dependencies that just work.** Any lifetime, any length of cycle, identity preserved (`a.b.a === a`), `#private` fields intact. Touching a half-built partner in a constructor throws a clear error instead of handing you `undefined`.
- **Correct under concurrency.** `Promise.all` over the same singleton creates it once; concurrent cycles are detected instead of deadlocking.
- **Clean shutdown.** `onDestroy`, `Symbol.asyncDispose` and `Symbol.dispose` run in reverse creation order, every one of them even if some throw. Scopes support `await using`.
- **Small.** Zero dependencies, no decorators, no metadata. ESM and CommonJS, Node ≥ 20, Bun, Deno, browsers.

## A quick tour

**Registration**: a class, a class with dependencies, an implementation for a token, a factory or a value.

```ts
services.addSingleton(Clock); //                         class as its own token
services.addSingleton(Mailer, [Config, Logger]); //      with dependencies
services.addScoped(Repo, PostgresRepo, [Db]); //         implementation for a token (abstract classes work)
services.addTransient(Request, async (sp) => new Request(await sp.getRequiredService(Config)));
services.addValue(Config, { port: 8080 });
services.tryAddSingleton(Logger, ConsoleLogger); //      only if nothing is registered yet
```

**Lifetimes**: a singleton is shared by everything, a scoped service once per scope, a transient is new every time.

```ts
const provider = services.buildServiceProvider();
await using request = provider.createScope();
const repo = await request.getRequiredService(Repo); // same instance for the rest of this scope
```

**Keyed services**: several implementations of one token, picked by key.

```ts
services.addKeyedSingleton(Cache, MemoryCache, 'memory');
services.addKeyedSingleton(Cache, RedisCache, 'redis', [RedisClient]);
const cache = await provider.getRequiredKeyedService(Cache, 'redis');
```

**All implementations**: every registration of a token, in order.

```ts
services.addSingleton(Plugin, AuditPlugin).addSingleton(Plugin, MetricsPlugin);
const plugins = await provider.getServices(Plugin); // [AuditPlugin, MetricsPlugin]
```

**Lifecycle**: `onInit` after construction, `onDestroy` (or `Symbol.asyncDispose`) on dispose.

```ts
class Db {
  async onInit() { await this.connect(); }
  async onDestroy() { await this.close(); }
}
```

**Diagnostics**: see the graph your container will build.

```ts
console.log(services.visualizeDependencyTree(UserController));
// └── UserController [SCOPED]
//     ├── UserService [SCOPED]
//     │   └── Db [SINGLETON]
//     └── Logger [SINGLETON]
console.log(services.visualizeCircularDependencies());
```

## Errors

Every error extends `IocError`:

| Error | When |
|---|---|
| `ServiceNotFoundError` | A required service or one of its dependencies is not registered (`token`, `key`, `path`). |
| `CircularDependencyError` | A cycle partner was used before its constructor finished (`path`). |
| `ScopeError` | With `validateScopes`: a scoped service resolved from the root or captured by a singleton. |
| `RegistrationError` | A registration is invalid, e.g. fewer dependency tokens than constructor parameters. |
| `ValidationError` | `validateOnBuild` found problems (`errors`). |
| `DisposedError` | The provider or scope was used after `dispose()`. |

## Requirements

Node.js ≥ 20 (or any modern runtime), TypeScript ≥ 5.4 for the typings. Works from plain JavaScript too: `require('@ylcnfrht/ioc')` or `import`.

## Upgrading from 1.x

1.x was published as `@nodelibraries/ioc`; 2.0 moves to `@ylcnfrht/ioc` (`npm remove @nodelibraries/ioc && npm i @ylcnfrht/ioc`, then update the imports) and rewrites the resolution engine. The API keeps its shape; the differences (keyed services are separate from plain ones, registrations are snapshotted at build, dependency counts are checked at registration, typed errors, reverse-order disposal) are listed in the [upgrade guide](https://ioc.ferhatyalcin.dev/migration/v1-to-v2/).

## Documentation

Guides, an interactive lifetime simulator, a dependency-graph explorer, a playground and the full API reference: **[ioc.ferhatyalcin.dev](https://ioc.ferhatyalcin.dev)**. Runnable examples are in [`examples/`](examples).

## Contributing

```sh
npm install
npm test               # unit, regression, randomized and type tests + every example
npm run test:coverage  # with coverage thresholds
npm run test:dist      # build, then smoke-test the ESM and CJS output
npm run check:package  # publint + are-the-types-wrong
```

## Support

If this saves you time, you can [buy me a coffee](https://buymeacoffee.com/ylcnfrht).

## License

[ISC](LICENSE)
