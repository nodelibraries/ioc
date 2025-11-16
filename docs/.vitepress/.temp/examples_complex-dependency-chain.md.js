import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Complex Dependency Chain Example","description":"","frontmatter":{},"headers":[],"relativePath":"examples/complex-dependency-chain.md","filePath":"examples/complex-dependency-chain.md"}');
const _sfc_main = { name: "examples/complex-dependency-chain.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="complex-dependency-chain-example" tabindex="-1">Complex Dependency Chain Example <a class="header-anchor" href="#complex-dependency-chain-example" aria-label="Permalink to &quot;Complex Dependency Chain Example&quot;">​</a></h1><p>Demonstrates a complex dependency chain: ServiceA -&gt; ServiceB -&gt; ServiceC -&gt; ServiceD, ServiceE with different lifetimes.</p><h2 id="code" tabindex="-1">Code <a class="header-anchor" href="#code" aria-label="Permalink to &quot;Code&quot;">​</a></h2><p>See <a href="../../examples/15-complex-dependency-chain.ts">15-complex-dependency-chain.ts</a> for the full code.</p><h2 id="expected-output" tabindex="-1">Expected Output <a class="header-anchor" href="#expected-output" aria-label="Permalink to &quot;Expected Output&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>=== Complex Dependency Chain Example ===</span></span>
<span class="line"><span></span></span>
<span class="line"><span>--- Resolving ServiceA (top of chain) ---</span></span>
<span class="line"><span></span></span>
<span class="line"><span>[ServiceC] Initialized with ServiceD and ServiceE</span></span>
<span class="line"><span>[ServiceB] Initialized with ServiceC</span></span>
<span class="line"><span>[ServiceA] Initialized with ServiceB</span></span>
<span class="line"><span></span></span>
<span class="line"><span>--- Verifying Dependency Chain ---</span></span>
<span class="line"><span></span></span>
<span class="line"><span>ServiceA name: ServiceA</span></span>
<span class="line"><span>ServiceB name: ServiceB</span></span>
<span class="line"><span>ServiceC name: ServiceC</span></span>
<span class="line"><span>ServiceD name: ServiceD</span></span>
<span class="line"><span>ServiceE name: ServiceE</span></span>
<span class="line"><span></span></span>
<span class="line"><span>--- Testing Singleton Behavior ---</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Same ServiceA instance? true</span></span>
<span class="line"><span>Same ServiceD instance? true</span></span>
<span class="line"><span>Same ServiceE instance? true</span></span>
<span class="line"><span></span></span>
<span class="line"><span>--- Testing Scoped Services ---</span></span>
<span class="line"><span></span></span>
<span class="line"><span>[ServiceC] Initialized with ServiceD and ServiceE</span></span>
<span class="line"><span>[ServiceB] Initialized with ServiceC</span></span>
<span class="line"><span>[ServiceA] Initialized with ServiceB</span></span>
<span class="line"><span>[ServiceC] Initialized with ServiceD and ServiceE</span></span>
<span class="line"><span>[ServiceB] Initialized with ServiceC</span></span>
<span class="line"><span>[ServiceA] Initialized with ServiceB</span></span>
<span class="line"><span>Different scopes, different ServiceA? true</span></span>
<span class="line"><span>Scope1 ServiceA name: ServiceA</span></span>
<span class="line"><span>Scope2 ServiceA name: ServiceA</span></span>
<span class="line"><span>Same scope, same ServiceB? true</span></span>
<span class="line"><span></span></span>
<span class="line"><span>--- Testing Shared Dependencies (ServiceC used in multiple places) ---</span></span>
<span class="line"><span></span></span>
<span class="line"><span>[ServiceC] Initialized with ServiceD and ServiceE</span></span>
<span class="line"><span>[ServiceB] Initialized with ServiceC</span></span>
<span class="line"><span>[ServiceA] Initialized with ServiceB</span></span>
<span class="line"><span>[ServiceF] Initialized with ServiceC</span></span>
<span class="line"><span>ServiceC from ServiceA chain: ServiceC</span></span>
<span class="line"><span>ServiceC from ServiceF: ServiceC</span></span>
<span class="line"><span>Same ServiceC instance? true</span></span>
<span class="line"><span></span></span>
<span class="line"><span>--- Testing Transient Services ---</span></span>
<span class="line"><span></span></span>
<span class="line"><span>[ServiceC] Initialized with ServiceD and ServiceE</span></span>
<span class="line"><span>[ServiceB] Initialized with ServiceC</span></span>
<span class="line"><span>[ServiceA] Initialized with ServiceB</span></span>
<span class="line"><span>[ServiceC] Initialized with ServiceD and ServiceE</span></span>
<span class="line"><span>[ServiceB] Initialized with ServiceC</span></span>
<span class="line"><span>[ServiceA] Initialized with ServiceB</span></span>
<span class="line"><span>Different ServiceA instances? true</span></span>
<span class="line"><span>TransientA1 name: ServiceA</span></span>
<span class="line"><span>TransientA2 name: ServiceA</span></span>
<span class="line"><span></span></span>
<span class="line"><span>✅ Complex dependency chain is working correctly!</span></span></code></pre></div><h2 id="run-this-example" tabindex="-1">Run This Example <a class="header-anchor" href="#run-this-example" aria-label="Permalink to &quot;Run This Example&quot;">​</a></h2><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">npx</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> ts-node</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> examples/15-complex-dependency-chain.ts</span></span></code></pre></div><h2 id="key-points" tabindex="-1">Key Points <a class="header-anchor" href="#key-points" aria-label="Permalink to &quot;Key Points&quot;">​</a></h2><ul><li><strong>Deep Chains</strong>: Supports deep dependency chains (ServiceA -&gt; ServiceB -&gt; ServiceC -&gt; ServiceD, ServiceE)</li><li><strong>Multiple Dependencies</strong>: ServiceC depends on both ServiceD and ServiceE</li><li><strong>Shared Dependencies</strong>: Same service used in multiple places (ServiceC in ServiceB and ServiceF)</li><li><strong>All Lifetimes</strong>: Works with Singleton, Scoped, and Transient lifetimes</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("examples/complex-dependency-chain.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const complexDependencyChain = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  complexDependencyChain as default
};
