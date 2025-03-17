# Deployment Guide

This document provides instructions for deploying the Telegram Bot application in both development and production environments.

## Prerequisites

Before deploying the application, ensure you have the following prerequisites installed:

- Node.js (v16 or higher)
- npm (v7 or higher)
- SQLite (for development) or PostgreSQL (for production)
- Git

## Environment Setup

### Clone the Repository

```bash
git clone [repository-url]
cd telegram-bot
```

### Environment Variables

Create the following `.env` files:

#### Backend (.env in telegram-bot-backend/)

```
# Application
PORT=3003
NODE_ENV=development  # or production
API_URL=http://localhost:3003
LOG_LEVEL=info

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d

# Database (SQLite)
DB_DIALECT=sqlite
DB_STORAGE=db.sqlite

# Database (PostgreSQL - for production)
# DB_DIALECT=postgres
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=telegram_bot
# DB_USER=postgres
# DB_PASSWORD=your-password

# Telegram
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# Admin User
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin-password
ADMIN_EMAIL=admin@example.com
```

#### Frontend (.env.local in telegram-bot-frontend/)

```
NEXT_PUBLIC_API_URL=http://localhost:3003
```

## Backend Deployment

### Development Environment

1. Navigate to the backend directory:

```bash
cd telegram-bot-backend
```

2. Install dependencies:

```bash
npm install
```

3. Run database migrations:

```bash
npx sequelize-cli db:migrate
```

4. Seed the database with initial data:

```bash
npx sequelize-cli db:seed:all
```

5. Start the development server:

```bash
npm run dev
```

### Production Environment

1. Navigate to the backend directory:

```bash
cd telegram-bot-backend
```

2. Install production dependencies:

```bash
npm install --production
```

3. Configure the environment variables for production in the `.env` file.

4. Run database migrations:

```bash
NODE_ENV=production npx sequelize-cli db:migrate
```

5. Build the application:

```bash
npm run build
```

6. Start the production server:

```bash
npm start
```

## Frontend Deployment

### Development Environment

1. Navigate to the frontend directory:

```bash
cd telegram-bot-frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

### Production Environment

1. Navigate to the frontend directory:

```bash
cd telegram-bot-frontend
```

2. Install dependencies:

```bash
npm install
```

3. Build the application:

```bash
npm run build
```

4. Start the production server:

```bash
npm start
```

## Telegram Bot Setup

1. Create a new bot with BotFather on Telegram and get the token.

2. Add the token to your backend `.env` file.

3. Set up a webhook by making a POST request to:
   `https://api.telegram.org/bot{your-bot-token}/setWebhook?url={your-api-url}/telegram/webhook`

4. Verify the webhook is set correctly by making a GET request to:
   `https://api.telegram.org/bot{your-bot-token}/getWebhookInfo`

## Deployment with PM2

For production deployments, it's recommended to use PM2 for process management:

1. Install PM2 globally:

```bash
npm install -g pm2
```

2. Start the backend:

```bash
cd telegram-bot-backend
pm2 start index.js --name telegram-bot-backend
```

3. Start the frontend:

```bash
cd telegram-bot-frontend
pm2 start npm --name telegram-bot-frontend -- start
```

4. Enable startup scripts:

```bash
pm2 startup
pm2 save
```

## Deployment with Docker (Alternative)

1. Create a `docker-compose.yml` file in the root directory:

```yaml
version: '3'
services:
  backend:
    build: ./telegram-bot-backend
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=production
      - PORT=3003
      - JWT_SECRET=your-secret-key
      - JWT_EXPIRES_IN=1d
      - DB_DIALECT=postgres
      - DB_HOST=db
      - DB_PORT=5432
      - DB_NAME=telegram_bot
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TELEGRAM_BOT_TOKEN=your-telegram-bot-token
    depends_on:
      - db

  frontend:
    build: ./telegram-bot-frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3003

  db:
    image: postgres:13
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=telegram_bot
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

2. Build and start the containers:

```bash
docker-compose up -d
```

## Troubleshooting

### API Connection Issues

If the frontend cannot connect to the backend API, check the following:

1. Ensure the backend server is running
2. Verify the `NEXT_PUBLIC_API_URL` environment variable is set correctly
3. Check for any CORS issues in the backend settings
4. Ensure the ports are correctly configured

### Database Migration Issues

If you encounter issues with database migrations:

1. Check that your database connection settings are correct
2. Try running migrations manually:
   ```bash
   npx sequelize-cli db:migrate:undo:all
   npx sequelize-cli db:migrate
   ```

### Telegram Webhook Issues

If the Telegram webhook is not working:

1. Ensure your server is accessible from the internet
2. Verify SSL configuration (Telegram requires HTTPS for webhooks)
3. Check the webhook URL is correctly configured

## Maintenance

### Database Backups

For production environments, set up regular database backups:

```bash
# For PostgreSQL
pg_dump -U postgres -d telegram_bot > backup.sql
```

### Log Management

Logs are stored in the following locations:

- Backend: `telegram-bot-backend/logs/`
- PM2 logs: Access with `pm2 logs`

### Updating the Application

To update the application to a new version:

1. Pull the latest changes:
   ```bash
   git pull origin main
   ```

2. Install any new dependencies:
   ```bash
   cd telegram-bot-backend && npm install
   cd telegram-bot-frontend && npm install
   ```

3. Run migrations if needed:
   ```bash
   cd telegram-bot-backend && npx sequelize-cli db:migrate
   ```

4. Rebuild and restart:
   ```bash
   cd telegram-bot-frontend && npm run build
   pm2 restart all
   ``` 