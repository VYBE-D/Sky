import { NextResponse } from 'next/server'
import { getCurrentWorkspace } from '@/lib/workspace'
import OpenAI from 'openai'
import { AIService } from '@/lib/ai'

export async function POST() {
  const { supabase, user, workspace } = await getCurrentWorkspace()
  if (!user || !workspace) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [{ data: opportunities }, { data: approvals }, { data: tasks }, { data: research }] = await Promise.all([
    supabase.from('opportunities').select('*').eq('workspace_id', workspace.id).order('score', { ascending: false }).limit(10),
    supabase.from('approval_queue').select('*').eq('workspace_id', workspace.id).eq('status', 'pending').limit(10),
    supabase.from('tasks').select('*').eq('workspace_id', workspace.id).neq('status', 'completed').order('due_at', { ascending: true }).limit(10),
    supabase.from('research_items').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false }).limit(10),
  ])
  const { data: key } = await supabase.from('settings').select('value').eq('workspace_id', workspace.id).eq('key', 'openai_api_key').maybeSingle()
  if (!key?.value) return NextResponse.json({ error: 'OpenAI not connected' }, { status: 400 })
  const ai = new AIService(new OpenAI({ apiKey: String(key.value) }), 'gpt-5.6')
  const result = await ai.generateDailyBriefing(JSON.stringify({ opportunities, approvals, tasks, research }))
  const briefing = result.output_text
  await supabase.from('notifications').insert({ workspace_id: workspace.id, title: 'Daily briefing ready', body: briefing, type: 'daily_briefing' })
  await supabase.from('activity_logs').insert({ workspace_id: workspace.id, actor_type: 'ai', action: 'generate_daily_briefing', result: { briefing } })
  return NextResponse.json({ briefing })
}
