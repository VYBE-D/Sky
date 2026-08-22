import { NextRequest, NextResponse } from 'next/server'
import { getCurrentWorkspace } from '@/lib/workspace'
import { decryptSecret } from '@/lib/crypto'
import { metaGraph } from '@/lib/meta'

export async function POST(req: NextRequest) {
  const { supabase, user, workspace } = await getCurrentWorkspace()
  if (!user || !workspace) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { draftId, pageId, approvalId } = await req.json()
  const { data: draft } = await supabase.from('content_drafts').select('*').eq('id', draftId).eq('workspace_id', workspace.id).maybeSingle()
  const { data: page } = await supabase.from('facebook_pages').select('*').eq('id', pageId).eq('workspace_id', workspace.id).maybeSingle()
  if (!draft || !page?.page_access_token_encrypted) return NextResponse.json({ error: 'Draft or connected Page not found' }, { status: 404 })
  if (approvalId) {
    const { data: approval } = await supabase.from('approval_queue').select('*').eq('id', approvalId).eq('workspace_id', workspace.id).eq('status', 'approved').maybeSingle()
    if (!approval) return NextResponse.json({ error: 'Approval required' }, { status: 403 })
  } else {
    const { data: automation } = await supabase.from('settings').select('value').eq('workspace_id', workspace.id).eq('key', 'automation').maybeSingle()
    if (automation?.value?.auto_posting !== true) return NextResponse.json({ error: 'Approval required. Automatic publishing is disabled.' }, { status: 403 })
  }
  const result = await metaGraph(`/${page.page_id}/feed`, decryptSecret(page.page_access_token_encrypted), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: draft.body }) })
  await supabase.from('published_posts').insert({ workspace_id: workspace.id, draft_id: draft.id, external_id: result.id, published_at: new Date().toISOString() })
  await supabase.from('content_drafts').update({ status: 'published' }).eq('id', draft.id).eq('workspace_id', workspace.id)
  await supabase.from('activity_logs').insert({ workspace_id: workspace.id, actor_type: 'USER', action: 'Facebook post published', entity_type: 'content_draft', entity_id: draft.id, result: { externalId: result.id } })
  return NextResponse.json({ ok: true, id: result.id })
}
