import { defineConfig } from 'vitepress';

export default defineConfig({
  title: '@nodelibraries/ioc',
  description: 'A lightweight, type-safe Inversion of Control (IoC) container for Node.js and TypeScript',
  // Update this to match your GitHub repository name
  // If your repo is 'node-ioc-container', use '/node-ioc-container/'
  // If your repo is 'ioc-container', use '/ioc-container/'
  // For root domain, use '/'
  base: '/node-ioc-container/',
  ignoreDeadLinks: true, // Allow links to external examples
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/' },
      { text: 'Examples', link: '/examples/' },
      { text: 'GitHub', link: 'https://github.com/ylcnfrht/node-ioc-container' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'About', link: '/guide/about' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick Start', link: '/guide/quick-start' },
          ],
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Service Lifetimes', link: '/guide/service-lifetimes' },
            { text: 'Registration', link: '/guide/registration' },
            { text: 'Dependency Injection', link: '/guide/dependency-injection' },
            { text: 'Circular Dependencies', link: '/guide/circular-dependencies' },
            { text: 'Tokens', link: '/guide/tokens' },
          ],
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Factory Pattern', link: '/guide/factory-pattern' },
            { text: 'Multiple Implementations', link: '/guide/multiple-implementations' },
            { text: 'Keyed Services', link: '/guide/keyed-services' },
            { text: 'Scope Validation', link: '/guide/scope-validation' },
            { text: 'Lifecycle Hooks', link: '/guide/lifecycle-hooks' },
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
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Overview', link: '/examples/' },
            { text: 'Basic Usage', link: '/examples/basic' },
            { text: 'Service Lifetimes', link: '/examples/lifetimes' },
            { text: 'Factory Pattern', link: '/examples/factory-pattern' },
            { text: 'Express Integration', link: '/examples/express' },
          ],
        },
      ],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/ylcnfrht/node-ioc-container' }],
    footer: {
      message: 'Released under the ISC License.',
      copyright: 'Copyright © 2025',
    },
  },
});
