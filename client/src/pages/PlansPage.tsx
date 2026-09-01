import { useEffect, useState } from 'react'
import {
  CheckCircle2, Plus, Layers, Search, Clock,
  Trash2, Check, Edit3, ListTodo,
  FolderSearch,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { Plan } from '../types/plan'
import PlanModal from '../components/PlanModal'
import { useUsers } from '../context/UserContext'
import DeleteModal from '../components/DeleteModal'
import { usePlanModal } from '../context/PlanModalContext'
import AgenticModal from '../components/AgenticModal'

export default function PlansPage() {
  const { user, fetchPlans, plansTasks } = useUsers()
  const { isOpen, openModal, closeModal, clearDraft, initialPlan } = usePlanModal()

  const CURRENT_USER_EMAIL = user?.email || 'developer@devboard.io'
  const todoUrl = import.meta.env.VITE_TASK_URL

  const [plans, setPlans] = useState<Plan[]>(plansTasks)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTaskId, setDeleteTaskId] = useState<number | undefined>(undefined)

  // Metrics
  const totalSteps = plans.reduce((acc, p) => acc + p.steps.length, 0)
  const completedSteps = plans.reduce((acc, p) => acc + p.steps.filter(s => s.isCompleted).length, 0)

  // Filtered Plans
  const filteredPlans = plans.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.steps.some(s => s.content.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleOpenCreateModal = () => {
    openModal(null)
  }

  const handleOpenEditModal = (plan: Plan) => {
    openModal(plan)
  }

  const handleDeletePlan = async (id?: number) => {
    if (!id) return

    try {
      const res = await fetch(`${todoUrl}/plans/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        // Optimistic UI update
        setPlans(prev => prev.filter(p => p.id !== id))
        fetchPlans()
        toast.success('Plan deleted')
      } else {
        const resBody = await res.json().catch(() => ({}))
        toast.error(resBody.error || "Plan could not be deleted")
      }
    } catch (error) {
      console.error("Error deleting plan:", error)
      toast.error("Failed to delete plan")
    } finally {
      setDeleteTaskId(undefined)
    }
  }

  const handleToggleStep = async (planId?: number, stepIndex?: number) => {
    if (!planId || stepIndex === undefined) return

    const targetStep = plans.find(p => p.id === planId)?.steps[stepIndex]
    if (!targetStep?.id) return

    // 1. Optimistic Update in UI
    setPlans(prev =>
      prev.map(plan => {
        if (plan.id !== planId) return plan
        const updatedSteps = [...plan.steps]
        updatedSteps[stepIndex] = {
          ...updatedSteps[stepIndex],
          isCompleted: !updatedSteps[stepIndex].isCompleted
        }
        return { ...plan, steps: updatedSteps }
      })
    )

    // 2. Network Request in background
    try {
      const res = await fetch(`${todoUrl}/plans/steps/${targetStep.id}/toggle`, {
        method: 'PATCH',
      })
      if (!res.ok) throw new Error('Failed to toggle step')
    } catch (error) {
      // Revert state on failure
      toast.error('Could not save step progress')
      // ...revert state logic
    }
  }

  // Keep local plans in sync with Context plansTasks
  useEffect(() => {
    if (plansTasks) {
      setPlans(plansTasks)
    }
  }, [plansTasks])

  // Trigger fetch on mount / user load
  useEffect(() => {
    if (user?.email) {
      fetchPlans()
    }
  }, [user?.email])

  // Refetch latest state from backend and clear modal draft
  const handleSavePlan = () => {
    fetchPlans()
    clearDraft() // Reset context draft & remove from localStorage
  }

  return (
    <div className="pt-6 pl-3 lg:pl-3 pr-4 pb-20 space-y-6 max-w-[98%] w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Execution Plans <ListTodo className="h-6 w-6 text-indigo-400" />
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Structured developer scratchpads with draggable step ordering & sequential step lines
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition active:scale-[0.98] shadow-md shadow-indigo-600/20"
          >
            <Plus className="h-4 w-4" /> Create Plan
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-700/70 bg-gradient-to-br from-slate-800/90 via-slate-800/60 to-slate-900/90 p-4 flex items-center justify-between shadow-lg shadow-slate-950/40 backdrop-blur-md">
          <div>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Total Plans</p>
            <p className="text-2xl font-bold font-mono text-white mt-1">{plans.length}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Layers className="h-5 w-5" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-700/70 bg-gradient-to-br from-slate-800/90 via-slate-800/60 to-slate-900/90 p-4 flex items-center justify-between shadow-lg shadow-slate-950/40 backdrop-blur-md">
          <div>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Total Steps</p>
            <p className="text-2xl font-bold font-mono text-amber-300 mt-1">{totalSteps}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-700/70 bg-gradient-to-br from-slate-800/90 via-slate-800/60 to-slate-900/90 p-4 flex items-center justify-between shadow-lg shadow-slate-950/40 backdrop-blur-md">
          <div>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Completed Steps</p>
            <p className="text-2xl font-bold font-mono text-emerald-300 mt-1">
              {completedSteps} / {totalSteps}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Toolbar Search */}
      <div className="flex items-center justify-between gap-3 pt-2 pb-1">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search plans or step contents..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-700/80 bg-slate-900/80 py-2 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30 transition shadow-inner"
          />
        </div>
      </div>

      {/* Plans Grid */}
      {plans.length !== 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {filteredPlans.map(plan => {
            const finished = plan.steps.filter(s => s.isCompleted).length
            const percent = plan.steps.length ? Math.round((finished / plan.steps.length) * 100) : 0

            return (
              <div
                key={plan.id}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-700/80 bg-gradient-to-b from-slate-600/20 via-slate-600/5 to-slate-600/20 p-5 backdrop-blur-md transition-all duration-300 hover:border-indigo-400/60 hover:scale-101 hover:shadow-xl "
              >
                {/* Top Section */}
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3
                        onClick={() => handleOpenEditModal(plan)}
                        className="font-bold text-sm text-white hover:text-indigo-300 transition cursor-pointer tracking-tight"
                      >
                        {plan.title}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400 truncate max-w-[180px] block mt-0.5">
                        {plan.ownerEmail}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleOpenEditModal(plan)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-indigo-300 hover:bg-slate-700/50 transition"
                        title="Edit Plan"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTaskId(plan.id)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Delete Plan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-300 uppercase tracking-wider font-medium">Progress</span>
                      <span className="text-emerald-300 font-bold">{finished}/{plan.steps.length} ({percent}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-700/60 rounded-full overflow-hidden border border-slate-700/80">
                      <div
                        className="h-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)] transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Fixed-Height Stepper Tree */}
                  <div className="relative pt-3 pb-2 space-y-3 h-64 overflow-y-auto px-2 pr-2.5 custom-scrollbar">
                    {plan.steps.map((step, idx) => {
                      const isLast = idx === plan.steps.length - 1
                      const isCompleted = step.isCompleted
                      const isNextCompleted = plan.steps[idx + 1]?.isCompleted
                      const isLineActive = isCompleted && isNextCompleted

                      return (
                        <div key={step.id || idx} className="relative flex items-start gap-3 group/step">
                          {/* Vertical Connecting Line */}
                          {!isLast && (
                            <span
                              className={`absolute left-[9px] top-[21px] w-[2px] h-[calc(100%+12px)] z-0 transition-colors duration-300 ${
                                isLineActive
                                  ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                                  : isCompleted
                                  ? 'bg-gradient-to-b from-emerald-400 to-slate-700'
                                  : 'bg-slate-700/80'
                              }`}
                            />
                          )}

                          {/* Step Checkbox */}
                          <button
                            type="button"
                            onClick={() => handleToggleStep(plan.id, idx)}
                            className={`relative z-10 mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
                              isCompleted
                                ? 'border-emerald-400 bg-emerald-400 text-slate-950 shadow-[0_0_10px_rgba(52,211,153,0.7)] scale-105'
                                : 'border-slate-600 bg-slate-900 text-transparent hover:border-indigo-400 hover:bg-slate-800'
                            }`}
                          >
                            <Check className="h-3 w-3 stroke-[3]" />
                          </button>

                          {/* Step Content Card */}
                          <div
                            onClick={() => handleToggleStep(plan.id, idx)}
                            className="flex-1 rounded-md border border-slate-700/70 bg-slate-800/80 px-3 py-2 hover:border-indigo-500/40 hover:bg-slate-750 hover:bg-slate-800 cursor-pointer transition flex items-center justify-between shadow-xs"
                          >
                            <span
                              className={`text-xs leading-relaxed transition-all ${
                                isCompleted ? 'line-through text-slate-400 font-normal' : 'text-slate-100 font-medium'
                              }`}
                            >
                              {step.content}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Footer Metadata */}
                <div className="pt-3 mt-4 border-t border-slate-700/70 flex items-center justify-between text-[10px] font-mono text-slate-300">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    Sequential Plan
                  </span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-200 font-medium">
                    {plan.steps.length} Steps
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/60 py-16 px-4 text-center shadow-lg">
          <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4 shadow-inner">
            {searchQuery.trim() ? (
              <FolderSearch className="h-6 w-6" />
            ) : (
              <ListTodo className="h-6 w-6" />
            )}
          </div>

          <h3 className="text-base font-semibold text-slate-100 mb-1">
            {searchQuery.trim() ? 'No matching plans found' : 'No plans created yet'}
          </h3>

          <p className="text-xs text-slate-300 max-w-sm leading-relaxed mb-6">
            {searchQuery.trim()
              ? `We couldn't find any plan or step content matching "${searchQuery}". Try refining your search.`
              : 'Start organizing your roadmap by creating structured execution plans with auto-sequenced steps.'}
          </p>
        </div>
      )}

      {/* Plan Builder Modal */}
      {isOpen && (
        <PlanModal
          initialPlan={initialPlan}
          currentUserEmail={initialPlan?.ownerEmail || CURRENT_USER_EMAIL}
          onClose={closeModal}
          onSave={handleSavePlan}
        />
      )}

      {deleteTaskId !== undefined && (
        <DeleteModal
          isOpen
          onClose={() => setDeleteTaskId(undefined)}
          onConfirm={() => handleDeletePlan(deleteTaskId)}
          title="Delete Plan"
          itemName={plans.find(t => t.id === deleteTaskId)?.title}
        />
      )} 

      <AgenticModal/>
    </div>
  )
}
