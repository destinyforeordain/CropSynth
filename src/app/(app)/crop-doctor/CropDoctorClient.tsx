"use client";

import { CropDoctor } from '@/components/CropDoctor'
import { useFarm } from '@/components/FarmContext'
import TranslatableText from '@/components/TranslatableText'

export default function CropDoctorClient() {
  const { farms, selectedFarmId, setSelectedFarmId, loading } = useFarm()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (farms.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4"><TranslatableText text="No Farms Found" /></h2>
        <p className="text-gray-600 mb-6"><TranslatableText text="You need to create a farm first to use the crop doctor." /></p>
        <a
          href="/farm/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
        >
          <TranslatableText text="Create Your First Farm" />
        </a>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Farm Selector */}
        {farms.length > 1 && (
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <TranslatableText text="Select Farm" />
            </label>
            <select
              value={selectedFarmId || ''}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              aria-label="Select Farm"
            >
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.farm_name} - {farm.location?.village || 'Unknown'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* CropDoctor Component */}
        {selectedFarmId && <CropDoctor farmId={selectedFarmId} />}
      </div>
    </div>
  );
}