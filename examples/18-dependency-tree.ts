/**
 * Dependency Tree Visualization Example
 *
 * Demonstrates how to visualize dependency trees for services
 */

import { ServiceCollection, ServiceProvider } from '../ioc-container';

// Define interfaces
interface ILogger {
  log(message: string): void;
}

interface IDatabase {
  connect(): void;
}

interface IConfig {
  get(key: string): string;
}

interface IUserRepository {
  findById(id: number): any;
}

interface IUserService {
  getUser(id: number): any;
}

interface IEmailService {
  send(to: string, subject: string): void;
}

interface INotificationService {
  notify(userId: number, message: string): void;
}

// Implementations
class Logger implements ILogger {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }
}

class Database implements IDatabase {
  constructor(private config: IConfig) {}
  connect() {
    console.log('Database connected');
  }
}

class Config implements IConfig {
  get(key: string): string {
    return `value-${key}`;
  }
}

class UserRepository implements IUserRepository {
  constructor(private database: IDatabase, private logger: ILogger) {}
  findById(id: number) {
    this.logger.log(`Finding user ${id}`);
    return { id, name: 'User' };
  }
}

class UserService implements IUserService {
  constructor(
    private repository: IUserRepository,
    private logger: ILogger,
    private notificationService: INotificationService,
  ) {}
  getUser(id: number) {
    this.logger.log(`Getting user ${id}`);
    return this.repository.findById(id);
  }
}

class EmailService implements IEmailService {
  constructor(private logger: ILogger) {}
  send(to: string, subject: string) {
    this.logger.log(`Sending email to ${to}: ${subject}`);
  }
}

class NotificationService implements INotificationService {
  constructor(private emailService: IEmailService, private logger: ILogger) {}
  notify(userId: number, message: string) {
    this.logger.log(`Notifying user ${userId}: ${message}`);
    this.emailService.send(`user${userId}@example.com`, message);
  }
}

async function main() {
  console.log('=== Dependency Tree Visualization Example ===\n');

  const services = new ServiceCollection();

  // Create tokens
  const IConfigToken = Symbol('IConfig');
  const ILoggerToken = Symbol('ILogger');
  const IDatabaseToken = Symbol('IDatabase');
  const IUserRepositoryToken = Symbol('IUserRepository');
  const IEmailServiceToken = Symbol('IEmailService');
  const INotificationServiceToken = Symbol('INotificationService');
  const IUserServiceToken = Symbol('IUserService');

  // Register services
  services.addSingleton<IConfig>(IConfigToken, Config);
  services.addSingleton<ILogger>(ILoggerToken, Logger);
  services.addSingleton<IDatabase>(IDatabaseToken, Database, [IConfigToken]);
  services.addSingleton<IUserRepository>(IUserRepositoryToken, UserRepository, [IDatabaseToken, ILoggerToken]);
  services.addSingleton<IEmailService>(IEmailServiceToken, EmailService, [ILoggerToken]);
  services.addSingleton<INotificationService>(INotificationServiceToken, NotificationService, [
    IEmailServiceToken,
    ILoggerToken,
  ]);
  services.addSingleton<IUserService>(IUserServiceToken, UserService, [
    IUserRepositoryToken,
    ILoggerToken,
    INotificationServiceToken,
  ]);

  // Visualize dependency trees
  console.log('1. Dependency Tree for UserService:');
  console.log(services.visualizeDependencyTree(IUserServiceToken));
  console.log('\n');

  console.log('2. Dependency Tree for NotificationService:');
  console.log(services.visualizeDependencyTree(INotificationServiceToken));
  console.log('\n');

  console.log('3. Dependency Tree for UserRepository:');
  console.log(services.visualizeDependencyTree(IUserRepositoryToken));
  console.log('\n');

  // Get dependency tree as object
  console.log('4. Dependency Tree Object for UserService:');
  const tree = services.getDependencyTree(IUserServiceToken);
  console.log(JSON.stringify(tree, null, 2));
  console.log('\n');

  // Test with circular dependency
  console.log('5. Circular Dependency Detection:');
  const services2 = new ServiceCollection();
  const ServiceAToken = Symbol('ServiceA');
  const ServiceBToken = Symbol('ServiceB');
  const ServiceCToken = Symbol('ServiceC');

  class ServiceA {
    constructor(private serviceB: any) {}
  }

  class ServiceB {
    constructor(private serviceC: any) {}
  }

  class ServiceC {
    constructor(private serviceA: any) {}
  }

  services2.addSingleton(ServiceAToken, ServiceA, [ServiceBToken]);
  services2.addSingleton(ServiceBToken, ServiceB, [ServiceCToken]);
  services2.addSingleton(ServiceCToken, ServiceC, [ServiceAToken]);

  console.log('Dependency Tree with Circular Dependency:');
  console.log(services2.visualizeDependencyTree(ServiceAToken));
  console.log('\n');

  console.log('Circular Dependencies Found:');
  console.log(services2.visualizeCircularDependencies());
}

