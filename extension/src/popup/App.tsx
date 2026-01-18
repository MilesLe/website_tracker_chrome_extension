import { useState, useEffect } from 'react';
import type { TrackedSites } from '../types';
import { getStorageData, getTodayDate, extractDomain } from '../utils';

interface TrackedSiteDisplay {
  domain: string;
  limit: number;
  usage: number;
}

export default function App() {
  const [trackedSites, setTrackedSites] = useState<TrackedSites>({});
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [domainInput, setDomainInput] = useState('');
  const [limitInput, setLimitInput] = useState('');
  const [error, setError] = useState('');

  // Load initial data
  useEffect(() => {
    loadData();
    
    // Listen for storage changes
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.trackedSites || changes.usage) {
        loadData();
      }
    };
    
    chrome.storage.onChanged.addListener(listener);
    
    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

  async function loadData() {
    const data = await getStorageData();
    setTrackedSites(data.trackedSites);
    
    const today = getTodayDate();
    setUsage(data.usage[today] || {});
  }

  function validateDomain(domain: string): boolean {
    // Basic domain validation
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    const simpleDomainRegex = /^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)*\.[a-z]{2,}$/i;
    
    // Remove www. if present for validation
    const cleanDomain = domain.replace(/^www\./i, '');
    
    return simpleDomainRegex.test(cleanDomain) || domainRegex.test(cleanDomain);
  }

  async function handleAddDomain() {
    setError('');
    
    if (!domainInput.trim()) {
      setError('Please enter a domain name');
      return;
    }
    
    const domain = domainInput.trim().toLowerCase();
    
    // Normalize domain (remove protocol, www, paths)
    const normalizedDomain = extractDomain(domain);
    
    if (!normalizedDomain) {
      setError('Invalid domain format');
      return;
    }
    
    if (!validateDomain(normalizedDomain)) {
      setError('Invalid domain format');
      return;
    }
    
    const limit = parseInt(limitInput, 10);
    if (isNaN(limit) || limit <= 0) {
      setError('Please enter a valid positive number for the limit');
      return;
    }
    
    // Check if domain already exists
    const data = await getStorageData();
    if (data.trackedSites[normalizedDomain]) {
      setError('This domain is already being tracked');
      return;
    }
    
    // Add domain
    const newTrackedSites = {
      ...data.trackedSites,
      [normalizedDomain]: limit,
    };
    
    await chrome.storage.local.set({
      trackedSites: newTrackedSites,
    });
    
    setDomainInput('');
    setLimitInput('');
    setError('');
  }

  async function handleRemoveDomain(domain: string) {
    const data = await getStorageData();
    const newTrackedSites = { ...data.trackedSites };
    delete newTrackedSites[domain];
    
    await chrome.storage.local.set({
      trackedSites: newTrackedSites,
    });
  }

  const trackedSitesList: TrackedSiteDisplay[] = Object.keys(trackedSites).map(domain => ({
    domain,
    limit: trackedSites[domain],
    usage: usage[domain] || 0,
  }));

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h1 style={{ marginTop: 0, fontSize: '24px', marginBottom: '20px' }}>
        Website Time Tracker
      </h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h2 style={{ marginTop: 0, fontSize: '18px', marginBottom: '15px' }}>Add Domain</h2>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
            Domain (e.g., youtube.com):
          </label>
          <input
            type="text"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            placeholder="youtube.com"
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddDomain();
              }
            }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
            Daily Limit (minutes):
          </label>
          <input
            type="number"
            value={limitInput}
            onChange={(e) => setLimitInput(e.target.value)}
            placeholder="60"
            min="1"
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddDomain();
              }
            }}
          />
        </div>
        
        {error && (
          <div style={{ color: '#d32f2f', fontSize: '12px', marginBottom: '10px' }}>
            {error}
          </div>
        )}
        
        <button
          onClick={handleAddDomain}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '14px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#1565c0';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#1976d2';
          }}
        >
          Add Domain
        </button>
      </div>
      
      <div>
        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>Tracked Sites</h2>
        
        {trackedSitesList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            No domains tracked yet. Add one above to get started.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {trackedSitesList.map((site) => {
              const percentage = Math.min((site.usage / site.limit) * 100, 100);
              const isOverLimit = site.usage >= site.limit;
              
              return (
                <div
                  key={site.domain}
                  style={{
                    padding: '15px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    backgroundColor: isOverLimit ? '#ffebee' : '#fff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '5px' }}>
                        {site.domain}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        {site.usage.toFixed(1)} / {site.limit} minutes
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveDomain(site.domain)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        backgroundColor: '#d32f2f',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#c62828';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#d32f2f';
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '12px', color: '#666' }}>Progress</span>
                      <span style={{ fontSize: '12px', color: isOverLimit ? '#d32f2f' : '#666', fontWeight: isOverLimit ? '600' : 'normal' }}>
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: '#e0e0e0',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${percentage}%`,
                          height: '100%',
                          backgroundColor: isOverLimit ? '#d32f2f' : '#4caf50',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

