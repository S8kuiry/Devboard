import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Plan, Step } from '../types/plan'
import toast from 'react-hot-toast'
import StepsModal from './StepsPanel'
import { useUsers } from '../context/UserContext'
import PlanChatModal from './PlanChatModal'
import { usePlanModal } from '../context/PlanModalContext'

interface PlanModalProps {
    onClose: () => void
    onSave: (plan: Plan) => void
    currentUserEmail: string
    initialPlan?: Plan | null
}

export default function PlanModal({ onClose, onSave, currentUserEmail, initialPlan }: PlanModalProps) {
    const taskUrl = import.meta.env.VITE_TASK_URL
    const aiUrl = import.meta.env.VITE_AI_URL
    const FASTAPI_URL = import.meta.env.VITE_AI_URL

    const { setLoaders } = useUsers()

    // 1. Consume Context State (Auto-persisted to localStorage)
    const {
        title,
        setTitle,
        steps,
        setSteps,
        leftWidth,
        setLeftWidth,
        clearDraft
    } = usePlanModal()

    const [isResizing, setIsResizing] = useState(false)
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token') || ''
        return {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        }
    }


    // 2. Initialize from initialPlan if context title is empty
    useEffect(() => {
        if (initialPlan && !title) {
            setTitle(initialPlan.title || '')
            if (initialPlan.steps && initialPlan.steps.length > 0) {
                setSteps(initialPlan.steps)
            }
        }
    }, [initialPlan])

    // ---- Steps logic (Updates Context state) ----
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIdx(index)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault()
        if (draggedIdx === null || draggedIdx === index) return

        const updated = [...steps]
        const [draggedItem] = updated.splice(draggedIdx, 1)
        updated.splice(index, 0, draggedItem)

        const reordered = updated.map((step, i) => ({
            ...step,
            position: (i + 1) * 1000.0
        }))

        setDraggedIdx(index)
        setSteps(reordered)
    }

    const handleDragEnd = () => {
        setDraggedIdx(null)
    }

    const handleToggleStep = async (index: number) => {
        const step = steps[index]

        // New step that hasn't been saved yet
        if (!step?.id) {
            setSteps(prev =>
                prev.map((s, i) =>
                    i === index
                        ? { ...s, isCompleted: !s.isCompleted }
                        : s
                )
            )
            return
        }

        const previousSteps = [...steps]

        // Optimistic UI update
        setSteps(prev =>
            prev.map((s, i) =>
                i === index
                    ? { ...s, isCompleted: !s.isCompleted }
                    : s
            )
        )

        try {
            const res = await fetch(
                `${taskUrl}/plans/steps/${step.id}/toggle`,
                {
                    method: 'PATCH',
                }
            )

            if (!res.ok) {
                throw new Error('Failed to toggle step')
            }

            // Invalidate FastAPI plan cache
            await fetch(`${FASTAPI_URL}/agent/plans/invalidate-cache`, {
                method: 'POST',
                headers: getAuthHeaders(),
            }).catch(() => { })

        } catch (error) {
            // Revert UI if backend request failed
            setSteps(previousSteps)

            console.error('Error toggling step:', error)
            toast.error('Could not update step')
        }
    }

    const handleAddStep = () => {
        const nextPos = steps.length > 0 ? steps[steps.length - 1].position + 1000.0 : 1000.0
        setSteps(prev => [...prev, { content: '', isCompleted: false, position: nextPos }])
    }

    const handleStepContentChange = (index: number, content: string) => {
        setSteps(prev => prev.map((step, i) => (i === index ? { ...step, content } : step)))
    }

    const handleRemoveStep = (index: number) => {
        if (steps.length <= 1) {
            setSteps([{ content: '', isCompleted: false, position: 1000.0 }])
            return
        }
        setSteps(prev => prev.filter((_, i) => i !== index))
    }

    // ---- Chat AI step conversion ----
    const handleConvertStepsDirect = async (text: string) => {
        if (!text.trim()) return

        try {
            setLoaders(true)
            const res = await fetch(`${aiUrl}/api/convert-steps`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ raw_text: text.trim() })
            })
            const resBody = await res.json()
            if (res.ok) {
                const newSteps: Step[] = resBody.steps.map(
                    (content: string, idx: number) => ({
                        content,
                        isCompleted: false,
                        position: (idx + 1) * 1000.0,
                    })
                )
                setSteps(newSteps)
                toast.success('Converted to steps')
            }
        } catch (error) {
            toast.error('Could not convert to steps')
            console.error(error)
        } finally {
            setLoaders(false)
        }
    } 

    const handleConvertSteps = (rawSteps: string[]) => {
    const newSteps: Step[] = rawSteps.map((content, idx) => ({
        content,
        isCompleted: false,
        position: (idx + 1) * 1000.0,
    }))
    setSteps(newSteps)
    toast.success('Converted to steps')
}

    
    


    // ---- Save ----
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!title.trim()) {
            toast.error('Plan title is required')
            return
        }

        const validSteps = steps.filter(s => s.content && s.content.trim() !== '')
        if (validSteps.length === 0) {
            toast.error('Add at least one valid step content')
            return
        }

        setIsSaving(true)

        try {
            const payload = {
                ...(initialPlan?.id ? { id: initialPlan.id } : {}),
                title: title.trim(),
                ownerEmail: currentUserEmail,
                steps: validSteps.map((s, idx) => ({
                    ...(s.id ? { id: s.id } : {}),
                    content: s.content.trim(),
                    isCompleted: s.isCompleted ?? false,
                    position: (idx + 1) * 1000.0,
                })),
            }

            const res = await fetch(`${taskUrl}/plans`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await res.json()

            if (!res.ok) {

                throw new Error(data.error || 'Failed to save plan')
            }
            await fetch(`${FASTAPI_URL}/agent/plans/invalidate-cache`, {
                method: "POST",
                headers: getAuthHeaders(),
            }).catch(() => { })
            toast.success(initialPlan?.id ? 'Plan updated successfully' : 'Plan created successfully')
            onSave(data)
            clearDraft() // Clear draft from localStorage upon successful save
            onClose()
        } catch (error: any) {
            console.error('Error saving plan:', error)
            toast.error(error.message || 'Something went wrong while saving')
        } finally {
            setIsSaving(false)
        }
    }

    // ---- Handle Pane Resizing ----
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        setIsResizing(true)
    }

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return
            const newWidth = (e.clientX / window.innerWidth) * 100
            if (newWidth >= 20 && newWidth <= 80) {
                setLeftWidth(newWidth)
            }
        }

        const handleMouseUp = () => {
            setIsResizing(false)
        }

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isResizing])

    return createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950">
            <div className={`flex-1 flex flex-row min-h-0 ${isResizing ? 'select-none cursor-col-resize' : ''}`}>
                {/* Left Panel: Chat */}
                <div style={{ width: `${leftWidth}%` }} className="flex flex-col min-h-0">
                    <PlanChatModal
                        onClickConvert={handleConvertSteps}
                        onClickConvertDirect={handleConvertStepsDirect}
                    />
                </div>

                {/* Draggable Divider Handle */}
                <div
                    onMouseDown={handleMouseDown}
                    className="w-1.5 hover:w-[4px] bg-white/10 hover:bg-indigo-500/50 active:bg-indigo-500 cursor-col-resize transition-all duration-150 flex items-center justify-center shrink-0 group z-10"
                >
                    <div className="h-8 w-[3px] rounded-full bg-slate-600 group-hover:bg-indigo-300 transition-colors" />
                </div>

                {/* Right Panel: Steps Modal */}
                <div style={{ width: `${100 - leftWidth}%` }} className="flex flex-col min-h-0">
                    <StepsModal
                        onClose={onClose}
                        initialPlan={initialPlan}
                        // ownerEmail={currentUserEmail}
                        title={title}
                        setTitle={setTitle}
                        steps={steps}
                        draggedIdx={draggedIdx}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                        onToggleStep={handleToggleStep}
                        onStepContentChange={handleStepContentChange}
                        onRemoveStep={handleRemoveStep}
                        onAddStep={handleAddStep}
                        onSubmit={handleSubmit}
                        isSaving={isSaving}
                        isEditing={!!initialPlan}
                    />
                </div>
            </div>
        </div>,
        document.body
    )
}
