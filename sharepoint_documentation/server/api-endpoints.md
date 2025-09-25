# API Endpoints

> 🔗 **Documentation of the  Assistant MFE Server API Endpoints**

## Table of Contents

- [Overview](#overview)
- [Endpoint Structure](#endpoint-structure)
- [AI Assistance Endpoints](#ai-assistance-endpoints)
- [Proxy Functionality](#proxy-functionality)
- [Authentication](#authentication)
- [Response Formats](#response-formats)

## Overview

The Assistant MFE server provides a set of API endpoints that serve as a middleware layer between the client application and the backend services. These endpoints primarily proxy requests to the appropriate backend services, handling authentication, request transformation, and response formatting.

## Endpoint Structure

All server API endpoints follow this structure:

```
/api/{service-name}/{endpoint-path}
```

Where:
- `{service-name}` is the name of the service (e.g., `ai-assistance`)
- `{endpoint-path}` is the specific path for the endpoint

## AI Assistance Endpoints

### Chat Message Endpoints

These endpoints handle chat-related operations, such as sending messages, retrieving chat history, and managing chat sessions.

#### POST /api/ai-assistance/proxy/chat/:chatId/user-message

Sends a user message to the AI Assistance backend and streams the response back to the client using Server-Sent Events (SSE).

**Path Parameters:**
- `chatId`: ID of the chat session

**Request Body:**
```json
{
  "message": "User message text",
  "message_type": "text"
}
```

**Response:**
- Server-Sent Events stream with message fragments and complete messages

#### Proxy Endpoints

The server also provides generic proxy endpoints that forward requests to the backend service:

```
GET|PUT|POST|DELETE /api/ai-assistance/proxy/...
```

These endpoints proxy the request to the AI Assistance backend and return the response to the client.

## Proxy Functionality

The server includes specialized proxy functionality to handle different types of requests:

### Standard Proxy

For most requests, the server uses the `express-http-proxy` middleware to proxy the request to the backend service:

```typescript
router.use(
  this.PATHS._BACKEND_PROXY,
  proxy(this.getProxyHostUrl, {
    proxyReqPathResolver: (req) => {
      const path = `${this.getProxyHostUrlPath(req)}${req.url.replace('/new_chat', "")}`;
      return path;
    },
    // Additional configuration
  })
);
```

### Server-Sent Events Proxy

For SSE requests, the server uses a custom handler to properly stream the response back to the client:

```typescript
router.post(
  `${this.PATHS._BACKEND_PROXY}${this.USER_MESSAGE_PATH}`,
  async (req: AppRequest, res: express.Response) => {
    try {
      // Fetch from backend and stream response
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(req.body),
      });
      
      if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
        const readableStream = Readable.from(response.body);
        await pipelineAsync(readableStream, res);
      }
    } catch (error) {
      // Error handling
    }
  }
);
```

## Authentication

The server handles authentication by:

1. Receiving the user's authentication token from the client
2. Using the token to authenticate requests to the backend service
3. Including appropriate headers in the proxy request

Authentication is implemented through request headers:

```typescript
private static createProxyHeaders(
  originalHeaders: Record<string, string | string[] | undefined>
): Record<string, string> {
  const proxyHeaders: Record<string, string> = {};

  Object.entries(originalHeaders).forEach(([key, value]) => {
    if (value !== undefined && typeof value === 'string') {
      proxyHeaders[key] = value;
    }
    else if (Array.isArray(value)) {
      proxyHeaders[key] = value.join(', ');
    }
  });

  return proxyHeaders;
}
```

## Response Formats

The API endpoints return responses in different formats depending on the endpoint and request type:

### JSON Responses

Most endpoints return JSON responses with the following structure:

```json
{
  "property1": "value1",
  "property2": "value2",
  ...
}
```

### Server-Sent Events

SSE endpoints return a stream of events with the following format:

```
data: {"chat_id":"123","id":"456","message":"Hello","sender":"ai",...}
```

Each event represents a message fragment or a complete message. The client is responsible for processing these events and updating the UI accordingly.

### Error Responses

Error responses include a status code and an error message:

```json
{
  "error": "Error message"
}
```

---

⚠️ **Note**: This API endpoints documentation provides an overview of the server API endpoints. For more detailed information about the server architecture, refer to the [Server Architecture Documentation](./architecture.md).
