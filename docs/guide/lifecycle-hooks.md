# Lifecycle Hooks

Services can implement lifecycle hooks for initialization and cleanup.

## onInit Hook

Called after a service instance is created:

```typescript
class DatabaseConnection {
  private connection: any;

  async onInit() {
    console.log('Initializing database connection...');
    this.connection = await connectToDatabase();
    console.log('Database connected!');
  }

  query(sql: string) {
    return this.connection.query(sql);
  }
}

services.addScoped<DatabaseConnection>(DatabaseConnectionToken, DatabaseConnection);

const scope = provider.createScope();
const db = await scope.getRequiredService<DatabaseConnection>(DatabaseConnectionToken);
// onInit() is automatically called
```

## onDestroy Hook

Called when a scope is disposed:

```typescript
class DatabaseConnection {
  private connection: any;

  async onInit() {
    this.connection = await connectToDatabase();
  }

  async onDestroy() {
    if (this.connection) {
      await this.connection.close();
      console.log('Database connection closed');
    }
  }
}

const scope = provider.createScope();
const db = await scope.getRequiredService<DatabaseConnection>(DatabaseConnectionToken);

// ... use database

await scope.dispose(); // onDestroy() is automatically called
```

## Both Hooks

Services can implement both hooks:

```typescript
class CacheService {
  private cache = new Map<string, any>();

  async onInit() {
    console.log('Cache initialized');
    // Load cache from disk, etc.
  }

  async onDestroy() {
    console.log('Clearing cache...');
    this.cache.clear();
    // Save cache to disk, etc.
  }
}
```

## Hook Execution Order

1. Service instance is created
2. Dependencies are injected
3. `onInit()` is called (if implemented)
4. Service is ready to use
5. When scope is disposed, `onDestroy()` is called (if implemented)

## Async Hooks

Both hooks can be async:

```typescript
class DatabaseConnection {
  async onInit() {
    await this.connect();
    await this.migrate();
  }

  async onDestroy() {
    await this.close();
    await this.cleanup();
  }
}
```

## Error Handling

If `onInit()` throws, the service creation fails:

```typescript
class DatabaseConnection {
  async onInit() {
    throw new Error('Failed to connect');
  }
}

// This will throw the error
const db = await provider.getRequiredService<DatabaseConnection>(DatabaseConnectionToken);
```

If `onDestroy()` throws, the error is logged but doesn't prevent disposal:

```typescript
class Service {
  async onDestroy() {
    throw new Error('Cleanup failed');
  }
}

// Error is logged, but disposal continues
await scope.dispose();
```

## Use Cases

### onInit

- Database connections
- Cache initialization
- Loading configuration
- Setting up event listeners

### onDestroy

- Closing database connections
- Clearing caches
- Removing event listeners
- Saving state

## Best Practices

1. **Keep hooks simple** - Avoid complex logic
2. **Handle errors** - Wrap in try-catch if needed
3. **Make hooks async** - For async operations
4. **Clean up in onDestroy** - Prevent resource leaks
5. **Test hooks** - Ensure they work correctly

## Next Steps

- [Service Lifetimes](/guide/service-lifetimes)
- [Scopes](/guide/service-lifetimes#scoped)
