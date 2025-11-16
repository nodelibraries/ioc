import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Advanced Express Integration Example","description":"","frontmatter":{},"headers":[],"relativePath":"examples/express-advanced.md","filePath":"examples/express-advanced.md"}');
const _sfc_main = { name: "examples/express-advanced.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="advanced-express-integration-example" tabindex="-1">Advanced Express Integration Example <a class="header-anchor" href="#advanced-express-integration-example" aria-label="Permalink to &quot;Advanced Express Integration Example&quot;">​</a></h1><p>More complex Express.js application with multiple services, middleware, authentication, error handling, and request context.</p><h2 id="code" tabindex="-1">Code <a class="header-anchor" href="#code" aria-label="Permalink to &quot;Code&quot;">​</a></h2><p>See <a href="../../examples/18-express-advanced.ts">18-express-advanced.ts</a> for the full code.</p><h2 id="expected-output" tabindex="-1">Expected Output <a class="header-anchor" href="#expected-output" aria-label="Permalink to &quot;Expected Output&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>=== Advanced Express Integration Example ===</span></span>
<span class="line"><span></span></span>
<span class="line"><span>[INFO] &lt;timestamp&gt; - Config initialized</span></span>
<span class="line"><span>[INFO] &lt;timestamp&gt; - Logger initialized</span></span>
<span class="line"><span>[INFO] &lt;timestamp&gt; - AuthService initialized</span></span>
<span class="line"><span>[INFO] &lt;timestamp&gt; - UserRepository initialized</span></span>
<span class="line"><span>[INFO] &lt;timestamp&gt; - UserService initialized</span></span>
<span class="line"><span></span></span>
<span class="line"><span>🚀 Server running on http://localhost:3000</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Available endpoints:</span></span>
<span class="line"><span>  GET  /health              - Health check</span></span>
<span class="line"><span>  GET  /users               - Get all users</span></span>
<span class="line"><span>  GET  /users/:id           - Get user by ID</span></span>
<span class="line"><span>  POST /users               - Create user (requires auth)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Test with:</span></span>
<span class="line"><span>  curl http://localhost:3000/health</span></span>
<span class="line"><span>  curl http://localhost:3000/users</span></span>
<span class="line"><span>  curl http://localhost:3000/users/1</span></span>
<span class="line"><span>  curl -X POST http://localhost:3000/users \\</span></span>
<span class="line"><span>       -H &quot;Authorization: valid-token&quot; \\</span></span>
<span class="line"><span>       -H &quot;Content-Type: application/json&quot; \\</span></span>
<span class="line"><span>       -d &#39;{&quot;name&quot;:&quot;David&quot;,&quot;email&quot;:&quot;david@example.com}&#39;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Press Ctrl+C to stop the server</span></span>
<span class="line"><span></span></span>
<span class="line"><span>[INFO] &lt;timestamp&gt; - Request started: GET /health [req-...]</span></span>
<span class="line"><span>[INFO] &lt;timestamp&gt; - Request finished: GET /health [req-...] - &lt;duration&gt;ms</span></span>
<span class="line"><span></span></span>
<span class="line"><span>[INFO] &lt;timestamp&gt; - Request started: GET /users [req-...]</span></span>
<span class="line"><span>[INFO] &lt;timestamp&gt; - UserRepository initialized</span></span>
<span class="line"><span>[INFO] &lt;timestamp&gt; - UserService initialized</span></span>
<span class="line"><span>[INFO] &lt;timestamp&gt; - Fetching all users [req-...]</span></span>
<span class="line"><span>[INFO] &lt;timestamp&gt; - Finding all users</span></span>
<span class="line"><span>[INFO] &lt;timestamp&gt; - Request finished: GET /users [req-...] - &lt;duration&gt;ms</span></span></code></pre></div><h2 id="run-this-example" tabindex="-1">Run This Example <a class="header-anchor" href="#run-this-example" aria-label="Permalink to &quot;Run This Example&quot;">​</a></h2><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6A737D", "--shiki-dark": "#6A737D" })}"># First, install Express dependencies</span></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">npm</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> install</span><span style="${ssrRenderStyle({ "--shiki-light": "#005CC5", "--shiki-dark": "#79B8FF" })}"> --save-dev</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> express</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> @types/express</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> ts-node</span></span>
<span class="line"></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6A737D", "--shiki-dark": "#6A737D" })}"># Then run the example</span></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">npx</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> ts-node</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> examples/18-express-advanced.ts</span></span></code></pre></div><h2 id="test-the-api" tabindex="-1">Test the API <a class="header-anchor" href="#test-the-api" aria-label="Permalink to &quot;Test the API&quot;">​</a></h2><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6A737D", "--shiki-dark": "#6A737D" })}"># Health check</span></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">curl</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> http://localhost:3000/health</span></span>
<span class="line"></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6A737D", "--shiki-dark": "#6A737D" })}"># Get all users</span></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">curl</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> http://localhost:3000/users</span></span>
<span class="line"></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6A737D", "--shiki-dark": "#6A737D" })}"># Get user by ID</span></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">curl</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> http://localhost:3000/users/1</span></span>
<span class="line"></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6A737D", "--shiki-dark": "#6A737D" })}"># Create user (requires authentication)</span></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">curl</span><span style="${ssrRenderStyle({ "--shiki-light": "#005CC5", "--shiki-dark": "#79B8FF" })}"> -X</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> POST</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> http://localhost:3000/users</span><span style="${ssrRenderStyle({ "--shiki-light": "#005CC5", "--shiki-dark": "#79B8FF" })}"> \\</span></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#005CC5", "--shiki-dark": "#79B8FF" })}">  -H</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> &quot;Authorization: valid-token&quot;</span><span style="${ssrRenderStyle({ "--shiki-light": "#005CC5", "--shiki-dark": "#79B8FF" })}"> \\</span></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#005CC5", "--shiki-dark": "#79B8FF" })}">  -H</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> &quot;Content-Type: application/json&quot;</span><span style="${ssrRenderStyle({ "--shiki-light": "#005CC5", "--shiki-dark": "#79B8FF" })}"> \\</span></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#005CC5", "--shiki-dark": "#79B8FF" })}">  -d</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> &#39;{&quot;name&quot;:&quot;David&quot;,&quot;email&quot;:&quot;david@example.com&quot;}&#39;</span></span></code></pre></div><h2 id="key-points" tabindex="-1">Key Points <a class="header-anchor" href="#key-points" aria-label="Permalink to &quot;Key Points&quot;">​</a></h2><ul><li><strong>Multiple Services</strong>: Complex service dependencies</li><li><strong>Request Context</strong>: Request-scoped context with request ID and timing</li><li><strong>Authentication Middleware</strong>: Token-based authentication</li><li><strong>Error Handling</strong>: Centralized error handling with dependency injection</li><li><strong>Logging</strong>: Request logging with timing information</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("examples/express-advanced.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const expressAdvanced = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  expressAdvanced as default
};
