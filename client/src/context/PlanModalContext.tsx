import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import type { Plan, Step } from '../types/plan'
import { useUsers } from './UserContext'
import { discardDraft } from '../lib/rag'
import { getChatHistory } from '../lib/planChat'

export interface ChatMessage {
    role: 'user' | 'ai'
    content: string
    action?: 'none' | 'propose_steps'
    steps?: string[]
    attachments?: string[]
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


    // RAG session identity: a new plan gets a client-generated draftId used
    // as the Pinecone namespace until it's saved; an existing plan uses its
    // real id directly. ragNamespace is whichever of those currently applies.
    draftId: string | null
    ragNamespace: string
    hasUploadedDocs: boolean
    setHasUploadedDocs: (value: boolean) => void
    getOrCreateNamespace: () => string

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
    const [leftWidth, setLeftWidth] = useState(52)
    const [loadedDraftKey, setLoadedDraftKey] = useState<string | null>(null)
    const draftKey = user?.email
        ? `${DRAFT_KEY_PREFIX}:${encodeURIComponent(user.email.toLowerCase())}`
        : null

    const [draftId, setDraftId] = useState<string | null>(null)
    const [hasUploadedDocs, setHasUploadedDocs] = useState(false)
    const ragNamespace = (initialPlan?.id ? String(initialPlan.id) : null) || draftId || ''
    const aiUrl = import.meta.env.VITE_AI_URL
    const justSavedRef = useRef(false)

    const getOrCreateNamespace = (): string => {
        if (initialPlan?.id) return String(initialPlan.id)
        if (draftId) return draftId
        const newDraftId = crypto.randomUUID()
        setDraftId(newDraftId)
        return newDraftId
    }

    // Ensure a draftId exists whenever the modal is open for an unsaved draft
    useEffect(() => {
        if (isOpen && !initialPlan?.id && !draftId) {
            setDraftId(crypto.randomUUID())
        }
    }, [isOpen, initialPlan?.id, draftId])

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

        setDraftId(null)
        setHasUploadedDocs(false)

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

                const restoredDraftId = parsed.draftId || (!parsed.initialPlan?.id ? crypto.randomUUID() : null)
                setDraftId(restoredDraftId)
                setHasUploadedDocs(parsed.hasUploadedDocs ?? false)
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
                draftId,
                hasUploadedDocs,
            }
            localStorage.setItem(draftKey, JSON.stringify(draftState))
        } else {
            localStorage.removeItem(draftKey)
        }
    }, [draftKey, loadedDraftKey, isOpen, initialPlan, title, steps, messages, chatInput, draftId, hasUploadedDocs])

    const openModal = async (plan: Plan | null = null) => {
    setInitialPlan(plan)
    setHasUploadedDocs(false)

    if (plan && plan.id) {
        setTitle(plan.title || '')
        setSteps(plan.steps && plan.steps.length > 0 ? plan.steps : EMPTY_STEPS)
        setChatInput('')
        setDraftId(null) // editing a saved plan — its own id is already the permanent namespace
        setMessages([])  // clear stale messages while the real history loads
        setIsOpen(true)  // open immediately — don't make the user wait on the network

        try {
            const history = await getChatHistory(String(plan.id), aiUrl)
            setMessages(history.map(m => ({
                role: m.role as 'user' | 'ai',
                content: m.content,
                action: m.action as ChatMessage['action'],
                steps: m.steps,
                attachments: m.attachments,
            })))
        } catch (err) {
            console.error('Failed to load chat history:', err)
            // messages stays [] — the plan itself still opens fine, just
            // without its past conversation; not worth blocking the edit flow over
        }
    } else {
        setTitle(plan?.title || '')
        setSteps(plan?.steps && plan.steps.length > 0 ? plan.steps : EMPTY_STEPS)
        setMessages([])
        setChatInput('')
        setDraftId(crypto.randomUUID())
        setIsOpen(true)
    }
}
    const closeModal = () => {
    if (justSavedRef.current) {
        justSavedRef.current = false
        setIsOpen(false)
        return
    }

    // Only an unsaved new-plan draft that actually had docs uploaded needs
    // cleanup — an already-saved plan's documents are permanent.
    const shouldDiscard = !initialPlan?.id && draftId && hasUploadedDocs

    setIsOpen(false)   // close immediately — don't make the user wait on a network call

    if (shouldDiscard) {
        discardDraft(draftId!, aiUrl).catch(err => {
            console.error('Failed to discard draft documents:', err)
            // fire-and-forget by design — a failed cleanup call shouldn't
            // trap the user in a modal they already asked to close
        })
    }
}
    const clearDraft = () => {
        justSavedRef.current = true   // tells the next closeModal() call to skip discard
        if (draftKey) localStorage.removeItem(draftKey)
        setTitle('')
        setSteps(EMPTY_STEPS)
        setMessages([])
        setChatInput('')
        setInitialPlan(null)
        setIsOpen(false)
        setDraftId(null)
        setHasUploadedDocs(false)
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
                draftId,
                ragNamespace,
                hasUploadedDocs,
                setHasUploadedDocs,
                getOrCreateNamespace,
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
