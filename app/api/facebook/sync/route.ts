import { NextResponse } from 'next/server'
import { getCurrentWorkspace } from '@/lib/workspace'
import { decryptSecret } from '@/lib/crypto'
import { metaGraph } from '@/lib/meta'

export async function POST() {
  const { supabase, user, workspace } = await getCurrentWorkspace()
  if (!user || !workspace) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: connection } = await supabase.from('facebook_connections').select('*').eq('workspace_id', workspace.id).eq('status', 'connected').maybeSingle()
  if (!connection?.access_token_encrypted) return NextResponse.json({ error: 'Facebook not connected' }, { status: 400 })
  const token = decryptSecret(connection.access_token_encrypted)
  const { data: pages } = await supabase.from('facebook_pages').select('*').eq('workspace_id', workspace.id)
  let posts = 0, comments = 0
  for (const page of pages ?? []) {
    const feed = await metaGraph(`/${page.page_id}/feed?fields=id,message,created_time,permalink_url,from,comments.limit(100){id,message,created_time,from,permalink_url}`, token)
    for (const post of feed.data ?? []) {
      const { data: savedPost } = await supabase.from('facebook_posts').upsert({ workspace_id: workspace.id, page_id: page.id, external_id: post.id, content: post.message ?? '', author_name: post.from?.name ?? null, published_at: post.created_time, permalink: post.permalink_url ?? null }, { onConflict: 'workspace_id,external_id' }).select('id').single()
      posts++
      for (const comment of post.comments?.data ?? []) {
        await supabase.from('facebook_comments').upsert({ workspace_id: workspace.id, post_id: savedPost?.id, external_id: comment.id, content: comment.message ?? '', author_name: comment.from?.name ?? null, created_at: comment.created_time }, { onConflict: 'workspace_id,external_id' })
        comments++
      }
    }
  }
  await supabase.from('facebook_connections').update({ last_sync: new Date().toISOString() }).eq('id', connection.id)
  await supabase.from('activity_logs').insert({ workspace_id: workspace.id, actor_type: 'USER', action: 'Facebook sync', result: { posts, comments } })
  return NextResponse.json({ ok: true, posts, comments })
}
