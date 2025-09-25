# Utility Functions

> 🛠️ **Documentation of the Assistance MFE Utility Functions**

## Table of Contents

- [Overview](#overview)
- [API Utilities](#api-utilities)
- [Authentication Utilities](#authentication-utilities)
- [Chat Utilities](#chat-utilities)
- [Date Utilities](#date-utilities)
- [Expression Utilities](#expression-utilities)
- [Miscellaneous Utilities](#miscellaneous-utilities)

## Overview

The  Assistant MFE includes various utility functions that provide common functionality across the application. These utilities are organized into modules based on their purpose and are used throughout the application to maintain consistency and reduce code duplication.

## API Utilities

API utilities handle communication with the server and backend services. The main modules for API communication are `api.ts`, `chatApi.ts`, and `assistantApi.ts`.

### api.ts

Contains core functions for making HTTP requests:

```typescript
export const apiCall = async ({ body, headers, method, url }: ApiCallParams): Promise<Response> => {
  // Implementation details
};

export const apiFunction = (endpoint: string, method: HttpMethod = 'GET') => <R, P = void>(
  getConfig: (params: P) => ApiConfig
): ((params?: P) => Promise<R>) => {
  // Implementation details
};

export const createProxyRequest = (endpoint: string, method: HttpMethod, params: unknown): ProxyRequest => {
  // Implementation details
};
```

### chatApi.ts

Provides methods for interacting with the chat backend:

```typescript
const ChatApi = {
  cancelFlow: apiFunction(ENDPOINTS.CANCEL_FLOW_MESSAGE)(() => ({ headers: getHeaders() })),
  create: apiFunction(ENDPOINTS.GET_CHATS, 'POST')<Chat.ListItem>(() => ({ headers: getHeaders() })),
  directMessage: async ({ chat_id, onMessage, request, setStreaming, type }: DirectChatMessage) => {
    // Implementation details
  },
  // Additional methods
};
```

### assistantApi.ts (Deprecated)

Contains legacy functions for interacting with the assistant API, most of which have been moved to chatApi.ts:

```typescript
export const getUserSalesForceProductList = async () => {
  // Implementation details
};

export const submitFeedback = async (payload: IFeedbackPayload) => {
  // Implementation details
};
```

## Authentication Utilities

Authentication utilities handle user authentication and permission checking.

### auth.ts

```typescript
export const getUserAuth = (): UserAuth | undefined => {
  try {
    const userAuth = sessionStorage.getItem('userAuth');
    return userAuth ? JSON.parse(userAuth) : undefined;
  } catch (e) {
    console.error('Error parsing userAuth from sessionStorage:', e);
    return undefined;
  }
};

export const hasPermission = (permission: string): boolean => {
  // Implementation details
};
```

## Chat Utilities

Chat utilities provide helper functions for processing chat messages and managing chat state.

### chat.ts

```typescript
export const cleanChatMessage = (msg: string): string => {
  // Implementation details
};

export const getFilesFromMessages = (messages: Chat.Message[]): Record<string, FileHandle> => {
  // Implementation details
};

export const isFilesMessage = (msg: Chat.Message): msg is Chat.MessageFiles => {
  // Implementation details
};

export const isFragment = (msg: unknown): msg is Chat.WithChat<Chat.MessageFragment> => {
  // Implementation details
};
```

## Date Utilities

Date utilities provide helper functions for formatting and manipulating dates.

### date.ts

```typescript
export const formatDate = (date: Date | string): string => {
  // Implementation details
};

export const isToday = (date: Date): boolean => {
  // Implementation details
};
```

## Expression Utilities

Expression utilities provide helper functions for working with regular expressions.

### expressions.ts

```typescript
export const escapeRegExp = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
```

## Miscellaneous Utilities

### system-shared.ts

Contains helper functions for working with the system:

```typescript
export const isBrowser = typeof window !== 'undefined';

export const noop = (): void => {
  // Do nothing
};
```

### pendo.ts

Contains functions for tracking analytics with Pendo:

```typescript
export const createPendoEvent = ({ name, data }: CreatePendoEventParams): PendoEvent => {
  // Implementation details
};

export const filterMessagesForPendo = (messages: Chat.Message[]): ChatMessageDto[] => {
  // Implementation details
};
```

### interfaces.ts

Contains TypeScript interfaces and types used throughout the application:

```typescript
export interface ApiCallParams {
  body?: BodyInit | null;
  headers?: HeadersInit;
  method: HttpMethod;
  url: string;
}

export interface IFeedbackPayload {
  documentId?: string;
  feedbackMessage?: string;
  feedbackRating: string;
  messageId?: string;
}
```

## Usage Examples

### Using API Utilities

```typescript
// In a component or store
const sendMessage = async () => {
  try {
    await ChatApi.directMessage({
      chat_id,
      request: { message, message_type: 'text' },
      type: 'message',
      onMessage: handleMessage,
      setStreaming: setStreamingState,
    });
  } catch (error) {
    console.error('Error sending message:', error);
  }
};
```

### Using Authentication Utilities

```typescript
// In a component or store
const userAuth = getUserAuth();
if (userAuth && hasPermission('create_chat')) {
  // Perform action that requires permission
}
```

### Using Chat Utilities

```typescript
// In a component or store
const cleanedMessage = cleanChatMessage(rawMessage);
const isMessageFragment = isFragment(messageData);
```

---

⚠️ **Note**: This utilities documentation provides an overview of the main utility functions. For more detailed information about specific utilities, refer to the source code files.
