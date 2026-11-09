# HealthLens - AI Medical Report RAG & Predictive Health Intelligence Platform

**HealthLens** is an end-to-end full-stack medical intelligence web application built with **React**, **Bootstrap 5 CSS**, **Python FastAPI**, **RAG (Retrieval-Augmented Generation)**, and **Machine Learning Clinical Risk Models**.

---

## 🌟 Key Features

1. **Medical Report Ingestion & Multi-Format OCR / Parsing**:
   - Accepts PDF reports and laboratory transcripts.
   - Intelligent clinical entity extraction maps raw lab data into standardized clinical biomarkers (Lipids, Glycemic, Renal, Liver, CBC, Hemodynamics).
   - Reference range normalization and automatic status classification (`Optimal`, `Borderline Elevated`, `High Risk`, `Low`).

2. **Historical Delta Comparison Engine**:
   - Automated delta tracking across sequential visits (e.g., *"Your Total Cholesterol increased by 2.0 mg/dL (+0.9%) vs Feb 20, 2026"*).
   - Tracks improved, worsened, and steady biomarkers with visual color-coded badges and clinical interpretation alerts.

3. **Longitudinal Biomarker Visualization**:
   - Interactive time-series charts (via Recharts) tracking Lipid trends, Fasting Glucose & HbA1c dynamics, and Kidney/Liver function over time.

4. **Machine Learning Future Complication Risk Radar**:
   - **10-Year ASCVD Cardiovascular Risk**: Based on ACC/AHA pooled cohort predictive equations.
   - **Type-2 Diabetes & Insulin Resistance Index**: Evaluates Triglyceride-to-HDL ratio (TyG index), fasting glucose stability, and HbA1c trajectory.
   - **Renal Filtration & Kidney Stress Score**: Tracks glomerulus filtration (eGFR) and creatinine clearance.
   - **6-Dimension Health Risk Radar**: Polar risk mapping vs healthy population baseline.

5. **Personalized Lifestyle, Nutrition & Exercise Prescription**:
   - Actionable dietary guidelines with specific *"Foods to Prioritize"* and *"Foods to Limit"*.
   - Physical activity prescriptions (Zone 2 cardio targets, resistance routines, post-meal walks).
   - Sleep architecture and autonomic stress balance protocols.
   - 90-day clinical re-test timeline and physician consultation alerts.

6. **Contextual RAG Medical AI Assistant ("HealthLens AI")**:
   - Context-grounded conversational agent that answers patient inquiries.
   - Provides **direct source citations** referencing report titles, dates, and extracted clinical snippets.

---

## 🚀 Quick Start Guide

### 1. Backend (FastAPI + SQLite)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 run.py
```
*Runs on `http://127.0.0.1:8000` (Swagger docs available at `http://127.0.0.1:8000/docs`).*

### 2. Frontend (React + Bootstrap 5)
```bash
cd frontend
npm install
npm run dev
```
*Runs on `http://127.0.0.1:5173`.*

---

## 📂 Project Structure

```
health-lens/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI routes & CORS
│   │   ├── database.py                 # SQLite database engine
│   │   ├── models.py                   # SQLAlchemy ORM models
│   │   ├── schemas.py                  # Pydantic schemas
│   │   ├── services/
│   │   │   ├── parser_service.py       # PDF extraction & biomarker regex parsing
│   │   │   ├── comparison_service.py   # Historical delta comparison engine
│   │   │   ├── ml_prediction_service.py # ASCVD & Diabetes risk models
│   │   │   ├── lifestyle_service.py    # Personalized lifestyle prescriptions
│   │   │   └── rag_service.py          # Vector store & contextual RAG Q&A
│   │   └── data/
│   │       └── seed_data.py            # Pre-seeded longitudinal demo patient data
│   ├── requirements.txt
│   └── run.py
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx              # Header with patient selector & quick actions
    │   │   ├── PatientSummaryCard.jsx  # Vitals, demographics & metabolic score
    │   │   ├── MetricsComparison.jsx   # Delta badges & comparative table
    │   │   ├── TrendCharts.jsx         # Longitudinal line charts
    │   │   ├── RiskPredictionView.jsx  # Risk cards & 6-axis Radar chart
    │   │   ├── LifestyleRecommendations.jsx # Categorized nutrition & exercise
    │   │   ├── RagChatDrawer.jsx       # Interactive RAG AI report assistant
    │   │   ├── ReportUploadModal.jsx   # Drag & drop report uploader
    │   │   ├── ReportHistoryList.jsx   # Document archive
    │   │   └── CreatePatientModal.jsx  # Patient registration modal
    │   ├── services/
    │   │   └── api.js                  # Axios client
    │   ├── App.jsx                     # Master dashboard layout
    │   └── index.css                   # Bootstrap 5 + custom medical theme
    └── package.json
```
# Health-lens
