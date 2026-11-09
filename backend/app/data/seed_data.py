import datetime
from sqlalchemy.orm import Session
from ..models import Patient, MedicalReport, Biomarker, PredictionRecord, ChatMessage
from ..services.parser_service import determine_status, CLINICAL_KNOWLEDGE_BASE
from ..services.ml_prediction_service import compute_patient_predictions

def seed_demo_database(db: Session):
    """Populates database with realistic multi-month longitudinal demo medical profiles."""
    if db.query(Patient).count() > 0:
        return # already seeded

    # 1. Patient: John Doe
    john = Patient(
        name="John Doe",
        age=52,
        gender="Male",
        blood_group="O+",
        height_cm=175.0,
        weight_kg=84.0,
        smoking_status=False,
        diabetes_history=False,
        hypertension_history=True,
        created_at=datetime.datetime(2025, 11, 1)
    )
    db.add(john)
    db.flush()

    # John's Report 1: Nov 15, 2025 (Baseline)
    r1_date = datetime.datetime(2025, 11, 15, 9, 30)
    r1 = MedicalReport(
        patient_id=john.id,
        title="Baseline Comprehensive Metabolic & Lipid Panel",
        report_date=r1_date,
        report_type="Annual Executive Health Checkup",
        file_name="JohnDoe_Nov2025_LabReport.pdf",
        summary="Baseline screening showing borderline elevated total cholesterol (206 mg/dL) and pre-diabetic HbA1c (5.9%).",
        raw_text="Patient: John Doe\nDate: 2025-11-15\nTotal Cholesterol: 206 mg/dL\nLDL Cholesterol: 122 mg/dL\nHDL Cholesterol: 46 mg/dL\nTriglycerides: 168 mg/dL\nFasting Glucose: 102 mg/dL\nHbA1c: 5.9%\nSerum Creatinine: 0.98 mg/dL\neGFR: 88 mL/min/1.73m2\nBlood Urea Nitrogen: 15 mg/dL\nALT (SGPT): 36 U/L\nAST (SGOT): 30 U/L\nSystolic BP: 132 mmHg\nDiastolic BP: 84 mmHg\nHeart Rate: 72 bpm\nHemoglobin: 15.1 g/dL\nTotal WBC: 6800 cells/mcL\nPlatelets: 245000 cells/mcL",
        extracted_json={}
    )
    db.add(r1)
    db.flush()

    r1_metrics = [
        ("cholesterol_total", 206.0),
        ("cholesterol_ldl", 122.0),
        ("cholesterol_hdl", 46.0),
        ("triglycerides", 168.0),
        ("glucose_fasting", 102.0),
        ("hba1c", 5.9),
        ("creatinine_serum", 0.98),
        ("egfr", 88.0),
        ("blood_urea_nitrogen", 15.0),
        ("alt_sgpt", 36.0),
        ("ast_sgot", 30.0),
        ("blood_pressure_systolic", 132.0),
        ("blood_pressure_diastolic", 84.0),
        ("heart_rate", 72.0),
        ("hemoglobin", 15.1),
        ("wbc_count", 6800.0),
        ("platelets", 245000.0)
    ]
    for key, val in r1_metrics:
        info = CLINICAL_KNOWLEDGE_BASE[key]
        db.add(Biomarker(
            patient_id=john.id,
            report_id=r1.id,
            category=info["category"],
            name=info["name"],
            canonical_key=key,
            value=val,
            unit=info["unit"],
            reference_min=info["ref_min"],
            reference_max=info["ref_max"],
            status=determine_status(val, info["ref_min"], info["ref_max"], key),
            test_date=r1_date
        ))

    # John's Report 2: Feb 20, 2026 (Follow-up)
    r2_date = datetime.datetime(2026, 2, 20, 10, 15)
    r2 = MedicalReport(
        patient_id=john.id,
        title="3-Month Follow-Up Lipid & Glycemic Panel",
        report_date=r2_date,
        report_type="Quarterly Disease Monitoring",
        file_name="JohnDoe_Feb2026_Followup.pdf",
        summary="Follow up shows cholesterol rising to 218 mg/dL (+12 mg/dL) and HbA1c at 6.1%.",
        raw_text="Patient: John Doe\nDate: 2026-02-20\nTotal Cholesterol: 218 mg/dL\nLDL Cholesterol: 134 mg/dL\nHDL Cholesterol: 44 mg/dL\nTriglycerides: 182 mg/dL\nFasting Glucose: 106 mg/dL\nHbA1c: 6.1%\nSerum Creatinine: 1.02 mg/dL\neGFR: 85 mL/min/1.73m2\nBlood Urea Nitrogen: 16 mg/dL\nALT (SGPT): 42 U/L\nAST (SGOT): 34 U/L\nSystolic BP: 136 mmHg\nDiastolic BP: 86 mmHg\nHeart Rate: 74 bpm\nHemoglobin: 15.2 g/dL\nTotal WBC: 7100 cells/mcL\nPlatelets: 250000 cells/mcL",
        extracted_json={}
    )
    db.add(r2)
    db.flush()

    r2_metrics = [
        ("cholesterol_total", 218.0),
        ("cholesterol_ldl", 134.0),
        ("cholesterol_hdl", 44.0),
        ("triglycerides", 182.0),
        ("glucose_fasting", 106.0),
        ("hba1c", 6.1),
        ("creatinine_serum", 1.02),
        ("egfr", 85.0),
        ("blood_urea_nitrogen", 16.0),
        ("alt_sgpt", 42.0),
        ("ast_sgot", 34.0),
        ("blood_pressure_systolic", 136.0),
        ("blood_pressure_diastolic", 86.0),
        ("heart_rate", 74.0),
        ("hemoglobin", 15.2),
        ("wbc_count", 7100.0),
        ("platelets", 250000.0)
    ]
    for key, val in r2_metrics:
        info = CLINICAL_KNOWLEDGE_BASE[key]
        db.add(Biomarker(
            patient_id=john.id,
            report_id=r2.id,
            category=info["category"],
            name=info["name"],
            canonical_key=key,
            value=val,
            unit=info["unit"],
            reference_min=info["ref_min"],
            reference_max=info["ref_max"],
            status=determine_status(val, info["ref_min"], info["ref_max"], key),
            test_date=r2_date
        ))

    # John's Report 3: May 12, 2026 (Latest Report - Cholesterol up by 2mg/dL, HbA1c improved to 5.8%)
    r3_date = datetime.datetime(2026, 5, 12, 8, 45)
    r3 = MedicalReport(
        patient_id=john.id,
        title="Comprehensive Health Re-Assessment Panel",
        report_date=r3_date,
        report_type="Semi-Annual Evaluation",
        file_name="JohnDoe_May2026_Assessment.pdf",
        summary="Latest report shows Total Cholesterol increased slightly by 2 mg/dL to 220 mg/dL, while fasting glucose and blood pressure improved with daily walking.",
        raw_text="Patient: John Doe\nDate: 2026-05-12\nTotal Cholesterol: 220 mg/dL\nLDL Cholesterol: 136 mg/dL\nHDL Cholesterol: 45 mg/dL\nTriglycerides: 178 mg/dL\nFasting Glucose: 98 mg/dL\nHbA1c: 5.8%\nSerum Creatinine: 0.95 mg/dL\neGFR: 89 mL/min/1.73m2\nBlood Urea Nitrogen: 14 mg/dL\nALT (SGPT): 38 U/L\nAST (SGOT): 29 U/L\nSystolic BP: 128 mmHg\nDiastolic BP: 82 mmHg\nHeart Rate: 68 bpm\nHemoglobin: 15.3 g/dL\nTotal WBC: 6600 cells/mcL\nPlatelets: 242000 cells/mcL",
        extracted_json={}
    )
    db.add(r3)
    db.flush()

    r3_metrics = [
        ("cholesterol_total", 220.0), # Exact demonstration of +2 mg/dL shift vs Feb report!
        ("cholesterol_ldl", 136.0),
        ("cholesterol_hdl", 45.0),
        ("triglycerides", 178.0),
        ("glucose_fasting", 98.0), # Improved
        ("hba1c", 5.8),            # Improved
        ("creatinine_serum", 0.95), # Improved
        ("egfr", 89.0),            # Improved
        ("blood_urea_nitrogen", 14.0),
        ("alt_sgpt", 38.0),
        ("ast_sgot", 29.0),
        ("blood_pressure_systolic", 128.0), # Improved
        ("blood_pressure_diastolic", 82.0),
        ("heart_rate", 68.0),
        ("hemoglobin", 15.3),
        ("wbc_count", 6600.0),
        ("platelets", 242000.0)
    ]
    for key, val in r3_metrics:
        info = CLINICAL_KNOWLEDGE_BASE[key]
        db.add(Biomarker(
            patient_id=john.id,
            report_id=r3.id,
            category=info["category"],
            name=info["name"],
            canonical_key=key,
            value=val,
            unit=info["unit"],
            reference_min=info["ref_min"],
            reference_max=info["ref_max"],
            status=determine_status(val, info["ref_min"], info["ref_max"], key),
            test_date=r3_date
        ))

    # Compute John's initial ML risk prediction
    compute_patient_predictions(john.id, db)

    # 2. Patient: Sarah Smith
    sarah = Patient(
        name="Sarah Smith",
        age=45,
        gender="Female",
        blood_group="A+",
        height_cm=164.0,
        weight_kg=68.0,
        smoking_status=False,
        diabetes_history=False,
        hypertension_history=False,
        created_at=datetime.datetime(2026, 1, 10)
    )
    db.add(sarah)
    db.flush()

    s_rep_date = datetime.datetime(2026, 4, 18, 9, 0)
    s_rep = MedicalReport(
        patient_id=sarah.id,
        title="Routine Preventive Health Profile",
        report_date=s_rep_date,
        report_type="Preventive Wellness Checkup",
        file_name="SarahSmith_Apr2026_Report.pdf",
        summary="Healthy baseline with optimal lipid ratio, excellent eGFR (98 mL/min), and normal glycemic indices.",
        raw_text="Patient: Sarah Smith\nDate: 2026-04-18\nTotal Cholesterol: 185 mg/dL\nLDL Cholesterol: 96 mg/dL\nHDL Cholesterol: 58 mg/dL\nTriglycerides: 115 mg/dL\nFasting Glucose: 88 mg/dL\nHbA1c: 5.2%\nSerum Creatinine: 0.82 mg/dL\neGFR: 98 mL/min/1.73m2\nBlood Urea Nitrogen: 12 mg/dL\nALT (SGPT): 22 U/L\nAST (SGOT): 20 U/L\nSystolic BP: 116 mmHg\nDiastolic BP: 74 mmHg\nHeart Rate: 66 bpm\nHemoglobin: 13.8 g/dL\nTotal WBC: 5800 cells/mcL\nPlatelets: 280000 cells/mcL",
        extracted_json={}
    )
    db.add(s_rep)
    db.flush()

    s_metrics = [
        ("cholesterol_total", 185.0),
        ("cholesterol_ldl", 96.0),
        ("cholesterol_hdl", 58.0),
        ("triglycerides", 115.0),
        ("glucose_fasting", 88.0),
        ("hba1c", 5.2),
        ("creatinine_serum", 0.82),
        ("egfr", 98.0),
        ("blood_urea_nitrogen", 12.0),
        ("alt_sgpt", 22.0),
        ("ast_sgot", 20.0),
        ("blood_pressure_systolic", 116.0),
        ("blood_pressure_diastolic", 74.0),
        ("heart_rate", 66.0),
        ("hemoglobin", 13.8),
        ("wbc_count", 5800.0),
        ("platelets", 280000.0)
    ]
    for key, val in s_metrics:
        info = CLINICAL_KNOWLEDGE_BASE[key]
        db.add(Biomarker(
            patient_id=sarah.id,
            report_id=s_rep.id,
            category=info["category"],
            name=info["name"],
            canonical_key=key,
            value=val,
            unit=info["unit"],
            reference_min=info["ref_min"],
            reference_max=info["ref_max"],
            status=determine_status(val, info["ref_min"], info["ref_max"], key),
            test_date=s_rep_date
        ))

    compute_patient_predictions(sarah.id, db)

    db.commit()
