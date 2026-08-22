import { NextRequest, NextResponse } from 'next/server'
import { getCurrentWorkspace } from '@/lib/workspace'
import { encryptSecret } from '@/lib/crypto'
import { metaGraph } from '@/lib/meta'

export async function GET(request: NextRequest) {
  const { supabase, workspace } = await getCurrentWorkspace()
  if (!workspace) return NextResponse.redirect(new URL('/login', request.url))
  const url = new URL(request.url); const code = url.searchParams.get('code'); const state = url.searchParams.get('state')
  if (!code || !state) return NextResponse.redirect(new URL('/settings/integrations?facebook=error', request.url))
  const { data: stored } = await supabase.from('settings').select('value').eq('workspace_id', workspace.id).eq('key', 'meta_oauth_state').maybeSingle()
  if (stored?.value?.state !== state) return NextResponse.redirect(new URL('/settings/integrations?facebook=invalid_state', request.url))
  const appId = process.env.META_APP_ID; const appSecret = process.env.META_APP_SECRET; const redirect = process.env.META_REDIRECT_URI
  if (!appId || !appSecret || !redirect) return NextResponse.redirect(new URL('/settings/integrations?facebook=not_configured', request.url))
  const tokenUrl = new URL('https://graph.facebook.com/v23.0/oauth/access_token'); tokenUrl.searchParams.set('client_id', appId); tokenUrl.searchParams.set('client_secret', appSecret); tokenUrl.searchParams.set('redirect_uri', redirect); tokenUrl.searchParams.set('code', code)
  const tokenResponse = await fetch(tokenUrl, { cache: 'no-store' }); const token = await tokenResponse.json()
  if (!tokenResponse.ok || !token.access_token) return NextResponse.redirect(new URL('/settings/integrations?facebook=error', request.url))
  const me = await metaGraph('/me?fields=id,name', token.access_token); const pages = await metaGraph('/me/accounts?fields=id,name,access_token,category,tasks', token.access_token)
  const { data: connection, error } = await supabase.from('facebook_connections').upsert({ workspace_id: workspace.id, provider: 'meta', account_name: me.name, status: 'connected', access_token_encrypted: encryptSecret(token.access_token), token_expires_at: token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null, permissions: pages.data?.map((p: any) => p.tasks ?? []) ?? [], last_sync: new Date().toISOString() }, { onConflict: 'workspace_id' }).select('id').single()
  if (error) return NextResponse.redirect(new URL('/settings/integrations?facebook=save_error', request.url))
  for (const page of pages.data ?? []) await supabase.from('facebook_pages').upsert({ workspace_id: workspace.id, connection_id: connection.id, page_id: page.id, name: page.name, category: page.category, page_access_token_encrypted: encryptSecret(page.access_token) }, { onConflict: 'workspace_id,page_id' })
  await supabase.from('settings').delete().eq('workspace_id', workspace.id).eq('key', 'meta_oauth_state')
  return NextResponse.redirect(new URL('/settings/integrations?facebook=connected', request.url))
}
