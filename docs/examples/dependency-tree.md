# Dependency Tree Visualization

This example demonstrates how to visualize and analyze dependency trees for services using `getDependencyTree()` and `visualizeDependencyTree()` methods.

## Code

```typescript
import { ServiceCollection } from '@nodelibraries/ioc';

// Register services with dependencies
const services = new ServiceCollection();
const IConfigToken = Symbol('IConfig');
const ILoggerToken = Symbol('ILogger');
const IDatabaseToken = Symbol('IDatabase');
const IUserRepositoryToken = Symbol('IUserRepository');
const IUserServiceToken = Symbol('IUserService');

services.addSingleton(IConfigToken, Config);
services.addSingleton(ILoggerToken, Logger);
services.addSingleton(IDatabaseToken, Database, [IConfigToken]);
services.addSingleton(IUserRepositoryToken, UserRepository, [IDatabaseToken, ILoggerToken]);
services.addSingleton(IUserServiceToken, UserService, [IUserRepositoryToken, ILoggerToken]);

// Visualize dependency tree
console.log(services.visualizeDependencyTree(IUserServiceToken));

// Get dependency tree as object
const tree = services.getDependencyTree(IUserServiceToken);
console.log(JSON.stringify(tree, null, 2));
```

## Output

```
└── Symbol(IUserService) [SINGLETON]
    ├── Symbol(IUserRepository) [SINGLETON]
    │   ├── Symbol(IDatabase) [SINGLETON]
    │   │   └── Symbol(IConfig) [SINGLETON]
    │   └── Symbol(ILogger) [SINGLETON]
    └── Symbol(ILogger) [SINGLETON]
```

## Methods

### `getDependencyTree(token: Token): DependencyTreeNode`

Returns a tree structure showing all dependencies for a specific service token.

**Returns:**

- `DependencyTreeNode` object with:
  - `token`: The service token
  - `name`: Human-readable name
  - `lifetime`: Service lifetime (SINGLETON, SCOPED, TRANSIENT, CIRCULAR, NOT_REGISTERED)
  - `dependencies`: Array of dependency nodes
  - `depth`: Depth in the tree
  - `isCircular`: Whether this node is part of a circular dependency
  - `circularPath`: Path showing the circular dependency (if applicable)

### `visualizeDependencyTree(token: Token): string`

Returns a formatted string representation of the dependency tree, suitable for console output.

## Features

- **Tree Visualization**: See the complete dependency hierarchy
- **Circular Detection**: Automatically detects and marks circular dependencies
- **Lifetime Information**: Shows the lifetime of each service
- **Object Structure**: Get the tree as a structured object for programmatic use

## Run This Example

```bash
npx ts-node examples/18-dependency-tree.ts
```

**Full Example:** [Source Code](../../examples/18-dependency-tree.ts)
