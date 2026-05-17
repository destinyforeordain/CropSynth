import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getFarmHealthRecords, addHealthRecord } from "../app/actions/cropHealth";

interface CropDoctorProps {
  farmId: string;
}

interface HealthRecord {
  id: string;
  farm_id: string;
  crop_name: string;
  image_urls: string[];
  ai_diagnosis?: {
    disease: string;
    confidence: number;
    description: string;
    treatments: {
      organic: string[];
      chemical: string[];
      preventive: string[];
    };
    severity: 'low' | 'medium' | 'high';
  };
  symptoms?: string;
  treatment_applied?: string;
  status: 'healthy' | 'diseased' | 'treated' | 'recovered';
  recorded_date: string;
  created_at: string;
}

export function CropDoctor({ farmId }: CropDoctorProps) {
  const [showForm, setShowForm] = useState(false);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [formData, setFormData] = useState<{
    cropName: string;
    symptoms: string;
    status: "healthy" | "diseased" | "treated" | "recovered";
    treatmentApplied: string;
  }>({
    cropName: "",
    symptoms: "",
    status: "diseased",
    treatmentApplied: "",
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const fetchHealthRecords = async () => {
      try {
        const records = await getFarmHealthRecords(farmId);
        setHealthRecords(records);
      } catch (error) {
        console.error('Failed to fetch health records:', error);
      }
    };

    fetchHealthRecords();
  }, [farmId]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }
    setSelectedImages(files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.cropName || selectedImages.length === 0) {
      toast.error("Please provide crop name and at least one image");
      return;
    }

    setIsAnalyzing(true);

    try {
      // Call the API route for crop analysis
      const response = await fetch('/api/crop-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symptoms: formData.symptoms,
          cropName: formData.cropName,
          farmContext: `Farm ID: ${farmId}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze crop');
      }

      const mockDiagnosis = await response.json();

      // Simulate image URLs (in production, these would be actual uploaded image URLs)
      const mockImageUrls = selectedImages.map((_, index) =>
        `https://example.com/crop-image-${Date.now()}-${index}.jpg`
      );

      await addHealthRecord({
        farmId,
        cropName: formData.cropName,
        imageUrls: mockImageUrls,
        aiDiagnosis: mockDiagnosis,
        symptoms: formData.symptoms || undefined,
        treatmentApplied: formData.treatmentApplied || undefined,
        status: formData.status,
        recordedDate: new Date().toISOString().split('T')[0],
      });

      toast.success("Crop health record added successfully! 🔍");

      // Reset form
      setFormData({
        cropName: "",
        symptoms: "",
        status: "diseased",
        treatmentApplied: "",
      });
      setSelectedImages([]);
      setShowForm(false);
    } catch (error) {
      console.error("Error analyzing crop:", error);
      toast.error("Failed to analyze crop. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-green-600 bg-green-100";
      case "diseased": return "text-red-600 bg-red-100";
      case "treated": return "text-yellow-600 bg-yellow-100";
      case "recovered": return "text-blue-600 bg-blue-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low": return "text-green-600";
      case "medium": return "text-yellow-600";
      case "high": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Crop Doctor</h3>
          <p className="text-sm text-gray-600">AI-powered crop disease detection and treatment recommendations</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {showForm ? "Cancel" : "Analyze Crop"}
        </button>
      </div>

      {/* Analysis Form */}
      {showForm && (
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Crop Health Analysis</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Crop Name *
              </label>
              <input
                type="text"
                value={formData.cropName}
                onChange={(e) => setFormData(prev => ({ ...prev, cropName: e.target.value }))}
                placeholder="e.g., Rice, Tomato, Coconut"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Crop Images * (Max 5 images)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
                aria-label="Upload crop images"
              />
              {selectedImages.length > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  {selectedImages.length} image(s) selected
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observed Symptoms
              </label>
              <textarea
                value={formData.symptoms}
                onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))}
                placeholder="Describe any symptoms you've observed (yellowing leaves, spots, wilting, etc.)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as "healthy" | "diseased" | "treated" | "recovered" }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  aria-label="Select current crop status"
                >
                  <option value="healthy">Healthy</option>
                  <option value="diseased">Diseased</option>
                  <option value="treated">Treated</option>
                  <option value="recovered">Recovered</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Treatment Applied
                </label>
                <input
                  type="text"
                  value={formData.treatmentApplied}
                  onChange={(e) => setFormData(prev => ({ ...prev, treatmentApplied: e.target.value }))}
                  placeholder="Any treatment already applied"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">📸 Photo Tips for Better Analysis:</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Take clear, well-lit photos of affected areas</li>
                <li>• Include close-ups of symptoms and overall plant view</li>
                <li>• Capture both top and bottom of leaves if relevant</li>
                <li>• Avoid blurry or dark images</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isAnalyzing}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  "Analyze Crop"
                )}
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

      {/* Health Records */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b">
          <h4 className="text-lg font-medium text-gray-900">Health Records</h4>
        </div>
        <div className="divide-y divide-gray-200">
          {healthRecords && healthRecords.length > 0 ? (
            healthRecords.map((record: HealthRecord) => (
              <div key={record.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h5 className="font-medium text-gray-900">{record.crop_name}</h5>
                    <p className="text-sm text-gray-500">
                      {new Date(record.recorded_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                    {record.status}
                  </span>
                </div>

                {record.ai_diagnosis && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h6 className="font-medium text-gray-900">🤖 AI Diagnosis</h6>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${getSeverityColor(record.ai_diagnosis.severity)}`}>
                          {record.ai_diagnosis.severity} severity
                        </span>
                        <span className="text-sm text-gray-500">
                          {(record.ai_diagnosis.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-red-600">{record.ai_diagnosis.disease}</p>
                        <p className="text-sm text-gray-600 mt-1">{record.ai_diagnosis.description}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h6 className="text-sm font-medium text-green-700">🌿 Organic Treatments</h6>
                          <ul className="text-sm text-gray-600 mt-1 space-y-1">
                            {record.ai_diagnosis.treatments.organic.map((treatment: string, index: number) => (
                              <li key={index}>• {treatment}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h6 className="text-sm font-medium text-blue-700">🧪 Chemical Treatments</h6>
                          <ul className="text-sm text-gray-600 mt-1 space-y-1">
                            {record.ai_diagnosis.treatments.chemical.map((treatment: string, index: number) => (
                              <li key={index}>• {treatment}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h6 className="text-sm font-medium text-purple-700">🛡️ Prevention</h6>
                          <ul className="text-sm text-gray-600 mt-1 space-y-1">
                            {record.ai_diagnosis.treatments.preventive.map((treatment: string, index: number) => (
                              <li key={index}>• {treatment}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {record.symptoms && (
                  <div className="mb-3">
                    <h6 className="text-sm font-medium text-gray-700">Observed Symptoms:</h6>
                    <p className="text-sm text-gray-600 mt-1">{record.symptoms}</p>
                  </div>
                )}

                {record.treatment_applied && (
                  <div className="mb-3">
                    <h6 className="text-sm font-medium text-gray-700">Treatment Applied:</h6>
                    <p className="text-sm text-gray-600 mt-1">{record.treatment_applied}</p>
                  </div>
                )}

                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>📷 {record.image_urls.length} image(s)</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-gray-500">No health records yet.</p>
              <p className="text-sm text-gray-400 mt-2">
                Start analyzing your crops to detect diseases and get treatment recommendations!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}