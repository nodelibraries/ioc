import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Service Management Example","description":"","frontmatter":{},"headers":[],"relativePath":"examples/service-management.md","filePath":"examples/service-management.md"}');
const _sfc_main = { name: "examples/service-management.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="service-management-example" tabindex="-1">Service Management Example <a class="header-anchor" href="#service-management-example" aria-label="Permalink to &quot;Service Management Example&quot;">​</a></h1><p>Demonstrates service management features - <code>Remove/RemoveAll()</code> methods for dynamic service management.</p><h2 id="code" tabindex="-1">Code <a class="header-anchor" href="#code" aria-label="Permalink to &quot;Code&quot;">​</a></h2><p>See <a href="../../examples/16-service-management.ts">16-service-management.ts</a> for the full code.</p><h2 id="expected-output" tabindex="-1">Expected Output <a class="header-anchor" href="#expected-output" aria-label="Permalink to &quot;Expected Output&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>=== Service Management Example ===</span></span>
<span class="line"><span></span></span>
<span class="line"><span>--- 1. Remove/RemoveAll() - Remove Services ---</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Logger exists? true</span></span>
<span class="line"><span>Cache exists? true</span></span>
<span class="line"><span>Config exists? true</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Logger exists after remove? false</span></span>
<span class="line"><span>Cache exists after remove? true</span></span>
<span class="line"><span>Config exists after remove? true</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Cache exists after removeAll? false</span></span>
<span class="line"><span>Config exists after removeAll? true</span></span>
<span class="line"><span></span></span>
<span class="line"><span>--- 2. Test Scenario - Mock Replacement ---</span></span>
<span class="line"><span></span></span>
<span class="line"><span>[CONSOLE] This is from mock logger</span></span>
<span class="line"><span></span></span>
<span class="line"><span>--- 3. Dynamic Service Management ---</span></span>
<span class="line"><span></span></span>
<span class="line"><span>[LOG] Dynamic logger</span></span>
<span class="line"><span></span></span>
<span class="line"><span>--- 4. Service Cleanup Pattern ---</span></span>
<span class="line"><span></span></span>
<span class="line"><span>Before cleanup:</span></span>
<span class="line"><span>  Logger: true</span></span>
<span class="line"><span>  Cache: true</span></span>
<span class="line"><span>  Config: true</span></span>
<span class="line"><span></span></span>
<span class="line"><span>After cleanup:</span></span>
<span class="line"><span>  Logger: false</span></span>
<span class="line"><span>  Cache: false</span></span>
<span class="line"><span>  Config: false</span></span>
<span class="line"><span></span></span>
<span class="line"><span>✅ Service management features are working!</span></span>
<span class="line"><span></span></span>
<span class="line"><span>📌 Use Cases:</span></span>
<span class="line"><span>  - Test scenarios (replace with mocks)</span></span>
<span class="line"><span>  - Dynamic service configuration</span></span>
<span class="line"><span>  - Service cleanup and reconfiguration</span></span>
<span class="line"><span>  - Conditional service registration</span></span></code></pre></div><h2 id="run-this-example" tabindex="-1">Run This Example <a class="header-anchor" href="#run-this-example" aria-label="Permalink to &quot;Run This Example&quot;">​</a></h2><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${ssrRenderStyle({ "--shiki-light": "#6F42C1", "--shiki-dark": "#B392F0" })}">npx</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> ts-node</span><span style="${ssrRenderStyle({ "--shiki-light": "#032F62", "--shiki-dark": "#9ECBFF" })}"> examples/16-service-management.ts</span></span></code></pre></div><h2 id="key-points" tabindex="-1">Key Points <a class="header-anchor" href="#key-points" aria-label="Permalink to &quot;Key Points&quot;">​</a></h2><ul><li><strong>Remove/RemoveAll()</strong>: Remove services from collection</li><li><strong>Dynamic Management</strong>: Conditionally add/remove services</li><li><strong>Test Scenarios</strong>: Replace services with mocks for testing</li><li><strong>Service Cleanup</strong>: Remove services when no longer needed</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("examples/service-management.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const serviceManagement = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  serviceManagement as default
};
