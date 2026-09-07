import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  Target,
  Layers,
  Clock,
  AlertCircle,
  ChevronRight,
  BarChart3,
  TrendingUp,
} from 'lucide-react';

// ==========================================
// 1. TYPES & INTERFACES (Matches Spring Boot)
// ==========================================

export interface PlanSummary {
  id: number;
  title: string;
  totalSteps: number;
  completedSteps: number;
  progressPercentage: number;
  updatedAt?: string;
}

export interface PlanInsightsResponse {
  totalPlans: number;
  completedPlans: number; // <--- NEW
  pendingPlans: number;   // <--- NEW
  totalSteps: number;
  completedSteps: number;
  pendingSteps: number;
  overallProgressPercentage: number;
  plans: PlanSummary[];
}

interface PlanInsightsViewProps {
  ownerEmail: string;
}

interface ChartItem {
  label: string;
  value: number;
  displayValue?: string;
  bgGradient: string;
}

// ==========================================
// 2. MOCK DATA (Offline Fallback)
// ==========================================



// ==========================================
// 3. REUSABLE VERTICAL BAR CHART COMPONENT
// ==========================================
interface ChartItem {
  label: string;
  value: number;
  displayValue?: string;
  bgGradient: string;
}


interface ScrollableBarChartProps {
  title: string;
  icon: React.ReactNode;
  data: ChartItem[];
  maxScaleValue?: number;
  itemWidth?: number;
}

