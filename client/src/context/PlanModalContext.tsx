import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Plan, Step } from '../types/plan'
import { useUsers } from './UserContext'

export interface ChatMessage {
    role: 'user' | 'ai'
    content: string
}

interface PlanModalContextType {
    isOpen: boolean
    openModal: (plan?: Plan | null) => void
    closeModal: () => void
    clearDraft: () => void
    
    // Plan Data
    initialPlan: Plan | null
    title: string
    setTitle: (title: string) => void
    steps: Step[]
    setSteps: React.Dispatch<React.SetStateAction<Step[]>>
    
    // Chat Data
    messages: ChatMessage[]
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
    chatInput: string
    setChatInput: (input: string) => void
    
    // UI Layout
    leftWidth: number
    setLeftWidth: (width: number) => void
}

const DRAFT_KEY_PREFIX = 'devboard_plan_modal_draft'
const EMPTY_STEPS: Step[] = [{ content: '', isCompleted: false, position: 1000.0 }]

const PlanModalContext = createContext<PlanModalContextType | undefined>(undefined)

export const PlanModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useUsers()
    const [isOpen, setIsOpen] = useState(false)
    const [initialPlan, setInitialPlan] = useState<Plan | null>(null)
    const [title, setTitle] = useState('')
    const [steps, setSteps] = useState<Step[]>(EMPTY_STEPS)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [chatInput, setChatInput] = useState('')
    const [leftWidth, setLeftWidth] = useState(68)
    const [loadedDraftKey, setLoadedDraftKey] = useState<string | null>(null)
    const draftKey = user?.email
        ? `${DRAFT_KEY_PREFIX}:${encodeURIComponent(user.email.toLowerCase())}`
        : null

    // Restore only the draft belonging to the authenticated user.
    useEffect(() => {
        setIsOpen(false)
        setInitialPlan(null)
        setTitle('')
        setSteps(EMPTY_STEPS)
        setMessages([])
        setChatInput('')

        if (!draftKey) {
            setLoadedDraftKey(null)
            return
        }

        const savedDraft = localStorage.getItem(draftKey)
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft)
                setTitle(parsed.title || '')
                setSteps(Array.isArray(parsed.steps) && parsed.steps.length > 0 ? parsed.steps : EMPTY_STEPS)
                setMessages(parsed.messages || [])
                setChatInput(parsed.chatInput || '')
                setInitialPlan(parsed.initialPlan || null)
                setIsOpen(parsed.isOpen ?? false)
            } catch (err) {
                console.error('Failed to parse draft state:', err)
                localStorage.removeItem(draftKey)
            }
        }
        setLoadedDraftKey(draftKey)
    }, [draftKey])

    // Persist only after this account's draft has been restored. This prevents
    // a previous user's in-memory plan state from being written under a new key.
    useEffect(() => {
        if (!draftKey || loadedDraftKey !== draftKey) return

        const hasDraftContent = isOpen || Boolean(title.trim()) || messages.length > 0 ||
            Boolean(chatInput.trim()) || steps.some(step => step.content.trim())

        if (hasDraftContent) {
            const draftState = {
                isOpen,
                initialPlan,
                title,
                steps,
                messages,
                chatInput,
            }
            localStorage.setItem(draftKey, JSON.stringify(draftState))
        } else {
            localStorage.removeItem(draftKey)
        }
    }, [draftKey, loadedDraftKey, isOpen, initialPlan, title, steps, messages, chatInput])

    const openModal = (plan: Plan | null = null) => {
        setInitialPlan(plan)
        if (plan) {
            setTitle(plan.title || '')
            setSteps(plan.steps && plan.steps.length > 0 ? plan.steps : EMPTY_STEPS)
            setMessages([])
            setChatInput('')
        } else {
            // "Create Plan" always starts with a fresh, blank plan.
            setTitle('')
            setSteps(EMPTY_STEPS)
            setMessages([])
            setChatInput('')
        }
        setIsOpen(true)
    }

    const closeModal = () => {
        setIsOpen(false)
    }

    const clearDraft = () => {
        if (draftKey) localStorage.removeItem(draftKey)
        setTitle('')
        setSteps(EMPTY_STEPS)
        setMessages([])
        setChatInput('')
        setInitialPlan(null)
        setIsOpen(false)
    }

    return (
        <PlanModalContext.Provider
            value={{
                isOpen,
                openModal,
                closeModal,
                clearDraft,
                initialPlan,
                title,
                setTitle,
                steps,
                setSteps,
                messages,
                setMessages,
                chatInput,
                setChatInput,
                leftWidth,
                setLeftWidth,
            }}
        >
            {children}
        </PlanModalContext.Provider>
    )
}

export const usePlanModal = () => {
    const context = useContext(PlanModalContext)
    if (!context) {
        throw new Error('usePlanModal must be used within a PlanModalProvider')
    }
    return context
}
