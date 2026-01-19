/**
 * Background sync utilities for syncing data to backend.
 */
import { getStorageData, getTodayDate } from '../utils';
import { syncUsage, syncTrackedSites } from '../popup/utils/api';

const SYNC_INTERVAL_MINUTES = 5;
const SYNC_ALARM_NAME = 'syncToBackend';

/**
 * Sync today's usage data to backend.
 */
export async function syncTodayUsage(): Promise<void> {
  try {
    const today = getTodayDate();
    const data = await getStorageData();
    const usage = data.usage[today] || {};
    
    if (Object.keys(usage).length === 0) {
      return; // No usage to sync
    }
    
    await syncUsage(today, usage);
    console.log(`Synced usage for ${today}`);
  } catch (error) {
    console.error('Error syncing usage:', error);
    // Don't throw - sync failures shouldn't break the extension
  }
}

/**
 * Sync all historical usage data from local storage to backend.
 * Called on first use or when user explicitly requests sync.
 */
export async function syncAllUsage(): Promise<void> {
  try {
    const data = await getStorageData();
    
    // Sync all dates in usage data
    for (const [date, dailyUsage] of Object.entries(data.usage)) {
      if (Object.keys(dailyUsage).length > 0) {
        try {
          await syncUsage(date, dailyUsage);
          console.log(`Synced usage for ${date}`);
        } catch (error) {
          console.error(`Error syncing usage for ${date}:`, error);
          // Continue with other dates
        }
      }
    }
    
    console.log('Completed syncing all usage data');
  } catch (error) {
    console.error('Error syncing all usage:', error);
  }
}

/**
 * Sync tracked sites to backend.
 */
export async function syncTrackedSitesToBackend(): Promise<void> {
  try {
    const data = await getStorageData();
    await syncTrackedSites(data.trackedSites);
    console.log('Synced tracked sites');
  } catch (error) {
    console.error('Error syncing tracked sites:', error);
  }
}

/**
 * Check if we need to do initial sync (first time setup).
 */
export async function needsInitialSync(): Promise<boolean> {
  const result = await chrome.storage.local.get('hasSyncedInitialData');
  return !result.hasSyncedInitialData;
}

/**
 * Perform initial sync of all local storage data.
 */
export async function performInitialSync(): Promise<void> {
  try {
    console.log('Performing initial sync...');
    
    // Sync tracked sites first
    await syncTrackedSitesToBackend();
    
    // Sync all usage data
    await syncAllUsage();
    
    // Mark as synced
    await chrome.storage.local.set({ hasSyncedInitialData: true });
    console.log('Initial sync completed');
  } catch (error) {
    console.error('Error during initial sync:', error);
    // Don't mark as synced if it failed - will retry on next startup
  }
}

/**
 * Set up periodic sync alarm.
 */
export function setupSyncAlarm(): void {
  chrome.alarms.create(SYNC_ALARM_NAME, {
    periodInMinutes: SYNC_INTERVAL_MINUTES,
  });
}

/**
 * Handle sync alarm.
 */
export async function handleSyncAlarm(): Promise<void> {
  // Sync today's usage
  await syncTodayUsage();
  
  // Sync tracked sites (in case they changed)
  await syncTrackedSitesToBackend();
}
