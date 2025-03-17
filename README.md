# Bot Lab

Admin dashboard for managing Telegram bot with comprehensive UI and powerful features.

## Features

- **User Authentication & Authorization**: Role-based access control with different permission levels
- **Real-time Chat Interface**: Communicate with clients directly through the dashboard
- **Flow Management**: Create and manage conversation flows for automated interactions
- **Command Configuration**: Set up and manage bot commands with flexible responses
- **Ticket System**: Track and manage support requests from users
- **Multi-language Support**: Built-in support for English and Russian languages
- **Dark/Light Theme**: Customizable UI appearance with dark and light mode
- **Analytics Dashboard**: Monitor bot performance and user engagement

## Screenshots

### Dashboard
<!-- Insert dashboard screenshot here -->
![Dashboard](![image](https://github.com/user-attachments/assets/df0e42c3-3fc4-4e23-9c89-d99ab6395d99))

### Chat Interface
<!-- Insert chat interface screenshot here -->
![Chat Interface](screenshots/chat.png)

### Flow Management
<!-- Insert flow management screenshot here -->
![Flow Management](screenshots/flow.png)

### Settings
<!-- Insert settings screenshot here -->
![Settings](screenshots/settings.png)

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Express.js, Sequelize ORM
- **Database**: SQLite (development), PostgreSQL (production)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- SQLite or PostgreSQL

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/Nemu-x/Bot-Lab.git
   cd Bot-Lab
   ```

2. Install frontend dependencies
   ```bash
   cd telegram-bot-frontend
   npm install
   ```

3. Install backend dependencies
   ```bash
   cd ../telegram-bot-backend
   npm install
   ```

4. Configure environment variables
   - Create `.env` file in `telegram-bot-backend` directory based on `.env.example`
   - Create `.env.local` file in `telegram-bot-frontend` directory

5. Run database migrations
   ```bash
   cd telegram-bot-backend
   npx sequelize-cli db:migrate
   ```

6. Start the development servers
   ```bash
   # Start backend
   cd telegram-bot-backend
   npm run dev

   # Start frontend (in a new terminal)
   cd telegram-bot-frontend
   npm run dev
   ```

7. Access the application
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3003

## Deployment

See [DEPLOYMENT.md](documentation/deployment-guide.md) for detailed deployment instructions.

## Documentation

- [Database Structure](documentation/db-structure.md)
- [API Endpoints](documentation/api-endpoints.md)
- [Architecture Overview](documentation/architecture.md)
- [Deployment Guide](documentation/deployment-guide.md)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Built by [Nemu-x](https://github.com/Nemu-x)
- Icons by [react-icons](https://react-icons.github.io/react-icons/)
- UI components styled with [Tailwind CSS](https://tailwindcss.com/)
