import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Trash2, Sparkles, GripVertical, Check, Loader2, CheckCircle2 } from 'lucide-react'
import type { Plan, Step } from '../types/plan'
import toast from 'react-hot-toast'

interface PlanModalProps {
    onClose: () => void
    onSave: (plan: Plan) => void
    currentUserEmail: string
    initialPlan?: Plan | null
}

export default function PlanModal({ onClose, onSave, currentUserEmail, initialPlan }: PlanModalProps) {
    const taskUrl = import.meta.env.VITE_TASK_URL
    const [title, setTitle] = useState(initialPlan?.title || '')
    const [activeTab, setActiveTab] = useState<'steps' | 'quickText'>('quickText')
    const [quickText, setQuickText] = useState('')
    const [isAiRefining, setIsAiRefining] = useState(false)

    const aiUrl = import.meta.env.VITE_AI_URL

    const [steps, setSteps] = useState<Step[]>(
        initialPlan?.steps && initialPlan.steps.length > 0
            ? initialPlan.steps
            : [
                { content: '', isCompleted: false, position: 1000.0 },
            ]
    )
    const [isSaving, setIsSaving] = useState(false)
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null)

    // Quick text handlers
    // 1. Instant Client-Side Parsing (Regex)
    const handleConvertToSteps = async () => {
        if (!quickText.trim()) {
            toast.error('Please enter a paragraph or notes first')
            return
        }

        try {
            const res = await fetch(`${aiUrl}/api/convert-steps`, {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    raw_text: quickText,
                })

            })
            const resBody = await res.json()
            if (res.ok) {
                const newSteps: Step[] = resBody.steps.map((content: string, idx: number) => ({
                    content,
                    isCompleted: false,
                    position: (idx + 1) * 1000.0,
                }))
                setSteps(newSteps)
                setActiveTab('steps') // Switch view to steps format immediately
                toast.success(`Converted ${newSteps.length} steps!`)

            }

        } catch (error) {
            toast.error("Problem in Step Conversion")
            console.log(error)

        }



        // // Split by line breaks, trim bullet symbols/numbers, filter empty lines
        // // ✅ Corrected Regex (Escaped Hyphen)
        // const parsedLines = quickText
        //     .split('\n')
        //     .map(line => line.replace(/^[\s\d.*\-–—]+/, '').trim())
        //     .filter(line => line.length > 0)

        // if (parsedLines.length === 0) {
        //     toast.error('No valid steps found in text')
        //     return
        // }

        // const newSteps: Step[] = parsedLines.map((content, idx) => ({
        //     content,
        //     isCompleted: false,
        //     position: (idx + 1) * 1000.0,
        // }))


    }

    // 2. LLM Endpoint Integration
    const handleAiRefine = async () => {
        if (!quickText.trim()) {
            toast.error('Write some raw text before refining with AI')
            return
        }

        setIsAiRefining(true)
        try {
            const res = await fetch(`${taskUrl}/plans/ai-refine`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: quickText }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'AI refinement failed')

            if (data.refinedText) {
                setQuickText(data.refinedText)
                toast.success('Text refined by AI!')
            }
        } catch (error: any) {
            console.error('AI Refine Error:', error)
            toast.error(error.message || 'AI service unavailable')
        } finally {
            setIsAiRefining(false)
        }
    }

    // Drag & Drop re-order handlers
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

        // Recalculate step positions sequentially
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

    const handleToggleStepModal = (index: number) => {
        setSteps(prev =>
            prev.map((step, i) => (i === index ? { ...step, isCompleted: !step.isCompleted } : step))
        )
    }

    const handleAddStep = () => {
        const nextPos = steps.length > 0 ? steps[steps.length - 1].position + 1000.0 : 1000.0
        setSteps([...steps, { content: '', isCompleted: false, position: nextPos }])
    }

    const handleStepContentChange = (index: number, content: string) => {
        setSteps(prev => prev.map((step, i) => (i === index ? { ...step, content } : step)))
    }

    const handleRemoveStep = (index: number) => {
        if (steps.length <= 1) {
            // Clear the single remaining step instead of recreating state twice
            setSteps([{ content: '', isCompleted: false, position: 1000.0 }])
            return
        }
        setSteps(steps.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.error('Plan title is required');
            return;
        }

        const validSteps = steps.filter(s => s.content && s.content.trim() !== '');
        if (validSteps.length === 0) {
            toast.error('Add at least one valid step content');
            return;
        }

        setIsSaving(true);

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
            };

            const res = await fetch(`${taskUrl}/plans`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to save plan');
            }

            toast.success(initialPlan?.id ? 'Plan updated successfully' : 'Plan created successfully');
            onSave(data);
            onClose();

        } catch (error: any) {
            console.error('Error saving plan:', error);
            toast.error(error.message || 'Something went wrong while saving');
        } finally {
            setIsSaving(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-md p-4 transition-all">

            {/* Main Glass Card - Constrained to 90vh max height */}
            <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-white/30 bg-slate-900/90 p-6 sm:p-7 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] backdrop-blur-xl overflow-hidden">

                {/* Top Ambient Glow Line */}
                <div className="absolute -top-px left-12 right-12 h-px bg-gradient-to-r from-transparent via-indigo-500/80 to-transparent" />

                {/* Modal Header */}
                <div className="w-full flex flex-col border-b border-white/20 pb-4 shrink-0">
                    <div className="flex items-center justify-between pb-3">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <h2 className="text-base font-semibold text-slate-100 tracking-wide">
                                {initialPlan ? 'Edit Execution Plan' : 'Create Execution Plan'}
                            </h2>
                        </div>

                        {/* Close Button */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-full p-1 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <p className="text-xs font-semibold text-slate-300">Posted By : {currentUserEmail}</p>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-4 pt-4 overflow-hidden">
                    {/* Title Input */}
                    <div className="shrink-0">
                        <label className="text-xs font-medium text-slate-300">
                            Plan Title <span className="text-indigo-400">*</span>
                        </label>
                        <input
                            required
                            type="text"
                            placeholder="e.g., Spring Boot Microservice Deployment Plan"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full mt-1.5 rounded-lg border border-white/20 bg-slate-950/50 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>

                    {/* Mode Switcher Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 shrink-0">
                        <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-lg border border-white/10">
                            <button
                                type="button"
                                onClick={() => setActiveTab('steps')}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition ${activeTab === 'steps'
                                    ? 'bg-indigo-600 text-white shadow'
                                    : 'text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                Steps View
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('quickText')}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition ${activeTab === 'quickText'
                                    ? 'bg-indigo-600 text-white shadow'
                                    : 'text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                Quick Text
                            </button>
                        </div>
                        <span className="text-[10px] font-mono text-indigo-400">{steps.length} Steps</span>
                    </div>

                    {/* Tab 1: Sequential Draggable Steps */}
                    {activeTab === 'steps' ? (
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="flex items-center justify-between mb-2 shrink-0">
                                <label className="text-xs font-medium text-slate-300">
                                    Plan Steps & Order <span className="text-slate-500 font-normal">(Drag handle to re-order)</span>
                                </label>
                                <span className="text-[10px] font-mono text-indigo-400">{steps.length} Steps</span>
                            </div>

                            <div className="relative space-y-3 max-h-[47vh] overflow-y-auto pr-2 custom-scrollbar">
                                {steps.map((step, idx) => {
                                    const isLast = idx === steps.length - 1
                                    const isCompleted = step.isCompleted
                                    const isNextCompleted = steps[idx + 1]?.isCompleted
                                    const isLineActive = isCompleted && isNextCompleted

                                    return (
                                        <div
                                            key={idx}
                                            draggable
                                            onDragStart={e => handleDragStart(e, idx)}
                                            onDragOver={e => handleDragOver(e, idx)}
                                            onDragEnd={handleDragEnd}
                                            className={`relative flex items-center gap-2.5 rounded-lg border p-2 transition-all ${draggedIdx === idx
                                                ? 'border-indigo-500/50 bg-indigo-500/10 opacity-60 scale-[0.99]'
                                                : 'border-white/15 bg-slate-950/50 hover:border-white/30'
                                                }`}
                                        >
                                            {/* Connecting Glowing Line behind checkbox */}
                                            {!isLast && (
                                                <span
                                                    className={`absolute left-[43px] top-[34px] w-[2px] h-[calc(100%+2px)] z-0 transition-all duration-300 ${isLineActive
                                                        ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]'
                                                        : isCompleted
                                                            ? 'bg-gradient-to-b from-indigo-500 to-slate-800'
                                                            : 'bg-slate-800'
                                                        }`}
                                                />
                                            )}

                                            {/* Drag Handle */}
                                            <GripVertical className="h-4 w-4 text-slate-500 cursor-grab active:cursor-grabbing shrink-0" />

                                            {/* Round Stepper Checkbox */}
                                            <button
                                                type="button"
                                                onClick={() => handleToggleStepModal(idx)}
                                                className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${isCompleted
                                                    ? 'border-indigo-400 bg-indigo-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.7)]'
                                                    : 'border-slate-700 bg-slate-900 text-transparent hover:border-slate-500'
                                                    }`}
                                            >
                                                <Check className="h-3 w-3 stroke-[3]" />
                                            </button>

                                            {/* Step Input */}
                                            <input
                                                type="text"
                                                placeholder={`Step ${idx + 1} content...`}
                                                value={step.content}
                                                onChange={e => handleStepContentChange(idx, e.target.value)}
                                                className={`flex-1 bg-transparent text-xs outline-none ${isCompleted ? 'line-through text-slate-400' : 'text-slate-100'
                                                    }`}
                                            />

                                            {/* Remove Action */}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveStep(idx)}
                                                className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>

                            <button
                                type="button"
                                onClick={handleAddStep}
                                className="mt-3 w-full py-3 rounded-lg border border-dashed border-indigo-500/30 bg-indigo-500/30 hover:bg-indigo-500/10 text-indigo-300 text-xs font-medium transition-all flex items-center justify-center gap-1.5 shrink-0"
                            >
                                <Plus className="h-4 w-4" /> Add Step
                            </button>
                        </div>
                    ) : (
                        /* Tab 2: Quick Text Section */
                        <div className="flex-1 flex flex-col space-y-3 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
                            <p className="text-[11px] text-slate-400 shrink-0">
                                Type or paste your unstructured thoughts. Click <b>AI Refine</b> to format, or <b>Convert to Steps</b> to switch to step view.
                            </p>

                            <textarea
                                rows={10}
                                value={quickText}
                                onChange={e => setQuickText(e.target.value)}
                                placeholder="Type plan flow here...&#10;e.g., First setup database schema, then implement spring security filters, finally write API routes"
                                className="w-full flex-1 min-h-[180px] max-h-[310px] rounded-lg border border-white/20 bg-slate-950/60 p-3.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 resize-none font-mono custom-scrollbar leading-relaxed"
                            />


                            {/* Quick Text Action Buttons */}
                            <div className="flex items-center gap-2 pt-1 shrink-0">
                                <button
                                    type="button"
                                    onClick={handleAiRefine}
                                    disabled={isAiRefining}
                                    className="flex-1 py-2.5 rounded-md bg-indigo-600/20 border border-neutral-500/50 hover:bg-indigo-600/50 text-indigo-100 text-[10px] font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    {isAiRefining ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-200" />
                                    ) : (
                                        <Sparkles className="h-3.5 w-3.5 text-neutral-200" />
                                    )}
                                    AI Refine
                                </button>

                                <button
                                    type="button"
                                    onClick={handleConvertToSteps}
                                    className="flex-1 py-2.5 rounded-md bg-indigo-600/20 border border-neutral-500/50 hover:bg-indigo-600/50 text-indigo-100 text-[10px] font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Convert to Steps
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Action Submit Button */}
                    <div className="pt-2 shrink-0">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full py-3 rounded-lg bg-indigo-600 hover:from-purple-500 hover:to-violet-500 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-xs tracking-wide shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving Plan...
                                </>
                            ) : initialPlan ? (
                                'Save Changes'
                            ) : (
                                'Create Plan'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    )
}