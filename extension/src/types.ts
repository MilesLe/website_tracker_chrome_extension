export interface TrackedSites {
  [domain: string]: number;  // domain -> daily limit (minutes)
}

export interface DailyUsage {
  [domain: string]: number;   // domain -> minutes used
}

export interface UsageData {
  [date: string]: DailyUsage; // "YYYY-MM-DD" -> DailyUsage
}

export interface NotifiedDomains {
  [date: string]: string[]; // "YYYY-MM-DD" -> array of domains that were notified
}

export interface StorageData {
  trackedSites: TrackedSites;
  usage: UsageData;
  lastResetDate: string;
  notifiedDomains: NotifiedDomains;
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

