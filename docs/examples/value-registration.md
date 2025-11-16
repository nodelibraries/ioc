# Value Registration Example

Demonstrates registering pre-created values (JSON objects, primitives, arrays, instances, environment variables).

## Code

```typescript
import { ServiceCollection, ServiceProvider } from '@nodelibraries/ioc';

/**
 * Value Registration Example
 *
 * This example demonstrates registering pre-created values.
 *
 * Features:
 * - JSON objects: Configuration objects, settings
 * - Primitives: Strings, numbers, booleans
 * - Arrays and objects: Pre-defined data structures
 * - Pre-created instances: Already instantiated objects
 * - Environment variables: Runtime configuration
 */

interface IConfig {
  apiUrl: string;
  timeout: number;
  features: {
    enableCache: boolean;
    enableLogging: boolean;
  };
}

interface IAppSettings {
  environment: string;
  version: string;
  debug: boolean;
}

async function main() {
  console.log('=== Value Registration Examples ===\n');

  const services = new ServiceCollection();

  // ============================================
  // 1. JSON Object (Configuration)
  // ============================================
  console.log('--- 1. JSON Object (Configuration) ---');

  const configToken = Symbol('IConfig');
  const configValue: IConfig = {
    apiUrl: 'https://api.example.com',
    timeout: 5000,
    features: {
      enableCache: true,
      enableLogging: true,
    },
  };

  // Register the value directly
  services.addValue<IConfig>(configToken, configValue);

  // ============================================
  // 2. Environment Variables
  // ============================================
  console.log('\n--- 2. Environment Variables ---');

  const settingsToken = Symbol('IAppSettings');
  const settingsValue: IAppSettings = {
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0',
    debug: process.env.DEBUG === 'true',
  };

  services.addValue<IAppSettings>(settingsToken, settingsValue);

  // ============================================
  // 3. String Values (Primitive)
  // ============================================
  console.log('\n--- 3. String Values ---');

  // Register string values
  const apiKeyToken = Symbol('ApiKey');
  services.addValue<string>(apiKeyToken, 'secret-api-key-12345');

  const databaseUrlToken = Symbol('DatabaseUrl');
  services.addValue<string>(databaseUrlToken, 'postgresql://user:pass@localhost:5432/mydb');

  const appNameToken = Symbol('AppName');
  services.addValue<string>(appNameToken, 'My Awesome App');

  // ============================================
  // 4. Other Primitive Values
  // ============================================
  console.log('\n--- 4. Other Primitive Values ---');

  const maxRetriesToken = Symbol('MaxRetries');
  services.addValue<number>(maxRetriesToken, 3);

  const isProductionToken = Symbol('IsProduction');
  services.addValue<boolean>(isProductionToken, false);

  // ============================================
  // 5. Array and Object Literals
  // ============================================
  console.log('\n--- 5. Array and Object Literals ---');

  const allowedOriginsToken = Symbol('AllowedOrigins');
  services.addValue<string[]>(allowedOriginsToken, [
    'http://localhost:3000',
    'https://example.com',
    'https://app.example.com',
  ]);

  const databaseConfigToken = Symbol('DatabaseConfig');
  services.addValue(databaseConfigToken, {
    host: 'localhost',
    port: 5432,
    database: 'mydb',
    username: 'user',
    password: 'pass',
  });

  // ============================================
  // 6. Pre-created Instances
  // ============================================
  console.log('\n--- 6. Pre-created Instances ---');

  class Logger {
    private logs: string[] = [];

    log(message: string) {
      const logEntry = `[${new Date().toISOString()}] ${message}`;
      this.logs.push(logEntry);
      console.log(logEntry);
    }

    getLogs() {
      return this.logs;
    }
  }

  // Register a pre-created instance
  const loggerInstance = new Logger();
  loggerInstance.log('Logger initialized before registration');

  const loggerToken = Symbol('Logger');
  services.addValue<Logger>(loggerToken, loggerInstance);

  // ============================================
  // 7. Values Are Always Singleton
  // ============================================
  console.log('\n--- 7. Values Are Always Singleton ---');

  const counterToken = Symbol('Counter');
  services.addValue<{ count: number }>(counterToken, { count: 0 });

  // ============================================
  // 8. Using String Values with Services
  // ============================================
  console.log('\n--- 8. Using String Values with Services ---');

  interface IUserService {
    getUsers(): string[];
  }

  class UserService implements IUserService {
    constructor(private config: IConfig, private maxRetries: number) {}

    getUsers(): string[] {
      console.log(`Fetching users from ${this.config.apiUrl} with max retries: ${this.maxRetries}`);
      return ['Alice', 'Bob'];
    }
  }

  const userServiceToken = Symbol('IUserService');
  services.addScoped<IUserService>(userServiceToken, UserService, [configToken, maxRetriesToken]);

  // Build provider after ALL value registrations
  const provider = services.buildServiceProvider();

  // Now use the provider
  const config = await provider.getRequiredService<IConfig>(configToken);
  console.log('Config:', JSON.stringify(config, null, 2));
  console.log('API URL:', config.apiUrl);
  console.log('Timeout:', config.timeout);
  console.log('Cache enabled:', config.features.enableCache);

  const settings = await provider.getRequiredService<IAppSettings>(settingsToken);
  console.log('Settings:', JSON.stringify(settings, null, 2));

  // Get string values
  const apiKey = await provider.getRequiredService<string>(apiKeyToken);
  const databaseUrl = await provider.getRequiredService<string>(databaseUrlToken);
  const appName = await provider.getRequiredService<string>(appNameToken);

  console.log('API Key:', apiKey.substring(0, 10) + '...');
  console.log('Database URL:', databaseUrl.replace(/:[^:@]+@/, ':****@')); // Hide password
  console.log('App Name:', appName);

  const maxRetries = await provider.getRequiredService<number>(maxRetriesToken);
  const isProduction = await provider.getRequiredService<boolean>(isProductionToken);

  console.log('Max Retries:', maxRetries);
  console.log('Is Production:', isProduction);

  const origins = await provider.getRequiredService<string[]>(allowedOriginsToken);
  const dbConfig = await provider.getRequiredService<typeof databaseConfigToken>(databaseConfigToken);

  console.log('Allowed Origins:', origins);
  console.log('Database Config:', dbConfig);

  const logger = await provider.getRequiredService<Logger>(loggerToken);
  logger.log('This log is after registration');
  logger.log('Another log entry');

  console.log('Total logs:', logger.getLogs().length);
  console.log('All logs:', logger.getLogs());

  const counter1 = await provider.getRequiredService<{ count: number }>(counterToken);
  counter1.count++;

  const counter2 = await provider.getRequiredService<{ count: number }>(counterToken);
  counter2.count++;

  console.log('Counter 1:', counter1.count);
  console.log('Counter 2:', counter2.count);
  console.log('Same instance?', counter1 === counter2); // true - same instance

  const scope = provider.createScope();
  const userService = await scope.getRequiredService<IUserService>(userServiceToken);
  const users = userService.getUsers();
  console.log('Users:', users);

  await scope.dispose();

  console.log('\n✅ Value registration is working!');
}

main().catch(console.error);
```

