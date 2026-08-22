import { NextRequest, NextResponse } from 'next/server'
import { getCurrentWorkspace } from '@/lib/workspace'

export async function GET() {
  const { supabase, user, workspace } = await getCurrentWorkspace()
  if (!user || !workspace) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase.from('automation_rules').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: 'Could not load automation rules' }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { supabase, user, workspace } = await getCurrentWorkspace()
  if (!user || !workspace) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const rule = { workspace_id: workspace.id, name: body.name, enabled: body.enabled ?? false, trigger: body.trigger ?? {}, conditions: body.conditions ?? {}, actions: body.actions ?? {}, limits: body.limits ?? { max_per_day: 10 }, cooldown_minutes: body.cooldown_minutes ?? 10080, approval_required: body.approval_required ?? true }
  if (!rule.name) return NextResponse.json({ error: 'Rule name required' }, { status: 400 })
  const { data, error } = await supabase.from('automation_rules').insert(rule).select().single()
  if (error) return NextResponse.json({ error: 'Could not create automation rule' }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const { supabase, user, workspace } = await getCurrentWorkspace()
  if (!user || !workspace) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, ...changes } = await req.json()
  if (!id) return NextResponse.json({ error: 'Rule id required' }, { status: 400 })
  const { data, error } = await supabase.from('automation_rules').update(changes).eq('id', id).eq('workspace_id', workspace.id).select().single()
  if (error) return NextResponse.json({ error: 'Could not update automation rule' }, { status: 500 })
  return NextResponse.json(data)
}
