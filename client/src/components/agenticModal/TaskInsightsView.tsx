import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RefreshCw,
  Layers,
  Clock,
  CheckCircle2,
  BarChart3,
  ChevronRight,
  AlertCircle,
  PieChart,
  NotebookTabsIcon,
  AlertTriangle,
  UserCheck,
  UserPlus,
  Calendar,
} from 'lucide-react';

// ==========================================
// 1. TYPES & INTERFACES (Matches Spring Boot)
// ==========================================

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | string;
export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW' | string;
export type ViewScope = 'ALL' | 'ASSIGNED' | 'CREATED';

export interface TaskSummary {
  id: number;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  ownerEmail?: string;
  assignedEmails?: string[];
}

export interface TaskInsightsResponse {
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  overdueTasks: number;
  createdTasksCount: number;
  assignedTasksCount: number;
  completionRate: number;
  statusBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  tasks: TaskSummary[];
}

interface TaskInsightsViewProps {
  ownerEmail?: string;
}

interface ChartItem {
  label: string;
  value: number;
  colorClass: string;
  bgGradient: string;
}

// ==========================================
// 2. CONSTANTS & STYLE LOOKUPS
// ==========================================

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: 'bg-rose-50 text-rose-700 border-rose-200/60',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200/60',
  LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
};

const STATUS_STYLES: Record<string, string> = {
  DONE: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  IN_PROGRESS: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
  TODO: 'bg-slate-200 text-slate-600 border-slate-200/80',
};

// ==========================================
// 3. REUSABLE VERTICAL BAR CHART COMPONENT
// ==========================================

interface VerticalBarChartProps {
  title: string;
  icon: React.ReactNode;
  data: ChartItem[];
}

