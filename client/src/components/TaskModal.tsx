import { useEffect, useState } from 'react';
import type { SubmitEvent } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, Sparkles, UserPlus, Calendar, Loader2, User } from 'lucide-react';
import type { Task, TaskDraft, TaskPriority, TaskStatus } from '../types/task';
import toast from 'react-hot-toast';
import { useUsers } from '../context/UserContext';
import { AddToCalendarButton } from './AddToCalendarButton';
import { useLocation } from 'react-router-dom';

interface TaskModalProps {
  onClose: () => void;
  /** Receives the task as persisted by the server, so it always has an id. */
  onSubmit: (task: Task) => void;
  currentUserEmail: string;
  initialTask?: Task | null;
}

export default function TaskModal({ onClose, onSubmit, currentUserEmail, initialTask }: TaskModalProps) {
  const taskUrl = import.meta.env.VITE_TASK_URL;
  const { emails, refreshEmails } = useUsers();
  const location = useLocation();
  const isAssignedRoute = location.pathname === '/assigned';

  const [formData, setFormData] = useState<TaskDraft>(initialTask || {
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    ownerEmail: currentUserEmail,
    assignedEmails: [],
    startDate: new Date().toISOString().split('T')[0],
    dueDate: ''
  });

  const [assigneeInput, setAssigneeInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filter suggestion list based on input string and exclude already added assignees
  const suggestions = assigneeInput.trim()
    ? (emails || []).filter(
      email =>
        email.toLowerCase().includes(assigneeInput.toLowerCase().trim()) &&
        !formData.assignedEmails.includes(email)
    )
    : [];

  const addAssignee = (emailToAdd?: string) => {
    const targetEmail = (emailToAdd || assigneeInput).trim();
    if (targetEmail && !formData.assignedEmails.includes(targetEmail)) {
      setFormData({ ...formData, assignedEmails: [...formData.assignedEmails, targetEmail] });
      setAssigneeInput('');
      setShowSuggestions(false);
    }
  };

  const removeAssignee = (email: string) => {
    setFormData({
      ...formData,
      assignedEmails: formData.assignedEmails.filter(e => e !== email)
    });
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSaving) return;

    const isEdit = initialTask != null;
    const data = {
      title: formData.title,
      description: formData.description,
      status: formData.status,
      priority: formData.priority,
      ownerEmail: currentUserEmail,
      assignedEmails: formData.assignedEmails,
      startDate: formData.startDate || null,
      dueDate: formData.dueDate || null
    };

    setIsSaving(true);
    try {
      const res = await fetch(
        isEdit ? `${taskUrl}/tasks/${initialTask.id}` : `${taskUrl}/tasks`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        }
      );
      const resBody = await res.json();

      if (!res.ok) {
        console.error(resBody.error || `Failed to ${isEdit ? 'update' : 'create'} task`);
        return;
      }

      toast.success(`Task ${isEdit ? 'updated' : 'created'} successfully`);
      onSubmit(resBody as Task);
      onClose();
    } catch (error) {
      console.error("Something went wrong");
      console.log("Error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    refreshEmails();
  }, []);

  // Rendered into <body> so the overlay escapes the layout's `relative z-10`
  // stacking context, which would otherwise trap it beneath the fixed sidebar.
  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center backdrop-blur-md p-4 transition-all">
      {/* Main Glass Card */}
      <div className="relative w-full max-w-lg rounded-3xl border border-white/30 bg-slate-900/60 p-6 sm:p-7 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] backdrop-blur-xl space-y-5 overflow-hidden">

        {/* Decorative Top Ambient Glow Line */}
        <div className="absolute -top-px left-12 right-12 h-px bg-gradient-to-r from-transparent via-indigo-500/80 to-transparent" />

        {/* Modal Header */}
        <div className='w-full flex flex-col border-b border-white/20  pb-4'>
          <div className="flex items-center justify-between  pb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <h2 className="text-base font-semibold text-slate-100 tracking-wide">
                {initialTask ? 'Edit Task Details' : 'Create New Task'}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="rounded-full p-1 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className='text-xs text-semibold text-slate-300'> Posted By : {currentUserEmail}</p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-medium text-slate-300">Task Title <span className="text-indigo-400">*</span></label>
            <input
              required
              type="text"
              placeholder="e.g., Design System Refactor"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full mt-1.5 rounded-lg border border-white/20 bg-slate-950/50 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-slate-300">Description</label>
            <textarea
              rows={3}
              placeholder="Add contextual details or notes..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full mt-1.5 rounded-lg border border-white/20 bg-slate-950/50 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300">Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                className="w-full mt-1.5 rounded-lg border border-white/20 bg-slate-950/50 px-3.5 py-2.5 text-xs text-slate-200 outline-none transition-all focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value="TODO" className="bg-slate-900 text-slate-200">TODO</option>
                <option value="IN_PROGRESS" className="bg-slate-900 text-slate-200">IN PROGRESS</option>
                <option value="DONE" className="bg-slate-900 text-slate-200">DONE</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300">Priority</label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                className="w-full mt-1.5 rounded-lg border border-white/20 bg-slate-950/50 px-3.5 py-2.5 text-xs text-slate-200 outline-none transition-all focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value="LOW" className="bg-slate-900 text-slate-200">LOW</option>
                <option value="MEDIUM" className="bg-slate-900 text-slate-200">MEDIUM</option>
                <option value="HIGH" className="bg-slate-900 text-slate-200">HIGH</option>
              </select>
            </div>
          </div>

          {/* Start & Due Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300">
                <Calendar className="h-3.5 w-3.5 text-slate-400" /> Start Date
              </label>
              <input
                type="date"
                value={formData.startDate || ''}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full mt-1.5 rounded-lg border border-white/20 bg-slate-950/50 px-3.5 py-2.5 text-xs text-white [color-scheme:dark] outline-none focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300">
                <Calendar className="h-3.5 w-3.5 text-slate-400" /> Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate || ''}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full mt-1.5 rounded-lg border border-white/20 bg-slate-950/50 px-3.5 py-2.5 text-xs text-white [color-scheme:dark] outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Assignees */}
          <div className="relative">
            <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300">
              <UserPlus className="h-3.5 w-3.5 text-slate-400" /> Assignees
            </label>
            <div className="flex gap-2 mt-1.5">
              <div className="relative flex-1">
                <input
                  type="email"
                  placeholder="assignee@example.com"
                  value={assigneeInput}
                  onChange={e => {
                    setAssigneeInput(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAssignee();
                    }
                  }}
                  className="w-full rounded-lg border border-white/20 bg-slate-950/50 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20"
                />

                {/* Search Autocomplete Suggestions List */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-40 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900/95 py-1 shadow-2xl backdrop-blur-xl">
                    {suggestions.map((email) => (
                      <button
                        key={email}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          addAssignee(email);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-indigo-600/30 hover:text-white transition flex items-center gap-2"
                      >
                        <User className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

             {!isAssignedRoute && <button
                type="button"
                onClick={() => addAssignee()}
                className="px-3.5 py-2.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition-all flex items-center justify-center shrink-0"
              >
                <Plus className="h-4 w-4" />
              </button>}
            </div>

            {/* Assignee Badges */}
            {formData.assignedEmails.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5 max-h-20 overflow-y-auto">
                {formData.assignedEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-medium text-indigo-200 shadow-sm transition-all hover:bg-indigo-500/20"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => removeAssignee(email)}
                      className="text-indigo-400 hover:text-rose-400 transition-colors"
                    >
                     {!isAssignedRoute && <Trash2 className="h-3 w-3" />}
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>


          <AddToCalendarButton title={formData?.title} dueDate={formData?.dueDate}
            description={formData?.description} priority={formData?.priority} />

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 text-white font-medium text-xs tracking-wide shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Task...
                </>
              ) : (
                initialTask ? 'Save Changes' : 'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}