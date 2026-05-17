"use client"

import { User } from '@supabase/supabase-js'
import { usePathname } from 'next/navigation'
import { UserNav } from './UserNav'
import LanguageSelector from '../LanguageSelector'
import TranslatableText from '../TranslatableText'

export default function Header({ user }: { user: User }) {
  const pathname = usePathname()

  const getPageTitle = () => {
    switch (pathname) {
      case '/dashboard':
        return 'Overview'
      case '/crop-bot':
        return 'Crop-Bot'
      case '/weather':
        return 'Weather'
      case '/activities':
        return 'Activities'
      case '/expenses':
        return 'Expenses'
      case '/crop-doctor':
        return 'Crop Doctor'
      case '/schemes':
        return 'Schemes'
      default:
        return 'Dashboard'
    }
  }

  return (
    <header className="h-16 border-b bg-white flex items-center px-6 justify-between">
      <div>
        <h1 className="text-lg font-semibold"><TranslatableText text={getPageTitle()} /></h1>
      </div>
      <div className="flex items-center space-x-4">
        <LanguageSelector />
        <UserNav user={user} />
      </div>
    </header>
  )
}
