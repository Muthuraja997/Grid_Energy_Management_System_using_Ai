import pickle
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier

# Load the dataset
# (Assume energy_dataset.csv is present)
df = pd.read_csv("../energy_dataset.csv")
features = [
    "Solar_Power(kW)", "Wind_Power(kW)", "DG_Power(kW)", "UPS_Power(kW)",
    "Battery_Percentage(%)", "Total_Load_Demand(kW)", "Critical_Load(kW)", "Non_Critical_Load(kW)"
]
X = df[features]
df["Priority"] = (df["Critical_Load(kW)"] / df["Total_Load_Demand(kW)"]).round(2)
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
# Save models
with open("priority_reg.pkl", "wb") as f:
    pickle.dump(priority_reg, f)
with open("source_clf.pkl", "wb") as f:
    pickle.dump(source_clf, f)
