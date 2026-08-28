import { Calendar } from 'lucide-react'

export interface TaskCard {
  id: number
  title: string
  description?: string
  status: string
  priority: string
  dueDate?: string
}

export const TaskCardComponent = ({ task }: { task: TaskCard }) => {
  const priorityColors = {
    HIGH: 'bg-red-50 text-red-600 border-red-200',
    MEDIUM: 'bg-amber-50 text-amber-600 border-amber-200',
    LOW: 'bg-blue-50 text-blue-600 border-blue-200'
  }

  const statusColors = {
    TODO: 'bg-slate-100 text-slate-600',
    IN_PROGRESS: 'bg-indigo-50 text-indigo-600',
    DONE: 'bg-emerald-50 text-emerald-600'
  }

  return (
    <div className="bg-white p-3 rounded-lg border border-slate-300 shadow-md shadow-indigo-100 text-xs space-y-2 my-2.5 text-left w-60">
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold text-slate-900 leading-snug">
          {/* <span className="text-slate-400 font-mono mr-1.5">#{task.id}</span> */}
          {task.title}
        </div>
        <span
          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${
            priorityColors[task.priority as keyof typeof priorityColors] || 'bg-slate-50 text-slate-600 border-slate-200'
          }`}
        >
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
        <span
          className={`px-2 py-0.5 rounded-md font-medium text-[10px] ${
            statusColors[task.status as keyof typeof statusColors] || 'bg-slate-100 text-slate-600'
          }`}
        >
          {task.status}
        </span>
        <div className="flex items-center gap-1 text-slate-500 font-mono text-[10px]">
          <Calendar size={12} />
          <span>{task.dueDate || 'No date'}</span>
        </div>
      </div>
    </div>
  )
}