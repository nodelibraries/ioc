// Runs against the built package through its own exports map (ESM entry).
import assert from 'node:assert/strict';
import { ServiceCollection, createToken, ServiceNotFoundError, IocError } from '@nodelibraries/ioc';

const Greeting = createToken('Greeting');
class Greeter {
  #name = 'esm';
  constructor(greeting) { this.greeting = greeting; }
  hello() { return `${this.greeting}, ${this.#name}`; }
}
const provider = new ServiceCollection().addValue(Greeting, 'hello').addScoped(Greeter, [Greeting]).buildServiceProvider({ validateScopes: true, validateOnBuild: true });
{
  await using scope = provider.createScope();
  assert.equal((await scope.getRequiredService(Greeter)).hello(), 'hello, esm');
}
const err = await provider.getRequiredService('missing').catch((e) => e);
assert.ok(err instanceof ServiceNotFoundError && err instanceof IocError);
console.log('esm ok');
