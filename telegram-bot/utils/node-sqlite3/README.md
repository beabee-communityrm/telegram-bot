# Deno SQLite3 Compatibility Layer for TypeORM

This project provides a compatibility layer for the Deno SQLite3 module ([denodrivers/sqlite3](https://github.com/denodrivers/sqlite3)), adapting its behavior to match that of the Node.js SQLite3 module ([TryGhost/node-sqlite3](https://github.com/TryGhost/node-sqlite3/tree/master)). This adaptation is essential for enabling the use of TypeORM with SQLite in a Deno environment, ensuring compatibility and consistent behavior across different platforms.

## Overview

TypeORM, a popular ORM for TypeScript, is designed to work seamlessly with various database drivers, including SQLite. However, the native SQLite module for Deno has differences in API and behavior compared to its Node.js counterpart. This project bridges these gaps, providing a unified interface that conforms to the expectations of TypeORM when using SQLite as the database.

## Features

- **API Alignment**: Aligns the Deno SQLite3 module's API with that of the Node.js SQLite3 module, ensuring compatibility with TypeORM's expectations.
- **Seamless Integration**: Offers a drop-in replacement for the Node.js SQLite3 module in Deno environments, requiring minimal to no changes in existing TypeORM configurations.
- **Consistent Behavior**: Ensures that SQLite operations behave consistently, regardless of whether they are executed in a Node.js or Deno context.

## Documentation Links

For more details on the APIs of the underlying SQLite modules, please refer to their respective documentation:

- Node.js SQLite3 module documentation: [https://github.com/TryGhost/node-sqlite3/wiki/API](https://github.com/TryGhost/node-sqlite3/wiki/API)
- Deno SQLite3 module documentation: [https://github.com/denodrivers/sqlite3/blob/main/doc.md](https://github.com/denodrivers/sqlite3/blob/main/doc.md)

## Getting Started

To use this compatibility layer in your Deno project with TypeORM, follow these steps:

1. **Install the Deno SQLite3 Module**: Ensure that you have the Deno SQLite3 module installed in your project.
2. **Integrate the Compatibility Layer**: Include this compatibility layer in your project to adapt the Deno SQLite3 module for use with TypeORM.
3. **Configure TypeORM**: Update your TypeORM configuration to use this compatibility layer as the SQLite driver.
   
```ts
import { DataSource } from 'npm:typeorm';
import nodeSqlite3 from './node-sqlite3/index.ts';

const dataSource = new DataSource({
    type: "sqlite",
    logging: true,
    ...
    driver: nodeSqlite3 // Use the compatibility layer as the SQLite driver
})

await dataSource.this.initialize();
```

## Potential for Standalone Project

While this compatibility layer is currently part of a the Beabee Telegram Bot project, there is potential for it to be spun off into a standalone project if there is sufficient interest. This would allow for more focused development and maintenance, and make it easier for users to integrate and contribute to the project.

## Contributing

Contributions to this project are welcome. If you encounter any issues or have suggestions for improvements, please submit them via the project's issue tracker.

