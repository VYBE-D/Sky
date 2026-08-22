import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('workspaces').select('id').limit(1)
    if (error) return NextResponse.json({ ok: false, database: false }, { status: 503 })
    return NextResponse.json({ ok: true, database: true, timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ ok: false, database: false }, { status: 503 })
  }
}
