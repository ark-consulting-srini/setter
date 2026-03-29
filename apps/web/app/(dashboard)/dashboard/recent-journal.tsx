'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { JournalEntry, MoodType } from '@setter/shared/types'
import { MOOD_EMOJI } from '@setter/shared/types'

export function RecentJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEntries() {
      try {
        const res = await fetch('/api/journal')
        if (res.ok) {
          const data: JournalEntry[] = await res.json()
          setEntries(data.slice(0, 3))
        }
      } finally {
        setLoading(false)
      }
    }
    fetchEntries()
  }, [])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Recent Journal</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/journal">
            <BookOpen className="mr-1 h-4 w-4" />
            View all
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : entries.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">
              No journal entries yet. Start reflecting!
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/journal">Write your first entry</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-lg border p-3">
                <div className="flex items-center gap-2 mb-1">
                  {entry.mood && (
                    <span className="text-base">
                      {MOOD_EMOJI[entry.mood as MoodType]}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {entry.content.slice(0, 100)}
                  {entry.content.length > 100 ? '...' : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
