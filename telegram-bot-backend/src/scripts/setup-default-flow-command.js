require('dotenv').config();
const { Flow, Command } = require('../models');
const logger = require('../config/logger');

async function setupDefaultFlowCommand() {
  try {
    console.log('Starting setup of default flow command...');
    
    // Find the default flow if it exists
    const defaultFlow = await Flow.findOne({
      where: { isDefault: true }
    });
    
    if (!defaultFlow) {
      console.log('No default flow found. Please create a flow and mark it as default.');
      return;
    }
    
    console.log(`Found default flow: ID: ${defaultFlow.id}, Name: ${defaultFlow.name}`);
    
    // Find or create the /start command
    let startCommand = await Command.findOne({
      where: { command: '/start' }
    });
    
    if (!startCommand) {
      console.log('Creating /start command...');
      startCommand = await Command.create({
        command: '/start',
        description: 'Start the bot and trigger default flow',
        response: 'Starting flow...',
        type: 'slash',
        is_active: true
      });
      console.log(`Created /start command with ID: ${startCommand.id}`);
    } else {
      console.log(`Found existing /start command with ID: ${startCommand.id}`);
    }
    
    // Link the default flow to the /start command
    await defaultFlow.update({
      startCommandId: startCommand.id
    });
    
    console.log(`Successfully linked default flow (ID: ${defaultFlow.id}) to /start command`);
    console.log('Setup completed successfully!');
    
  } catch (error) {
    console.error('Error setting up default flow command:', error);
  }
}

// Run the setup function
setupDefaultFlowCommand()
  .then(() => {
    console.log('Script execution completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script execution failed:', error);
    process.exit(1);
  }); 