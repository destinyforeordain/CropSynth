'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import TranslatableText from '@/components/TranslatableText'

export default function LoginPage() {
  const supabase = createClient()

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-lg shadow-md border">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-green-600"><TranslatableText text="Crop-Synth" /></h1>
          <p className="text-gray-500"><TranslatableText text="Your AI-Powered Farming Assistant" /></p>
        </div>
        <Button onClick={handleGoogleSignIn} className="w-full bg-green-600 hover:bg-green-700">
          <TranslatableText text="Sign In with Google" />
        </Button>
      </div>
    </div>
  )
}
