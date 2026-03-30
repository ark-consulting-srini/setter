'use client'

import { useState, useEffect } from 'react'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getMotivation(): string {
  const messages = [
    "What's the plan today? You've got this.",
    "Small wins add up. What's first?",
    "One thing at a time. What matters most right now?",
    "You're building something amazing, one day at a time.",
    "Consistency beats intensity. What will you knock out today?",
    "Future you will thank present you. Let's go.",
    "Big goals, small steps. What's yours today?",
  ]
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  )
  return messages[dayOfYear % messages.length]
}

export function Greeting({ firstName }: { firstName: string }) {
  const [greeting, setGreeting] = useState('')
  const [motivation, setMotivation] = useState('')

  useEffect(() => {
    setGreeting(getGreeting())
    setMotivation(getMotivation())
  }, [])

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        {greeting ? `${greeting}, ${firstName}` : `Hey, ${firstName}`}
      </h1>
      <p className="text-sm text-muted-foreground mt-1 max-w-lg">
        {motivation}
      </p>
    </>
  )
}
