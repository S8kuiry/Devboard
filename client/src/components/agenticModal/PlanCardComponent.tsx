import { useState } from 'react'
import { CheckCircle2, Circle, Pencil, Trash2, ListChecks, Eye, ChevronDown, ChevronUp } from 'lucide-react'
import type { Plan } from '../../types/plan'

interface PlanCardComponentProps {
    plan: Plan
    onView?: (plan: Plan) => void
    onEdit?: (plan: Plan) => void
    onDelete?: (planId: number) => void
}

const SPRINGBOOT_URL = import.meta.env.VITE_TASK_URL
const FASTAPI_URL = import.meta.env.VITE_AI_URL

// Helper to get Bearer Auth Token
const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || ''
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    }
}

export default function PlanCardComponent({ plan, onEdit, onDelete, onView }: PlanCardComponentProps) {
    const [steps, setSteps] = useState(plan.steps || [])
    const [expanded, setExpanded] = useState(false)
    const [pendingStepId, setPendingStepId] = useState<number | null>(null)

    const completedCount = steps.filter(s => s.isCompleted).length
    const totalCount = steps.length
    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    async function handleStepToggle(stepId: number, newValue: boolean) {
        if (!plan.id) return

        const prevSteps = steps
        // optimistic update
        setSteps(prev => prev.map(s => s.id === stepId ? { ...s, isCompleted: newValue } : s))
        setPendingStepId(stepId)

        try {
            const [springRes] = await Promise.allSettled([
                fetch(
                    `${SPRINGBOOT_URL}/plans/${plan.id}/steps/${stepId}?ownerEmail=${encodeURIComponent(plan.ownerEmail)}`,
                    {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isCompleted: newValue }),
                    }
                ),
                fetch(`${FASTAPI_URL}/agent/${plan.id}/steps/${stepId}/sync-cache`, {
                    method: 'PATCH',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ isCompleted: newValue }),
                }),
            ])

            const springOk = springRes.status === 'fulfilled' && springRes.value.ok
            if (!springOk) {
                // roll back only on the source-of-truth failure — cache-sync failing alone isn't worth rolling back for
                setSteps(prevSteps)
            }
        } catch {
            setSteps(prevSteps)
        } finally {
            setPendingStepId(null)
        }
    }

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 space-y-2.5 shadow-sm">
            {/* Header: title + action icons */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                        <ListChecks className="h-3.5 w-3.5" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-100 truncate">
                        {plan.title}
                    </h4>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {onView && (
                        <button
                            type="button"
                            onClick={() => onView(plan)}
                            title="View plan"
                            className="p-1.5 rounded-md text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                        >
                            <Eye className="h-3.5 w-3.5" />
                        </button>
                    )}
                    {totalCount > 0 && (
                        <button
                            type="button"
                            onClick={() => setExpanded(e => !e)}
                            title={expanded ? 'Hide steps' : 'See steps'}
                            className="p-1.5 rounded-md text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                        >
                            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                    )}
                    {onEdit && (
                        <button
                            type="button"
                            onClick={() => onEdit(plan)}
                            title="Edit plan"
                            className="p-1.5 rounded-md text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            type="button"
                            onClick={() => plan.id && onDelete(plan.id)}
                            title="Delete plan"
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{completedCount} / {totalCount} steps complete</span>
                    <span className="font-mono text-indigo-400">{progressPct}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                        className="h-full bg-indigo-500 transition-all"
                        style={{ width: `${progressPct}%` }}
                    />
                </div>
            </div>

            {/* Collapsed preview (unchanged — keeps base card height identical) */}
            {!expanded && totalCount > 0 && (
                <ul className="space-y-1 pt-1 border-t border-slate-800/60">
                    {steps.slice(0, 3).map((step, idx) => (
                        <li key={step.id ?? idx} className="flex items-center gap-1.5 text-[11px] leading-snug">
                            {step.isCompleted ? (
                                <CheckCircle2 className="h-3 w-3 text-indigo-400 shrink-0" />
                            ) : (
                                <Circle className="h-3 w-3 text-slate-600 shrink-0" />
                            )}
                            <span className={`truncate ${step.isCompleted ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                                {step.content}
                            </span>
                        </li>
                    ))}
                    {totalCount > 3 && (
                        <li className="text-[10px] text-slate-500 pl-4.5">
                            +{totalCount - 3} more step{totalCount - 3 === 1 ? '' : 's'}
                        </li>
                    )}
                </ul>
            )}

            {/* Expanded: every step, clickable to toggle — grows the card, only on demand */}
            {expanded && totalCount > 0 && (
                <ul className="space-y-1 pt-1 border-t border-slate-800/60">
                    {steps.map((step, idx) => (
                        <li key={step.id ?? idx}>
                            <button
                                type="button"
                                disabled={pendingStepId === step.id}
                                onClick={() => step.id && handleStepToggle(step.id, !step.isCompleted)}
                                className="w-full flex items-center gap-1.5 text-[11px] leading-snug text-left py-0.5 disabled:opacity-50"
                            >
                                {step.isCompleted ? (
                                    <CheckCircle2 className="h-3 w-3 text-indigo-400 shrink-0" />
                                ) : (
                                    <Circle className="h-3 w-3 text-slate-600 shrink-0" />
                                )}
                                <span className={step.isCompleted ? 'text-slate-500 line-through' : 'text-slate-300'}>
                                    {step.content}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}