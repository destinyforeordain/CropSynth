'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const FarmSchema = z.object({
  farm_name: z.string().min(3, 'Farm name must be at least 3 characters'),
  land_size_acres: z.coerce.number().min(0.1, 'Land size must be at least 0.1 acres'),
  soil_type: z.string().optional(),
  irrigation_type: z.string().optional(),
  primary_crops: z.string().optional(),
  district: z.string().min(1, 'District is required'),
  village: z.string().min(1, 'Village is required'),
})

export type FormState = {
  message: string;
  errors?: Record<string, string[] | undefined>;
  farmId?: string;
}

export async function createFarm(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { message: 'Authentication error', errors: { auth: ['User not found'] } }
  }

  const validatedFields = FarmSchema.safeParse({
    farm_name: formData.get('farm_name'),
    land_size_acres: formData.get('land_size_acres'),
    soil_type: formData.get('soil_type'),
    irrigation_type: formData.get('irrigation_type'),
    primary_crops: formData.get('primary_crops'),
    district: formData.get('district'),
    village: formData.get('village'),
  })

  if (!validatedFields.success) {
    console.error('Validation failed:', validatedFields.error.flatten().fieldErrors)
    return {
      message: 'Validation failed',
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { farm_name, land_size_acres, soil_type, irrigation_type, primary_crops, district, village } = validatedFields.data

  console.log('Creating farm with data:', { farm_name, land_size_acres, soil_type, irrigation_type, primary_crops, district, village })

  const { data, error } = await supabase.from('farms').insert({
    user_id: user.id,
    farm_name,
    land_size_acres,
    soil_type,
    irrigation_type,
    primary_crops: primary_crops ? primary_crops.split(',').map(s => s.trim()) : [],
    location: { district, village },
  }).select().single()

  if (error) {
    console.error('Database Error:', error)
    return { message: 'Database error: Could not create farm.', errors: { db: [error.message] } }
  }

  console.log('Farm created successfully:', data)
  // Note: Removed revalidatePath as it might interfere with client-side state updates
  return { message: 'Farm created successfully!', farmId: data.id }
}

export async function getUserFarms() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('farms')
    .select('*')
    .eq('user_id', user.id)

  if (error) {
    console.error('Database Error:', error)
    return []
  }

  return data || []
}

export async function getFarm(farmId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('farms')
    .select('*')
    .eq('id', farmId)
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('Database Error:', error)
    return null
  }

  return data
}

export async function updateFarm(farmId: string, updates: Partial<{
  farm_name: string
  location: { district: string; village: string; coordinates?: { lat: number; lng: number } }
  land_size_acres: number
  soil_type: string
  irrigation_type: string
  primary_crops: string[]
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  // First check if farm exists and belongs to user
  const { data: existingFarm, error: fetchError } = await supabase
    .from('farms')
    .select('*')
    .eq('id', farmId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !existingFarm) {
    throw new Error('Farm not found or access denied')
  }

  // Remove undefined values
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined)
  )

  const { error } = await supabase
    .from('farms')
    .update(cleanUpdates)
    .eq('id', farmId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Database Error:', error)
    throw new Error('Failed to update farm')
  }

  revalidatePath('/dashboard')
  return farmId
}

export async function getFarmStats(farmId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Check if farm belongs to user
  const { data: farm, error: farmError } = await supabase
    .from('farms')
    .select('*')
    .eq('id', farmId)
    .eq('user_id', user.id)
    .single()

  if (farmError || !farm) {
    return null
  }

  // Get recent activities count
  const { data: activities, error: activitiesError } = await supabase
    .from('activities')
    .select('*')
    .eq('farm_id', farmId)

  if (activitiesError) {
    console.error('Activities Error:', activitiesError)
  }

  // Get total expenses this month
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('*')
    .eq('farm_id', farmId)
    .gte('date', `${currentMonth}-01`)

  if (expensesError) {
    console.error('Expenses Error:', expensesError)
  }

  const totalExpenses = expenses?.reduce((sum, expense) => sum + (expense.cost || 0), 0) || 0

  // Get crop health records
  const { data: healthRecords, error: healthError } = await supabase
    .from('crop_health_records')
    .select('*')
    .eq('farm_id', farmId)

  if (healthError) {
    console.error('Health Records Error:', healthError)
  }

  return {
    totalActivities: activities?.length || 0,
    monthlyExpenses: totalExpenses,
    healthRecords: healthRecords?.length || 0,
    recentActivities: activities?.slice(-5) || [],
  }
}
