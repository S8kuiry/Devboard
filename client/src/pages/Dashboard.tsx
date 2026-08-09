import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { 
  CheckCircle2, Plus, UserCheck, Layers, Search, 
  Filter, Clock, CircleDot, MoreVertical 
} from 'lucide-react'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('tasks')

  return (
    <div className="relative min-h-screen w-full bg-slate-950 font-sans text-slate-100 flex overflow-hidden">
      
      {/* Background Tech Grid & Ambient Glows */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none z-0"
        style={{
          backgroundImage: `radial-gradient(#4f46e5 1px, transparent 1px), linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      />
      <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-gray-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Sidebar Component */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-8 lg:p-10 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-mono text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  EUREKA CLUSTER ACTIVE
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
                Tasks
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Manage, assign, and verify execution status across your microservice pipeline
              </p>
            </div>

            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition active:scale-[0.98]">
              <Plus className="h-4 w-4" /> Create Task Instance
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 backdrop-blur-md flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Total Tasks</p>
                <p className="text-2xl font-bold font-mono text-slate-100 mt-1">12</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Layers className="h-4 w-4" />
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 backdrop-blur-md flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">In Progress</p>
                <p className="text-2xl font-bold font-mono text-amber-400 mt-1">5</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 backdrop-blur-md flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Completed</p>
                <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">7</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search tasks..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
            <button className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-3.5 py-2 text-xs font-mono text-slate-400 hover:text-slate-200 transition">
              <Filter className="h-3.5 w-3.5" /> Filter Status
            </button>
          </div>

          {/* Task Cards Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            
            <div className="group rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 space-y-4 backdrop-blur-xl transition hover:border-slate-700 hover:shadow-xl hover:shadow-indigo-500/5">
              <div className="flex justify-between items-center">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-amber-400 border border-amber-500/20">
                  <CircleDot className="h-2.5 w-2.5 animate-pulse" />
                  IN_PROGRESS
                </span>
                <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  HIGH
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-slate-100 group-hover:text-indigo-300 transition">
                  Implement OpenFeign Interceptor
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Connect Task Service to Auth Service via OpenFeign client to validate JWT context before persisting tasks.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                  <UserCheck className="h-3.5 w-3.5 text-indigo-400" />
                  dev@devboard.com
                </span>
                <div className="flex items-center gap-2">
                  <button className="p-1 rounded text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition" title="Mark Complete">
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                  <button className="p-1 rounded text-slate-500 hover:text-slate-300 transition">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="group rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 space-y-4 backdrop-blur-xl transition hover:border-slate-700 hover:shadow-xl hover:shadow-indigo-500/5">
              <div className="flex justify-between items-center">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-emerald-400 border border-emerald-500/20">
                  COMPLETED
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  NORMAL
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-slate-100 group-hover:text-indigo-300 transition">
                  Configure Eureka Gateway
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Route dynamic incoming requests through Spring Cloud Gateway using registry routing rules.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                  <UserCheck className="h-3.5 w-3.5 text-indigo-400" />
                  lead@devboard.com
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> VERIFIED
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>

    </div>
  )
}