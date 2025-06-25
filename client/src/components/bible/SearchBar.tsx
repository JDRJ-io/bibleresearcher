import { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onBack: () => void;
  onForward: () => void;
  onMenuClick: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
}

export function SearchBar({
  onSearch,
  onBack,
  onForward,
  onMenuClick,
  canGoBack,
  canGoForward
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleRandomSearch = () => {
    setSearchQuery('%');
    onSearch('%');
  };

  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b shadow-sm">
      <div className="flex items-center gap-2 p-3">
        {/* Back/Forward Navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            disabled={!canGoBack}
            className="p-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onForward}
            disabled={!canGoForward}
            className="p-2"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="search random w/ '%'"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>
          <Button type="submit" size="sm">
            Search
          </Button>
        </form>

        {/* Quick Random Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRandomSearch}
          className="whitespace-nowrap"
        >
          Random
        </Button>

        {/* Hamburger Menu */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="p-2"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}