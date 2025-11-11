import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogOut, Crown } from "lucide-react";
import { useLocation } from "wouter";

export function UserProfileDropdown() {
  const { user, profile, profileLoading, signOut } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) return null;

  const userInitials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user.email?.[0]?.toUpperCase() || "U";

  const isStaff = profile?.role === "staff" || profile?.role === "admin";
  
  // All users get the crown badge as founding members
  const shouldShowCrown = true;

  const handleSignOut = async () => {
    try {
      await signOut();
      setLocation("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="relative">
          <Button variant="ghost" className="w-8 h-8 rounded-md p-0">
            <Avatar className="w-8 h-8 !rounded-none">
              <AvatarImage
                src={user.user_metadata?.avatar_url}
                className="!rounded-none"
              />
              <AvatarFallback className="bg-purple-500 text-white font-semibold text-xs !rounded-none">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </Button>
          {shouldShowCrown && (
            <Crown
              className="absolute -top-1 -right-1 h-3 w-3 md:-top-1.5 md:-right-1.5 md:h-4 md:w-4 text-yellow-400 z-[9999] drop-shadow-lg pointer-events-none"
              style={{ transform: 'rotate(25deg)' }}
              aria-hidden="true"
            />
          )}
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {profile?.name || "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            {shouldShowCrown && (
              <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                <img src="/crown-icon.png" alt="" className="h-3 w-3" />
                Founding Member
              </div>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => setLocation("/profile")}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
