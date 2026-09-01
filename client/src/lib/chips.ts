import type { Chat, Message } from "../types/agent"



export const AGENTIC_MODAL_CHIPS = [
    { label: 'Search across tasks & plans', action: 'How to search tasks and plans?' },
    { label: 'Create & assign a new task', action: 'How to delete completed tasks' },
    { label: 'Modify or delete tasks', tab: 'insights' },
    { label: 'Manage & edit execution plans', tab: 'activity' },
    { label: 'Ask Devboard AI to organize tasks & plans', action: 'How to connect custom REST endpoints' }

]

export const AGENTIC_MODAL_INSIGHTS_CHIPS = [
    {
        label: 'Tasks',
        action: 'Show a complete overview and insights about my tasks'
    },
    {
        label: 'Plans',
        action: 'Show a complete overview and insights about my plans'
    },
]

export const MOCK_INSIGHTS = {
  totalTasks: 12,
  completedTasks: 5,
  activeTasks: 7,
  statusBreakdown: {
    TODO: 3,
    IN_PROGRESS: 4,
    DONE: 5
  },
  priorityBreakdown: {
    HIGH: 3,
    MEDIUM: 6,
    LOW: 3
  },
  tasks: [
    { id: 101, title: 'Fix JWT Refresh Token Expiry', status: 'IN_PROGRESS', priority: 'HIGH', dueDate: '2026-09-02' },
    { id: 102, title: 'Setup Render Keep-Alive Endpoint', status: 'IN_PROGRESS', priority: 'MEDIUM', dueDate: '2026-09-04' },
    { id: 103, title: 'Refactor Sidebar Component Layout', status: 'TODO', priority: 'LOW', dueDate: '2026-09-08' },
    { id: 104, title: 'Optimize Spring Boot DB Connection Pool', status: 'DONE', priority: 'HIGH', dueDate: '2026-08-30' },
  ]
};


// 1. List of Conversations
export const INITIAL_CHATS: Chat[] = [
  {
    id: 'chat-1',
    title: 'Microservice Deployment',
    subtitle: 'DevBot: Pipeline build succeeded for Auth Service...',
    time: '10m ago',
    unreadCount: 1
  },
  {
    id: 'chat-2',
    title: 'AI Task Planner',
    subtitle: 'DevBot: Created 4-step execution plan...',
    time: '2h ago'
  },
  {
    id: 'chat-3',
    title: 'Google Calendar Integration',
    subtitle: 'You: How to sync task due dates?',
    time: '1d ago'
  }
]

// 2. Messages Mapped by Chat ID
export const CHAT_MESSAGES: Record<string, Message[]> = {
  'chat-1': [
    {
      id: 'm101',
      sender: 'user',
      text: 'Why is the Auth microservice failing on Render deployment?',
      time: '15m ago'
    },
    {
      id: 'm102',
      sender: 'bot',
      text: 'The JWT_SECRET environment variable was missing. Pipeline build re-triggered and is now 100% operational.',
      time: '10m ago'
    }
  ],
  'chat-2': [
    {
      id: 'm201',
      sender: 'user',
      text: 'Can you help me organize my high-priority TODO tasks for today?',
      time: '2h 15m ago'
    },
    {
      id: 'm202',
      sender: 'bot',
      text: 'Here is your 4-step execution plan:\n1. Fix JWT token refresh expiry\n2. Add Render keep-alive endpoint\n3. Connect custom REST routes\n4. Refactor sidebar layout',
      time: '2h ago'
    }
  ],
  'chat-3': [
    {
      id: 'm301',
      sender: 'user',
      text: 'How do I sync task due dates to my Google Calendar?',
      time: '1d ago'
    },
    {
      id: 'm302',
      sender: 'bot',
      text: 'When editing a task with a due date, click "Add to Google Calendar". It generates an event with priority details and suggested reminders automatically.',
      time: '1d ago'
    }
  ]
}

