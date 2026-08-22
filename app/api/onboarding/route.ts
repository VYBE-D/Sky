import { NextRequest, NextResponse } from 'next/server'
import { getCurrentWorkspace } from '@/lib/workspace'

const defaults = { auto_posting: false, auto_comments: false, auto_messages: false, approval_required: true, max_automated_replies_per_day: 10, min_relevance: 85, min_confidence: 85, person_cooldown_days: 7 }

export async function POST(req: NextRequest) {
  const { supabase, user, workspace } = await getCurrentWorkspace()
  if (!user || !workspace) return NextResponse.json({ error: 'Workspace is not configured' }, { status: 400 })
  const body = await req.json()
  const { data: profile, error: profileError } = await supabase.from('investment_profiles').upsert({ workspace_id: workspace.id, ...body.investmentProfile }, { onConflict: 'workspace_id' }).select().single()
  if (profileError) return NextResponse.json({ error: 'Could not save investment profile' }, { status: 500 })
  await supabase.from('settings').upsert({ workspace_id: workspace.id, key: 'automation', value: { ...defaults, ...(body.automation ?? {}) } }, { onConflict: 'workspace_id,key' })
  await supabase.from('settings').upsert({ workspace_id: workspace.id, key: 'onboarding', value: { completed: true, completed_at: new Date().toISOString() } }, { onConflict: 'workspace_id,key' })
  return NextResponse.json({ ok: true, profile })
}
