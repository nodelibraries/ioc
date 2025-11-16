# JavaScript Advanced Example

Advanced features in JavaScript - factory pattern, keyed services, multiple implementations, value registration, service checking, and TryAdd pattern.

## Code

```javascript
const { ServiceCollection, ServiceProvider } = require('@nodelibraries/ioc');

// Define services
class Logger {
  log(message) {
    console.log(`[LOG] ${message}`);
  }
}

class FileLogger {
  log(message) {
    console.log(`[FILE] ${message}`);
  }
}

class ConsoleLogger {
  log(message) {
    console.log(`[CONSOLE] ${message}`);
  }
}

class CacheService {
  constructor(logger) {
    this.logger = logger;
    this.cache = new Map();
  }

  get(key) {
    this.logger.log(`Cache get: ${key}`);
    return this.cache.get(key);
  }

  set(key, value) {
    this.logger.log(`Cache set: ${key}`);
    this.cache.set(key, value);
  }
}

// Setup container
const services = new ServiceCollection();

// Create tokens
const ILoggerToken = Symbol('ILogger');
const ICacheToken = Symbol('ICache');
const ILoggerKeyedToken = Symbol('ILoggerKeyed');

// 1. Basic registration
services.addSingleton(ILoggerToken, Logger);

// 2. Factory pattern
services.addSingleton(ICacheToken, async (provider) => {
  const logger = await provider.getRequiredService(ILoggerToken);
  return new CacheService(logger);
});

// 3. Value registration
const config = { apiUrl: 'https://api.example.com', timeout: 5000 };
services.addValue('Config', config);

// 4. Multiple implementations
services.addSingleton(ILoggerKeyedToken, FileLogger);
services.addSingleton(ILoggerKeyedToken, ConsoleLogger);

// 5. Keyed services
services.addKeyedSingleton(ILoggerKeyedToken, FileLogger, 'file');
services.addKeyedSingleton(ILoggerKeyedToken, ConsoleLogger, 'console');

// 6. TryAdd pattern (safe registration)
services.tryAddSingleton(ILoggerToken, FileLogger); // Won't override existing Logger

// Build provider
const provider = services.buildServiceProvider();

// Use services
(async () => {
  try {
    console.log('=== 1. Basic Service Resolution ===');
    const logger = await provider.getRequiredService(ILoggerToken);
    logger.log('Hello from Logger');

    console.log('\n=== 2. Factory Pattern ===');
    const cache = await provider.getRequiredService(ICacheToken);
    cache.set('key1', 'value1');
    console.log('Cache value:', cache.get('key1'));

    console.log('\n=== 3. Value Registration ===');
    const configValue = await provider.getRequiredService('Config');
    console.log('Config:', configValue);

    console.log('\n=== 4. Multiple Implementations ===');
    const loggers = await provider.getServices(ILoggerKeyedToken);
    console.log(`Found ${loggers.length} logger implementations`);
    loggers.forEach((logger, index) => {
      logger.log(`Logger ${index + 1}`);
    });

    console.log('\n=== 5. Keyed Services ===');
    const fileLogger = await provider.getRequiredKeyedService(ILoggerKeyedToken, 'file');
    const consoleLogger = await provider.getRequiredKeyedService(ILoggerKeyedToken, 'console');
    fileLogger.log('File logger message');
    consoleLogger.log('Console logger message');

    console.log('\n=== 6. Service Checking ===');
    console.log('Has Logger?', (await provider.isService(ILoggerToken)) ? 'Yes' : 'No');
    console.log('Has Cache?', (await provider.isService(ICacheToken)) ? 'Yes' : 'No');
    console.log('Has Unknown?', (await provider.isService(Symbol('Unknown'))) ? 'Yes' : 'No');

    console.log('\n=== 7. TryAdd Verification ===');
    // Logger should still be the original Logger, not FileLogger
    const originalLogger = await provider.getRequiredService(ILoggerToken);
    originalLogger.log('This should be from Logger class, not FileLogger');
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
```

## Expected Console Output

```
=== 1. Basic Service Resolution ===
[LOG] Hello from Logger

=== 2. Factory Pattern ===
[LOG] Cache set: key1
[LOG] Cache get: key1
Cache value: value1

=== 3. Value Registration ===
Config: { apiUrl: 'https://api.example.com', timeout: 5000 }

=== 4. Multiple Implementations ===
Found 2 logger implementations
[FILE] Logger 1
[CONSOLE] Logger 2

=== 5. Keyed Services ===
[FILE] File logger message
[CONSOLE] Console logger message

=== 6. Service Checking ===
Has Logger? Yes
Has Cache? Yes
Has Unknown? No

=== 7. TryAdd Verification ===
[LOG] This should be from Logger class, not FileLogger
```

## Run This Example

```bash
node examples/js/js-advanced.js
```

## Key Points

- **All Features Work**: Factory pattern, keyed services, multiple implementations all work in JavaScript
- **No Type Safety**: Must manually ensure correct types
- **Runtime Validation**: Add checks in constructors for safety
- **Same API**: Identical to TypeScript API, just without type annotations
