import { NextRequest, NextResponse } from 'next/server'
import { getCurrentWorkspace } from '@/lib/workspace'

export async function POST(req: NextRequest) {
  const { supabase, user, workspace } = await getCurrentWorkspace()
  if (!user || !workspace) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { draftId, scheduledAt } = await req.json()
  if (!draftId || !scheduledAt || new Date(scheduledAt).getTime() <= Date.now()) return NextResponse.json({ error: 'A future scheduled time is required' }, { status: 400 })
  const { data: draft } = await supabase.from('content_drafts').select('*').eq('id', draftId).eq('workspace_id', workspace.id).maybeSingle()
  if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
  const { data, error } = await supabase.from('scheduled_posts').insert({ workspace_id: workspace.id, draft_id: draftId, scheduled_at: scheduledAt, status: 'scheduled' }).select().single()
  if (error) return NextResponse.json({ error: 'Could not schedule post' }, { status: 500 })
  await supabase.from('content_drafts').update({ status: 'scheduled', scheduled_at: scheduledAt }).eq('id', draftId).eq('workspace_id', workspace.id)
  await supabase.from('activity_logs').insert({ workspace_id: workspace.id, actor_type: 'user', action: 'schedule_post', entity_type: 'content_draft', entity_id: draftId, result: { scheduledAt } })
  return NextResponse.json(data)
}
