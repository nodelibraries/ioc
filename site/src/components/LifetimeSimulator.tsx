import { useState } from 'preact/hooks';
import { ServiceCollection, ServiceLifetime, type ServiceProvider } from '@nodelibraries/ioc';
import './demo.css';
import './ioc-demos.css';

type Lt = ServiceLifetime;
interface Inst { label: string; lt: Lt }
/** One resolution: the service and the instances it was built from, outermost first. */
interface Row { chain: Inst[]; error?: string }
interface Col { id: string; provider: ServiceProvider; rows: Row[]; disposed: boolean }
interface Line { text: string; tone?: 'err' | 'dim' | 'ok' | 'destroy' }

/** Builds a fresh container. Clock is a singleton, UnitOfWork scoped (needs Clock), Request transient (needs UnitOfWork). */
function makeContainer(validateScopes: boolean, log: (l: Line) => void) {
  const counters: Record<string, number> = {};
  const born = (name: string, lt: Lt): Inst => {
    const label = `${name}#${(counters[name] = (counters[name] ?? 0) + 1)}`;
    log({ text: `  new ${label}`, tone: 'dim' });
    return { label, lt };
  };
  // Real classes (class syntax is what the container treats as an implementation).
  class Clock {
    me = born('Clock', ServiceLifetime.Singleton);
    onDestroy() { log({ text: `  ${this.me.label}.onDestroy()`, tone: 'destroy' }); }
  }
  class UnitOfWork {
    me = born('UnitOfWork', ServiceLifetime.Scoped);
    constructor(readonly clock: Clock) {}
    onDestroy() { log({ text: `  ${this.me.label}.onDestroy()`, tone: 'destroy' }); }
  }
  class Request {
    me = born('Request', ServiceLifetime.Transient);
    constructor(readonly uow: UnitOfWork) {}
    onDestroy() { log({ text: `  ${this.me.label}.onDestroy()`, tone: 'destroy' }); }
  }
  const services = new ServiceCollection()
    .addSingleton(Clock)
    .addScoped(UnitOfWork, [Clock])
    .addTransient(Request, [UnitOfWork]);
  return { provider: services.buildServiceProvider({ validateScopes }), Clock, UnitOfWork, Request };
}

const SERVICES = [
  { key: 'Clock', lt: ServiceLifetime.Singleton, word: 'singleton' },
  { key: 'UnitOfWork', lt: ServiceLifetime.Scoped, word: 'scoped' },
  { key: 'Request', lt: ServiceLifetime.Transient, word: 'transient' },
] as const;

export default function LifetimeSimulator() {
  const [lines, setLines] = useState<Line[]>([{ text: 'buildServiceProvider({ validateScopes: true })', tone: 'ok' }]);
  const [hot, setHot] = useState<string>();
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);
  const log = (l: Line) => setLines((prev) => [...prev, l].slice(-200));

  const build = (validate: boolean, first = false) => {
    const c = makeContainer(validate, log);
    if (!first) setLines([{ text: `buildServiceProvider({ validateScopes: ${validate} })`, tone: 'ok' }]);
    return { validate, c, root: { id: 'root', provider: c.provider, rows: [], disposed: false } as Col, scopes: [] as Col[], next: 1 };
  };
  const [world, setWorld] = useState(() => build(true, true));
  const reset = (validate = world.validate) => setWorld(build(validate));

  const cols = [world.root, ...world.scopes];

  async function resolve(col: Col, key: (typeof SERVICES)[number]['key']) {
    log({ text: `${col.id}.getRequiredService(${key})` });
    try {
      const inst: any = await col.provider.getRequiredService(world.c[key]);
      const chain: Inst[] = [];
      for (let x = inst; x; x = x.uow ?? x.clock) chain.push(x.me);
      col.rows.unshift({ chain });
    } catch (e) {
      const err = e as Error;
      log({ text: `  ${err.name}: ${err.message}`, tone: 'err' });
      col.rows.unshift({ chain: [], error: err.name });
    }
    col.rows.splice(6);
    rerender();
  }

  async function dispose(col: Col) {
    log({ text: `await ${col.id}.dispose()` });
    try {
      await col.provider.dispose();
    } catch (e) {
      log({ text: `  ${(e as Error).message}`, tone: 'err' });
    }
    col.disposed = true;
    rerender();
  }

  function addScope() {
    if (world.root.disposed) return;
    const id = `scope${world.next++}`;
    world.scopes.push({ id, provider: world.root.provider.createScope(), rows: [], disposed: false });
    log({ text: `const ${id} = provider.createScope()` });
    if (world.scopes.length > 3) world.scopes.shift();
    rerender();
  }

  const alive = (label: string) => !lines.some((l) => l.tone === 'destroy' && l.text.includes(`${label}.`));

  return (
    <div class="io-demo io-life">
      <div class="io-row io-life-bar">
        <button type="button" class="io-btn" data-primary onClick={addScope} disabled={world.root.disposed}>+ New scope</button>
        <label class="io-check">
          <input type="checkbox" checked={world.validate} onChange={(e) => reset((e.target as HTMLInputElement).checked)} />
          validateScopes
        </label>
        <button type="button" class="io-btn" onClick={() => reset()}>Reset</button>
        <span class="io-legend">
          {SERVICES.map((s) => <span key={s.key}><span class="io-chip" data-lt={s.lt}>{s.key}</span> {s.word}</span>)}
        </span>
      </div>
      <div class="io-life-cols">
        {cols.map((col) => (
          <section key={col.id} class="io-life-col" data-disposed={col.disposed || undefined} aria-label={col.id}>
            <h4>{col.id === 'root' ? 'root provider' : col.id}{col.disposed && ' · disposed'}</h4>
            <div class="io-row">
              {SERVICES.map((s) => (
                <button type="button" key={s.key} class="io-btn io-small" disabled={col.disposed} onClick={() => resolve(col, s.key)}>
                  {s.key}
                </button>
              ))}
            </div>
            <ol class="io-life-rows">
              {col.rows.map((r, i) => (
                <li key={col.rows.length - i}>
                  {r.error ? (
                    <span class="io-life-err">{r.error}</span>
                  ) : (
                    r.chain.map((x, j) => (
                      <span class="io-link" key={x.label}>
                        {j > 0 && <span class="io-arrow" aria-label="depends on">→</span>}
                        <span
                          class="io-chip"
                          data-lt={x.lt}
                          data-hot={hot === x.label || undefined}
                          data-dead={!alive(x.label) || undefined}
                          onMouseEnter={() => setHot(x.label)}
                          onMouseLeave={() => setHot(undefined)}
                        >
                          {x.label}
                        </span>
                      </span>
                    ))
                  )}
                </li>
              ))}
            </ol>
            <button type="button" class="io-btn io-small" disabled={col.disposed} onClick={() => dispose(col)}>
              {col.id === 'root' ? 'Dispose root' : 'Dispose scope'}
            </button>
          </section>
        ))}
      </div>
      <h4>Event log</h4>
      <pre class="io-log" aria-live="polite">
        {lines.map((l, i) => <div key={i} class={l.tone ? `is-${l.tone}` : undefined}>{l.text}</div>)}
      </pre>
      <p class="io-life-hint">Hover an instance to see everywhere it is shared. Each row is one resolution: the service and the instances injected into it.</p>
    </div>
  );
}
