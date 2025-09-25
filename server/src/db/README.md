# DB Directory Structure

## Overview
This document serves as a guide to the `db` (database) directory of our Node.js server. This directory is crucial for all database-related logic, ensuring a clean and maintainable codebase. It is divided into two primary subdirectories: `schema` and `dao` (Data Access Object).

## Structure and Purpose

### Directory Structure
```
db/
├── schema/
│   ├── connection.ts
│   ├── [table-name].ts
│   └── [other schema files]
└── dao/
    ├── userDAO.ts
    ├── productDAO.ts
    └── [other DAO files]
```

### Schema Directory (`schema/`)
The `schema` directory is responsible for:
- Establishing and maintaining the database connection.
- Storing raw SQL/NoSQL queries and schema definitions.
- Managing database migrations and seed data.

#### Key Components
- `connection.ts`: Manages the connection to the database.
- SQL files: Contain raw SQL queries for table creation, modifications, and other schema-related operations.

### DAO Directory (`dao/`)
The `dao` (Data Access Object) directory plays a critical role in abstracting the database layer from the rest of the application. Its responsibilities include:
- Providing an abstraction layer over direct database queries.
- Serving as the primary point of interaction for services requiring database access.
- Ensuring that business logic remains separate from database-related operations.

#### Key Components
- DAO files (e.g., `userDAO.ts`, `productDAO.ts`): Each file corresponds to a different table or domain in the database and contains methods for interacting with that specific part of the database.

## Guidelines for Interacting with the Database
- All direct database queries and connections should be handled within the `schema` directory.
- Services should use DAOs for all database interactions. Direct queries in service files are discouraged to maintain a separation of concerns.
- DAO methods should be clear and descriptive, indicating the nature of the database operation being performed.

## Best Practices
- Keep the database logic modular and well-encapsulated within the DAOs.
- Regularly review and refactor DAOs to ensure they align with changes in the database schema.
- Aim for a design that facilitates easy changes or upgrades to the database without significant alterations in the business logic layers.

## Future Considerations
By abstracting database queries away from the main codebase, we prepare our application for easier upgrades, database swaps, or transitions to federated databases. The `db` directory's structure is designed to centralize and streamline all database interactions, making future modifications more manageable.
