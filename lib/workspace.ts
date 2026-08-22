import { createClient } from '@/lib/supabase/server'

export async function getCurrentWorkspace() {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user as { id: string; email?: string | null } | null
  if (!user) return { supabase, user: null, workspace: null }

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(*)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const row = (Array.isArray(membership) ? membership[0] : membership) as
    | { workspace_id: string; role: string; workspaces?: unknown }
    | null
    | undefined

  const workspace = (Array.isArray(row?.workspaces) ? row?.workspaces[0] : row?.workspaces) as
    | { id: string; name?: string; slug?: string }
    | null
    | undefined

  return { supabase, user, workspace: workspace ?? null }
}
