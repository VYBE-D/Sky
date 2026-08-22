import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { metaGraph } from '@/lib/meta'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', request.url))
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  if (!code || !state) return NextResponse.redirect(new URL('/settings/integrations?facebook=error', request.url))
  const { data: stored } = await supabase.from('settings').select('value').eq('key', `meta_oauth_state:${user.id}`).maybeSingle()
  if (stored?.value !== state) return NextResponse.redirect(new URL('/settings/integrations?facebook=invalid_state', request.url))
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  const redirect = process.env.META_REDIRECT_URI
  if (!appId || !appSecret || !redirect) return NextResponse.redirect(new URL('/settings/integrations?facebook=not_configured', request.url))
  const tokenUrl = new URL('https://graph.facebook.com/v23.0/oauth/access_token')
  tokenUrl.searchParams.set('client_id', appId); tokenUrl.searchParams.set('client_secret', appSecret); tokenUrl.searchParams.set('redirect_uri', redirect); tokenUrl.searchParams.set('code', code)
  const tokenResponse = await fetch(tokenUrl, { cache: 'no-store' })
  const token = await tokenResponse.json()
  if (!tokenResponse.ok || !token.access_token) return NextResponse.redirect(new URL('/settings/integrations?facebook=error', request.url))
  const me = await metaGraph('/me?fields=id,name', token.access_token)
  const pages = await metaGraph('/me/accounts?fields=id,name,access_token,category,tasks', token.access_token)
  const { error } = await supabase.from('facebook_connections').upsert({ user_id: user.id, meta_user_id: me.id, encrypted_access_token: token.access_token, status: 'connected', last_sync_at: new Date().toISOString(), metadata: { name: me.name, expires_in: token.expires_in } }, { onConflict: 'user_id' })
  if (error) return NextResponse.redirect(new URL('/settings/integrations?facebook=save_error', request.url))
  for (const page of pages.data ?? []) {
    await supabase.from('facebook_pages').upsert({ user_id: user.id, facebook_page_id: page.id, name: page.name, category: page.category, encrypted_page_token: page.access_token, permissions: page.tasks ?? [] }, { onConflict: 'facebook_page_id' })
  }
  await supabase.from('settings').delete().eq('key', `meta_oauth_state:${user.id}`)
  return NextResponse.redirect(new URL('/settings/integrations?facebook=connected', request.url))
}
