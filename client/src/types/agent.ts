
// Types
export interface Message {
  id: string
  sender: 'user' | 'bot'
  text: string
  time: string
}

export interface Chat {
  id: string
  title: string
  subtitle: string
  time: string
  unreadCount?: number
}