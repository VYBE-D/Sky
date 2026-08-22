import { NextRequest, NextResponse } from 'next/server'
import { getCurrentWorkspace } from '@/lib/workspace'

export async function GET() {
  const { supabase, user, workspace } = await getCurrentWorkspace()
  if (!user || !workspace) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase.from('approval_queue').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false }).limit(100)
  if (error) return NextResponse.json({ error: 'Could not load approvals' }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const { supabase, user, workspace } = await getCurrentWorkspace()
  if (!user || !workspace) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, action } = await req.json()
  if (!id || !['approved', 'rejected'].includes(action)) return NextResponse.json({ error: 'Invalid approval action' }, { status: 400 })
  const { data, error } = await supabase.from('approval_queue').update({ status: action, reviewed_at: new Date().toISOString() }).eq('id', id).eq('workspace_id', workspace.id).select().single()
  if (error) return NextResponse.json({ error: 'Approval update failed' }, { status: 500 })
  await supabase.from('activity_logs').insert({ workspace_id: workspace.id, actor_type: 'user', action: `approval_${action}`, entity_type: 'approval', entity_id: id, result: { status: action } })
  return NextResponse.json(data)
}
