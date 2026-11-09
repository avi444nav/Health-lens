import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class PatientBase(BaseModel):
    name: str
    age: int
    gender: str
    blood_group: str = "O+"
    height_cm: float = 172.0
    weight_kg: float = 74.0
    smoking_status: bool = False
    diabetes_history: bool = False
    hypertension_history: bool = False

class PatientCreate(PatientBase):
    pass

class PatientOut(PatientBase):
    id: int
    bmi: float
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class BiomarkerOut(BaseModel):
    id: int
    category: str
    name: str
    canonical_key: str
    value: float
    unit: str
    reference_min: Optional[float] = None
    reference_max: Optional[float] = None
    status: str
    test_date: datetime.datetime

    class Config:
        from_attributes = True

class MedicalReportOut(BaseModel):
    id: int
    patient_id: int
    title: str
    report_date: datetime.datetime
    report_type: str
    file_name: Optional[str] = None
    summary: Optional[str] = None
    biomarkers: List[BiomarkerOut] = []
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class MetricDelta(BaseModel):
    canonical_key: str
    name: str
    category: str
    unit: str
    current_value: float
    previous_value: Optional[float] = None
    delta_value: Optional[float] = None
    delta_percent: Optional[float] = None
    status: str
    trend_direction: str # 'increased', 'decreased', 'stable', 'new'
    clinical_alert: str # 'positive', 'negative', 'neutral', 'warning'
    reference_range: str
    message: str

class ComparisonResponse(BaseModel):
    patient_id: int
    latest_report_date: Optional[datetime.datetime]
    previous_report_date: Optional[datetime.datetime]
    summary_sentence: str
    metrics: List[MetricDelta]
    total_improved: int
    total_worsened: int
    total_stable: int

class RiskFactor(BaseModel):
    name: str
    impact: str # 'High', 'Moderate', 'Low'
    detail: str

class PredictionOut(BaseModel):
    patient_id: int
    calculated_at: datetime.datetime
    ascvd_10yr_risk: float
    ascvd_category: str # 'Low (<5%)', 'Borderline (5-7.4%)', 'Intermediate (7.5-19.9%)', 'High (>=20%)'
    diabetes_progression_risk: float
    diabetes_category: str # 'Optimal', 'Mild Risk', 'Pre-diabetic Range', 'High Glycemic Risk'
    kidney_stress_score: float
    kidney_category: str # 'Optimal eGFR', 'Mild Filter Stress', 'Moderate Renal Concern', 'Severe Impairment'
    metabolic_score: float
    risk_level: str
    radar_data: List[Dict[str, Any]]
    primary_risk_factors: List[RiskFactor]
    clinical_recommendation: str

class LifestylePlanOut(BaseModel):
    patient_id: int
    nutrition_guidelines: List[Dict[str, Any]]
    physical_activity: Dict[str, Any]
    sleep_and_stress: List[Dict[str, Any]]
    clinical_precautions: List[Dict[str, Any]]
    critical_biomarker_actions: List[Dict[str, Any]]

class RagQueryRequest(BaseModel):
    patient_id: int
    query: str

class RagCitation(BaseModel):
    report_title: str
    report_date: str
    snippet: str
    relevance_score: float

class RagQueryResponse(BaseModel):
    answer: str
    citations: List[RagCitation]
    confidence: str
