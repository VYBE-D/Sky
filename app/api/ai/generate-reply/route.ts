import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AIService } from '@/lib/ai'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { commentId } = await req.json(); const { data: comment } = await supabase.from('facebook_comments').select('*').eq('id', commentId).maybeSingle(); if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  const { data: key } = await supabase.from('settings').select('value').eq('key', 'openai_api_key').maybeSingle(); if (!key?.value) return NextResponse.json({ error: 'OpenAI not connected' }, { status: 400 })
  const ai = new AIService(new OpenAI({ apiKey: key.value }), 'gpt-5.6'); const result = await ai.generateCommentReply(comment.message); const draft = result.output_text
  const { data: approval } = await supabase.from('approval_queue').insert({ user_id: user.id, type: 'comment', entity_id: comment.id, status: 'pending', proposed_action: 'reply', payload: { comment, draft }, confidence: comment.ai_confidence ?? 0 }).select().single()
  return NextResponse.json({ draft, approval })
}
