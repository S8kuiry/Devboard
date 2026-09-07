import { useEffect, useRef, useState } from 'react'
import {
    Loader2, Bot, ArrowUp, ListPlus,
    NotepadTextDashed, NotebookIcon, Check, Copy, Trash2,
    Paperclip,
    X,
    AlertCircle
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useUsers } from '../context/UserContext'
import { usePlanModal } from '../context/PlanModalContext'
import { markdownDarkComponents } from '../lib/markdown'
import { deleteDocument, ingestDocument } from '../lib/rag'
import { discardChat, saveChatMessages } from '../lib/planChat'
import DeleteModal from './DeleteModal'

export interface ChatMessage {
    role: 'user' | 'ai'
    content: string
    action?: 'none' | 'propose_steps'
    steps?: string[]
    attachments?: string[]

}


interface PlanChatModalProps {
    onClickConvert: (steps: string[]) => void
    onClickConvertDirect: (steps: string) => void
}

interface AttachedFile {
    id: string
    file: File
    status: 'uploading' | 'done' | 'error' | 'deleting'
    error?: string
    controller: AbortController
}


const MAX_FILES_PER_BATCH = 4

export default function PlanChatModal({ onClickConvert, onClickConvertDirect }: PlanChatModalProps) {
    const { loaders, setLoaders } = useUsers()
    const { messages, setMessages, chatInput, setChatInput, ragNamespace, hasUploadedDocs, setHasUploadedDocs } = usePlanModal()
    const [copiedMessage, setCopiedMessage] = useState<number | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const aiUrl = import.meta.env.VITE_AI_URL
    const fileInputRef = useRef<HTMLInputElement>(null);
    const hasInput = chatInput.trim().length > 0
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])

    const [fileError, setFileError] = useState<string | null>(null)
    const isUploading = attachedFiles.some(f => f.status === 'uploading')
    const [deleteNamespace, setDeleteNamespace] = useState<string | null>(null)




    // file upload handlers 
    const startUpload = async (entry: AttachedFile) => {
        try {
            const targetNamespace = ragNamespace
            await ingestDocument(entry.file, targetNamespace, aiUrl, entry.controller.signal)
            setAttachedFiles(prev => prev.map(f => f.id === entry.id ? { ...f, status: 'done' } : f))
            setHasUploadedDocs(true)
        } catch (err: any) {
            if (err?.name === 'AbortError') return // removed mid-upload — nothing to show
            setAttachedFiles(prev => prev.map(
                f => f.id === entry.id ? { ...f, status: 'error', error: err?.message || 'Upload failed' } : f
            ))
        }
    }


    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return


        setAttachedFiles(prev => {
            const remaining = MAX_FILES_PER_BATCH - prev.length
            if (remaining <= 0) {
                setFileError(`You can attach up to ${MAX_FILES_PER_BATCH} files at a time.`)
                return prev
            }

            const accepted = files.slice(0, remaining)
            if (files.length > remaining) {
                setFileError(`Only ${remaining} more file${remaining === 1 ? '' : 's'} can be added (max ${MAX_FILES_PER_BATCH} per batch).`)
            } else {
                setFileError(null)
            }

            const newEntries: AttachedFile[] = accepted.map(file => ({
                id: crypto.randomUUID(),
                file,
                status: 'uploading',
                controller: new AbortController(),
            }))

            newEntries.forEach(entry => startUpload(entry))

            return [...prev, ...newEntries]
        })


        e.target.value = ''
    }


    const handleRemoveFile = async (id: string) => {
        const target = attachedFiles.find(f => f.id === id)

        if (!target) return

        // Upload hasn't finished yet.
        // Just abort it and remove from UI.
        if (target.status === 'uploading') {
            target.controller.abort()

            setAttachedFiles(prev =>
                prev.filter(f => f.id !== id)
            )

            setFileError(null)
            return
        }

        // Upload completed, so remove it from Pinecone.
        if (target.status === 'done') {
            try {
                // Show delete loader
                setAttachedFiles(prev =>
                    prev.map(f =>
                        f.id === id
                            ? { ...f, status: 'deleting' }
                            : f
                    )
                )

                const targetNamespace =
                    ragNamespace 

                await deleteDocument(
                    targetNamespace,
                    target.file.name,
                    aiUrl
                )

                setAttachedFiles(prev =>
                    prev.filter(f => f.id !== id)
                )

                setFileError(null)

            } catch (err: any) {
                setFileError(
                    err?.message || 'Failed to remove file'
                )
            }

            return
        }


        setAttachedFiles(prev =>
            prev.filter(f => f.id !== id)
        )

        setFileError(null)
    }



    const handleCopyMessage = async (content: string, index: number) => {
        try {
            await navigator.clipboard.writeText(content)
            setCopiedMessage(index)
            setTimeout(() => setCopiedMessage(null), 1500)
        } catch (error) {
            console.error('Failed to copy message:', error)
        }
    }

    const buildTranscript = (history: ChatMessage[], newUserText: string) => {
        const recentHistory = history.slice(-5)
        const lines = recentHistory.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
        lines.push(`User: ${newUserText}`)
        return lines.join('\n')
    }

    const handleSendMessage = async (overrideText?: string) => {
        const userText = overrideText ?? chatInput
        const readyFiles = attachedFiles.filter(f => f.status === 'done')

        if (!userText.trim() && readyFiles.length === 0) return
        if (isUploading) return

        const attachmentNames = readyFiles.map(f => f.file.name)
        const namespace = ragNamespace 

        const userMessage: ChatMessage = {
            role: 'user',
            content: userText,
            ...(attachmentNames.length ? { attachments: attachmentNames } : {}),
        }

        setMessages(prev => [...prev, userMessage])
        if (!overrideText) setChatInput('')
        setAttachedFiles([])
        setLoaders(true)

        // Fire-and-forget — the message is already visible via local state above,
        // so this never blocks or delays what the user sees.
        saveChatMessages(namespace, [userMessage], aiUrl).catch(err =>
            console.error('Failed to persist user message:', err)
        )

        try {
            const res = await fetch(`${aiUrl}/api/ai-refine`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    raw_text: buildTranscript(messages, userText),
                    instruction: 'Discuss and help refine this plan; respond conversationally.',
                    ...(hasUploadedDocs ? { namespace, latest_message: userText } : {}),
                }),
            })
            const resBody = await res.json()

            if (res.ok) {
                const aiMessage: ChatMessage = {
                    role: 'ai',
                    content: resBody.reply,
                    action: resBody.action,
                    steps: resBody.steps,
                }
                setMessages(prev => [...prev, aiMessage])

                saveChatMessages(namespace, [aiMessage], aiUrl).catch(err =>
                    console.error('Failed to persist AI reply:', err)
                )
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I could not process that.' }])
        } finally {
            setLoaders(false)
        }
    }


    const handleClearChat = async () => {
        const namespace = ragNamespace 
        setMessages([])
        try {
            await discardChat(namespace, aiUrl)
        } catch (err) {
            console.error('Failed to discard persisted chat:', err)

        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            if (chatInput.trim()) handleSendMessage()
        }
    }

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`
        }
    }, [chatInput])


    
    return (
        <div className="flex flex-col min-h-0 h-full bg-slate-950 p-4 sm:p-5 text-slate-100">


            {/* Header */}
            <div className="w-full mb-3 flex items-center justify-between shrink-0">
                {/* Left Header Title & Icon */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-sm">
                        <NotepadTextDashed className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-xs font-semibold text-slate-200 tracking-wide">
                        DevBoard AI Assistant
                    </h3>
                </div>

                {/* Clear Chat Action Button */}
                {messages.length > 0 && (
                    <button
                        type="button"
                        onClick={() => { setDeleteNamespace(ragNamespace) }}
                        className="group flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-[11px] font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all active:scale-95 shadow-sm"
                        title="Clear Conversation"
                    >
                        <Trash2 className="h-3 w-3 text-slate-400 group-hover:text-rose-400 transition-colors" />
                        <span>Clear Chat</span>
                    </button>
                )}
            </div>
            {/* Message History Container */}
            <div className="flex-1 overflow-y-auto space-y-6 py-2 px-2 sm:px-6 custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-3">
                            <NotepadTextDashed className="h-5 w-5" />
                        </div>
                        <h2 className="text-sm font-medium text-slate-200 mb-1">
                            How can DevBoard AI help you plan?
                        </h2>
                        <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed mb-6">
                            Outline your ideas, paste raw feature specs, or ask for architectural guidance.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-2xl w-full">
                            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                                <div className="flex items-center gap-1.5 font-medium text-indigo-400">
                                    <ListPlus className="h-3 w-3" />
                                    <span>⚡ Auto-Convert</span>
                                </div>
                                <p className="leading-relaxed">
                                    Paste raw notes, PRDs, or bullet points. Click <strong className="text-slate-200 font-normal">"Convert to Steps"</strong> to parse them into actionable tasks.
                                </p>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                                <div className="flex items-center gap-1.5 font-medium text-indigo-400">
                                    <Bot className="h-3 w-3" />
                                    <span>💬 Interactive Chat</span>
                                </div>
                                <p className="leading-relaxed">
                                    Have an open dialogue with AI. Ask to break down complex tasks, discover missing edge cases, or optimize implementation roadmaps.
                                </p>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                                <div className="flex items-center gap-1.5 font-medium text-indigo-400">
                                    <NotebookIcon className="h-3 w-3" />
                                    <span>✍️ Manual Step Entry</span>
                                </div>
                                <p className="leading-relaxed">
                                    Add your execution steps manually. Break the task into clear steps, then reorder or edit them as needed.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, idx) => {
                            if (msg.role === 'user') {
                                return (
                                    <div key={idx} className="flex items-start justify-end gap-2.5 text-xs pl-8">
                                        <div className="relative rounded-2xl rounded-tr-xs px-4 py-2.5 pr-9 bg-slate-900 border border-slate-800 text-slate-200 leading-relaxed max-w-[85%] sm:max-w-[75%] shadow-sm">
                                            <button
                                                type="button"
                                                onClick={() => handleCopyMessage(msg.content, idx)}
                                                title={copiedMessage === idx ? 'Copied' : 'Copy'}
                                                className="absolute top-2 right-2 p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                                            >
                                                {copiedMessage === idx ? <Check className="h-3 w-3 text-indigo-400" /> : <Copy className="h-3 w-3" />}
                                            </button>
                                            {msg.attachments && msg.attachments.length > 0 && (
                                                <div className="mb-2 flex flex-wrap gap-1.5">
                                                    {msg.attachments.map((name, i) => (
                                                        <span key={i} className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-slate-300">
                                                            <Paperclip className="h-2.5 w-2.5 text-indigo-400" />
                                                            <span className="max-w-28 truncate">{name}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <span className="whitespace-pre-wrap">{msg.content}</span>
                                        </div>

                                    </div>
                                )
                            }
                            return (
                                <div key={idx} className="flex items-start gap-3 text-xs w-full">
                                    <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
                                        <Bot className="h-3.5 w-3.5" />
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-3">
                                        <div className="relative group text-slate-200 leading-relaxed text-xs sm:text-[13px] font-normal pr-8">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={markdownDarkComponents}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>

                                            {msg.action === 'propose_steps' && msg.steps && msg.steps.length > 0 && (
                                                <div className="mt-2 space-y-1.5 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                                                    {msg.steps.map((step, i) => (

                                                        <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                                                            <span className="text-indigo-400 font-mono shrink-0">{i + 1}.</span>
                                                            <span>
                                                                <ReactMarkdown
                                                                    remarkPlugins={[remarkGfm]}
                                                                    components={markdownDarkComponents}
                                                                >
                                                                    {step}
                                                                </ReactMarkdown>

                                                            </span>
                                                        </div>


                                                    ))}
                                                </div>
                                            )}





                                            <button
                                                type="button"
                                                onClick={() => handleCopyMessage(msg.content, idx)}
                                                title={copiedMessage === idx ? 'Copied' : 'Copy'}
                                                className="absolute top-0 right-0 p-1.5 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800/80 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                {copiedMessage === idx ? (
                                                    <Check className="h-3.5 w-3.5 text-indigo-400" />
                                                ) : (
                                                    <Copy className="h-3.5 w-3.5" />
                                                )}
                                            </button>
                                        </div>

                                        {msg.action === 'propose_steps' && msg.steps && msg.steps.length > 0 && (
                                            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-800/40">
                                                <button
                                                    type="button"
                                                    onClick={() => onClickConvert(msg.steps!)}
                                                    disabled={loaders}
                                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-medium text-[11px] transition-all active:scale-95 disabled:opacity-40"
                                                >
                                                    <NotepadTextDashed className="h-3 w-3 text-indigo-400" />
                                                    <span>⚡ Convert to Steps</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}

                        {loaders && (
                            <div className="flex items-start gap-3 text-xs w-full animate-pulse">
                                <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
                                    <Bot className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex-1 min-w-0 space-y-2 py-1">
                                    <div className="flex items-center gap-2 text-indigo-400 font-medium text-[11px]">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        <span>DevBoard AI is drafting your plan...</span>
                                    </div>
                                    <div className="space-y-1.5 pt-0.5">
                                        <div className="h-2.5 bg-slate-800/80 rounded-md w-3/4"></div>
                                        <div className="h-2.5 bg-slate-800/50 rounded-md w-1/2"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Input Box */}
            <div className="shrink-0 pt-2 px-2 sm:px-6">
                <div className="rounded-lg border border-slate-800 bg-slate-900/90 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all p-3 shadow-lg">

                    {attachedFiles.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-1.5">
                            {attachedFiles.map(f => (
                                <div
                                    key={f.id}
                                    className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] ${f.status === 'error'
                                        ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                                        : 'border-slate-700 bg-slate-800 text-slate-300'
                                        }`}
                                >
                                    {f.status === 'uploading' && <Loader2 className="h-3 w-3 text-indigo-400 animate-spin" />}
                                    {f.status === 'done' && <Check className="h-3 w-3 text-emerald-400" />}
                                    {f.status === 'error' && <AlertCircle className="h-3 w-3 text-rose-400" />}
                                    {f.status === 'deleting' && (
                                        <Loader2 className="h-3 w-3 text-rose-400 animate-spin" />
                                    )}
                                    <span className="max-w-32 truncate">{f.file.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveFile(f.id)}
                                        className="ml-1 text-slate-500 hover:text-red-400"
                                        title="Remove file"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {fileError && <p className="mb-2 text-[10px] text-rose-400">{fileError}</p>}

                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your build idea, feature request, or deployment plan..."
                        className="w-full resize-none bg-transparent text-xs text-slate-100 placeholder-slate-500 outline-none border-none focus:ring-0 p-0 custom-scrollbar leading-relaxed max-h-36 overflow-y-auto"
                    />

                    <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-800/60">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={loaders || attachedFiles.length >= MAX_FILES_PER_BATCH}
                                title={attachedFiles.length >= MAX_FILES_PER_BATCH ? `Max ${MAX_FILES_PER_BATCH} files per message` : 'Attach files'}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-indigo-300 hover:border-indigo-500/40 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <Paperclip className="h-3.5 w-3.5" />
                            </button>

                            {hasInput && (
                                <button
                                    type="button"
                                    onClick={() => onClickConvertDirect(chatInput)}
                                    disabled={loaders}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium text-[11px] transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {loaders ? (
                                        <>
                                            <Loader2 className="h-3 w-3 animate-spin text-indigo-400" />
                                            <span>Converting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <NotepadTextDashed className="h-3 w-3 text-indigo-400" />
                                            <span>Convert to Steps</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => handleSendMessage()}
                            disabled={loaders || isUploading || (!hasInput && attachedFiles.filter(f => f.status === 'done').length === 0)}
                            title={isUploading ? 'Waiting for upload to finish...' : 'Send Message'}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white transition-all active:scale-95 shadow-sm"
                        >
                            {loaders ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
            </div>



            {Boolean(deleteNamespace) && (
                <DeleteModal
                    isOpen
                    onClose={() => setDeleteNamespace("")}
                    onConfirm={handleClearChat}
                    title="Clear Chat History"
                />
            )}


        </div>
    )
}
