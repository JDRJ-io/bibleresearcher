import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, ChevronRight, Search, Menu } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useAuth } from '@/hooks/useAuth';

interface TopHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onBack: () => void;
  onForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  onMenuToggle: () => void;
}

export function TopHeader({
  searchQuery,
  onSearchChange,
  onBack,
  onForward,
  canGoBack,
  canGoForward,
  onMenuToggle,
}: TopHeaderProps) {
  const { theme, setTheme, themes } = useTheme();
  const { user, isLoggedIn } = useAuth();

  return (
    <header 
      className="sticky top-0 z-30 border-b transition-all duration-300 flex items-center justify-between px-4 max-w-full"
      style={{ 
        backgroundColor: 'var(--header-bg)', 
        borderColor: 'var(--border-color)', 
        height: 'var(--header-height)' 
      }}
    >
      {/* Left Section: Navigation Controls */}
      <div className="flex items-center space-x-3">
        {/* Back/Forward Buttons */}
        <div className="flex space-x-1">
          <Button
            variant="outline"
            size="sm"
            className="w-8 h-8 p-0"
            onClick={onBack}
            disabled={!canGoBack}
            title="Previous Verse"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-8 h-8 p-0"
            onClick={onForward}
            disabled={!canGoForward}
            title="Next Verse"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* User Profile Section (when logged in) */}
        {isLoggedIn && (
          <div className="hidden md:flex items-center space-x-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src="" alt={user?.name} />
              <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{user?.name}</span>
          </div>
        )}
      </div>

      {/* Center Section: Search Bar */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Input
            type="text"
            placeholder="search random w/ '%'"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4"
            style={{
              backgroundColor: 'var(--column-bg)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-color)',
            }}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-60" />
        </div>
      </div>

      {/* Right Section: Controls */}
      <div className="flex items-center space-x-3">
        {/* Theme Toggle */}
        <div className="hidden sm:flex">
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {themes.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Hamburger Menu Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-10 h-10 p-0"
          onClick={onMenuToggle}
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
