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
    `group relative flex items-center gap-3 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
      collapsed ? 'justify-center px-0 py-2.5 mx-2' : ''
    } ${
      isActive
        ? 'bg-indigo-600/50 text-indigo-300'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
    }`

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen border-r border-slate-800/50 bg-slate-700/20 flex flex-col justify-between py-5 px-3 transition-all duration-300 select-none ${
        collapsed ? 'w-[80px]' : 'w-[280px]'
      }`}
    >
      {/* Top Section */}
      <div className="space-y-6">
        {/* Header / Brand */}
        {!collapsed ? (
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-6 w-6 shrink-0 rounded bg-indigo-600 flex items-center justify-center font-bold text-white text-[11px] shadow-sm">
                D
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-[14px] tracking-wide text-slate-100 truncate">
                  Devboard
                </span>
                <span className="px-1.5 py-[2px] text-[9px] font-semibold rounded bg-indigo-500/20 text-indigo-400 leading-none tracking-wide">
                  v1.0
                </span>
              </div>
            </div>
            <button
              onClick={onToggle}
              title="Collapse sidebar"
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-colors shrink-0"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <button
              onClick={onToggle}
              title="Expand sidebar"
              className="p-2 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-colors flex items-center justify-center"
            >
              <PanelLeftOpen className="h-[18px] w-[18px]" />
            </button>
          </div>
        )}

        {/* Gateway Status (Styled like the reference image) */}
        <div className="px-2">
          <div
            className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-full border bg-[#0D121F] ${
              isWarmingUp ? 'border-amber-500/20' : 'border-emerald-500/20'
            } ${collapsed ? 'justify-center w-full px-0' : ''}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                isWarmingUp ? 'bg-amber-400 animate-pulse shadow-[0_0_5px_rgba(251,191,36,0.5)]' : 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)]'
              }`}
            />
            {!collapsed && (
              <span className="text-[10px] font-medium text-slate-400 tracking-wide truncate">
                {isWarmingUp ? 'Connecting...' : 'Gateway Active'}
              </span>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {!collapsed && (
            <div className="px-3 pb-2 text-[9px] uppercase tracking-[0.15em] text-slate-500 font-semibold mt-6">
              Workspace
            </div>
          )}

          {/* Task Board */}
          <NavLink to="/dashboard" className={linkStyle} title="Task Board">
            <LayoutDashboard className="h-[15px] w-[15px] shrink-0" />
            {!collapsed && <span className="truncate">Task Board</span>}
          </NavLink>

          {/* Tasks Assigned */}
          <NavLink to="/assigned" className={linkStyle} title="Tasks Assigned">
            <UserCheck className="h-[15px] w-[15px] shrink-0" />
            {!collapsed && <span className="truncate">Tasks Assigned</span>}

            {/* Notification Badge */}
            {unseenCount > 0 && (
              <span
                className={`flex items-center justify-center rounded-full bg-indigo-600 text-white font-medium ${
                  collapsed
                    ? 'absolute top-1 right-1 h-2 w-2 p-0 animate-pulse'
                    : 'ml-auto px-1.5 py-0.5 text-[9px] min-w-[18px] h-[18px]'
                }`}
              >
                {!collapsed && (unseenCount > 99 ? '99+' : unseenCount)}
              </span>
            )}
          </NavLink>

          {/* Plan Board */}
          <NavLink to="/plans" className={linkStyle} title="Plan Board">
            <CheckSquare className="h-[15px] w-[15px] shrink-0" />
            {!collapsed && <span className="truncate">Plan Board</span>}
          </NavLink>
        </nav>
      </div>

      {/* Bottom Section: User Profile & Logout */}
      <div className="space-y-1">
        {/* User Info Card */}
        <div
          className={`flex items-center gap-3 px-2 py-3 ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? user?.name || 'Logged-in User' : undefined}
        >
          <div className="h-7 w-7 shrink-0 rounded-full bg-indigo-900 border border-indigo-700/50 flex items-center justify-center text-[11px] font-bold text-indigo-300">
            {user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'ME'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-slate-200 truncate leading-tight">
                {user?.name || 'Logged-in User'}
              </p>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                {user?.email || 'user@devboard.local'}
              </p>
            </div>
          )}
        </div>

        {/* Dedicated Logout Action */}
        <button
          onClick={handleLogout}
          title="Log Out"
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] font-medium text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ${
            collapsed ? 'justify-center px-0' : ''
          }`}
        >
          <LogOut className="h-[14px] w-[14px] shrink-0" />
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  )
}