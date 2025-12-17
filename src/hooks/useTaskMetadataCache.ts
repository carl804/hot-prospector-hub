import { useState, useEffect, useCallback, useRef } from 'react';
import { Priority } from '@/types/task';
import { contactsApi } from '@/services/ghl/api';
import { toast } from 'sonner';

interface TaskMetadata {
  priority: Priority;
  lastUpdated: string;
}

interface TaskMetadataCache {
  [taskId: string]: TaskMetadata;
}

const STORAGE_KEY = 'task-metadata-cache';
const CUSTOM_FIELD_KEY = 'contact.task_temperature_json';
const CUSTOM_FIELD_ID = 'IupahPvXega24Wf5SFtr'; // Task Temperature JSON field ID

export function useTaskMetadataCache() {
  const [cache, setCache] = useState<TaskMetadataCache>(() => {
    // Load from localStorage on init
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  
  const contactCacheRef = useRef<Map<string, string>>(new Map());
  const syncTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Save to localStorage whenever cache changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [cache]);

  // Load metadata from GHL for a contact
  const loadFromGHL = useCallback(async (contactId: string) => {
    try {
      const contact: any = await contactsApi.get(contactId);
      
      // Find the custom field by ID
      const customField = contact.customFields?.find((f: any) => f.id === CUSTOM_FIELD_ID);
      const jsonData = customField?.value;
      
      if (jsonData) {
        const parsed: TaskMetadataCache = JSON.parse(jsonData);
        
        // Merge with local cache (local takes precedence if newer)
        setCache(prev => {
          const merged = { ...prev };
          Object.keys(parsed).forEach(taskId => {
            const remote = parsed[taskId];
            const local = prev[taskId];
            
            if (!local || new Date(remote.lastUpdated) > new Date(local.lastUpdated)) {
              merged[taskId] = remote;
            }
          });
          return merged;
        });
        
        contactCacheRef.current.set(contactId, jsonData);
      }
    } catch (error) {
      console.error('Failed to load task metadata from GHL:', error);
    }
  }, []);

  // Sync to GHL for a specific contact
  const syncToGHL = useCallback(async (contactId: string, taskIds: string[]) => {
    try {
      // Get only tasks for this contact
      const contactCache: TaskMetadataCache = {};
      taskIds.forEach(taskId => {
        if (cache[taskId]) {
          contactCache[taskId] = cache[taskId];
        }
      });

      const jsonData = JSON.stringify(contactCache);
      
      // Only update if changed
      if (contactCacheRef.current.get(contactId) === jsonData) {
        return;
      }

      // Update using GHL's customFields array format
      await contactsApi.update({
        id: contactId,
        customFields: [
          {
            id: CUSTOM_FIELD_ID,
            value: jsonData
          }
        ]
      });

      contactCacheRef.current.set(contactId, jsonData);
      console.log(`✅ Synced task metadata to GHL for contact ${contactId}`);
    } catch (error) {
      console.error('Failed to sync task metadata to GHL:', error);
      toast.error('Failed to sync task priorities');
    }
  }, [cache]);

  // Update priority locally
  const updatePriority = useCallback((taskId: string, priority: Priority) => {
    setCache(prev => ({
      ...prev,
      [taskId]: {
        priority,
        lastUpdated: new Date().toISOString()
      }
    }));
  }, []);

  // Get priority for a task
  const getPriority = useCallback((taskId: string): Priority => {
    return cache[taskId]?.priority || 'medium';
  }, [cache]);

  // Trigger sync with debounce
  const triggerSync = useCallback((contactId: string, taskIds: string[]) => {
    if (!contactId || taskIds.length === 0) return;
    
    // Clear existing timeout for this contact
    const existingTimeout = syncTimeoutRef.current.get(contactId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Debounce sync by 2 seconds
    const timeout = setTimeout(() => {
      syncToGHL(contactId, taskIds);
      syncTimeoutRef.current.delete(contactId);
    }, 2000);
    
    syncTimeoutRef.current.set(contactId, timeout);
  }, [syncToGHL]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      syncTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  return {
    updatePriority,
    getPriority,
    loadFromGHL,
    triggerSync,
  };
}