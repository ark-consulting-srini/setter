import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAchievements } from '@setter/shared/lib/achievements'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const unlocked = await checkAchievements(supabase, user.id)

  return NextResponse.json({ unlocked })
}
