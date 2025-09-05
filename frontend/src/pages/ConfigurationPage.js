import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';

function ConfigurationPage({ mcbs, handleMcbChange, addMcb, removeMcb }) {
  const navigate = useNavigate();

  return (
    <div className="container">
      <h1>Energy Management System</h1>
      
      <div className="page-navigation">
        <div className="nav-item">
          <Link to="/">1. Input Details</Link>
        </div>
        <div className="nav-item active">2. Configuration</div>
        <div className="nav-item">
          <Link to="/dashboard">3. Dashboard & History</Link>
        </div>
      </div>
      
      <div className="form-section full-width">
        <div className="section-header">
          <h3>MCB Configuration</h3>
          <button type="button" className="add-button" onClick={addMcb}>
            + Add MCB
          </button>
        </div>
        <p className="section-desc">Configure the power and priority for each MCB (Miniature Circuit Breaker)</p>
        
        <div className="mcb-grid">
          {mcbs.map(mcb => (
            <div 
              className="mcb-group" 
              key={mcb.id} 
              data-critical={mcb.isCritical ? "true" : "false"}
            >
              <div className="mcb-header">
                <label>MCB {mcb.id} ({mcb.isCritical ? "Critical" : "Non-Critical"})</label>
                <button 
                  type="button" 
                  className="remove-button" 
                  onClick={() => removeMcb(mcb.id)}
                >
                  ✕
                </button>
              </div>
              <div className="mcb-inputs">
                <div className="form-group">
                  <label>Power (kW)</label>
                  <input 
                    type="number" 
                    value={mcb.power} 
                    onChange={(e) => handleMcbChange(mcb.id, 'power', e.target.value)} 
                    step="any" 
                    min="0" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <input 
                    type="number" 
                    value={mcb.priority} 
                    onChange={(e) => handleMcbChange(mcb.id, 'priority', e.target.value)} 
                    min="1" 
                    required 
                  />
                </div>
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={mcb.isCritical} 
                    onChange={(e) => handleMcbChange(mcb.id, 'isCritical', e.target.checked)} 
                  />
                  Critical Load
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="navigation-buttons">
        <button 
          onClick={() => navigate('/')} 
          className="back-button"
        >
          Back: Input Details
        </button>
        <button 
          onClick={() => navigate('/dashboard')} 
          className="next-button"
        >
          Next: View Dashboard
        </button>
      </div>
    </div>
  );
}

export default ConfigurationPage;
