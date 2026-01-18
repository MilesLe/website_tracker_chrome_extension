import { 
  extractDomain, 
  isDomainTracked, 
  getTodayDate, 
  getStorageData, 
  updateUsage
} from './utils';
import type { RuntimeState, LimitReachedPayload } from './types';

const API_ENDPOINT = 'http://localhost:8000/limit-reached';
const ALARM_NAME = 'checkLimits';
const ALARM_INTERVAL_MINUTES = 1;

// Track which domains have already triggered notifications today
const notifiedDomains = new Set<string>();

/**
 * Initialize tracking system
 */
async function initializeTracking(): Promise<void> {
  // Set idle detection interval to 60 seconds
  chrome.idle.setDetectionInterval(60);
  
  // Set up alarm for periodic limit checks
  chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: ALARM_INTERVAL_MINUTES,
  });
  
  // Set up event listeners
  chrome.tabs.onActivated.addListener(handleTabActivated);
  chrome.tabs.onUpdated.addListener(handleTabUpdated);
  chrome.windows.onFocusChanged.addListener(handleWindowFocusChanged);
  chrome.idle.onStateChanged.addListener(handleIdleStateChanged);
  chrome.alarms.onAlarm.addListener(handleAlarm);
  
  // Restore state from storage on wake-up
  await restoreState();
}

/**
 * Restore tracking state from storage (service workers are ephemeral)
 */
async function restoreState(): Promise<void> {
  const sessionData = await getRuntimeState();
  const data = await getStorageData();
  
  // Check if we were tracking something
  if (sessionData.currentDomain && sessionData.startTime) {
    const currentTab = await getCurrentTab();
    if (currentTab?.url) {
      const domain = extractDomain(currentTab.url);
      const trackedDomain = isDomainTracked(domain, data.trackedSites);
      
      if (trackedDomain === sessionData.currentDomain) {
        // Continue tracking if still on the same domain
        const now = Date.now();
        const elapsed = (now - sessionData.startTime) / 1000 / 60; // minutes
        
        if (elapsed > 0) {
          await updateUsage(sessionData.currentDomain, elapsed);
        }
        
        // Update start time to now (accounting for time lost during sleep)
        await chrome.storage.session.set({
          startTime: now,
          lastActiveTime: now,
        });
      } else {
        // Domain changed, stop previous tracking
        await stopTracking();
      }
    }
  }
  
  // Check daily reset
  await checkDailyReset();
}

/**
 * Get the currently active tab
 */
async function getCurrentTab(): Promise<chrome.tabs.Tab | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}

/**
 * Handle tab activation
 */
async function handleTabActivated(activeInfo: chrome.tabs.TabActiveInfo): Promise<void> {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab?.url) {
    await handleTabChange(tab.url);
  }
}

/**
 * Handle tab updates (URL changes)
 */
async function handleTabUpdated(
  tabId: number,
  changeInfo: chrome.tabs.TabChangeInfo,
  tab: chrome.tabs.Tab
): Promise<void> {
  if (changeInfo.status === 'complete' && tab.url) {
    const currentTab = await getCurrentTab();
    if (currentTab?.id === tabId) {
      await handleTabChange(tab.url);
    }
  }
}

/**
 * Handle tab URL change
 */
async function handleTabChange(url: string): Promise<void> {
  // Stop tracking previous domain
  await stopTracking();
  
  // Check if new domain should be tracked
  const domain = extractDomain(url);
  const data = await getStorageData();
  const trackedDomain = isDomainTracked(domain, data.trackedSites);
  
  if (trackedDomain) {
    // Check window focus and idle state before starting
    const window = await chrome.windows.getCurrent();
    const idleState = await chrome.idle.queryState(60);
    
    if (window.focused && (idleState === 'active')) {
      await startTracking(trackedDomain);
    }
  }
}

/**
 * Handle window focus changes
 */
async function handleWindowFocusChanged(windowId: number): Promise<void> {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // All windows lost focus
    await stopTracking();
  } else {
    // Window gained focus, check if we should start tracking
    const currentTab = await getCurrentTab();
    if (currentTab?.url) {
      const domain = extractDomain(currentTab.url);
      const data = await getStorageData();
      const trackedDomain = isDomainTracked(domain, data.trackedSites);
      
      if (trackedDomain) {
        const idleState = await chrome.idle.queryState(60);
        if (idleState === 'active') {
          await startTracking(trackedDomain);
        }
      }
    }
  }
}

/**
 * Handle idle state changes
 */
async function handleIdleStateChanged(newState: chrome.idle.IdleState): Promise<void> {
  if (newState === 'idle' || newState === 'locked') {
    await stopTracking();
  } else if (newState === 'active') {
    // User became active, check if we should resume tracking
    const currentTab = await getCurrentTab();
    if (currentTab?.url) {
      const domain = extractDomain(currentTab.url);
      const data = await getStorageData();
      const trackedDomain = isDomainTracked(domain, data.trackedSites);
      
      if (trackedDomain) {
        const window = await chrome.windows.getCurrent();
        if (window.focused) {
          await startTracking(trackedDomain);
        }
      }
    }
  }
}

