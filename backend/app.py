from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import sys
import os

# Add parent directory to path to import grid_failure_handler
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from grid_failure_handler import simulate_grid_failure

app = Flask(__name__)
CORS(app)

# Load models
with open("priority_reg.pkl", "rb") as f:
    priority_reg = pickle.load(f)
with open("source_clf.pkl", "rb") as f:
    source_clf = pickle.load(f)

FEATURES = [
    "Solar_Power(kW)", "Wind_Power(kW)", "DG_Power(kW)", "UPS_Power(kW)",
    "Battery_Percentage(%)", "Total_Load_Demand(kW)", "Critical_Load(kW)", "Non_Critical_Load(kW)"
]

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    X = np.array([[data[feature] for feature in FEATURES]])
    priority = float(priority_reg.predict(X)[0])
    optimal_source = str(source_clf.predict(X)[0])
    
    # Get grid status and power
    grid_status = data.get("Grid_Status", 0)  # Default to 0 (failed) if not provided
    grid_power = data.get("Grid_Power(kW)", 0)  # Default to 0 if not provided
    
    result = {
        "priority": priority,
        "optimal_source": "Grid_Power(kW)" if grid_status == 1 else optimal_source
    }
    
    # Extract MCB power values
    mcb_powers = {}
    for key in data:
        if key.startswith("MCB_") and key.endswith("_Power(kW)"):
            mcb_id = key.replace("_Power(kW)", "")
            mcb_powers[mcb_id] = data[key]
    
    # Simulate power management response
    power_response = simulate_grid_failure(
        data["Solar_Power(kW)"], 
        data["Wind_Power(kW)"], 
        data["DG_Power(kW)"], 
        data["UPS_Power(kW)"],
        data["Battery_Percentage(%)"],
        data["Total_Load_Demand(kW)"],
        mcb_powers,
        grid_status,
        grid_power
    )
    
    result["grid_status"] = "Active" if grid_status == 1 else "Failure"
    result["power_management"] = power_response
    
    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
