import { defineConfig } from 'vitepress';

export default defineConfig({
  title: '@nodelibraries/ioc',
  description: 'Type-Safe IoC Container for Node.js, TypeScript and JavaScript',
  base: '/ioc/',
  lastUpdated: true,
  cleanUrls: true,

  head: [
    [
      'meta',
      {
        name: 'keywords',
        content: 'ioc, dependency injection, typescript, javascript, nodejs, di container, inversion of control',
      },
    ],
    ['meta', { property: 'og:title', content: '@nodelibraries/ioc - Type-Safe IoC Container' }],
    ['meta', { property: 'og:description', content: 'Type-Safe IoC Container for Node.js, TypeScript and JavaScript' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: 'https://nodelibraries.github.io/ioc/' }],
  ],

  themeConfig: {
    search: {
      provider: 'local',
    },

    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'Examples', link: '/examples/' },
      { text: 'API', link: '/api/' },
      { text: 'GitHub', link: 'https://github.com/nodelibraries/ioc' },
      {
        text: '☕ Buy me a coffee',
        link: 'https://buymeacoffee.com/ylcnfrht',
        target: '_blank',
        rel: 'noopener noreferrer',
      },
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
          text: 'Analysis & Visualization',
          items: [
            { text: 'Dependency Tree', link: '/examples/dependency-tree' },
            { text: 'Circular Dependency Detection', link: '/examples/circular-dependency-detection' },
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
      message:
        'Released under the ISC License. If you find this project helpful, consider <a href="https://buymeacoffee.com/ylcnfrht" target="_blank" rel="noopener noreferrer">buying me a coffee</a> ☕',
      copyright: 'Copyright © 2025 nodelibraries | Created by ylcnfrht',
    },
  },
});
