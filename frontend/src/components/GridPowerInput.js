import React, { useState, useEffect } from 'react';

const GridPowerInput = ({ onPowerUpdate }) => {
  const [gridData, setGridData] = useState({
    power: 0.0,
    voltage: 220.0,
    current: 0.0,
    status: 0,
    frequency: 50.0
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [gridStatus, setGridStatus] = useState(null);
  
  // API base URL - will use proxy in development or direct URL in production
  // API Base URL configuration
const API_BASE = process.env.NODE_ENV === 'development' ? '' : process.env.REACT_APP_API_BASE || 'http://localhost:5000';

  // Fetch current grid power data
  const fetchGridPower = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/grid/power`);
      const result = await response.json();
      
      if (result.status === 'success') {
        setGridData(result.data);
        setLastUpdate(result.data.last_updated);
      }
    } catch (error) {
      console.error('Failed to fetch grid power:', error);
    }
  };

  // Fetch grid status
  const fetchGridStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/grid/status`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.status === 'success') {
        setGridStatus(result.data);
        console.log('Grid status updated:', result.data); // Debug log
      } else {
        console.error('Failed to fetch grid status:', result.message);
      }
    } catch (error) {
      console.error('Failed to fetch grid status:', error);
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setGridData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-calculate power if voltage and current are provided
    if (field === 'voltage' || field === 'current') {
      const newGridData = { ...gridData, [field]: value };
      const calculatedPower = (newGridData.voltage * newGridData.current) / 1000.0;
      
      setGridData(prev => ({
        ...prev,
        [field]: value,
        power: calculatedPower
      }));
    }
  };

  // Submit grid power data
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/api/grid/power`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gridData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        setLastUpdate(result.data.last_updated);
        
        // Update local grid data with the returned data
        setGridData(result.data);
        
        // Notify parent component of power update
        if (onPowerUpdate) {
          onPowerUpdate({
            power: result.data.power,
            voltage: result.data.voltage,
            current: result.data.current,
            status: result.data.status,
            timestamp: result.data.last_updated
          });
        }
        
        // Refresh status immediately after successful update
        await fetchGridStatus();
        
        // Add a small delay and refresh again to ensure status is updated
        setTimeout(() => {
          fetchGridStatus();
        }, 500);
        
        alert('✅ Grid power updated successfully!');
      } else {
        alert(`Failed to update grid power: ${result.message}`);
      }
    } catch (error) {
      console.error('Failed to submit grid power:', error);
      const errorMessage = error.message.includes('fetch') 
        ? 'Cannot connect to backend server. Make sure it\'s running on http://localhost:5000' 
        : `Failed to update grid power: ${error.message}`;
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset to default values
  const handleReset = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/grid/reset`, {
        method: 'POST'
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setGridData(result.data);
        setLastUpdate(null);
        fetchGridStatus();
      }
    } catch (error) {
      console.error('Failed to reset grid power:', error);
    }
  };

  useEffect(() => {
    fetchGridPower();
    fetchGridStatus();
    
    // Refresh status every 30 seconds
    const interval = setInterval(() => {
      fetchGridStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (!gridStatus) return '#9E9E9E';
    if (gridStatus.connected && gridStatus.quality === 'good') return '#4CAF50';
    if (gridStatus.connected && gridStatus.quality === 'poor') return '#FF9800';
    return '#F44336';
  };

  const getStatusText = () => {
    if (!gridStatus) return 'Unknown';
    if (gridStatus.connected) {
      return `Online (${gridStatus.quality})`;
    }
    return 'Offline';
  };

  return (
    <div className="grid-power-input">
      <style>{`
        .grid-power-input {
          background: linear-gradient(135deg, #4fc3f7 0%, #29b6f6 100%);
          border-radius: 12px;
          padding: 20px;
          color: white;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }
        .grid-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .grid-header h3 {
          margin: 0;
          font-size: 18px;
        }
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: ${getStatusColor()};
          animation: ${gridStatus?.connected ? 'pulse 2s infinite' : 'none'};
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        .grid-form {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 15px;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .input-group label {
          font-size: 12px;
          opacity: 0.9;
          font-weight: 500;
        }
        .input-group input, .input-group select {
          padding: 10px 12px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          background: rgba(255, 255, 255, 0.95);
          color: #333;
        }
        .input-group input:focus, .input-group select:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(255,255,255,0.5);
        }
        .grid-controls {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 15px;
        }
        button {
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s;
          font-weight: 500;
        }
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .submit-btn {
          background: #4CAF50;
          color: white;
        }
        .submit-btn:hover:not(:disabled) {
          background: #45a049;
          transform: translateY(-1px);
        }
        .reset-btn {
          background: #f44336;
          color: white;
        }
        .reset-btn:hover:not(:disabled) {
          background: #da190b;
        }
        .refresh-btn {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }
        .refresh-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.3);
        }
        .grid-info {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 12px;
          margin-top: 15px;
        }
        .grid-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 10px;
          margin-bottom: 10px;
        }
        .metric {
          text-align: center;
        }
        .metric-label {
          font-size: 11px;
          opacity: 0.8;
        }
        .metric-value {
          font-size: 16px;
          font-weight: bold;
        }
        .last-update {
          font-size: 11px;
          opacity: 0.7;
          text-align: center;
        }
        .calculated {
          color: #ffeb3b;
          font-style: italic;
        }
      `}</style>

      <div className="grid-header">
        <h3>⚡ Grid Power Input</h3>
        <div className="status-indicator">
          <div className="status-dot"></div>
          <span>{getStatusText()}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid-form">
        <div className="input-group">
          <label>Voltage (V)</label>
          <input
            type="number"
            step="0.1"
            value={gridData.voltage}
            onChange={(e) => handleInputChange('voltage', parseFloat(e.target.value) || 0)}
            placeholder="220.0"
            min="0"
            max="500"
          />
        </div>

        <div className="input-group">
          <label>Current (A)</label>
          <input
            type="number"
            step="0.01"
            value={gridData.current}
            onChange={(e) => handleInputChange('current', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            min="0"
            max="1000"
          />
        </div>

        <div className="input-group">
          <label>Power (kW) <span className="calculated">*calculated</span></label>
          <input
            type="number"
            step="0.001"
            value={gridData.power.toFixed(3)}
            onChange={(e) => handleInputChange('power', parseFloat(e.target.value) || 0)}
            placeholder="0.000"
            min="0"
            max="10000"
          />
        </div>

        <div className="input-group">
          <label>Frequency (Hz)</label>
          <input
            type="number"
            step="0.01"
            value={gridData.frequency}
            onChange={(e) => handleInputChange('frequency', parseFloat(e.target.value) || 0)}
            placeholder="50.00"
            min="45"
            max="55"
          />
        </div>

        <div className="input-group">
          <label>Status</label>
          <select
            value={gridData.status}
            onChange={(e) => handleInputChange('status', parseInt(e.target.value))}
          >
            <option value={0}>Offline / Failed</option>
            <option value={1}>Online / Active</option>
          </select>
        </div>
      </form>

      <div className="grid-controls">
        <button 
          type="submit" 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="submit-btn"
        >
          {isSubmitting ? '⏳ Updating...' : '💾 Update Grid Power'}
        </button>
        
        <button 
          type="button" 
          onClick={handleReset}
          className="reset-btn"
        >
          🔄 Reset to Default
        </button>
        
        <button 
          type="button" 
          onClick={() => { fetchGridPower(); fetchGridStatus(); }}
          className="refresh-btn"
        >
          🔄 Refresh
        </button>
      </div>

      {gridStatus && (
        <div className="grid-info">
          <div className="grid-metrics">
            <div className="metric">
              <div className="metric-label">Voltage Status</div>
              <div className="metric-value">
                {gridStatus.voltage_status === 'normal' ? '✅' : '⚠️'}
              </div>
            </div>
            <div className="metric">
              <div className="metric-label">Frequency Status</div>
              <div className="metric-value">
                {gridStatus.frequency_status === 'normal' ? '✅' : '⚠️'}
              </div>
            </div>
            <div className="metric">
              <div className="metric-label">Power Available</div>
              <div className="metric-value">
                {gridStatus.power_available ? '✅' : '❌'}
              </div>
            </div>
            <div className="metric">
              <div className="metric-label">Data Age</div>
              <div className="metric-value">
                {gridStatus.data_age ? `${Math.round(gridStatus.data_age)}s` : 'N/A'}
              </div>
            </div>
          </div>
          
          {lastUpdate && (
            <div className="last-update">
              📊 Last updated: {new Date(lastUpdate).toLocaleString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GridPowerInput;