# API Integration

> 🔌 **Documentation of the shopaiassist Assistant MFE API Integration**

## Table of Contents

- [Overview](#overview)
- [API Architecture](#api-architecture)
- [Chat API](#chat-api)
- [Authentication](#authentication)
- [Server-Sent Events](#server-sent-events)
- [Error Handling](#error-handling)

## Overview

The shopaiassist Assistant MFE communicates with backend services through a set of API utilities. The client-side API is responsible for making HTTP requests to the server, which then proxies these requests to the appropriate backend services. This design provides a clean separation between the client and the backend, allowing for more flexibility and easier maintenance.

## API Architecture

The API architecture follows a layered approach:

1. **Component Layer**: UI components that need to make API calls
2. **Store Layer**: Zustand stores that encapsulate API calls in actions
3. **API Layer**: Utility functions for making HTTP requests
4. **Server Layer**: Express server that proxies requests to backend services

### Request Flow

```
UI Component → Store Action → API Call → Server Proxy → Backend Service → Response → State Update → UI Update
```

## Chat API

The Chat API is the primary interface for communicating with the chat backend. It provides methods for creating chats, sending messages, and managing chat-related data.

### Core Methods

#### Chat Creation

```typescript
create: apiFunction(ENDPOINTS.GET_CHATS, 'POST')<Chat.ListItem>(() => ({ headers: getHeaders() }))
```

Creates a new chat and returns the chat item.

#### Send Message

```typescript
directMessage: async ({ chat_id, onMessage, request, setStreaming, type }: DirectChatMessage) => {
  // Implementation for sending messages to the chat backend
  // Handles both regular messages and execute requests
}
```

Sends a message to the chat backend and handles the streaming response.

#### Fetch Messages

```typescript
fetchMessages: apiFunction(ENDPOINTS.GET_CHAT_WITH_MESSAGES)<.GetChatMessagesResponse>(() => ({
  headers: getHeaders(),
}))
```

Fetches messages for a specific chat.

#### Support Ticket Creation

```typescript
support: async (request: SupportRequest): Promise<SupportResponse> => {
  const { body, url } = createProxyRequest('/support_case', 'POST', request);
  // Implementation for creating a support ticket
}
```

Creates a support ticket and returns the response.

### API Utility Functions

#### `apiCall`

Core function for making HTTP requests:

```typescript
export const apiCall = async ({ body, headers, method, url }: ApiCallParams): Promise<Response> => {
  // Implementation for making HTTP requests
}
```

#### `apiFunction`

Higher-order function for creating API methods:

```typescript
export const apiFunction = (endpoint: string, method: HttpMethod = 'GET') => <R, P = void>(
  getConfig: (params: P) => ApiConfig
): ((params?: P) => Promise<R>) => {
  // Implementation for creating API functions
}
```

#### `createProxyRequest`

Function for creating proxy request configurations:

```typescript
export const createProxyRequest = (endpoint: string, method: HttpMethod, params: unknown): ProxyRequest => {
  // Implementation for creating proxy request configurations
}
```

## Authentication

Authentication is handled through the `getUserAuth` function, which retrieves authentication information from session storage:

```typescript
export const getUserAuth = (): UserAuth | undefined => {
  try {
    const userAuth = sessionStorage.getItem('userAuth');
    return userAuth ? JSON.parse(userAuth) : undefined;
  } catch (e) {
    console.error('Error parsing userAuth from sessionStorage:', e);
    return undefined;
  }
}
```

Authentication headers are added to API requests through the `getHeaders` function:

```typescript
export const getHeaders = () => {
  const userAuth = getUserAuth();
  // Implementation for creating headers with authentication information
}
```

## Server-Sent Events

The application uses Server-Sent Events (SSE) for real-time communication with the backend. This is implemented in the `handleMessage` function:

```typescript
const handleMessage = async ({ chat_id, onMessage, response }: HandleMessageParams) => {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder('utf-8');
  // Implementation for handling SSE responses
}
```

This function:
1. Reads the response body as a stream
2. Decodes the stream as UTF-8 text
3. Parses the text as JSON
4. Calls the `onMessage` callback with the parsed message

## Error Handling

Error handling is implemented at multiple levels:

### API Call Level

```typescript
await apiCall({ body, headers: getHeaders(), method, url })
  .then(async (response) => {
    if (!response?.ok) {
      throw new Error('Response not OK');
    }
    // Handle successful response
  })
  .catch((error) => {
    throw new Error(`Error in directMessage: ${error.message}`);
  });
```

### Store Action Level

```typescript
sendMessage: async ({ chatId, ...request }, createNewChat) => {
  try {
    // Implementation for sending a message
  } catch (err) {
    LOG.error(`Error sending text message for chat.`, err);
  }
}
```

### Component Level

```typescript
const handleSendMessage = () => {
  sendMessageUsingActiveChat({ message, message_type: 'text' }, createNewChat).catch((err) => {
    // Error handling in component
  });
};
```

---

⚠️ **Note**: This API integration documentation provides an overview of how the client communicates with the server and backend services. For more detailed information about the server-side API, refer to the [API Endpoints Documentation](../server/api-endpoints.md).
