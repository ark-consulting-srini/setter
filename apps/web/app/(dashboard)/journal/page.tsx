'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Plus, ArrowLeft, RefreshCw, Save, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import type { JournalEntry, MoodType } from '@setter/shared/types'
import { MOOD_EMOJI } from '@setter/shared/types'

const MOOD_OPTIONS: { value: MoodType; label: string }[] = [
  { value: 'great', label: 'Great' },
  { value: 'good', label: 'Good' },
  { value: 'okay', label: 'Okay' },
  { value: 'tough', label: 'Tough' },
  { value: 'rough', label: 'Rough' },
]

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Editor state
  const [content, setContent] = useState('')
  const [mood, setMood] = useState<MoodType | null>(null)
  const [prompt, setPrompt] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/journal')
      if (res.ok) {
        const data: JournalEntry[] = await res.json()
        setEntries(data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!editing || !editingId || !content.trim()) return

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(async () => {
      await autoSave()
    }, 30000)

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, editing, editingId])

  async function autoSave() {
    if (!editingId || !content.trim()) return

    try {
      await fetch(`/api/journal/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, mood, prompt_used: prompt || undefined }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // Silent fail for auto-save
    }
  }

  async function fetchRandomPrompt() {
    // Use the prompts from shared package inline since we're client-side
    const prompts = [
      "What's one thing you crushed today -- on the court or off?",
      "If you could replay one moment from today, what would it be and why?",
      "What's something that challenged you this week, and how did you handle it?",
      "Write about a teammate or friend who made your day better recently.",
      "What's one goal you're working toward right now? How does it feel?",
      "Describe a moment this week where you felt proud of yourself.",
      "If future-you could read this entry, what would you want her to know?",
      "What's something you're learning -- in class, in volleyball, or about yourself?",
      "Write about a time you bounced back from something tough. What helped?",
      "What are three things you're grateful for today? Be specific.",
    ]
    setPrompt(prompts[Math.floor(Math.random() * prompts.length)])
  }

  async function startNewEntry() {
    setSaving(true)
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '' }),
      })
      if (!res.ok) throw new Error('Failed')
      const newEntry: JournalEntry = await res.json()
      setEditingId(newEntry.id)
      setContent('')
      setMood(null)
      setPrompt('')
      setEditing(true)
      fetchRandomPrompt()
    } catch {
      toast({ title: 'Failed to start entry', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function saveEntry() {
    if (!editingId) return
    setSaving(true)

    try {
      const res = await fetch(`/api/journal/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          mood,
          prompt_used: prompt || undefined,
        }),
      })
      if (!res.ok) throw new Error('Failed')

      toast({ title: 'Entry saved!', variant: 'success' })
      setEditing(false)
      setEditingId(null)
      fetchEntries()

      // Check achievements
      fetch('/api/achievements/check', { method: 'POST' }).catch(() => {})
    } catch {
      toast({ title: 'Failed to save entry', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function deleteEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id))
    try {
      await fetch(`/api/journal/${id}`, { method: 'DELETE' })
      toast({ title: 'Entry deleted' })
    } catch {
      fetchEntries()
      toast({ title: 'Failed to delete', variant: 'destructive' })
    }
  }

  // Editor view
  if (editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => { setEditing(false); setEditingId(null) }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <Check className="h-3 w-3" /> Saved
              </span>
            )}
            <Button onClick={saveEntry} disabled={saving || !content.trim()}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Mood selector */}
        <div>
          <p className="mb-2 text-sm font-medium">How are you feeling?</p>
          <div className="flex gap-2">
            {MOOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setMood(option.value)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg border px-4 py-2 transition-colors',
                  mood === option.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <span className="text-xl">{MOOD_EMOJI[option.value]}</span>
                <span className="text-xs">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt */}
        {prompt && (
          <div className="rounded-lg bg-accent p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm italic text-accent-foreground">{prompt}</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={fetchRandomPrompt}
                title="Get another prompt"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        <Textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[300px] resize-none text-base leading-relaxed"
          autoFocus
        />
      </div>
    )
  }

  // List view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Journal</h1>
          <p className="text-muted-foreground">Reflect, grow, repeat.</p>
        </div>
        <Button onClick={startNewEntry} disabled={saving}>
          <Plus className="mr-2 h-4 w-4" />
          New Entry
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading entries...</p>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <p className="mb-4 text-muted-foreground">
              Your journal is empty. Start writing your story.
            </p>
            <Button onClick={startNewEntry}>Write your first entry</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id} className="group relative">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <span className="text-xl">
                      {entry.mood ? MOOD_EMOJI[entry.mood] : ''}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">
                      {new Date(entry.created_at).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-sm">
                      {entry.content.slice(0, 200)}
                      {entry.content.length > 200 ? '...' : ''}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteEntry(entry.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
