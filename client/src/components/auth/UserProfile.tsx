import { useState } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { useMyProfile } from '@/hooks/useMyProfile'
import { User, LogOut, Heart, MessageSquare, Vote } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLocation } from 'wouter'

interface UserProfileProps {
  className?: string
}

export function UserProfile({ className }: UserProfileProps) {
  const { user, signOut } = useAuth()
  const { profile, profileLoading } = useMyProfile()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [, setLocation] = useLocation()

  const displayName = profile?.name || user?.user_metadata?.display_name || user?.email || 'User'
  const initials = displayName
    .split(' ')
    .map((name: string) => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut()
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null
  
  if (profileLoading) {
    return (
      <Button variant="ghost" className={`h-auto p-2 gap-2 hover:bg-amber-50 dark:hover:bg-amber-950/20 ${className}`}>
        <div className="h-8 w-8 rounded-full bg-amber-200 dark:bg-amber-800 animate-pulse" />
        <span className="hidden sm:inline text-amber-900 dark:text-amber-100 font-medium">
          Loading...
        </span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={`h-auto p-2 gap-2 hover:bg-amber-50 dark:hover:bg-amber-950/20 ${className}`}
        >
          <Avatar className="h-8 w-8 border-2 border-amber-300 dark:border-amber-700">
            <AvatarFallback className="bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 text-amber-900 dark:text-amber-100 font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline text-amber-900 dark:text-amber-100 font-medium">
            {displayName}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-900 border-amber-200 dark:border-amber-800">
        <div className="px-3 py-2 border-b border-amber-200 dark:border-amber-800">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">{displayName}</p>
          <p className="text-xs text-amber-600 dark:text-amber-400">{user.email}</p>
        </div>
        
        <DropdownMenuItem className="cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/20">
          <User className="mr-2 h-4 w-4" />
          <span>My Profile</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/20"
          onClick={() => setLocation('/forum')}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          <span>Forum</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/20"
          onClick={() => setLocation('/voting')}
        >
          <Vote className="mr-2 h-4 w-4" />
          <span>Voting</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/20">
          <Heart className="mr-2 h-4 w-4" />
          <span>Pay It Forward</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-amber-200 dark:bg-amber-800" />
        
        <DropdownMenuItem 
          className="cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20 text-red-700 dark:text-red-400"
          onClick={handleSignOut}
          disabled={isLoading}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoading ? 'Signing out...' : 'Sign Out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}