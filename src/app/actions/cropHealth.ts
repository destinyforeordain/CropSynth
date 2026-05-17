'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getFarmHealthRecords(farmId: string, limit?: number) {
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
    .from('crop_health_records')
    .select('*')
    .eq('farm_id', farmId)
    .order('created_at', { ascending: false })
    .limit(limit || 20)

  if (error) {
    console.error('Database Error:', error)
    return []
  }

  return data || []
}

export async function getHealthRecordsByCrop(farmId: string, cropName: string) {
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
    .from('crop_health_records')
    .select('*')
    .eq('farm_id', farmId)
    .eq('crop_name', cropName)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Database Error:', error)
    return []
  }

  return data || []
}

export async function addHealthRecord(formData: {
  farmId: string
  cropName: string
  imageUrls: string[]
  aiDiagnosis?: {
    disease: string
    confidence: number
    description: string
    treatments: {
      organic: string[]
      chemical: string[]
      preventive: string[]
    }
    severity: 'low' | 'medium' | 'high'
  }
  symptoms?: string
  treatmentApplied?: string
  status: 'healthy' | 'diseased' | 'treated' | 'recovered'
  recordedDate: string
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
    .from('crop_health_records')
    .insert({
      farm_id: formData.farmId,
      crop_name: formData.cropName,
      image_urls: formData.imageUrls,
      ai_diagnosis: formData.aiDiagnosis,
      symptoms: formData.symptoms,
      treatment_applied: formData.treatmentApplied,
      status: formData.status,
      recorded_date: formData.recordedDate,
    })
    .select()
    .single()

  if (error) {
    console.error('Database Error:', error)
    throw new Error('Failed to add health record')
  }

  revalidatePath('/dashboard')
  return data
}

export async function updateHealthRecordStatus(recordId: string, status: 'healthy' | 'diseased' | 'treated' | 'recovered', treatmentApplied?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  // First get the record to verify ownership
  const { data: record, error: recordError } = await supabase
    .from('crop_health_records')
    .select('*, farms!inner(*)')
    .eq('id', recordId)
    .eq('farms.user_id', user.id)
    .single()

  if (recordError || !record) {
    throw new Error('Health record not found or access denied')
  }

  const updates: { status: string; treatment_applied?: string } = { status }
  if (treatmentApplied !== undefined) {
    updates.treatment_applied = treatmentApplied
  }

  const { error } = await supabase
    .from('crop_health_records')
    .update(updates)
    .eq('id', recordId)

  if (error) {
    console.error('Database Error:', error)
    throw new Error('Failed to update health record')
  }

  revalidatePath('/dashboard')
  return recordId
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function analyzeImages(_imageUrls: string[], _cropName: string, _symptoms?: string) {
  // This is a placeholder for AI image analysis
  // In production, you would integrate with services like:
  // - Google Cloud Vision API
  // - AWS Rekognition
  // - Custom ML models
  // - PlantNet API
  // - iNaturalist API

  // For demo purposes, return mock analysis
  const mockDiseases = [
    {
      disease: "Leaf Spot Disease",
      confidence: 0.85,
      description: "Common fungal infection affecting leaves, causing brown spots with yellow halos.",
      treatments: {
        organic: ["Neem oil spray", "Copper fungicide", "Remove affected leaves"],
        chemical: ["Mancozeb spray", "Propiconazole treatment"],
        preventive: ["Improve air circulation", "Avoid overhead watering", "Crop rotation"],
      },
      severity: "medium" as const,
    },
    {
      disease: "Powdery Mildew",
      confidence: 0.78,
      description: "Fungal disease causing white powdery coating on leaves and stems.",
      treatments: {
        organic: ["Baking soda spray", "Milk solution", "Neem oil"],
        chemical: ["Sulfur fungicide", "Myclobutanil"],
        preventive: ["Reduce humidity", "Increase air circulation", "Avoid overcrowding"],
      },
      severity: "low" as const,
    },
    {
      disease: "Bacterial Blight",
      confidence: 0.92,
      description: "Bacterial infection causing water-soaked lesions and yellowing.",
      treatments: {
        organic: ["Copper-based bactericide", "Remove infected parts"],
        chemical: ["Streptomycin spray", "Copper oxychloride"],
        preventive: ["Avoid overhead irrigation", "Use disease-free seeds", "Crop rotation"],
      },
      severity: "high" as const,
    },
  ];

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Return random diagnosis for demo
  const randomDiagnosis = mockDiseases[Math.floor(Math.random() * mockDiseases.length)];

  return {
    success: true,
    diagnosis: randomDiagnosis,
  };
}

export async function getHealthStats(farmId: string) {
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

  const { data: records, error } = await supabase
    .from('crop_health_records')
    .select('*')
    .eq('farm_id', farmId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Database Error:', error)
    return null
  }

  // Group by status
  const statusCounts = (records || []).reduce((acc, record) => {
    acc[record.status] = (acc[record.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Group by crop
  const cropCounts = (records || []).reduce((acc, record) => {
    acc[record.crop_name] = (acc[record.crop_name] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Recent issues
  const recentIssues = (records || [])
    .filter(r => r.status === "diseased" || r.status === "treated")
    .slice(0, 5)

  return {
    totalRecords: records?.length || 0,
    statusCounts,
    cropCounts,
    recentIssues,
    healthyPercentage: records && records.length > 0
      ? ((statusCounts.healthy || 0) + (statusCounts.recovered || 0)) / records.length * 100
      : 0,
  }
}