main().catch(console.error);

/* Expected Output:

=== Dependency Tree Visualization Example ===

1. Dependency Tree for UserService:
└── Symbol(IUserService) [SINGLETON]
    ├── Symbol(IUserRepository) [SINGLETON]
    │   ├── Symbol(IDatabase) [SINGLETON]
    │   │   └── Symbol(IConfig) [SINGLETON]
    │   └── Symbol(ILogger) [SINGLETON]
    ├── Symbol(ILogger) [SINGLETON]
    └── Symbol(INotificationService) [SINGLETON]
        ├── Symbol(IEmailService) [SINGLETON]
        │   └── Symbol(ILogger) [SINGLETON]
        └── Symbol(ILogger) [SINGLETON]


2. Dependency Tree for NotificationService:
└── Symbol(INotificationService) [SINGLETON]
    ├── Symbol(IEmailService) [SINGLETON]
    │   └── Symbol(ILogger) [SINGLETON]
    └── Symbol(ILogger) [SINGLETON]


3. Dependency Tree for UserRepository:
└── Symbol(IUserRepository) [SINGLETON]
    ├── Symbol(IDatabase) [SINGLETON]
    │   └── Symbol(IConfig) [SINGLETON]
    └── Symbol(ILogger) [SINGLETON]


4. Dependency Tree Object for UserService:
{
  "name": "Symbol(IUserService)",
  "lifetime": "SINGLETON",
  "dependencies": [
    {
      "name": "Symbol(IUserRepository)",
      "lifetime": "SINGLETON",
      "dependencies": [
        {
          "name": "Symbol(IDatabase)",
          "lifetime": "SINGLETON",
          "dependencies": [
            {
              "name": "Symbol(IConfig)",
              "lifetime": "SINGLETON",
              "dependencies": [],
              "depth": 3
            }
          ],
          "depth": 2
        },
        {
          "name": "Symbol(ILogger)",
          "lifetime": "SINGLETON",
          "dependencies": [],
          "depth": 2
        }
      ],
      "depth": 1
    },
    {
      "name": "Symbol(ILogger)",
      "lifetime": "SINGLETON",
      "dependencies": [],
      "depth": 1
    },
    {
      "name": "Symbol(INotificationService)",
      "lifetime": "SINGLETON",
      "dependencies": [
        {
          "name": "Symbol(IEmailService)",
          "lifetime": "SINGLETON",
          "dependencies": [
            {
              "name": "Symbol(ILogger)",
              "lifetime": "SINGLETON",
              "dependencies": [],
              "depth": 3
            }
          ],
          "depth": 2
        },
        {
          "name": "Symbol(ILogger)",
          "lifetime": "SINGLETON",
          "dependencies": [],
          "depth": 2
        }
      ],
      "depth": 1
    }
  ],
  "depth": 0
}


5. Circular Dependency Detection:
Dependency Tree with Circular Dependency:
└── Symbol(ServiceA) [SINGLETON]
    └── Symbol(ServiceB) [SINGLETON]
        └── Symbol(ServiceC) [SINGLETON]
            └── Symbol(ServiceA) [CIRCULAR] ⚠️ CIRCULAR


Circular Dependencies Found:
Found 1 circular dependency/ies:

Circular Dependency 1:
  Symbol(ServiceA) → Symbol(ServiceB) → Symbol(ServiceC) → Symbol(ServiceA)

*/
