# Installation

## Prerequisites

- Node.js >= 18.0.0 (LTS recommended)
- TypeScript (recommended, but not required - works with JavaScript too)

## Install Package

```bash
npm install @nodelibraries/ioc
```

## TypeScript Configuration

Add the following to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "esModuleInterop": true,
    "strict": true
  }
}
```

## Verify Installation

Create a simple test file:

```typescript
import { ServiceCollection, ServiceProvider } from '@nodelibraries/ioc';

const services = new ServiceCollection();
const provider = services.buildServiceProvider();

console.log('@nodelibraries/ioc installed successfully!');
```

Run it:

```bash
npx ts-node test.ts
```

If you see "@nodelibraries/ioc installed successfully!", you're ready to go!

## Next Steps

- [Quick Start Guide](/guide/quick-start)
- [Service Lifetimes](/guide/service-lifetimes)