export const ScrollableBarChart: React.FC<ScrollableBarChartProps> = ({
  title,
  icon,
  data,
  maxScaleValue,
  itemWidth = 52,

}) => {
  const maxValue = maxScaleValue || Math.max(...data.map((d) => d.value), 1);
  const isScrollable = data.length > 6;

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3.5">
      {/* Header with Item Counter */}
      <div className="flex items-center justify-between px-0.5">
        <span className="text-xs font-bold text-slate-800 flex items-center gap-2 tracking-wide">
          <div className="p-1.5 rounded-lg bg-slate-100 text-indigo-600">
            {icon}
          </div>
          {title}
        </span>
        <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/60">
          {data.length} {data.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Horizontally Scrollable Dark Canvas Container */}
      <div className="relative overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900 pb-1">
        <div
          className="relative h-44 pt-8 pb-3 px-4 bg-slate-950/90 rounded-xl border border-slate-800/90 flex items-end justify-around gap-2 shadow-inner overflow-hidden"
          style={{
            minWidth: isScrollable ? `${data.length * itemWidth}px` : '100%',
          }}
        >
          {/* Glowing Ambient Background Accent */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-indigo-500/10 blur-2xl pointer-events-none rounded-full" />

          {/* Precision Grid Lines */}
          <div className="absolute inset-x-3 top-6 bottom-9 flex flex-col justify-between pointer-events-none opacity-40">
            <div className="border-b border-dashed border-slate-100/60 w-full" />
            <div className="border-b border-dashed border-slate-100/60 w-full" />
            <div className="border-b border-dashed border-slate-100/60 w-full" />
            <div className="border-b border-dashed border-slate-100/60 w-full" />

          </div>

          {/* Vertical Thin Line Bars */}
          {data.map((item, idx) => {
            const heightPercent = Math.min(
              Math.max(Math.round((item.value / maxValue) * 100), 6),
              100
            );

            return (
              <div
                key={`${item.label}-${idx}`}
                className="relative flex flex-col items-center h-full justify-end group z-10 flex-1 min-w-[36px] max-w-[56px] px-0.5 cursor-pointer"
              >
                {/* Floating Value Badge */}
                <span className="text-[10px] font-mono font-bold text-slate-100 bg-neutral-600/90 border border-slate-700/80 shadow-md px-1.5 py-0.5 rounded-md mb-2 opacity-80 group-hover:opacity-100 group-hover:border-indigo-500/80 group-hover:-translate-y-1 transition-all">
                  {item.displayValue !== undefined ? item.displayValue : item.value}
                </span>

                {/* Ultra-Thin Bar Track & Dynamic Line Needle */}
                <div className="w-2 bg-slate-300/90 rounded-full overflow-hidden flex items-end h-full p-[1px]  shadow-inner  transition-colors">
                  <div
                    className={`w-full ${item.bgGradient} transition-all duration-500 rounded-full group-hover:scale-x-125 group-hover:brightness-125 group-hover:shadow-[0_0_10px_rgba(99,102,241,0.6)]`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>

                {/* X-Axis Label */}
                <span
                  title={item.label}
                  className="text-[10px] leading-tight font-mono font-medium text-slate-400 mt-2 text-center truncate w-full group-hover:text-indigo-300 transition-colors"
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

};
// ==========================================
// 4. MAIN COMPONENT IMPLEMENTATION
// ==========================================

export const PlanInsightsView: React.FC<PlanInsightsViewProps> = ({
  ownerEmail
}) => {
  const CACHE_KEY = `plan_insights_cache_${ownerEmail}`;

  const [insights, setInsights] = useState<PlanInsightsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const taskUrl = import.meta.env.VITE_TASK_URL


  const fetchInsights = useCallback(
    async (_forceRefresh = false) => {
      setIsLoading(true);
      setErrorNotice(null);

      try {
        const res = await fetch(
          `${taskUrl}/plans/insights?ownerEmail=${encodeURIComponent(ownerEmail)}`
        );
        if (!res.ok) throw new Error(`Server returned status ${res.status}`);

        const data: PlanInsightsResponse = await res.json();
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        setInsights(data);
      } catch {
        setErrorNotice('Using offline data');

      } finally {
        setIsLoading(false);
      }
    },
    [ownerEmail, CACHE_KEY]
  );

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed: PlanInsightsResponse = JSON.parse(cached);
        setInsights(parsed);
      } catch {
        fetchInsights();
      }
    } else {
      fetchInsights();
    }
  }, [CACHE_KEY, fetchInsights]);

  // 1. Prepare Steps Distribution Chart Data
  const stepChartData: ChartItem[] = [
    {
      label: 'Done',
      value: insights?.completedSteps || 0,
      bgGradient: 'bg-gradient-to-t from-emerald-600 to-emerald-400',
    },
    {
      label: 'Pending',
      value: insights?.pendingSteps || 0,
      bgGradient: 'bg-gradient-to-t from-amber-500 to-amber-300',
    },
    {
      label: 'Total',
      value: insights?.totalSteps || 0,
      bgGradient: 'bg-gradient-to-t from-indigo-600 to-indigo-400',
    },
  ];

  // 2. Prepare Plans Progress (%) Chart Data
  const planProgressChartData: ChartItem[] =
    insights?.plans?.map((p) => {
      let gradient = 'bg-gradient-to-t from-amber-500 via-amber-400 to-amber-300';
      if (p.progressPercentage >= 80) {
        gradient = 'bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-400';
      } else if (p.progressPercentage >= 40) {
        gradient = 'bg-gradient-to-t from-indigo-600 via-indigo-500 to-sky-400';
      }

      return {
        label: p.title,
        value: p.progressPercentage,
        displayValue: `${Math.round(p.progressPercentage)}%`,
        bgGradient: gradient,
      };
    }) || [];

  return (
    <div className="space-y-3.5 pt-1">
      {/* Header & Sync */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={15} className="text-indigo-600" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Roadmap & Plan Analytics
          </span>
        </div>
        <button
          onClick={() => fetchInsights(true)}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Offline Alert */}
      {errorNotice && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200/60 text-amber-800 text-[11px]">
          <AlertCircle size={14} className="shrink-0 text-amber-600" />
          <span className="truncate">{errorNotice}</span>
        </div>
      )}

      {/* Skeleton Loading State */}
      {isLoading && !insights && (
        <div className="space-y-3 animate-pulse">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-40 bg-slate-100 rounded-2xl" />
            <div className="h-40 bg-slate-100 rounded-2xl" />
          </div>
        </div>
      )}

      {/* Analytics Dashboard Content */}
      {insights && (
        <>
          {/* Top KPI Metrics: Total Plans | Completed Plans | Pending Plans */}
<div className="grid grid-cols-3 gap-2">
  {/* 1. Total Plans */}
  <div className="p-3 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-sm flex flex-col justify-between">
    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
      Total Plans
    </span>
    <div className="flex items-baseline justify-between mt-1">
      <span className="text-xl font-bold tracking-tight">{insights.totalPlans}</span>
      <Layers size={14} className="text-slate-400" />
    </div>
  </div>

  {/* 2. Completed Plans */}
  <div className="p-3 rounded-xl bg-emerald-100/80 border border-emerald-100 text-emerald-950 flex flex-col justify-between">
    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
      Completed Plans
    </span>
    <div className="flex items-baseline justify-between mt-1">
      <span className="text-xl font-bold tracking-tight text-emerald-700">
        {insights.completedPlans || 0}
      </span>
      <Layers size={14} className="text-emerald-700" />
    </div>
  </div>

  {/* 3. Pending Plans */}
  <div className="p-3 rounded-xl bg-violet-100/80 border border-amber-100 text-amber-950 flex flex-col justify-between">
    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
      Pending Plans
    </span>
    <div className="flex items-baseline justify-between mt-1">
      <span className="text-xl font-bold tracking-tight text-indigo-700">
        {insights.pendingPlans || 0}
      </span>
      <Layers size={14} className="text-indogo-600" />
    </div>
  </div>
</div>

          {/* BAR CHARTS SECTION */}
          <div className="flex flex-col gap-4">
            {/* Chart 1: Plan Completion Rates (%) - Horizontally Scrollable */}
            <ScrollableBarChart
              title="Plan Completion (%)"
              icon={<TrendingUp size={15} />}
              data={planProgressChartData}
              maxScaleValue={100}
              itemWidth={56} // Allocates 56px per plan for smooth horizontal scrolling
            />

            {/* Chart 2: Steps Breakdown */}
            <ScrollableBarChart
              title="Overall Steps Breakdown"
              icon={<BarChart3 size={15} />}
              data={stepChartData}
            />
          </div>

          {/* Detailed Plans List */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Active Plans ({insights.plans?.length || 0})
              </span>
            </div>

            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
              {insights.plans && insights.plans.length > 0 ? (
                insights.plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 hover:bg-white transition-all group cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-semibold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {plan.title}
                      </h4>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs font-mono font-bold text-indigo-600">
                          {plan.progressPercentage}%
                        </span>
                        <ChevronRight
                          size={14}
                          className="text-slate-300 group-hover:text-indigo-500 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Progress Bar Track */}
                    <div className="h-1.5 w-full bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${plan.progressPercentage}%` }}
                      />
                    </div>

                    {/* Footer Info */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>
                        {plan.completedSteps} / {plan.totalSteps} Steps
                      </span>
                      {plan.updatedAt && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock size={10} />
                          {plan.updatedAt.split('T')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No plans found.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PlanInsightsView;