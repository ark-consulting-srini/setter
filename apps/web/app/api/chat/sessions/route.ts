import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — list all chat sessions (with optional search)
export async function GET(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const search = url.searchParams.get('q')

  let query = supabase
    .from('chat_sessions')
    .select('id, title, subject, created_at, updated_at, messages')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Map sessions with preview and message count
  let sessions = (data ?? []).map((s) => {
    const msgs = (s.messages as { role: string; content: string }[]) ?? []
    const firstUserMsg = msgs.find((m) => m.role === 'user')
    return {
      id: s.id,
      title: s.title || firstUserMsg?.content?.slice(0, 60) || 'New conversation',
      subject: s.subject,
      messageCount: msgs.length,
      preview: firstUserMsg?.content?.slice(0, 100) || '',
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }
  })

  // Client-side search filter (simple substring match on title and preview)
  if (search) {
    const q = search.toLowerCase()
    sessions = sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.preview.toLowerCase().includes(q)
    )
  }

  return NextResponse.json({ sessions })
}

// PATCH — rename or update a session
export async function PATCH(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId, title, subject } = await req.json()
  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

  const updates: Record<string, string> = {}
  if (title !== undefined) updates.title = title
  if (subject !== undefined) updates.subject = subject

  const { error } = await supabase
    .from('chat_sessions')
    .update(updates)
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE — delete a session
export async function DELETE(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId } = await req.json()
  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
