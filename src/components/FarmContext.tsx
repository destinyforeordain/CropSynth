'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface Farm {
  id: string
  farm_name: string
  location: {
    village: string
    district: string
  }
  land_size_acres: number
  soil_type?: string
  irrigation_type?: string
  primary_crops: string[]
}

interface FarmContextType {
  farms: Farm[]
  selectedFarm: Farm | null
  selectedFarmId: string | null
  setSelectedFarmId: (farmId: string) => void
  loading: boolean
  refreshFarms: (selectFarmId?: string) => Promise<void>
}

const FarmContext = createContext<FarmContextType | undefined>(undefined)

export function FarmProvider({ children, user }: { children: ReactNode; user: User }) {
  const [farms, setFarms] = useState<Farm[]>([])
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const selectedFarm = farms.find(farm => farm.id === selectedFarmId) || null

  const refreshFarms = useCallback(async (selectFarmId?: string) => {
    console.log('refreshFarms called with selectFarmId:', selectFarmId)
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .eq('user_id', user.id)

      if (error) {
        console.error('Error fetching farms:', error)
        return
      }

      const userFarms = data || []
      console.log('Fetched farms:', userFarms)
      setFarms(userFarms)

      // Set selected farm - use the provided selectFarmId or current selectedFarmId
      const farmToSelect = selectFarmId || selectedFarmId
      if (farmToSelect && userFarms.find(farm => farm.id === farmToSelect)) {
        console.log('Setting selected farm to:', farmToSelect)
        setSelectedFarmId(farmToSelect)
      } else if (!selectedFarmId && userFarms.length > 0) {
        console.log('Setting default selected farm to:', userFarms[0].id)
        setSelectedFarmId(userFarms[0].id)
      }
    } catch (error) {
      console.error('Failed to refresh farms:', error)
    } finally {
      setLoading(false)
    }
  }, [user.id, supabase, selectedFarmId])

  useEffect(() => {
    refreshFarms()
  }, [refreshFarms])

  const value: FarmContextType = {
    farms,
    selectedFarm,
    selectedFarmId,
    setSelectedFarmId,
    loading,
    refreshFarms,
  }

  return (
    <FarmContext.Provider value={value}>
      {children}
    </FarmContext.Provider>
  )
}

export function useFarm() {
  const context = useContext(FarmContext)
  if (context === undefined) {
    throw new Error('useFarm must be used within a FarmProvider')
  }
  return context
}