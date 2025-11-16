# Express Integration Example

Complete example of using the IoC container with Express.js - request-scoped services, middleware, and RESTful API.

## Code

```typescript
import express, { Request, Response } from 'express';
import { ServiceCollection, ServiceProvider } from '@nodelibraries/ioc';

/**
 * Express Integration Example
 *
 * This example demonstrates Express.js integration with IoC container.
 *
 * Features:
 * - Request-scoped services
 * - Middleware for scope management
 * - RESTful API with dependency injection
 */
interface ILogger {
  log(message: string): void;
}

interface IUserRepository {
  findAll(): { id: number; name: string; email: string }[];
  findById(id: number): { id: number; name: string; email: string } | null;
  create(user: { name: string; email: string }): {
    id: number;
    name: string;
    email: string;
  };
}

interface IUserService {
  getUsers(): { id: number; name: string; email: string }[];
  getUserById(id: number): { id: number; name: string; email: string } | null;
  createUser(name: string, email: string): { id: number; name: string; email: string };
}

// Implementations
class Logger implements ILogger {
  log(message: string) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
}

class UserRepository implements IUserRepository {
  private users: { id: number; name: string; email: string }[] = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
  ];

  constructor(private logger: ILogger) {
    this.logger.log('UserRepository initialized');
  }

  findAll() {
    this.logger.log('Repository: Finding all users');
    return this.users;
  }

  findById(id: number) {
    this.logger.log(`Repository: Finding user with id ${id}`);
    return this.users.find((u) => u.id === id) || null;
  }

  create(user: { name: string; email: string }) {
    const newUser = { id: Date.now(), ...user };
    this.users.push(newUser);
    this.logger.log(`Repository: Created user ${newUser.name}`);
    return newUser;
  }
}

class UserService implements IUserService {
  constructor(private repository: IUserRepository, private logger: ILogger) {
    this.logger.log('UserService initialized');
  }

  getUsers() {
    this.logger.log('Service: Getting all users');
    return this.repository.findAll();
  }

  getUserById(id: number) {
    this.logger.log(`Service: Getting user with id ${id}`);
    return this.repository.findById(id);
  }

  createUser(name: string, email: string) {
    this.logger.log(`Service: Creating user ${name}`);
    return this.repository.create({ name, email });
  }
}

// Setup DI Container
const services = new ServiceCollection();

const ILoggerToken = Symbol('ILogger');
const IUserRepositoryToken = Symbol('IUserRepository');
const IUserServiceToken = Symbol('IUserService');

services.addSingleton<ILogger>(ILoggerToken, Logger);
services.addScoped<IUserRepository>(IUserRepositoryToken, UserRepository, [ILoggerToken]);
services.addScoped<IUserService>(IUserServiceToken, UserService, [IUserRepositoryToken, ILoggerToken]);

const provider = services.buildServiceProvider();

// Express App
const app = express();
app.use(express.json());

// Middleware: Create scoped container per request
app.use(async (req: Request, res: Response, next) => {
  const scope = provider.createScope();
  (req as any).scope = scope;
  res.on('finish', async () => {
    try {
      await scope.dispose();
    } catch (error) {
      console.error('Error disposing scope:', error);
    }
  });
  next();
});

// Routes
app.get('/users', async (req: Request, res: Response) => {
  const scope: ServiceProvider = (req as any).scope;
  const userService = await scope.getRequiredService<IUserService>(IUserServiceToken);
  const users = userService.getUsers();
  res.json(users);
});

app.get('/users/:id', async (req: Request, res: Response) => {
  const scope: ServiceProvider = (req as any).scope;
  const userService = await scope.getRequiredService<IUserService>(IUserServiceToken);
  const id = parseInt(req.params.id, 10);
  const user = userService.getUserById(id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
});

app.post('/users', async (req: Request, res: Response) => {
  const scope: ServiceProvider = (req as any).scope;
  const userService = await scope.getRequiredService<IUserService>(IUserServiceToken);

  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const newUser = userService.createUser(name, email);
    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Express server with IoC Container running on http://localhost:${PORT}`);
  console.log('\nAvailable endpoints:');
  console.log(`  GET  http://localhost:${PORT}/users`);
  console.log(`  GET  http://localhost:${PORT}/users/:id`);
  console.log(`  POST http://localhost:${PORT}/users`);
  console.log('\nExample POST request:');
  console.log('  curl -X POST http://localhost:3000/users \\');
  console.log('    -H "Content-Type: application/json" \\');
  console.log('    -d \'{"name":"Charlie","email":"charlie@example.com"}\'\n');
});
```

## Expected Output

```
🚀 Express server with IoC Container running on http://localhost:3000

Available endpoints:
  GET  http://localhost:3000/users
  GET  http://localhost:3000/users/:id
  POST http://localhost:3000/users

Example POST request:
  curl -X POST http://localhost:3000/users \
    -H "Content-Type: application/json" \
    -d '{"name":"Charlie","email":"charlie@example.com"}'

Note: When you make requests to the API, you'll see additional logs from the services.
For example, when calling GET /users:
  [2025-11-15T23:24:16.440Z] UserRepository initialized
  [2025-11-15T23:24:16.441Z] UserService initialized
  [2025-11-15T23:24:16.442Z] Repository: Finding all users
  [2025-11-15T23:24:16.443Z] Service: Getting all users
```

## Run This Example

```bash
# First, install Express dependencies
npm install --save-dev express @types/express ts-node

# Then run the example
npx ts-node examples/16-express.ts
```

## Test the API

```bash
# Get all users
curl http://localhost:3000/users

# Get user by ID
curl http://localhost:3000/users/1

# Create new user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Charlie","email":"charlie@example.com"}'
```

## Key Points

- **Request-Scoped Services**: Each request gets its own scope
- **Middleware**: Create scoped container per request
- **Dependency Injection**: Services are injected into route handlers
- **Lifecycle Management**: Scopes are disposed after request completes
