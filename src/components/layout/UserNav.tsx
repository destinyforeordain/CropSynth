'use client'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { useFarm } from "@/components/FarmContext"
import { ChevronDown, Plus } from "lucide-react"
import TranslatableText from '../TranslatableText'

export function UserNav({ user }: { user: User }) {
  const router = useRouter()
  const supabase = createClient()
  const { farms, selectedFarm, selectedFarmId, setSelectedFarmId, loading } = useFarm()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh() // To ensure the layout re-renders and redirects
  }

  const handleFarmSelect = (farmId: string) => {
    setSelectedFarmId(farmId)
  }

  const handleAddFarm = () => {
    router.push('/farm/create')
  }

  return (
    <div className="flex items-center space-x-4">
      {/* Farm Selector */}
      {farms.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center space-x-2">
              <span className="text-sm">
                {loading ? <TranslatableText text="Loading..." /> : (selectedFarm?.farm_name || <TranslatableText text="Select Farm" />)}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel><TranslatableText text="Your Farms" /></DropdownMenuLabel>
            <DropdownMenuSeparator />
            {farms.map((farm) => (
              <DropdownMenuItem
                key={farm.id}
                onClick={() => handleFarmSelect(farm.id)}
                className={selectedFarmId === farm.id ? 'bg-accent' : ''}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{farm.farm_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {farm.location?.village}, {farm.location?.district}
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleAddFarm}>
              <Plus className="h-4 w-4 mr-2" />
              <TranslatableText text="Add New Farm" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name || 'User avatar'} />
              <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.user_metadata.full_name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <TranslatableText text="Log out" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
