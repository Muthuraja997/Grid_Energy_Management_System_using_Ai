import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';
import '../ai-priority.css';
import '../mcb-professional.css';

function ConfigurationPage({ mcbs, handleMcbChange, addMcb, removeMcb }) {
  const navigate = useNavigate();
  const [aiPriorities, setAiPriorities] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [predictedPriorities, setPredictedPriorities] = React.useState({});

  // Update priorities when MCBs change
  React.useEffect(() => {
    if (aiPriorities) {
      const updatedPredictions = {};
      mcbs.forEach(mcb => {
        const priority = calculatePriority(mcb, aiPriorities);
        updatedPredictions[mcb.id] = priority;
      });
      setPredictedPriorities(updatedPredictions);
    }
  }, [mcbs, aiPriorities]);

  React.useEffect(() => {
    // Fetch AI priorities when component mounts
    fetch('http://localhost:5000/priorities')
      .then(response => response.json())
      .then(data => {
        console.log('AI Priorities loaded:', data);
        setAiPriorities(data);
        setLoading(false);
        // Initialize predicted priorities for existing MCBs immediately
        const initialPredictions = {};
        mcbs.forEach(mcb => {
          const priority = calculatePriority(mcb, data);
          initialPredictions[mcb.id] = priority;
          console.log(`MCB ${mcb.id} priority: ${priority}`);
        });
        setPredictedPriorities(initialPredictions);
      })
      .catch(error => {
        console.error('Error fetching AI priorities:', error);
        setLoading(false);
        // Set fallback priorities
        const fallbackPredictions = {};
        mcbs.forEach(mcb => {
          fallbackPredictions[mcb.id] = mcb.isCritical ? 1 : 5;
        });
        setPredictedPriorities(fallbackPredictions);
      });
  }, []);

  // Calculate priority based on MCB type and criticality
  const calculatePriority = (mcb, priorities) => {
    if (!priorities || !priorities.priorities) {
      // Fallback calculation
      return mcb.isCritical ? 1 : 5;
    }
    
    const category = mcb.isCritical ? 'critical' : 'non_critical';
    const mcbType = mcb.isCritical ? 'hospital_equipment' : 'general_purpose';
    
    const priorityValue = priorities.priorities[category]?.[mcbType];
    console.log(`Calculating priority for MCB ${mcb.id}: category=${category}, type=${mcbType}, priority=${priorityValue}`);
    
    return priorityValue || (mcb.isCritical ? 1 : 5);
  };

  const getAiReasoning = (mcb) => {
    if (!aiPriorities) return null;
    const category = mcb.isCritical ? 'critical' : 'non_critical';
    const mcbType = mcb.isCritical ? 
      (mcb.type || 'hospital_equipment') : 
      (mcb.type || 'general_purpose');
    return aiPriorities.ai_reasoning?.[category]?.[mcbType];
  };

  // Handle critical checkbox change with priority update
  const handleCriticalChange = (mcbId, value) => {
    const mcb = mcbs.find(m => m.id === mcbId);
    if (mcb) {
      // Create updated MCB object
      const updatedMcb = { ...mcb, isCritical: value };
      
      // Calculate new priority immediately
      const newPriority = aiPriorities ? calculatePriority(updatedMcb, aiPriorities) : (value ? 1 : 5);
      
      console.log(`MCB ${mcbId} critical changed to ${value}, new priority: ${newPriority}`);
      
      // Update UI prediction immediately
      setPredictedPriorities(prev => ({
        ...prev,
        [mcbId]: newPriority
      }));

      // Update both critical status and priority
      handleMcbChange(mcbId, 'isCritical', value);
      handleMcbChange(mcbId, 'priority', newPriority);
    }
  };

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
      
      <div className="ai-info-banner">
        {!loading && aiPriorities?.metadata && (
          <div className="ai-metadata">
            <h4>AI-Powered Priority Management System</h4>
            <p>{aiPriorities.metadata.description}</p>
            <p className="ai-version">Version: {aiPriorities.metadata.version} | Last Updated: {aiPriorities.metadata.last_updated}</p>
          </div>
        )}
      </div>

      <div className="form-section full-width">
        <div className="section-header">
          <h3>MCB Configuration</h3>
          <button type="button" className="add-button" onClick={addMcb}>
            + Add MCB
          </button>
        </div>
        <p className="section-desc">Configure the power and priority for each MCB (Miniature Circuit Breaker) - AI-assisted priority recommendations provided</p>
        
        <div className="mcb-configuration-container">
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
              <div className="ai-priority-info">
                <div className="ai-badge">AI Priority Prediction</div>
                {loading ? (
                  <p>Loading AI analysis...</p>
                ) : (
                  <>
                    <div className="ai-prediction">
                      <span className="prediction-label">Predicted Priority:</span>
                      <span className="prediction-value">
                        {predictedPriorities[mcb.id] !== undefined ? predictedPriorities[mcb.id] : (mcb.isCritical ? 1 : 5)}
                      </span>
                    </div>
                    <div className="ai-reasoning">
                      <p>{getAiReasoning(mcb) || "AI analysis: " + (mcb.isCritical ? "Critical system requiring immediate power" : "Non-critical system with flexible operation")}</p>
                    </div>
                  </>
                )}
              </div>
              <div className="mcb-inputs">
                <div className="form-group mcb-critical-group">
                  <label className="critical-checkbox">
                    <input
                      type="checkbox"
                      checked={mcb.isCritical}
                      onChange={(e) => handleCriticalChange(mcb.id, e.target.checked)}
                    />
                    <span className="critical-label">Critical Load</span>
                    <span className="priority-value">Priority: {mcb.priority}</span>
                  </label>
                </div>
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
