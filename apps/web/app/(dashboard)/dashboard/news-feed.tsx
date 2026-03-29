'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Newspaper, ExternalLink, GraduationCap, Beaker, Trophy, School, Award } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NewsItem {
  title: string
  description: string
  url: string
  source: string
  category: 'college_prep' | 'stem' | 'volleyball' | 'troy' | 'scholarships'
  publishedAt: string
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Newspaper; color: string }> = {
  college_prep: { label: 'College Prep', icon: GraduationCap, color: 'bg-blue-100 text-blue-700' },
  stem: { label: 'STEM', icon: Beaker, color: 'bg-green-100 text-green-700' },
  volleyball: { label: 'Volleyball', icon: Trophy, color: 'bg-orange-100 text-orange-700' },
  troy: { label: 'Troy', icon: School, color: 'bg-red-100 text-red-700' },
  scholarships: { label: 'Scholarships', icon: Award, color: 'bg-purple-100 text-purple-700' },
}

const CATEGORY_FILTERS = ['all', 'troy', 'college_prep', 'stem', 'volleyball'] as const

export function NewsFeed() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch('/api/news')
        if (res.ok) {
          const data = await res.json()
          setItems(data.items)
        }
      } catch {
        // silently fail — news feed is non-critical
      } finally {
        setLoading(false)
      }
    }
    fetchNews()
  }, [])

  const filtered = filter === 'all' ? items : items.filter((item) => item.category === filter)
  const displayed = filtered.slice(0, 8)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-primary" />
            Your Feed
          </CardTitle>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  filter === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                )}
              >
                {cat === 'all' ? 'All' : CATEGORY_CONFIG[cat]?.label ?? cat}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : displayed.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {displayed.map((item, i) => {
              const config = CATEGORY_CONFIG[item.category]
              const Icon = config?.icon ?? Newspaper
              return (
                <a
                  key={i}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col justify-between rounded-lg border p-3 transition-colors hover:bg-accent/50"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', config?.color ?? '')}>
                      <Icon className="mr-1 h-3 w-3" />
                      {config?.label ?? item.category}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{item.source}</span>
                  </div>
                </a>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-center text-muted-foreground py-4">No news items available right now.</p>
        )}
      </CardContent>
    </Card>
  )
}
