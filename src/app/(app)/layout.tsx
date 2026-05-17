import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import { Toaster } from 'sonner'
import { FarmProvider } from '@/components/FarmContext'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  return (
    <FarmProvider user={user}>
      <div className="flex min-h-screen bg-gray-100/40">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header user={user} />
          <main className="flex-1 p-4 sm:p-6">
            {children}
          </main>
        </div>
        <Toaster />
      </div>
    </FarmProvider>
  )
}
