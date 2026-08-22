import { createClient } from '@/lib/supabase/server'

export async function getCurrentWorkspace() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, workspace: null }
  const { data: membership } = await supabase.from('workspace_members').select('workspace_id, role, workspaces(*)').eq('user_id', user.id).limit(1).maybeSingle()
  return { supabase, user, workspace: membership?.workspaces ?? null }
}
