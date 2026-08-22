import { NextRequest, NextResponse } from 'next/server'
import { getCurrentWorkspace } from '@/lib/workspace'

export async function GET() {
  const { supabase, user, workspace } = await getCurrentWorkspace()
  if (!user || !workspace) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase.from('notifications').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false }).limit(50)
  if (error) return NextResponse.json({ error: 'Could not load notifications' }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const { supabase, user, workspace } = await getCurrentWorkspace()
  if (!user || !workspace) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  const { data, error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).eq('workspace_id', workspace.id).select().single()
  if (error) return NextResponse.json({ error: 'Could not update notification' }, { status: 500 })
  return NextResponse.json(data)
}
