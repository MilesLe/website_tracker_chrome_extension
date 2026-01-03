export interface TrackedSites {
  [domain: string]: number;  // domain -> daily limit (minutes)
}

export interface DailyUsage {
  [domain: string]: number;   // domain -> minutes used
}

export interface UsageData {
  [date: string]: DailyUsage; // "YYYY-MM-DD" -> DailyUsage
}

export interface StorageData {
  trackedSites: TrackedSites;
  usage: UsageData;
  lastResetDate: string;
}

export interface RuntimeState {
  currentDomain: string | null;
  startTime: number | null;
  lastActiveTime: number;
}

export interface LimitReachedPayload {
  domain: string;
  minutes: number;
  timestamp: string;
}

