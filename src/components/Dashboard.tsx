"use client";

import { useState, useEffect } from "react";
import { getFarmStats } from "../app/actions/farm";
import { FarmOverview } from "./FarmOverview";
import { EditFarmForm } from "./EditFarmForm";
import { useFarm } from "./FarmContext";
import TranslatableText from "./TranslatableText";

interface DashboardProps {
  user: {
    id: string;
    email?: string;
    name?: string;
  };
}

export function Dashboard({ user }: DashboardProps) {
  const { farms, selectedFarm, selectedFarmId, setSelectedFarmId, loading: farmsLoading, refreshFarms } = useFarm()
  const [farmStats, setFarmStats] = useState<{
    totalActivities: number;
    monthlyExpenses: number;
    healthRecords: number;
    recentActivities: Array<{
      id: string;
      activity_type: string;
      description: string;
      date: string;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFarmStats = async () => {
      if (selectedFarmId && selectedFarm) {
        setLoading(true);
        try {
          const stats = await getFarmStats(selectedFarmId);
          setFarmStats(stats);
        } catch (error) {
          console.error('Failed to fetch farm stats:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setFarmStats(null);
        setLoading(false);
      }
    };

    fetchFarmStats();
  }, [selectedFarmId, selectedFarm]);

  if (farmsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (farms.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4"><TranslatableText text="Welcome to CropSynth!" /></h2>
        <p className="text-gray-600 mb-6"><TranslatableText text="Get started by creating your first farm." /></p>
        <a
          href="/farm/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
        >
          Create Your First Farm
        </a>
      </div>
    );
  }

  return (
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

      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg shadow-lg text-white p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              <TranslatableText text="Welcome back" />, {user?.name || user?.email?.split('@')[0] || 'Farmer'}! 👋
            </h2>
            <p className="text-green-100">
              <TranslatableText text="Managing" /> <strong>{selectedFarm?.farm_name || 'No Farm Selected'}</strong> <TranslatableText text="in" /> {selectedFarm?.location?.village || 'Unknown'}, {selectedFarm?.location?.district || 'Unknown'}
            </p>
          </div>
          {selectedFarm && (
            <EditFarmForm
              farm={{
                id: selectedFarm.id,
                farm_name: selectedFarm.farm_name,
                land_size_acres: selectedFarm.land_size_acres,
                soil_type: selectedFarm.soil_type,
                irrigation_type: selectedFarm.irrigation_type,
                primary_crops: selectedFarm.primary_crops,
                location: selectedFarm.location
              }}
              onUpdate={refreshFarms}
            />
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white/20 rounded-lg p-3">
            <div className="font-semibold"><TranslatableText text="Farm Size" /></div>
            <div className="text-lg">{selectedFarm?.land_size_acres || 0} acres</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="font-semibold"><TranslatableText text="Primary Crops" /></div>
            <div className="text-lg">{selectedFarm?.primary_crops?.length || 0}</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="font-semibold"><TranslatableText text="Activities" /></div>
            <div className="text-lg">
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                farmStats?.totalActivities || 0
              )}
            </div>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="font-semibold"><TranslatableText text="This Month" /></div>
            <div className="text-lg">
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                `₹${farmStats?.monthlyExpenses || 0}`
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        {selectedFarm && (
          <FarmOverview
            farm={{
              ...selectedFarm,
              soil_type: selectedFarm.soil_type || 'Unknown',
              irrigation_type: selectedFarm.irrigation_type || 'Unknown'
            }}
            stats={farmStats || { totalActivities: 0, monthlyExpenses: 0, healthRecords: 0, recentActivities: [] }}
            onFarmUpdate={refreshFarms}
          />
        )}
      </div>
    </div>
  );
}