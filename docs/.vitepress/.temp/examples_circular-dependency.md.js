import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Circular Dependency Example","description":"","frontmatter":{},"headers":[],"relativePath":"examples/circular-dependency.md","filePath":"examples/circular-dependency.md"}');
const _sfc_main = { name: "examples/circular-dependency.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="circular-dependency-example" tabindex="-1">Circular Dependency Example <a class="header-anchor" href="#circular-dependency-example" aria-label="Permalink to &quot;Circular Dependency Example&quot;">​</a></h1><p>Demonstrates circular dependency resolution - singleton, scoped, and transient circular dependencies are all supported.</p><h2 id="code" tabindex="-1">Code <a class="header-anchor" href="#code" aria-label="Permalink to &quot;Code&quot;">​</a></h2><p>See <a href="../../examples/14-circular-dependency.ts">14-circular-dependency.ts</a> for the full code.</p><h2 id="expected-output" tabindex="-1">Expected Output <a class="header-anchor" href="#expected-output" aria-label="Permalink to &quot;Expected Output&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>=== Testing Singleton Circular Dependency ===</span></span>
<span class="line"><span></span></span>
<span class="line"><span>✅ Circular dependency resolved successfully!</span></span>
<span class="line"><span>ServiceA name: ServiceA</span></span>
<span class="line"><span>ServiceB name: ServiceB</span></span>
<span class="line"><span>ServiceA -&gt; ServiceB name: ServiceB</span></span>
<span class="line"><span>ServiceB -&gt; ServiceA name: ServiceA</span></span>
<span class="line"><span>Same ServiceA instance? true</span></span>
<span class="line"><span>Same ServiceB instance? true</span></span>
<span class="line"><span></span></span>
<span class="line"><span>=== Testing Scoped Circular Dependency ===</span></span>
<span class="line"><span></span></span>
<span class="line"><span>✅ Circular dependency resolved successfully in scope!</span></span>
<span class="line"><span>ServiceA name: ServiceA</span></span>
<span class="line"><span>ServiceB name: ServiceB</span></span>
<span class="line"><span>ServiceA -&gt; ServiceB name: ServiceB</span></span>
<span class="line"><span>ServiceB -&gt; ServiceA name: ServiceA</span></span>
<span class="line"><span>Same ServiceA instance in scope? true</span></span>
<span class="line"><span>Same ServiceB instance in scope? true</span></span>
<span class="line"><span></span></span>
<span class="line"><span>=== Testing Transient Circular Dependency ===</span></span>
<span class="line"><span></span></span>
<span class="line"><span>✅ Circular dependency resolved successfully for transient services!</span></span>
<span class="line"><span>ServiceA1 name: ServiceA</span></span>
<span class="line"><span>ServiceB1 name: ServiceB</span></span>
<span class="line"><span>ServiceA1 -&gt; ServiceB1 name: ServiceB</span></span>
<span class="line"><span>ServiceB1 -&gt; ServiceA1 name: ServiceA</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Transient behavior check:</span></span>
<span class="line"><span>serviceA1 === serviceA2? false</span></span>
<span class="line"><span>serviceB1 === serviceB2? false</span></span>
<span class="line"><span>But within same resolution:</span></span>
<span class="line"><span>serviceA1.getServiceBName() works: ServiceB</span></span>
<span class="line"><span>serviceB1.getServiceAName() works: ServiceA</span></span>
<span class="line"><span></span></span>
<span class="line"><span>=== Detailed Circular Dependency Test ===</span></span>
<span class="line"><span></span></span>
<span class="line"><span>✅ Detailed test passed!</span></span>
<span class="line"><span>serviceA === serviceAFromB? true</span></span>
<span class="line"><span>serviceB === serviceBFromA? true</span></span>
<span class="line"><span>serviceA === serviceB.serviceA? true</span></span>
<span class="line"><span>serviceB === serviceA.serviceB? true</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Circular reference verification:</span></span>
<span class="line"><span>serviceA -&gt; serviceB -&gt; serviceA: true</span></span>
<span class="line"><span>serviceB -&gt; serviceA -&gt; serviceB: true</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Method calls work correctly:</span></span>
<span class="line"><span>serviceA.getServiceBName(): ServiceB</span></span>
<span class="line"><span>serviceB.getServiceAName(): ServiceA</span></span>
<span class="line"><span>serviceAFromB.getServiceBName(): ServiceB</span></span>
<span class="line"><span>serviceBFromA.getServiceAName(): ServiceA</span></span></code></pre></div><h2 id="run-this-example" tabindex="-1">Run This Example <a class="header-anchor" href="#run-this-example" aria-label="Permalink to &quot;Run This Example&quot;">​</a></h2><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">npx</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> ts-node</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> examples/14-circular-dependency.ts</span></span></code></pre></div><h2 id="key-points" tabindex="-1">Key Points <a class="header-anchor" href="#key-points" aria-label="Permalink to &quot;Key Points&quot;">​</a></h2><ul><li><strong>Full Support</strong>: Singleton, Scoped, and Transient circular dependencies all work</li><li><strong>Automatic Resolution</strong>: Container automatically handles circular references</li><li><strong>Instance Verification</strong>: Circular references are correctly established</li><li><strong>Method Calls</strong>: All method calls work correctly with circular dependencies</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("examples/circular-dependency.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const circularDependency = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  circularDependency as default
};
