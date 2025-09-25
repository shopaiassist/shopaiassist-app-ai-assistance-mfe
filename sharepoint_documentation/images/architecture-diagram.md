# Architecture Diagrams

This file contains Mermaid diagram code that can be used to generate architecture diagrams for the  Assistant MFE.

## Application Architecture Diagram

```mermaid
graph TD
    classDef client fill:#d0e0ff,stroke:#0066cc
    classDef server fill:#ffe0d0,stroke:#cc6600
    classDef external fill:#e0ffd0,stroke:#66cc00

    %% Client Components
    Client[Client Application] --> |uses| Components
    Client --> |manages state with| StateManagement
    Client --> |makes requests via| ClientAPI
    
    %% Client Components Detail
    Components --> AiAssistant
    Components --> ChatMessages
    Components --> ChatInput
    Components --> ResponseFeedback
    Components --> SupportTicket
    
    %% State Management Detail
    StateManagement --> ChatStore[Chat Store]
    StateManagement --> UserStore[User Store]
    StateManagement --> FeedbackStore[Feedback Store]
    StateManagement --> SupportStore[Support Ticket Store]
    
    %% Client API Detail
    ClientAPI --> APICalls[API Calls]
    ClientAPI --> SSEHandling[SSE Handling]
    
    %% Server Components
    ClientAPI --> |sends requests to| Server
    Server --> |routes requests with| ExpressRoutes
    Server --> |uses| Services
    Server --> |proxies to| BackendServices
    
    %% Server Detail
    ExpressRoutes --> AIAssistantRoutes
    Services --> AIAssistantService
    
    %% Backend Services
    BackendServices --> |communication with| Backend[ Backend]
    
    %% Class Styling
    class Client client
    class Components client
    class StateManagement client
    class ClientAPI client
    class AiAssistant client
    class ChatMessages client
    class ChatInput client
    class ResponseFeedback client
    class SupportTicket client
    class ChatStore client
    class UserStore client
    class FeedbackStore client
    class SupportStore client
    class APICalls client
    class SSEHandling client
    
    class Server server
    class ExpressRoutes server
    class Services server
    class AIAssistantRoutes server
    class AIAssistantService server
    
    class BackendServices external
    class Backend external
```

## Client-Side Architecture Diagram

```mermaid
graph TD
    classDef component fill:#d0e0ff,stroke:#0066cc
    classDef store fill:#ffe0d0,stroke:#cc6600
    classDef api fill:#e0ffd0,stroke:#66cc00
    classDef hook fill:#f0d0ff,stroke:#9900cc

    %% Root Component
    AiAssistant[AiAssistant.tsx] --> MfeWrapper
    AiAssistant --> CtxProviders[Context Providers]
    
    %% Main Views
    AiAssistant --> |conditional render| Chat[Chat View]
    AiAssistant --> |conditional render| ChatResults[Table View]
    AiAssistant --> |conditional render| SupportTicketForm
    AiAssistant --> ResultPanel
    
    %% Chat View Components
    Chat --> ChatMessages
    Chat --> ChatInput
    Chat --> NewChat
    
    %% ChatMessages Sub-components
    ChatMessages --> Message
    Message --> MessageText
    Message --> MessageFiles
    Message --> MessageFlags
    
    %% Store Integration
    ChatStore[Chat Store] --> |state & actions| Chat
    ChatStore --> |state & actions| ChatInput
    ChatStore --> |state & actions| ChatMessages
    
    ResponseFeedbackStore[Response Feedback Store] --> |state & actions| ResponseFeedback
    ResponseFeedback --> |used by| Message
    
    SupportTicketStore[Support Ticket Store] --> |state & actions| SupportTicketForm
    SupportTicketStore --> |state & actions| SupportTicketButton
    
    %% API Integration
    ChatApi[Chat API] --> |used by| ChatStore
    AssistantApi[Assistant API] --> |used by| ResponseFeedbackStore
    
    %% Hooks
    useMFECommunication --> |used by| AiAssistant
    useMFECommunication --> |used by| ChatInput
    
    useChat[useChat Hook] --> |exposes| ChatStore
    useAssistant[useAssistant Hook] --> |exposes| CtxProviders
    
    %% Class Styling
    class AiAssistant component
    class MfeWrapper component
    class CtxProviders component
    class Chat component
    class ChatResults component
    class SupportTicketForm component
    class ResultPanel component
    class ChatMessages component
    class ChatInput component
    class NewChat component
    class Message component
    class MessageText component
    class MessageFiles component
    class MessageFlags component
    class ResponseFeedback component
    class SupportTicketButton component
    
    class ChatStore store
    class ResponseFeedbackStore store
    class SupportTicketStore store
    
    class ChatApi api
    class AssistantApi api
    
    class useMFECommunication hook
    class useChat hook
    class useAssistant hook
```

## Server-Side Architecture Diagram

```mermaid
graph TD
    classDef route fill:#d0e0ff,stroke:#0066cc
    classDef service fill:#ffe0d0,stroke:#cc6600
    classDef middleware fill:#e0ffd0,stroke:#66cc00
    classDef external fill:#f0d0ff,stroke:#9900cc

    %% Express Application
    ExpressApp[Express App] --> AIAssistantRoutes
    ExpressApp --> ClientRoutes
    
    %% AI Assistance Routes
    AIAssistantRoutes --> SSEHandler[SSE Handler]
    AIAssistantRoutes --> StandardProxy[Standard Proxy]
    
    %% Services
    AIAssistantService --> |used by| AIAssistantRoutes
    AIAssistantService --> BackendUrlResolver[Backend URL Resolver]
    
    %% Proxy Configuration
    SSEHandler --> ProxyRequest[Proxy Request]
    StandardProxy --> ProxyRequest
    
    %% External Services
    ProxyRequest --> |forwards to| Backend[ Backend]
    
    %% Class Styling
    class ExpressApp route
    class AIAssistantRoutes route
    class ClientRoutes route
    class SSEHandler route
    class StandardProxy route
    
    class AIAssistantService service
    class BackendUrlResolver service
    
    class ProxyRequest middleware
    
    class Backend external
```

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant ChatInput
    participant ChatStore
    participant ChatApi
    participant ServerRoutes as Server Routes
    participant BackendService as Backend Service
    
    User->>ChatInput: Types message
    ChatInput->>ChatStore: sendMessage action
    
    ChatStore->>ChatApi: directMessage
    ChatApi->>ServerRoutes: POST /api/ai-assistance/proxy/chat/:chatId/user-message
    ServerRoutes->>BackendService: Proxy request
    
    BackendService-->>ServerRoutes: Stream SSE response
    ServerRoutes-->>ChatApi: Stream SSE response
    ChatApi-->>ChatStore: handleFragment/handleMessage
    
    ChatStore-->>ChatInput: Update UI state
    ChatInput-->>User: Show response
```

You can use these diagrams in your documentation by either:

1. Using a Mermaid-compatible renderer (like GitHub or many markdown editors)
2. Copying the code into a Mermaid live editor (https://mermaid.live/) to generate an image
3. Using a Mermaid CLI tool to generate static images

The diagrams provide a visual representation of the application architecture, component relationships, and data flow.
