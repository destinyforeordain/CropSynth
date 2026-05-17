import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GovtSchemes from '@/components/GovtSchemes'

export default async function SchemesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <GovtSchemes />
}