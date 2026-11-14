import { useMemo, useState } from 'preact/hooks';
import { ServiceCollection, ServiceLifetime, ValidationError, type ServiceProvider } from '@nodelibraries/ioc';
import './demo.css';
import './ioc-demos.css';

type Preset = 'app' | 'cycle' | 'captive';

// One registration per line: `Name lifetime: Dep, Dep`.
const PRESETS: Record<Preset, string> = {
  app: `Config singleton
Logger singleton
Db singleton: Config, Logger
UserRepository scoped: Db
UserService scoped: UserRepository, Logger
UserController transient: UserService`,
  cycle: `Logger singleton
OrderService scoped: PaymentService, Logger
PaymentService scoped: InvoiceService
InvoiceService transient: OrderService
AuditLog singleton: AuditLog`,
  captive: `Db singleton
RequestContext scoped
Session scoped: Db
Cache singleton: Session
Templates transient: RequestContext
Mailer singleton: Templates`,
};

interface Reg { name: string; lifetime: ServiceLifetime; deps: string[] }
const LIFETIMES: Record<string, ServiceLifetime> = { singleton: 'SINGLETON', scoped: 'SCOPED', transient: 'TRANSIENT' };

function parse(text: string): { regs: Reg[]; errors: string[] } {
  const regs: Reg[] = [];
  const errors: string[] = [];
  text.split('\n').forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith('//')) return;
    const m = /^([\w$]+)\s+(singleton|scoped|transient)\s*(?::\s*(.*))?$/i.exec(line);
    if (!m) return void errors.push(`line ${i + 1}: expected "Name lifetime: Dep, Dep"`);
    const deps = (m[3] ?? '').split(',').map((d) => d.trim()).filter(Boolean);
    regs.push({ name: m[1]!, lifetime: LIFETIMES[m[2]!.toLowerCase()]!, deps });
  });
  return { regs, errors };
}

/** Registers every line with the real library. Tokens are strings; implementations are real (empty) classes. */
function analyse(regs: Reg[]) {
  const services = new ServiceCollection();
  for (const r of regs) {
    const Impl = class { constructor(..._deps: unknown[]) {} };
    Object.defineProperty(Impl, 'name', { value: r.name });
    if (r.lifetime === ServiceLifetime.Singleton) services.addSingleton(r.name, Impl, r.deps);
    else if (r.lifetime === ServiceLifetime.Scoped) services.addScoped(r.name, Impl, r.deps);
    else services.addTransient(r.name, Impl, r.deps);
  }
  const cycles = services.getCircularDependencies().map((c) => c.tokens.map((t) => t.name));
  let problems: string[] = [];
  try {
    services.buildServiceProvider({ validateOnBuild: true, validateScopes: true });
  } catch (e) {
    if (e instanceof ValidationError) problems = [...e.errors];
    else throw e;
  }
  // "Singleton 'Cache' captures scoped 'Session' (Cache → Session)."
  const captive = problems
    .map((p) => /captures scoped .*\((.*)\)\.$/.exec(p)?.[1]?.split(' → '))
    .filter((x): x is string[] => !!x);
  const missing = problems.map((p) => /depends on '([^']+)', which is not registered/.exec(p)?.[1]).filter((x): x is string => !!x);
  return { services, cycles, captive, missing, problems };
}

