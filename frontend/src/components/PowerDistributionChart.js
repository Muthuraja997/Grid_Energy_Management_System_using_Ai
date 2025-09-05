import React, { useState, useEffect } from 'react';

function PowerDistributionChart({ state = {} }) {
  // State for animation
  const [animatedValues, setAnimatedValues] = useState({
    criticalPercent: 50,
    nonCriticalPercent: 50,
    criticalLoad: 0,
    nonCriticalLoad: 0
  });

  // Extract load values with fallbacks
  const criticalLoad = state['Critical_Load(kW)'] || 0;
  const nonCriticalLoad = state['Non_Critical_Load(kW)'] || 0;
  const totalLoad = criticalLoad + nonCriticalLoad;
  
  // Calculate percentages
  const criticalPercent = totalLoad > 0 ? Math.round((criticalLoad / totalLoad) * 100) : 50;
  const nonCriticalPercent = totalLoad > 0 ? Math.round((nonCriticalLoad / totalLoad) * 100) : 50;

  // Calculate angles for the pie chart segments
  const criticalAngle = (criticalPercent / 100) * 360;
  // Animate the values when they change
  useEffect(() => {
    setAnimatedValues({
      criticalPercent,
      nonCriticalPercent,
      criticalLoad,
      nonCriticalLoad
    });
  }, [criticalPercent, nonCriticalPercent, criticalLoad, nonCriticalLoad]);
  
  // Use animated values for the display
  const animatedCriticalAngle = (animatedValues.criticalPercent / 100) * 360;
  
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
        <div className="chart-title" style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Load Distribution</div>
        <div className="chart-subtitle" style={{ color: '#6c757d', fontSize: '0.9rem', marginTop: '5px' }}>Total: {totalLoad.toFixed(1)} kW</div>
      </div>
      <div className="chart-content" style={{ padding: '20px', flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9f9' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          {/* Pie chart visualization */}
          <div style={{ 
            width: '180px', 
            height: '180px', 
            borderRadius: '50%', 
            background: `conic-gradient(
              #3498db 0deg ${animatedCriticalAngle}deg, 
              #e74c3c ${animatedCriticalAngle}deg 360deg
            )`,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.5s ease-in-out'
          }}>
            {/* Center white circle */}
            <div style={{ 
              width: '120px', 
              height: '120px', 
              borderRadius: '50%', 
              background: 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2c3e50' }}>
                {animatedValues.criticalPercent}%
              </div>
              <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>
                Critical Load
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div style={{ display: 'flex', marginTop: '20px', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '15px', height: '15px', backgroundColor: '#3498db', borderRadius: '3px' }}></div>
              <span>Critical ({animatedValues.criticalPercent}%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '15px', height: '15px', backgroundColor: '#e74c3c', borderRadius: '3px' }}></div>
              <span>Non-Critical ({animatedValues.nonCriticalPercent}%)</span>
            </div>
          </div>
          
          {/* Load values */}
          <div style={{ display: 'flex', marginTop: '10px', gap: '20px', fontSize: '0.9rem', color: '#7f8c8d' }}>
            <div>Critical: {animatedValues.criticalLoad.toFixed(1)} kW</div>
            <div>Non-Critical: {animatedValues.nonCriticalLoad.toFixed(1)} kW</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PowerDistributionChart;
