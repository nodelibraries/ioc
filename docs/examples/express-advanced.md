# Advanced Express Integration Example

More complex Express.js application with multiple services, middleware, authentication, error handling, and request context.

## Code

```typescript
import express, { Request, Response, NextFunction } from 'express';
import { ServiceCollection, ServiceProvider } from '@nodelibraries/ioc';

/**
 * Advanced Express Integration Example
 *
 * This example demonstrates a more complex Express.js application with:
 * - Multiple services with dependencies
 * - Middleware using IoC container
 * - Error handling with dependency injection
 * - Request-scoped services
 * - Service lifecycle management
 */

// ============================================
// Interfaces
// ============================================

interface ILogger {
  log(message: string, level?: string): void;
  error(message: string, error?: Error): void;
}

interface IConfig {
  get(key: string): string | undefined;
  getNumber(key: string): number | undefined;
  getBoolean(key: string): boolean | undefined;
}

interface IUserRepository {
  findById(id: number): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(user: Partial<User>): Promise<User>;
}

interface IUserService {
  getUserById(id: number): Promise<User | null>;
  getAllUsers(): Promise<User[]>;
  createUser(data: CreateUserDto): Promise<User>;
}

interface IAuthService {
  validateToken(token: string): Promise<boolean>;
  getUserIdFromToken(token: string): Promise<number | null>;
}

interface IRequestContext {
  userId?: number;
  requestId: string;
  startTime: number;
}

// ============================================
// Models
// ============================================

interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

interface CreateUserDto {
  name: string;
  email: string;
}

// ============================================
// Implementations
// ============================================

class Logger implements ILogger {
  constructor(private config: IConfig) {}

  log(message: string, level: string = 'INFO'): void {
    const timestamp = new Date().toISOString();
    const prefix = this.config.getBoolean('LOG_COLORS') ? `\x1b[36m[${level}]\x1b[0m` : `[${level}]`;
    console.log(`${prefix} ${timestamp} - ${message}`);
  }

  error(message: string, error?: Error): void {
    const timestamp = new Date().toISOString();
    console.error(`[ERROR] ${timestamp} - ${message}`, error);
  }
}

class Config implements IConfig {
  private values: Map<string, string> = new Map();

  constructor() {
    // Load from environment variables
    this.values.set('PORT', process.env.PORT || '3000');
    this.values.set('NODE_ENV', process.env.NODE_ENV || 'development');
    this.values.set('LOG_COLORS', process.env.LOG_COLORS || 'true');
    this.values.set('JWT_SECRET', process.env.JWT_SECRET || 'secret-key');
  }

  get(key: string): string | undefined {
    return this.values.get(key);
  }

  getNumber(key: string): number | undefined {
    const value = this.values.get(key);
    return value ? parseInt(value, 10) : undefined;
  }

  getBoolean(key: string): boolean | undefined {
    const value = this.values.get(key);
    return value === 'true' || value === '1';
  }
}

class UserRepository implements IUserRepository {
  private users: User[] = [
    { id: 1, name: 'Alice', email: 'alice@example.com', createdAt: new Date() },
    { id: 2, name: 'Bob', email: 'bob@example.com', createdAt: new Date() },
    { id: 3, name: 'Charlie', email: 'charlie@example.com', createdAt: new Date() },
  ];

  constructor(private logger: ILogger) {
    this.logger.log('UserRepository initialized');
  }

  async findById(id: number): Promise<User | null> {
    this.logger.log(`Finding user by id: ${id}`);
    return this.users.find((u) => u.id === id) || null;
  }

  async findAll(): Promise<User[]> {
    this.logger.log('Finding all users');
    return [...this.users];
  }

  async create(user: Partial<User>): Promise<User> {
    const newUser: User = {
      id: this.users.length + 1,
      name: user.name!,
      email: user.email!,
      createdAt: new Date(),
    };
    this.users.push(newUser);
    this.logger.log(`Created user: ${newUser.name} (${newUser.id})`);
    return newUser;
  }
}

class UserService implements IUserService {
  constructor(private repository: IUserRepository, private logger: ILogger) {
    this.logger.log('UserService initialized');
  }

  async getUserById(id: number): Promise<User | null> {
    this.logger.log(`UserService.getUserById(${id})`);
    return this.repository.findById(id);
  }

  async getAllUsers(): Promise<User[]> {
    this.logger.log('UserService.getAllUsers()');
    return this.repository.findAll();
  }

  async createUser(data: CreateUserDto): Promise<User> {
    this.logger.log(`UserService.createUser(${data.name})`);
    return this.repository.create(data);
  }
}

class AuthService implements IAuthService {
  constructor(private config: IConfig, private logger: ILogger) {
    this.logger.log('AuthService initialized');
  }

  async validateToken(token: string): Promise<boolean> {
    // Simple token validation (in real app, use JWT)
    this.logger.log('Validating token');
    return token === 'valid-token' || token.startsWith('Bearer valid-');
  }

  async getUserIdFromToken(token: string): Promise<number | null> {
    // Simple token parsing (in real app, decode JWT)
    this.logger.log('Extracting user ID from token');
    if (token === 'valid-token') return 1;
    if (token.startsWith('Bearer valid-')) {
      const userId = parseInt(token.replace('Bearer valid-', ''), 10);
      return isNaN(userId) ? null : userId;
    }
    return null;
  }
}

// ============================================
// Tokens
// ============================================

const ILoggerToken = Symbol('ILogger');
const IConfigToken = Symbol('IConfig');
const IUserRepositoryToken = Symbol('IUserRepository');
const IUserServiceToken = Symbol('IUserService');
const IAuthServiceToken = Symbol('IAuthService');
const IRequestContextToken = Symbol('IRequestContext');

// ============================================
// Middleware
// ============================================

// Request context middleware - creates scoped container per request
function createRequestScopeMiddleware(provider: ServiceProvider) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    // Create scoped container for this request
    const scope = provider.createScope();

    // Store request context in request object (since we can't add values to existing scope)
    (req as any).requestContext = {
      requestId,
      startTime,
    };

    // Attach scope to request
    (req as any).scope = scope;

    // Log request start
    const logger = await scope.getRequiredService<ILogger>(ILoggerToken);
    logger.log(`Request started: ${req.method} ${req.path} [${requestId}]`);

    // Cleanup on response finish
    res.on('finish', async () => {
      const duration = Date.now() - startTime;
      logger.log(`Request finished: ${req.method} ${req.path} [${requestId}] - ${duration}ms`);
      try {
        await scope.dispose();
      } catch (error) {
        console.error('Error disposing scope:', error);
      }
    });

    next();
  };
}

// Authentication middleware
function createAuthMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const scope: ServiceProvider = (req as any).scope;
    const authService = await scope.getRequiredService<IAuthService>(IAuthServiceToken);
    const logger = await scope.getRequiredService<ILogger>(ILoggerToken);
    const context: IRequestContext = (req as any).requestContext;

    const token = req.headers.authorization;

    if (!token) {
      logger.error('No authorization token provided', undefined);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const isValid = await authService.validateToken(token);
    if (!isValid) {
      logger.error('Invalid token', undefined);
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = await authService.getUserIdFromToken(token);
    if (userId) {
      context.userId = userId;
      logger.log(`User authenticated: ${userId}`);
    }

    next();
  };
}

// Error handling middleware
function createErrorHandler() {
  return (err: Error, req: Request, res: Response, _next: NextFunction) => {
    const scope: ServiceProvider = (req as any).scope;
    if (scope) {
      scope
        .getRequiredService<ILogger>(ILoggerToken)
        .then((logger) => {
          logger.error('Request error', err);
        })
        .catch(() => {
          console.error('Error in error handler:', err);
        });
    } else {
      console.error('Request error (no scope):', err);
    }

    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  };
}

// ============================================
// Routes
// ============================================

function createUserRoutes() {
  const router = express.Router();

  // GET /users - Get all users
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const scope: ServiceProvider = (req as any).scope;
      const userService = await scope.getRequiredService<IUserService>(IUserServiceToken);
      const context: IRequestContext = (req as any).requestContext;

      const logger = await scope.getRequiredService<ILogger>(ILoggerToken);
      logger.log(`Fetching all users [${context.requestId}]`);

      const users = await userService.getAllUsers();
      res.json({ users, requestId: context.requestId });
    } catch (error) {
      next(error);
    }
  });

  // GET /users/:id - Get user by ID
  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const scope: ServiceProvider = (req as any).scope;
      const userService = await scope.getRequiredService<IUserService>(IUserServiceToken);
      const context: IRequestContext = (req as any).requestContext;

      const logger = await scope.getRequiredService<ILogger>(ILoggerToken);
      const userId = parseInt(req.params.id, 10);

      logger.log(`Fetching user ${userId} [${context.requestId}]`);

      const user = await userService.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found', requestId: context.requestId });
      }

      res.json({ user, requestId: context.requestId });
    } catch (error) {
      next(error);
    }
  });

  // POST /users - Create new user (requires authentication)
  router.post('/', createAuthMiddleware(), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const scope: ServiceProvider = (req as any).scope;
      const userService = await scope.getRequiredService<IUserService>(IUserServiceToken);
      const context: IRequestContext = (req as any).requestContext;

      const logger = await scope.getRequiredService<ILogger>(ILoggerToken);
      logger.log(`Creating user [${context.requestId}] by user ${context.userId}`);

      const { name, email } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required', requestId: context.requestId });
      }

      const user = await userService.createUser({ name, email });
      res.status(201).json({ user, requestId: context.requestId });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

// ============================================
// Application Setup
// ============================================

async function createApp(): Promise<express.Application> {
  // Setup IoC container
  const services = new ServiceCollection();

  // Register services
  services.addSingleton<IConfig>(IConfigToken, Config);
  services.addSingleton<ILogger>(ILoggerToken, Logger, [IConfigToken]);
  services.addScoped<IUserRepository>(IUserRepositoryToken, UserRepository, [ILoggerToken]);
  services.addScoped<IUserService>(IUserServiceToken, UserService, [IUserRepositoryToken, ILoggerToken]);
  services.addSingleton<IAuthService>(IAuthServiceToken, AuthService, [IConfigToken, ILoggerToken]);

  // Build root provider
  const provider = services.buildServiceProvider();

  // Create Express app
  const app = express();
  app.use(express.json());

  // Request scope middleware (must be first)
  app.use(createRequestScopeMiddleware(provider));

  // Routes
  app.use('/users', createUserRoutes());

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Error handler (must be last)
  app.use(createErrorHandler());

  return app;
}

// ============================================
// Main
// ============================================

async function main() {
  console.log('=== Advanced Express Integration Example ===\n');

  const app = await createApp();
  const port = process.env.PORT || 3000;

  app.listen(port, () => {
    console.log(`\n🚀 Server running on http://localhost:${port}`);
    console.log('\nAvailable endpoints:');
    console.log('  GET  /health              - Health check');
    console.log('  GET  /users               - Get all users');
    console.log('  GET  /users/:id           - Get user by ID');
    console.log('  POST /users               - Create user (requires auth)');
    console.log('\nTest with:');
    console.log('  curl http://localhost:3000/health');
    console.log('  curl http://localhost:3000/users');
    console.log('  curl http://localhost:3000/users/1');
    console.log('  curl -X POST http://localhost:3000/users \\');
    console.log('       -H "Authorization: valid-token" \\');
    console.log('       -H "Content-Type: application/json" \\');
    console.log('       -d \'{"name":"David","email":"david@example.com"}\'');
    console.log('\nPress Ctrl+C to stop the server\n');
  });
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { createApp };
```

## Expected Output

```
=== Advanced Express Integration Example ===

