import { NextResponse } from 'next/server'
import { getCurrentWorkspace } from '@/lib/workspace'
import { metaLoginUrl } from '@/lib/meta'

export async function GET() {
  const { supabase, workspace } = await getCurrentWorkspace()
  if (!workspace) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const state = crypto.randomUUID()
  const { error } = await supabase.from('settings').upsert({ workspace_id: workspace.id, key: 'meta_oauth_state', value: { state } })
  if (error) return NextResponse.json({ error: 'Could not initialize Facebook connection' }, { status: 500 })
  return NextResponse.redirect(metaLoginUrl(state))
}
