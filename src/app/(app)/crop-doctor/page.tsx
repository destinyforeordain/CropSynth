import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CropDoctorClient from './CropDoctorClient'

export default async function CropDoctorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <CropDoctorClient />
}