import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AIService } from '@/lib/ai'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { text, sourceId } = await req.json(); if (!text) return NextResponse.json({ error: 'Text required' }, { status: 400 })
  const { data: key } = await supabase.from('settings').select('value').eq('key', 'openai_api_key').maybeSingle(); if (!key?.value) return NextResponse.json({ error: 'OpenAI not connected' }, { status: 400 })
  const ai = new AIService(new OpenAI({ apiKey: key.value }), 'gpt-5.6'); const entities = await ai.extractEntities(text); const score = await ai.scoreOpportunity(text)
  let e: any = {}, s: any = {}; try { e = JSON.parse(entities.output_text) } catch {} try { s = JSON.parse(score.output_text) } catch {}
  const { data: opportunity, error } = await supabase.from('opportunities').insert({ user_id: user.id, company_name: e.company ?? null, founder_name: e.person ?? null, industry: e.industry ?? null, stage: e.stage ?? null, funding_target: e.funding ?? null, location: e.location ?? null, score: s.score ?? 0, confidence: s.confidence ?? 0, status: 'new', source: 'facebook', metadata: { analysis: s, entities: e, sourceId } }).select().single()
  if (error) return NextResponse.json({ error: 'Could not create opportunity' }, { status: 500 })
  return NextResponse.json(opportunity)
}
