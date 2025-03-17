#!/bin/bash

# Kill all Node.js processes
echo "Stopping all Node.js processes..."
pkill -f "node"

# Wait for processes to be killed
sleep 5

# Start the server again
echo "Starting the server..."
cd /home/ak/telegram-bot/telegram-bot-backend
npm run start:dev 