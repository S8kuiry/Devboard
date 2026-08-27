import { useEffect, useRef } from 'react'
import {
  Bot,
  Home,
  MessageSquare,
  Search,
  ExternalLink,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Paperclip,
  Smile,
  Mic,
  ArrowUp,
  BarChart3Icon,
  NotebookTextIcon,
  Trash2,
  Loader2
} from 'lucide-react'
import { AGENTIC_MODAL_CHIPS } from '../lib/chips'
import { useAgent, type TabType, } from '../context/AgentContext'

export default function AgenticModal() {
  const {
    isOpen,
    setIsOpen,
    activeTab,
    setActiveTab,
    inputText,
    setInputText,
    conversations,
    activeConversationId,
    setActiveConversationId,
    messages,
    setMessages,
    isLoading,
    isSending,
    sendMessage,
    deleteConversation,
    startNewChat,
    isNewChat,
    setIsNewChat
  } = useAgent()

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  const isChatActive = !!activeConversationId || isNewChat || messages.length > 0

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (activeTab === 'chats' && isChatActive) {
      scrollToBottom()
    }
  }, [messages, isChatActive, activeTab])

  useEffect(() => {
    if (activeTab === 'chats' && isChatActive) {
      inputRef.current?.focus()
    }
  }, [activeTab, isChatActive])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end select-none font-sans">
      {isOpen && (
        <div className="mb-4 flex h-[680px] max-h-[85vh] w-[420px] flex-col overflow-hidden rounded-3xl bg-white text-slate-900 shadow-2xl shadow-slate-950/25 border border-slate-200/80 animate-in fade-in slide-in-from-bottom-5 duration-200">

          {/* Header */}
          <div
            className={`px-6 pt-5 pb-3 flex items-center justify-between ${activeTab === 'home' ? 'bg-[#080B1A]' : 'bg-white border-b border-slate-300/90'
              }`}
          >
            {activeTab === 'home' && (
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white font-mono font-bold text-xs">
                  D
                </div>
                <span className="font-semibold text-white tracking-tight">DevBoard Support</span>
              </div>
            )}

            {activeTab === 'chats' && !isChatActive && (
              <>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Messages</h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-medium text-slate-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </>
            )}

            {activeTab === 'chats' && isChatActive && (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setActiveConversationId(null)
                      setIsNewChat(false)
                      setMessages([])
                    }} className="cursor-pointer p-1 -ml-1 rounded-lg text-slate-600 hover:bg-slate-200/80 hover:text-slate-800 transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                    <Bot size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 leading-none">DevBoard AI</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Automated Assistant</p>
                  </div>
                </div>

                {activeConversationId && (
                  <button
                    onClick={() => deleteConversation(activeConversationId)}
                    title="Delete Conversation"
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            )}

            {activeTab === 'insights' && (
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Your Insights</h2>
            )}
            {activeTab === 'activity' && (
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Your Activity</h2>
            )}
          </div>

          {/* Dynamic Content Area */}
          <div className="flex-1 overflow-y-auto px-6 pb-2 pt-0">
            {/* TAB 1: HOME */}
            {activeTab === 'home' && (
              <div className="-mx-6 space-y-4">
                <div className="bg-gradient-to-b from-[#080B1A] via-[#141B42] to-[#3730A3] px-6 pt-3 pb-20 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center justify-end mb-6">
                    <div className="flex items-center -space-x-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-800 font-bold text-[10px] ring-2 ring-[#080B1A]">
                        AI
                      </div>
                    </div>
                  </div>

                  <h1 className="text-2xl font-bold text-white tracking-tight leading-snug">
                    Hello Developer! <br />
                    How can we help?
                  </h1>
                </div>

                <div className="px-6 space-y-3.5 -mt-6 relative z-10">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200/80 shadow-lg shadow-slate-900/20 text-slate-800">
                    <CheckCircle2 size={22} className="text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Status: All Systems Operational</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        Gateway Active • Fast Responses
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-[11px] font-bold text-slate-600 mb-2 uppercase tracking-wider px-0.5">
                      Suggested Actions
                    </p>
                    <div className="flex flex-col items-start gap-2">
                      {AGENTIC_MODAL_CHIPS.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => sendMessage(item.action || item.label)}
                          className="transition-transform duration-300 hover:translate-x-2 shadow-xl shadow-indigo-300 bg-white w-auto flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium text-indigo-700 hover:border-indigo-300 hover:text-indigo-800 active:scale-95 transition-all"
                        >
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CHATS */}
            {activeTab === 'chats' && (
              <div className="flex flex-col h-full justify-between">
                {isChatActive ? (
                  /* ACTIVE CHAT THREAD VIEW */
                  <div className="flex flex-col h-full justify-between -mx-6 bg-white">
                    <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
                      {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 py-16 px-4 space-y-2">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-1">
                            <Bot size={24} />
                          </div>
                          <p className="text-sm font-semibold text-slate-700">How can I help you today?</p>
                          <p className="text-xs text-slate-400 max-w-[240px]">
                            Ask anything about your tasks, blockers, or workspace activity.
                          </p>
                        </div>
                      )}

                      {messages.map((msg, i) => (
                        <div key={i} className="space-y-1">
                          <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[12px] leading-snug ${msg.role === 'user'
                                ? 'bg-indigo-700 text-white rounded-tr-none font-normal'
                                : 'bg-slate-100 text-slate-800 rounded-tl-none font-normal'
                                }`}
                            >
                              {msg.content}
                            </div>
                          </div>

                          {msg.role === 'assistant' && (
                            <p className="text-[10px] text-slate-400 pl-1 font-normal">
                              DevBoard AI •{' '}
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}
                        </div>
                      ))}

                      {isSending && (
                        <div className="flex justify-start">
                          <div className="bg-slate-100 rounded-2xl px-4 py-2.5 text-xs text-slate-500 flex items-center gap-2">
                            <Loader2 size={14} className="animate-spin text-indigo-600" />
                            <span>Thinking...</span>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input Bar */}
                    <div className="px-3 bg-white shrink-0">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          sendMessage()
                        }}
                        className="rounded-2xl border-2 border-slate-800 bg-white p-2.5 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400 transition-all shadow-xs"
                      >
                        <textarea
                          ref={inputRef}
                          rows={2}
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              sendMessage()
                            }
                          }}
                          placeholder="Message..."
                          className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 resize-none focus:outline-none"
                        />

                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 mt-1">
                          <div className="flex items-center gap-3 text-slate-400">
                            <button type="button" className="hover:text-slate-600 transition-colors">
                              <Paperclip size={15} />
                            </button>
                            <button type="button" className="hover:text-slate-600 transition-colors">
                              <Smile size={15} />
                            </button>
                            <button type="button" className="hover:text-slate-600 transition-colors">
                              <Mic size={15} />
                            </button>
                          </div>

                          <button
                            type="submit"
                            disabled={!inputText.trim() || isSending}
                            className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${inputText.trim() && !isSending
                              ? 'bg-indigo-700 text-white hover:bg-indigo-800 shadow-xs'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              }`}
                          >
                            <ArrowUp size={15} />
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                ) : (
                  /* THREAD LIST VIEW */
                  <div className="relative flex flex-col h-full min-h-[380px]">
                    <div className="flex-1 overflow-y-auto space-y-2 pt-2 pb-16 px-1">
                      {isLoading ? (
                        <div className="flex justify-center items-center py-10">
                          <Loader2 size={24} className="animate-spin text-indigo-600" />
                        </div>
                      ) : conversations.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-xs">
                          No past conversations. Click below to start one!
                        </div>
                      ) : (
                        conversations.map((chat) => {

                          const isActive = activeConversationId === chat.id

                          return (
                            <div key={chat.id} className="relative group w-full mb-2">
                              <button
                                onClick={() => {
                                  setIsNewChat(false)
                                  setActiveConversationId(chat.id)
                                }}
                                className={`w-full text-left flex items-center gap-3.5 p-4 rounded-xl border transition-all duration-200 cursor-pointer ${isActive
                                    ? 'bg-indigo-50/80 border-indigo-200 shadow-sm'
                                    : 'bg-white hover:bg-slate-50/80 border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
                                  }`}
                              >
                                {/* Icon Avatar */}
                                <div
                                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors ${isActive
                                      ? 'bg-indigo-600 text-white border-indigo-600'
                                      : 'bg-indigo-50 text-indigo-600 border-indigo-100 group-hover:bg-indigo-100'
                                    }`}
                                >
                                  <Bot size={20} />
                                </div>

                                {/* Info Container */}
                                <div className="min-w-0 flex-1 pr-6">
                                  <div className="flex items-center justify-between gap-2">
                                    <h4
                                      className={`text-sm font-semibold truncate ${isActive ? 'text-indigo-900' : 'text-slate-800 group-hover:text-indigo-600'
                                        }`}
                                    >
                                      Chat #{chat.id}
                                    </h4>
                                    <span className="text-[11px] font-mono text-slate-400 shrink-0">
                                      {new Date(chat.updated_at).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 truncate mt-0.5">
                                    {chat.user_email}
                                  </p>
                                </div>
                              </button>

                              {/* Action Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteConversation(chat.id)
                                }}
                                title="Delete conversation"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>)

                        })
                      )}
                    </div>

                    {/* Always Visible Floating Action Pill */}
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none z-20">
                      <button
                        onClick={startNewChat}
                        className="pointer-events-auto flex items-center gap-2 bg-[#2e2a85] hover:bg-[#221f66] text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-lg shadow-slate-900/15 active:scale-95 transition-all cursor-pointer"
                      >
                        <span>Ask a question</span>
                        <div className="flex items-center justify-center w-4 h-4 rounded-full bg-white/20 text-white text-[11px] font-bold">
                          ?
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: INSIGHTS */}
            {activeTab === 'insights' && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Assigned to you
                  </span>
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                    3 active
                  </span>
                </div>
                <div className="space-y-2">
                  {[
                    { title: 'Fix JWT Refresh Token Expiry', service: 'Auth API', priority: 'High' },
                    { title: 'Setup Render Keep-Alive Endpoint', service: 'DevOps', priority: 'Med' },
                    { title: 'Refactor Sidebar Component Layout', service: 'Frontend', priority: 'Low' }
                  ].map((task, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all"
                    >
                      <h4 className="text-xs font-semibold text-slate-800">{task.title}</h4>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-mono bg-white text-slate-500 px-2 py-0.5 rounded-md border border-slate-200">
                          {task.service}
                        </span>
                        <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100 font-medium">
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: ACTIVITY */}
            {activeTab === 'activity' && (
              <div className="space-y-4 pt-2">
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search activity & logs..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
                <div className="divide-y divide-slate-100">
                  {[
                    'Getting started with DevBoard workspace',
                    'How to assign tasks to team members',
                    'Understanding task status transitions',
                    'Automating notifications via agent triggers'
                  ].map((guide, idx) => (
                    <a
                      key={idx}
                      href="#docs"
                      className="flex items-center justify-between py-3 text-xs text-slate-700 hover:text-indigo-700 transition-colors group"
                    >
                      <span className="font-medium">{guide}</span>
                      <ExternalLink size={14} className="text-slate-400 group-hover:text-indigo-700" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Navigation */}
          <div className="grid grid-cols-4 gap-1 px-4 py-2 bg-white border-t border-slate-100">
            {[
              { id: 'home', label: 'Home', icon: Home },
              { id: 'chats', label: 'Chats', icon: MessageSquare },
              { id: 'insights', label: 'Insights', icon: BarChart3Icon },
              { id: 'activity', label: 'Activity', icon: NotebookTextIcon }
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex flex-col items-center justify-center py-2 rounded-2xl transition-all ${isActive ? 'text-indigo-700 font-semibold' : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span className="text-[11px] mt-1">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Close Support' : 'Open Support'}
        className="group flex h-14 w-14 items-center justify-center rounded-full bg-emerald-700 text-white shadow-xl shadow-indigo-950/40 hover:bg-emerald-800 transition-all duration-300 hover:scale-105 focus:outline-none"
      >
        {isOpen ? (
          <ChevronDown size={28} className="transition-transform duration-200" />
        ) : (
          <Bot size={26} className="transition-transform duration-200 group-hover:scale-110" />
        )}
      </button>
    </div>
  )
}