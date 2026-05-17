'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FarmForm } from './FarmForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import TranslatableText from './TranslatableText'

interface EditFarmFormProps {
  farm: {
    id: string
    farm_name: string
    land_size_acres: number
    soil_type?: string
    irrigation_type?: string
    primary_crops: string[]
    location?: { district: string; village: string }
  }
  onUpdate: () => void
}

export function EditFarmForm({ farm, onUpdate }: EditFarmFormProps) {
  const [isEditing, setIsEditing] = useState(false)

  if (!isEditing) {
    return (
      <Button
        variant="default"
        size="sm"
        onClick={() => setIsEditing(true)}
        className="bg-white text-gray-900 hover:bg-gray-100 border border-gray-300"
      >
        <TranslatableText text="Edit Farm" />
      </Button>
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4"
      onClick={() => setIsEditing(false)}
    >
      <div
        className="max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Edit Farm Details</CardTitle>
                <CardDescription>
                  <TranslatableText text="Update your farm information including crops and land size." />
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                onClick={() => setIsEditing(false)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                size="sm"
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <FarmForm
              isEdit={true}
              farm={farm}
              title="Edit Farm Details"
              submitText="Update Farm"
              onSuccess={() => {
                setIsEditing(false)
                onUpdate()
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}