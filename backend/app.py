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

# Grid power state management
grid_state = {
    "power": 0.0,          # Grid power in kW
    "voltage": 220.0,      # Grid voltage in V
    "current": 0.0,        # Grid current in A
    "status": 0,           # 0 = offline/failed, 1 = online/active
    "frequency": 50.0,     # Grid frequency in Hz
    "last_updated": None   # Timestamp of last update
}

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

# Grid power management endpoints
@app.route("/api/grid/power", methods=["POST"])
def set_grid_power():
    """Set grid power values manually"""
    try:
        data = request.json
        
        # Update grid state with provided values
        if "power" in data:
            grid_state["power"] = float(data["power"])
        if "voltage" in data:
            grid_state["voltage"] = float(data["voltage"])
        if "current" in data:
            grid_state["current"] = float(data["current"])
        if "status" in data:
            grid_state["status"] = int(data["status"])
        if "frequency" in data:
            grid_state["frequency"] = float(data["frequency"])
            
        # Update timestamp
        from datetime import datetime
        grid_state["last_updated"] = datetime.now().isoformat()
        
        # Calculate power if not provided but voltage and current are
        if "power" not in data and "voltage" in data and "current" in data:
            grid_state["power"] = (grid_state["voltage"] * grid_state["current"]) / 1000.0
            
        return jsonify({
            "status": "success",
            "message": "Grid power values updated successfully",
            "data": grid_state
        })
        
    except ValueError as e:
        return jsonify({
            "status": "error",
            "message": f"Invalid numeric value: {str(e)}"
        }), 400
    except Exception as e:
        return jsonify({
            "status": "error", 
            "message": f"Failed to update grid power: {str(e)}"
        }), 500

@app.route("/api/grid/power", methods=["GET"])
def get_grid_power():
    """Get current grid power values"""
    try:
        return jsonify({
            "status": "success",
            "data": grid_state
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to get grid power: {str(e)}"
        }), 500

@app.route("/api/grid/status", methods=["GET"])
def get_grid_status():
    """Get grid connection status and quality metrics"""
    try:
        # Calculate data age
        data_age = None
        if grid_state["last_updated"]:
            from datetime import datetime
            last_update = datetime.fromisoformat(grid_state["last_updated"])
            data_age = (datetime.now() - last_update).total_seconds()
        
        # Determine status based on values and age
        is_online = grid_state["status"] == 1
        is_recent = data_age is not None and data_age < 300  # 5 minutes
        voltage_ok = 200 <= grid_state["voltage"] <= 250
        frequency_ok = 49 <= grid_state["frequency"] <= 51
        
        quality = "good" if (is_online and voltage_ok and frequency_ok) else "poor"
        
        return jsonify({
            "status": "success",
            "data": {
                "connected": is_online,
                "quality": quality,
                "data_age": data_age,
                "voltage_status": "normal" if voltage_ok else "abnormal",
                "frequency_status": "normal" if frequency_ok else "abnormal",
                "last_update": grid_state["last_updated"],
                "power_available": grid_state["power"] > 0.1
            }
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to get grid status: {str(e)}"
        }), 500

@app.route("/api/grid/reset", methods=["POST"])
def reset_grid_power():
    """Reset grid power values to default"""
    try:
        grid_state.update({
            "power": 0.0,
            "voltage": 220.0,
            "current": 0.0,
            "status": 0,
            "frequency": 50.0,
            "last_updated": None
        })
        
        return jsonify({
            "status": "success",
            "message": "Grid power values reset to default",
            "data": grid_state
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to reset grid power: {str(e)}"
        }), 500

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

