# Database Structure and API Documentation

## Database Tables

### roles
- **id** (INTEGER, PRIMARY KEY) - Unique identifier for the role
- **name** (STRING, NOT NULL, UNIQUE) - Role name (super_admin, admin, operator)
- **created_at** (DATE) - Creation timestamp
- **updated_at** (DATE) - Last update timestamp

### users
- **id** (INTEGER, PRIMARY KEY) - Unique identifier for the user
- **username** (STRING, NOT NULL, UNIQUE) - User's login name
- **email** (STRING, UNIQUE) - User's email address
- **password_hash** (STRING, NOT NULL) - Hashed password
- **role_id** (INTEGER, FK -> roles.id) - Reference to user's role
- **is_active** (BOOLEAN) - Whether the user account is active
- **last_login_at** (DATE) - When user last logged in
- **created_at** (DATE) - Creation timestamp
- **updated_at** (DATE) - Last update timestamp

### clients
- **id** (INTEGER, PRIMARY KEY) - Unique identifier for the client
- **telegram_id** (STRING, NOT NULL, UNIQUE) - Telegram user ID
- **username** (STRING) - Telegram username
- **first_name** (STRING) - First name
- **last_name** (STRING) - Last name
- **notes** (TEXT) - Admin/operator notes about the client
- **is_blocked** (BOOLEAN) - Whether the client is blocked
- **ban_reason** (TEXT) - Reason for ban if client is blocked
- **preferred_language** (STRING) - Client's preferred language
- **tags** (JSON) - Tags associated with the client
- **operator_id** (INTEGER, FK -> users.id) - Assigned operator
- **last_message_at** (DATE) - When the client last sent/received a message
- **is_direct_chat_enabled** (BOOLEAN) - Whether direct chat with operators is enabled
- **last_direct_chat_at** (DATE) - When the client last had a direct chat
- **created_at** (DATE) - Creation timestamp
- **updated_at** (DATE) - Last update timestamp

### messages
- **id** (INTEGER, PRIMARY KEY) - Unique identifier for the message
- **client_id** (INTEGER, FK -> clients.id) - Reference to the client
- **content** (TEXT, NOT NULL) - Message content
- **is_from_bot** (BOOLEAN) - Whether message was sent by the bot
- **is_read** (BOOLEAN) - Whether message has been read
- **telegram_message_id** (STRING) - Telegram's message ID
- **is_direct_message** (BOOLEAN) - Whether this is a direct message to/from an operator
- **button_click_data** (JSON) - Data from button clicks in inline keyboards
- **dialog_step_id** (INTEGER) - Current dialog step ID
- **response_to_step_id** (INTEGER) - Which step this message is a response to
- **location_data** (JSON) - Location data if message contains location
- **contact_data** (JSON) - Contact data if message contains contact
- **flow_id** (INTEGER, FK -> flows.id) - Reference to the flow
- **flow_step_id** (INTEGER, FK -> steps.id) - Reference to the flow step
- **responded_by** (INTEGER, FK -> users.id) - Reference to the user who responded
- **created_at** (DATE) - Creation timestamp
- **updated_at** (DATE) - Last update timestamp

### commands
- **id** (INTEGER, PRIMARY KEY) - Unique identifier for the command
- **question** (STRING, NOT NULL) - Command trigger text
- **answer** (TEXT, NOT NULL) - Response text
- **description** (STRING) - Command description
- **type** (STRING) - Command type (text, slash, regex)
- **priority** (INTEGER) - Command priority
- **match_type** (STRING) - How to match the command (exact, contains, regex)
- **is_active** (BOOLEAN) - Whether command is active
- **created_by** (INTEGER, FK -> users.id) - Reference to the user who created it
- **created_at** (DATE) - Creation timestamp
- **updated_at** (DATE) - Last update timestamp

### settings
- **id** (INTEGER, PRIMARY KEY) - Unique identifier for the settings
- **bot_token** (STRING, NOT NULL) - Telegram bot token
- **webhook_url** (STRING) - URL for Telegram webhook
- **welcome_message** (TEXT) - Message sent to new users
- **default_response** (TEXT) - Default response for unrecognized commands
- **created_at** (DATE) - Creation timestamp
- **updated_at** (DATE) - Last update timestamp

### flows
- **id** (INTEGER, PRIMARY KEY) - Unique identifier for the flow
- **name** (STRING, NOT NULL) - Flow name
- **description** (STRING) - Flow description
- **is_active** (BOOLEAN) - Whether flow is active
- **is_default** (BOOLEAN) - Whether this is the default flow
- **created_at** (DATE) - Creation timestamp
- **updated_at** (DATE) - Last update timestamp

