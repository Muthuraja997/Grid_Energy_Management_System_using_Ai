from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import sys
import os
from priority_manager import PriorityManager

# Add parent directory to path to import grid_failure_handler
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from grid_failure_handler import simulate_grid_failure

app = Flask(__name__)
CORS(app)

# Initialize priority manager
priority_manager = PriorityManager()

# Define model paths
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
PRIORITY_MODEL_PATH = os.path.join(MODEL_DIR, "priority_reg.pkl")
SOURCE_MODEL_PATH = os.path.join(MODEL_DIR, "source_clf.pkl")

# Load models
try:
    with open(PRIORITY_MODEL_PATH, "rb") as f:
        priority_reg = pickle.load(f)
    with open(SOURCE_MODEL_PATH, "rb") as f:
        source_clf = pickle.load(f)
    print("Models loaded successfully")
except Exception as e:
    print(f"Error loading models: {e}")
    # Instead of exiting, we'll set the variables to None and check in each endpoint
    priority_reg = None
    source_clf = None

FEATURES = [
    "Solar_Power(kW)", "Wind_Power(kW)", "DG_Power(kW)", "UPS_Power(kW)",
    "Battery_Percentage(%)", "Total_Load_Demand(kW)", "Critical_Load(kW)", "Non_Critical_Load(kW)"
]

@app.route("/predict", methods=["POST"])
def predict():
    try:
        # Check if models are loaded
        if priority_reg is None or source_clf is None:
            return jsonify({
                "error": "Models not loaded correctly. Please check server logs."
            }), 500
            
        data = request.json
        
        # Validate required fields
        missing_fields = [field for field in FEATURES if field not in data]
        if missing_fields:
            return jsonify({
                "error": f"Missing required fields: {', '.join(missing_fields)}"
            }), 400
        
        # Create feature array for prediction
        X = np.array([[data[feature] for feature in FEATURES]])
        
        # Make predictions
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
        
        # Validate we have MCB data
        if not mcb_powers:
            return jsonify({
                "error": "No MCB power data found in request"
            }), 400
        
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
    
    except KeyError as e:
        return jsonify({"error": f"Missing key in request: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint to verify the API is running and models are loaded"""
    try:
        # Verify models are loaded
        if 'priority_reg' not in globals() or 'source_clf' not in globals():
            return jsonify({
                "status": "error",
                "message": "Models not loaded correctly"
            }), 500
            
        return jsonify({
            "status": "healthy",
            "message": "API is running and models are loaded"
        })
    except Exception as e:
        return jsonify({
            "status": "error", 
            "message": str(e)
        }), 500

# Priority management endpoints
@app.route("/priorities", methods=["GET"])
def get_priorities():
    """Get current MCB priorities"""
    try:
        return jsonify(priority_manager.get_priorities())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/priorities/<mcb_type>/<mcb_name>", methods=["PUT"])
def update_priority(mcb_type, mcb_name):
    """Update priority for a specific MCB"""
    try:
        data = request.json
        new_priority = data.get("priority")
        if new_priority is None:
            return jsonify({"error": "Priority value not provided"}), 400
            
        success = priority_manager.update_priority(mcb_type, mcb_name, new_priority)
        if success:
            return jsonify({"message": "Priority updated successfully"})
        else:
            return jsonify({"error": "Invalid MCB type or name"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/priorities/reset", methods=["POST"])
def reset_priorities():
    """Reset priorities to default values"""
    try:
        priority_manager.reset_to_default()
        return jsonify({"message": "Priorities reset to default values"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
