import { NextRequest, NextResponse } from 'next/server'
import { getCurrentWorkspace } from '@/lib/workspace'
import { decryptSecret } from '@/lib/crypto'
import { metaGraph } from '@/lib/meta'

export async function POST(req: NextRequest) {
  const { supabase, user, workspace } = await getCurrentWorkspace()
  if (!user || !workspace) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { approvalId } = await req.json()
  const { data: approval } = await supabase.from('approval_queue').select('*').eq('id', approvalId).eq('workspace_id', workspace.id).maybeSingle()
  if (!approval || approval.status !== 'approved' || approval.entity_type !== 'facebook_comment') return NextResponse.json({ error: 'Approval required' }, { status: 403 })
  const draft = approval.metadata?.draft
  const { data: page } = await supabase.from('facebook_pages').select('*').eq('workspace_id', workspace.id).limit(1).maybeSingle()
  if (!page?.page_access_token_encrypted) return NextResponse.json({ error: 'Facebook Page not connected' }, { status: 400 })
  const result = await metaGraph(`/${approval.entity_id}/comments`, decryptSecret(page.page_access_token_encrypted), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: draft }) })
  await supabase.from('approval_queue').update({ status: 'completed', reviewed_at: new Date().toISOString(), metadata: { ...approval.metadata, result } }).eq('id', approvalId).eq('workspace_id', workspace.id)
  await supabase.from('facebook_comments').update({ replied_at: new Date().toISOString() }).eq('id', approval.entity_id).eq('workspace_id', workspace.id)
  return NextResponse.json({ ok: true, id: result.id })
}