const VerticalBarChart: React.FC<VerticalBarChartProps> = ({ title, icon, data }) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
      {/* Chart Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
          {icon}
          {title}
        </span>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative h-44 pt-6 pb-2 px-2 bg-slate-950/90 rounded-xl border border-slate-800 flex items-end justify-around">
        {/* Background Grid Lines */}
        <div className="absolute inset-x-3 top-4 bottom-9 flex flex-col justify-between pointer-events-none opacity-20">
          <div className="border-b border-dashed border-slate-100/60 w-full" />
          <div className="border-b border-dashed border-slate-100/60 w-full" />
          <div className="border-b border-dashed border-slate-100/60 w-full" />
          <div className="border-b border-dashed border-slate-100/60 w-full" />
        </div>

        {/* Vertical Bars */}
        {data.map((item) => {
          const heightPercent = Math.round((item.value / maxValue) * 100);

          return (
            <div
              key={item.label}
              className="relative flex flex-col items-center h-full justify-end group z-10 flex-1 min-w-0 px-1"
            >
              {/* Value Label on Top of Bar */}
              <span className="text-[10px] font-mono font-bold text-slate-100 bg-neutral-500/90 border border-slate-700/80 shadow-md px-1.5 py-0.5 rounded-md mb-2 opacity-80 group-hover:opacity-100 group-hover:border-indigo-500/80 group-hover:-translate-y-1 transition-all">
                {item.value}
              </span>

              {/* The Vertical Bar */}
                <div className="w-2 bg-slate-300/90 rounded-full overflow-hidden flex items-end h-full p-[1px]  shadow-inner  transition-colors">
                <div
                  className={`w-full ${item.bgGradient} transition-all duration-500 rounded-t-lg group-hover:brightness-125 shadow-sm`}
                  style={{ height: `${heightPercent}%` }}
                />
              </div>

              {/* X-Axis Label */}
              <span className="text-[9px] leading-tight font-semibold text-slate-400 mt-2 text-center truncate w-full">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// 4. MAIN COMPONENT IMPLEMENTATION
// ==========================================

export const TaskInsightsView: React.FC<TaskInsightsViewProps> = ({
  ownerEmail = 'user@devboard.com',
}) => {
  const CACHE_KEY = `task_insights_cache_${ownerEmail}`;
  const taskUrl = import.meta.env.VITE_TASK_URL;

  const [insights, setInsights] = useState<TaskInsightsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // 1. ADD FILTER SCOPE STATE (Defaults to personal work)
  const [viewScope, setViewScope] = useState<ViewScope>('ASSIGNED');

  const fetchInsights = useCallback(
    async (_forceRefresh = false) => {
      setIsLoading(true);
      setErrorNotice(null);

      try {
        const res = await fetch(
          `${taskUrl}/tasks/insights?ownerEmail=${encodeURIComponent(ownerEmail)}`
        );
        if (!res.ok) throw new Error(`Server returned status ${res.status}`);

        const data: TaskInsightsResponse = await res.json();
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        setInsights(data);
      } catch {
        setErrorNotice('Using offline cached data');
      } finally {
        setIsLoading(false);
      }
    },
    [ownerEmail, taskUrl, CACHE_KEY]
  );

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed: TaskInsightsResponse = JSON.parse(cached);
        setInsights(parsed);
      } catch {
        fetchInsights();
      }
    } else {
      fetchInsights();
    }
  }, [CACHE_KEY, fetchInsights]);

  // Helper to check if task is overdue
  const isOverdue = useCallback((dueDateStr?: string, status?: string) => {
    if (!dueDateStr || status === 'DONE') return false;
    const due = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  }, []);

  // 2. DYNAMIC FILTRATION & RE-CALCULATION LOGIC
  const filteredData = useMemo(() => {
    if (!insights?.tasks) {
      return {
        tasks: [],
        total: 0,
        active: 0,
        completed: 0,
        overdue: 0,
        completionRate: 0,
        statusBreakdown: { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
        priorityBreakdown: { HIGH: 0, MEDIUM: 0, LOW: 0 },
      };
    }

    const normUser = ownerEmail.toLowerCase();

    // Filter tasks based on viewScope tab
    const filteredTasks = insights.tasks.filter((t) => {
      const isOwner = t.ownerEmail?.toLowerCase() === normUser;
      const isAssignee = t.assignedEmails?.some((e) => e.toLowerCase() === normUser);

      if (viewScope === 'ASSIGNED') return isAssignee;
      if (viewScope === 'CREATED') return isOwner;
      return true; // ALL
    });

    // Compute metrics dynamically for the filtered set
    const total = filteredTasks.length;
    const completed = filteredTasks.filter((t) => t.status === 'DONE').length;
    const active = filteredTasks.filter((t) => t.status !== 'DONE').length;
    const overdue = filteredTasks.filter((t) => isOverdue(t.dueDate, t.status)).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const statusBreakdown: Record<string, number> = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    const priorityBreakdown: Record<string, number> = { HIGH: 0, MEDIUM: 0, LOW: 0 };

    filteredTasks.forEach((t) => {
      if (t.status in statusBreakdown) statusBreakdown[t.status]++;
      else statusBreakdown[t.status] = 1;

      if (t.priority in priorityBreakdown) priorityBreakdown[t.priority]++;
      else priorityBreakdown[t.priority] = 1;
    });

    return {
      tasks: filteredTasks,
      total,
      active,
      completed,
      overdue,
      completionRate: rate,
      statusBreakdown,
      priorityBreakdown,
    };
  }, [insights, viewScope, ownerEmail, isOverdue]);

  // Prepare Bar Chart Datasets dynamically from filtered breakdown
  const statusChartData: ChartItem[] = [
    {
      label: 'To Do',
      value: filteredData.statusBreakdown.TODO || 0,
      colorClass: 'text-slate-500',
      bgGradient: 'bg-gradient-to-t from-slate-600 to-slate-400',
    },
    {
      label: 'In Progress',
      value: filteredData.statusBreakdown.IN_PROGRESS || 0,
      colorClass: 'text-indigo-500',
      bgGradient: 'bg-gradient-to-t from-indigo-600 to-indigo-400',
    },
    {
      label: 'Completed',
      value: filteredData.statusBreakdown.DONE || 0,
      colorClass: 'text-emerald-500',
      bgGradient: 'bg-gradient-to-t from-emerald-600 to-emerald-400',
    },
  ];

  const priorityChartData: ChartItem[] = [
    {
      label: 'High',
      value: filteredData.priorityBreakdown.HIGH || 0,
      colorClass: 'text-rose-500',
      bgGradient: 'bg-gradient-to-t from-rose-600 to-rose-400',
    },
    {
      label: 'Medium',
      value: filteredData.priorityBreakdown.MEDIUM || 0,
      colorClass: 'text-amber-500',
      bgGradient: 'bg-gradient-to-t from-amber-500 to-amber-300',
    },
    {
      label: 'Low',
      value: filteredData.priorityBreakdown.LOW || 0,
      colorClass: 'text-emerald-500',
      bgGradient: 'bg-gradient-to-t from-emerald-500 to-emerald-300',
    },
  ];

  return (
    <div className="space-y-4 pt-1">
      {/* Header & Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <NotebookTabsIcon size={16} className="text-indigo-600" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Task Intelligence & Analytics
          </span>
        </div>
        <button
          onClick={() => fetchInsights(true)}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Offline Alert */}
      {errorNotice && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-800 text-xs">
          <AlertCircle size={15} className="shrink-0 text-amber-600" />
          <span className="truncate">{errorNotice}</span>
        </div>
      )}

      {/* Skeleton Loading State */}
      {isLoading && !insights && (
        <div className="space-y-3 animate-pulse">
          <div className="h-9 bg-slate-100 rounded-xl w-72" />
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-48 bg-slate-100 rounded-2xl" />
            <div className="h-48 bg-slate-100 rounded-2xl" />
          </div>
        </div>
      )}

      {/* Analytics Dashboard Content */}
      {insights && (
        <>
          {/* 3. SCOPE SELECTOR TABS */}
          <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 w-fit">
            <button
              onClick={() => setViewScope('ASSIGNED')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewScope === 'ASSIGNED'
                  ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Assigned to Me ({insights.assignedTasksCount || 0})
            </button>

            <button
              onClick={() => setViewScope('CREATED')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewScope === 'CREATED'
                  ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Created by Me ({insights.createdTasksCount || 0})
            </button>

            <button
              onClick={() => setViewScope('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewScope === 'ALL'
                  ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Scope ({insights.totalTasks || 0})
            </button>
          </div>

          {/* Top KPI Metrics (Dynamic based on selected viewScope) */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* 1. Total Filtered Scope */}
            <div className="text-[10px] p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-800 text-white shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Current View Total
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-bold tracking-tight">{filteredData.total}</span>
                <Layers size={15} className="text-slate-400" />
              </div>
            </div>

            {/* 2. Created By Me (Global Constant) */}
            <div className="text-[10px] p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-900 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Created Total
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-bold tracking-tight text-slate-800">
                  {insights.createdTasksCount || 0}
                </span>
                <UserPlus size={15} className="text-slate-400" />
              </div>
            </div>

            {/* 3. Assigned to Me (Global Constant) */}
            <div className="text-[10px] p-3.5 rounded-2xl bg-sky-50/80 border border-sky-100 text-sky-950 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">
                Assigned Total
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-bold tracking-tight text-sky-700">
                  {insights.assignedTasksCount || 0}
                </span>
                <UserCheck size={15} className="text-sky-500" />
              </div>
            </div>

            {/* 4. Active Tasks (Dynamic) */}
            <div className="text-[10px] p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-indigo-950 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                Active Tasks
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-bold tracking-tight text-indigo-700">
                  {filteredData.active}
                </span>
                <Clock size={15} className="text-indigo-500" />
              </div>
            </div>

            {/* 5. Completed Tasks & Rate (Dynamic) */}
            <div className="text-[10px] p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-100 text-emerald-950 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                  Done
                </span>
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-200/60 px-1.5 py-0.5 rounded-md">
                  {filteredData.completionRate}%
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-bold tracking-tight text-emerald-700">
                  {filteredData.completed}
                </span>
                <CheckCircle2 size={15} className="text-emerald-500" />
              </div>
            </div>

            {/* 6. Overdue Tasks Warning (Dynamic) */}
            <div className="text-[10px] p-3.5 rounded-2xl bg-rose-50/80 border border-rose-100 text-rose-950 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                Overdue Risk
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-lg font-bold tracking-tight text-rose-700">
                  {filteredData.overdue}
                </span>
                <AlertTriangle size={15} className="text-rose-500" />
              </div>
            </div>
          </div>

          {/* BAR CHARTS SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-3 pt-1">
            <VerticalBarChart
              title="Status Breakdown"
              icon={<PieChart size={14} className="text-indigo-600" />}
              data={statusChartData}
            />

            <VerticalBarChart
              title="Priority Breakdown"
              icon={<BarChart3 size={14} className="text-indigo-600" />}
              data={priorityChartData}
            />
          </div>

          {/* RECENT TASKS LIST */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Tasks ({filteredData.tasks.length})
              </span>
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {filteredData.tasks.length > 0 ? (
                filteredData.tasks.map((task) => {
                  const priorityStyle =
                    PRIORITY_STYLES[task.priority] || 'bg-slate-50 text-slate-600 border-slate-200';
                  const statusStyle =
                    STATUS_STYLES[task.status] || 'bg-slate-100 text-slate-600 border-slate-200';
                  const overdue = isOverdue(task.dueDate, task.status);
                  const isOwner = task.ownerEmail?.toLowerCase() === ownerEmail.toLowerCase();

                  return (
                    <div
                      key={task.id}
                      className={`p-3 rounded-2xl border transition-all group cursor-pointer ${
                        overdue
                          ? 'bg-rose-50/30 border-rose-200 hover:border-rose-300'
                          : 'bg-white border-slate-200/80 hover:border-indigo-200 hover:bg-slate-50/50 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <h4 className="text-xs font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                            {task.title}
                          </h4>
                          {/* Role Badge */}
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${
                              isOwner
                                ? 'bg-slate-100 text-slate-600 border-slate-200'
                                : 'bg-sky-50 text-sky-700 border-sky-200'
                            }`}
                          >
                            {isOwner ? 'Owner' : 'Assigned'}
                          </span>
                        </div>
                        <ChevronRight
                          size={14}
                          className="text-slate-300 group-hover:text-indigo-500 shrink-0 transition-colors"
                        />
                      </div>

                      <div className="flex items-center gap-2 mt-2.5">
                        <span
                          className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border ${statusStyle}`}
                        >
                          {task.status}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border ${priorityStyle}`}
                        >
                          {task.priority}
                        </span>

                        {task.dueDate && (
                          <span
                            className={`text-[10px] font-mono flex items-center gap-1 ml-auto font-medium ${
                              overdue ? 'text-rose-600 font-bold' : 'text-slate-400'
                            }`}
                          >
                            <Calendar size={11} />
                            {task.dueDate}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No tasks match the selected filter.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TaskInsightsView;