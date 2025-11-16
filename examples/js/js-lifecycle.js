/**
 * JavaScript Lifecycle Hooks Example
 * 
 * Demonstrates lifecycle hooks in JavaScript:
 * - onInit() - called after instance creation
 * - onDestroy() - called when scope is disposed
 */

const { ServiceCollection, ServiceProvider } = require('../../dist/index.js');

// Define services with lifecycle hooks
class DatabaseConnection {
  constructor() {
    this.connected = false;
    this.connectionId = null;
  }

  async onInit() {
    // Simulate database connection
    console.log('Connecting to database...');
    await new Promise(resolve => setTimeout(resolve, 100));
    this.connected = true;
    this.connectionId = Math.random().toString(36).substring(7);
    console.log(`Database connected with ID: ${this.connectionId}`);
  }

  async onDestroy() {
    if (this.connected) {
      console.log(`Closing database connection: ${this.connectionId}`);
      this.connected = false;
      this.connectionId = null;
      console.log('Database connection closed');
    }
  }

  query(sql) {
    if (!this.connected) {
      throw new Error('Database not connected');
    }
    console.log(`Executing query: ${sql}`);
    return { rows: [] };
  }
}

class UserRepository {
  constructor(db) {
    if (!db || typeof db.query !== 'function') {
      throw new TypeError('UserRepository requires a valid database connection');
    }
    this.db = db;
  }

  async onInit() {
    console.log('UserRepository initialized');
  }

  async onDestroy() {
    console.log('UserRepository destroyed');
  }

  findAll() {
    return this.db.query('SELECT * FROM users');
  }
}

// Setup container
const services = new ServiceCollection();

// Create tokens
const IDatabaseToken = Symbol('IDatabase');
const IUserRepositoryToken = Symbol('IUserRepository');

// Register services
services.addScoped(IDatabaseToken, DatabaseConnection);
services.addScoped(IUserRepositoryToken, UserRepository, [IDatabaseToken]);

// Build provider
const provider = services.buildServiceProvider();

// Use services
(async () => {
  try {
    console.log('=== Creating Scope 1 ===');
    const scope1 = provider.createScope();

    const db1 = await scope1.getRequiredService(IDatabaseToken);
    const repo1 = await scope1.getRequiredService(IUserRepositoryToken);

    console.log('\n=== Using Services ===');
    repo1.findAll();

    console.log('\n=== Disposing Scope 1 ===');
    await scope1.dispose();

    console.log('\n=== Creating Scope 2 ===');
    const scope2 = provider.createScope();

    const db2 = await scope2.getRequiredService(IDatabaseToken);
    const repo2 = await scope2.getRequiredService(IUserRepositoryToken);

    console.log('\n=== Using Services ===');
    repo2.findAll();

    console.log('\n=== Disposing Scope 2 ===');
    await scope2.dispose();

  } catch (error) {
    console.error('Error:', error.message);
  }
})();

/* Expected Console Output:

=== Creating Scope 1 ===
Connecting to database...
Database connected with ID: abc123
UserRepository initialized

=== Using Services ===
Executing query: SELECT * FROM users

=== Disposing Scope 1 ===
UserRepository destroyed
Closing database connection: abc123
Database connection closed

=== Creating Scope 2 ===
Connecting to database...
Database connected with ID: def456
UserRepository initialized

=== Using Services ===
Executing query: SELECT * FROM users

=== Disposing Scope 2 ===
UserRepository destroyed
Closing database connection: def456
Database connection closed

*/

