import { defineConfig } from 'vitepress';

export default defineConfig({
  title: '@nodelibs/ioc',
  description: 'Type-Safe IoC Container for Node.js and TypeScript',
  base: '/ioc/',

  // Enable search
  themeConfig: {
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: 'Search',
            buttonAriaLabel: 'Search documentation',
          },
          modal: {
            noResultsText: 'No results found',
            resetButtonTitle: 'Reset search',
            footer: {
              selectText: 'to select',
              navigateText: 'to navigate',
              closeText: 'to close',
            },
          },
        },
      },
    },

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'Examples', link: '/examples/' },
      { text: 'API', link: '/api/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick Start', link: '/guide/quick-start' },
          ],
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Dependency Injection', link: '/guide/dependency-injection' },
            { text: 'Registration', link: '/guide/registration' },
            { text: 'Service Lifetimes', link: '/guide/service-lifetimes' },
            { text: 'Tokens', link: '/guide/tokens' },
          ],
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Factory Pattern', link: '/guide/factory-pattern' },
            { text: 'Multiple Implementations', link: '/guide/multiple-implementations' },
            { text: 'Keyed Services', link: '/guide/keyed-services' },
            { text: 'Lifecycle Hooks', link: '/guide/lifecycle-hooks' },
            { text: 'Scope Validation', link: '/guide/scope-validation' },
            { text: 'Circular Dependencies', link: '/guide/circular-dependencies' },
          ],
        },
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Overview', link: '/examples/' },
            { text: '1. Basic', link: '/examples/basic' },
            { text: '2. Interface Registration', link: '/examples/interface-registration' },
            { text: '3. String Token', link: '/examples/string-token' },
            { text: '4. Lifetimes', link: '/examples/lifetimes' },
            { text: '5. Lifecycle', link: '/examples/lifecycle' },
            { text: '6. Value Registration', link: '/examples/value-registration' },
            { text: '7. Generic Types', link: '/examples/generic-types' },
            { text: '8. Factory Pattern', link: '/examples/factory-pattern' },
            { text: '9. Multiple Implementations', link: '/examples/multiple-implementations' },
            { text: '10. TryAdd Pattern', link: '/examples/tryadd-pattern' },
            { text: '11. Keyed Services', link: '/examples/keyed-services' },
            { text: '12. Duplicate Registration', link: '/examples/duplicate-registration' },
            { text: '13. Scope Validation', link: '/examples/scope-validation' },
            { text: '14. Circular Dependency', link: '/examples/circular-dependency' },
            { text: '15. Complex Dependency Chain', link: '/examples/complex-dependency-chain' },
            { text: '16. Service Management', link: '/examples/service-management' },
            { text: '17. Express Integration', link: '/examples/express' },
            { text: '18. Advanced Express', link: '/examples/express-advanced' },
          ],
        },
        {
          text: 'JavaScript Examples',
          items: [
            { text: 'JS Basic', link: '/examples/js-basic' },
            { text: 'JS Advanced', link: '/examples/js-advanced' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'ServiceCollection', link: '/api/service-collection' },
            { text: 'ServiceProvider', link: '/api/service-provider' },
            { text: 'Types', link: '/api/types' },
          ],
        },
      ],
    },
  },
});
