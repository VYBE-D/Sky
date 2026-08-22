import { createClient } from '@/lib/supabase/server'

const META_GRAPH = 'https://graph.facebook.com/v23.0'

export async function getMetaConnection() {
  const supabase = await createClient()
  const { data } = await supabase.from('facebook_connections').select('*').maybeSingle()
  return data
}

export function metaLoginUrl(state: string) {
  const appId = process.env.META_APP_ID
  const redirect = process.env.META_REDIRECT_URI
  if (!appId || !redirect) throw new Error('Meta integration is not configured')
  const scopes = ['pages_show_list','pages_read_engagement','pages_manage_posts','pages_manage_engagement','read_insights'].join(',')
  return `https://www.facebook.com/v23.0/dialog/oauth?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(redirect)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scopes)}`
}

export async function metaGraph(path: string, accessToken: string, init?: RequestInit) {
  const url = new URL(`${META_GRAPH}${path}`)
  url.searchParams.set('access_token', accessToken)
  const response = await fetch(url, { ...init, cache: 'no-store' })
  const json = await response.json()
  if (!response.ok || json.error) throw new Error(json.error?.message || 'Meta API request failed')
  return json
}