### steps
- **id** (INTEGER, PRIMARY KEY) - Unique identifier for the step
- **flow_id** (INTEGER, FK -> flows.id) - Reference to the flow
- **title** (STRING) - Step title
- **text** (TEXT) - Step text content
- **next_step_id** (INTEGER, FK -> steps.id) - Reference to the next step
- **buttons** (JSON) - Button configuration
- **conditions** (JSON) - Conditions for step transitions
- **created_at** (DATE) - Creation timestamp
- **updated_at** (DATE) - Last update timestamp

### tickets
- **id** (INTEGER, PRIMARY KEY) - Unique identifier for the ticket
- **title** (STRING, NOT NULL) - Ticket title
- **description** (TEXT) - Ticket description
- **client_id** (INTEGER, FK -> clients.id) - Reference to the client
- **status** (STRING) - Ticket status (open, in_progress, resolved, closed)
- **priority** (STRING) - Ticket priority (low, medium, high, critical)
- **assigned_to** (INTEGER, FK -> users.id) - Reference to the assigned user
- **created_at** (DATE) - Creation timestamp
- **updated_at** (DATE) - Last update timestamp

## Database Relationships

- **users → roles**: Many-to-one (Many users can have one role)
- **clients → users**: Many-to-one (Many clients can be assigned to one operator)
- **messages → clients**: Many-to-one (Many messages can belong to one client)
- **messages → users**: Many-to-one (Many messages can be responded to by one user)
- **messages → flows**: Many-to-one (Many messages can be part of one flow)
- **messages → steps**: Many-to-one (Many messages can be at one flow step)
- **commands → users**: Many-to-one (Many commands can be created by one user)
- **tickets → clients**: Many-to-one (Many tickets can belong to one client)
- **tickets → users**: Many-to-one (Many tickets can be assigned to one user)
- **steps → flows**: Many-to-one (Many steps can be part of one flow)
- **steps → steps**: One-to-one (One step can lead to one next step)

## API Endpoints and Usage

### Authentication API
- **POST /api/users/login** - User login
  - Uses: `users`, `roles` tables
  - Example payload: `{ username: 'admin', password: 'password' }`
  - Returns: User data and JWT token

- **POST /api/users/register** - User registration
  - Uses: `users`, `roles` tables
  - Example payload: `{ username: 'newuser', email: 'user@example.com', password: 'password', role: 'operator' }`

### Users API
- **GET /api/users** - Get all users
  - Uses: `users`, `roles` tables
  - Used by: Dashboard, Operators page

- **GET /api/users/:id** - Get user by ID
  - Uses: `users`, `roles` tables

- **POST /api/users** - Create new user
  - Uses: `users` table
  - Example payload: `{ username: 'newuser', email: 'user@example.com', role: 'operator', password: 'password', isActive: true }`

- **PUT /api/users/:id** - Update user
  - Uses: `users` table
  - Example payload: `{ email: 'updated@example.com', isActive: false }`

- **DELETE /api/users/:id** - Delete user
  - Uses: `users` table

### Clients API
- **GET /api/clients** - Get all clients
  - Uses: `clients` table
  - Used by: Dashboard, Chats page

- **GET /api/clients/:id** - Get client by ID
  - Uses: `clients` table
  - Used by: Client detail, Chat interface

- **GET /api/clients/search?query=:query** - Search clients
  - Uses: `clients` table
  - Used by: Chats search, Bulk messaging

- **PUT /api/clients/:id/notes** - Update client notes
  - Uses: `clients` table
  - Example payload: `{ notes: 'Customer interested in premium service' }`

- **PUT /api/clients/:id/toggle-block** - Block/unblock client
  - Uses: `clients` table
  - Example payload: `{ isBlocked: true, banReason: 'Inappropriate content' }`

- **PUT /api/clients/:id/dialog-status** - Toggle dialog status
  - Uses: `clients` table
  - Example payload: `{ isDialogOpen: true }`

- **PUT /api/clients/:id/operator** - Assign operator to client
  - Uses: `clients` table
  - Example payload: `{ operatorId: 5 }`
  
- **PUT /api/clients/:id/language** - Update client language preference
  - Uses: `clients` table
  - Example payload: `{ preferredLanguage: 'en' }`
  
- **PUT /api/clients/:id/tags** - Update client tags
  - Uses: `clients` table
  - Example payload: `{ tags: ['VIP', 'Needs follow-up'] }`

### Messages API
- **GET /api/messages/client/:clientId** - Get client messages
  - Uses: `messages`, `clients` tables
  - Used by: Chat interface

