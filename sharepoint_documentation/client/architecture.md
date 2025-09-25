# Client Architecture

> 🏗️ **Overview of the shopaiassist Assistant MFE Client Architecture**

## Table of Contents

- [Overview](#overview)
- [Core Components](#core-components)
- [State Management](#state-management)
- [Communication Flow](#communication-flow)
- [Integration Points](#integration-points)

## Overview

The client-side of the shopaiassist Assistant MFE is built using React and TypeScript. It follows a micro-frontend architecture pattern, allowing it to be embedded within a larger application while maintaining its own state and functionality.

The application is structured as a modular, component-based system with clear separation of concerns between UI components, state management, and API communication.

## Core Components

### Component Hierarchy

```
AiAssistant (Root Component)
├── MfeWrapper
│   ├── Chat View
│   │   ├── ChatMessages
│   │   ├── ChatInput
│   │   └── NewChat
│   ├── ChatResults View (Table View)
│   ├── ResultPanel
│   └── SupportTicketForm
```

### Key Components

#### AiAssistant

The root component that serves as the entry point for the MFE. It sets up the context providers and renders the appropriate view based on the application state.

```typescript
const AiAssistant = ({ context, displayTable, messages, readOnly, resultPanel, ...props }: AiAssistantProps) => {
  // Component implementation
}
```

The component accepts various props that define its behavior:
- `context`: MFE context information
- `displayTable`: Flag to toggle between chat and table views
- `messages`: Message components to render
- `readOnly`: Flag to indicate if the chat is read-only
- `resultPanel`: Content for the result panel

#### Chat View

Displays the chat interface with messages and input field.

#### ChatResults View

Displays chat information in a table format.

#### ResultPanel

Displays additional information related to the current chat.

#### SupportTicketForm

Provides functionality for creating support tickets.

## State Management

The application uses Zustand for state management, which provides a lightweight and flexible approach to managing state.

### Main Stores

- **Chat Store**: Manages chat-related state including messages, active chat, and loading states
- **User Store**: Manages user-related information
- **Support Ticket Store**: Manages support ticket creation and submission
- **Response Feedback Store**: Manages feedback for AI responses

### Example Store (Response Feedback)

```typescript
// Simplified representation
const useResponseFeedback = create<ResponseFeedbackStore>((set) => ({
  isFeedbackOpen: false,
  feedbackMessage: '',
  setFeedbackOpen: (isOpen) => set({ isFeedbackOpen: isOpen }),
  setFeedbackMessage: (message) => set({ feedbackMessage: message }),
  // Other actions...
}));
```

## Communication Flow

The client application communicates with the server through a set of API utilities:

1. **API Call**: Core function for making HTTP requests
2. **Chat API**: Specific functions for chat operations
3. **Assistant API**: Functions for interacting with the ai assistance

### API Communication Pattern

```
UI Component → API Call → Server → Backend Service → Response → State Update → UI Update
```

## Integration Points

### Micro-Frontend Communication

The application uses custom events for communication with other micro-frontends via the `useMFECommunication` hook.

```typescript
useMFECommunication('chat_item_selected', () => {
  // Handler implementation
});
```

### External Component Integration

The application can integrate external components through the component factory pattern:

```typescript
const externalComponent = messages.skill(message, {
  cancelFlow,
  cancelRequest,
  executeRequest,
  initialRequest: false,
});
```

---

⚠️ **Note**: This architecture documentation provides a high-level overview of the client-side structure. For more detailed information about specific components, refer to the [Components Documentation](./components.md).
