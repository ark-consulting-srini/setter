import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateGoalRequest } from '@setter/shared/types'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: CreateGoalRequest = await req.json()

  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: user.id,
      title: body.title,
      description: body.description ?? null,
      goal_type: body.goal_type ?? 'personal',
      status: 'active',
      target_date: body.target_date ?? null,
      progress_pct: 0,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
