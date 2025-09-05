import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';

// Import components
import EnergyUsageChart from '../components/EnergyUsageChart';
import PowerDistributionChart from '../components/PowerDistributionChart';
import HistoryTable from '../components/HistoryTable';

function DashboardPage({ state, result, handleSubmit, loading, error }) {
  const navigate = useNavigate();
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState(null);
  
  // Sample history data - in a real app this would be stored in state and persisted
  const [historyData, setHistoryData] = useState([
    { 
      timestamp: '10:15 AM', 
      gridStatus: 'Active', 
      priority: 65, 
      optimalSource: 'Grid', 
      totalLoad: 45.5 
    },
    { 
      timestamp: '09:30 AM', 
      gridStatus: 'Failure', 
      priority: 70, 
      optimalSource: 'Solar', 
      totalLoad: 38.2 
    },
    { 
      timestamp: '08:45 AM', 
      gridStatus: 'Active', 
      priority: 55, 
      optimalSource: 'Grid', 
      totalLoad: 42.7 
    },
  ]);

  // Add the new result to history when it's available
  useEffect(() => {
    if (result) {
      const currentTime = new Date();
      const timeString = currentTime.toLocaleTimeString();
      const dateString = currentTime.toLocaleDateString();
      
      setLastUpdateTime(`${dateString} ${timeString}`);
      
      const newHistoryEntry = {
        timestamp: timeString,
        gridStatus: result.grid_status,
        priority: Math.round(result.priority * 100),
        optimalSource: result.optimal_source.replace(/_Power\(kW\)/, ''),
        totalLoad: state["Total_Load_Demand(kW)"]
      };
      
      setHistoryData(prevHistory => [newHistoryEntry, ...prevHistory]);
    }
  }, [result, state]);

  // Update the "time since last update" counter
  useEffect(() => {
    if (!lastUpdateTime) return;
    
    const updateTimer = () => {
      const now = new Date();
      const lastUpdate = new Date(lastUpdateTime);
      const diffInSeconds = Math.floor((now - lastUpdate) / 1000);
      
      if (diffInSeconds < 60) {
        setTimeSinceUpdate(`${diffInSeconds} seconds ago`);
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        setTimeSinceUpdate(`${minutes} minute${minutes > 1 ? 's' : ''} ago`);
      } else {
        const hours = Math.floor(diffInSeconds / 3600);
        setTimeSinceUpdate(`${hours} hour${hours > 1 ? 's' : ''} ago`);
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lastUpdateTime]);

  return (
    <div className="container dashboard-container">
      <h1>Energy Management System</h1>
      
      <div className="page-navigation">
        <div className="nav-item">
          <Link to="/">1. Input Details</Link>
        </div>
        <div className="nav-item">
          <Link to="/configuration">2. Configuration</Link>
        </div>
        <div className="nav-item active">3. Dashboard & History</div>
      </div>
      
      <div className="dashboard-controls">
        <button onClick={handleSubmit} disabled={loading} className="calculate-button">
          {loading ? "Calculating..." : result ? "Recalculate Configuration" : "Calculate Optimal Configuration"}
        </button>
        {result && (
          <button 
            onClick={() => navigate('/')} 
            className="edit-inputs-button"
          >
            Edit Inputs
          </button>
        )}
      </div>
      
      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
          <p>Please check your inputs and try again.</p>
        </div>
      )}
      
      {result ? (
        <div className="result">
          <h2>Energy Dashboard</h2>
          <div className="result-section">
            <h3>Load Priority: {Math.round(result.priority * 100)}%</h3>
            <h3>Optimal Source: {result.optimal_source.replace(/_Power\(kW\)/, '')}</h3>
            <h3>Grid Status: {result.grid_status}</h3>
            {lastUpdateTime && (
              <p className="last-update">
                Last updated: {lastUpdateTime}
                {timeSinceUpdate && <span className="time-since-update"> ({timeSinceUpdate})</span>}
              </p>
            )}
          </div>
          
          <div className="power-management-results">
            <h3>Power Management</h3>
            
            {result.power_management && result.power_management.demand_exceeds_supply && (
              <div className="power-warning">
                <h4>Warning: Demand Exceeds Available Supply</h4>
                <p>Total Demand: {result.power_management.total_demand.toFixed(2)} kW</p>
                <p>Available Power: {result.power_management.total_available_power.toFixed(2)} kW</p>
                <p>Shortage: {(result.power_management.total_demand - result.power_management.total_available_power).toFixed(2)} kW</p>
                <p className="warning-message">Non-critical MCBs will be turned off based on priority</p>
              </div>
            )}
            
            {result.power_management && (
              <>
                <p>
                  <span>Best Available Source:</span> 
                  <strong>{result.power_management.optimal_source.replace(/_Power\(kW\)/, '')}</strong>
                </p>
                <p>
                  <span>Total Available Power:</span> 
                  <strong>{result.power_management.total_available_power.toFixed(2)} kW</strong>
                </p>
                <p>
                  <span>Remaining Power:</span> 
                  <strong>{result.power_management.remaining_power.toFixed(2)} kW</strong>
                </p>
              </>
            )}
            
            <h4>MCB Status Recommendations</h4>
            <div className="mcb-status-table">
              <div className="mcb-status-header">
                <div>MCB</div>
                <div>Status</div>
                <div>Power (kW)</div>
                <div>Priority</div>
              </div>
              {result.power_management && result.power_management.mcb_statuses ? 
                Object.entries(result.power_management.mcb_statuses).sort((a, b) => {
                  // Sort by MCB number
                  const numA = parseInt(a[0].split('_')[1]);
                  const numB = parseInt(b[0].split('_')[1]);
                  return numA - numB;
                }).map(([mcb, status]) => {
                  const mcbNum = mcb.split('_')[1];
                  return (
                    <div className={`mcb-status-row ${status === 1 ? 'on' : 'off'}`} key={mcb}>
                      <div>{mcb}</div>
                      <div>{status === 1 ? 'ON' : 'OFF'}</div>
                      <div>
                        {(() => {
                          // Try to get MCB power from different sources
                          const mcbNum = mcb.split('_')[1];
                          
                          // 1. Try to find it directly in the result's mcb_powers
                          if (result.power_management.mcb_powers && result.power_management.mcb_powers[mcb]) {
                            return `${result.power_management.mcb_powers[mcb].toFixed(1)} kW`;
                          }
                          
                          // 2. Try to find it in the state's mcbs array
                          const mcbObject = state.mcbs?.find(m => m.id === parseInt(mcbNum));
                          if (mcbObject) {
                            return `${mcbObject.power.toFixed(1)} kW`;
                          }
                          
                          // 3. Try to find it in state as a direct property
                          if (state[`${mcb}_Power(kW)`]) {
                            const power = parseFloat(state[`${mcb}_Power(kW)`]);
                            return `${power.toFixed(1)} kW`;
                          }
                          
                          // 4. Finally, check if MCB_X_Power(kW) format exists in state
                          if (state[`MCB_${mcbNum}_Power(kW)`]) {
                            const power = parseFloat(state[`MCB_${mcbNum}_Power(kW)`]);
                            return `${power.toFixed(1)} kW`;
                          }
                          
                          // 5. If all else fails, show N/A
                          return 'N/A';
                        })()}
                      </div>
                      <div>{mcbNum}</div>
                    </div>
                  );
                }) : <div className="mcb-status-row">No MCB data available</div>
              }
            </div>
          </div>

          <div className="dashboard-charts">
            <div className="charts-container" style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap' }}>
              <EnergyUsageChart state={state} result={result} gridStatus={state.Grid_Status} />
              <PowerDistributionChart state={state} />
            </div>
          </div>

          <div className="history-section">
            <h3>Energy Usage History</h3>
            <HistoryTable historyData={historyData} />
          </div>
        </div>
      ) : (
        <div className="no-results">
          <p>Click the Calculate button to generate prediction results and recommendations.</p>
          
          <div className="sample-visualization">
            <h3>Sample Visualizations</h3>
            <div className="charts-container" style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap' }}>
              <EnergyUsageChart state={state} result={result} gridStatus={state.Grid_Status} />
              <PowerDistributionChart state={state} />
            </div>
            
            <div className="history-preview">
              <HistoryTable historyData={historyData} />
            </div>
          </div>
        </div>
      )}

      <div className="navigation-buttons">
        <button 
          onClick={() => navigate('/configuration')} 
          className="back-button"
        >
          Back: Configure MCBs
        </button>
      </div>
    </div>
  );
}

export default DashboardPage;
