# AquaWatch AI – Smart Water Quality Intelligence Platform

AquaWatch AI is an intelligent water quality monitoring and prediction platform built for AI hackathons. It integrates real-time telemetry, predictive machine learning models for water potability assessment, and an interactive dashboard.

---

## 📁 Project Architecture

```
AquaWatch AI/
├── backend/                  # Python + FastAPI backend service
│   ├── data/                 # Raw and processed datasets (CSV, benchmarks)
│   ├── database/             # SQLite connection and schema definitions
│   ├── ml/                   # Machine learning training scripts and feature pipelines
│   ├── models/               # Serialized trained models (.joblib, .pkl) and scalers
│   ├── reports/              # Generated compliance PDFs, alerts, and analytics
│   ├── routes/               # API route definitions and endpoints (e.g. /health, /predict)
│   ├── .env.example          # Sample environment variables
│   ├── main.py               # FastAPI entry point with CORS and routing setup
│   └── __init__.py           # Backend package indicator
├── frontend/                 # React + Vite client dashboard
│   ├── public/               # Static assets (favicons, logos)
│   ├── src/                  # React components, pages, hooks, and styles
│   ├── index.html            # Single Page Application HTML root
│   ├── package.json          # Frontend npm dependencies and scripts
│   └── vite.config.js        # Vite build and dev server configuration
├── .gitignore                # Git ignore rules for Python, Node, data, and models
├── README.md                 # Project documentation and getting started guide
└── requirements.txt          # Python backend dependencies
```

---

## 📂 Folder Breakdown

| Folder / File | Description |
| :--- | :--- |
| `frontend/` | React Single Page Application created with Vite. Houses dashboard views, charts, and interactive controls. |
| `backend/` | FastAPI server that handles business logic, database queries, and ML model inference. |
| `backend/ml/` | Scripts for training models, data cleaning, feature engineering, and cross-validation. |
| `backend/routes/` | Modular API route endpoints (e.g. Health checks, Predictions, Sensor ingestion). |
| `backend/database/` | Database configuration, SQLite connection handlers, and database models. |
| `backend/data/` | Datasets such as water potability metrics (pH, Hardness, Solids, Chloramines, etc.). |
| `backend/models/` | Saved weights, trained ML model files (`.joblib`/`.pkl`), and preprocessing scalers. |
| `backend/reports/` | Auto-generated PDF/HTML quality reports and downloadable analytics. |
| `requirements.txt` | Core Python libraries needed for FastAPI, ML, data science, and database connectivity. |
| `.gitignore` | Prevents heavy artifacts (`node_modules`, `.env`, raw datasets, binary models) from being committed to git. |

---

## 🚀 How to Run the Project

Follow these steps to run the backend and frontend separately in two terminal windows.

### 1. Backend (Python + FastAPI)

Open a terminal in the root directory `AquaWatch AI`:

1. **(Recommended) Create and activate a Python virtual environment:**
   - On Windows (PowerShell):
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   *(Note: If you have Python 3.14 installed at a specific path, run `& "C:\Users\<username>\AppData\Local\Programs\Python\Python314\python.exe" -m venv .venv`)*

2. **Install backend dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

3. **Start the FastAPI development server:**
   ```powershell
   uvicorn backend.main:app --reload --port 8000
   ```

4. **Verify the backend:**
   - Open [http://127.0.0.1:8000](http://127.0.0.1:8000) in your browser.
   - Interactive Swagger API docs are available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).
   - Health check endpoint: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health).

---

### 2. Frontend (React + Vite)

Open a **second** terminal window in the root directory `AquaWatch AI`:

1. **Navigate to the frontend folder:**
   ```powershell
   cd frontend
   ```

2. **Install npm dependencies:**
   ```powershell
   npm install
   ```

3. **Start the Vite development server:**
   ```powershell
   npm run dev
   ```

4. **Verify the frontend:**
   - Open the URL shown in your terminal (usually [http://localhost:5173](http://localhost:5173)).
