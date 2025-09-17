import React, { useState, useEffect } from 'react';
import './ESP32Dashboard.css';

interface ESP32Data {
  level: number;
  vibration: boolean;
  relay1: boolean;
  relay2: boolean;
  relay3: boolean;
  ip: string;
  [key: string]: boolean | number | string; // Add index signature for dynamic access
}

export const ESP32Monitor: React.FC = () => {
  const [data, setData] = useState<ESP32Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      // Using the Express backend as proxy
      const response = await fetch('http://localhost:4000/api/sound-data');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const jsonData = await response.json();
      setData(jsonData);
      setError(null);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(`Failed to fetch data: ${err.message}`);
      console.error('Error fetching ESP32 data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-card loading-card">
          <div className="loading-spinner" />
          <h2>Loading...</h2>
          <p>Connecting to ESP32...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-card error-card">
          <h2>Connection Error</h2>
          <p>{error}</p>
          <button 
            onClick={fetchData}
            className="px-4 py-2 mt-4 bg-cyan-500/20 border-2 border-cyan-400 
                     text-cyan-400 rounded-xl hover:bg-cyan-500/30 transition-all"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <div className="card-header">
          <h2 className="text-xl font-bold">ESP32 Monitor</h2>
          <div className="connection-status">
            <div className="status-dot connected" />
            <span>Connected</span>
          </div>
        </div>

        <div className="data-grid">
          <div className="data-item">
            <div className="data-content">
              <h3 className="text-cyan-400">Sound Level</h3>
              <div className="level-value text-2xl">{data?.level || 0}%</div>
              <div className="level-bar">
                <div 
                  className="level-fill" 
                  style={{ width: `${Math.min((data?.level || 0), 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="data-item">
            <div className="data-content">
              <h3 className="text-pink-400">Vibration</h3>
              <div className="status-value">
                <span className={`vibration-status ${data?.vibration ? 'detected' : 'normal'}`}>
                  {data?.vibration ? 'DETECTED' : 'NORMAL'}
                </span>
              </div>
            </div>
          </div>

          <div className="data-item">
            <div className="data-content w-full">
              <h3 className="text-yellow-400 mb-2">Relay States</h3>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="text-center">
                    <span className="text-gray-400">Relay {num}</span>
                    <div className={`status-indicator ${
                      data?.[`relay${num}` as keyof ESP32Data] ? 'active' : 'inactive'
                    }`}>
                      {data?.[`relay${num}` as keyof ESP32Data] ? 'ON' : 'OFF'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card-footer">
          <div className="last-updated">
            Last updated: {lastUpdated}
          </div>
          <div className="auto-refresh">
            Auto-refresh: 2s
          </div>
        </div>
      </div>
    </div>
  );
};