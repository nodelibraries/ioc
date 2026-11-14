import { useEffect, useRef, useState } from 'preact/hooks';
import { ServiceCollection, createToken } from '@ylcnfrht/ioc';
import './demo.css';
import './ioc-demos.css';
import './HeroDemo.css';

/** The snippet shown next to the output. `run` below executes exactly this, with the real library. */
export const HERO_CODE = `import { ServiceCollection, createToken } from '@ylcnfrht/ioc';

interface Logger { log(msg: string): void }
const Logger = createToken<Logger>('Logger');

class Db { onDestroy() { console.log('Db closed') } }
class Users {
  constructor(readonly db: Db, readonly logger: Logger) {}
}

const provider = new ServiceCollection()
  .addSingleton(Logger, () => ({ log: console.log }))
  .addScoped(Db)
  .addTransient(Users, [Db, Logger]) // checked
  .buildServiceProvider({ validateScopes: true });

for (const request of ['GET /a', 'GET /b']) {
  await using scope = provider.createScope();
  const a = await scope.getRequiredService(Users);
  const b = await scope.getRequiredService(Users);
  console.log(request, a === b, a.db === b.db);
}`;

interface Line { text: string; tone?: 'dim' | 'ok' | 'destroy' }

async function run(out: (l: Line) => void) {
  let dbs = 0;
  let users = 0;
  interface Logger { log(msg: string): void }
  const Logger = createToken<Logger>('Logger');
  class Db {
    id = ++dbs;
    onDestroy() { out({ text: `Db#${this.id} closed`, tone: 'destroy' }); }
  }
  class Users {
    id = ++users;
    constructor(readonly db: Db, readonly logger: Logger) {}
  }
  const provider = new ServiceCollection()
    .addSingleton(Logger, () => ({ log: (m: string) => out({ text: m }) }))
    .addScoped(Db)
    .addTransient(Users, [Db, Logger])
    .buildServiceProvider({ validateScopes: true });

  for (const request of ['GET /a', 'GET /b']) {
    const scope = provider.createScope();
    try {
      const a = await scope.getRequiredService(Users);
      const b = await scope.getRequiredService(Users);
      out({ text: `${request} ${a === b} ${a.db === b.db}`, tone: 'ok' });
      out({ text: `  Users#${a.id}, Users#${b.id} share Db#${a.db.id}`, tone: 'dim' });
    } finally {
      await scope.dispose();
    }
  }
  await provider.dispose();
}

/** Landing-page widget: runs the hero snippet against the real container and prints what it logs. */
export default function HeroDemo() {
  const [lines, setLines] = useState<Line[]>([]);
  const [round, setRound] = useState(0);
  const [done, setDone] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  // Auto-play once, when scrolled into view.
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) {
        io.disconnect();
        setRound(1);
      }
    });
    io.observe(root.current!);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!round) return;
    let live = true;
    const collected: Line[] = [];
    setLines([]);
    setDone(false);
    void run((l) => collected.push(l)).then(async () => {
      // The container is instant; reveal the lines one by one so the order is readable.
      const stagger = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 260;
      for (let i = 0; i < collected.length && live; i++) {
        await new Promise((r) => setTimeout(r, stagger));
        if (live) setLines(collected.slice(0, i + 1));
      }
      if (live) setDone(true);
    });
    return () => {
      live = false;
    };
  }, [round]);

  return (
    <div class="io-hero-out" ref={root}>
      <div class="io-hero-head">
        <span class="io-hero-dots" aria-hidden="true"><i /><i /><i /></span>
        <span>node app.ts</span>
        <button type="button" class="io-hero-replay" onClick={() => setRound((r) => r + 1)}>Run again</button>
      </div>
      <pre aria-live="polite">
        <div class="is-dim">$ node app.ts</div>
        {lines.map((l, i) => <div key={i} class={l.tone ? `is-${l.tone}` : undefined}>{l.text}</div>)}
        {done && <div class="is-dim">exit 0 · real @ylcnfrht/ioc, in your browser</div>}
        <span class="io-hero-caret" aria-hidden="true" />
      </pre>
    </div>
  );
}
