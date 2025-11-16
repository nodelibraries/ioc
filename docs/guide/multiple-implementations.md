# Multiple Implementations

Register multiple implementations of the same interface and retrieve all of them.

## Registering Multiple Implementations

```typescript
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

// Register multiple implementations with the same token
const IMessageWriterToken = Symbol('IMessageWriter');
services.addSingleton<IMessageWriter>(IMessageWriterToken, ConsoleWriter);
services.addSingleton<IMessageWriter>(IMessageWriterToken, FileWriter);
services.addSingleton<IMessageWriter>(IMessageWriterToken, EmailWriter);
```

## Getting All Implementations

Use `getServices()` to get all implementations:

```typescript
const allWriters = await provider.getServices<IMessageWriter>(IMessageWriterToken);
allWriters.forEach((writer) => writer.write('Hello!'));
// Output:
// [CONSOLE] Hello!
// [FILE] Hello!
// [EMAIL] Hello!
```

## Getting the Last Registered

Use `getService()` to get the last registered implementation (default):

```typescript
const writer = await provider.getService<IMessageWriter>(IMessageWriterToken);
writer?.write('Hello!');
// Output: [EMAIL] Hello! (last registered)
```

## Using in Services

Use factories to inject all implementations:

```typescript
interface INotificationService {
  notify(message: string): void;
}

class NotificationService implements INotificationService {
  constructor(private writers: IMessageWriter[]) {
    console.log(`Initialized with ${writers.length} writers`);
  }

  notify(message: string): void {
    this.writers.forEach((writer) => writer.write(message));
  }
}

const notificationFactory = async (provider: ServiceProvider) => {
  const writers = await provider.getServices<IMessageWriter>(IMessageWriterToken);
  return new NotificationService(writers);
};

services.addScoped<INotificationService>(INotificationServiceToken, notificationFactory);
```

## Alternative: Different Tokens

For better control, use different tokens:

```typescript
const ConsoleWriterToken = Symbol('ConsoleWriter');
const FileWriterToken = Symbol('FileWriter');
const EmailWriterToken = Symbol('EmailWriter');

services.addSingleton<IMessageWriter>(ConsoleWriterToken, ConsoleWriter);
services.addSingleton<IMessageWriter>(FileWriterToken, FileWriter);
services.addSingleton<IMessageWriter>(EmailWriterToken, EmailWriter);

// Use specific implementation
const consoleWriter = await provider.getRequiredService<IMessageWriter>(ConsoleWriterToken);
```

## Best Practices

1. **Use `getServices()` when you need all implementations** - For notification systems, logging chains, etc.
2. **Use `getService()` when you need the default** - Last registered implementation
3. **Use different tokens for explicit control** - When you need to choose specific implementations
4. **Use factories for complex injection** - When injecting multiple implementations into a service

## Use Cases

- **Notification systems** - Send to multiple channels
- **Logging chains** - Multiple loggers
- **Validation pipelines** - Multiple validators
- **Event handlers** - Multiple handlers for same event

## Next Steps

- [Keyed Services](/guide/keyed-services)
- [Factory Pattern](/guide/factory-pattern)
