import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { metaGraph } from '@/lib/meta'

export async function POST(req: NextRequest) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { approvalId } = await req.json(); const { data: approval } = await supabase.from('approval_queue').select('*').eq('id', approvalId).maybeSingle(); if (!approval || approval.status !== 'approved') return NextResponse.json({ error: 'Approval required' }, { status: 403 })
  const comment = approval.payload.comment; const draft = approval.payload.draft; const { data: page } = await supabase.from('facebook_pages').select('*').eq('user_id', user.id).limit(1).maybeSingle(); if (!page) return NextResponse.json({ error: 'Facebook page not connected' }, { status: 400 })
  const result = await metaGraph(`/${comment.facebook_comment_id}/comments`, page.encrypted_page_token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: draft }) })
  await supabase.from('approval_queue').update({ status: 'completed', result }).eq('id', approvalId)
  return NextResponse.json({ ok: true, id: result.id })
}
