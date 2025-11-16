// JavaScript Example - Safe Usage with Runtime Validation
const { ServiceCollection, ServiceProvider } = require('./dist/index.js');

console.log('🚀 JavaScript Example - Safe Usage\n');

// Define services with runtime validation
class Logger {
  log(message) {
    if (typeof message !== 'string') {
      throw new TypeError('Logger.log() expects a string parameter');
    }
    console.log(`[LOG] ${new Date().toISOString()} - ${message}`);
  }
}

class UserService {
  constructor(logger) {
    // Runtime validation - defensive programming
    if (!logger) {
      throw new Error('UserService requires a logger dependency');
    }
    if (typeof logger.log !== 'function') {
      throw new TypeError('UserService requires a logger with a log() method');
    }

    this.logger = logger;
  }

  getUsers() {
    this.logger.log('Fetching users...');
    return ['Alice', 'Bob', 'Charlie'];
  }
}

// Alternative: JSDoc type hints (for better IDE support)
/**
 * @typedef {Object} ILogger
 * @property {function(string): void} log
 */

/**
 * Email Service
 * @param {ILogger} logger - Logger service
 */
class EmailService {
  constructor(logger) {
    // Runtime validation
    if (!logger || typeof logger.log !== 'function') {
      throw new TypeError('EmailService requires a valid logger');
    }
    this.logger = logger;
  }

  sendEmail(to, subject) {
    this.logger.log(`Sending email to ${to}: ${subject}`);
    return { success: true, to, subject };
  }
}

// Setup container
const services = new ServiceCollection();

// Create tokens
const ILoggerToken = Symbol('ILogger');
const IUserServiceToken = Symbol('IUserService');
const IEmailServiceToken = Symbol('IEmailService');

// Register services
console.log('📦 Registering services...');
services.addSingleton(ILoggerToken, Logger);
services.addScoped(IUserServiceToken, UserService, [ILoggerToken]);
services.addScoped(IEmailServiceToken, EmailService, [ILoggerToken]);

// Build provider
console.log('🔨 Building service provider...\n');
const provider = services.buildServiceProvider();

// Test: Normal usage (safe)
(async () => {
  try {
    console.log('=== Test 1: Normal Usage (Safe) ===');
    const userService = await provider.getRequiredService(IUserServiceToken);
    const users = userService.getUsers();
    console.log('Users:', users);
    console.log('✅ Success\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();

// Test: What happens if dependency is missing? (IoC container handles this)
(async () => {
  try {
    console.log('=== Test 2: Missing Dependency Protection ===');
    // This will fail at registration time if dependency is missing
    const badServices = new ServiceCollection();
    const BadToken = Symbol('Bad');

    // This will throw an error because LoggerToken is not registered
    try {
      badServices.addScoped(BadToken, UserService, [ILoggerToken]);
      const badProvider = badServices.buildServiceProvider();
      await badProvider.getRequiredService(BadToken);
    } catch (error) {
      console.log('✅ IoC container correctly prevents missing dependencies');
      console.log('   Error:', error.message);
    }
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();

// Test: Runtime validation in constructor
(async () => {
  try {
    console.log('=== Test 3: Constructor Validation ===');
    // This would fail if we manually create with invalid dependency
    try {
      const invalidService = new UserService(null);
      console.log('❌ Should have thrown an error');
    } catch (error) {
      console.log('✅ Constructor validation works:', error.message);
    }
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();

console.log('✅ All safety tests completed!');
console.log('\n💡 Recommendations:');
console.log('   1. Use TypeScript for compile-time type safety');
console.log('   2. Add runtime validation in constructors');
console.log('   3. Use JSDoc for better IDE support');
console.log('   4. Trust IoC container - it ensures dependencies are resolved');

