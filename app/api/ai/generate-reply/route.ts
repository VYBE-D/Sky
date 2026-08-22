import { NextRequest, NextResponse } from 'next/server'
import { getCurrentWorkspace } from '@/lib/workspace'
import { AIService } from '@/lib/ai'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  const { supabase, user, workspace } = await getCurrentWorkspace()
  if (!user || !workspace) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { commentId } = await req.json()
  const { data: comment } = await supabase.from('facebook_comments').select('*').eq('id', commentId).eq('workspace_id', workspace.id).maybeSingle()
  if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  const { data: key } = await supabase.from('settings').select('value').eq('workspace_id', workspace.id).eq('key', 'openai_api_key').maybeSingle()
  if (!key?.value) return NextResponse.json({ error: 'OpenAI not connected' }, { status: 400 })
  const ai = new AIService(new OpenAI({ apiKey: String(key.value) }), process.env.OPENAI_MODEL ?? 'gpt-5.6')
  const result = await ai.generateCommentReply(comment.content)
  const draft = result.output_text
  await supabase.from('facebook_comments').update({ reply_draft: draft }).eq('id', comment.id).eq('workspace_id', workspace.id)
  const { data: approval, error } = await supabase.from('approval_queue').insert({ workspace_id: workspace.id, entity_type: 'facebook_comment', entity_id: comment.id, status: 'pending', proposed_action: 'reply', reason: 'AI generated a selective reply for a relevant comment.', confidence: comment.confidence ?? 0, source: 'openai', metadata: { draft } }).select().single()
  if (error) return NextResponse.json({ error: 'Could not create approval item' }, { status: 500 })
  return NextResponse.json({ draft, approval })
}
