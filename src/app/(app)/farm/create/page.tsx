'use client'

import { useState } from 'react'
import { createFarm, type FormState } from '@/app/actions/farm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useFarm } from '@/components/FarmContext'
import { useRouter } from 'next/navigation'
import TranslatableText from '@/components/TranslatableText'

export default function CreateFarmPage() {
  const [state, setState] = useState<FormState>({ message: '', errors: {} })
  const [pending, setPending] = useState(false)
  const [formData, setFormData] = useState({
    farm_name: '',
    land_size_acres: '',
    soil_type: '',
    irrigation_type: '',
    primary_crops: '',
    district: '',
    village: '',
  })
  const { refreshFarms } = useFarm()
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState({ message: '', errors: {} })
    setPending(true)

    try {
      const submitFormData = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value.trim()) {
          submitFormData.append(key, value.trim())
        }
      })

      console.log('Submitting form data:', Object.fromEntries(submitFormData))

      const result = await createFarm(state, submitFormData)
      console.log('Create farm result:', result)
      setState(result)

      if (result.farmId) {
        console.log('Farm created successfully with ID:', result.farmId)
        await refreshFarms(result.farmId)
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error creating farm:', error)
      setState({ message: 'An unexpected error occurred.', errors: {} })
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle><TranslatableText text="Create Your Farm Profile" /></CardTitle>
          <CardDescription>
            <TranslatableText text="Provide some basic details about your farm to get started." />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="farm_name"><TranslatableText text="Farm Name" /> *</Label>
              <Input
                id="farm_name"
                name="farm_name"
                required
                placeholder="e.g., Ravi's Farm"
                value={formData.farm_name}
                onChange={(e) => handleInputChange('farm_name', e.target.value)}
              />
              {state.errors?.farm_name && <p className="text-sm text-red-500 mt-1">{state.errors.farm_name.join(', ')}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="land_size_acres"><TranslatableText text="Land Size (in acres)" /> *</Label>
              <Input
                id="land_size_acres"
                name="land_size_acres"
                type="number"
                step="0.1"
                required
                placeholder="e.g., 1.5"
                value={formData.land_size_acres}
                onChange={(e) => handleInputChange('land_size_acres', e.target.value)}
              />
              {state.errors?.land_size_acres && <p className="text-sm text-red-500 mt-1">{state.errors.land_size_acres.join(', ')}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="soil_type"><TranslatableText text="Soil Type" /></Label>
              <Select value={formData.soil_type} onValueChange={(value) => handleInputChange('soil_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a soil type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="loamy">Loamy</SelectItem>
                  <SelectItem value="sandy">Sandy</SelectItem>
                  <SelectItem value="clay">Clay</SelectItem>
                  <SelectItem value="silty">Silty</SelectItem>
                  <SelectItem value="peaty">Peaty</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="irrigation_type"><TranslatableText text="Irrigation Type" /></Label>
              <Select value={formData.irrigation_type} onValueChange={(value) => handleInputChange('irrigation_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an irrigation type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="drip">Drip Irrigation</SelectItem>
                  <SelectItem value="sprinkler">Sprinkler Irrigation</SelectItem>
                  <SelectItem value="surface">Surface Irrigation</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="rain-fed">Rain-fed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary_crops"><TranslatableText text="Primary Crops (comma-separated)" /></Label>
              <Input
                id="primary_crops"
                name="primary_crops"
                placeholder="e.g., Rice, Brinjal, Okra"
                value={formData.primary_crops}
                onChange={(e) => handleInputChange('primary_crops', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="district"><TranslatableText text="District" /> *</Label>
              <Input
                id="district"
                name="district"
                required
                placeholder="e.g., Krishna"
                value={formData.district}
                onChange={(e) => handleInputChange('district', e.target.value)}
              />
              {state.errors?.district && <p className="text-sm text-red-500 mt-1">{state.errors.district.join(', ')}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="village"><TranslatableText text="Village" /> *</Label>
              <Input
                id="village"
                name="village"
                required
                placeholder="e.g., Vijayawada"
                value={formData.village}
                onChange={(e) => handleInputChange('village', e.target.value)}
              />
              {state.errors?.village && <p className="text-sm text-red-500 mt-1">{state.errors.village.join(', ')}</p>}
            </div>

            <Button type="submit" disabled={pending} className="w-full">
              {pending ? <TranslatableText text="Creating Farm..." /> : <TranslatableText text="Create Farm" />}
            </Button>

            {state.message && !state.errors && <p className="text-sm text-green-500 mt-2">{state.message}</p>}
            {state.errors?.db && <p className="text-sm text-red-500 mt-2">{state.errors.db.join(', ')}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
