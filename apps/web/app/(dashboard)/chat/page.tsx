'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send,
  Plus,
  Search,
  Trash2,
  Pencil,
  ChevronLeft,
  Sparkles,
  BookOpen,
  Calculator,
  FlaskConical,
  Globe,
  Code,
  GraduationCap,
  MessageCircle,
  X,
  Paperclip,
  FileText,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MessageRenderer } from './message-renderer'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatSession {
  id: string
  title: string
  subject: string | null
  messageCount: number
  preview: string
  createdAt: string
  updatedAt: string
}

const SUBJECT_PROMPTS = [
  { icon: Globe, label: 'AP World', prompt: 'Help me with AP World History (Ms. Darracq): ', color: 'bg-amber-100 text-amber-700' },
  { icon: Calculator, label: 'Algebra 2', prompt: 'Help me with Algebra 2 (Ms. Eisenman): ', color: 'bg-blue-100 text-blue-700' },
  { icon: FlaskConical, label: 'Honors Bio', prompt: 'Help me with Honors Biology (Ms. Ngo): ', color: 'bg-green-100 text-green-700' },
  { icon: BookOpen, label: 'English', prompt: 'Help me with English Honors (Ms. Flavell): ', color: 'bg-purple-100 text-purple-700' },
  { icon: Code, label: 'AP CSP', prompt: 'Help me with AP Computer Science Principles (Mr. Hwang): ', color: 'bg-cyan-100 text-cyan-700' },
  { icon: GraduationCap, label: 'Español 2', prompt: 'Help me with Spanish 2 (Sra. Romero): ', color: 'bg-rose-100 text-rose-700' },
]