/**
 * Start tracking a domain
 */
async function startTracking(domain: string): Promise<void> {
  const sessionData = await chrome.storage.session.get(['currentDomain']);
  
  // Only start if not already tracking this domain
  if (sessionData.currentDomain !== domain) {
    await chrome.storage.session.set({
      currentDomain: domain,
      startTime: Date.now(),
      lastActiveTime: Date.now(),
    });
  }
}

/**
 * Get runtime state from session storage with proper typing
 */
async function getRuntimeState(): Promise<RuntimeState> {
  const result = await chrome.storage.session.get(['currentDomain', 'startTime', 'lastActiveTime']);
  return {
    currentDomain: result.currentDomain ?? null,
    startTime: result.startTime ?? null,
    lastActiveTime: result.lastActiveTime ?? Date.now(),
  };
}

/**
 * Stop tracking and update usage
 */
async function stopTracking(): Promise<void> {
  const sessionData = await getRuntimeState();
  
  if (sessionData.currentDomain && sessionData.startTime) {
    const now = Date.now();
    const elapsed = (now - sessionData.startTime) / 1000 / 60; // minutes
    
    if (elapsed > 0) {
      await updateUsage(sessionData.currentDomain, elapsed);
    }
    
    // Clear tracking state
    await chrome.storage.session.set({
      currentDomain: null,
      startTime: null,
      lastActiveTime: now,
    });
  }
}

/**
 * Check if daily reset is needed
 */
async function checkDailyReset(): Promise<void> {
  const today = getTodayDate();
  const data = await getStorageData();
  
  if (data.lastResetDate !== today) {
    // Date changed, reset usage for new day
    // Keep trackedSites, but clear usage and update lastResetDate
    await chrome.storage.local.set({
      usage: {},
      lastResetDate: today,
    });
    
    // Clear notification tracking for new day
    notifiedDomains.clear();
  }
}

/**
 * Handle alarm events
 */
async function handleAlarm(alarm: chrome.alarms.Alarm): Promise<void> {
  if (alarm.name === ALARM_NAME) {
    // Check daily reset
    await checkDailyReset();
    
    // Update current tracking session if active
    const sessionData = await getRuntimeState();
    
    if (sessionData.currentDomain && sessionData.startTime) {
      // Check if still on tracked domain and window is focused
      const currentTab = await getCurrentTab();
      if (currentTab?.url) {
        const domain = extractDomain(currentTab.url);
        const data = await getStorageData();
        const trackedDomain = isDomainTracked(domain, data.trackedSites);
        
        if (trackedDomain === sessionData.currentDomain) {
          const window = await chrome.windows.getCurrent();
          const idleState = await chrome.idle.queryState(60);
          
          if (window.focused && idleState === 'active') {
            // Still tracking, update usage periodically
            const now = Date.now();
            const elapsed = (now - sessionData.startTime) / 1000 / 60; // minutes
            
            if (elapsed > 0) {
              // Update usage and reset start time to now (debounced write)
              await updateUsage(sessionData.currentDomain, elapsed);
              await chrome.storage.session.set({
                startTime: now,
                lastActiveTime: now,
              });
            }
          } else {
            // Lost focus or idle, stop tracking
            await stopTracking();
          }
        } else {
          // Domain changed, stop tracking
          await stopTracking();
        }
      } else {
        // No active tab, stop tracking
        await stopTracking();
      }
    }
    
    // Check limits
    await checkLimits();
  }
}

/**
 * Check if any domains have reached their limits
 */
async function checkLimits(): Promise<void> {
  const data = await getStorageData();
  const today = getTodayDate();
  const dailyUsage = data.usage[today] || {};
  
  for (const domain of Object.keys(data.trackedSites)) {
    const limit = data.trackedSites[domain];
    const usage = dailyUsage[domain] || 0;
    
    // Check if limit reached and not already notified today
    if (usage >= limit && !notifiedDomains.has(`${today}-${domain}`)) {
      await notifyLimitReached(domain, usage);
      notifiedDomains.add(`${today}-${domain}`);
    }
  }
}

/**
 * Notify that a limit has been reached
 */
async function notifyLimitReached(domain: string, minutes: number): Promise<void> {
  // Show Chrome notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('public/icons/icon48.png'),
    title: 'Time Limit Reached',
    message: `You've reached your ${minutes}-minute limit for ${domain}`,
  });
  
  // Send API call
  const payload: LimitReachedPayload = {
    domain,
    minutes: Math.floor(minutes),
    timestamp: new Date().toISOString(),
  };
  
  await sendApiNotification(payload);
}

/**
 * Send notification to Python API with retry logic
 */
async function sendApiNotification(payload: LimitReachedPayload, retries = 3): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
  
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    // Success, no retry needed
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Retry with exponential backoff
    if (retries > 0) {
      const delay = Math.pow(2, 3 - retries) * 1000; // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
      return sendApiNotification(payload, retries - 1);
    }
    
    // All retries failed, log error (could queue for later retry)
    console.error('Failed to send API notification:', error);
  }
}

// Initialize on service worker startup
initializeTracking().catch(console.error);

