import { defineConfig } from 'vitepress';

export default defineConfig({
  title: '@nodelibraries/ioc',
  description: 'Type-Safe IoC Container for Node.js, TypeScript and JavaScript',
  base: '/ioc/',

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'Examples', link: '/examples/' },
      { text: 'API', link: '/api/' },
      { text: 'GitHub', link: 'https://github.com/nodelibraries/ioc' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'About', link: '/guide/about' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick Start', link: '/guide/quick-start' },
          ],
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Registration', link: '/guide/registration' },
            { text: 'Service Lifetimes', link: '/guide/service-lifetimes' },
            { text: 'Tokens', link: '/guide/tokens' },
            { text: 'Dependency Injection', link: '/guide/dependency-injection' },
          ],
        },
        {
          text: 'Advanced Features',
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
          text: 'Basic Examples',
          items: [
            { text: 'Basic Usage', link: '/examples/basic' },
            { text: 'Interface Registration', link: '/examples/interface-registration' },
            { text: 'String Token', link: '/examples/string-token' },
          ],
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Lifetimes', link: '/examples/lifetimes' },
            { text: 'Lifecycle', link: '/examples/lifecycle' },
            { text: 'Value Registration', link: '/examples/value-registration' },
          ],
        },
        {
          text: 'Advanced Features',
          items: [
            { text: 'Generic Types', link: '/examples/generic-types' },
            { text: 'Factory Pattern', link: '/examples/factory-pattern' },
            { text: 'Multiple Implementations', link: '/examples/multiple-implementations' },
            { text: 'TryAdd Pattern', link: '/examples/tryadd-pattern' },
            { text: 'Keyed Services', link: '/examples/keyed-services' },
            { text: 'Duplicate Registration', link: '/examples/duplicate-registration' },
            { text: 'Scope Validation', link: '/examples/scope-validation' },
          ],
        },
        {
          text: 'Complex Scenarios',
          items: [
            { text: 'Circular Dependency', link: '/examples/circular-dependency' },
            { text: 'Complex Dependency Chain', link: '/examples/complex-dependency-chain' },
          ],
        },
        {
          text: 'Real-World Applications',
          items: [
            { text: 'Service Management', link: '/examples/service-management' },
            { text: 'Express Integration', link: '/examples/express' },
            { text: 'Advanced Express', link: '/examples/express-advanced' },
          ],
        },
        {
          text: 'JavaScript Examples',
          items: [
            { text: 'JavaScript Basic', link: '/examples/js-basic' },
            { text: 'JavaScript Advanced', link: '/examples/js-advanced' },
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

    socialLinks: [{ icon: 'github', link: 'https://github.com/nodelibraries/ioc' }],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 nodelibraries',
    },
  },
});
