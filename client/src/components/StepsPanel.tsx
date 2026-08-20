import { Plus, Trash2, GripVertical, Check, Loader2, X, NotepadTextDashed } from 'lucide-react'
import type { Plan, Step } from '../types/plan'

interface StepsModalProps {
    title: string
    setTitle: (value: string) => void
    steps: Step[]
    draggedIdx: number | null
    onDragStart: (e: React.DragEvent, index: number) => void
    onDragOver: (e: React.DragEvent, index: number) => void
    onDragEnd: () => void
    onToggleStep: (index: number) => void
    onStepContentChange: (index: number, content: string) => void
    onRemoveStep: (index: number) => void
    onAddStep: () => void
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
    isSaving: boolean
    isEditing: boolean
    initialPlan?: Plan | null
    onClose: () => void
}

export default function StepsModal({
    title,
    setTitle,
    steps,
    draggedIdx,
    onDragStart,
    onDragOver,
    onDragEnd,
    onToggleStep,
    onStepContentChange,
    onRemoveStep,
    onAddStep,
    onSubmit,
    isSaving,
    isEditing,
    initialPlan,
    onClose
}: StepsModalProps) {
    return (
        <form onSubmit={onSubmit} className="flex flex-col min-h-0 h-full bg-slate-950 border-l border-slate-800 p-8 pt-5 pb-6 text-slate-100  gap-4">
            {/* Header */}
           <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
    {/* Left Header & Metadata */}
    <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-sm">
            <NotepadTextDashed className="h-4 w-4" />
        </div>
        <div>
            <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold text-slate-100 tracking-wide">
                    {initialPlan ? 'Edit Execution Plan' : 'Create Execution Plan'}
                </h3>
                
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
                {initialPlan ? 'Modify your step sequence and details' : 'Draft a new execution roadmap'}
            </p>
        </div>
    </div>

    {/* Clear Actionable Close Button */}
    <button
        type="button"
        onClick={onClose}
        className="group flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all active:scale-95 shadow-sm"
        title="Close modal (Esc)"
    >
        <X className="h-3 w-3 text-slate-400 group-hover:text-rose-400 group-hover:rotate-90 transition-transform duration-200" />
        <span className="text-[11px] font-medium">Close</span>
        <kbd className="hidden sm:inline-block text-[8px] font-mono bg-slate-800 group-hover:bg-rose-950/50 text-slate-400 group-hover:text-rose-300 px-1.5 py-0.5 rounded border border-slate-700/60 group-hover:border-rose-500/30 transition-colors">
            ESC
        </kbd>
    </button>
</div>

            {/* Title Input */}
            <div className="shrink-0 space-y-1">
                <label className="text-[12px] font-medium text-slate-300 tracking-wide flex items-center gap-1 ">
                   <p className='text-xs font-semibold'> PLAN TITLE</p> <span className="text-indigo-400">*</span>
                </label>
                <input
                    required
                    type="text"
                    placeholder="e.g., Spring Boot Microservice Deployment Plan"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="mt-2 w-full rounded-md border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
            </div>

            {/* Steps Container */}
            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3 shrink-0">
                    <label className="flex  items-center  gap-2 text-xs font-medium text-slate-300 tracking-wide">
                       <p className='text-xs font-semibold '>  STEPS & SEQUENCE  </p> 
                       <span className="text-slate-500 text-[11px] font-normal ">(Drag handle to re-order)</span>
                    </label>
                    <span className="text-[10px] font-mono font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-md">
                        {steps.length} {steps.length === 1 ? 'Step' : 'Steps'}
                    </span>
                </div>

                <div className="relative flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                    {steps.map((step, idx) => {
                        const isLast = idx === steps.length - 1
                        const isCompleted = step.isCompleted
                        const isNextCompleted = steps[idx + 1]?.isCompleted
                        const isLineActive = isCompleted && isNextCompleted

                        return (
                            <div
                                key={idx}
                                draggable
                                onDragStart={e => onDragStart(e, idx)}
                                onDragOver={e => onDragOver(e, idx)}
                                onDragEnd={onDragEnd}
                                className={`group relative flex items-center gap-3 rounded-sm border px-2 py-1.5 transition-all ${draggedIdx === idx
                                    ? 'border-indigo-500 bg-indigo-500/10 opacity-60 scale-[0.99]'
                                    : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                                    }`}
                            >
                                {/* Connector Line */}
                                {!isLast && (
                                    <span
                                        className={`absolute left-[43px] top-[34px] w-[2px] h-[calc(100%+6px)] z-0 transition-colors ${isLineActive
                                            ? 'bg-indigo-500'
                                            : isCompleted
                                                ? 'bg-gradient-to-b from-indigo-500 to-slate-800'
                                                : 'bg-slate-800'
                                            }`}
                                    />
                                )}

                                <GripVertical className="h-4 w-4 text-slate-500 group-hover:text-slate-300 cursor-grab active:cursor-grabbing shrink-0 transition-colors" />

                                {/* Step Completion Toggle */}
                                <button
                                    type="button"
                                    onClick={() => onToggleStep(idx)}
                                    className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${isCompleted
                                        ? 'border-indigo-500 bg-indigo-600 text-white'
                                        : 'border-slate-700 bg-slate-950 text-transparent hover:border-indigo-400'
                                        }`}
                                >
                                    <Check className="h-3 w-3 stroke-[3]" />
                                </button>

                                {/* Step Content Input */}
                                <input
                                    type="text"
                                    placeholder={`Step ${idx + 1} details...`}
                                    value={step.content}
                                    onChange={e => onStepContentChange(idx, e.target.value)}
                                    className={`flex-1 bg-transparent text-xs outline-none transition-colors ${isCompleted ? 'line-through text-slate-500' : 'text-slate-100 placeholder-slate-500'
                                        }`}
                                />

                                {/* Delete Step Button */}
                                <button
                                    type="button"
                                    onClick={() => onRemoveStep(idx)}
                                    className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-md transition-colors"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        )
                    })}
                </div>

                {/* Add Step Button */}
                <button
                    type="button"
                    onClick={onAddStep}
                    className="mt-3.5 w-full py-2.5 rounded-md border border-dashed border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 active:scale-[0.99] text-indigo-400 text-xs font-medium transition-all flex items-center justify-center gap-1.5 shrink-0 group"
                >
                    <Plus className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span>Add Step</span>
                </button>
            </div>

            {/* Save / Submit Button */}
            <div className="pt-1 shrink-0">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-xs tracking-wide transition-all flex items-center justify-center gap-2"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin text-white" />
                            <span>Saving Plan...</span>
                        </>
                    ) : isEditing ? (
                        'Save Changes'
                    ) : (
                        'Create Plan'
                    )}
                </button>
            </div>
        </form>
    )
}
