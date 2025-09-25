# Server Architecture

> 🖥️ **Overview of the Assistant MFE Server Architecture**

## Table of Contents

- [Overview](#overview)
- [Server Components](#server-components)
- [Proxy Functionality](#proxy-functionality)
- [API Routes](#api-routes)
- [Services](#services)

## Overview

The server-side of the  Assistant MFE functions primarily as a middleware layer between the client application and the backend services. It is built using Node.js with Express and provides API endpoints that proxy requests to the appropriate backend services.

The server handles authentication, request routing, and response formatting, ensuring that the client application can communicate effectively with the backend without being directly coupled to it.

## Server Components

### Core Components

The server architecture consists of the following core components:

- **Express Application**: The main Express application that handles HTTP requests
- **API Routes**: Express routers that define the API endpoints
- **Services**: Utility classes for backend URL configuration and other services

### Component Organization

```
server/
├── app.ts                  # Main Express application
├── index.ts                # Server entry point
├── @types/                 # TypeScript type definitions
└── src/
    ├── api/                # API routes and services
    │   ├── ai-assistance/   # AI Assistance-specific routes and services
    │   │   ├── routes.ts   # AI Assistance route definitions
    │   │   └── service.ts  # AI Assistance service configuration
    │   └── client/         # Client-specific routes
    ├── db/                 # Database interactions
    └── lib/                # Utility libraries
```

## Proxy Functionality

One of the primary functions of the server is to act as a proxy between the client and the backend services. This is implemented using the `express-http-proxy` middleware and custom handlers for Server-Sent Events (SSE).

### Proxy Implementation

```typescript
router.use(
  this.PATHS._BACKEND_PROXY,
  proxy(this.getProxyHostUrl, {
    proxyReqPathResolver: (req) => {
      const path = `${this.getProxyHostUrlPath(req)}${req.url.replace('/new_chat', "")}`;
      LOG.debug(`AIAssistantRoutes->${this.PATHS._BACKEND_PROXY} path, ${path}`);
      return path;
    },
    // Additional proxy configuration...
  })
);
```

### Server-Sent Events Handling

The server includes a special handler for Server-Sent Events (SSE) that properly streams the response from the backend service to the client:

```typescript
router.post(
  `${this.PATHS._BACKEND_PROXY}${this.USER_MESSAGE_PATH}`,
  async (req: AppRequest, res: express.Response) => {
    try {
      // Implementation for handling SSE
      // ...
      const readableStream = Readable.from(response.body);
      await pipelineAsync(readableStream, res);
    } catch (error) {
      // Error handling
    }
  }
);
```

## API Routes

### AI Assistance Routes

The AI Assistance routes are defined in the `AIAssistantRoutes` class, which provides the following endpoints:

- **POST /api/ai-assistance/proxy/chat/:chatId/user-message**: Endpoint for sending user messages to the AI Assistance
- **Various proxy endpoints**: Other endpoints that proxy requests to the backend service

### Route Configuration

The routes are configured using Express Promise Router, which allows for async/await syntax in route handlers:

```typescript
public static routes(): express.Router {
  const router = PromiseRouter();
  
  // Route definitions
  
  return router;
}
```

## Services

### AI Assistance Service

The `AIAssistantService` class provides configuration for the AI Assistance backend URL based on the user's region:

```typescript
export class AIAssistantService {
  public static getBackendUrl(region?: string): string {
    // Implementation that returns the appropriate backend URL based on region
  }
}
```

### Request/Response Processing

The server includes utility functions for processing requests and responses:

- **Creating proxy headers**: Functions for creating appropriate headers for proxy requests
- **URL resolution**: Functions for determining the appropriate backend URL
- **Response decoration**: Functions for modifying response headers and body

---

⚠️ **Note**: This server architecture documentation provides a high-level overview of the server-side structure. For more detailed information about specific API endpoints, refer to the [API Endpoints Documentation](./api-endpoints.md).
