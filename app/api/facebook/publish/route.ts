import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { metaGraph } from '@/lib/meta'

export async function POST(req: NextRequest) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { draftId, pageId } = await req.json(); const { data: draft } = await supabase.from('content_drafts').select('*').eq('id', draftId).maybeSingle(); const { data: page } = await supabase.from('facebook_pages').select('*').eq('id', pageId).maybeSingle()
  if (!draft || !page) return NextResponse.json({ error: 'Draft or page not found' }, { status: 404 })
  const { data: settings } = await supabase.from('settings').select('value').eq('key', 'automation').maybeSingle(); const automation = settings?.value ?? {}; if (automation.auto_posting !== true) return NextResponse.json({ error: 'Automatic publishing is disabled. Approve the post explicitly first.' }, { status: 403 })
  const result = await metaGraph(`/${page.facebook_page_id}/feed`, page.encrypted_page_token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: draft.content }) })
  await supabase.from('published_posts').insert({ user_id: user.id, content_draft_id: draft.id, facebook_page_id: page.id, facebook_post_id: result.id, published_at: new Date().toISOString(), status: 'published' })
  await supabase.from('content_drafts').update({ status: 'published' }).eq('id', draft.id)
  return NextResponse.json({ ok: true, id: result.id })
}
