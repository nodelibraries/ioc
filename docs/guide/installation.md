# Installation

## Prerequisites

- Node.js >= 14.0.0
- TypeScript (recommended)

## Install Package

```bash
npm install @nodelibs/ioc
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
import { ServiceCollection, ServiceProvider } from '@nodelibs/ioc';

const services = new ServiceCollection();
const provider = services.buildServiceProvider();

console.log('@nodelibs/ioc installed successfully!');
```

Run it:

```bash
npx ts-node test.ts
```

If you see "@nodelibs/ioc installed successfully!", you're ready to go!

## Next Steps

- [Quick Start Guide](/guide/quick-start)
- [Service Lifetimes](/guide/service-lifetimes)
