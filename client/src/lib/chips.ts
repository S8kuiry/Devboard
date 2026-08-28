import type { Chat, Message } from "../types/agent"

// Acts on the raw input in the textarea before it becomes a plan
export const PRESET_CHIPS = [
    { label: '📊 Enhance Task ', instruction: 'Break this down into more detailed, granular steps.' },
    // { label: '✂️ Just the Essentials', instruction: 'Keep only the essential, must-do steps — skip anything optional.' },
    // { label: '⏳ Add Deadlines', instruction: 'Add a rough timeframe or target date next to each step.' },
]

// Acts on a specific AI reply that's already on screen
export const REPLY_CHIPS = [
    { label: 'More Detail', instruction: 'Break down the key steps into more detailed, actionable sub-steps.' },
    { label: "What's Missing?", instruction: 'Point out anything important that might be missing from this plan.' },
    { label: 'Simplify', instruction: 'Simplify this into fewer, clearer steps.' },
]


export const AGENTIC_MODAL_CHIPS = [
    { label: 'Search across tasks & plans', action: 'How to search tasks and plans?' },
    { label: 'Create & assign a new task', action: 'How to delete completed tasks' },
    { label: 'Modify or delete tasks', tab: 'insights' },
    { label: 'Manage & edit execution plans', tab: 'activity' },
    { label: 'Ask Devboard AI to organize tasks & plans', action: 'How to connect custom REST endpoints' }
]


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

