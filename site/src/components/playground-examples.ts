// Starting snippets for the playground. Each runs as-is against the real library.
export const EXAMPLES: Record<string, string> = {
  'Basics: tokens, scopes, lifetimes': `import { ServiceCollection, createToken } from '@nodelibraries/ioc';

interface Logger {
  log(message: string): void;
}
const Logger = createToken<Logger>('Logger');

class ConsoleLogger implements Logger {
  log(message: string) {
    console.log(\`[log] \${message}\`);
  }
}

class UserRepository {
  constructor(private logger: Logger) {}
  find(id: number) {
    this.logger.log(\`find \${id}\`);
    return { id, name: 'Ada' };
  }
}

const services = new ServiceCollection()
  .addSingleton(Logger, ConsoleLogger)
  .addScoped(UserRepository, [Logger]);

const provider = services.buildServiceProvider({ validateScopes: true, validateOnBuild: true });

const scope = provider.createScope();
const repo = await scope.getRequiredService(UserRepository);
console.log(repo.find(1));
console.log('same in scope:', repo === (await scope.getRequiredService(UserRepository)));

const other = provider.createScope();
console.log('same across scopes:', repo === (await other.getRequiredService(UserRepository)));

await scope.dispose();
await other.dispose();
`,
  'Circular dependencies': `import { ServiceCollection, CircularDependencyError } from '@nodelibraries/ioc';

class Orders {
  constructor(public payments: Payments) {}
  place() {
    return \`order placed, \${this.payments.charge()}\`;
  }
}
class Payments {
  #fee = 2;
  constructor(public orders: Orders) {}
  charge() {
    return \`charged with fee \${this.#fee}\`;
  }
}

const provider = new ServiceCollection()
  .addSingleton(Orders, [Payments])
  .addSingleton(Payments, [Orders])
  .buildServiceProvider();

const orders = await provider.getRequiredService(Orders);
console.log(orders.place());
console.log('identity holds:', orders.payments.orders === orders);

// Using a cycle partner inside a constructor is an error, with the path.
class A {
  constructor(public b: B) {}
  hello() { return 'hi'; }
}
class B {
  constructor(a: A) { a.hello(); } // A is still being built here
}

try {
  await new ServiceCollection().addSingleton(A, [B]).addSingleton(B, [A]).buildServiceProvider().getRequiredService(A);
} catch (e) {
  if (!(e instanceof CircularDependencyError)) throw e;
  console.log(e.name + ':', e.message);
}
`,
  'Validation and typed errors': `import { ServiceCollection, ValidationError, ScopeError, ServiceNotFoundError } from '@nodelibraries/ioc';

class Db {}
class Session { constructor(public db: Db) {} }
class Cache { constructor(public session: Session) {} } // a singleton holding a scoped service
class Mailer { constructor(public templates: unknown) {} }

const services = new ServiceCollection()
  .addSingleton(Db)
  .addScoped(Session, [Db])
  .addSingleton(Cache, [Session])
  .addSingleton(Mailer, ['Templates']); // never registered

try {
  services.buildServiceProvider({ validateScopes: true, validateOnBuild: true });
} catch (e) {
  if (e instanceof ValidationError) console.log(e.errors);
}

const provider = services.buildServiceProvider({ validateScopes: true });
try {
  await provider.getRequiredService(Session);
} catch (e) {
  if (e instanceof ScopeError) console.log('ScopeError:', e.message);
}
try {
  await provider.getRequiredService(Mailer);
} catch (e) {
  if (e instanceof ServiceNotFoundError) console.log('ServiceNotFoundError:', e.message, e.path);
}
`,
  'Lifecycle and disposal order': `import { ServiceCollection } from '@nodelibraries/ioc';

class Db {
  async onInit() { console.log('Db connected'); }
  async onDestroy() { console.log('Db closed'); }
}
class UnitOfWork {
  constructor(public db: Db) {}
  onDestroy() { console.log('UnitOfWork rolled back'); }
}
class Handler {
  constructor(public uow: UnitOfWork) {}
  [Symbol.dispose]() { console.log('Handler disposed'); }
}

const provider = new ServiceCollection()
  .addSingleton(Db)
  .addScoped(UnitOfWork, [Db])
  .addTransient(Handler, [UnitOfWork])
  .buildServiceProvider({ validateScopes: true });

const scope = provider.createScope();
await scope.getRequiredService(Handler);
console.log('-- dispose scope (reverse creation order)');
await scope.dispose();
console.log('-- dispose root');
await provider.dispose();
`,
  'Keyed and multiple implementations': `import { ServiceCollection, createToken } from '@nodelibraries/ioc';

interface Notifier { send(to: string): string }
const Notifier = createToken<Notifier>('Notifier');

class Email implements Notifier { send(to: string) { return \`email to \${to}\`; } }
class Sms implements Notifier { send(to: string) { return \`sms to \${to}\`; } }

const provider = new ServiceCollection()
  .addSingleton(Notifier, Email)
  .addSingleton(Notifier, Sms)
  .addKeyedSingleton(Notifier, Email, 'primary')
  .addKeyedSingleton(Notifier, (sp, key) => ({ send: (to) => \`push (\${String(key)}) to \${to}\` }), 'push')
  .buildServiceProvider();

for (const n of await provider.getServices(Notifier)) console.log(n.send('ada'));
console.log('last wins:', (await provider.getRequiredService(Notifier)).send('ada'));
console.log((await provider.getRequiredKeyedService(Notifier, 'push')).send('ada'));
`,
};
