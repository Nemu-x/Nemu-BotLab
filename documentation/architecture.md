# Application Architecture

This document provides an overview of the application architecture, including both frontend and backend components.

## Frontend Architecture

The frontend is built using Next.js 14, with React for component rendering, and follows a modular architecture.

### Core Modules

- **Authentication**: Handles user login, registration, and session management.
- **Dashboard**: Main application interface with statistics, activity monitoring, and system overview.
- **Chats**: Interface for managing client conversations and direct messaging.
- **Flows**: Visual editor for creating and managing conversation flows and dialogs.
- **Commands**: Management interface for bot commands and responses.
- **Operators**: Admin panel for managing system operators and their permissions.
- **Settings**: Application configuration interface.
- **Tickets**: Support ticket management system.

### Directory Structure

```
telegram-bot-frontend/
├── app/                      # Main application directory
│   ├── api/                  # API route handlers
│   ├── components/           # Shared UI components
│   ├── config/               # Frontend configuration
│   ├── (dashboard)/          # Dashboard alternative route group
│   ├── dashboard/            # Dashboard pages and components
│   │   ├── chats/            # Chat interface and history
│   │   ├── commands/         # Bot commands management
│   │   ├── components/       # Dashboard-specific components
│   │   ├── flows/            # Conversation flow editor
│   │   │   └── responses/    # Flow response management
│   │   ├── operators/        # Operator management
│   │   ├── settings/         # System settings
│   │   └── tickets/          # Ticket management
│   ├── hooks/                # Custom React hooks
│   ├── i18n/                 # Internationalization files
│   ├── login/                # Authentication pages
│   └── ru/                   # Russian localization routes
├── public/                   # Static assets
└── src/                      # Source files
    └── config/               # Application configuration
        └── api.ts            # API client configuration
```

### Key Components

1. **Layout Components**:
   - Main Layout: Provides the application shell with navigation and theme
   - Dashboard Layout: Specific layout for authenticated dashboard views

2. **UI Components**:
   - ChatInterface: Real-time messaging interface for client communications
   - ClientModal: Modal for viewing and managing client information
   - MessageInput: Component for composing and sending messages
   - Sidebar: Navigation sidebar for the dashboard area

3. **Data Management**:
   - API Client: Handles communication with the backend
   - Authentication Provider: Manages user session and permissions
   - Theme Provider: Handles dark/light theme switching

## Backend Architecture

The backend follows a modular architecture built with Express.js, using Sequelize as the ORM for database operations.

### Core Modules

- **Authentication**: User authentication, session management, and JWT handling
- **Client Management**: Handle client information and interactions
- **Message Handling**: Process incoming and outgoing messages
- **Telegram Integration**: Interface with the Telegram Bot API
- **Flow Engine**: Process conversation flows and dialog steps
- **Command Processing**: Handle bot commands and responses
- **Settings Management**: System configuration and settings
- **Ticket Management**: Support ticket handling and assignment

### Directory Structure

```
telegram-bot-backend/
├── src/                       # Source code
│   ├── auth/                  # Authentication logic
│   ├── config/                # Configuration files
│   ├── controllers/           # Request handlers
│   ├── dto/                   # Data transfer objects
│   ├── entities/              # Entity definitions
│   ├── middleware/            # Express middleware 
│   ├── middlewares/           # Additional middleware
│   ├── migrations/            # Database migrations
│   ├── models/                # Sequelize models
│   ├── routes/                # API route definitions
│   ├── scripts/               # Utility scripts
│   ├── seeders/               # Database seeders
│   ├── services/              # Business logic services
│   ├── telegram/              # Telegram bot integration
│   └── utils/                 # Utility functions
└── index.js                   # Application entry point
```

### Key Components

1. **Controllers**:
   - UserController: Handles user-related operations
   - ClientController: Manages client data and interactions
   - MessageController: Processes message exchanges
   - CommandController: Handles bot command configuration
   - FlowController: Manages conversation flows
   - TicketController: Handles support tickets

2. **Middleware**:
   - Authentication Middleware: Validates JWT tokens and user permissions
   - Error Handling Middleware: Catches and processes errors
   - Logging Middleware: Records system activity

3. **Services**:
   - TelegramService: Interfaces with the Telegram API
   - ChatService: Handles message processing and routing
   - FlowService: Executes conversation flows and tracks progress
   - NotificationService: Sends alerts and notifications

## Communication Flow

1. **Client Interaction Flow**:
   - User messages arrive via Telegram API
   - Messages are processed by the backend
   - Flow engine determines appropriate response
   - Response is sent back to the user via Telegram
   - Conversation is recorded for operators to view

2. **Operator Dashboard Flow**:
   - Operators log in through the authentication system
   - Dashboard displays client activity and system statistics
   - Operators can intervene in conversations
   - Direct messages can be sent to clients
   - Client information can be updated and managed

## Database Access Pattern

The application uses a repository pattern through Sequelize models, with controllers accessing data through defined model methods rather than direct database queries. This abstraction ensures consistent data access patterns throughout the application.

## Authentication and Security

The system uses JWT (JSON Web Tokens) for authentication, with role-based access control to different parts of the application. Tokens are verified through middleware that checks both token validity and user permissions before allowing access to protected resources. 