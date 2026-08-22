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

  const handleToggleStep = (planId?: number, stepIndex?: number) => {
    if (!planId || stepIndex === undefined) return
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
    <div className="pt-6 pl-9 lg:pl-11 pr-4 pb-20 space-y-6 max-w-[98%] w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Execution Plans <ListTodo className="h-6 w-6 text-indigo-400" />
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Structured developer scratchpads with draggable step ordering & sequential step lines
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" /> Create Plan
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-600/20 p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono text-slate-500 uppercase">Total Plans</p>
            <p className="text-2xl font-bold font-mono text-white mt-1">{plans.length}</p>
          </div>
          <Layers className="h-5 w-5 text-indigo-400" />
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-600/20 p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono text-slate-500 uppercase">Total Steps</p>
            <p className="text-2xl font-bold font-mono text-amber-400/90 mt-1">{totalSteps}</p>
          </div>
          <Clock className="h-5 w-5 text-amber-400" />
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-600/20 p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono text-slate-500 uppercase">Completed Steps</p>
            <p className="text-2xl font-bold font-mono text-emerald-400/90 mt-1">
              {completedSteps} / {totalSteps}
            </p>
          </div>
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        </div>
      </div>

      {/* Toolbar Search */}
      <div className="flex items-center justify-between gap-3 pt-2 pb-1">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search plans or step contents..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-500/70 bg-slate-950/60 py-2 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Plans List */}
      {plans.length !== 0  ?  (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {filteredPlans.map(plan => {
          const finished = plan.steps.filter(s => s.isCompleted).length
          const percent = plan.steps.length ? Math.round((finished / plan.steps.length) * 100) : 0

          return (
            <div
              key={plan.id}
              className="h-[485px] rounded-xl border border-white/5 bg-gradient-to-b from-indigo-900/60 via-slate-900/40 to-indigo-950/70 backdrop-blur-xl p-5 hover:border-white/20 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-4 flex-1 min-h-0 flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 shrink-0">
                  <h3
                    onClick={() => handleOpenEditModal(plan)}
                    className="font-semibold text-sm text-slate-100 hover:text-indigo-400 transition cursor-pointer"
                  >
                    {plan.title}
                  </h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEditModal(plan)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800/80 transition"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTaskId(plan.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 shrink-0">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>Progress</span>
                    <span className="text-emerald-400">{percent}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.6)] transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Connected Sequential Step Tree */}
                <div className="relative pt-2 space-y-3 flex-1 overflow-y-auto pr-1.5 custom-scrollbar">
                  {plan.steps.map((step, idx) => {
                    const isLast = idx === plan.steps.length - 1
                    const isCompleted = step.isCompleted
                    const isNextCompleted = plan.steps[idx + 1]?.isCompleted
                    const isLineActive = isCompleted && isNextCompleted

                    return (
                      <div key={step.id || idx} className="relative flex items-center gap-3">
                        {!isLast && (
                          <span
                            className={`absolute left-[11px] top-[22px] w-[2px] h-[calc(100%+6px)] z-0 transition-all duration-300 ${
                              isLineActive
                                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                                : isCompleted
                                ? 'bg-gradient-to-b from-emerald-500 to-slate-800'
                                : 'bg-slate-800'
                            }`}
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => handleToggleStep(plan.id, idx)}
                          className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                            isCompleted
                              ? 'border-emerald-400 bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.6)]'
                              : 'border-slate-700 bg-slate-950 text-transparent hover:border-slate-500'
                          }`}
                        >
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </button>

                        <div
                          onClick={() => handleToggleStep(plan.id, idx)}
                          className="flex-1 rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 hover:border-white/20 hover:bg-slate-950/70 cursor-pointer transition flex items-center justify-between"
                        >
                          <span
                            className={`text-xs ${
                              isCompleted ? 'line-through text-slate-400' : 'text-slate-200 font-medium'
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

              {/* Owner Footer */}
              <div className="pt-3 border-t border-slate-100/20 flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2 shrink-0">
                <span>{plan.ownerEmail}</span>
                <span>{plan.steps.length} Steps</span>
              </div>
            </div>
          )
        })}
      </div>):(
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 py-16 px-4 text-center">
          <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4 shadow-inner">
            {searchQuery.trim() ? (
              <FolderSearch className="h-6 w-6" />
            ) : (
              <ListTodo className="h-6 w-6" />
            )}
          </div>

          <h3 className="text-base font-semibold text-slate-200 mb-1">
            {searchQuery.trim() ? 'No matching plans found' : 'No plans created yet'}
          </h3>

          <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-6">
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
    </div>
  )
}
