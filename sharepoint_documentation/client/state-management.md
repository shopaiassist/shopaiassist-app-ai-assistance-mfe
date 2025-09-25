# State Management

> 🔄 **Documentation of the  Assistance MFE State Management**

## Table of Contents

- [Overview](#overview)
- [Zustand Store Pattern](#zustand-store-pattern)
- [Core Stores](#core-stores)
- [State Actions](#state-actions)
- [State Integration](#state-integration)

## Overview

The Assistance MFE uses Zustand for state management, which provides a lightweight and flexible approach to managing application state. The state is organized into multiple stores, each responsible for a specific domain of the application.

## Zustand Store Pattern

Zustand offers a simpler alternative to Redux, with less boilerplate and a more straightforward API. The pattern used in the  Assistance MFE is as follows:

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Define the state and actions interface
interface MyStore {
  // State properties
  someState: string;
  
  // Actions
  updateState: (newValue: string) => void;
}

// Create the store
export const useMyStore = create<MyStore>()(
  devtools(
    (set) => ({
      // Initial state
      someState: '',
      
      // Actions
      updateState: (newValue) => set({ someState: newValue }, false, 'updateState'),
    }),
    { name: 'MyStore' } // DevTools name
  )
);
```

## Core Stores

### Chat Store

The most complex store in the application, responsible for managing chat-related state.

**State Properties:**

```typescript
export interface ChatState {
  activeChatId?: string;
  allowedSkills: Chat.FlowRequestType[];
  chats: Record<string, Chat.ListItem>;
  fetching: string[];
  files: Record<string, FileHandle>;
  messages: Record<string, Chat.Message[]>;
  notifications: string[];
  pendingRequest: boolean;
  sending?: Chat.MessageCreate;
  streaming: boolean;
}
```

**Key Actions:**

```typescript
interface ChatActions {
  cancelFlow: (request: CancelFlowRequest) => Promise<void>;
  cancelRequest: (request: Chat.CancelRequest) => Promise<void>;
  createChat: () => Promise<string>;
  executeRequest: (request: Chat.FormRequest) => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  handleFragment: (msg: Chat.WithChat<Chat.MessageFragment>) => void;
  handleMessage: (msg: Chat.WithChat<Chat.Message>) => void;
  isBusy: () => boolean;
  messageShown: (request: Chat.WithChat<Chat.CancelRequest>) => Promise<void>;
  sendMessage: (
    request: Chat.MessageCreate & { chatId?: string },
    createNewChat?: () => Promise<string>
  ) => Promise<void>;
  sendMessageUsingActiveChat: (
    request: Chat.MessageCreate,
    createNewChat?: () => Promise<string>,
    trackPendo?: (event: PendoEvent) => void
  ) => Promise<void>;
  setActiveChatId: (chatId?: string) => void;
  setTrackPendo: (trackPendo: (event: PendoEvent) => void) => void;
  trackPendo: (event: PendoEvent) => void;
}
```

### Response Feedback Store

Manages the state for the response feedback component.

**State and Actions:**

```typescript
interface ResponseFeedbackStore {
  isFeedbackOpen: boolean;
  feedbackMessage: string;
  
  setFeedbackOpen: (isOpen: boolean) => void;
  setFeedbackMessage: (message: string) => void;
  // Additional actions...
}
```

### Support Ticket Store

Manages the state for support ticket creation and submission.

**State and Actions:**

```typescript
interface SupportTicketStore {
  supportTicketFormDetails?: SupportTicketFormDetails;
  
  openSupportTicketForm: (details: SupportTicketFormDetails) => void;
  closeSupportTicketForm: () => void;
  // Additional actions...
}
```

### User Store

Manages user-related information.

**State and Actions:**

```typescript
interface UserStore {
  userId?: string;
  userProfile?: UserProfile;
  
  setUserId: (userId: string) => void;
  setUserProfile: (profile: UserProfile) => void;
  // Additional actions...
}
```

## State Actions

### Chat Actions

#### `createChat`

Creates a new chat and adds it to the store.

```typescript
createChat: async () => {
  const chat = await ChatApi.create();
  
  set(
    (state) => ({
      chats: { ...state.chats, [chat.id]: chat },
    }),
    false,
    ACTION_TYPES.CREATE_CHAT
  );
  return chat.id;
}
```

#### `sendMessage`

Sends a message to a chat, handling chat creation if necessary.

```typescript
sendMessage: async ({ chatId, ...request }, createNewChat) => {
  const external = !!createNewChat;
  let chat_id = chatId;
  if (!chat_id) {
    chat_id = await (external ? createNewChat() : get().createChat());
    
    if (external) {
      get().setActiveChatId(chat_id);
    }
  }
  set({ sending: request }, false, ACTION_TYPES.SEND_MESSAGE);
  await ChatApi.directMessage({
    chat_id,
    request,
    type: 'message',
    onMessage: (msg) => (isFragment(msg) ? get().handleFragment(msg) : get().handleMessage(msg)),
    setStreaming: (streaming) => set({ streaming }, false, ACTION_TYPES.SEND_MESSAGE),
  });
}
```

#### `handleMessage`

Handles an incoming message, updating the messages store.

```typescript
handleMessage: ({ chat_id, ...msg }) => {
  set(
    (state) => {
      const messages = state.messages[chat_id] || [];
      const newMsg = messages.find(({ id }) => id === msg.id) === undefined;
      const updatedMessages = newMsg ? [...messages, msg] : messages.map((m) => (m.id === msg.id ? msg : m));
      
      // Additional handling for files and analytics
      
      return {
        ...state,
        messages: { ...state.messages, [chat_id]: updatedMessages },
        files: updatedFiles,
        sending: updatedSending,
      };
    },
    false,
    ACTION_TYPES.HANDLE_MESSAGE
  );
}
```

### Response Feedback Actions

#### `setFeedbackOpen`

Opens or closes the feedback dialog.

```typescript
setFeedbackOpen: (isOpen) => set({ isFeedbackOpen: isOpen })
```

#### `submitFeedback`

Submits feedback to the backend.

```typescript
submitFeedback: async (params) => {
  await ApiClient.submitFeedback(params);
  set({ isFeedbackOpen: false, feedbackMessage: '' });
}
```

## State Integration

### Using State in Components

Components access the state through hooks provided by each store:

```typescript
const ChatComponent = () => {
  const { messages, sendMessage } = useChat();
  const { isFeedbackOpen, setFeedbackOpen } = useResponseFeedback();
  
  // Component implementation using state and actions
};
```

### State Updates and UI Rendering

When state is updated through an action, Zustand automatically triggers a re-render of any components that are subscribed to the updated state properties:

```typescript
// Inside ChatMessages component
const messages = useChat((state) => state.messages[state.activeChatId] || []);

// Component will re-render when messages for the active chat change
```

### DevTools Integration

The state stores are enhanced with the `devtools` middleware, which provides integration with the Redux DevTools browser extension for debugging:

```typescript
export const useChat = create<ChatActions & ChatState>()(
  devtools(
    (set, get) => ({
      // Store implementation
    }),
    { name: 'AiAssistantChatStore' }
  )
);
```

---

⚠️ **Note**: This state management documentation provides an overview of how state is managed in the application. For more detailed information about the API integration, refer to the [API Integration Documentation](./api-integration.md).
