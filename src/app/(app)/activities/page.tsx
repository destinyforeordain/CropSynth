import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ActivitiesClient from './ActivitiesClient'

export default async function ActivitiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <ActivitiesClient />
}