# Guide to Creating Questionnaires (Flows) in Telegram Bot

## Introduction

The "Flow" functionality allows you to create message chains for interactive communication with bot users. With it, you can:
- Collect information from users through a sequence of questions
- Create branching scenarios depending on user responses
- Automate data collection and processing

## Questionnaire Structure

A questionnaire consists of:
1. **Flow** - the main container with questionnaire metadata (name, description, etc.)
2. **Trigger command** - the command that launches the questionnaire
3. **Sequence of steps** - chain of commands that execute sequentially

## Creating a Questionnaire

### Step 1: Creating a New Flow

1. Go to the "Flows" section in the admin panel
2. Click the "Create Flow" button
3. Fill in the basic information:
   - **Name**: Enter a descriptive name for your flow
   - **Description**: Brief explanation of the flow's purpose
   - **Active**: Enable/disable the flow
   - **Launch command**: Select an existing command or create a new one

### Step 2: Adding Steps

Each step in the flow represents a message or action. To add steps:

1. Click "Add Step" in the flow editor
2. Configure the step parameters:
   - **Title**: Internal name for the step (not shown to users)
   - **Text**: The message text sent to the user
   - **Buttons**: Optional response buttons
   - **Next step**: The step to proceed to after this one

### Step 3: Setting Up Buttons

Buttons allow users to make choices. For each button:

1. Enter the button text
2. Select the action type:
   - **Next step**: Go to a specific step
   - **End flow**: Complete the flow
   - **Execute command**: Run another command

### Step 4: Creating Branches

To create branching paths:

1. Add multiple buttons to a step
2. Set different "Next step" values for each button
3. Create the corresponding steps for each branch

### Step 5: Testing the Flow

Before activating your flow:

1. Save all changes
2. Use the "Test" button to preview the flow
3. Go through all possible paths to ensure correct behavior
4. Check that all responses and branches work as expected

## Advanced Features

### Conditional Logic

You can set conditions based on user data or responses:

1. In step settings, click "Add Condition"
2. Configure the condition:
   - **Variable**: Select user data or previous response
   - **Operator**: equals, contains, greater than, etc.
   - **Value**: The value to compare against
   - **Next step**: Where to go if condition is true

### Data Collection

Flows can collect and store user responses:

1. Enable "Save Response" in step settings
2. Choose a variable name for storing the response
3. Use this data in subsequent steps or for analysis

### Integration with Other Commands

Flows can trigger other commands:

1. In button settings, select "Execute command"
2. Choose the command to execute
3. Optional: pass parameters from the flow to the command

## Best Practices

1. **Keep It Simple**: Avoid overly complex flows that might confuse users
2. **Clear Instructions**: Provide clear guidance at each step
3. **Error Handling**: Include paths for unexpected responses
4. **Testing**: Thoroughly test all branches and conditions
5. **Feedback**: End flows with confirmation or summary messages

## Troubleshooting

- **Flow not starting**: Check if the trigger command is correctly configured
- **Unexpected branching**: Review conditions and button configurations
- **Missing responses**: Ensure all user inputs are properly handled
- **Loop detected**: Check that no step points back to a previous step without conditions

## Test the Flow

1. After creating the flow, click the "Save" button
2. Then click "Test" to preview the flow
3. You can test the flow by sending the trigger command to the bot

## View Results

Results of questionnaires are saved in each client's profile:

1. Go to the "Clients" section
2. Select a specific client
3. In the "Questionnaire Data" section, you will see the history of all completed questionnaires and answers

## Tips for Effective Use

- **Start with a Plan:** Before creating a questionnaire, sketch its diagram on paper or in a program
- **Use Clear Language:** Questions should be clear to the user
- **Avoid Overloading:** Try to keep questionnaires from becoming too long (5-7 steps are optimal)
- **Test:** Always test the questionnaire before putting it into production
- **Analyze:** Regularly review results and optimize questionnaires

## Technical Restrictions

- Maximum number of steps in one questionnaire: 50
- Maximum number of answer options per question: 10
- Maximum text length of a question: 4096 characters 