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
  const { unseenCount, refreshUser, isWarmingUp, ping_render } = useUsers()
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

  useEffect(() => {
    ping_render()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    refreshUser()
    navigate('/login')
  }

  const linkStyle = ({ isActive }: { isActive: boolean }) =>
    `group relative flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
      collapsed ? 'justify-center' : ''
    } ${
      isActive
        ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm'
        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent'
    }`

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen border-r border-slate-800/80 bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-3 transition-all duration-300 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Section */}
      <div className="space-y-7">
        {/* Header / Brand */}
        {!collapsed ? (
          <div className="flex items-center justify-between px-1 h-9">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 shrink-0 rounded-md bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center font-mono font-bold text-white shadow-md shadow-indigo-500/20 text-xs">
                D
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-mono font-bold text-xs tracking-wider text-slate-100 truncate">
                  Devboard
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-mono font-semibold rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 leading-none">
                  v1.0
                </span>
              </div>
            </div>
            <button
              onClick={onToggle}
              title="Collapse sidebar"
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all shrink-0"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2">
            <button
              onClick={onToggle}
              title="Expand sidebar"
              className="p-2 rounded-md text-slate-400 hover:text-indigo-400 hover:bg-slate-900 border border-slate-800/80 transition-all w-full flex items-center justify-center"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Gateway Status Badge */}
        <div className="px-0.5 ">
          <div
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-slate-900/50 border ${isWarmingUp?"border-amber-600/50 ":"border-emerald-600/50"} ${
              collapsed ? 'justify-center' : ''
            }`}
            title={isWarmingUp ? 'Connecting to backend...' : 'Gateway Active'}
          >
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                isWarmingUp ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'
              }`}
            />
            {!collapsed && (
              <span className="text-[11px] font-mono text-slate-400 truncate">
                {isWarmingUp ? 'Connecting...' : 'Gateway Active'}
              </span>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {!collapsed && (
            <div className="px-2.5 pb-1.5 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-semibold">
              Workspace
            </div>
          )}

          {/* Task Board */}
          <NavLink to="/dashboard" className={linkStyle} title="Dashboard">
            <LayoutDashboard className="h-4 w-4 shrink-0 text-indigo-400" />
            {!collapsed && <span className="truncate">Task Board</span>}
          </NavLink>

          {/* Tasks Assigned */}
          <NavLink to="/assigned" className={linkStyle} title="Tasks Assigned">
            <UserCheck className="h-4 w-4 shrink-0 text-indigo-400" />
            {!collapsed && <span className="truncate">Tasks Assigned</span>}

            {/* Notification Badge */}
            {unseenCount > 0 && (
              <span
                className={`flex items-center justify-center rounded-full bg-indigo-500 text-white font-mono font-bold ${
                  collapsed
                    ? 'absolute top-1 right-1 h-2 w-2 p-0 bg-indigo-400 animate-pulse'
                    : 'ml-auto px-1.5 py-0.5 text-[9px] min-w-[18px] h-4 border border-indigo-400/30'
                }`}
              >
                {!collapsed && (unseenCount > 99 ? '99+' : unseenCount)}
              </span>
            )}
          </NavLink>

          {/* Plan Board */}
          <NavLink to="/plans" className={linkStyle} title="Plan Board">
            <CheckSquare className="h-4 w-4 shrink-0 text-slate-400" />
            {!collapsed && <span className="truncate">Plan Board</span>}
          </NavLink>
        </nav>
      </div>

      {/* Bottom Section: User Profile & Logout */}
      <div className="pt-3 border-t border-slate-600 space-y-3">
        {/* User Info Card */}
        <div
          className={`flex mb-4 items-center gap-2.5 p-2 rounded-md  ${
            collapsed ? 'justify-center bg-transparent border-none p-0' : ''
          }`}
          title={collapsed ? user?.name || 'Logged-in User' : undefined}
        >
          <div className="h-8 w-8 shrink-0 rounded-full bg-violet-500 border border-indigo-500/30 flex items-center justify-center  text-lg font-semibold text-indigo-300 shadow-sm">
            {user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'ME'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate leading-tight">
                {user?.name || 'Logged-in User'}
              </p>
              <p className="text-[10px] font-mono text-slate-400 truncate leading-tight mt-0.5">
                {user?.email || 'user@devboard.local'}
              </p>
            </div>
          )}
        </div>

        {/* Dedicated Logout Action */}
        <button
          onClick={handleLogout}
          title="Log Out"
          className={`w-full flex items-center justify-center  gap-2.5 px-3 py-2 rounded-md text-xs font-mono border border-neutral-500/20 bg-neutral-500/5 text-rose-400 hover:bg-rose-500/15 hover:border-rose-500/40 transition-all ${
            collapsed ? 'justify-center px-0' : ''
          }`}
        >
          <LogOut className="h-3 w-3 shrink-0" />
          {!collapsed && <span className="font-semibold">Log Out</span>}
        </button>
      </div>
    </aside>
  )
}