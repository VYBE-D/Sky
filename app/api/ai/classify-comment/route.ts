import { NextRequest, NextResponse } from 'next/server'
import { getCurrentWorkspace } from '@/lib/workspace'
import { AIService } from '@/lib/ai'
import OpenAI from 'openai'

type Classification = { classification: string; confidence: number; signals: string[]; entities: Record<string, unknown> }

export async function POST(req: NextRequest) {
  const { supabase, user, workspace } = await getCurrentWorkspace()
  if (!user || !workspace) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { commentId } = await req.json()
  const { data: comment } = await supabase.from('facebook_comments').select('*').eq('id', commentId).eq('workspace_id', workspace.id).maybeSingle()
  if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  const { data: key } = await supabase.from('settings').select('value').eq('workspace_id', workspace.id).eq('key', 'openai_api_key').maybeSingle()
  if (!key?.value) return NextResponse.json({ error: 'OpenAI not connected' }, { status: 400 })
  const ai = new AIService(new OpenAI({ apiKey: String(key.value) }), process.env.OPENAI_MODEL ?? 'gpt-5.6')
  const result = await ai.classifyComment(comment.content)
  let parsed: Classification
  try { parsed = JSON.parse(result.output_text) as Classification } catch { parsed = { classification: 'unknown', confidence: 0, signals: [], entities: {} } }
  await supabase.from('facebook_comments').update({ classification: parsed.classification, confidence: parsed.confidence, investment_signals: { signals: parsed.signals, entities: parsed.entities } }).eq('id', commentId).eq('workspace_id', workspace.id)
  return NextResponse.json(parsed)
}