const QUICK_STARTERS = [
  "Help me study for my AP World History exam on Japanese Authoritarianism",
  "Explain trigonometric identities step by step for Algebra 2",
  "Quiz me on Honors Bio 3 vocabulary",
  "Review my English essay outline and give feedback",
  "Help me with my AP CSP coding assignment",
  "Prep me for the next Speech and Debate tournament",
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [waitingForFirst, setWaitingForFirst] = useState(false)

  // File upload state
  const [attachedFile, setAttachedFile] = useState<{ name: string; text: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sidebar state
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputContainerRef = useRef<HTMLDivElement>(null)

  // Load sessions on mount
  useEffect(() => {
    loadSessions()
  }, [])

  async function loadSessions() {
    try {
      const res = await fetch('/api/chat/sessions')
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions)
      }
    } catch { /* ignore */ }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-resize textarea
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }, [])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (sessionId) formData.append('sessionId', sessionId)

      const res = await fetch('/api/chat/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Upload failed')
        return
      }

      setAttachedFile({ name: data.fileName, text: data.extractedText })
    } catch {
      alert('Failed to upload file. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSend(messageOverride?: string) {
    const message = (messageOverride ?? input).trim()
    if (!message && !attachedFile) return
    if (streaming) return

    // Build the full message with file context
    const currentFile = attachedFile
    let fullMessage = message
    if (currentFile) {
      const fileContext = `[Attached file: ${currentFile.name}]\n\nFile contents:\n${currentFile.text}`
      fullMessage = message
        ? `${message}\n\n${fileContext}`
        : `Please review this document and help me understand it:\n\n${fileContext}`
      setAttachedFile(null)
    }

    if (!fullMessage) return

    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    // Show just the user's typed message (not the full file dump) in the UI
    const displayMessage = currentFile
      ? (message ? `${message}\n\n📎 ${currentFile.name}` : `📎 Uploaded: ${currentFile.name}`)
      : message
    setMessages((prev) => [...prev, { role: 'user', content: displayMessage }])
    setStreaming(true)
    setWaitingForFirst(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: fullMessage }),
      })

      if (!res.ok) throw new Error('Chat request failed')

      const newSessionId = res.headers.get('X-Session-Id')
      if (newSessionId) setSessionId(newSessionId)

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let assistantMessage = ''

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        assistantMessage += text
        setWaitingForFirst(false)

        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: assistantMessage }
          return updated
        })
      }

      // Reload sessions to show new/updated session
      loadSessions()
    } catch {
      setMessages((prev) => [
        ...prev.filter((m) => !(m.role === 'assistant' && m.content === '')),
        { role: 'assistant', content: 'Sorry, something went wrong. Try again?' },
      ])
    } finally {
      setStreaming(false)
      setWaitingForFirst(false)
      textareaRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function startNewChat() {
    setMessages([])
    setSessionId(null)
    setSidebarOpen(false)
    textareaRef.current?.focus()
  }

  async function loadSession(id: string) {
    try {
      const res = await fetch(`/api/chat/sessions/${id}`)
      if (!res.ok) return

      const data = await res.json()
      setSessionId(id)
      setMessages(
        (data.messages ?? []).map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }))
      )
      setSidebarOpen(false)
    } catch { /* ignore */ }
  }

  async function deleteSession(id: string) {
    try {
      await fetch('/api/chat/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: id }),
      })
      setSessions((prev) => prev.filter((s) => s.id !== id))
      if (sessionId === id) startNewChat()
    } catch { /* ignore */ }
    setMenuOpenId(null)
  }

  async function renameSession(id: string) {
    if (!editTitle.trim()) {
      setEditingId(null)
      return
    }
    try {
      await fetch('/api/chat/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: id, title: editTitle.trim() }),
      })
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, title: editTitle.trim() } : s))
      )
    } catch { /* ignore */ }
    setEditingId(null)
  }

  const filteredSessions = searchQuery
    ? sessions.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.preview.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sessions

  // Group sessions by date
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  const grouped: { label: string; items: ChatSession[] }[] = []

  const todaySessions = filteredSessions.filter((s) => new Date(s.updatedAt).toDateString() === today)
  const yesterdaySessions = filteredSessions.filter((s) => new Date(s.updatedAt).toDateString() === yesterday)
  const olderSessions = filteredSessions.filter(
    (s) => new Date(s.updatedAt).toDateString() !== today && new Date(s.updatedAt).toDateString() !== yesterday
  )

  if (todaySessions.length) grouped.push({ label: 'Today', items: todaySessions })
  if (yesterdaySessions.length) grouped.push({ label: 'Yesterday', items: yesterdaySessions })
  if (olderSessions.length) grouped.push({ label: 'Earlier', items: olderSessions })

  const isEmptyState = messages.length === 0

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16)-theme(spacing.8))] lg:h-[calc(100vh-theme(spacing.16))] -m-4 md:-m-6 lg:-m-8">
      {/* Chat Sidebar — History */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-card transition-transform duration-200 lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b p-3">
          <Button variant="outline" size="sm" className="flex-1 justify-start gap-2" onClick={startNewChat}>
            <Plus className="h-4 w-4" />
            New chat
          </Button>
          <Button variant="ghost" size="icon" className="ml-2 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="border-b p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border bg-background py-2 pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2">
          {grouped.length === 0 ? (
            <p className="p-4 text-center text-xs text-muted-foreground">No conversations yet</p>
          ) : (
            grouped.map((group) => (
              <div key={group.label} className="mb-3">
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </p>
                {group.items.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      'group relative flex items-center rounded-lg px-2 py-2 text-sm transition-colors cursor-pointer',
                      sessionId === session.id
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-muted'
                    )}
                    onClick={() => loadSession(session.id)}
                  >
                    <MessageCircle className="mr-2 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />

                    {editingId === session.id ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => renameSession(session.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') renameSession(session.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        className="flex-1 bg-transparent text-xs outline-none"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="flex-1 truncate text-xs">{session.title}</span>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingId(session.id)
                          setEditTitle(session.title)
                        }}
                        className="rounded p-1 hover:bg-accent"
                      >
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSession(session.id)
                        }}
                        className="rounded p-1 hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Chat Header */}
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold truncate">
              {sessionId
                ? sessions.find((s) => s.id === sessionId)?.title ?? 'Conversation'
                : 'New conversation'}
            </h1>
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Sparkles className="h-2.5 w-2.5" />
              Setter knows your tasks, goals, and achievements
            </p>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={startNewChat} className="text-xs">
              <Plus className="mr-1 h-3.5 w-3.5" />
              New
            </Button>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {isEmptyState ? (
            <div className="flex h-full flex-col items-center justify-center px-4 py-8">
              <div className="w-full max-w-2xl space-y-8">
                {/* Welcome */}
                <div className="text-center animate-fade-in-scale">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight">What can I help you with?</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground max-w-md mx-auto">
                    I&apos;m Setter — your personal study buddy. I know your classes, goals, and what you&apos;ve been working on.
                  </p>
                </div>

                {/* Subject Quick-Select */}
                <div className="space-y-3 animate-slide-up">
                  <p className="text-xs font-medium text-muted-foreground text-center uppercase tracking-wider">Pick a subject</p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {SUBJECT_PROMPTS.map((subj) => (
                      <button
                        key={subj.label}
                        onClick={() => {
                          setInput(subj.prompt)
                          textareaRef.current?.focus()
                        }}
                        className={cn(
                          'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all hover:scale-[1.03] hover:shadow-md',
                          subj.color
                        )}
                      >
                        <subj.icon className="h-5 w-5" />
                        {subj.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Starters */}
                <div className="space-y-3 animate-slide-up">
                  <p className="text-xs font-medium text-muted-foreground text-center uppercase tracking-wider">Or try one of these</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {QUICK_STARTERS.map((starter) => (
                      <button
                        key={starter}
                        onClick={() => handleSend(starter)}
                        className="rounded-xl border bg-card px-4 py-3 text-left text-xs font-medium text-foreground transition-all hover:bg-accent hover:shadow-sm"
                      >
                        {starter}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex gap-3',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-[10px] font-black mt-0.5">
                      S
                    </div>
                  )}

                  <div
                    className={cn(
                      'max-w-[85%] text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-3'
                        : 'rounded-2xl rounded-bl-md bg-secondary/60 text-foreground px-4 py-3'
                    )}
                  >
                    {msg.content ? (
                      <MessageRenderer content={msg.content} role={msg.role} />
                    ) : waitingForFirst && i === messages.length - 1 ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="flex gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-xs italic">Thinking...</span>
                      </div>
                    ) : null}
                  </div>

                  {msg.role === 'user' && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-troy-gold text-white text-[10px] font-bold mt-0.5">
                      R
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t bg-card/80 backdrop-blur-sm px-4 py-3">
          <div className="mx-auto max-w-3xl">
            {/* Attached File Preview */}
            {attachedFile && (
              <div className="mb-2 flex items-center gap-2 rounded-lg border bg-accent/50 px-3 py-2 text-sm animate-fade-in-scale">
                <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="flex-1 truncate text-xs font-medium">{attachedFile.name}</span>
                <button onClick={() => setAttachedFile(null)} className="rounded p-0.5 hover:bg-accent">
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            )}

            <div ref={inputContainerRef} className="relative flex items-end gap-2 rounded-xl border bg-background p-2 shadow-sm focus-within:ring-1 focus-within:ring-ring transition-shadow">
              {/* File Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.pptx,.txt,.md"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={streaming || uploading}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                title="Upload PDF, DOCX, or PPTX"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Paperclip className="h-4 w-4" />
                )}
              </button>

              <textarea
                ref={textareaRef}
                placeholder={attachedFile ? 'Ask about the file, or just send...' : 'Message Setter...'}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none"
                rows={1}
                style={{ maxHeight: '160px' }}
                disabled={streaming}
              />
              <Button
                size="icon"
                onClick={() => handleSend()}
                disabled={streaming || (!input.trim() && !attachedFile)}
                className="h-8 w-8 shrink-0 rounded-lg"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
              Upload PDFs, PowerPoints, or Word docs. Setter will read and help you study them.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
