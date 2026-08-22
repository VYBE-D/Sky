import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar, Topbar } from '@/components/shell'
export default async function AppLayout({children}:{children:React.ReactNode}){const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect('/login'); return <div className="app"><Sidebar/><main><Topbar/><section className="page">{children}</section></main></div>}