## Expected Output

```
=== Value Registration Examples ===

--- 1. JSON Object (Configuration) ---

--- 2. Environment Variables ---

--- 3. String Values ---

--- 4. Other Primitive Values ---

--- 5. Array and Object Literals ---

--- 6. Pre-created Instances ---
[<timestamp>] Logger initialized before registration

--- 7. Values Are Always Singleton ---

--- 8. Using String Values with Services ---
Config: {
  "apiUrl": "https://api.example.com",
  "timeout": 5000,
  "features": {
    "enableCache": true,
    "enableLogging": true
  }
}
API URL: https://api.example.com
Timeout: 5000
Cache enabled: true
Settings: {
  "environment": "development",
  "version": "1.0.0",
  "debug": false
}
API Key: secret-api...
Database URL: postgresql://user:****@localhost:5432/mydb
App Name: My Awesome App
Max Retries: 3
Is Production: false
Allowed Origins: [
  'http://localhost:3000',
  'https://example.com',
  'https://app.example.com'
]
Database Config: {
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  username: 'user',
  password: 'pass'
}
[<timestamp>] This log is after registration
[<timestamp>] Another log entry
Total logs: 3
All logs: [
  '[<timestamp>] Logger initialized before registration',
  '[<timestamp>] This log is after registration',
  '[<timestamp>] Another log entry'
]
Counter 1: 2
Counter 2: 2
Same instance? true
Fetching users from https://api.example.com with max retries: 3
Users: [ 'Alice', 'Bob' ]

✅ Value registration is working!
```

## Run This Example

```bash
npx ts-node examples/6-value-registration.ts
```

## Key Points

- **Pre-created Values**: Register any value directly (no instantiation needed)
- **Configuration**: Perfect for config objects, environment variables
- **Primitives**: Strings, numbers, booleans all supported
- **Always Singleton**: Values are always registered as singletons
- **Dependency Injection**: Values can be injected into services
