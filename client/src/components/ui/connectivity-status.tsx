import { useState, useEffect } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

interface StatusDotProps {
  className?: string;
  title?: string;
}

const StatusDot = ({ className, title }: StatusDotProps) => (
  <div 
    className={`w-3 h-3 rounded-full ${className}`}
    title={title}
  />
);

export function ConnectivityStatus() {
  const online = useOnlineStatus();
  
  return (
    <div className="flex items-center gap-2 text-sm">
      <StatusDot 
        className={online ? "bg-emerald-500" : "bg-amber-500"} 
        title={online ? "Connected to internet" : "Offline — changes will sync automatically once you reconnect"}
      />
      <span className="text-muted-foreground">
        {online ? "Online" : "Offline"}
      </span>
    </div>
  );
}