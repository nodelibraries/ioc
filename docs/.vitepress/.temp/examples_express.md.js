import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Express Integration Example","description":"","frontmatter":{},"headers":[],"relativePath":"examples/express.md","filePath":"examples/express.md"}');
const _sfc_main = { name: "examples/express.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="express-integration-example" tabindex="-1">Express Integration Example <a class="header-anchor" href="#express-integration-example" aria-label="Permalink to &quot;Express Integration Example&quot;">​</a></h1><p>Complete example of using the IoC container with Express.js - request-scoped services, middleware, and RESTful API.</p><h2 id="code" tabindex="-1">Code <a class="header-anchor" href="#code" aria-label="Permalink to &quot;Code&quot;">​</a></h2><p>See <a href="../../examples/17-express.ts">17-express.ts</a> for the full code.</p><h2 id="expected-output" tabindex="-1">Expected Output <a class="header-anchor" href="#expected-output" aria-label="Permalink to &quot;Expected Output&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>🚀 Express server with IoC Container running on http://localhost:3000</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Available endpoints:</span></span>
<span class="line"><span>  GET  http://localhost:3000/users</span></span>
<span class="line"><span>  GET  http://localhost:3000/users/:id</span></span>
<span class="line"><span>  POST http://localhost:3000/users</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Example POST request:</span></span>
<span class="line"><span>  curl -X POST http://localhost:3000/users \\</span></span>
<span class="line"><span>    -H &quot;Content-Type: application/json&quot; \\</span></span>
<span class="line"><span>    -d &#39;{&quot;name&quot;:&quot;Charlie&quot;,&quot;email&quot;:&quot;charlie@example.com&quot;}&#39;</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Note: When you make requests to the API, you&#39;ll see additional logs from the services.</span></span>
<span class="line"><span>For example, when calling GET /users:</span></span>
<span class="line"><span>  [2025-11-15T23:24:16.440Z] UserRepository initialized</span></span>
<span class="line"><span>  [2025-11-15T23:24:16.441Z] UserService initialized</span></span>
<span class="line"><span>  [2025-11-15T23:24:16.442Z] Repository: Finding all users</span></span>
<span class="line"><span>  [2025-11-15T23:24:16.443Z] Service: Getting all users</span></span></code></pre></div><h2 id="run-this-example" tabindex="-1">Run This Example <a class="header-anchor" href="#run-this-example" aria-label="Permalink to &quot;Run This Example&quot;">​</a></h2><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6A737D", "--shiki-dark": "#6A737D" })}"># First, install Express dependencies</span></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">npm</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> install</span><span style="${ssrRenderStyle({ "--shiki-light": "#005CC5", "--shiki-dark": "#79B8FF" })}"> --save-dev</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> express</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> @types/express</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> ts-node</span></span>
<span class="line"></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6A737D", "--shiki-dark": "#6A737D" })}"># Then run the example</span></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">npx</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> ts-node</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> examples/17-express.ts</span></span></code></pre></div><h2 id="test-the-api" tabindex="-1">Test the API <a class="header-anchor" href="#test-the-api" aria-label="Permalink to &quot;Test the API&quot;">​</a></h2><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6A737D", "--shiki-dark": "#6A737D" })}"># Get all users</span></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">curl</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> http://localhost:3000/users</span></span>
<span class="line"></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6A737D", "--shiki-dark": "#6A737D" })}"># Get user by ID</span></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">curl</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> http://localhost:3000/users/1</span></span>
<span class="line"></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6A737D", "--shiki-dark": "#6A737D" })}"># Create new user</span></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">curl</span><span style="${ssrRenderStyle({ "--shiki-light": "#005CC5", "--shiki-dark": "#79B8FF" })}"> -X</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> POST</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> http://localhost:3000/users</span><span style="${ssrRenderStyle({ "--shiki-light": "#005CC5", "--shiki-dark": "#79B8FF" })}"> \\</span></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#005CC5", "--shiki-dark": "#79B8FF" })}">  -H</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> &quot;Content-Type: application/json&quot;</span><span style="${ssrRenderStyle({ "--shiki-light": "#005CC5", "--shiki-dark": "#79B8FF" })}"> \\</span></span>
<span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#005CC5", "--shiki-dark": "#79B8FF" })}">  -d</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> &#39;{&quot;name&quot;:&quot;Charlie&quot;,&quot;email&quot;:&quot;charlie@example.com&quot;}&#39;</span></span></code></pre></div><h2 id="key-points" tabindex="-1">Key Points <a class="header-anchor" href="#key-points" aria-label="Permalink to &quot;Key Points&quot;">​</a></h2><ul><li><strong>Request-Scoped Services</strong>: Each request gets its own scope</li><li><strong>Middleware</strong>: Create scoped container per request</li><li><strong>Dependency Injection</strong>: Services are injected into route handlers</li><li><strong>Lifecycle Management</strong>: Scopes are disposed after request completes</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("examples/express.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const express = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  express as default
};
