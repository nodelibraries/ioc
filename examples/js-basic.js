/**
 * JavaScript Basic Example
 * 
 * Demonstrates basic usage of @nodelibraries/ioc in JavaScript:
 * - Service registration
 * - Service resolution
 * - Dependency injection
 * - Scopes
 */

const { ServiceCollection, ServiceProvider, ServiceLifetime } = require('../dist/index.js');

// Define services
class Logger {
  log(message) {
    console.log(`[LOG] ${message}`);
  }
}

class UserService {
  constructor(logger) {
    this.logger = logger;
  }

  getUsers() {
    this.logger.log('Fetching users...');
    return ['Alice', 'Bob', 'Charlie'];
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

// Use services
(async () => {
  try {
    // Get service from root provider
    const userService = await provider.getRequiredService(IUserServiceToken);
    const users = userService.getUsers();
    console.log('Users:', users);

    // Create scope
    const scope = provider.createScope();
    const scopedUserService = await scope.getRequiredService(IUserServiceToken);
    const scopedUsers = scopedUserService.getUsers();
    console.log('Scoped Users:', scopedUsers);

    // Dispose scope
    await scope.dispose();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();

/* Expected Console Output:

[LOG] Fetching users...
Users: [ 'Alice', 'Bob', 'Charlie' ]
[LOG] Fetching users...
Scoped Users: [ 'Alice', 'Bob', 'Charlie' ]

*/

