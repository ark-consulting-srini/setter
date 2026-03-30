'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface PrimaryGoal {
  id: string
  title: string
  subtitle: string
  icon: string
  color: string
  bgColor: string
  ringColor: string
  progress: number
  milestones: { label: string; done: boolean }[]
}

const PRIMARY_GOALS: PrimaryGoal[] = [
  {
    id: 'grades',
    title: 'Straight A\'s',
    subtitle: 'Get an A in all subjects',
    icon: '📚',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    ringColor: '#3B82F6',
    progress: 0,
    milestones: [
      { label: 'AP World History', done: false },
      { label: 'Algebra 2', done: false },
      { label: 'Honors Bio 3', done: false },
      { label: 'English Honors', done: false },
      { label: 'AP CSP', done: false },
      { label: 'Español 2', done: false },
    ],
  },
  {
    id: 'ap_tests',
    title: 'AP Score: 5',
    subtitle: 'Get a 5 on both AP exams',
    icon: '🎯',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    ringColor: '#9333EA',
    progress: 0,
    milestones: [
      { label: 'AP World History practice tests', done: false },
      { label: 'AP CSP Create Task complete', done: false },
      { label: 'AP World History exam prep', done: false },
      { label: 'AP CSP exam prep', done: false },
    ],
  },
  {
    id: 'clubs',
    title: 'Club Leader',
    subtitle: 'Cyber, Robotics, Debate — clubs, research & classes',
    icon: '🚀',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    ringColor: '#D97706',
    progress: 0,
    milestones: [
      { label: 'FRC Troy Robotics — active member', done: true },
      { label: 'Troy Speech & Debate — competing', done: true },
      { label: 'Troy Cyber Basic Camp completed', done: true },
      { label: 'Take leadership role in a club', done: false },
      { label: 'Start a research project', done: false },
      { label: 'Enter a competition (GISTO, Crimson)', done: false },
    ],
  },
  {
    id: 'volleyball',
    title: 'Make JV',
    subtitle: '10 hrs/week volleyball to make JV team',
    icon: '🏐',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    ringColor: '#DB2777',
    progress: 0,
    milestones: [
      { label: 'Club volleyball — 4-5 hrs/week', done: true },
      { label: 'Open gym sessions', done: true },
      { label: 'Setting drills — 30 min daily', done: false },
      { label: 'Weekend clinics', done: false },
      { label: 'Film study — serve patterns', done: false },
      { label: 'Tryout prep conditioning', done: false },
    ],
  },
]

function ProgressRing({ progress, color, size = 80 }: { progress: number; color: string; size?: number }) {
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#f1f5f9"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
      />
    </svg>
  )
}

export function PrimaryGoals() {
  const [goals, setGoals] = useState<PrimaryGoal[]>(PRIMARY_GOALS)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Calculate progress from milestones
  useEffect(() => {
    setGoals((prev) =>
      prev.map((g) => ({
        ...g,
        progress: g.milestones.length > 0
          ? Math.round((g.milestones.filter((m) => m.done).length / g.milestones.length) * 100)
          : 0,
      }))
    )
  }, [])

  function toggleMilestone(goalId: string, milestoneIdx: number) {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g
        const milestones = [...g.milestones]
        milestones[milestoneIdx] = { ...milestones[milestoneIdx], done: !milestones[milestoneIdx].done }
        const progress = Math.round((milestones.filter((m) => m.done).length / milestones.length) * 100)
        return { ...g, milestones, progress }
      })
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Primary Goals
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {goals.map((goal) => (
          <Card
            key={goal.id}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              expandedId === goal.id && 'ring-1 ring-primary/20'
            )}
            onClick={() => setExpandedId(expandedId === goal.id ? null : goal.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Progress Ring */}
                <div className="relative flex-shrink-0">
                  <ProgressRing progress={goal.progress} color={goal.ringColor} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl">{goal.icon}</span>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className={cn('text-base font-bold', goal.color)}>{goal.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{goal.subtitle}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${goal.progress}%`, backgroundColor: goal.ringColor }}
                      />
                    </div>
                    <span className="text-xs font-bold" style={{ color: goal.ringColor }}>{goal.progress}%</span>
                  </div>
                </div>
              </div>

              {/* Expanded milestones */}
              {expandedId === goal.id && (
                <div className="mt-4 pt-3 border-t space-y-2 animate-fade-in-scale">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Milestones</p>
                  {goal.milestones.map((m, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); toggleMilestone(goal.id, idx) }}
                      className="flex items-center gap-2 w-full text-left py-1 group"
                    >
                      <div className={cn(
                        'h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                        m.done ? 'border-emerald-500 bg-emerald-500' : 'border-muted-foreground/30 group-hover:border-primary/50'
                      )}>
                        {m.done && (
                          <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={cn(
                        'text-xs transition-colors',
                        m.done ? 'text-muted-foreground line-through' : 'text-foreground'
                      )}>
                        {m.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
