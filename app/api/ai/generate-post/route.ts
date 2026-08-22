import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AIService } from '@/lib/ai'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const input = await req.json(); const { data: key } = await supabase.from('settings').select('value').eq('key', 'openai_api_key').maybeSingle(); if (!key?.value) return NextResponse.json({ error: 'OpenAI not connected' }, { status: 400 })
  const ai = new AIService(new OpenAI({ apiKey: key.value }), 'gpt-5.6'); const result = await ai.generatePost(JSON.stringify(input)); const draft = result.output_text
  const { data, error } = await supabase.from('content_drafts').insert({ user_id: user.id, content: draft, status: 'draft', metadata: { input } }).select().single()
  if (error) return NextResponse.json({ error: 'Could not save draft' }, { status: 500 }); return NextResponse.json(data)
}
