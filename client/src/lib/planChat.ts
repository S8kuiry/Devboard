const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || ''
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export interface PlanChatMessagePayload {
    role: 'user' | 'ai'
    content: string
    action?: string
    steps?: string[]
    attachments?: string[]
}

export const saveChatMessages = async (
    namespace: string,
    messages: PlanChatMessagePayload[],
    aiUrl: string
) => {
    const res = await fetch(`${aiUrl}/plan-chat/save`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ namespace, messages }),
    })
    if (!res.ok) throw new Error('Failed to save chat message')
}

export const promoteChat = async (draftId: string, planId: string, aiUrl: string) => {
    const res = await fetch(`${aiUrl}/plan-chat/promote`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ draft_id: draftId, plan_id: planId }),
    })
    if (!res.ok) throw new Error('Failed to promote chat')
}

export const discardChat = async (namespace: string, aiUrl: string) => {
    const res = await fetch(`${aiUrl}/plan-chat/${namespace}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error('Failed to discard chat')
}

export const getChatHistory = async (
    namespace: string,
    aiUrl: string
): Promise<PlanChatMessagePayload[]> => {
    const res = await fetch(`${aiUrl}/plan-chat/${namespace}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error('Failed to load chat history')
    const data = await res.json()
    return data.messages
}