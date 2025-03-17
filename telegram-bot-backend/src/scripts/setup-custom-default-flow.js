require('dotenv').config();
const { Flow, Command, Step } = require('../models');
const logger = require('../config/logger');

async function setupCustomDefaultFlow() {
  try {
    console.log('Starting setup of custom default flow...');
    
    // Find the admin user (assuming ID 1 is the admin)
    const adminId = 1; // Default admin ID
    console.log(`Using admin ID: ${adminId} as creator`);
    
    // 1. Find or create the /start command
    let startCommand = await Command.findOne({
      where: { command: '/start' }
    });
    
    if (!startCommand) {
      console.log('Creating /start command...');
      startCommand = await Command.create({
        command: '/start',
        description: 'Start the bot and trigger default flow',
        response: 'Starting your custom flow...',
        type: 'slash',
        isActive: true
      });
      console.log(`Created /start command with ID: ${startCommand.id}`);
    } else {
      console.log(`Found existing /start command with ID: ${startCommand.id}`);
    }
    
    // 2. Find any existing default flow to disable
    const existingDefaultFlows = await Flow.findAll({
      where: { isDefault: true }
    });
    
    if (existingDefaultFlows.length > 0) {
      console.log(`Found ${existingDefaultFlows.length} existing default flows. Setting isDefault to false for all of them.`);
      for (const flow of existingDefaultFlows) {
        await flow.update({ isDefault: false });
        console.log(`Disabled default setting for flow ID: ${flow.id}, Name: ${flow.name}`);
      }
    }
    
    // 3. Create a new custom default flow
    const flowName = process.argv[2] || "Custom Welcome Flow";
    console.log(`Creating new default flow with name: ${flowName}`);
    
    const newFlow = await Flow.create({
      name: flowName,
      description: "This is a custom default flow for welcoming new users",
      startCommandId: startCommand.id,
      isActive: true,
      isDefault: true,
      steps: [],
      config: {
        displayStepsCount: true,
        allowSkip: false
      },
      createdBy: adminId
    });
    
    console.log(`Created new default flow with ID: ${newFlow.id}`);
    
    // 4. Create steps for the flow
    const steps = [
      {
        flowId: newFlow.id,
        orderIndex: 1,
        question: "👋 Привет! Как вас зовут?",
        responseType: "text",
        isRequired: true,
        options: [],
        config: { saveAs: "user_name" }
      },
      {
        flowId: newFlow.id,
        orderIndex: 2,
        question: "{{user_name}}, приятно познакомиться! Какой у вас вопрос?",
        responseType: "text",
        isRequired: true,
        options: [],
        config: { saveAs: "question" }
      },
      {
        flowId: newFlow.id,
        orderIndex: 3,
        question: "Выберите категорию вашего вопроса:",
        responseType: "buttons",
        isRequired: true,
        options: [
          { text: "Техническая поддержка", value: "tech_support" },
          { text: "Консультация", value: "consultation" },
          { text: "Жалоба", value: "complaint" },
          { text: "Другое", value: "other" }
        ],
        config: { saveAs: "category" }
      },
      {
        flowId: newFlow.id,
        orderIndex: 4,
        question: "Спасибо за информацию! Наш оператор свяжется с вами в ближайшее время.",
        responseType: "final",
        isRequired: false,
        options: [],
        config: {}
      }
    ];
    
    for (const stepData of steps) {
      const step = await Step.create(stepData);
      console.log(`Created step ${step.orderIndex} for flow ${newFlow.id}`);
    }
    
    // 5. Update the flow to include the step IDs
    const createdSteps = await Step.findAll({
      where: { flowId: newFlow.id },
      order: [['orderIndex', 'ASC']]
    });
    
    await newFlow.update({
      steps: createdSteps.map(step => step.id)
    });
    
    console.log(`Updated flow ${newFlow.id} with ${createdSteps.length} steps`);
    console.log('Custom default flow setup completed successfully!');
    
    // Notify user how to use this flow
    console.log('\n===== HOW TO USE THIS FLOW =====');
    console.log('1. Restart your bot service');
    console.log('2. Send /start command to your bot');
    console.log('3. The bot will start this flow automatically');
    console.log('\nTo create a different default flow:');
    console.log('1. Use the admin panel to create a new flow');
    console.log('2. Link it to the /start command');
    console.log('3. Set isDefault = true for that flow');
    console.log('==============================\n');
    
  } catch (error) {
    console.error('Error setting up custom default flow:', error);
  }
}

// Run the setup function
setupCustomDefaultFlow()
  .then(() => {
    console.log('Script execution completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script execution failed:', error);
    process.exit(1);
  }); 