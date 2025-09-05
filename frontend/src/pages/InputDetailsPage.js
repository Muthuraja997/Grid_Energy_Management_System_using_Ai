import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';

function InputDetailsPage({ 
  state, 
  powerSources, 
  batteryPercentage,
  gridStatus,
  handlePowerSourceChange, 
  handleBatteryPercentageChange,
  handleGridStatusChange,
  addPowerSource,
  removePowerSource
}) {
  const navigate = useNavigate();
  const [newPowerSource, setNewPowerSource] = useState({
    id: "",
    name: "",
    value: 0,
    unit: "kW"
  });
  
  const handleNewSourceChange = (e) => {
    const { name, value } = e.target;
    setNewPowerSource(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleAddPowerSource = () => {
    if (!newPowerSource.id || !newPowerSource.name) {
      alert("Power source ID and name are required");
      return;
    }
    
    // Check if ID already exists
    if (powerSources.some(source => source.id === newPowerSource.id)) {
      alert("A power source with this ID already exists");
      return;
    }
    
    addPowerSource(newPowerSource);
    setNewPowerSource({ id: "", name: "", value: 0, unit: "kW" });
  };
  
  return (
    <div className="container">
      <h1>Energy Management System</h1>
      
      <div className="page-navigation">
        <div className="nav-item active">1. Input Details</div>
        <div className="nav-item">
          <Link to="/configuration">2. Configuration</Link>
        </div>
        <div className="nav-item">
          <Link to="/dashboard">3. Dashboard & History</Link>
        </div>
      </div>
      
      <div className="grid-status">
        <h2>Grid Status: 
          <select 
            value={gridStatus} 
            onChange={(e) => handleGridStatusChange(e.target.value)}>
            <option value={1}>Active</option>
            <option value={0}>Failure</option>
          </select>
        </h2>
      </div>
      
      <div className="form-sections">
        <div className="form-section">
          <div className="section-header">
            <h3>Power Sources</h3>
            <button 
              type="button" 
              className="add-button" 
              onClick={() => document.getElementById('add-power-source-form').style.display = 'block'}
            >
              + Add Power Source
            </button>
          </div>
          
          {powerSources.map((source) => (
            <div className="form-group power-source-item" key={source.id}>
              <div className="power-source-header">
                <label>{source.name}</label>
                {!source.isFixed && (
                  <button 
                    type="button" 
                    className="remove-button" 
                    onClick={() => removePowerSource(source.id)}
                  >
                    ✕
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  value={source.value} 
                  onChange={(e) => handlePowerSourceChange(source.id, e.target.value)} 
                  step="any" 
                  min="0" 
                  required 
                  disabled={source.id === "Grid_Power" && gridStatus === 0}
                  className={`input-with-unit ${source.id === "Grid_Power" && gridStatus === 0 ? "readonly-input" : ""}`}
                />
                <span className="unit-label">{source.unit}</span>
              </div>
            </div>
          ))}
          
          <div className="form-group">
            <label>Battery Percentage (%)</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="number" 
                value={batteryPercentage} 
                onChange={(e) => handleBatteryPercentageChange(e.target.value)} 
                min="0" 
                max="100" 
                required 
                className="input-with-unit"
              />
              <span className="unit-label">%</span>
            </div>
          </div>
          
          {/* Add Power Source Form */}
          <div id="add-power-source-form" className="add-form" style={{ display: 'none' }}>
            <h4>Add New Power Source</h4>
            <div className="form-group">
              <label>Source ID (no spaces)</label>
              <input 
                type="text" 
                name="id" 
                value={newPowerSource.id} 
                onChange={handleNewSourceChange} 
                placeholder="e.g. Hydro_Power" 
                required 
              />
            </div>
            <div className="form-group">
              <label>Source Name</label>
              <input 
                type="text" 
                name="name" 
                value={newPowerSource.name} 
                onChange={handleNewSourceChange} 
                placeholder="e.g. Hydro Power" 
                required 
              />
            </div>
            <div className="form-group">
              <label>Initial Value</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  name="value" 
                  value={newPowerSource.value} 
                  onChange={handleNewSourceChange} 
                  step="any" 
                  min="0"
                  className="input-with-unit" 
                />
                <span className="unit-label">{newPowerSource.unit}</span>
              </div>
            </div>
            <div className="form-group">
              <label>Unit</label>
              <input 
                type="text" 
                name="unit" 
                value={newPowerSource.unit} 
                onChange={handleNewSourceChange} 
                placeholder="kW" 
              />
            </div>
            <div className="form-buttons">
              <button 
                type="button" 
                className="cancel-button" 
                onClick={() => document.getElementById('add-power-source-form').style.display = 'none'}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="save-button" 
                onClick={handleAddPowerSource}
              >
                Add Power Source
              </button>
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Load Information (Auto-Calculated)</h3>
          <div className="form-group">
            <label>Total Load Demand (kW)</label>
            <div style={{ position: 'relative' }}>
              <input type="number" value={state["Total_Load_Demand(kW)"]} readOnly className="readonly-input input-with-unit" />
              <span className="unit-label">kW</span>
            </div>
          </div>
          <div className="form-group">
            <label>Critical Load (kW)</label>
            <div style={{ position: 'relative' }}>
              <input type="number" value={state["Critical_Load(kW)"]} readOnly className="readonly-input input-with-unit" />
              <span className="unit-label">kW</span>
            </div>
          </div>
          <div className="form-group">
            <label>Non-Critical Load (kW)</label>
            <div style={{ position: 'relative' }}>
              <input type="number" value={state["Non_Critical_Load(kW)"]} readOnly className="readonly-input input-with-unit" />
              <span className="unit-label">kW</span>
            </div>
          </div>
        </div>
      </div>

      <div className="navigation-buttons">
        <button 
          onClick={() => navigate('/configuration')} 
          className="next-button"
        >
          Next: Configure MCBs
        </button>
      </div>
    </div>
  );
}

export default InputDetailsPage;
