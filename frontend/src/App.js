import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import './App.css';
import './fullscreen.css'; // Import the fullscreen styles
import './buttons.css'; // Import the button styles

// Import page components
import InputDetailsPage from "./pages/InputDetailsPage";
import ConfigurationPage from "./pages/ConfigurationPage";
import DashboardPage from "./pages/DashboardPage";

const initialState = {
  "powerSources": [
    { id: "Grid_Power", name: "Grid Power", value: 100, unit: "kW", isFixed: true },
    { id: "Solar_Power", name: "Solar Power", value: 25, unit: "kW", isFixed: false },
    { id: "Wind_Power", name: "Wind Power", value: 15, unit: "kW", isFixed: false },
    { id: "DG_Power", name: "DG Power", value: 10, unit: "kW", isFixed: false },
    { id: "UPS_Power", name: "UPS Power", value: 5, unit: "kW", isFixed: false }
  ],
  "Battery_Percentage(%)": 75,
  "Total_Load_Demand(kW)": 50,
  "Critical_Load(kW)": 25,
  "Non_Critical_Load(kW)": 25,
  "Grid_Status": 1,
  "mcbs": [
    { id: 1, power: 8, priority: 1, isCritical: true },
    { id: 2, power: 7, priority: 2, isCritical: true },
    { id: 3, power: 6, priority: 3, isCritical: true },
    { id: 4, power: 5, priority: 7, isCritical: false },
    { id: 5, power: 5, priority: 8, isCritical: false },
    { id: 6, power: 4, priority: 9, isCritical: false },
    { id: 7, power: 3, priority: 10, isCritical: false },
    { id: 8, power: 2, priority: 11, isCritical: false }
  ]
};

// Convert back to old format for API compatibility
const convertToApiFormat = (state) => {
  const apiFormat = {
    "Grid_Status": state.Grid_Status,
    "Battery_Percentage(%)": state["Battery_Percentage(%)"],
    "Total_Load_Demand(kW)": state["Total_Load_Demand(kW)"],
    "Critical_Load(kW)": state["Critical_Load(kW)"],
    "Non_Critical_Load(kW)": state["Non_Critical_Load(kW)"]
  };
  
  // Add power sources
  state.powerSources.forEach(source => {
    apiFormat[`${source.id}(kW)`] = source.value;
  });
  
  // Add MCBs
  state.mcbs.forEach(mcb => {
    apiFormat[`MCB_${mcb.id}_Power(kW)`] = mcb.power;
    apiFormat[`MCB_${mcb.id}_Priority`] = mcb.priority;
  });
  
  return apiFormat;
};

function App() {
  const [state, setState] = useState(initialState);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Calculate total load demand based on MCB power values
  useEffect(() => {
    // Sum up all MCB power values
    let totalLoad = 0;
    let criticalLoad = 0;
    let nonCriticalLoad = 0;
    
    state.mcbs.forEach(mcb => {
      totalLoad += mcb.power;
      
      if (mcb.isCritical) {
        criticalLoad += mcb.power;
      } else {
        nonCriticalLoad += mcb.power;
      }
    });
    
    // Update the load values
    setState(prev => ({
      ...prev,
      "Total_Load_Demand(kW)": parseFloat(totalLoad.toFixed(2)),
      "Critical_Load(kW)": parseFloat(criticalLoad.toFixed(2)),
      "Non_Critical_Load(kW)": parseFloat(nonCriticalLoad.toFixed(2))
    }));
  }, [state.mcbs]);

  // Handlers for dynamic updates
  const handlePowerSourceChange = (id, value) => {
    setState(prev => ({
      ...prev,
      powerSources: prev.powerSources.map(source => 
        source.id === id ? { ...source, value: Number(value) } : source
      )
    }));
  };

  const handleMcbChange = (id, field, value) => {
    setState(prev => ({
      ...prev,
      mcbs: prev.mcbs.map(mcb => 
        mcb.id === id ? { ...mcb, [field]: Number(value) } : mcb
      )
    }));
  };

  const addPowerSource = (newSource) => {
    setState(prev => ({
      ...prev,
      powerSources: [...prev.powerSources, { 
        id: newSource.id,
        name: newSource.name,
        value: newSource.value || 0,
        unit: newSource.unit || "kW",
        isFixed: false
      }]
    }));
  };

  const removePowerSource = (id) => {
    setState(prev => ({
      ...prev,
      powerSources: prev.powerSources.filter(source => source.id !== id)
    }));
  };

  const addMcb = () => {
    const newId = Math.max(...state.mcbs.map(mcb => mcb.id), 0) + 1;
    const isCritical = newId <= 3; // First 3 are critical by default
    
    setState(prev => ({
      ...prev,
      mcbs: [...prev.mcbs, { 
        id: newId, 
        power: 0, 
        priority: prev.mcbs.length + 1,
        isCritical
      }]
    }));
  };

  const removeMcb = (id) => {
    setState(prev => ({
      ...prev,
      mcbs: prev.mcbs.filter(mcb => mcb.id !== id)
    }));
  };

  const handleGridStatusChange = (status) => {
    setState(prev => ({
      ...prev,
      Grid_Status: Number(status)
    }));
  };

  const handleBatteryPercentageChange = (value) => {
    setState(prev => ({
      ...prev,
      "Battery_Percentage(%)": Number(value)
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      // Convert state to format expected by API
      const apiData = convertToApiFormat(state);
      
      const res = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData)
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
    <Router>
      <div className="app-container">
        <Routes>
          <Route 
            path="/" 
            element={<InputDetailsPage 
              state={state}
              powerSources={state.powerSources}
              batteryPercentage={state["Battery_Percentage(%)"]}
              gridStatus={state.Grid_Status}
              handlePowerSourceChange={handlePowerSourceChange}
              handleBatteryPercentageChange={handleBatteryPercentageChange}
              handleGridStatusChange={handleGridStatusChange}
              addPowerSource={addPowerSource}
              removePowerSource={removePowerSource}
            />} 
          />
          <Route 
            path="/configuration" 
            element={<ConfigurationPage 
              mcbs={state.mcbs}
              handleMcbChange={handleMcbChange}
              addMcb={addMcb}
              removeMcb={removeMcb}
            />} 
          />
          <Route 
            path="/dashboard" 
            element={<DashboardPage 
              state={state}
              result={result} 
              handleSubmit={handleSubmit} 
              loading={loading} 
            />} 
          />
          {/* Redirect any unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