[INFO] <timestamp> - Config initialized
[INFO] <timestamp> - Logger initialized
[INFO] <timestamp> - AuthService initialized
[INFO] <timestamp> - UserRepository initialized
[INFO] <timestamp> - UserService initialized

🚀 Server running on http://localhost:3000

Available endpoints:
  GET  /health              - Health check
  GET  /users               - Get all users
  GET  /users/:id           - Get user by ID
  POST /users               - Create user (requires auth)

Test with:
  curl http://localhost:3000/health
  curl http://localhost:3000/users
  curl http://localhost:3000/users/1
  curl -X POST http://localhost:3000/users \
       -H "Authorization: valid-token" \
       -H "Content-Type: application/json" \
       -d '{"name":"David","email":"david@example.com}'

Press Ctrl+C to stop the server

[INFO] <timestamp> - Request started: GET /health [req-...]
[INFO] <timestamp> - Request finished: GET /health [req-...] - <duration>ms

[INFO] <timestamp> - Request started: GET /users [req-...]
[INFO] <timestamp> - UserRepository initialized
[INFO] <timestamp> - UserService initialized
[INFO] <timestamp> - Fetching all users [req-...]
[INFO] <timestamp> - Finding all users
[INFO] <timestamp> - Request finished: GET /users [req-...] - <duration>ms
```

## Run This Example

```bash
# First, install Express dependencies
npm install --save-dev express @types/express ts-node

# Then run the example
npx ts-node examples/17-express-advanced.ts
```

## Test the API

```bash
# Health check
curl http://localhost:3000/health

# Get all users
curl http://localhost:3000/users

# Get user by ID
curl http://localhost:3000/users/1

# Create user (requires authentication)
curl -X POST http://localhost:3000/users \
  -H "Authorization: valid-token" \
  -H "Content-Type: application/json" \
  -d '{"name":"David","email":"david@example.com"}'
```

## Key Points

- **Multiple Services**: Complex service dependencies
- **Request Context**: Request-scoped context with request ID and timing
- **Authentication Middleware**: Token-based authentication
- **Error Handling**: Centralized error handling with dependency injection
- **Logging**: Request logging with timing information
