import React, { useState } from "react";
import './App.css';

const initialState = {
  "Solar_Power(kW)": 25,
  "Wind_Power(kW)": 15,
  "DG_Power(kW)": 10,
  "UPS_Power(kW)": 5,
  "Battery_Percentage(%)": 75,
  "Total_Load_Demand(kW)": 50,
  "Critical_Load(kW)": 25,
  "Non_Critical_Load(kW)": 25,
  "Grid_Status": 1,
  "Grid_Power(kW)": 100,
  "MCB_1_Power(kW)": 8,
  "MCB_1_Priority": 1,
  "MCB_2_Power(kW)": 7,
  "MCB_2_Priority": 2,
  "MCB_3_Power(kW)": 6,
  "MCB_3_Priority": 3,
  "MCB_4_Power(kW)": 5,
  "MCB_4_Priority": 7,
  "MCB_5_Power(kW)": 5,
  "MCB_5_Priority": 8,
  "MCB_6_Power(kW)": 4,
  "MCB_6_Priority": 9,
  "MCB_7_Power(kW)": 3,
  "MCB_7_Priority": 10,
  "MCB_8_Power(kW)": 2,
  "MCB_8_Priority": 11
};

function App() {
  const [inputs, setInputs] = useState(initialState);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: Number(e.target.value) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs)
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert(`Error: ${error.message}. Make sure the backend server is running.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Energy Management System</h1>
      <div className="grid-status">
        <h2>Grid Status: 
          <select 
            name="Grid_Status" 
            value={inputs["Grid_Status"]} 
            onChange={(e) => setInputs({...inputs, "Grid_Status": Number(e.target.value)})}>
            <option value={1}>Active</option>
            <option value={0}>Failure</option>
          </select>
        </h2>
      </div>
      
      <form onSubmit={handleSubmit} className="input-form">
        <div className="form-sections">
          <div className="form-section">
            <h3>Power Sources</h3>
            <div className="form-group">
              <label>Grid Power (kW)</label>
              <input 
                type="number" 
                name="Grid_Power(kW)" 
                value={inputs["Grid_Power(kW)"]} 
                onChange={handleChange} 
                step="any" 
                min="0" 
                required 
                disabled={inputs["Grid_Status"] === 0}
              />
            </div>
            <div className="form-group">
              <label>Solar Power (kW)</label>
              <input type="number" name="Solar_Power(kW)" value={inputs["Solar_Power(kW)"]} onChange={handleChange} step="any" min="0" required />
            </div>
            <div className="form-group">
              <label>Wind Power (kW)</label>
              <input type="number" name="Wind_Power(kW)" value={inputs["Wind_Power(kW)"]} onChange={handleChange} step="any" min="0" required />
            </div>
            <div className="form-group">
              <label>DG Power (kW)</label>
              <input type="number" name="DG_Power(kW)" value={inputs["DG_Power(kW)"]} onChange={handleChange} step="any" min="0" required />
            </div>
            <div className="form-group">
              <label>UPS Power (kW)</label>
              <input type="number" name="UPS_Power(kW)" value={inputs["UPS_Power(kW)"]} onChange={handleChange} step="any" min="0" required />
            </div>
            <div className="form-group">
              <label>Battery Percentage (%)</label>
              <input type="number" name="Battery_Percentage(%)" value={inputs["Battery_Percentage(%)"]} onChange={handleChange} min="0" max="100" required />
            </div>
          </div>
          
          <div className="form-section">
            <h3>Load Information</h3>
            <div className="form-group">
              <label>Total Load Demand (kW)</label>
              <input type="number" name="Total_Load_Demand(kW)" value={inputs["Total_Load_Demand(kW)"]} onChange={handleChange} step="any" min="0" required />
            </div>
            <div className="form-group">
              <label>Critical Load (kW)</label>
              <input type="number" name="Critical_Load(kW)" value={inputs["Critical_Load(kW)"]} onChange={handleChange} step="any" min="0" required />
            </div>
            <div className="form-group">
              <label>Non-Critical Load (kW)</label>
              <input type="number" name="Non_Critical_Load(kW)" value={inputs["Non_Critical_Load(kW)"]} onChange={handleChange} step="any" min="0" required />
            </div>
          </div>
          
          <div className="form-section">
            <h3>MCB Information</h3>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(mcb => (
              <div className="mcb-group" key={mcb}>
                <label>MCB {mcb} ({mcb <= 3 ? "Critical" : "Non-Critical"})</label>
                <div className="mcb-inputs">
                  <div className="form-group">
                    <label>Power (kW)</label>
                    <input 
                      type="number" 
                      name={`MCB_${mcb}_Power(kW)`} 
                      value={inputs[`MCB_${mcb}_Power(kW)`]} 
                      onChange={handleChange} 
                      step="any" 
                      min="0" 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Priority</label>
                    <input 
                      type="number" 
                      name={`MCB_${mcb}_Priority`} 
                      value={inputs[`MCB_${mcb}_Priority`]} 
                      onChange={handleChange} 
                      min="1" 
                      required 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? "Calculating..." : "Calculate Optimal Configuration"}
        </button>
      </form>
      {result && (
        <div className="result">
          <h2>Prediction Results</h2>
          <div className="result-section">
            <h3>Load Priority: {Math.round(result.priority * 100)}%</h3>
            <h3>Optimal Source: {result.optimal_source.replace(/_Power\(kW\)/, '')}</h3>
            <h3>Grid Status: {result.grid_status}</h3>
          </div>
          
          <div className="power-management-results">
            <h3>Power Management</h3>
            
            {result.power_management.demand_exceeds_supply && (
              <div className="power-warning">
                <h4>Warning: Demand Exceeds Available Supply</h4>
                <p>Total Demand: {result.power_management.total_demand.toFixed(2)} kW</p>
                <p>Available Power: {result.power_management.total_available_power.toFixed(2)} kW</p>
                <p>Shortage: {(result.power_management.total_demand - result.power_management.total_available_power).toFixed(2)} kW</p>
                <p className="warning-message">Non-critical MCBs will be turned off based on priority</p>
              </div>
            )}
            
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
            
            <h4>MCB Status Recommendations</h4>
            <div className="mcb-status-table">
              <div className="mcb-status-header">
                <div>MCB</div>
                <div>Status</div>
                <div>Power (kW)</div>
                <div>Priority</div>
              </div>
              {Object.entries(result.power_management.mcb_statuses).sort((a, b) => {
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
                    <div>{inputs[`${mcb}_Power(kW)`]} kW</div>
                    <div>{inputs[`${mcb}_Priority`]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
