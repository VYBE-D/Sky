import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { metaGraph } from '@/lib/meta'

export async function POST() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: pages } = await supabase.from('facebook_pages').select('*').eq('user_id', user.id)
  let posts = 0, comments = 0
  for (const page of pages ?? []) {
    const feed = await metaGraph(`/${page.facebook_page_id}/feed?fields=id,message,created_time,permalink_url,from,comments.limit(100).summary(true){id,message,created_time,from,permalink_url}`, page.encrypted_page_token)
    for (const post of feed.data ?? []) {
      await supabase.from('facebook_posts').upsert({ user_id: user.id, facebook_page_id: page.id, facebook_post_id: post.id, message: post.message ?? '', author: post.from ?? null, created_at: post.created_time, permalink_url: post.permalink_url, raw: post }, { onConflict: 'facebook_post_id' }); posts++
      for (const comment of post.comments?.data ?? []) {
        await supabase.from('facebook_comments').upsert({ user_id: user.id, facebook_post_id: post.id, facebook_comment_id: comment.id, message: comment.message ?? '', author: comment.from ?? null, created_at: comment.created_time, permalink_url: comment.permalink_url, raw: comment }, { onConflict: 'facebook_comment_id' }); comments++
      }
    }
  }
  await supabase.from('facebook_connections').update({ last_sync_at: new Date().toISOString() }).eq('user_id', user.id)
  return NextResponse.json({ ok: true, posts, comments })
}