- **GET /api/messages/unread** - Get unread messages
  - Uses: `messages` table
  - Used by: Dashboard, Notifications

- **POST /api/messages/mark-read** - Mark messages as read
  - Uses: `messages` table
  - Example payload: `{ messageIds: [1, 2, 3] }`

- **POST /api/messages/send/:clientId** - Send message to client
  - Uses: `messages`, `clients` tables
  - Example payload: `{ content: 'Hello, how can I help you?' }`

- **POST /api/messages/broadcast** - Send broadcast message to multiple clients
  - Uses: `messages`, `clients` tables
  - Example payload: `{ content: 'Special offer available!', clientIds: [1, 2, 3] }`

### Commands API
- **GET /api/commands** - Get all commands
  - Uses: `commands` table
  - Used by: Commands page, Dashboard

- **POST /api/commands** - Create new command
  - Uses: `commands` table
  - Example payload: `{ question: '/help', answer: 'Available commands: /start, /help', type: 'slash' }`

- **PUT /api/commands/:id** - Update command
  - Uses: `commands` table
  - Example payload: `{ answer: 'Updated response text', isActive: false }`

- **DELETE /api/commands/:id** - Delete command
  - Uses: `commands` table

### Flows API
- **GET /api/flows** - Get all flows
  - Uses: `flows` table
  - Used by: Flows page, Dashboard

- **GET /api/flows/:id** - Get flow by ID
  - Uses: `flows`, `steps` tables
  - Used by: Flow Editor

- **POST /api/flows** - Create new flow
  - Uses: `flows` table
  - Example payload: `{ name: 'Welcome Flow', description: 'Initial dialog with new users', isActive: true }`

- **PUT /api/flows/:id** - Update flow
  - Uses: `flows` table
  - Example payload: `{ description: 'Updated description', isActive: false }`

- **DELETE /api/flows/:id** - Delete flow
  - Uses: `flows` table

- **POST /api/flows/:id/set-default** - Set flow as default
  - Uses: `flows` table

- **POST /api/flows/:id/invite** - Send flow invitation to users
  - Uses: `flows`, `clients`, `messages` tables
  - Example payload: `{ clientIds: [1, 2, 3] }`

### Flow Steps API
- **GET /api/flows/:flowId/steps** - Get all steps for a flow
  - Uses: `steps` table
  - Used by: Flow Editor

- **POST /api/flows/:flowId/steps** - Create new step
  - Uses: `steps` table
  - Example payload: `{ title: 'Welcome', text: 'Welcome to our bot!', buttons: [...], nextStep: null }`

- **PUT /api/flows/:flowId/steps/:stepId** - Update step
  - Uses: `steps` table
  - Example payload: `{ text: 'Updated text', conditions: [...] }`

- **DELETE /api/flows/:flowId/steps/:stepId** - Delete step
  - Uses: `steps` table

### Settings API
- **GET /api/settings** - Get all settings
  - Uses: `settings` table
  - Used by: Settings page

- **PUT /api/settings** - Update settings
  - Uses: `settings` table
  - Example payload: `{ botToken: 'new_token', welcomeMessage: 'Welcome!' }`

### Tickets API
- **GET /api/tickets** - Get all tickets
  - Uses: `tickets`, `clients`, `users` tables
  - Used by: Tickets page, Dashboard

- **GET /api/tickets/:id** - Get ticket by ID
  - Uses: `tickets`, `clients`, `users` tables
  - Used by: Ticket detail page

- **POST /api/tickets** - Create new ticket
  - Uses: `tickets` table
  - Example payload: `{ title: 'Help needed', description: 'Customer needs assistance', clientId: 1, priority: 'high' }`

- **PUT /api/tickets/:id** - Update ticket
  - Uses: `tickets` table
  - Example payload: `{ status: 'resolved', assignedTo: 3 }`

- **DELETE /api/tickets/:id** - Delete ticket
  - Uses: `tickets` table

### Dashboard API
- **GET /api/dashboard/stats** - Get dashboard statistics
  - Uses: `clients`, `messages`, `users`, `commands`, `flows`, `tickets` tables
  - Used by: Dashboard page
  - Returns: Statistics about clients, messages, operators, commands, flows, tickets, performance

- **GET /api/dashboard/activity** - Get recent activity
  - Uses: `messages`, `clients` tables
  - Used by: Dashboard page
  - Returns: Recent messages and new user registrations

- **GET /api/dashboard/time-analytics** - Get activity by time of day
  - Uses: `messages` table
  - Used by: Dashboard page
  - Returns: Message count distribution by hour of day 