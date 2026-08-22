import { useEffect, useState } from 'react'
import {
  CheckCircle2, Plus, UserCheck, Layers, Search,
  Clock, Kanban, Table as TableIcon, Trash2, Calendar, ArrowUpDown,
  Inbox,
  Edit3
} from 'lucide-react'
import type { Task, TaskPriority, TaskStatus } from '../types/task'
import TaskModal from '../components/TaskModal'
import DeleteModal from '../components/DeleteModal'
import Loader from '../components/Loader'
import toast from 'react-hot-toast'
import { useUsers } from '../context/UserContext'

export type SortOption = 'priority' | 'status' | 'assigned' | 'dueDate'

// --- Initial Mock Data ---
const INITIAL_TASKS: Task[] = [
 
]

export default function Dashboard() {
  const {user,fetchAssignedTasks} = useUsers()
  const taskUrl = import.meta.env.VITE_TASK_URL
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)
  // True until the first /tasks response lands, and again on every refetch.
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('priority')
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  // Id of the task pending delete confirmation
  const [deleteTaskId, setDeleteTaskId] = useState<number | null>(null)

  const CURRENT_USER_EMAIL = user?.email

  const handleOpenCreateModal = () => {
    setSelectedTask(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (task: Task) => {
    setSelectedTask(task)
    setIsModalOpen(true)
  }

  // Receives the task as saved by the server, so it already carries a real id.
  const handleSaveTask = (savedTask: Task) => {
    setTasks(prev => prev.some(t => t.id === savedTask.id)
      ? prev.map(t => t.id === savedTask.id ? savedTask : t)
      : [...prev, savedTask])
    fetchTasks();
    setIsModalOpen(false)
    setSelectedTask(null)
  }

  const handleCloseTaskModal = () => {
    setIsModalOpen(false)
    setSelectedTask(null)
  }

  const handleStatusChange = async(id: number, newStatus: TaskStatus, task:Task) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))
    try {
      const data = {
        title: task.title,
      description: task.description,
      status: newStatus,
      priority: task.priority,
      ownerEmail: task.ownerEmail,
      assignedEmails: task.assignedEmails,
      startDate: task.startDate || null,
      dueDate: task.dueDate || null

      }
      const res = await fetch(`${taskUrl}/tasks/${id}`,{
        method:'PUT',
        headers: { "Content-Type": "application/json" },
        body:JSON.stringify(data)


      })

      if(res.ok){
        toast.success("Task Status chnaged successfully ")
      }
      
    } catch (error) {
      console.log(error)
      
    }
  }

  // Opens the confirmation modal; the actual delete happens in handleDelete
  const handleDeleteTask = (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    setDeleteTaskId(id)
  }

  // --- Filtering & Sorting ---
  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const priorityWeight: Record<TaskPriority, number> = { HIGH: 1, MEDIUM: 2, LOW: 3 }
  const statusWeight: Record<TaskStatus, number> = { TODO: 1, IN_PROGRESS: 2, DONE: 3 }

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'priority') return priorityWeight[a.priority] - priorityWeight[b.priority]
    if (sortBy === 'status') return statusWeight[a.status] - statusWeight[b.status]
    // if (sortBy === 'assigned') return (b.assignedEmails?.length || 0) - (a.assignedEmails?.length || 0)
    if (sortBy === 'dueDate') {
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return a.dueDate.localeCompare(b.dueDate)
    }
    return 0
  })

  // Fixed 3 columns config with column-specific empty messages
  const columns: {
    label: string;
    status: TaskStatus;
    color: string;
    badge: string;
    dot: string;
    spinner: string;
    emptyMessage: string;
  }[] = [
      {
        label: 'TO DO',
        status: 'TODO',
        color: 'border-indigo-500/20 bg-gradient-to-b from-indigo-500/10 via-slate-900/40 to-slate-900/20 backdrop-blur-xl hover:border-indigo-500/40',
        badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        dot: 'bg-indigo-400',
        spinner: 'text-indigo-400',
        emptyMessage: 'No tasks to do'
      },
      {
        label: 'IN PROGRESS',
        status: 'IN_PROGRESS',
        color: 'border-amber-500/25 bg-gradient-to-b from-amber-500/10 via-slate-900/40 to-slate-900/20 backdrop-blur-xl hover:border-amber-500/40',
        badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        dot: 'bg-amber-400 animate-pulse',
        spinner: 'text-amber-400',
        emptyMessage: 'No tasks in progress'
      },
      {
        label: 'DONE',
        status: 'DONE',
        color: 'border-emerald-500/25 bg-gradient-to-b from-emerald-500/10 via-slate-900/40 to-slate-900/20 backdrop-blur-xl hover:border-emerald-500/40',
        badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        dot: 'bg-emerald-400',
        spinner: 'text-emerald-400',
        emptyMessage: 'No completed tasks'
      }
    ]


  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'HIGH': return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      case 'MEDIUM': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'LOW': return 'bg-indigo-500/10 text-indigo-400 border-indigo-700'
    }
  }


  const fetchTasks = async () => {
    // The user arrives from context a tick after mount, so skip until we have it
    if (!CURRENT_USER_EMAIL) return
    setIsLoading(true)
    try {
      // GET /tasks requires ownerEmail and responds with a bare array of tasks
      const res = await fetch(`${taskUrl}/tasks?ownerEmail=${encodeURIComponent(CURRENT_USER_EMAIL)}`, {
        method: 'GET'
      })
      const resBody = await res.json()
      if (res.ok) {
        setTasks(resBody as Task[])
      } else {
        console.error(resBody.error || "Failed to fetch task")
      }

    } catch (error) {
      console.error("Something went wrong")
      console.log("Error:", error)

    } finally {
      // finally, so a failed fetch clears the spinner instead of hanging on it
      setIsLoading(false)
    }
  }


  useEffect(() => {
    fetchTasks()
  }, [CURRENT_USER_EMAIL])

  const handleDelete = async(id:number)=>{
    try {

      const res = await fetch(`${taskUrl}/tasks/${id}`,{
        method: 'DELETE',

      })

      const resBody = await res.json()
      if(res.ok){
        setTasks(prev => prev.filter(t => t.id !== id))
        toast.success(resBody.message || "Task deleted successfully")
        fetchAssignedTasks()

      }else{
        console.error(resBody.error || "Task not deleted")
      }
      
    } catch (error) {
      console.error("Something went wrong");
      console.log("Error:", error);
      

      
    }
  }

  

  return (
    <div className="pt-6 pl-9 lg:pl-11 pr-4 pb-20 space-y-6 max-w-[98%] w-full mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">Task  Board</h1>
          <p className="text-xs text-slate-400 mt-1">Organize microservice tasks and track team assignments</p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> Create Task
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-600/20 p-4 flex items-center justify-between ">
          <div><p className="text-[10px] font-mono text-slate-500 uppercase">Total Tasks</p><p className="text-2xl font-bold font-mono text-white mt-1">{tasks.length}</p></div>
          <Layers className="h-5 w-5 text-indigo-400" />
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-600/20  p-4 flex items-center justify-between ">
          <div><p className="text-[10px] font-mono text-slate-500 uppercase">In Progress</p><p className="text-2xl font-bold font-mono text-amber-400/90 mt-1">{tasks.filter(t => t.status === 'IN_PROGRESS').length}</p></div>
          <Clock className="h-5 w-5 text-amber-400" />
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-600/20  p-4 flex items-center justify-between ">
          <div><p className="text-[10px] font-mono text-slate-500 uppercase">Completed</p><p className="text-2xl font-bold font-mono text-emerald-400/90 mt-1">{tasks.filter(t => t.status === 'DONE').length}</p></div>
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 pb-1">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-500/70 bg-slate-950/60 py-2 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-indigo-400" />
            <span className="text-[11px] font-mono text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-xs text-slate-200 outline-none font-medium cursor-pointer"
            >
              <option value="priority" className="bg-slate-900 text-slate-200">Priority</option>
              <option value="status" className="bg-slate-900 text-slate-200">Status</option>
              {/* <option value="assigned" className="bg-slate-900 text-slate-200">Assigned</option> */}
              <option value="dueDate" className="bg-slate-900 text-slate-200">Due Date</option>
            </select>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 p-1">
            <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${viewMode === 'kanban' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              <Kanban className="h-3.5 w-3.5" /> Board Mode
            </button>
            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              <TableIcon className="h-3.5 w-3.5" /> Table View
            </button>
          </div>
        </div>
      </div>

      {/* Main Task Display */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-300">
          {columns.map((column) => {
            const columnTasks = sortedTasks.filter(t => t.status === column.status)

            return (
              <div
                key={column.status}
                className={`rounded-xl border p-4 space-y-4 transition-all duration-200 ${column.color} max-h-166 overflow-hidden overflow-y-scroll`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${column.dot}`} />
                    <h2 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-200">
                      {column.label}
                    </h2>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-mono rounded-md border ${column.badge}`}>
                    {isLoading ? '–' : columnTasks.length}
                  </span>
                </div>

                {isLoading ? (
                  <Loader accent={column.spinner} label="Loading tasks…" />
                ) : columnTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-8 text-slate-500">
                    <Inbox className="h-5 w-5" />
                    <p className="text-[11px] font-mono">{column.emptyMessage}</p>
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <div
                    onClick={() => handleOpenEditModal(task)}
                      key={task.id}
                      className="group relative rounded-lg border border-white/10 bg-slate-700/5 p-4 space-y-3 hover:border-white/20 hover:bg-slate-900/90 shadow-lg backdrop-blur-md transition-all duration-200 "
                    >
                      {/* Header: Title & Actions */}
                      <div className="flex justify-between items-start gap-2">
                        <h3
                          onClick={() => handleOpenEditModal(task)}
                          className="font-semibold text-xs text-slate-100 hover:text-indigo-400 cursor-pointer transition line-clamp-1"
                          title={task.title}
                        >
                          {task.title}
                        </h3>
                        <button
                          onClick={(e) => handleDeleteTask(e, task.id)}
                          className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-white/5 transition shrink-0"
                          title="Delete Task"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Description */}
                      {task.description && (
                        <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Owner & Assignees Section */}
                      <div className="space-y-1.5 pt-1">
                        {/* Owner Badge */}
                        {task.ownerEmail && (
                          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                            <span className="text-slate-500">Owner:</span>
                            <span className="truncate text-slate-300" title={task.ownerEmail}>
                              {task.ownerEmail.split('@')[0]}
                            </span>
                          </div>
                        )}

                        {/* Assignee Badges */}
                        {task.assignedEmails?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {task.assignedEmails.map((email, idx) => (
                              <span
                                key={idx}
                                title={email}
                                className="inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/15 px-2 py-0.5 text-[9px] font-mono text-indigo-300 max-w-[110px]"
                              >
                                <span className="h-1 w-1 rounded-full bg-indigo-400 shrink-0" />
                                <span className="truncate">{email}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer: Status, Priority, & Date Range */}
                      <div className="pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                        {/* Status Selector */}
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus,task)}
                          className="bg-slate-950/80 border border-white/10 rounded-md px-2 py-1 text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="TODO" className="bg-slate-900 text-indigo-200">TODO</option>
                          <option value="IN_PROGRESS" className="bg-slate-900 text-yellow-200">IN PROGRESS</option>
                          <option value="DONE" className="bg-slate-900 text-emerald-200">DONE</option>
                        </select>

                        <div className="flex items-center gap-2">
                          {/* Priority Badge */}
                          <span className={`px-2 py-0.5 text-[9px] font-mono rounded-md border ${getPriorityBadge(task.priority)}`}>
                            {task.priority}
                          </span>

                          {/* Start & Due Date Range */}
                          <div className="font-mono text-slate-300 flex items-center gap-1 text-[10px]">
                            <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>
                              {task.startDate ? task.startDate.slice(5) : ''}
                              {task.startDate && task.dueDate ? ' → ' : ''}
                              {task.dueDate ? task.dueDate.slice(5) : 'No due'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Task Details</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Assignees</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sortedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 font-mono">No tasks found.</td>
                  </tr>
                ) : (
                  sortedTasks.map(task => (
                    <tr key={task.id} className="hover:bg-slate-900/60 transition group">
                      <td className="p-4 max-w-xs">
                        <h4 onClick={() => handleOpenEditModal(task)} className="font-semibold text-slate-100 hover:text-indigo-400 cursor-pointer transition truncate">
                          {task.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{task.description}</p>
                      </td>
                      <td className="p-4">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus,task)}
                          className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 outline-none focus:border-indigo-500"
                        >
                          <option value="TODO">TODO</option>
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="DONE">DONE</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 text-[10px] font-mono rounded border ${getPriorityBadge(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {task.assignedEmails?.length > 0 ? (
                            task.assignedEmails.map((email, idx) => (
                              <span key={idx} title={email} className="my-0.5 inline-flex items-center gap-1 rounded-md border border-slate-500/20 bg-slate-500/10 px-1.5 py-0.5 text-[9px] font-mono text-slate-300">
                                <UserCheck className="h-2.5 w-2.5 text-blue-400 shrink-0" />
                                <span className="truncate max-w-[80px]">{email}</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-600 font-mono text-[10px]">Unassigned</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-slate-400 text-[11px]">
                        {task.dueDate || 'N/A'}
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleOpenEditModal(task)} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition" title="Edit Task">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button onClick={()=>setDeleteTaskId(task.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition" title="Delete Task">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Integrated Modular Task Modal */}
      {isModalOpen && CURRENT_USER_EMAIL && (
        <TaskModal
          key={selectedTask ? selectedTask.id : 'new-task'}
          onClose={handleCloseTaskModal}
          onSubmit={handleSaveTask}
          currentUserEmail={CURRENT_USER_EMAIL}
          initialTask={selectedTask}
        />
      )}

      {deleteTaskId !== null && (
        <DeleteModal
          isOpen
          onClose={() => setDeleteTaskId(null)}
          onConfirm={() => handleDelete(deleteTaskId)}
          title="Delete Task"
          itemName={tasks.find(t => t.id === deleteTaskId)?.title}
        />
      )}

    </div>
  )
}
