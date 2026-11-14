import { createToken, ServiceCollection, ServiceProvider, type InjectionToken } from '../src/index.ts';

interface Logger {
  log(msg: string): void;
}
class ConsoleLogger implements Logger {
  log() {}
}
class Db {
  query() {}
}
class Repo {
  constructor(
    public db: Db,
    public logger: Logger,
  ) {}
}
abstract class Clock {
  abstract now(): number;
}
class SystemClock extends Clock {
  now() {
    return Date.now();
  }
}

const LoggerToken = createToken<Logger>('Logger');
const services = new ServiceCollection();
const provider = services.buildServiceProvider();

test('resolution infers the type from the token', () => {
  expectTypeOf(LoggerToken).toEqualTypeOf<InjectionToken<Logger>>();
  expectTypeOf(provider.getRequiredService(LoggerToken)).resolves.toEqualTypeOf<Logger>();
  expectTypeOf(provider.getService(LoggerToken)).resolves.toEqualTypeOf<Logger | undefined>();
  expectTypeOf(provider.getRequiredService(Repo)).resolves.toEqualTypeOf<Repo>();
  expectTypeOf(provider.getRequiredService(Clock)).resolves.toEqualTypeOf<Clock>();
  expectTypeOf(provider.getServices(LoggerToken)).resolves.toEqualTypeOf<Logger[]>();
  expectTypeOf(provider.getRequiredKeyedService(LoggerToken, 'k')).resolves.toEqualTypeOf<Logger>();
  expectTypeOf(provider.getRequiredService('logger')).resolves.toBeUnknown();
  expectTypeOf(provider.getRequiredService<Logger>('logger')).resolves.toEqualTypeOf<Logger>();
});

test('dependencies are checked against the constructor', () => {
  services.addSingleton(Repo, Repo, [Db, LoggerToken]);
  services.addSingleton(Repo, [Db, LoggerToken]);
  services.addSingleton(Repo, [Db, 'logger']); // string tokens are untyped: accepted
  services.addKeyedScoped(Repo, Repo, 'main', [Db, LoggerToken]);
  // @ts-expect-error missing dependency
  services.addSingleton(Repo, Repo, [Db]);
  // @ts-expect-error constructor needs dependencies
  services.addSingleton(Repo);
  // @ts-expect-error wrong token type in position 0
  services.addSingleton(Repo, Repo, [LoggerToken, LoggerToken]);
  // @ts-expect-error keyed: missing dependency array
  services.addKeyedSingleton(Repo, Repo, 'main');
  // Writing <T> explicitly keeps working, without the compile-time count check.
  services.addSingleton<Repo>(Repo, Repo, [Db]);
});

test('implementations and factories must produce the token type', () => {
  services.addSingleton(LoggerToken, ConsoleLogger);
  services.addSingleton(Clock, SystemClock);
  services.addSingleton(LoggerToken, (sp) => {
    expectTypeOf(sp).toEqualTypeOf<ServiceProvider>();
    return new ConsoleLogger();
  });
  services.addScoped(LoggerToken, async () => new ConsoleLogger());
  services.addValue(LoggerToken, { log() {} });
  // @ts-expect-error Db is not a Logger
  services.addSingleton(LoggerToken, Db);
  // @ts-expect-error factory returns the wrong type
  services.addSingleton(LoggerToken, () => 42);
  // @ts-expect-error value has the wrong type
  services.addValue(LoggerToken, 'nope');
  // @ts-expect-error abstract classes cannot be implementations
  services.addSingleton(Clock, Clock);
});

test('scopes are async-disposable', () => {
  expectTypeOf(provider.createScope()).toEqualTypeOf<ServiceProvider>();
  expectTypeOf(provider.createScope()[Symbol.asyncDispose]).toBeFunction();
});

test('explicit type arguments on string tokens are honoured', () => {
  expectTypeOf(provider.getRequiredService<string>('apiUrl')).resolves.toEqualTypeOf<string>();
  expectTypeOf(provider.getService<number>('port')).resolves.toEqualTypeOf<number | undefined>();
});

test('a class is not accepted where a different InjectionToken is expected', () => {
  class Clock2 {
    now() {
      return 1;
    }
  }
  class Report {
    constructor(public logger: Logger) {}
  }
  // @ts-expect-error Clock2 does not produce a Logger
  services.addScoped(Report, [Clock2]);
  services.addScoped(Report, [LoggerToken]);
  // @ts-expect-error a class is not an InjectionToken
  const token: InjectionToken<Logger> = ConsoleLogger;
});
