import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CheckSquare,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  UserCheck
} from 'lucide-react'
import { useUsers } from '../context/UserContext'

interface User {
  name: string
  email: string
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { unseenCount, refreshUser } = useUsers();
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const res = localStorage.getItem('user')
    if (res) {
      try {
        setUser(JSON.parse(res))
      } catch (e) {
        console.error("Failed to parse user session", e)
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    refreshUser()
    navigate('/login')
  }

  const linkStyle = ({ isActive }: { isActive: boolean }) =>
    `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${collapsed ? 'justify-center' : ''
    } ${isActive
      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
    }`

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen border-r border-slate-800/80 bg-slate-950/70 backdrop-blur-xl flex flex-col justify-between p-4 transition-[width] duration-200 ${collapsed ? 'w-20' : 'w-70'
        }`}
    >
      <div className="space-y-6">
        {/* Brand Header */}
        <div className={`flex items-center gap-3 px-2 py-1 ${collapsed ? 'justify-center' : ''}`}>
          <div className="h-8 w-8 shrink-0 rounded-md bg-indigo-600 flex items-center justify-center font-mono font-bold text-white shadow-md shadow-indigo-500/20 text-sm">
            D
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <span className="font-mono font-bold text-base tracking-wider text-white block leading-none whitespace-nowrap">
                {'{'} Devboard {'}'}
              </span>
              <span className="text-[10px] font-mono text-slate-500 tracking-tight">SYSTEM v1.0</span>
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 transition ${collapsed ? 'justify-center' : ''
            }`}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4 shrink-0" />
          ) : (
            <PanelLeftClose className="h-4 w-4 shrink-0" />
          )}
          {!collapsed && <span>Collapse</span>}
        </button>

        {/* Core Navigation */}
        <nav className="space-y-1">
          {!collapsed && (
            <div className="px-2 pb-2 text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Workspace
            </div>
          )}

          {/* Primary View: Dashboard */}
          <NavLink to="/dashboard" className={linkStyle} title="Dashboard">
            <LayoutDashboard className="h-4 w-4 shrink-0 text-indigo-400" />
            {!collapsed && <span>Task Board</span>}
          </NavLink>

          <NavLink to="/assigned" className={linkStyle} title="Task Assigned">
            <div className="flex items-center gap-3 min-w-0">
              <UserCheck className="h-4 w-4 shrink-0 text-indigo-400" />
              {!collapsed && <span className="truncate">Tasks Assigned</span>}
            </div>

            {/* Floating Badge */}
            {unseenCount > 0 && (
              <span
                className={`flex items-center justify-center rounded-full bg-indigo-500 text-white font-mono font-bold text-[10px] shadow-lg shadow-indigo-500/50 ${collapsed
                    ? 'absolute top-2 right-2 h-2.5 w-2.5 p-0 bg-indigo-400 animate-pulse'
                    : 'px-1.5 py-0.5 min-w-[18px] h-4 text-center'
                  }`}
              >
                {!collapsed && (unseenCount > 99 ? '99+' : unseenCount)}
              </span>
            )}
          </NavLink>

          {/* Secondary View: Task Management */}
          <NavLink to="/plans" className={linkStyle} title="Task Board">
            <CheckSquare className="h-4 w-4 shrink-0 text-slate-400" />
            {!collapsed && <span>Plan Board</span>}
          </NavLink>


        </nav>
      </div>

      {/* System Gateway Status & User Session */}
      <div className="pt-4 border-t border-slate-800/80 space-y-3">
        {/* Active Gateway Connection Badge */}
        {/* <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-900/40 border border-slate-800/50">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono text-slate-400">Gateway Active</span>
          </div>
          <Activity className="h-3.5 w-3.5 text-slate-500" />
        </div> */}

        {/* User Profile Footer */}
        <div
          className={`flex items-center gap-3 px-2 ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? user?.name || 'Logged-in User' : undefined}
        >
          <div className="h-8 w-8 shrink-0 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-xs font-bold text-indigo-400">
            {user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'ME'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{user?.name || 'Logged-in User'}</p>
              <p className="text-[10px] font-mono text-slate-500 truncate">{user?.email || 'user@devboard.local'}</p>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Log Out"
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-mono border border-slate-800 bg-slate-900/50 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  )
}
