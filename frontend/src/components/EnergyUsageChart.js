import React, { useState, useEffect } from 'react';

function EnergyUsageChart({ state = {}, result = null, gridStatus = 1 }) {
  // State for animation and dynamic values
  const [chartData, setChartData] = useState({
    solarPower: 0,
    windPower: 0,
    dgPower: 0,
    upsPower: 0,
    gridPower: 0
  });
  
  // Update chart data when state or result changes
  useEffect(() => {
    let updatedData = {
      solarPower: 0,
      windPower: 0,
      dgPower: 0,
      upsPower: 0,
      gridPower: 0
    };
    
    // First check if we have power usage data in the result
    if (result && result.power_management && result.power_management.source_consumption) {
      // Use the actual consumption data from the result
      const consumption = result.power_management.source_consumption;
      
      updatedData = {
        solarPower: consumption.Solar_Power || 0,
        windPower: consumption.Wind_Power || 0,
        dgPower: consumption.DG_Power || 0,
        upsPower: consumption.UPS_Power || 0,
        gridPower: gridStatus === 0 ? 0 : (consumption.Grid_Power || 0) // Set to 0 if grid is down
      };
    } 
    // If no result data, fall back to the available power from state
    else if (state && state.powerSources && Array.isArray(state.powerSources)) {
      const solarSource = state.powerSources.find(source => source.id === "Solar_Power");
      const windSource = state.powerSources.find(source => source.id === "Wind_Power");
      const dgSource = state.powerSources.find(source => source.id === "DG_Power");
      const upsSource = state.powerSources.find(source => source.id === "UPS_Power");
      const gridSource = state.powerSources.find(source => source.id === "Grid_Power");
      
      updatedData = {
        solarPower: solarSource ? solarSource.value : 15, // Fallback value for testing
        windPower: windSource ? windSource.value : 10,   // Fallback value for testing
        dgPower: dgSource ? dgSource.value : 5,        // Fallback value for testing
        upsPower: upsSource ? upsSource.value : 8,      // Fallback value for testing
        gridPower: gridStatus === 0 ? 0 : (gridSource ? gridSource.value : 20)   // Set to 0 if grid is down
      };
    } else {
      // Default values for testing if state.powerSources is not available
      updatedData = {
        solarPower: 15,
        windPower: 10,
        dgPower: 5,
        upsPower: 8,
        gridPower: gridStatus === 0 ? 0 : 20  // Set to 0 if grid is down
      };
    }
    
    // Update the state with the new data
    setChartData(updatedData);
    
  }, [state, result, gridStatus]);
  
  // Extract values from chart data
  const { solarPower, windPower, dgPower, upsPower, gridPower } = chartData;
  
  
  // Find the maximum value for scaling
  const maxPower = Math.max(solarPower, windPower, dgPower, upsPower, gridPower, 1); // Minimum of 1 to avoid division by zero
  
  // Calculate height percentages (fixed scale for better visibility)
  // Use absolute pixel values instead of percentages for more reliable display
  const heightScale = 150; // Maximum height in pixels
  const solarHeight = Math.max((solarPower / maxPower) * heightScale, 10); // Minimum 10px height
  const windHeight = Math.max((windPower / maxPower) * heightScale, 10);
  const dgHeight = Math.max((dgPower / maxPower) * heightScale, 10);
  const upsHeight = Math.max((upsPower / maxPower) * heightScale, 10);
  const gridHeight = Math.max((gridPower / maxPower) * heightScale, 10);
  
  // Calculate total power for display
  const totalPower = solarPower + windPower + dgPower + upsPower + gridPower;
  
  // Determine optimal source from result
  const optimalSource = result && result.optimal_source ? 
    result.optimal_source.replace(/_Power\(kW\)/, '') : 
    null;
  
  console.log("Power values:", { solarPower, windPower, dgPower, upsPower, gridPower });
  console.log("Height values in pixels:", { solarHeight, windHeight, dgHeight, upsHeight, gridHeight });
  
  // Function to determine if a power source is currently active/optimal
  const isOptimalSource = (sourceId) => {
    if (!optimalSource) return false;
    return sourceId === optimalSource;
  };

  return (
    <div className="chart-card" style={{ 
      border: '1px solid #cccccc', 
      borderRadius: '8px', 
      overflow: 'hidden', 
      margin: '10px 0', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
      height: '400px', 
      display: 'flex', 
      flexDirection: 'column',
      maxWidth: '450px',
      width: '100%'
    }}>
      <div className="chart-header" style={{ padding: '15px', borderBottom: '1px solid #cccccc', background: '#f0f0f0' }}>
        <div className="chart-title" style={{ fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}>
          Energy Usage (kW)
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            marginLeft: '10px',
            backgroundColor: gridStatus === 0 ? '#f8d7da' : '#d4edda',
            padding: '2px 8px',
            borderRadius: '12px',
            border: `1px solid ${gridStatus === 0 ? '#f5c6cb' : '#c3e6cb'}`
          }}>
            <div style={{ 
              width: '10px', 
              height: '10px', 
              borderRadius: '50%', 
              backgroundColor: gridStatus === 0 ? '#e74c3c' : '#28a745',
              marginRight: '5px'
            }}></div>
            <span style={{ 
              fontSize: '0.7rem', 
              fontWeight: 'bold',
              color: gridStatus === 0 ? '#721c24' : '#155724'
            }}>
              Grid {gridStatus === 0 ? 'Offline' : 'Online'}
            </span>
          </div>
        </div>
        <div className="chart-subtitle" style={{ color: '#6c757d', fontSize: '0.9rem', marginTop: '5px' }}>
          Total: {totalPower.toFixed(1)} kW
          {optimalSource && <span style={{ marginLeft: '10px', color: '#2c3e50' }}>| Optimal Source: <span style={{ fontWeight: 'bold', color: '#3498db' }}>{optimalSource}</span></span>}
          {result ? <span style={{ color: 'green', float: 'right', fontSize: '0.8rem' }}>● Live Data</span> : 
                  <span style={{ color: '#999', float: 'right', fontSize: '0.8rem' }}>○ Available Capacity</span>}
        </div>
      </div>
      <div style={{ padding: '20px', background: '#f9f9f9', flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ 
          display: 'flex', 
          height: '200px', 
          alignItems: 'flex-end', 
          justifyContent: 'space-around',
          width: '100%',
          position: 'relative'
        }}>
          {/* Solar Power Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '18%' }}>
            <div style={{ marginBottom: '10px', fontSize: '0.8rem', fontWeight: 'bold' }}>{solarPower.toFixed(1)} kW</div>
            <div style={{ 
              height: `${solarHeight}px`, 
              width: '100%', 
              backgroundColor: isOptimalSource('Solar') ? '#2980b9' : '#3498db', 
              borderRadius: '4px 4px 0 0',
              minHeight: '2px',
              boxShadow: isOptimalSource('Solar') ? '0 0 8px rgba(52, 152, 219, 0.8)' : 'none',
              transition: 'all 0.3s ease-in-out'
            }}></div>
            <div style={{ 
              marginTop: '10px', 
              fontWeight: 'bold', 
              color: '#3498db',
              textDecoration: isOptimalSource('Solar') ? 'underline' : 'none'
            }}>Solar</div>
          </div>
          
          {/* Wind Power Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '18%' }}>
            <div style={{ marginBottom: '10px', fontSize: '0.8rem', fontWeight: 'bold' }}>{windPower.toFixed(1)} kW</div>
            <div style={{ 
              height: `${windHeight}px`, 
              width: '100%', 
              backgroundColor: isOptimalSource('Wind') ? '#27ae60' : '#2ecc71', 
              borderRadius: '4px 4px 0 0',
              minHeight: '2px',
              boxShadow: isOptimalSource('Wind') ? '0 0 8px rgba(46, 204, 113, 0.8)' : 'none',
              transition: 'all 0.3s ease-in-out'
            }}></div>
            <div style={{ 
              marginTop: '10px', 
              fontWeight: 'bold', 
              color: '#2ecc71',
              textDecoration: isOptimalSource('Wind') ? 'underline' : 'none'
            }}>Wind</div>
          </div>
          
          {/* DG Power Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '18%' }}>
            <div style={{ marginBottom: '10px', fontSize: '0.8rem', fontWeight: 'bold' }}>{dgPower.toFixed(1)} kW</div>
            <div style={{ 
              height: `${dgHeight}px`, 
              width: '100%', 
              backgroundColor: isOptimalSource('DG') ? '#d35400' : '#f39c12', 
              borderRadius: '4px 4px 0 0',
              minHeight: '2px',
              boxShadow: isOptimalSource('DG') ? '0 0 8px rgba(243, 156, 18, 0.8)' : 'none',
              transition: 'all 0.3s ease-in-out'
            }}></div>
            <div style={{ 
              marginTop: '10px', 
              fontWeight: 'bold', 
              color: '#f39c12',
              textDecoration: isOptimalSource('DG') ? 'underline' : 'none'
            }}>DG</div>
          </div>
          
          {/* UPS Power Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '18%' }}>
            <div style={{ marginBottom: '10px', fontSize: '0.8rem', fontWeight: 'bold' }}>{upsPower.toFixed(1)} kW</div>
            <div style={{ 
              height: `${upsHeight}px`, 
              width: '100%', 
              backgroundColor: isOptimalSource('UPS') ? '#c0392b' : '#e74c3c', 
              borderRadius: '4px 4px 0 0',
              minHeight: '2px',
              boxShadow: isOptimalSource('UPS') ? '0 0 8px rgba(231, 76, 60, 0.8)' : 'none',
              transition: 'all 0.3s ease-in-out'
            }}></div>
            <div style={{ 
              marginTop: '10px', 
              fontWeight: 'bold', 
              color: '#e74c3c',
              textDecoration: isOptimalSource('UPS') ? 'underline' : 'none'
            }}>UPS</div>
          </div>
          
          {/* Grid Power Bar - Always displayed but with different styles depending on grid status */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '18%' }}>
            <div style={{ 
              marginBottom: '10px', 
              fontSize: '0.8rem', 
              fontWeight: 'bold',
              color: gridStatus === 0 ? '#e74c3c' : 'inherit'
            }}>
              {gridStatus === 0 ? 'OFFLINE' : `${gridPower.toFixed(1)} kW`}
            </div>
            {gridStatus === 0 ? (
              /* Grid Failure Visualization */
              <div style={{
                height: '150px', /* Fixed height for failed state */
                width: '100%',
                backgroundColor: 'transparent',
                borderRadius: '4px',
                border: '2px dashed #e74c3c',
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  textAlign: 'center',
                  color: '#e74c3c',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  transform: 'rotate(-45deg)'
                }}>
                  GRID FAILURE
                </div>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  backgroundColor: '#e74c3c',
                  borderRadius: '4px 4px 0 0'
                }}></div>
              </div>
            ) : (
              /* Normal Grid Power Bar */
              <div style={{ 
                height: `${gridHeight}px`, 
                width: '100%', 
                backgroundColor: isOptimalSource('Grid') ? '#8e44ad' : '#9b59b6', 
                borderRadius: '4px 4px 0 0',
                minHeight: '2px',
                boxShadow: isOptimalSource('Grid') ? '0 0 8px rgba(155, 89, 182, 0.8)' : 'none',
                transition: 'all 0.3s ease-in-out'
              }}></div>
            )}
            <div style={{ 
              marginTop: '10px', 
              fontWeight: 'bold', 
              color: gridStatus === 0 ? '#e74c3c' : '#9b59b6',
              textDecoration: gridStatus !== 0 && isOptimalSource('Grid') ? 'underline' : 'none'
            }}>Grid</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnergyUsageChart;
