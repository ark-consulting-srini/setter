'use client'

import { useState, useRef } from 'react'
import { Camera, Mic, X, Loader2, Check, FileText, Calendar, Brain, StickyNote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { track } from '@/lib/track'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface CapturedItem {
  type: 'task' | 'note' | 'calendar' | 'knowledge'
  title: string
  details?: string
  dueDate?: string
  saved: boolean
}

export function CaptureButton() {
  const [open, setOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [items, setItems] = useState<CapturedItem[]>([])
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setProcessing(true)
    setItems([])

    try {
      // Convert to base64 for Claude Vision
      const arrayBuffer = await file.arrayBuffer()
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

      const res = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          mimeType: file.type,
          fileName: file.name,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setItems(data.items.map((i: CapturedItem) => ({ ...i, saved: false })))
        track('file_uploaded', undefined, { type: 'image_capture', items: data.items.length })
      }
    } catch {
      setItems([{ type: 'note', title: 'Could not process image', saved: false }])
    } finally {
      setProcessing(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function saveItem(idx: number) {
    const item = items[idx]
    if (!item || item.saved) return

    try {
      if (item.type === 'task' || item.type === 'calendar') {
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: item.title,
            category: 'personal',
            priority: 'medium',
            due_date: item.dueDate ?? new Date().toISOString().split('T')[0],
          }),
        })
      }

      if (item.type === 'knowledge' || item.type === 'note') {
        await fetch('/api/journal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `${item.title}${item.details ? '\n\n' + item.details : ''}`,
            mood: 'good',
            prompt_used: 'Captured from image',
          }),
        })
      }

      setItems(p => p.map((it, i) => i === idx ? { ...it, saved: true } : it))
    } catch {}
  }

  async function saveAll() {
    for (let i = 0; i < items.length; i++) {
      if (!items[i].saved) await saveItem(i)
    }
  }

  function close() {
    setOpen(false)
    setItems([])
    setImagePreview(null)
  }

  const ITEM_ICONS = {
    task: Calendar,
    calendar: Calendar,
    note: StickyNote,
    knowledge: Brain,
  }

  const ITEM_COLORS = {
    task: 'text-blue-600 bg-blue-50',
    calendar: 'text-amber-600 bg-amber-50',
    note: 'text-purple-600 bg-purple-50',
    knowledge: 'text-emerald-600 bg-emerald-50',
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
      >
        <Camera className="h-5 w-5" />
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={close}>
          <Card className="w-full max-w-md mx-4 mb-4 sm:mb-0 max-h-[80vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Quick Capture</h3>
                <button onClick={close}><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>

              {!imagePreview && !processing && items.length === 0 && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">Upload a screenshot, photo, or document — AI will extract tasks, notes, and events.</p>

                  <input ref={fileRef} type="file" accept="image/*,.pdf,.docx" capture="environment" onChange={handleImageUpload} className="hidden" id="capture-input" />

                  <label htmlFor="capture-input">
                    <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/20 py-8 cursor-pointer hover:border-primary/40 transition-colors">
                      <Camera className="h-8 w-8 text-muted-foreground/40" />
                      <span className="text-sm font-medium text-muted-foreground">Take Photo or Choose Image</span>
                      <span className="text-[10px] text-muted-foreground/60">Screenshots, homework, notes, schedules</span>
                    </div>
                  </label>
                </div>
              )}

              {/* Image preview */}
              {imagePreview && (
                <div className="rounded-lg overflow-hidden">
                  <img src={imagePreview} alt="Captured" className="w-full max-h-40 object-cover" />
                </div>
              )}

              {/* Processing */}
              {processing && (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Setter is reading your image...</p>
                </div>
              )}

              {/* Results */}
              {items.length > 0 && !processing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">Found {items.length} item{items.length !== 1 ? 's' : ''}</p>
                    {items.some(i => !i.saved) && (
                      <Button size="sm" variant="outline" className="text-xs" onClick={saveAll}>Save All</Button>
                    )}
                  </div>
                  {items.map((item, idx) => {
                    const Icon = ITEM_ICONS[item.type]
                    const color = ITEM_COLORS[item.type]
                    return (
                      <div key={idx} className={cn('rounded-lg border p-3', item.saved && 'opacity-50')}>
                        <div className="flex items-start gap-3">
                          <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', color.split(' ')[1])}>
                            <Icon className={cn('h-4 w-4', color.split(' ')[0])} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[9px] capitalize">{item.type}</Badge>
                              {item.dueDate && <span className="text-[10px] text-muted-foreground">{item.dueDate}</span>}
                            </div>
                            <p className="text-sm font-medium mt-1">{item.title}</p>
                            {item.details && <p className="text-xs text-muted-foreground mt-0.5">{item.details}</p>}
                          </div>
                          {item.saved ? (
                            <Check className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Button size="sm" variant="outline" className="text-xs" onClick={() => saveItem(idx)}>Save</Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
