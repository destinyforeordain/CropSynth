import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CropBotClient from './CropBotClient'

export default async function CropBotPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <CropBotClient />
}