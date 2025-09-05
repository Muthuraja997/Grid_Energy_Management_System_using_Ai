import React from 'react';

function HistoryTable({ historyData = [] }) {
  if (!historyData || historyData.length === 0) {
    return (
      <div className="history-section">
        <h4>Recent Predictions</h4>
        <p style={{ textAlign: 'center', padding: '20px', color: '#95a5a6', fontStyle: 'italic' }}>
          No prediction history available yet. Run calculations to see history.
        </p>
      </div>
    );
  }

  return (
    <div className="history-section">
      <h4>Recent Predictions</h4>
      <div style={{ overflowX: 'auto' }}>
        <table className="history-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Grid Status</th>
              <th>Priority</th>
              <th>Optimal Source</th>
              <th>Total Load</th>
            </tr>
          </thead>
          <tbody>
            {historyData.map((entry, index) => (
              <tr key={index}>
                <td>{entry.timestamp}</td>
                <td>
                  <span style={{ 
                    color: entry.gridStatus === 'Active' ? '#27ae60' : '#e74c3c',
                    fontWeight: '600'
                  }}>
                    {entry.gridStatus}
                  </span>
                </td>
                <td>{entry.priority}%</td>
                <td>
                  <span style={{ 
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: getSourceColor(entry.optimalSource),
                    color: 'white',
                    fontWeight: '500',
                    fontSize: '0.9rem'
                  }}>
                    {entry.optimalSource}
                  </span>
                </td>
                <td>{entry.totalLoad} kW</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Helper function to get color based on source
function getSourceColor(source) {
  switch(source) {
    case 'Grid':
      return '#9b59b6';
    case 'Solar':
      return '#3498db';
    case 'Wind':
      return '#2ecc71';
    case 'DG':
      return '#f39c12';
    case 'UPS':
      return '#e74c3c';
    default:
      return '#95a5a6';
  }
}

export default HistoryTable;
