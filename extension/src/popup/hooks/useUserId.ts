import { useState, useEffect } from 'react';
import { getUserId } from '../utils/api';

/**
 * Hook to get or create user ID.
 * Returns the user ID and loading state.
 */
export function useUserId() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUserId() {
      try {
        const id = await getUserId();
        setUserId(id);
      } catch (error) {
        console.error('Error loading user ID:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadUserId();
  }, []);

  return { userId, isLoading };
}
