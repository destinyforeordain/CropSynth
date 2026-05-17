import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WeatherClient from './WeatherClient'

export default async function WeatherPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <WeatherClient />
}