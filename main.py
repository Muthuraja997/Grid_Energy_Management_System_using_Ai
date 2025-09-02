import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta


n_rows = 100

# Start time
start_time = datetime.now()

# Generate data - with grid status
data = {
    "Timestamp": [start_time + timedelta(minutes=15*i) for i in range(n_rows)],
    "Solar_Power(kW)": np.random.uniform(0, 50, n_rows).round(2),   # 0-50 kW
    "Wind_Power(kW)": np.random.uniform(0, 30, n_rows).round(2),    # 0-30 kW
    "DG_Power(kW)": np.random.uniform(0, 20, n_rows).round(2),      # 0-20 kW
    "UPS_Power(kW)": np.random.uniform(0, 10, n_rows).round(2),     # 0-10 kW
    "Battery_Percentage(%)": np.random.randint(20, 100, n_rows),    # 20% - 100%
    "Total_Load_Demand(kW)": np.random.uniform(20, 80, n_rows).round(2),  # 20-80 kW
    "Grid_Power(kW)": np.random.uniform(0, 100, n_rows).round(2),  # 0-100 kW
    "Grid_Status": np.random.choice([0, 1], size=n_rows, p=[0.1, 0.9]),  # 0 = failure, 1 = active
}

# Critical Load = 40-70% of total load
data["Critical_Load(kW)"] = [round(val * random.uniform(0.4, 0.7), 2) for val in data["Total_Load_Demand(kW)"]]

# Non-Critical Load = Total Load - Critical Load
data["Non_Critical_Load(kW)"] = (data["Total_Load_Demand(kW)"] - pd.Series(data["Critical_Load(kW)"])).round(2)

# Convert to DataFrame
df = pd.DataFrame(data)

# Add load priorities (simulated MCBs)
num_mcbs = 8  # Number of MCB circuits
for i in range(1, num_mcbs+1):
    is_critical = i <= 3  # First 3 MCBs are considered critical (e.g., emergency lighting, servers)
    priority_level = i if is_critical else i + 3  # Critical loads have higher priority (lower number)
    power_usage = np.random.uniform(2, 8, n_rows).round(2)  # Power usage of each MCB
    df[f"MCB_{i}_Priority"] = priority_level
    df[f"MCB_{i}_Power(kW)"] = power_usage
    df[f"MCB_{i}_Status"] = 1  # 1 = ON, 0 = OFF

# Save as CSV
df.to_csv("energy_dataset.csv", index=False)


# --- ML Model for Priority Demand & Optimal Source ---
import sklearn
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

# Load the dataset
df = pd.read_csv("energy_dataset.csv")

# Features (exclude Timestamp)
features = [
    "Solar_Power(kW)", "Wind_Power(kW)", "DG_Power(kW)", "UPS_Power(kW)",
    "Battery_Percentage(%)", "Total_Load_Demand(kW)", "Critical_Load(kW)", "Non_Critical_Load(kW)"
]
X = df[features]


# Target A: Priority as a number (percentage of critical load)
df["Priority"] = (df["Critical_Load(kW)"] / df["Total_Load_Demand(kW)"]).round(2)
y_priority = df["Priority"]

# Target B: Optimal source (choose source with max available power)
source_cols = ["Solar_Power(kW)", "Wind_Power(kW)", "DG_Power(kW)", "UPS_Power(kW)"]
df["Optimal_Source"] = df[source_cols].idxmax(axis=1)
y_source = df["Optimal_Source"]

# Train/test split
X_train, X_test, y_priority_train, y_priority_test, y_source_train, y_source_test = train_test_split(
    X, y_priority, y_source, test_size=0.2, random_state=42
)


# Model for Priority (regression)
from sklearn.ensemble import RandomForestRegressor
priority_reg = RandomForestRegressor(random_state=42)
priority_reg.fit(X_train, y_priority_train)
priority_pred = priority_reg.predict(X_test)

# Model for Optimal Source
source_clf = RandomForestClassifier(random_state=42)
source_clf.fit(X_train, y_source_train)
source_pred = source_clf.predict(X_test)


# Show sample predictions
print("\nSample predictions (first 5 rows):")
for i in range(5):
    print(f"Row {i+1}: Priority={priority_pred[i]:.2f}, Optimal Source={source_pred[i]}")


# Show accuracy
from sklearn.metrics import mean_squared_error, accuracy_score
priority_mse = mean_squared_error(y_priority_test, priority_pred)
print(f"\nPriority prediction MSE: {priority_mse:.4f}")
print(f"Optimal source prediction accuracy: {accuracy_score(y_source_test, source_pred):.2f}")
