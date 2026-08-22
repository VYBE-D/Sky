import { NextRequest, NextResponse } from 'next/server'
import { getCurrentWorkspace } from '@/lib/workspace'
import { AIService } from '@/lib/ai'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  const { supabase, user, workspace } = await getCurrentWorkspace()
  if (!user || !workspace) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const input = await req.json()
  const { data: key } = await supabase.from('settings').select('value').eq('workspace_id', workspace.id).eq('key', 'openai_api_key').maybeSingle()
  if (!key?.value) return NextResponse.json({ error: 'OpenAI not connected' }, { status: 400 })
  const ai = new AIService(new OpenAI({ apiKey: String(key.value) }), process.env.OPENAI_MODEL ?? 'gpt-5.6')
  const result = await ai.generatePost(JSON.stringify(input))
  const { data, error } = await supabase.from('content_drafts').insert({ workspace_id: workspace.id, title: input.topic ?? 'AI Draft', body: result.output_text, source: input.source ?? 'ai', ai_confidence: 0, status: 'draft' }).select().single()
  if (error) return NextResponse.json({ error: 'Could not save draft' }, { status: 500 })
  return NextResponse.json(data)
}
