import datetime
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .database import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False) # 'Male', 'Female', 'Other'
    blood_group = Column(String(10), default="O+")
    height_cm = Column(Float, default=172.0)
    weight_kg = Column(Float, default=74.0)
    smoking_status = Column(Boolean, default=False)
    diabetes_history = Column(Boolean, default=False)
    hypertension_history = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    reports = relationship("MedicalReport", back_populates="patient", cascade="all, delete-orphan")
    biomarkers = relationship("Biomarker", back_populates="patient", cascade="all, delete-orphan")
    predictions = relationship("PredictionRecord", back_populates="patient", cascade="all, delete-orphan")
    chats = relationship("ChatMessage", back_populates="patient", cascade="all, delete-orphan")

    @property
    def bmi(self) -> float:
        if self.height_cm and self.height_cm > 0 and self.weight_kg:
            height_m = self.height_cm / 100.0
            return round(self.weight_kg / (height_m * height_m), 1)
        return 24.5

class MedicalReport(Base):
    __tablename__ = "medical_reports"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    title = Column(String(200), nullable=False)
    report_date = Column(DateTime, nullable=False)
    report_type = Column(String(100), default="Comprehensive Metabolic & Lipid Panel")
    file_name = Column(String(255), nullable=True)
    raw_text = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    extracted_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="reports")
    biomarkers = relationship("Biomarker", back_populates="report", cascade="all, delete-orphan")

class Biomarker(Base):
    __tablename__ = "biomarkers"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    report_id = Column(Integer, ForeignKey("medical_reports.id"), nullable=False)
    category = Column(String(100), nullable=False) # 'Lipid Panel', 'Metabolic / Glycemic', 'Renal Panel', 'Liver Function', 'CBC', 'Vitals'
    name = Column(String(100), nullable=False)
    canonical_key = Column(String(100), nullable=False, index=True) # e.g. 'cholesterol_total', 'glucose_fasting', 'hba1c'
    value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)
    reference_min = Column(Float, nullable=True)
    reference_max = Column(Float, nullable=True)
    status = Column(String(30), default="Normal") # 'Low', 'Normal', 'Borderline', 'High', 'Critical'
    test_date = Column(DateTime, nullable=False)

    patient = relationship("Patient", back_populates="biomarkers")
    report = relationship("MedicalReport", back_populates="biomarkers")

class PredictionRecord(Base):
    __tablename__ = "prediction_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    report_id = Column(Integer, ForeignKey("medical_reports.id"), nullable=True)
    ascvd_10yr_risk = Column(Float, nullable=False) # Cardiovascular risk %
    diabetes_progression_risk = Column(Float, nullable=False) # Diabetes risk %
    kidney_stress_score = Column(Float, nullable=False) # Kidney Stress %
    metabolic_score = Column(Float, nullable=False) # Overall Metabolic Risk Score (0-100)
    risk_level = Column(String(50), default="Moderate") # 'Low', 'Moderate', 'High', 'Critical'
    prediction_details = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="predictions")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    sender = Column(String(20), nullable=False) # 'user' or 'assistant'
    message = Column(Text, nullable=False)
    citations_json = Column(JSON, default=list) # List of report snippets / citations
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="chats")
