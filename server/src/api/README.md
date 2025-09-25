# API Directory Structure

## Overview
This document provides an overview of the `api` directory structure used in our Node.js server. This directory is dedicated to defining Express API routes with a focus on clarity and maintainability.

## Directory Structure
The `api` directory follows a modular approach, where each subdirectory corresponds to a specific entity or aspect of the application. This structure ensures that API endpoints related to a specific functionality are grouped together, adhering to the principle of single responsibility.

### Example Directory Structure
```
api/
├── user/
│   ├── routes.ts
│   └── service.ts
├── product/
│   ├── routes.ts
│   └── service.ts
└── [other entities]/
    ├── routes.ts
    └── service.ts
```

## File Descriptions
Each subdirectory within the `api` directory should contain two main files:

### 1. `routes.ts`
This file is responsible for defining Express routes. Key responsibilities include:
- Defining API endpoints relevant to the module.
- Handling route parameter validation.
- Managing error handling specific to the API endpoints.

### 2. `service.ts`
This file handles the business logic required for the routes. It should:
- Contain functions and logic that the routes utilize.
- Be responsible for interacting with the database or other services.
- Ensure separation of concerns by abstracting business logic away from route handling.

## Guidelines for Adding New Modules
When adding a new module (e.g., a new entity like `order`), create a new directory under the `api` folder. This directory should follow the same structure as existing ones, containing both `routes.ts` and `service.ts` files.

## Best Practices
- Keep each module focused on a single responsibility. For example, the `user` directory should only include API endpoints dealing with user actions.
- Strive for consistency in how routes and services are implemented across different modules.
- Ensure that the business logic in the `service.ts` files is well abstracted and does not leak into the routing logic.