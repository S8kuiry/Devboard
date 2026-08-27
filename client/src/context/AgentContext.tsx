import  { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { TaskCard } from '../components/agenticModal/TaskCard'

export type TabType = 'home' | 'chats' | 'insights' | 'activity'

export interface BackendMessage {
  role: 'user' | 'assistant'
  content: string
  created_at: string
  // Add these two optional fields:
  data_type?: 'TASK_LIST' | 'TASK_SINGLE' | string
  data?: TaskCard[] | TaskCard | any
}

export interface Conversation {
  id: number
  user_email: string
  created_at: string
  updated_at: string
}

interface AgentContextType {
  isNewChat: boolean
  setIsNewChat: (val: boolean) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  inputText: string
  setInputText: (text: string) => void
  conversations: Conversation[]
  activeConversationId: number | null
  setActiveConversationId: (id: number | null) => void
  messages: BackendMessage[]
  setMessages: React.Dispatch<React.SetStateAction<BackendMessage[]>>
  isLoading: boolean
  isSending: boolean
  fetchConversations: () => Promise<void>
  fetchMessages: (conversationId: number) => Promise<void>
  sendMessage: (text?: string) => Promise<void>
  deleteConversation: (conversationId: number) => Promise<void>
  startNewChat: () => void
}

const AgentContext = createContext<AgentContextType | undefined>(undefined)

const rawAiUrl = (import.meta.env.VITE_AI_URL || 'http://localhost:8000').replace(/\/$/, '')
const API_BASE_URL = rawAiUrl.endsWith('/agent') ? rawAiUrl : `${rawAiUrl}/agent`

// Helper to get Bearer Auth Token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || ''
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }
}

export const AgentProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('home')
  const [inputText, setInputText] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null)
  const [messages, setMessages] = useState<BackendMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isNewChat, setIsNewChat] = useState(false) // 👈 Track new chat state

  // Fetch all conversations for current user
  const fetchConversations = async () => {
    try {
      console.log(getAuthHeaders())
      setIsLoading(true)
      const res = await fetch(`${API_BASE_URL}/conversations`, {
        headers: getAuthHeaders()
      })
      if (res.ok) {
        const data: Conversation[] = await res.json()
        setConversations(data)
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch messages for a given conversation ID
  const fetchMessages = async (conversationId: number) => {
    try {
      setIsLoading(true)
      const res = await fetch(`${API_BASE_URL}/messages/${conversationId}`, {
        headers: getAuthHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Send a user message to the backend
  const sendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText
    if (!query.trim() || isSending) return

    const userMessageText = query
    setInputText('')
    setIsSending(true)
    setIsNewChat(false) // 👈 Reset once message sending starts

    // Optimistically add user message to UI
    const optimisticMsg: BackendMessage = {
      role: 'user',
      content: userMessageText,
      created_at: new Date().toISOString()
    }
    setMessages((prev) => [...prev, optimisticMsg])
    setActiveTab('chats')

    try {
      const res = await fetch(`${API_BASE_URL}/message`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          message: userMessageText,
        })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.conversation_id && !activeConversationId) {
          setActiveConversationId(data.conversation_id)
        }
        const botMsg: BackendMessage = {
          role: 'assistant',
          content: data.reply,
          created_at: new Date().toISOString()
        }
        setMessages((prev) => [...prev, botMsg])
        await fetchConversations() // Refresh list after message
      } else {
        const errData = await res.json().catch(() => ({}))
        const errorText = errData.error || errData.detail || 'Could not get a response from AI assistant.'
        const errorMsg: BackendMessage = {
          role: 'assistant',
          content: `⚠️ Error: ${errorText}`,
          created_at: new Date().toISOString()
        }
        setMessages((prev) => [...prev, errorMsg])
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      const errorMsg: BackendMessage = {
        role: 'assistant',
        content: `⚠️ Network error: Unable to connect to the AI service.`,
        created_at: new Date().toISOString()
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsSending(false)
    }
  }

  // Delete conversation by ID
  const deleteConversation = async (conversationId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/delete/${conversationId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      if (res.ok) {
        if (activeConversationId === conversationId) {
          setActiveConversationId(null)
          setMessages([])
          setIsNewChat(false)
        }
        await fetchConversations()
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err)
    }
  }

  // Handle switching to a fresh chat view
  const startNewChat = () => {
    setActiveConversationId(null)
    setMessages([])
    setIsNewChat(true)
    setActiveTab('chats')
  }

  // Load conversations when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchConversations()
    }
  }, [isOpen])

  // Load messages when an active conversation is selected
  useEffect(() => {
    if (activeConversationId) {
      setIsNewChat(false)
      fetchMessages(activeConversationId)
    }
  }, [activeConversationId])

  return (
    <AgentContext.Provider
      value={{
        isOpen,
        setIsOpen,
        activeTab,
        setActiveTab,
        inputText,
        setInputText,
        conversations,
        activeConversationId,
        setActiveConversationId,
        messages,
        setMessages,
        isLoading,
        isSending,
        fetchConversations,
        fetchMessages,
        sendMessage,
        deleteConversation,
        startNewChat,
        isNewChat,
        setIsNewChat,
      }}
    >
      {children}
    </AgentContext.Provider>
  )
}

export const useAgent = () => {
  const context = useContext(AgentContext)
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider')
  }
  return context
}