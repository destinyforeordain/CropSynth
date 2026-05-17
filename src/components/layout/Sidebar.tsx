'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bot, Sun, DollarSign, Activity, Award, Home, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import TranslatableText from '../TranslatableText'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: Home },
  { href: '/crop-bot', label: 'Crop-Bot', icon: Bot },
  { href: '/crop-doctor', label: 'Crop Doctor', icon: Search },
  { href: '/weather', label: 'Weather', icon: Sun },
  { href: '/expenses', label: 'Expenses', icon: DollarSign },
  { href: '/activities', label: 'Activities', icon: Activity },
  { href: '/schemes', label: 'Schemes', icon: Award },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 flex-col border-r bg-white p-6 md:flex">
      <div className="flex flex-col space-y-4">
        <Link href="/dashboard" className="mb-8 flex items-center space-x-2">
          <Bot className="h-8 w-8 text-green-600" />
          <span className="text-2xl font-bold text-green-600"><TranslatableText text="Crop-Synth" /></span>
        </Link>
        <nav className="flex-1">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    pathname.startsWith(item.href)
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <TranslatableText text={item.label} />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  )
}
