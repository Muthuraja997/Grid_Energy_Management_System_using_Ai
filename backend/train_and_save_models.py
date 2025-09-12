import pickle
import pandas as pd
import numpy as np
import json
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier

# Default MCB priorities configuration - AI-determined based on critical analysis
default_mcb_priorities = {
    "metadata": {
        "source": "AI Analysis",
        "description": "Priorities determined by AI based on criticality analysis and impact assessment",
        "last_updated": "2025-09-12",
        "version": "1.0"
    },
    "critical": {
        "hospital_equipment": {
            "priority": 1,
            "ai_reasoning": "Life-critical systems requiring immediate power"
        },
        "emergency_systems": {
            "priority": 2,
            "ai_reasoning": "Essential for safety and emergency response"
        },
        "data_centers": {
            "priority": 3,
            "ai_reasoning": "Critical for maintaining operational continuity"
        },
        "industrial_machines": {
            "priority": 4,
            "ai_reasoning": "Important for production but can handle brief interruptions"
        }
    },
    "non_critical": {
        "lighting": {
            "priority": 5,
            "ai_reasoning": "Can be temporarily reduced without major impact"
        },
        "hvac": {
            "priority": 6,
            "ai_reasoning": "Can operate at reduced capacity temporarily"
        },
        "general_purpose": {
            "priority": 7,
            "ai_reasoning": "Non-essential systems with flexible operation"
        },
        "auxiliary": {
            "priority": 8,
            "ai_reasoning": "Support systems with lowest operational priority"
        }
    }
}

# Save default priorities configuration
with open("default_priorities.json", "w") as f:
    json.dump(default_mcb_priorities, f, indent=4)

# Load the dataset from the dataset folder
df = pd.read_csv("../dataset/energy_dataset.csv")
features = [
    "Solar_Power(kW)", "Wind_Power(kW)", "DG_Power(kW)", "UPS_Power(kW)",
    "Battery_Percentage(%)", "Total_Load_Demand(kW)", "Critical_Load(kW)", "Non_Critical_Load(kW)"
]
X = df[features]

# Calculate base priority based on critical load ratio
df["Base_Priority"] = (df["Critical_Load(kW)"] / df["Total_Load_Demand(kW)"]).round(2)

# Enhance priority calculation with MCB weighting
def calculate_mcb_priority(row):
    critical_weight = 0.7  # Give 70% weight to critical loads
    base_priority = row["Base_Priority"]
    
    # Adjust priority based on load type and predefined MCB priorities
    if row["Critical_Load(kW)"] > row["Non_Critical_Load(kW)"]:
        return base_priority * critical_weight + (1 - critical_weight)
    else:
        return base_priority * critical_weight

df["Priority"] = df.apply(calculate_mcb_priority, axis=1)
y_priority = df["Priority"]
source_cols = ["Solar_Power(kW)", "Wind_Power(kW)", "DG_Power(kW)", "UPS_Power(kW)"]
df["Optimal_Source"] = df[source_cols].idxmax(axis=1)
y_source = df["Optimal_Source"]
X_train, X_test, y_priority_train, y_priority_test, y_source_train, y_source_test = train_test_split(
    X, y_priority, y_source, test_size=0.2, random_state=42
)
priority_reg = RandomForestRegressor(random_state=42)
priority_reg.fit(X_train, y_priority_train)
source_clf = RandomForestClassifier(random_state=42)
source_clf.fit(X_train, y_source_train)
# Flatten the priorities for saving with models
flattened_priorities = {
    "critical": {k: v["priority"] for k, v in default_mcb_priorities["critical"].items()},
    "non_critical": {k: v["priority"] for k, v in default_mcb_priorities["non_critical"].items()}
}

# Save models and priorities
with open("priority_reg.pkl", "wb") as f:
    pickle.dump(priority_reg, f)
with open("source_clf.pkl", "wb") as f:
    pickle.dump(source_clf, f)
with open("default_priorities.json", "w") as f:
    json.dump(default_mcb_priorities, f, indent=4)
