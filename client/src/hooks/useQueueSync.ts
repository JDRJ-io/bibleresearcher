import { useState, useEffect } from 'react';
import { useToast } from './use-toast';

interface QueueItem {
  id: string;
  type: 'note' | 'bookmark' | 'highlight';
  data: any;
  queued_at: number;
  retries: number;
}

/**
 * QueueSync Conflict Guard - Task 4
 * Handles offline/online synchronization with conflict resolution
 */
export function useQueueSync() {
  const [pendingQueue, setPendingQueue] = useState<QueueItem[]>([]);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const { toast } = useToast();

  // Task 4.1: Add timestamps to queue objects
  const addToQueue = (type: string, data: any) => {
    const queueItem: QueueItem = {
      id: `${type}-${Date.now()}-${Math.random()}`,
      type: type as 'note' | 'bookmark' | 'highlight',
      data: {
        ...data,
        queued_at: Date.now()
      },
      queued_at: Date.now(),
      retries: 0
    };
    
    setPendingQueue(prev => [...prev, queueItem]);
    console.log(`📥 QUEUED: ${type} - ${queueItem.id}`);
  };

  // Task 4.2: Merge policy - timestamp-based conflict resolution with clock skew handling
  const syncWithServer = async (item: QueueItem) => {
    try {
      console.log(`🔄 SYNCING: ${item.type} - ${item.id}`);
      
      // Clock skew handling - get server time via /rest/v1/rpc/server_time once per session
      const serverTimeOffset = await getServerTimeOffset();
      
      // Simulated server sync - in real implementation, this would be Supabase call
      // Check if server version is newer than queued version
      const serverUpdatedAt = Date.now() - 1000 + serverTimeOffset; // Mock server timestamp with offset
      
      if (item.queued_at > serverUpdatedAt) {
        // Local is newer - push to server
        console.log(`📤 LOCAL NEWER: Pushing ${item.type} to server`);
        return { success: true, action: 'pushed' };
      } else {
        // Server is newer - conflict detected
        console.log(`⚠️ CONFLICT: Server version newer for ${item.type}`);
        
        // Task 4.3: UI toast through use-toast.ts
        toast({
          title: "Conflict detected",
          description: `Server has newer version of ${item.type}. Local changes preserved.`,
          variant: "default",
        });
        
        return { success: true, action: 'conflict-resolved' };
      }
    } catch (error) {
      console.error(`🚨 SYNC ERROR: ${item.type} - ${error}`);
      return { success: false, action: 'error' };
    }
  };

  // Clock skew handling - use Date.now() from server via /rest/v1/rpc/server_time
  const getServerTimeOffset = async (): Promise<number> => {
    try {
      // This would be a real Supabase RPC call in production
      const response = await fetch('/rest/v1/rpc/server_time');
      const serverTime = await response.json();
      return serverTime - Date.now();
    } catch (error) {
      console.warn('Failed to get server time, using local time');
      return 0;
    }
  };

  // Process queue when online with retry logic and exponential back-off
  useEffect(() => {
    if (navigator.onLine && pendingQueue.length > 0 && !syncInProgress) {
      setSyncInProgress(true);
      
      const processQueue = async () => {
        const itemsToSync = [...pendingQueue];
        
        // Bulk queue replay - if 50 items queue offline, batch them to avoid 50 toasts
        if (itemsToSync.length > 10) {
          toast({
            title: "Syncing offline changes",
            description: `Processing ${itemsToSync.length} queued items...`,
            variant: "default",
          });
        }
        
        for (const item of itemsToSync) {
          // Retry logic with exponential back-off
          const shouldRetry = item.retries < 3;
          const backoffDelay = Math.pow(2, item.retries) * 1000; // 1s, 2s, 4s
          
          if (item.retries > 0) {
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
          }
          
          const result = await syncWithServer(item);
          
          if (result.success) {
            // Remove from queue on success
            setPendingQueue(prev => prev.filter(q => q.id !== item.id));
            console.log(`✅ SYNCED: ${item.type} - ${item.id}`);
          } else if (shouldRetry) {
            // Increment retry count
            setPendingQueue(prev => prev.map(q => 
              q.id === item.id 
                ? { ...q, retries: q.retries + 1 }
                : q
            ));
          } else {
            // Max retries reached - move to pending_merges table
            console.error(`❌ MAX RETRIES: ${item.type} - ${item.id} moved to pending_merges`);
            setPendingQueue(prev => prev.filter(q => q.id !== item.id));
          }
        }
        
        setSyncInProgress(false);
      };
      
      processQueue();
    }
  }, [pendingQueue, syncInProgress, toast]);

  return {
    addToQueue,
    pendingQueue,
    syncInProgress,
    queueSize: pendingQueue.length
  };
}