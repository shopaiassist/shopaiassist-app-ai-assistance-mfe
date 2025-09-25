# UI Components

> 🧩 **Documentation of the Assistance MFE UI Components**

## Table of Contents

- [Overview](#overview)
- [Core Components](#core-components)
- [Messaging Components](#messaging-components)
- [Support Ticket Components](#support-ticket-components)
- [Component Integration](#component-integration)

## Overview

The  Assistant MFE is built using a component-based architecture with React and TypeScript. Components are organized hierarchically and share state through context providers and Zustand stores. The component library includes UI elements from the  design system (`core-components/react`).

## Core Components

### AiAssistance

The root component that serves as the entry point for the MFE. It sets up the context providers and renders the appropriate view based on the application state.

**Key Responsibilities:**
- Provides context through `CtxAssistant` and `CtxAssistantContent`
- Toggles between chat and table views
- Manages support ticket form display

**Implementation:**

```typescript
const AiAssistant = ({ context, displayTable, messages, readOnly, resultPanel, ...props }: AiAssistantProps) => {
  const [tableView, setTableView] = useState(!!displayTable);
  const { closeSupportTicketForm, supportTicketFormDetails } = useSupportTicket();

  // Component implementation details
  
  return (
    <div id="ai-assistance-mfe">
      <MfeWrapper context={context}>
        <CtxAssistant.Provider value={props}>
          <CtxAssistantContent.Provider value={assistantContextValue}>
            {/* Conditional rendering of components */}
          </CtxAssistantContent.Provider>
        </CtxAssistant.Provider>
      </MfeWrapper>
    </div>
  );
};
```

### ChatInput

Component that provides the input field for user messages.

**Key Responsibilities:**
- Handles text input and submission
- Manages keyboard events (e.g., Enter to submit)
- Connects with file and skill actions
- Sends messages to the ai assistance

**Props:**
- `placeholder`: Optional placeholder text for the input field
- Additional HTML attributes from `React.HTMLAttributes<HTMLDivElement>`

**Implementation:**

```typescript
const ChatInput = ({ placeholder, ...props }: ChatInputProps): JSX.Element => {
  const [sendEvent] = useMFECommunication('isChatting');
  const { actions, chatIdentifier, createNewChat } = useAssistant();
  const { isBusy, sendMessageUsingActiveChat, setActiveChatId } = useChat();
  // Component implementation details
  
  return (
    <div className="chat-input" {...props}>
      <SafTextarea
        id="prompt"
        label={t('CHAT.ENTER_A_MESSAGE')}
        maxlength={CHAT_MESSAGE_MAX_LENGTH}
        onInput={(evt) => setValue(evt.currentTarget.currentValue)}
        onKeyDown={handleKeyDown}
        ref={textAreaEl}
        resize="none"
      />
      {/* Action buttons and policy information */}
    </div>
  );
};
```

### ResponseFeedback

Component that allows users to provide feedback on AI responses.

**Key Responsibilities:**
- Displays feedback options
- Submits feedback to the backend
- Manages feedback state

## Messaging Components

### ChatMessages

Component that displays the conversation between the user and the ai assistance.

**Key Responsibilities:**
- Renders messages in chronological order
- Handles message styling based on sender (user or AI)
- Manages message loading states

### Message

Base component for displaying individual messages.

**Types of Messages:**
- Text messages
- File messages
- Alert messages
- Flow messages (for AI skills)

### MessageText

Component for displaying text messages with formatting.

**Features:**
- Markdown rendering
- Code block highlighting
- Link detection

## Support Ticket Components

### SupportTicketButton

Button component for initiating a support ticket.

### SupportTicketForm

Form component for submitting support tickets.

**Key Responsibilities:**
- Collects user input for support tickets
- Validates form fields
- Submits ticket data to the backend

**Implementation:**

```typescript
const SupportTicketForm = (props: SupportTicketFormProps): JSX.Element => {
  // Component implementation details
  
  return (
    <form className="support-ticket-form" onSubmit={handleSubmit}>
      {/* Form fields and submission button */}
    </form>
  );
};
```

## Component Integration

Components in the  Assistant MFE are designed to work together through:

### Context Providers

The application uses React Context to share state and functionality between components:

- `CtxAssistant`: Provides base assistant props
- `CtxAssistantContent`: Provides content-related props

### Hooks Integration

Components use custom hooks to access shared functionality:

- `useAssistant`: Provides access to the assistant context
- `useChat`: Provides access to the chat store
- `useMFECommunication`: Facilitates communication with other micro-frontends

### Example Integration

```typescript
// Inside a component
const { actions, chatIdentifier } = useAssistant();
const { sendMessageUsingActiveChat } = useChat();

// Using these to send a message
const sendMessage = () => {
  sendMessageUsingActiveChat({ message, message_type: 'text' }, createNewChat)
    .catch(err => LOG.error(`Error sending message`, err));
};
```

---

⚠️ **Note**: This components documentation provides an overview of the main UI components. For more detailed information about state management, refer to the [State Management Documentation](./state-management.md).
