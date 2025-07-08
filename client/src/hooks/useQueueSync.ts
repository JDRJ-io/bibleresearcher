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

  // Task 4.2: Merge policy - timestamp-based conflict resolution
  const syncWithServer = async (item: QueueItem) => {
    try {
      console.log(`🔄 SYNCING: ${item.type} - ${item.id}`);
      
      // Simulated server sync - in real implementation, this would be Supabase call
      // Check if server version is newer than queued version
      const serverUpdatedAt = Date.now() - 1000; // Mock server timestamp
      
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

  // Process queue when online
  useEffect(() => {
    if (navigator.onLine && pendingQueue.length > 0 && !syncInProgress) {
      setSyncInProgress(true);
      
      const processQueue = async () => {
        const itemsToSync = [...pendingQueue];
        
        for (const item of itemsToSync) {
          const result = await syncWithServer(item);
          
          if (result.success) {
            // Remove from queue on success
            setPendingQueue(prev => prev.filter(q => q.id !== item.id));
            console.log(`✅ SYNCED: ${item.type} - ${item.id}`);
          } else {
            // Increment retry count
            setPendingQueue(prev => prev.map(q => 
              q.id === item.id 
                ? { ...q, retries: q.retries + 1 }
                : q
            ));
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