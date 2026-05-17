"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface ActivityLoggerProps {
  farmId: string;
}

interface Activity {
  id: string;
  activity_type: string;
  description: string;
  crop_name: string;
  date: string;
  metadata?: {
    duration?: number;
    area?: number;
    materials?: string[];
  };
}

const ACTIVITY_TYPES = [
  { value: "sowing", label: "Sowing", icon: "🌱" },
  { value: "irrigation", label: "Irrigation", icon: "💧" },
  { value: "spraying", label: "Spraying", icon: "🚿" },
  { value: "harvesting", label: "Harvesting", icon: "🌾" },
  { value: "weeding", label: "Weeding", icon: "🌿" },
  { value: "fertilizing", label: "Fertilizing", icon: "🧪" },
];

export function ActivityLogger({ farmId }: ActivityLoggerProps) {
  const [showForm, setShowForm] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  const [formData, setFormData] = useState({
    activityType: "",
    description: "",
    cropName: "",
    date: new Date().toISOString().split('T')[0],
    duration: "",
    area: "",
    materials: "",
  });

  // Fetch activities on component mount and when farmId changes
  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .eq('farm_id', farmId)
          .order('date', { ascending: false })
          .limit(20);

        if (error) throw error;
        setActivities(data || []);
      } catch (error) {
        console.error('Error fetching activities:', error);
        toast.error('Failed to load activities');
      } finally {
        setLoading(false);
      }
    };

    if (farmId) {
      fetchActivities();
    }
  }, [farmId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.activityType || !formData.description || !formData.cropName) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const metadata: {
        duration?: number;
        area?: number;
        materials?: string[];
      } = {};
      if (formData.duration) metadata.duration = parseFloat(formData.duration);
      if (formData.area) metadata.area = parseFloat(formData.area);
      if (formData.materials) metadata.materials = formData.materials.split(',').map(m => m.trim());

      const { error } = await supabase
        .from('activities')
        .insert({
          farm_id: farmId,
          activity_type: formData.activityType,
          description: formData.description,
          crop_name: formData.cropName,
          date: formData.date,
          metadata: Object.keys(metadata).length > 0 ? metadata : null,
        });

      if (error) throw error;

      toast.success("Activity logged successfully! 📝");

      // Reset form
      setFormData({
        activityType: "",
        description: "",
        cropName: "",
        date: new Date().toISOString().split('T')[0],
        duration: "",
        area: "",
        materials: "",
      });
      setShowForm(false);

      // Refresh activities
      const { data, error: fetchError } = await supabase
        .from('activities')
        .select('*')
        .eq('farm_id', farmId)
        .order('date', { ascending: false })
        .limit(20);

      if (!fetchError && data) {
        setActivities(data);
      }
    } catch (error) {
      console.error("Error adding activity:", error);
      toast.error("Failed to log activity. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getActivityIcon = (type: string) => {
    const activity = ACTIVITY_TYPES.find(a => a.value === type);
    return activity?.icon || "📝";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Farm Activities</h3>
          <p className="text-sm text-gray-600">Track your daily farming activities</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {showForm ? "Cancel" : "Log Activity"}
        </button>
      </div>

      {/* Add Activity Form */}
      {showForm && (
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Log New Activity</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Type *
                </label>
                <select
                  value={formData.activityType}
                  onChange={(e) => setFormData(prev => ({ ...prev, activityType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  aria-label="Select activity type"
                >
                  <option value="">Select Activity</option>
                  {ACTIVITY_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Crop Name *
                </label>
                <input
                  type="text"
                  value={formData.cropName}
                  onChange={(e) => setFormData(prev => ({ ...prev, cropName: e.target.value }))}
                  placeholder="e.g., Rice, Coconut"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the activity in detail..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  placeholder="Select date"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="2.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area (acres)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.area}
                  onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                  placeholder="1.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Materials Used
              </label>
              <input
                type="text"
                value={formData.materials}
                onChange={(e) => setFormData(prev => ({ ...prev, materials: e.target.value }))}
                placeholder="Seeds, Fertilizer, Pesticide (comma separated)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Logging..." : "Log Activity"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Activities List */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b">
          <h4 className="text-lg font-medium text-gray-900">Recent Activities</h4>
        </div>
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading activities...</p>
            </div>
          ) : activities && activities.length > 0 ? (
            activities.map((activity) => (
              <div key={activity.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">{getActivityIcon(activity.activity_type)}</span>
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
                    {activity.metadata && (
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                        {activity.metadata.duration && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {activity.metadata.duration}h
                          </span>
                        )}
                        {activity.metadata.area && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                            {activity.metadata.area} acres
                          </span>
                        )}
                        {activity.metadata.materials && (
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                            {activity.metadata.materials.join(", ")}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-gray-500">No activities logged yet.</p>
              <p className="text-sm text-gray-400 mt-2">
                Start logging your farming activities to track your progress!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}