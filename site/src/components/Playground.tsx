import { useEffect, useRef, useState } from 'preact/hooks';
import * as ioc from '@nodelibraries/ioc';
import { EXAMPLES } from './playground-examples.ts';
import './demo.css';
import './ioc-demos.css';
import './Playground.css';

type Tone = 'log' | 'error' | 'warn' | 'dim';
interface Line { tone: Tone; text: string }

const NAMES = Object.keys(EXAMPLES);
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as new (...args: string[]) => (...a: unknown[]) => Promise<void>;

/** console.log-style formatting, small and good enough for container output. */
export function fmt(value: unknown, depth = 0, seen = new Set<unknown>()): string {
  if (typeof value === 'string') return depth ? JSON.stringify(value) : value;
  if (typeof value === 'symbol') return value.toString();
  if (typeof value === 'bigint') return `${value}n`;
  if (typeof value === 'function') return /^class[\s{]/.test(Function.prototype.toString.call(value)) ? `[class ${value.name || '(anonymous)'}]` : `[Function ${value.name || '(anonymous)'}]`;
  if (value === null || typeof value !== 'object') return String(value);
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  if (seen.has(value)) return '[Circular]';
  if (depth > 2) return Array.isArray(value) ? '[Array]' : '[Object]';
  seen.add(value);
  try {
    if (Array.isArray(value)) return `[ ${value.map((v) => fmt(v, depth + 1, seen)).join(', ')} ]`;
    if (value instanceof ioc.InjectionToken) return value.toString();
    const name = Object.getPrototypeOf(value)?.constructor?.name;
    const body = Object.keys(value).map((k) => `${k}: ${fmt((value as Record<string, unknown>)[k], depth + 1, seen)}`).join(', ');
    const prefix = name && name !== 'Object' ? `${name} ` : '';
    return body ? `${prefix}{ ${body} }` : `${prefix}{}`;
  } finally {
    seen.delete(value);
  }
}

/** Strips types and turns `import … from '@nodelibraries/ioc'` into a `require`, so the snippet runs in an async function. */
async function compile(source: string): Promise<string> {
  const { transform } = await import('sucrase');
  return transform(source, { transforms: ['typescript', 'imports'], disableESTransforms: true, production: true }).code;
}

export default function Playground() {
  const [example, setExample] = useState(NAMES[0]!);
  const [code, setCode] = useState(EXAMPLES[NAMES[0]!]!);
  const [lines, setLines] = useState<Line[]>([]);
  const [running, setRunning] = useState(false);
  const [ms, setMs] = useState<number>();
  const editor = useRef<HTMLTextAreaElement>(null);

  // Code from the URL hash (#code=…) wins over the default example, so links can share a snippet.
  useEffect(() => {
    const m = /#code=([^&]+)/.exec(location.hash);
    if (!m) return;
    try {
      setCode(decodeURIComponent(escape(atob(m[1]!))));
      setExample('');
    } catch {
      /* ignore a malformed hash */
    }
  }, []);

  async function run() {
    setRunning(true);
    const out: Line[] = [];
    const push = (tone: Tone) => (...args: unknown[]) => {
      out.push({ tone, text: args.map((a) => fmt(a)).join(' ') });
      setLines([...out]);
    };
    const sandboxConsole = { log: push('log'), info: push('log'), debug: push('dim'), warn: push('warn'), error: push('error') };
    const require = (id: string) => {
      if (id === '@nodelibraries/ioc') return ioc;
      throw new Error(`Only '@nodelibraries/ioc' can be imported in the playground (got '${id}').`);
    };
    setLines([]);
    const t0 = performance.now();
    try {
      const js = await compile(code);
      const exports = {};
      await new AsyncFunction('require', 'console', 'exports', 'module', js)(require, sandboxConsole, exports, { exports });
    } catch (e) {
      const err = e as Error;
      out.push({ tone: 'error', text: err?.name ? `Uncaught ${err.name}: ${err.message}` : `Uncaught ${fmt(e)}` });
      setLines([...out]);
    } finally {
      setMs(performance.now() - t0);
      if (!out.length) setLines([{ tone: 'dim', text: '(no output)' }]);
      setRunning(false);
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    const ta = e.currentTarget as HTMLTextAreaElement;
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      void run();
    } else if (e.key === 'Tab' && !e.shiftKey && !e.altKey) {
      // Indent instead of leaving the editor; Escape then Tab still moves focus on.
      if (ta.dataset.escaped) return void delete ta.dataset.escaped;
      e.preventDefault();
      const { selectionStart: s, selectionEnd: end } = ta;
      const next = `${code.slice(0, s)}  ${code.slice(end)}`;
      setCode(next);
      requestAnimationFrame(() => ta.setSelectionRange(s + 2, s + 2));
    } else if (e.key === 'Escape') {
      ta.dataset.escaped = '1';
    }
  }

  function share() {
    const url = `${location.origin}${location.pathname}#code=${btoa(unescape(encodeURIComponent(code)))}`;
    history.replaceState(null, '', url);
    void navigator.clipboard?.writeText(url);
  }

  return (
    <div class="io-demo io-play">
      <div class="io-row io-play-bar">
        <label class="io-field io-play-pick">
          Example
          <select
            value={example}
            onChange={(e) => {
              const name = (e.target as HTMLSelectElement).value;
              setExample(name);
              setCode(EXAMPLES[name]!);
              setLines([]);
            }}
          >
            {example === '' && <option value="">Shared snippet</option>}
            {NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <span class="io-play-actions">
          <button type="button" class="io-btn" onClick={share} title="Put the code in the URL and copy the link">Copy link</button>
          <button type="button" class="io-btn" data-primary onClick={run} disabled={running}>
            {running ? 'Running…' : 'Run'} <kbd>⌘↵</kbd>
          </button>
        </span>
      </div>
      <div class="io-play-panes">
        <label class="io-play-editor">
          <span class="io-sr">TypeScript code</span>
          <textarea
            ref={editor}
            value={code}
            spellcheck={false}
            autocapitalize="off"
            autocomplete="off"
            onInput={(e) => setCode((e.target as HTMLTextAreaElement).value)}
            onKeyDown={onKeyDown}
          />
        </label>
        <div class="io-play-out">
          <h4>
            Console {ms !== undefined && !running && <span class="io-play-ms">{ms.toFixed(1)} ms</span>}
          </h4>
          <pre class="io-log" aria-live="polite">
            {lines.length ? lines.map((l, i) => <div key={i} class={`is-${l.tone}`}>{l.text}</div>) : <div class="is-dim">Press Run (or ⌘/Ctrl + Enter).</div>}
          </pre>
        </div>
      </div>
      <p class="io-play-note">
        Types are stripped, not checked, here (Sucrase). The library itself is the real <code>@nodelibraries/ioc</code> source. <code>await using</code> needs a browser
        with explicit resource management (Chrome 134+); elsewhere call <code>await scope.dispose()</code>.
      </p>
    </div>
  );
}
