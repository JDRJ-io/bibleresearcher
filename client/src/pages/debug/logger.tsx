// Debug Logger Page
// Full-screen interface for the global logging system

import { SystemLogger } from '@/components/debug/SystemLogger';

export default function LoggerPage() {
  return (
    <div className="h-screen w-screen bg-background">
      <SystemLogger />
    </div>
  );
}