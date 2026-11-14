// Runs against the built package through its own exports map (CJS entry).
const assert = require('node:assert/strict');
const { ServiceCollection, ServiceLifetime } = require('@nodelibraries/ioc');

class A { constructor(b) { this.b = b; } }
class B { constructor(a) { this.a = a; } }
(async () => {
  const provider = new ServiceCollection().addSingleton(A, [B]).addSingleton(B, [A]).buildServiceProvider();
  const a = await provider.getRequiredService(A);
  assert.equal(a.b.a, a);
  assert.equal(ServiceLifetime.Scoped, 'SCOPED');
  console.log('cjs ok');
})();