/** Columns by depth (a service sits right of everything it depends on); back edges of cycles are ignored. */
function layout(regs: Reg[], missing: string[]) {
  const byName = new Map(regs.map((r) => [r.name, r]));
  const depth = new Map<string, number>();
  const visiting = new Set<string>();
  const visit = (n: string): number => {
    if (depth.has(n)) return depth.get(n)!;
    if (visiting.has(n)) return 0;
    visiting.add(n);
    const d = Math.max(-1, ...(byName.get(n)?.deps ?? []).map(visit)) + 1;
    visiting.delete(n);
    depth.set(n, d);
    return d;
  };
  const names = [...new Set([...regs.map((r) => r.name), ...missing])];
  names.forEach(visit);
  const cols: string[][] = [];
  for (const n of names) (cols[depth.get(n)!] ??= []).push(n);
  const W = 136, H = 34, GX = 34, GY = 18, PAD = 12;
  const pos = new Map<string, { x: number; y: number }>();
  const tallest = Math.max(1, ...cols.map((c) => c?.length ?? 0));
  cols.forEach((col, ci) =>
    col?.forEach((n, ri) => {
      const offset = ((tallest - col.length) * (H + GY)) / 2;
      pos.set(n, { x: PAD + ci * (W + GX), y: PAD + offset + ri * (H + GY) });
    }),
  );
  return { pos, W, H, width: PAD * 2 + cols.length * (W + GX) - GX, height: PAD * 2 + tallest * (H + GY) - GY };
}

const pairKey = (a: string, b: string) => `${a}→${b}`;

