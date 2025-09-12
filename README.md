# Grid Energy Management System using AI

## 🚀 Overview

The **Grid Energy Management System** is an intelligent power distribution system that leverages Artificial Intelligence to optimize energy allocation across Miniature Circuit Breakers (MCBs) in electrical grids. The system provides real-time decision making for power distribution, priority management, and grid failure handling using machine learning models.

## 🧠 AI Model Architecture

### Machine Learning Components

The system employs **two main AI models** working in tandem:

#### 1. 🔢 **Priority Regression Model**
- **Algorithm**: Random Forest Regressor
- **Purpose**: Predicts priority scores for power distribution
- **Input Features**: 
  - Solar Power (kW)
  - Wind Power (kW)
  - DG Power (kW)
  - UPS Power (kW)
  - Battery Percentage (%)
  - Total Load Demand (kW)
  - Critical Load (kW)
  - Non-Critical Load (kW)
- **Output**: Continuous priority score (0.0 - 1.0)
- **Training**: Uses historical energy data with calculated priority ratios

#### 2. 🎯 **Source Classification Model**
- **Algorithm**: Random Forest Classifier
- **Purpose**: Determines optimal power source selection
- **Input Features**: Same 8 features as regression model
- **Output**: Categorical prediction of best power source
  - `Solar_Power(kW)`
  - `Wind_Power(kW)`
  - `DG_Power(kW)`
  - `UPS_Power(kW)`
  - `Grid_Power(kW)` (when available)
- **Training**: Uses power source availability and efficiency data

## 🎯 How AI Predictions Work

### Priority Calculation Process

```python
# Step 1: Base Priority Calculation
base_priority = critical_load / total_load_demand

# Step 2: AI Enhancement with MCB Weighting
def calculate_mcb_priority(row):
    critical_weight = 0.7  # 70% weight to critical loads
    if critical_load > non_critical_load:
        return base_priority * critical_weight + (1 - critical_weight)
    else:
        return base_priority * critical_weight
```

### AI-Powered MCB Priority System

The system includes an **intelligent priority management system** that:

1. **Analyzes MCB Criticality**: 
   - Hospital Equipment: Priority 1 (Life-critical)
   - Emergency Systems: Priority 2 (Safety-critical)
   - Data Centers: Priority 3 (Business-critical)
   - Industrial Machines: Priority 4 (Production)
   - Lighting: Priority 5 (Comfort)
   - HVAC: Priority 6 (Comfort)
   - General Purpose: Priority 7 (Non-essential)
   - Auxiliary: Priority 8 (Support systems)

2. **Provides AI Reasoning**: Each priority assignment includes explanatory text
3. **Enables Dynamic Updates**: Users can override AI recommendations
4. **Maintains Fallback Logic**: Ensures system reliability

## 📊 Model Training Process

### Data Pipeline

1. **Data Loading**: 
   ```python
   df = pd.read_csv("../dataset/energy_dataset.csv")
   ```

2. **Feature Engineering**:
   ```python
   features = [
       "Solar_Power(kW)", "Wind_Power(kW)", "DG_Power(kW)", "UPS_Power(kW)",
       "Battery_Percentage(%)", "Total_Load_Demand(kW)", 
       "Critical_Load(kW)", "Non_Critical_Load(kW)"
   ]
   ```

3. **Target Variable Creation**:
   ```python
   # Priority Regression Target
   df["Priority"] = df.apply(calculate_mcb_priority, axis=1)
   
   # Classification Target
   df["Optimal_Source"] = df[source_cols].idxmax(axis=1)
   ```

4. **Model Training**:
   ```python
   # Split data
   X_train, X_test, y_priority_train, y_priority_test, y_source_train, y_source_test = train_test_split(
       X, y_priority, y_source, test_size=0.2, random_state=42
   )
   
   # Train models
   priority_reg = RandomForestRegressor(random_state=42)
   priority_reg.fit(X_train, y_priority_train)
   
   source_clf = RandomForestClassifier(random_state=42)
   source_clf.fit(X_train, y_source_train)
   ```

## 🔄 Real-time Prediction Process

### API Prediction Workflow

