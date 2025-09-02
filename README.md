# Energy Demand & Source Predictor

This project consists of a beautiful React frontend and a Python Flask backend to predict priority (critical load %) and optimal power source based on user input.

## Structure
- `frontend/` - React web app for user input and displaying predictions
- `backend/` - Python Flask API serving ML model predictions
- `energy_dataset.csv` - Dataset used for training
- `main.py` - Original data generation and ML code

## How to Run

### 1. Backend
1. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. Train and save models:
   ```bash
   python train_and_save_models.py
   ```
3. Start Flask API:
   ```bash
   python app.py
   ```

### 2. Frontend
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start React app:
   ```bash
   npm start
   ```

Open your browser at `http://localhost:3000` and enter energy parameters to get predictions!