export default function DependencyGraph({ preset = 'app' }: { preset?: Preset }) {
  const [text, setText] = useState(PRESETS[preset]);
  const [selected, setSelected] = useState<string>();
  const [result, setResult] = useState<{ ok: boolean; text: string }>();

  const { regs, errors } = useMemo(() => parse(text), [text]);
  const a = useMemo(() => analyse(regs), [regs]);
  const g = useMemo(() => layout(regs, a.missing), [regs, a.missing]);

  const cycleEdges = new Set<string>();
  for (const c of a.cycles) for (let i = 0; i < c.length - 1; i++) cycleEdges.add(pairKey(c[i]!, c[i + 1]!));
  const captiveEdges = new Set<string>();
  const captiveNodes = new Set<string>();
  for (const p of a.captive) {
    captiveNodes.add(p[0]!).add(p.at(-1)!);
    for (let i = 0; i < p.length - 1; i++) captiveEdges.add(pairKey(p[i]!, p[i + 1]!));
  }
  const cycleNodes = new Set(a.cycles.flat());
  const lifetimeOf = new Map(regs.map((r) => [r.name, r.lifetime]));

  async function resolve(name: string) {
    setSelected(name);
    // Resolve for real, inside a scope, with validateScopes on: cycles resolve, captive dependencies throw.
    const provider: ServiceProvider = a.services.buildServiceProvider({ validateScopes: true });
    const scope = provider.createScope();
    try {
      const instance = await scope.getRequiredService(name);
      setResult({ ok: true, text: `scope.getRequiredService('${name}') → ${(instance as object).constructor.name} instance` });
    } catch (e) {
      const err = e as Error;
      setResult({ ok: false, text: `${err.name}: ${err.message}` });
    } finally {
      await scope.dispose();
      await provider.dispose();
    }
  }

  return (
    <div class="io-demo io-graph">
      <div class="io-graph-grid">
        <label class="io-field io-graph-edit">
          Registrations <span class="io-graph-hint">one per line: Name lifetime: Dep, Dep</span>
          <textarea value={text} spellcheck={false} rows={8} onInput={(e) => setText((e.target as HTMLTextAreaElement).value)} />
        </label>
        <div class="io-graph-side">
          <div class="io-row">
            {(Object.keys(PRESETS) as Preset[]).map((p) => (
              <button type="button" key={p} class="io-btn io-small" onClick={() => { setText(PRESETS[p]); setResult(undefined); setSelected(undefined); }}>
                {p}
              </button>
            ))}
          </div>
          <div class="io-stats">
            <div class="io-stat"><b>{regs.length}</b><span>registrations</span></div>
            <div class="io-stat" data-bad={a.cycles.length > 0 || undefined}><b>{a.cycles.length}</b><span>cycles</span></div>
            <div class="io-stat" data-warn={a.captive.length > 0 || undefined}><b>{a.captive.length}</b><span>captive</span></div>
            <div class="io-stat" data-warn={a.missing.length > 0 || undefined}><b>{a.missing.length}</b><span>missing</span></div>
          </div>
        </div>
      </div>

      <div class="io-graph-canvas">
        <svg viewBox={`0 0 ${g.width} ${g.height}`} width={g.width} height={g.height} role="img" aria-label="Dependency graph">
          <defs>
            {['plain', 'cycle', 'captive'].map((k) => (
              <marker id={`io-arrow-${k}-${preset}`} key={k} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 0 10 5 0 10z" class={`io-edge-head is-${k}`} />
              </marker>
            ))}
          </defs>
          {regs.flatMap((r) =>
            r.deps.map((d) => {
              const from = g.pos.get(r.name)!;
              const to = g.pos.get(d);
              if (!to) return null;
              const kind = cycleEdges.has(pairKey(r.name, d)) ? 'cycle' : captiveEdges.has(pairKey(r.name, d)) ? 'captive' : 'plain';
              // Edges point from a service to what it depends on (right to left); back edges loop around.
              const x1 = from.x, y1 = from.y + g.H / 2, x2 = to.x + g.W, y2 = to.y + g.H / 2;
              const self = r.name === d;
              const path = self
                ? `M${from.x + g.W - 30} ${from.y} C${from.x + g.W - 30} ${from.y - 26}, ${from.x + g.W + 18} ${from.y - 10}, ${from.x + g.W} ${from.y + 8}`
                : x2 <= x1
                  ? `M${x1} ${y1} C${x1 - 30} ${y1}, ${x2 + 30} ${y2}, ${x2} ${y2}`
                  : `M${from.x + g.W / 2} ${from.y + g.H} C${from.x + g.W / 2} ${Math.max(from.y, to.y) + g.H + 40}, ${to.x + g.W / 2} ${Math.max(from.y, to.y) + g.H + 40}, ${to.x + g.W / 2} ${to.y + g.H}`;
              return <path key={`${r.name}-${d}`} d={path} class={`io-edge is-${kind}`} marker-end={`url(#io-arrow-${kind}-${preset})`} />;
            }),
          )}
          {[...g.pos].map(([name, p]) => {
            const lt = lifetimeOf.get(name);
            return (
              <g
                key={name}
                class="io-node"
                data-lt={lt ?? 'MISSING'}
                data-cycle={cycleNodes.has(name) || undefined}
                data-captive={captiveNodes.has(name) || undefined}
                data-selected={selected === name || undefined}
                transform={`translate(${p.x} ${p.y})`}
                tabIndex={lt ? 0 : -1}
                role={lt ? 'button' : undefined}
                aria-label={lt ? `Resolve ${name}` : `${name} (not registered)`}
                onClick={() => lt && resolve(name)}
                onKeyDown={(e) => lt && (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), resolve(name))}
              >
                <rect width={g.W} height={g.H} rx="9" />
                <text x="12" y={g.H / 2 + 4}>{name}</text>
                <text x={g.W - 10} y={g.H / 2 + 4} text-anchor="end" class="io-node-lt">{lt ? lt.slice(0, 2) : '??'}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div class="io-legend">
        <span><span class="io-chip" data-lt="SINGLETON">SI</span> singleton</span>
        <span><span class="io-chip" data-lt="SCOPED">SC</span> scoped</span>
        <span><span class="io-chip" data-lt="TRANSIENT">TR</span> transient</span>
        <span><i class="io-key is-cycle" /> cycle</span>
        <span><i class="io-key is-captive" /> captive dependency</span>
        <span>Click a service to resolve it for real.</span>
      </div>

      <pre class="io-log" aria-live="polite">
        {errors.map((e) => <div class="is-err">{e}</div>)}
        {a.cycles.map((c) => <div class="is-err">cycle: {c.join(' → ')}</div>)}
        {a.problems.map((p) => <div class="is-destroy">ValidationError: {p}</div>)}
        {!errors.length && !a.cycles.length && !a.problems.length && <div class="is-ok">No cycles, nothing missing, no captive dependencies.</div>}
        {result && <div class={result.ok ? 'is-ok' : 'is-err'}>{result.text}</div>}
      </pre>
    </div>
  );
}
