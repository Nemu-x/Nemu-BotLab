# Guide to Creating a Test Questionnaire with Auto-Response

## Introduction

This guide will help you create a Flow with 10 sequential questions and an automatic response based on the data collected. Such a questionnaire can be used for:

- Knowledge testing
- Collecting client information
- Lead qualification
- Automating the support process

## Step 1: Creating a New Flow

1. Go to the "Flows" section in the admin panel
2. Click the "Create Flow" button
3. Fill in the basic information:
   - **Name**: "Test Questionnaire"
   - **Description**: "10-question questionnaire with automatic response"
   - **Active**: Enabled
   - **Launch command**: Select an existing command or create a new one (e.g., `/test`)

## Step 2: Creating the First Questions

Configure the first 5 questions:

1. **Question 1: Personal Information**
   - **Title**: "Name"
   - **Text**: "Please enter your name:"
   - **Next step**: Question 2

2. **Question 2: Contact Information**
   - **Title**: "Email"
   - **Text**: "Please enter your email address:"
   - **Next step**: Question 3

3. **Question 3: Experience Level**
   - **Title**: "Experience"
   - **Text**: "What is your experience level in this field?"
   - **Buttons**:
     - "Beginner" → Question 4
     - "Intermediate" → Question 4
     - "Advanced" → Question 4
   - **Next step**: Question 4

4. **Question 4: Interest Areas**
   - **Title**: "Interests"
   - **Text**: "Which areas are you interested in? (Select all that apply)"
   - **Buttons**:
     - "Technology" → Question 5
     - "Business" → Question 5
     - "Design" → Question 5
     - "Marketing" → Question 5
   - **Next step**: Question 5

5. **Question 5: Goals**
   - **Title**: "Goals"
   - **Text**: "What are your primary goals?"
   - **Buttons**:
     - "Learning new skills" → Question 6
     - "Career advancement" → Question 6
     - "Starting a business" → Question 6
     - "Personal development" → Question 6
   - **Next step**: Question 6

## Step 3: Creating the Next Questions

Configure the remaining 5 questions:

6. **Question 6: Budget**
   - **Title**: "Budget"
   - **Text**: "What is your approximate budget?"
   - **Buttons**:
     - "Under $1,000" → Question 7
     - "$1,000 - $5,000" → Question 7
     - "$5,000 - $10,000" → Question 7
     - "Over $10,000" → Question 7
   - **Next step**: Question 7

7. **Question 7: Timeline**
   - **Title**: "Timeline"
   - **Text**: "What is your expected timeline?"
   - **Buttons**:
     - "Under 1 month" → Question 8
     - "1-3 months" → Question 8
     - "3-6 months" → Question 8
     - "Over 6 months" → Question 8
   - **Next step**: Question 8

8. **Question 8: Frequency**
   - **Title**: "Frequency"
   - **Text**: "How often would you like to receive updates?"
   - **Buttons**:
     - "Daily" → Question 9
     - "Weekly" → Question 9
     - "Monthly" → Question 9
     - "Quarterly" → Question 9
   - **Next step**: Question 9

9. **Question 9: Preferred Contact Method**
   - **Title**: "Contact Method"
   - **Text**: "What is your preferred contact method?"
   - **Buttons**:
     - "Email" → Question 10
     - "Phone" → Question 10
     - "Telegram" → Question 10
     - "WhatsApp" → Question 10
   - **Next step**: Question 10

10. **Question 10: Additional Information**
    - **Title**: "Additional Info"
    - **Text**: "Is there anything else you would like to add?"
    - **Next step**: Result

## Step 4: Creating the Result Step

1. Add a final step:
   - **Title**: "Result"
   - **Text**: "Thank you for completing the questionnaire! Based on your responses, we recommend: {{recommendation}}"
   - Mark this step as "Final step"

## Step 5: Adding Auto-Response Logic

1. Add a condition for the Result step to generate a personalized recommendation based on previous answers:
   - If Experience = "Beginner" and Goals = "Learning new skills":
     - Set recommendation = "Our Beginner Course Package with weekly consultations"
   - If Experience = "Intermediate" and Interests contains "Technology":
     - Set recommendation = "Advanced Technology Program with practical projects"
   - If Experience = "Advanced" and Budget = "Over $10,000":
     - Set recommendation = "Executive Mentorship Program with industry experts"
   - Default recommendation:
     - Set recommendation = "Our standard package with customized options"

## Step 6: Testing the Flow

1. Save all changes
2. Use the "Test" button to preview the flow
3. Go through all possible paths to ensure correct behavior
4. Verify that the auto-response logic provides appropriate recommendations

## Step 7: Analyzing Results

After implementing the questionnaire:

1. Monitor completion rates
2. Review the distribution of answers to identify trends
3. Adjust questions or auto-response logic based on the data collected
4. Use insights to improve your service offerings

## Tips for Effective Implementation

- **Clear Instructions**: Provide context for why you're asking each question
- **Progress Indicators**: Let users know how far they are in the questionnaire
- **Response Validation**: Ensure that free-text responses are validated where necessary
- **Save Partial Progress**: Allow users to resume incomplete questionnaires
- **Follow-up**: Send a follow-up message after questionnaire completion

## Technical Notes

- Save all responses to user profile for future reference
- Set up notifications to alert staff when questionnaires are completed
- Configure analytics to track completion rates and common response patterns
- Periodically review and update the questionnaire based on user feedback 