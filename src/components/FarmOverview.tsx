"use client";

import { useState, useEffect } from "react";
import { getFarmActivities } from "../app/actions/activities";
import { getFinancialSummary } from "../app/actions/expenses";
import TranslatableText from "./TranslatableText";

interface FarmOverviewProps {
  farm: {
    id: string;
    farm_name: string;
    location: {
      district: string;
      village: string;
    };
    land_size_acres: number;
    soil_type: string;
    irrigation_type: string;
    primary_crops: string[];
  };
  stats: {
    totalActivities: number;
    monthlyExpenses: number;
    healthRecords: number;
    recentActivities: Array<{
      id: string;
      activity_type: string;
      description: string;
      date: string;
    }>;
  };
  onFarmUpdate?: () => void;
}

export function FarmOverview({ farm, stats, onFarmUpdate }: FarmOverviewProps) {
  const [recentActivities, setRecentActivities] = useState<Array<{
    id: string;
    activity_type: string;
    description: string;
    crop_name: string;
    date: string;
  }>>([]);
  const [financialSummary, setFinancialSummary] = useState<{
    totalExpenses: number;
    totalRevenue: number;
    netProfit: number;
    profitMargin: number;
    expensesByCategory: Record<string, number>;
    expenseCount: number;
    salesCount: number;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (farm?.id) {
        try {
          const [activities, finances] = await Promise.all([
            getFarmActivities(farm.id, 5),
            getFinancialSummary(farm.id)
          ]);
          setRecentActivities(activities);
          setFinancialSummary(finances);
        } catch (error) {
          console.error('Failed to fetch farm overview data:', error);
        }
      }
    };

    fetchData();
  }, [farm?.id]);

  if (!farm) {
    return <div><TranslatableText text="Loading farm details..." /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Farm Details Card */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900"><TranslatableText text="Farm Details" /></h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-500"><TranslatableText text="Location" /></div>
            <div className="font-semibold text-gray-900">
              {farm.location ? `${farm.location.village}, ${farm.location.district}` : <TranslatableText text="Location not set" />}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-500"><TranslatableText text="Land Size" /></div>
            <div className="font-semibold text-gray-900">{farm.land_size_acres} acres</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-500"><TranslatableText text="Soil Type" /></div>
            <div className="font-semibold text-gray-900">{farm.soil_type}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-500"><TranslatableText text="Irrigation" /></div>
            <div className="font-semibold text-gray-900">{farm.irrigation_type}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm md:col-span-2">
            <div className="text-sm text-gray-500"><TranslatableText text="Primary Crops" /></div>
            <div className="font-semibold text-gray-900">
              {farm.primary_crops.join(", ")}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500"><TranslatableText text="Total Activities" /></p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalActivities || 0}</p>
            </div>
            <div className="text-3xl">📝</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500"><TranslatableText text="Monthly Expenses" /></p>
              <p className="text-2xl font-bold text-gray-900">₹{stats?.monthlyExpenses || 0}</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500"><TranslatableText text="Health Records" /></p>
              <p className="text-2xl font-bold text-gray-900">{stats?.healthRecords || 0}</p>
            </div>
            <div className="text-3xl">🔍</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500"><TranslatableText text="Net Profit" /></p>
              <p className={`text-2xl font-bold ${
                (financialSummary?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ₹{financialSummary?.netProfit || 0}
              </p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900"><TranslatableText text="Recent Activities" /></h3>
        </div>
        <div className="p-6">
          {recentActivities && recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-semibold">
                        {activity.activity_type === 'sowing' && '🌱'}
                        {activity.activity_type === 'irrigation' && '💧'}
                        {activity.activity_type === 'spraying' && '🚿'}
                        {activity.activity_type === 'harvesting' && '🌾'}
                        {activity.activity_type === 'weeding' && '🌿'}
                        {activity.activity_type === 'fertilizing' && '🧪'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {activity.activity_type} - {activity.crop_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(activity.date).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-gray-500"><TranslatableText text="No activities recorded yet." /></p>
              <p className="text-sm text-gray-400 mt-2">
                <TranslatableText text="Start logging your farming activities to track your progress!" />
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Financial Summary */}
      {financialSummary && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900"><TranslatableText text="Financial Summary" /></h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-500"><TranslatableText text="Total Expenses" /></p>
                <p className="text-2xl font-bold text-red-600">₹{financialSummary.totalExpenses}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500"><TranslatableText text="Total Revenue" /></p>
                <p className="text-2xl font-bold text-green-600">₹{financialSummary.totalRevenue}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500"><TranslatableText text="Profit Margin" /></p>
                <p className={`text-2xl font-bold ${
                  financialSummary.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {financialSummary.profitMargin.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}