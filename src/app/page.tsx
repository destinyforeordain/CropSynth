import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SignInForm } from '@/components/SignInForm'
import { SignOutButton } from '@/components/SignOutButton'
import { FarmSetup } from '@/components/FarmSetup'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
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
          </div>
        </header>

        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 py-8">
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
          </div>
        </main>
      </div>
    )
  }

  // User is authenticated, check if they have farms
  const { data: farms, error } = await supabase
    .from('farms')
    .select('*')
    .eq('user_id', user.id)

  if (error) {
    console.error('Error fetching farms:', error)
  }

  const userFarms = farms || []

  if (userFarms.length === 0) {
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
            <SignOutButton />
          </div>
        </header>

        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 py-8">
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
          </div>
        </main>
      </div>
    )
  }

  // User has farms, redirect to dashboard
  redirect('/dashboard')
}