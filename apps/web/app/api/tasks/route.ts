import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateTaskRequest } from '@setter/shared/types'

export async function GET(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const category = searchParams.get('category')
  const dueDate = searchParams.get('due_date')

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }
  if (category) {
    query = query.eq('category', category)
  }
  if (dueDate) {
    query = query.eq('due_date', dueDate)
  }

  const { data, error } = await query

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

  const body: CreateTaskRequest = await req.json()

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      title: body.title,
      description: body.description ?? null,
      category: body.category ?? 'school',
      priority: body.priority ?? 'medium',
      status: 'pending',
      due_date: body.due_date ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
