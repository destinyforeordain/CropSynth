'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getFarmActivities(farmId: string, limit?: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  // Verify farm ownership
  const { data: farm, error: farmError } = await supabase
    .from('farms')
    .select('*')
    .eq('id', farmId)
    .eq('user_id', user.id)
    .single()

  if (farmError || !farm) {
    return []
  }

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('farm_id', farmId)
    .order('created_at', { ascending: false })
    .limit(limit || 50)

  if (error) {
    console.error('Database Error:', error)
    return []
  }

  return data || []
}

export async function getActivitiesByDateRange(farmId: string, startDate: string, endDate: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  // Verify farm ownership
  const { data: farm, error: farmError } = await supabase
    .from('farms')
    .select('*')
    .eq('id', farmId)
    .eq('user_id', user.id)
    .single()

  if (farmError || !farm) {
    return []
  }

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('farm_id', farmId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })

  if (error) {
    console.error('Database Error:', error)
    return []
  }

  return data || []
}

export async function addActivity(formData: {
  farmId: string
  activityType: 'sowing' | 'irrigation' | 'spraying' | 'harvesting' | 'weeding' | 'fertilizing'
  description: string
  cropName: string
  date: string
  voiceNoteUrl?: string
  images?: string[]
  metadata?: {
    duration?: number
    area?: number
    materials?: string[]
  }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  // Verify farm ownership
  const { data: farm, error: farmError } = await supabase
    .from('farms')
    .select('*')
    .eq('id', formData.farmId)
    .eq('user_id', user.id)
    .single()

  if (farmError || !farm) {
    throw new Error('Farm not found or access denied')
  }

  const { data, error } = await supabase
    .from('activities')
    .insert({
      farm_id: formData.farmId,
      activity_type: formData.activityType,
      description: formData.description,
      crop_name: formData.cropName,
      date: formData.date,
      voice_note_url: formData.voiceNoteUrl,
      images: formData.images,
      metadata: formData.metadata,
    })
    .select()
    .single()

  if (error) {
    console.error('Database Error:', error)
    throw new Error('Failed to add activity')
  }

  revalidatePath('/dashboard')
  return data
}

export async function updateActivity(activityId: string, updates: Partial<{
  description: string
  crop_name: string
  date: string
  voice_note_url: string
  images: string[]
  metadata: {
    duration?: number
    area?: number
    materials?: string[]
  }
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  // First get the activity to verify ownership
  const { data: activity, error: activityError } = await supabase
    .from('activities')
    .select('*, farms!inner(*)')
    .eq('id', activityId)
    .eq('farms.user_id', user.id)
    .single()

  if (activityError || !activity) {
    throw new Error('Activity not found or access denied')
  }

  // Remove undefined values
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined)
  )

  const { error } = await supabase
    .from('activities')
    .update(cleanUpdates)
    .eq('id', activityId)

  if (error) {
    console.error('Database Error:', error)
    throw new Error('Failed to update activity')
  }

  revalidatePath('/dashboard')
  return activityId
}

export async function deleteActivity(activityId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  // First get the activity to verify ownership
  const { data: activity, error: activityError } = await supabase
    .from('activities')
    .select('*, farms!inner(*)')
    .eq('id', activityId)
    .eq('farms.user_id', user.id)
    .single()

  if (activityError || !activity) {
    throw new Error('Activity not found or access denied')
  }

  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', activityId)

  if (error) {
    console.error('Database Error:', error)
    throw new Error('Failed to delete activity')
  }

  revalidatePath('/dashboard')
  return activityId
}

export async function getActivityStats(farmId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Verify farm ownership
  const { data: farm, error: farmError } = await supabase
    .from('farms')
    .select('*')
    .eq('id', farmId)
    .eq('user_id', user.id)
    .single()

  if (farmError || !farm) {
    return null
  }

  const { data: activities, error } = await supabase
    .from('activities')
    .select('*')
    .eq('farm_id', farmId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Database Error:', error)
    return null
  }

  // Group by activity type
  const activityCounts = (activities || []).reduce((acc, activity) => {
    acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Group by month
  const monthlyActivity = (activities || []).reduce((acc, activity) => {
    const month = activity.date.slice(0, 7) // YYYY-MM
    acc[month] = (acc[month] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    totalActivities: activities?.length || 0,
    activityCounts,
    monthlyActivity,
    recentActivities: activities?.slice(0, 10) || [],
  }
}