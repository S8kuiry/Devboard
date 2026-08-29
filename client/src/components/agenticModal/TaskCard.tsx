import { Calendar, Eye } from 'lucide-react'
import type { Task } from '../../types/task'

// TaskCard is just Task, kept as its own name so this file's contract
// is explicit about what it renders — but it can never drift from
// the real Task shape again, since it's derived, not hand-copied.
export type TaskCard = Task

interface TaskCardComponentProps {
  task: TaskCard
  onView?: (task: TaskCard) => void
}

export const TaskCardComponent = ({ task, onView }: TaskCardComponentProps) => {
  const priorityColors: Record<TaskCard['priority'], string> = {
    HIGH: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    LOW: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  }

  const statusColors: Record<TaskCard['status'], string> = {
    TODO: 'bg-slate-800 text-slate-400 border border-slate-700/50',
    IN_PROGRESS: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    DONE: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-3.5 space-y-2.5 shadow-sm">
      {/* Header: Title + View icon + Priority Badge */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-semibold text-slate-100 leading-snug truncate">
          {task.title}
        </h4>

        <div className="flex items-center gap-1 shrink-0">
          {onView && (
            <button
              type="button"
              onClick={() => onView(task)}
              title="View task"
              className="p-1.5 rounded-md text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          )}
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${
              priorityColors[task.priority] || 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {task.priority}
          </span>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Footer: Status + Due Date */}
      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
        <span
          className={`px-2 py-0.5 rounded-md font-medium text-[10px] ${
            statusColors[task.status] || 'bg-slate-800 text-slate-400'
          }`}
        >
          {task.status}
        </span>
        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[10px]">
          <Calendar size={12} className="text-slate-400 shrink-0" />
          <span>{task.dueDate || 'No date'}</span>
        </div>
      </div>
    </div>
  )
}