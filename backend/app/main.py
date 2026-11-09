import os
import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import engine, Base, get_db
from .models import Patient, MedicalReport, Biomarker, PredictionRecord, ChatMessage
from .schemas import (
    PatientCreate, PatientOut, MedicalReportOut,
    ComparisonResponse, PredictionOut, LifestylePlanOut,
    RagQueryRequest, RagQueryResponse
)
from .services.parser_service import extract_text_from_pdf, parse_medical_report_text, determine_status, CLINICAL_KNOWLEDGE_BASE
from .services.comparison_service import compare_patient_reports, get_patient_longitudinal_series
from .services.ml_prediction_service import compute_patient_predictions
from .services.lifestyle_service import generate_lifestyle_recommendations
from .services.rag_service import answer_health_query
from .data.seed_data import seed_demo_database

# Create SQLite tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Health Lens API",
    description="Medical Report RAG Analysis, Historical Delta Comparison & ML Future Complication Prediction Engine",
    version="1.0.0"
)

# Enable CORS for frontend Vite application
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Automatically seed realistic longitudinal data on boot
    db = next(get_db())
    seed_demo_database(db)

# --- PATIENTS ---

@app.get("/api/patients", response_model=List[PatientOut])
def get_patients(db: Session = Depends(get_db)):
    patients = db.query(Patient).all()
    return patients

@app.post("/api/patients", response_model=PatientOut)
def create_patient(patient_in: PatientCreate, db: Session = Depends(get_db)):
    patient = Patient(**patient_in.model_dump())
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient

@app.get("/api/patients/{patient_id}", response_model=PatientOut)
def get_patient_profile(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

# --- MEDICAL REPORTS & UPLOAD ---

@app.get("/api/patients/{patient_id}/reports", response_model=List[MedicalReportOut])
def get_patient_reports(patient_id: int, db: Session = Depends(get_db)):
    reports = (
        db.query(MedicalReport)
        .filter(MedicalReport.patient_id == patient_id)
        .order_by(MedicalReport.report_date.desc())
        .all()
    )
    return reports

@app.post("/api/patients/{patient_id}/reports/upload")
async def upload_medical_report(
    patient_id: int,
    title: str = Form("Diagnostic Lab Report"),
    report_type: str = Form("Comprehensive Metabolic & Lipid Panel"),
    report_date_str: Optional[str] = Form(None),
    raw_text_input: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    report_date = datetime.datetime.utcnow()
    if report_date_str:
        try:
            report_date = datetime.datetime.fromisoformat(report_date_str.replace("Z", ""))
        except Exception:
            pass

    file_name = file.filename if file else "Manual_Entry.txt"
    raw_text = ""

    if file:
        file_bytes = await file.read()
        if file.filename.lower().endswith(".pdf"):
            raw_text = extract_text_from_pdf(file_bytes)
        else:
            try:
                raw_text = file_bytes.decode("utf-8")
            except Exception:
                raw_text = str(file_bytes)
    
    if raw_text_input:
        raw_text = f"{raw_text}\n{raw_text_input}".strip()

    if not raw_text:
        raise HTTPException(status_code=400, detail="No report content provided (upload PDF or enter text).")

    # Run Clinical Extraction
    parsed_biomarkers, summary = parse_medical_report_text(raw_text, report_date)

    # Create Report Record
    new_report = MedicalReport(
        patient_id=patient.id,
        title=title,
        report_date=report_date,
        report_type=report_type,
        file_name=file_name,
        raw_text=raw_text,
        summary=summary,
        extracted_json={"count": len(parsed_biomarkers)}
    )
    db.add(new_report)
    db.flush()

    # Store individual structured Biomarkers
    for m in parsed_biomarkers:
        db.add(Biomarker(
            patient_id=patient.id,
            report_id=new_report.id,
            category=m["category"],
            name=m["name"],
            canonical_key=m["canonical_key"],
            value=m["value"],
            unit=m["unit"],
            reference_min=m["reference_min"],
            reference_max=m["reference_max"],
            status=m["status"],
            test_date=report_date
        ))

    # Recalculate ML Risk Predictions
    compute_patient_predictions(patient.id, db)
    db.commit()

    return {
        "status": "success",
        "message": f"Successfully ingested report '{title}' and extracted {len(parsed_biomarkers)} biomarkers.",
        "report_id": new_report.id,
        "extracted_biomarkers": parsed_biomarkers,
        "summary": summary
    }

# --- COMPARATIVE ANALYSIS ---

@app.get("/api/patients/{patient_id}/comparison", response_model=ComparisonResponse)
def get_historical_comparison(patient_id: int, db: Session = Depends(get_db)):
    return compare_patient_reports(patient_id, db)

@app.get("/api/patients/{patient_id}/longitudinal")
def get_longitudinal_data(patient_id: int, db: Session = Depends(get_db)):
    return get_patient_longitudinal_series(patient_id, db)

# --- ML FUTURE COMPLICATION PREDICTIONS ---

@app.get("/api/patients/{patient_id}/predictions", response_model=PredictionOut)
def get_future_complication_predictions(patient_id: int, db: Session = Depends(get_db)):
    return compute_patient_predictions(patient_id, db)

# --- LIFESTYLE & DIET RECOMMENDATIONS ---

@app.get("/api/patients/{patient_id}/lifestyle", response_model=LifestylePlanOut)
def get_lifestyle_recommendations(patient_id: int, db: Session = Depends(get_db)):
    return generate_lifestyle_recommendations(patient_id, db)

# --- RAG AI CHATBOT ---

@app.post("/api/rag/query", response_model=RagQueryResponse)
def query_rag(payload: RagQueryRequest, db: Session = Depends(get_db)):
    return answer_health_query(payload.patient_id, payload.query, db)

@app.get("/api/patients/{patient_id}/chats")
def get_chat_history(patient_id: int, db: Session = Depends(get_db)):
    chats = (
        db.query(ChatMessage)
        .filter(ChatMessage.patient_id == patient_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return [
        {
            "id": c.id,
            "sender": c.sender,
            "message": c.message,
            "citations": c.citations_json,
            "created_at": c.created_at
        }
        for c in chats
    ]

# --- RESET / SEED HELPER ---

@app.post("/api/seed/reset")
def reset_seed(db: Session = Depends(get_db)):
    db.query(ChatMessage).delete()
    db.query(PredictionRecord).delete()
    db.query(Biomarker).delete()
    db.query(MedicalReport).delete()
    db.query(Patient).delete()
    db.commit()
    seed_demo_database(db)
    return {"message": "Demo data successfully re-seeded."}
