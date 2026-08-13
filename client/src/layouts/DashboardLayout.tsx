import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebarCollapsed') === 'true'
  )

  const toggleSidebar = () => {
    setCollapsed(prev => {
      localStorage.setItem('sidebarCollapsed', String(!prev))
      return !prev
    })
  }

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

      {/* Persistent Fixed Sidebar */}
      <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />

      {/* Dynamic Page Content (margin matches the fixed sidebar's current width) */}
      <main
        className={`relative z-10 flex-1 flex flex-col min-w-0 h-screen overflow-y-auto transition-[margin] duration-200 ${
          collapsed ? 'ml-20' : 'ml-70'
        }`}
      >
        <Outlet />
      </main>
    </div>
  )
}