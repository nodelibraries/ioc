// JavaScript Example - Testing @nodelibraries/ioc
const { ServiceCollection, ServiceProvider, ServiceLifetime } = require('./dist/index.js');

console.log('🚀 JavaScript Example - @nodelibraries/ioc\n');

// Define services
class Logger {
  log(message) {
    console.log(`[LOG] ${new Date().toISOString()} - ${message}`);
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

class EmailService {
  constructor(logger) {
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
services.addScoped(IUserServiceToken, UserService, [ILoggerToken]);
services.addScoped(IEmailServiceToken, EmailService, [ILoggerToken]);

// Build provider
console.log('🔨 Building service provider...\n');
const provider = services.buildServiceProvider();

// Run all tests sequentially
(async () => {
  try {
    // Test 1: Get services
    console.log('=== Test 1: Basic Service Resolution ===');
    const userService = await provider.getRequiredService(IUserServiceToken);
    const users = userService.getUsers();
    console.log('Users:', users);
    console.log('');

    // Test 2: Multiple services
    console.log('=== Test 2: Multiple Services ===');
    const userService2 = await provider.getRequiredService(IUserServiceToken);
    const emailService = await provider.getRequiredService(IEmailServiceToken);

    const users2 = userService2.getUsers();
    const emailResult = emailService.sendEmail('alice@example.com', 'Welcome!');

    console.log('Email result:', emailResult);
    console.log('');

    // Test 3: Scoped services
    console.log('=== Test 3: Scoped Services ===');
    const scope1 = provider.createScope();
    const scope2 = provider.createScope();

    const userService1 = await scope1.getRequiredService(IUserServiceToken);
    const userService2_scoped = await scope2.getRequiredService(IUserServiceToken);

    console.log('Scope 1 - Users:', userService1.getUsers());
    console.log('Scope 2 - Users:', userService2_scoped.getUsers());
    console.log('Same instance in scope?', userService1 === userService2_scoped ? 'Yes (same scope)' : 'No (different scopes) ✅');
    console.log('');

    // Test 4: Singleton behavior
    console.log('=== Test 4: Singleton Behavior ===');
    const logger1 = await provider.getRequiredService(ILoggerToken);
    const logger2 = await provider.getRequiredService(ILoggerToken);

    console.log('Same logger instance?', logger1 === logger2 ? 'Yes ✅' : 'No ❌');
    console.log('');

    // Test 5: Service checking
    console.log('=== Test 5: Service Checking ===');
    const hasLogger = provider.isService(ILoggerToken);
    const hasUserService = provider.isService(IUserServiceToken);
    const hasUnknown = provider.isService(Symbol('Unknown'));

    console.log('Has Logger?', hasLogger ? 'Yes ✅' : 'No ❌');
    console.log('Has UserService?', hasUserService ? 'Yes ✅' : 'No ❌');
    console.log('Has Unknown?', hasUnknown ? 'Yes ✅' : 'No ❌');
    console.log('');

    console.log('✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();

