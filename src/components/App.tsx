"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "../lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { Dashboard } from "./Dashboard";
import { FarmSetup } from "./FarmSetup";

interface Farm {
  id: string;
  user_id: string;
  farm_name: string;
  location: {
    village: string;
    district: string;
  };
  land_size_acres: number;
  soil_type: string;
  irrigation_type: string;
  primary_crops: string[];
  created_at: string;
  updated_at: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchUserFarms = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching farms:', error);
        return;
      }

      setFarms(data || []);
    } catch (error) {
      console.error('Error fetching farms:', error);
    }
  }, [supabase]);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserFarms(session.user.id);
      }
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserFarms(session.user.id);
        } else {
          setFarms([]);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, fetchUserFarms]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-blue-50">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-blue-50">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🌾</span>
            </div>
            <h1 className="text-xl font-bold text-green-800">Crop-Synth</h1>
            <span className="text-sm text-gray-500 hidden sm:inline">AI Farming Assistant</span>
          </div>
          {user && <SignOutButton />}
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {user ? (
            farms.length === 0 ? (
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Welcome to Crop-Synth! 🌱
                  </h2>
                  <p className="text-lg text-gray-600">
                    Let&apos;s set up your farm profile to get personalized farming advice.
                  </p>
                </div>
                <FarmSetup />
              </div>
            ) : (
              <Dashboard farms={farms} user={user} />
            )
          ) : (
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">🌾</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Your AI Farming Companion
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Get personalized farming advice, track activities, manage expenses, and detect crop diseases with AI.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 mb-8">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600">🤖</span>
                    <span>AI Chat Assistant</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-600">🌤️</span>
                    <span>Weather Alerts</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-purple-600">🔍</span>
                    <span>Disease Detection</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-orange-600">💰</span>
                    <span>Expense Tracking</span>
                  </div>
                </div>
              </div>
              <SignInForm />
            </div>
          )}
        </div>
      </main>

      <Toaster position="top-right" />
    </div>
  );
}