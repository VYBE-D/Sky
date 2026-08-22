import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { metaGraph } from '@/lib/meta'

export async function GET() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: pages } = await supabase.from('facebook_pages').select('*').eq('user_id', user.id); const messages: unknown[] = []
  for (const page of pages ?? []) { try { const result = await metaGraph(`/${page.facebook_page_id}/conversations?fields=id,updated_time,participants,messages.limit(50){id,message,from,to,created_time}`, page.encrypted_page_token); messages.push(...(result.data ?? [])) } catch { /* Meta may not expose messaging for this asset */ } }
  return NextResponse.json({ supported: messages.length > 0, messages })
}
