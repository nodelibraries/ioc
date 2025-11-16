# Factory Pattern Example

Demonstrates factory pattern for service creation - factory functions, async initialization, conditional logic, and complex object creation.

## Code

```typescript
import { ServiceCollection, ServiceProvider, ServiceFactory } from '@nodelibraries/ioc';

/**
 * Factory Pattern Example
 *
 * This example demonstrates factory pattern for service creation.
 *
 * Features:
 * - Factory functions: Create services with complex initialization logic
 * - Async factories: Support for asynchronous service initialization
 * - Conditional logic: Choose implementation based on configuration
 * - Multiple dependencies: Factory functions receive ServiceProvider for dependency resolution
 */

interface IConfig {
  apiUrl: string;
  timeout: number;
}

interface IHttpClient {
  get(url: string): Promise<any>;
}

class HttpClient implements IHttpClient {
  constructor(private config: IConfig) {}

  async get(url: string): Promise<any> {
    console.log(`GET ${this.config.apiUrl}${url} (timeout: ${this.config.timeout}ms)`);
    return { data: 'response' };
  }
}

async function main() {
  console.log('=== Factory Pattern Examples ===\n');

  const services = new ServiceCollection();

  // ============================================
  // 1. Simple Factory Pattern
  // ============================================
  console.log('--- 1. Simple Factory Pattern ---');

  const IConfigToken = Symbol('IConfig');
  const IHttpClientToken = Symbol('IHttpClient');

  // Config value
  services.addValue<IConfig>(IConfigToken, {
    apiUrl: 'https://api.example.com',
    timeout: 5000,
  });

  // Create HttpClient using factory
  const httpClientFactory: ServiceFactory<IHttpClient> = async (provider) => {
    const config = await provider.getRequiredService<IConfig>(IConfigToken);
    return new HttpClient(config);
  };

  services.addSingleton<IHttpClient>(IHttpClientToken, httpClientFactory);

  const provider = services.buildServiceProvider();
  const httpClient = await provider.getRequiredService<IHttpClient>(IHttpClientToken);
  await httpClient.get('/users');

  // ============================================
  // 2. Factory with Async Initialization
  // ============================================
  console.log('\n--- 2. Factory with Async Initialization ---');

  interface IDatabase {
    connect(): Promise<void>;
    query(sql: string): Promise<any[]>;
  }

  class Database implements IDatabase {
    private connected = false;

    constructor(private connectionString: string) {}

    async connect(): Promise<void> {
      console.log(`Connecting to database: ${this.connectionString}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
      this.connected = true;
      console.log('Database connected!');
    }

    async query(sql: string): Promise<any[]> {
      if (!this.connected) {
        throw new Error('Database not connected');
      }
      console.log(`Executing query: ${sql}`);
      return [];
    }
  }

  const IDatabaseToken = Symbol('IDatabase');
  const ConnectionStringToken = Symbol('ConnectionString');

  services.addValue<string>(ConnectionStringToken, 'postgresql://localhost:5432/mydb');

  // Async factory - connect to database
  const databaseFactory: ServiceFactory<IDatabase> = async (provider) => {
    const connectionString = await provider.getRequiredService<string>(ConnectionStringToken);
    const db = new Database(connectionString);
    await db.connect(); // Async initialization
    return db;
  };

  services.addSingleton<IDatabase>(IDatabaseToken, databaseFactory);

  const db = await provider.getRequiredService<IDatabase>(IDatabaseToken);
  await db.query('SELECT * FROM users');

  // ============================================
  // 3. Factory with Conditional Logic
  // ============================================
  console.log('\n--- 3. Factory with Conditional Logic ---');

  interface ILogger {
    log(message: string): void;
  }

  class ConsoleLogger implements ILogger {
    log(message: string) {
      console.log(`[CONSOLE] ${message}`);
    }
  }

  class FileLogger implements ILogger {
    log(message: string) {
      console.log(`[FILE] ${message}`);
    }
  }

  const ILoggerToken = Symbol('ILogger');
  const LogTypeToken = Symbol('LogType');

  services.addValue<string>(LogTypeToken, process.env.LOG_TYPE || 'console');

  // Select different logger based on environment
  const loggerFactory: ServiceFactory<ILogger> = async (provider) => {
    const logType = await provider.getRequiredService<string>(LogTypeToken);
    if (logType === 'file') {
      return new FileLogger();
    }
    return new ConsoleLogger();
  };

  services.addSingleton<ILogger>(ILoggerToken, loggerFactory);

  const logger = await provider.getRequiredService<ILogger>(ILoggerToken);
  logger.log('Test message');

  // ============================================
  // 4. Factory with Complex Object Creation
  // ============================================
  console.log('\n--- 4. Factory with Complex Object Creation ---');

  interface IApiClient {
    getUsers(): Promise<string[]>;
  }

  class ApiClient implements IApiClient {
    constructor(private baseUrl: string, private timeout: number, private apiKey: string) {}

    async getUsers(): Promise<string[]> {
      console.log(`Fetching users from ${this.baseUrl} with key: ${this.apiKey.substring(0, 5)}...`);
      return ['Alice', 'Bob'];
    }
  }

  const IApiClientToken = Symbol('IApiClient');
  const ApiKeyToken = Symbol('ApiKey');

  services.addValue<string>(ApiKeyToken, 'secret-api-key-12345');

  // Factory with multiple dependencies
  const apiClientFactory: ServiceFactory<IApiClient> = async (provider) => {
    const config = await provider.getRequiredService<IConfig>(IConfigToken);
    const apiKey = await provider.getRequiredService<string>(ApiKeyToken);
    return new ApiClient(config.apiUrl, config.timeout, apiKey);
  };

  services.addSingleton<IApiClient>(IApiClientToken, apiClientFactory);

  const apiClient = await provider.getRequiredService<IApiClient>(IApiClientToken);
  await apiClient.getUsers();

  console.log('\n✅ Factory pattern is working!');
}

main().catch(console.error);
```

## Expected Output

```
=== Factory Pattern Examples ===

--- 1. Simple Factory Pattern ---
GET https://api.example.com/users (timeout: 5000ms)

--- 2. Factory with Async Initialization ---
Connecting to database: postgresql://localhost:5432/mydb
Database connected!
Executing query: SELECT * FROM users

--- 3. Factory with Conditional Logic ---
[CONSOLE] Test message

--- 4. Factory with Complex Object Creation ---
Fetching users from https://api.example.com with key: secre...

✅ Factory pattern is working!
```

## Run This Example

```bash
npx ts-node examples/8-factory-pattern.ts
```

## Key Points

- **Factory Functions**: Create services with complex initialization logic
- **Async Support**: Factories can be async for database connections, API calls, etc.
- **Conditional Logic**: Choose implementation based on configuration
- **Dependency Resolution**: Factory receives ServiceProvider to resolve dependencies
