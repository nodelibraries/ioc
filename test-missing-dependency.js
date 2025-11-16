// Test: Missing Dependency Behavior
const { ServiceCollection, ServiceProvider } = require('./dist/index.js');

console.log('🔍 Testing Missing Dependency Behavior\n');

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
    return ['Alice', 'Bob'];
  }
}

const services = new ServiceCollection();
const ILoggerToken = Symbol('ILogger');
const IUserServiceToken = Symbol('IUserService');

console.log('📦 Registration Phase:');
console.log('  - Registering UserService (depends on Logger)...');
services.addScoped(IUserServiceToken, UserService, [ILoggerToken]);
console.log('  ✅ Registration successful (no error yet)\n');

console.log('🔨 Build Phase:');
const provider = services.buildServiceProvider();
console.log('  ✅ Build successful (no error yet)\n');

console.log('⚡ Resolution Phase:');
console.log('  - Trying to resolve UserService...');
console.log('  - UserService needs Logger...');
console.log('  - Logger is NOT registered...\n');

(async () => {
  try {
    const userService = await provider.getRequiredService(IUserServiceToken);
    console.log('  ❌ This should not happen!');
  } catch (error) {
    console.log('  ✅ Error caught (as expected):');
    console.log(`     "${error.message}"\n`);
    console.log('💡 This is CORRECT behavior:');
    console.log('   - Registration: No error (just registering)');
    console.log('   - Build: No error (just building)');
    console.log('   - Resolution: Error (dependency missing)');
    console.log('\n✅ IoC container correctly detects missing dependencies!');
  }
})();