1. **Input Validation**: System validates 8 required features
2. **Data Preprocessing**: Converts input to numpy array format
3. **Model Inference**:
   ```python
   priority = float(priority_reg.predict(X)[0])
   optimal_source = str(source_clf.predict(X)[0])
   ```
4. **Grid Status Logic**: Overrides source selection based on grid availability
5. **MCB Power Management**: Applies predictions to individual MCBs
6. **Response Generation**: Returns structured JSON with predictions

### Example API Request/Response

**Request**:
```json
{
  "Solar_Power(kW)": 25,
  "Wind_Power(kW)": 15,
  "DG_Power(kW)": 10,
  "UPS_Power(kW)": 5,
  "Battery_Percentage(%)": 75,
  "Total_Load_Demand(kW)": 50,
  "Critical_Load(kW)": 30,
  "Non_Critical_Load(kW)": 20,
  "Grid_Status": 0,
  "MCB_1_Power(kW)": 8,
  "MCB_2_Power(kW)": 7
}
```

**Response**:
```json
{
  "priority": 0.85,
  "optimal_source": "Solar_Power(kW)",
  "grid_status": "Failure",
  "power_management": {
    "available_power": 55,
    "total_demand": 50,
    "mcb_allocations": {...}
  }
}
```

## 🎛️ AI Priority Management Features

### Dynamic Priority Updates
- **Real-time Recalculation**: Priorities update instantly when MCB criticality changes
- **AI Reasoning Display**: Shows why each priority was assigned
- **User Override Capability**: Allows manual priority adjustments
- **Fallback System**: Ensures system reliability with default values

### Priority Configuration API

```python
# Get AI-determined priorities
GET /priorities

# Update specific MCB priority
PUT /priorities/{mcb_type}/{mcb_name}
{
  "priority": 3
}

# Reset to AI defaults
POST /priorities/reset
```

## 🏗️ System Architecture

### Backend Components
- **Flask API Server**: Handles HTTP requests and model serving
- **ML Model Manager**: Loads and manages trained models
- **Priority Manager**: Handles AI priority configuration
- **Grid Failure Handler**: Manages power distribution during outages

### Frontend Components
- **React Application**: User interface for system interaction
- **Configuration Page**: MCB setup with AI priority display
- **Dashboard**: Real-time monitoring and visualization
- **AI Integration**: Shows AI reasoning and predictions

## 🔧 Technical Specifications

### Model Performance
- **Algorithm**: Random Forest (scikit-learn)
- **Features**: 8 input variables
- **Training Split**: 80% training, 20% testing
- **Random State**: 42 (for reproducibility)

### AI Priority System
- **Source**: AI Analysis based on criticality assessment
- **Version**: 1.0
- **Categories**: Critical (1-4) and Non-Critical (5-8)
- **Update Frequency**: Real-time with user interactions

### Dependencies
```json
{
  "backend": [
    "Flask", "scikit-learn", "pandas", "numpy", "pickle"
  ],
  "frontend": [
    "React", "React Router", "CSS3"
  ]
}
```

## 📈 Model Advantages

1. **Dual Model Approach**: Separate optimization for priority and source selection
2. **Real-time Inference**: Fast predictions for immediate decision making
3. **Interpretable AI**: Clear reasoning for each prediction
4. **Dynamic Adaptation**: Updates based on changing grid conditions
5. **Fallback Reliability**: Maintains operation even if AI components fail
6. **User Control**: Allows manual overrides while maintaining AI guidance

## 🚦 Getting Started

### Training the Models
```bash
cd backend
python train_and_save_models.py
```

### Starting the System
```bash
# Backend
cd backend
python app.py

# Frontend
cd frontend
npm start
```

### Testing AI Predictions
```bash
# Test priority endpoint
curl http://localhost:5000/priorities

# Test prediction endpoint
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{"Solar_Power(kW)": 25, ...}'
```

## 📝 Future Enhancements

- **Deep Learning Models**: Integration of neural networks for more complex patterns
- **Time Series Prediction**: Forecasting future energy demands
- **Reinforcement Learning**: Adaptive learning from system performance
- **Edge AI Deployment**: Local inference for reduced latency
- **Model Versioning**: A/B testing of different AI approaches

---

*This AI-powered Grid Energy Management System represents the cutting-edge application of machine learning in smart grid technology, providing intelligent, real-time decision making for optimal power distribution.*
