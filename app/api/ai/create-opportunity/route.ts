import { NextRequest, NextResponse } from 'next/server'
import { getCurrentWorkspace } from '@/lib/workspace'
import { AIService } from '@/lib/ai'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  const { supabase, user, workspace } = await getCurrentWorkspace()
  if (!user || !workspace) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { text, sourceId } = await req.json()
  if (!text) return NextResponse.json({ error: 'Text required' }, { status: 400 })
  const { data: key } = await supabase.from('settings').select('value').eq('workspace_id', workspace.id).eq('key', 'openai_api_key').maybeSingle()
  if (!key?.value) return NextResponse.json({ error: 'OpenAI not connected' }, { status: 400 })
  const ai = new AIService(new OpenAI({ apiKey: String(key.value) }), process.env.OPENAI_MODEL ?? 'gpt-5.6')
  const [entities, score] = await Promise.all([ai.extractEntities(text), ai.scoreOpportunity(text)])
  let e: Record<string, any> = {}; let s: Record<string, any> = {}
  try { e = JSON.parse(entities.output_text) } catch {}
  try { s = JSON.parse(score.output_text) } catch {}
  const { data: opportunity, error } = await supabase.from('opportunities').insert({ workspace_id: workspace.id, title: e.company ? `${e.company} investment opportunity` : 'New investment opportunity', industry: e.industry ?? null, stage: e.stage ?? null, funding_target: e.funding ?? null, location: e.location ?? null, score: s.score ?? 0, confidence: s.confidence ?? 0, investment_fit: s.investment_fit ?? null, founder_score: s.founder_score ?? null, market_score: s.market_score ?? null, traction_score: s.traction_score ?? null, timing_score: s.timing_score ?? null, source_confidence: s.source_confidence ?? null, status: 'new', why: s.why ?? null, risks: s.risks ?? null, next_step: s.next_step ?? null }) .select().single()
  if (error) return NextResponse.json({ error: 'Could not create opportunity' }, { status: 500 })
  await supabase.from('activity_logs').insert({ workspace_id: workspace.id, actor_type: 'ai', action: 'create_opportunity', entity_type: 'opportunity', entity_id: opportunity.id, result: { entities: e, score: s, sourceId } })
  return NextResponse.json(opportunity)
}
