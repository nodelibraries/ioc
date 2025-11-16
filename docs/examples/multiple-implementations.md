# Multiple Implementations Example

Shows how to register and retrieve multiple implementations of the same interface using `getServices()`.

## Code

```typescript
import { ServiceCollection, ServiceProvider } from '@nodelibraries/ioc';

/**
 * Multiple Implementations Example
 *
 * This example shows how to register and retrieve multiple implementations.
 *
 * Features:
 * - Same token, multiple implementations: Register multiple services with same token
 * - getServices(): Retrieve all implementations of an interface
 * - getService(): Get the last registered implementation (default)
 * - Factory pattern: Use factories to inject all implementations into a service
 */

interface IMessageWriter {
  write(message: string): void;
}

class ConsoleWriter implements IMessageWriter {
  write(message: string) {
    console.log(`[CONSOLE] ${message}`);
  }
}

class FileWriter implements IMessageWriter {
  write(message: string) {
    console.log(`[FILE] ${message}`);
  }
}

class EmailWriter implements IMessageWriter {
  write(message: string) {
    console.log(`[EMAIL] ${message}`);
  }
}

async function main() {
  console.log('=== Multiple Implementations Examples ===\n');

  const services = new ServiceCollection();
  const IMessageWriterToken = Symbol('IMessageWriter');

  // ============================================
  // 1. Multiple Implementations with Same Interface
  // ============================================
  console.log('--- 1. Multiple Implementations ---');

  // Register each implementation with the same token
  services.addSingleton<IMessageWriter>(IMessageWriterToken, ConsoleWriter);
  services.addSingleton<IMessageWriter>(IMessageWriterToken, FileWriter);
  services.addSingleton<IMessageWriter>(IMessageWriterToken, EmailWriter);

  const provider = services.buildServiceProvider();

  // Get all implementations
  const writers = await provider.getServices<IMessageWriter>(IMessageWriterToken);

  console.log(`Total writers: ${writers.length}`);
  writers.forEach((writer, index) => {
    console.log(`Writer ${index + 1}:`);
    writer.write('Hello from multiple implementations!');
  });

  // ============================================
  // 2. Using All Implementations in Service
  // ============================================
  console.log('\n--- 2. Service with Multiple Implementations ---');

  interface INotificationService {
    notify(message: string): void;
  }

  class NotificationService implements INotificationService {
    constructor(private writers: IMessageWriter[]) {
      console.log(`NotificationService initialized with ${writers.length} writers`);
    }

    notify(message: string): void {
      console.log(`\nSending notification: "${message}"`);
      this.writers.forEach((writer) => {
        writer.write(message);
      });
    }
  }

  const INotificationServiceToken = Symbol('INotificationService');

  // Solution using factory
  const notificationFactory = async (provider: ServiceProvider) => {
    const writers = await provider.getServices<IMessageWriter>(IMessageWriterToken);
    return new NotificationService(writers);
  };

  services.addScoped<INotificationService>(INotificationServiceToken, notificationFactory);

  const scope = provider.createScope();
  const notificationService = await scope.getRequiredService<INotificationService>(INotificationServiceToken);
  notificationService.notify('Important update!');

  await scope.dispose();

  // ============================================
  // 3. Last Registration (Last Registration Wins)
  // ============================================
  console.log('\n--- 3. Last Registration Wins ---');

  // getService() returns the last registration
  const lastWriter = await provider.getService<IMessageWriter>(IMessageWriterToken);
  console.log('\nLast registered writer (getService):');
  lastWriter?.write('This is the last registered writer');

  // getServices() returns all registrations
  const allWriters = await provider.getServices<IMessageWriter>(IMessageWriterToken);
  console.log(`\nAll registered writers (getServices): ${allWriters.length}`);

  // ============================================
  // 4. Using Different Tokens (Recommended)
  // ============================================
  console.log('\n--- 4. Using Different Tokens (Recommended) ---');

  const services2 = new ServiceCollection();
  const ConsoleWriterToken = Symbol('ConsoleWriter');
  const FileWriterToken = Symbol('FileWriter');
  const EmailWriterToken = Symbol('EmailWriter');

  services2.addSingleton<IMessageWriter>(ConsoleWriterToken, ConsoleWriter);
  services2.addSingleton<IMessageWriter>(FileWriterToken, FileWriter);
  services2.addSingleton<IMessageWriter>(EmailWriterToken, EmailWriter);

  const provider2 = services2.buildServiceProvider();

  const consoleWriter = await provider2.getRequiredService<IMessageWriter>(ConsoleWriterToken);
  const fileWriter = await provider2.getRequiredService<IMessageWriter>(FileWriterToken);
  const emailWriter = await provider2.getRequiredService<IMessageWriter>(EmailWriterToken);

  console.log('Using different tokens:');
  consoleWriter.write('Console message');
  fileWriter.write('File message');
  emailWriter.write('Email message');

  console.log('\n✅ Multiple implementations are working!');
}

main().catch(console.error);
```

## Expected Output

```
=== Multiple Implementations Examples ===

--- 1. Multiple Implementations ---
Total writers: 3
Writer 1:
[CONSOLE] Hello from multiple implementations!
Writer 2:
[FILE] Hello from multiple implementations!
Writer 3:
[EMAIL] Hello from multiple implementations!

--- 2. Service with Multiple Implementations ---
NotificationService initialized with 3 writers

Sending notification: "Important update!"
[CONSOLE] Important update!
[FILE] Important update!
[EMAIL] Important update!

--- 3. Last Registration Wins ---

Last registered writer (getService):
[EMAIL] This is the last registered writer

All registered writers (getServices): 3

--- 4. Using Different Tokens (Recommended) ---
Using different tokens:
[CONSOLE] Console message
[FILE] File message
[EMAIL] Email message

✅ Multiple implementations are working!
```

## Run This Example

```bash
npx ts-node examples/9-multiple-implementations.ts
```

## Key Points

- **Same Token, Multiple Implementations**: Register multiple services with the same token
- **getServices()**: Retrieve all implementations of an interface
- **getService()**: Returns the last registered implementation
- **Factory Pattern**: Use factories to inject all implementations into a service
