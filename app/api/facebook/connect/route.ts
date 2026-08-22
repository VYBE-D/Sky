import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { metaLoginUrl } from '@/lib/meta'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const state = crypto.randomUUID()
  const { error } = await supabase.from('settings').upsert({ key: `meta_oauth_state:${user.id}`, value: state })
  if (error) return NextResponse.json({ error: 'Could not initialize Facebook connection' }, { status: 500 })
  return NextResponse.redirect(metaLoginUrl(state))
}
