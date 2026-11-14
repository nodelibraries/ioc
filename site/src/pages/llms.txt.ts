// llms.txt (https://llmstxt.org): an index of every docs page so coding agents can find the right one.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const sections = ['start', 'concepts', 'guides', 'migration', 'reference'];

export const GET: APIRoute = async ({ site }) => {
  const docs = await getCollection('docs');
  const body = sections
    .map((s) => {
      const items = docs
        .filter((d) => d.id.startsWith(`${s}/`) && !d.data.sidebar?.hidden)
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((d) => `- [${d.data.title}](${new URL(`/${d.id}/`, site)})${d.data.description ? `: ${d.data.description}` : ''}`);
      return `## ${s[0]!.toUpperCase()}${s.slice(1)}\n\n${items.join('\n')}`;
    })
    .join('\n\n');
  const head = `# @ylcnfrht/ioc\n\n> A type-safe IoC container for TypeScript and JavaScript, modeled on .NET's ServiceCollection: singleton, scoped and transient lifetimes, keyed services, lifecycle hooks, circular dependencies and typed errors. Zero dependencies, no decorators.\n\nKey rules: list one dependency token per constructor parameter (\`services.addScoped(UserService, [Logger, Db])\`); use \`createToken<T>('Name')\` for interfaces; every resolution is async (\`await provider.getRequiredService(token)\`); register everything before \`buildServiceProvider()\`; resolve scoped services from \`provider.createScope()\`.\n\nAPI reference: ${new URL('/api/overview/', site)}\nPlayground: ${new URL('/playground/', site)}\n\n`;
  return new Response(head + body + '\n', { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
