import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateAchievementRequest } from '@setter/shared/types'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('user_id', user.id)
    .order('achieved_at', { ascending: false })

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

  const body: CreateAchievementRequest = await req.json()

  const { data, error } = await supabase
    .from('achievements')
    .insert({
      user_id: user.id,
      title: body.title,
      description: body.description ?? null,
      category: body.category ?? 'personal',
      source: 'manual',
      achieved_at: body.achieved_at ?? new Date().toISOString().split('T')[0],
      is_portfolio_visible: body.is_portfolio_visible ?? false,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: { id: string; is_portfolio_visible: boolean } = await req.json()

  const { data, error } = await supabase
    .from('achievements')
    .update({ is_portfolio_visible: body.is_portfolio_visible })
    .eq('id', body.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
