'use client'

import { useState } from "react";
import { updateFarm, createFarm } from "@/app/actions/farm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import TranslatableText from "./TranslatableText";

const KERALA_DISTRICTS = [
  "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam",
  "Idukki", "Ernakulam", "Thrissur", "Palakkad", "Malappuram",
  "Kozhikode", "Wayanad", "Kannur", "Kasaragod"
];

const SOIL_TYPES = [
  "Red Soil", "Black Soil", "Laterite Soil", "Alluvial Soil", "Sandy Soil", "Clay Soil"
];

const IRRIGATION_TYPES = [
  "Rain-fed", "Bore well", "Open well", "Canal irrigation", "Drip irrigation", "Sprinkler irrigation"
];

const COMMON_CROPS = [
  "Rice", "Coconut", "Rubber", "Pepper", "Cardamom", "Coffee", "Tea",
  "Banana", "Tapioca", "Ginger", "Turmeric", "Vegetables", "Areca nut"
];

interface FarmFormProps {
  isEdit?: boolean;
  farm?: {
    id?: string;
    farm_name: string;
    land_size_acres: number;
    soil_type?: string;
    irrigation_type?: string;
    primary_crops: string[];
    location?: { district: string; village: string };
  };
  title: string;
  submitText: string;
  onSuccess?: () => void;
}

export function FarmForm({ isEdit = false, farm, title, submitText, onSuccess }: FarmFormProps) {
  const [formData, setFormData] = useState({
    farmName: farm?.farm_name || "",
    district: farm?.location?.district || "",
    village: farm?.location?.village || "",
    landSizeAcres: farm?.land_size_acres?.toString() || "",
    soilType: farm?.soil_type || "",
    irrigationType: farm?.irrigation_type || "",
    primaryCrops: farm?.primary_crops || [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.farmName || !formData.district || !formData.village ||
        !formData.landSizeAcres || !formData.soilType || !formData.irrigationType ||
        formData.primaryCrops.length === 0) {
      toast.error(<TranslatableText text="Please fill in all required fields" />);
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEdit && farm?.id) {
        // For edit, call updateFarm with updates object
        const updates = {
          farm_name: formData.farmName,
          location: { district: formData.district, village: formData.village },
          land_size_acres: parseFloat(formData.landSizeAcres),
          soil_type: formData.soilType,
          irrigation_type: formData.irrigationType,
          primary_crops: formData.primaryCrops,
        };
        await updateFarm(farm.id, updates);
        toast.success('Farm updated successfully!');
        onSuccess?.();
      } else {
        // For create, use FormData
        const formDataToSend = new FormData();
        formDataToSend.append('farm_name', formData.farmName);
        formDataToSend.append('land_size_acres', formData.landSizeAcres);
        formDataToSend.append('soil_type', formData.soilType);
        formDataToSend.append('irrigation_type', formData.irrigationType);
        formDataToSend.append('primary_crops', formData.primaryCrops.join(','));
        formDataToSend.append('district', formData.district);
        formDataToSend.append('village', formData.village);

        const result = await createFarm({ message: '', errors: {} }, formDataToSend);
        if (result.errors) {
          toast.error(result.message || 'Failed to create farm');
        } else {
          toast.success('Farm created successfully!');
          onSuccess?.();
        }
      }
    } catch (error) {
      console.error("Error saving farm:", error);
      toast.error("Failed to save farm. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCropToggle = (crop: string) => {
    setFormData(prev => ({
      ...prev,
      primaryCrops: prev.primaryCrops.includes(crop)
        ? prev.primaryCrops.filter(c => c !== crop)
        : [...prev.primaryCrops, crop]
    }));
  };

  return (
    <>
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">
          <TranslatableText text={isEdit ? 'Update your farm information.' : 'Tell us about your farm to get personalized advice and recommendations.'} />
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Farm Name */}
        <div>
          <Label htmlFor="farm_name"><TranslatableText text="Farm Name" /> *</Label>
          <Input
            id="farm_name"
            type="text"
            value={formData.farmName}
            onChange={(e) => setFormData(prev => ({ ...prev, farmName: e.target.value }))}
            placeholder="e.g., Green Valley Farm"
            required
          />
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="district"><TranslatableText text="District" /> *</Label>
            <Select value={formData.district} onValueChange={(value) => setFormData(prev => ({ ...prev, district: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select District" />
              </SelectTrigger>
              <SelectContent>
                {KERALA_DISTRICTS.map(district => (
                  <SelectItem key={district} value={district}>{district}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="village"><TranslatableText text="Village/Town" /> *</Label>
            <Input
              id="village"
              type="text"
              value={formData.village}
              onChange={(e) => setFormData(prev => ({ ...prev, village: e.target.value }))}
              placeholder="Enter village or town name"
              required
            />
          </div>
        </div>

        {/* Land Size */}
        <div>
          <Label htmlFor="land_size_acres"><TranslatableText text="Land Size (in acres)" /> *</Label>
          <Input
            id="land_size_acres"
            type="number"
            step="0.1"
            min="0.1"
            value={formData.landSizeAcres}
            onChange={(e) => setFormData(prev => ({ ...prev, landSizeAcres: e.target.value }))}
            placeholder="e.g., 2.5"
            required
          />
        </div>

        {/* Soil Type and Irrigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="soil_type"><TranslatableText text="Soil Type" /> *</Label>
            <Select value={formData.soilType} onValueChange={(value) => setFormData(prev => ({ ...prev, soilType: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select Soil Type" />
              </SelectTrigger>
              <SelectContent>
                {SOIL_TYPES.map(soil => (
                  <SelectItem key={soil} value={soil}>{soil}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="irrigation_type"><TranslatableText text="Irrigation Type" /> *</Label>
            <Select value={formData.irrigationType} onValueChange={(value) => setFormData(prev => ({ ...prev, irrigationType: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select Irrigation Type" />
              </SelectTrigger>
              <SelectContent>
                {IRRIGATION_TYPES.map(irrigation => (
                  <SelectItem key={irrigation} value={irrigation}>{irrigation}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Primary Crops */}
        <div>
          <Label><TranslatableText text="Primary Crops" /> * (<TranslatableText text="Select all that apply" />)</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
            {COMMON_CROPS.map(crop => (
              <label
                key={crop}
                className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                  formData.primaryCrops.includes(crop)
                    ? "bg-green-50 border-green-500 text-green-700"
                    : "bg-white border-gray-300 hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.primaryCrops.includes(crop)}
                  onChange={() => handleCropToggle(crop)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm font-medium">{crop}</span>
              </label>
            ))}
          </div>
          {formData.primaryCrops.length > 0 && (
            <p className="mt-2 text-sm text-green-600">
              <TranslatableText text="Selected" />: {formData.primaryCrops.join(", ")}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span><TranslatableText text={isEdit ? 'Updating...' : 'Creating...'} /></span>
              </div>
            ) : (
              submitText
            )}
          </Button>
        </div>
      </form>
    </>
  );
}