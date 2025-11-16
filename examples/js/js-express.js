/**
 * JavaScript Express Integration Example
 * 
 * Demonstrates Express.js integration with IoC container in JavaScript:
 * - Request-scoped services
 * - Middleware integration
 * - Service resolution in routes
 */

const express = require('express');
const { ServiceCollection, ServiceProvider } = require('../../dist/index.js');

// Define services
class Logger {
  log(message) {
    console.log(`[LOG] ${new Date().toISOString()} - ${message}`);
  }
}

class UserService {
  constructor(logger) {
    if (!logger || typeof logger.log !== 'function') {
      throw new TypeError('UserService requires a valid logger');
    }
    this.logger = logger;
  }

  getUsers() {
    this.logger.log('Fetching users...');
    return ['Alice', 'Bob', 'Charlie'];
  }

  getUserById(id) {
    this.logger.log(`Fetching user ${id}...`);
    return { id, name: `User${id}` };
  }
}

// Setup container
const services = new ServiceCollection();

// Create tokens
const ILoggerToken = Symbol('ILogger');
const IUserServiceToken = Symbol('IUserService');

// Register services
services.addSingleton(ILoggerToken, Logger);
services.addScoped(IUserServiceToken, UserService, [ILoggerToken]);

// Build provider
const provider = services.buildServiceProvider();

// Create Express app
const app = express();
app.use(express.json());

// Middleware to create scoped container per request
app.use((req, res, next) => {
  const scope = provider.createScope();
  req.scope = scope;

  // Dispose scope when response finishes
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
app.get('/users', async (req, res) => {
  try {
    const userService = await req.scope.getRequiredService(IUserServiceToken);
    const users = userService.getUsers();
    res.json(users);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const userService = await req.scope.getRequiredService(IUserServiceToken);
    const user = userService.getUserById(req.params.id);
    res.json(user);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Try: curl http://localhost:${PORT}/users');
  console.log('Try: curl http://localhost:${PORT}/users/1');
});

/* Expected Console Output when accessing /users:

[LOG] 2025-01-01T12:00:00.000Z - Fetching users...

*/

