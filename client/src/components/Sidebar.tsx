import { 
  CheckSquare, LayoutDashboard, Server, Layers, Terminal, LogOut 
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <aside className="relative z-10 w-64 border-r border-slate-800/80 bg-slate-950/70 backdrop-blur-xl flex flex-col justify-between p-4 flex-shrink-0">
      <div className="space-y-6">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="h-8 w-8 rounded-sm bg-indigo-600 flex items-center justify-center font-mono font-bold text-white shadow-md shadow-indigo-500/30 text-sm">
            D
          </div>
          <div>
            <span className="font-mono font-bold text-base tracking-wider text-white block leading-none">
              {'{'} Devboard {'}'}
            </span>
            <span className="text-[10px] font-mono text-slate-500 tracking-tight">CLUSTER v1.0.4</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          <div className="px-2 pb-2 text-[10px] font-mono uppercase tracking-widest text-slate-500">
            Workspace
          </div>
          
          <button
            onClick={() => setActiveTab('tasks')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeTab === 'tasks' 
                ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <CheckSquare className="h-4 w-4 text-indigo-400" />
            <span>All Tasks</span>
            <span className="ml-auto font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">12</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeTab === 'overview' 
                ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <LayoutDashboard className="h-4 w-4 text-slate-400" />
            <span>Architecture</span>
          </button>

          <div className="pt-4 px-2 pb-2 text-[10px] font-mono uppercase tracking-widest text-slate-500">
            Microservices
          </div>

          <a href="#auth" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 transition">
            <Server className="h-4 w-4 text-emerald-400" />
            <span>Auth Service</span>
            <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </a>

          <a href="#gateway" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 transition">
            <Layers className="h-4 w-4 text-purple-400" />
            <span>API Gateway</span>
            <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400" />
          </a>

          <a href="#task" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 transition">
            <Terminal className="h-4 w-4 text-amber-400" />
            <span>Task Service</span>
            <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400" />
          </a>
        </nav>
      </div>

      {/* User Session Profile & Disconnect */}
      <div className="pt-4 border-t border-slate-800/80 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-xs font-bold text-indigo-400">
            DEV
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">developer@devboard.com</p>
            <p className="text-[10px] font-mono text-slate-500">JWT Session Active</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-mono border border-slate-800 bg-slate-900/50 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>DISCONNECT</span>
        </button>
      </div>
    </aside>
  )
}