@app.route("/api/mcb/status", methods=["GET"])
def get_mcb_status():
    """Get MCB ON/OFF status as JSON with 1=ON, 0=OFF"""
    try:
        # This would typically come from your actual MCB control system
        # For demonstration, I'll create a sample MCB status based on power availability and grid status
        
        # Determine which MCBs should be ON based on grid status and power availability
        grid_online = grid_state["status"] == 1
        power_available = grid_state["power"] > 0.1
        
        # Sample MCB statuses - in a real system, these would come from actual MCB states
        # MCBs 1-3 are critical loads, MCBs 4-8 are non-critical
        mcb_statuses = {}
        
        if grid_online and power_available:
            # Grid is online and has power - all MCBs can be ON
            for i in range(1, 9):  # MCBs 1-8
                mcb_statuses[f"relay{i}"] = 1
        elif power_available:
            # Power available but grid might be unstable - only critical MCBs ON
            for i in range(1, 5):  # MCBs 1-3 (critical)
                mcb_statuses[f"relay{i}"] = 1
        else:
            # No power available - all MCBs OFF
            for i in range(1, 5):  # MCBs 1-8
                mcb_statuses[f"relay{i}"] = 0
        
        from datetime import datetime
        response = {
                "mcb_statuses": mcb_statuses
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to get MCB status: {str(e)}"
        }), 500

@app.route("/api/mcb/detailed", methods=["GET"])
def get_mcb_detailed():
    """Get detailed MCB information including status, power, and priority"""
    try:
        # Get MCB power data from the latest prediction or default values
        mcb_data = {}
        
        # Sample MCB configuration - in real system this would come from database/config
        default_mcbs = [
            {"id": 1, "name": "Critical Load 1", "power": 8.0, "priority": 1, "is_critical": True},
            {"id": 2, "name": "Critical Load 2", "power": 7.0, "priority": 2, "is_critical": True},
            {"id": 3, "name": "Critical Load 3", "power": 6.0, "priority": 3, "is_critical": True},
            {"id": 4, "name": "Non-Critical Load 1", "power": 5.0, "priority": 7, "is_critical": False},
            {"id": 5, "name": "Non-Critical Load 2", "power": 5.0, "priority": 8, "is_critical": False},
            {"id": 6, "name": "Non-Critical Load 3", "power": 4.0, "priority": 9, "is_critical": False},
            {"id": 7, "name": "Non-Critical Load 4", "power": 3.0, "priority": 10, "is_critical": False},
            {"id": 8, "name": "Non-Critical Load 5", "power": 2.0, "priority": 11, "is_critical": False}
        ]
        
        # Determine MCB status based on grid conditions
        grid_online = grid_state["status"] == 1
        power_available = grid_state["power"] > 0.1
        available_power = grid_state["power"]
        
        total_critical_power = sum(mcb["power"] for mcb in default_mcbs if mcb["is_critical"])
        total_power_demand = sum(mcb["power"] for mcb in default_mcbs)
        
        for mcb in default_mcbs:
            mcb_id = f"MCB_{mcb['id']}"
            
            # Determine if this MCB should be ON
            if not power_available:
                status = 0  # No power available
            elif mcb["is_critical"]:
                status = 1  # Critical loads always ON if power available
            elif grid_online and available_power >= total_power_demand:
                status = 1  # Enough power for all loads
            elif available_power >= total_critical_power + mcb["power"]:
                status = 1  # Enough power for critical + this non-critical load
            else:
                status = 0  # Not enough power
            
            mcb_data[mcb_id] = {
                "status": status,
                "name": mcb["name"],
                "power_kw": mcb["power"],
                "priority": mcb["priority"],
                "is_critical": mcb["is_critical"]
            }
        
        from datetime import datetime
        response = {
            "status": "success",
            "data": {
                "mcbs": mcb_data,
                "summary": {
                    "total_mcbs": len(default_mcbs),
                    "mcbs_on": sum(1 for mcb in mcb_data.values() if mcb["status"] == 1),
                    "mcbs_off": sum(1 for mcb in mcb_data.values() if mcb["status"] == 0),
                    "total_power_demand": total_power_demand,
                    "active_power_load": sum(mcb["power_kw"] for mcb in mcb_data.values() if mcb["status"] == 1),
                    "grid_power_available": available_power
                },
                "grid_conditions": {
                    "grid_online": grid_online,
                    "power_available": power_available,
                    "grid_status": grid_state["status"],
                    "grid_power_kw": grid_state["power"]
                },
                "timestamp": datetime.now().isoformat()
            },
            "message": "Detailed MCB information retrieved successfully"
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to get detailed MCB information: {str(e)}"
        }), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
