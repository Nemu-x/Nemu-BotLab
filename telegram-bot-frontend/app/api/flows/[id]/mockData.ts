// Общие данные для всех API эндпоинтов flows
export let mockFlows = [
  {
    id: 1,
    name: 'Customer Satisfaction Survey',
    description: 'A survey to collect customer feedback about our services',
    isActive: true,
    isDefault: true,
    steps: [
      {
        id: 1,
        flowId: 1,
        title: 'Welcome',
        message: 'Thank you for participating in our survey!',
        order: 1,
        buttons: [{ text: 'Start' }]
      },
      {
        id: 2,
        flowId: 1,
        title: 'Rating',
        message: 'How would you rate our service?',
        order: 2,
        buttons: [
          { text: 'Excellent' },
          { text: 'Good' },
          { text: 'Average' },
          { text: 'Poor' }
        ]
      }
    ]
  },
  {
    id: 2,
    name: 'Product Feedback',
    description: 'Collect feedback about our new product',
    isActive: false,
    isDefault: false,
    steps: []
  },
  {
    id: 3,
    name: 'User Registration Form',
    description: 'Automated registration flow for new users',
    isActive: true,
    isDefault: false,
    steps: [
      {
        id: 3,
        flowId: 3,
        title: 'Contact Information',
        message: 'Please provide your contact information',
        order: 1,
        buttons: [{ text: 'Continue' }]
      }
    ]
  }
];

// Функция для обновления mockFlows
export function updateMockFlows(newMockFlows: typeof mockFlows) {
  mockFlows = newMockFlows;
} 