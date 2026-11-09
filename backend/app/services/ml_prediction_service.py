import math
import datetime
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from ..models import Patient, MedicalReport, Biomarker, PredictionRecord
from ..schemas import PredictionOut, RiskFactor

def calculate_ascvd_risk(age: int, gender: str, total_chol: float, hdl: float, sbp: float, smoker: bool, diabetic: bool) -> float:
    """
    Calculates 10-year ASCVD (Atherosclerotic Cardiovascular Disease) risk percentage
    using the established ACC/AHA Pooled Cohort Equations.
    """
    is_male = (gender.lower() == "male")
    
    # Clip inputs to clinically valid model boundaries
    age_c = max(20, min(79, age))
    tot_chol_c = max(130.0, min(320.0, total_chol))
    hdl_c = max(20.0, min(100.0, hdl))
    sbp_c = max(90.0, min(200.0, sbp))

    ln_age = math.log(age_c)
    ln_tot = math.log(tot_chol_c)
    ln_hdl = math.log(hdl_c)
    ln_sbp = math.log(sbp_c)

    if is_male:
        # Coefficients for non-Hispanic White / general male cohort
        coeff_age = 12.344
        coeff_tot = 11.853
        coeff_age_tot = -2.664
        coeff_hdl = -7.990
        coeff_age_hdl = 1.769
        coeff_sbp = 1.797
        coeff_smoke = 7.837
        coeff_age_smoke = -1.795
        coeff_diab = 0.658
        mean_terms = 61.18
        baseline_survival = 0.9144

        indiv_sum = (
            coeff_age * ln_age
            + coeff_tot * ln_tot
            + coeff_age_tot * (ln_age * ln_tot)
            + coeff_hdl * ln_hdl
            + coeff_age_hdl * (ln_age * ln_hdl)
            + coeff_sbp * ln_sbp
            + (coeff_smoke * 1.0 + coeff_age_smoke * ln_age if smoker else 0.0)
            + (coeff_diab if diabetic else 0.0)
        )
    else:
        # Coefficients for female cohort
        coeff_age = -29.799
        coeff_age2 = 4.884
        coeff_tot = 13.540
        coeff_age_tot = -3.114
        coeff_hdl = -13.578
        coeff_age_hdl = 3.149
        coeff_sbp = 2.019
        coeff_smoke = 7.574
        coeff_age_smoke = -1.665
        coeff_diab = 0.661
        mean_terms = -29.18
        baseline_survival = 0.9665

        indiv_sum = (
            coeff_age * ln_age
            + coeff_age2 * (ln_age ** 2)
            + coeff_tot * ln_tot
            + coeff_age_tot * (ln_age * ln_tot)
            + coeff_hdl * ln_hdl
            + coeff_age_hdl * (ln_age * ln_hdl)
            + coeff_sbp * ln_sbp
            + (coeff_smoke * 1.0 + coeff_age_smoke * ln_age if smoker else 0.0)
            + (coeff_diab if diabetic else 0.0)
        )

    risk_exp = math.exp(indiv_sum - mean_terms)
    risk_score = (1.0 - (baseline_survival ** risk_exp)) * 100.0
    return max(0.5, min(99.0, round(risk_score, 1)))

def calculate_diabetes_risk(fbg: float, hba1c: float, tg: float, hdl: float, bmi: float) -> float:
    """
    Calculates Type-2 Diabetes progression risk and insulin resistance index.
    Based on TyG Index (Triglyceride-Glucose index) and ADA risk weighting.
    """
    # Triglyceride-Glucose (TyG) index: ln(Fasting TG (mg/dL) * Fasting Glucose (mg/dL) / 2)
    safe_tg = max(40.0, tg)
    safe_fbg = max(60.0, fbg)
    tyg_index = math.log((safe_tg * safe_fbg) / 2.0)

    # Base risk from HbA1c
    if hba1c >= 6.5:
        glycemic_base = 85.0 # Established Diabetes range
    elif hba1c >= 5.7:
        glycemic_base = 45.0 + (hba1c - 5.7) * 45.0 # Pre-diabetes range
    else:
        glycemic_base = max(5.0, (hba1c - 4.5) * 30.0)

    # TyG multiplier (>8.5 indicates significant insulin resistance)
    tyg_penalty = max(0.0, (tyg_index - 8.2) * 20.0)
    
    # BMI contribution
    bmi_penalty = max(0.0, (bmi - 24.0) * 2.2)

    total_diab_risk = glycemic_base + tyg_penalty + bmi_penalty
    return max(2.0, min(98.0, round(total_diab_risk, 1)))

def calculate_kidney_stress_score(egfr: float, creatinine: float, bun: float, sbp: float) -> float:
    """
    Calculates Kidney stress & renal dysfunction index (0-100 scale).
    """
    stress = 0.0
    if egfr < 60:
        stress += (60 - egfr) * 1.6 + 40
    elif egfr < 90:
        stress += (90 - egfr) * 1.0

    if creatinine > 1.2:
        stress += (creatinine - 1.2) * 35.0

    if bun > 20:
        stress += (bun - 20) * 1.5

    if sbp > 130:
        stress += (sbp - 130) * 0.3

    return max(3.0, min(95.0, round(stress, 1)))

def compute_patient_predictions(patient_id: int, db: Session) -> PredictionOut:
    """
    Gathers patient demographic records and the latest lab biomarkers
    to calculate ML risk scores, radar breakdown, and future complication forecast.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise ValueError(f"Patient with ID {patient_id} not found.")

    latest_report = (
        db.query(MedicalReport)
        .filter(MedicalReport.patient_id == patient_id)
        .order_by(MedicalReport.report_date.desc())
        .first()
    )

    markers_map = {}
    if latest_report:
        biomarkers = db.query(Biomarker).filter(Biomarker.report_id == latest_report.id).all()
        markers_map = {b.canonical_key: b.value for b in biomarkers}

    # Extract or infer defaults
    tot_chol = markers_map.get("cholesterol_total", 195.0)
    ldl_chol = markers_map.get("cholesterol_ldl", 115.0)
    hdl_chol = markers_map.get("cholesterol_hdl", 48.0)
    triglycerides = markers_map.get("triglycerides", 150.0)
    fbg = markers_map.get("glucose_fasting", 95.0)
    hba1c = markers_map.get("hba1c", 5.6)
    creatinine = markers_map.get("creatinine_serum", 0.95)
    egfr = markers_map.get("egfr", 92.0)
    bun = markers_map.get("blood_urea_nitrogen", 14.0)
    alt = markers_map.get("alt_sgpt", 28.0)
    ast = markers_map.get("ast_sgot", 24.0)
    sbp = markers_map.get("blood_pressure_systolic", 124.0)
    dbp = markers_map.get("blood_pressure_diastolic", 80.0)

    # 1. 10-Year ASCVD Risk
    ascvd_risk = calculate_ascvd_risk(
        age=patient.age,
        gender=patient.gender,
        total_chol=tot_chol,
        hdl=hdl_chol,
        sbp=sbp,
        smoker=patient.smoking_status,
        diabetic=patient.diabetes_history or (hba1c >= 6.5)
    )

    if ascvd_risk < 5.0:
        ascvd_cat = "Low (<5%)"
    elif ascvd_risk < 7.5:
        ascvd_cat = "Borderline (5.0 - 7.4%)"
    elif ascvd_risk < 20.0:
        ascvd_cat = "Intermediate (7.5 - 19.9%)"
    else:
        ascvd_cat = "High Risk (>=20%)"

    # 2. Type-2 Diabetes Risk
    diab_risk = calculate_diabetes_risk(fbg, hba1c, triglycerides, hdl_chol, patient.bmi)
    if diab_risk < 20.0:
        diab_cat = "Optimal Glycemic Control"
    elif diab_risk < 45.0:
        diab_cat = "Mild Metabolic Resistance"
    elif diab_risk < 70.0:
        diab_cat = "Pre-diabetic Progression Warning"
    else:
        diab_cat = "High Diabetic Complication Risk"

    # 3. Kidney Stress Score
    kidney_stress = calculate_kidney_stress_score(egfr, creatinine, bun, sbp)
    if kidney_stress < 20:
        kidney_cat = "Optimal eGFR Filtration"
    elif kidney_stress < 45:
        kidney_cat = "Mild Renal Stress"
    elif kidney_stress < 70:
        kidney_cat = "Moderate Renal Strain"
    else:
        kidney_cat = "Significant Renal Impairment Risk"

    # 4. Hepatic / Liver Stress Score
    liver_stress = max(5.0, min(95.0, round(((alt / 45.0) * 35.0 + (ast / 40.0) * 35.0 + (triglycerides / 150.0) * 20.0), 1)))

    # 5. Composite Metabolic Dysregulation Score
    metabolic_score = round((ascvd_risk * 0.35 + diab_risk * 0.35 + kidney_stress * 0.15 + liver_stress * 0.15), 1)

    if metabolic_score < 25:
        overall_level = "Low"
    elif metabolic_score < 50:
        overall_level = "Moderate"
    elif metabolic_score < 75:
        overall_level = "Elevated"
    else:
        overall_level = "High Risk"

    # Radar Data for Charts
    radar_data = [
        {"subject": "Cardiovascular Risk", "score": min(100, ascvd_risk * 3.5), "benchmark": 30, "fullMark": 100},
        {"subject": "Insulin / Diabetes", "score": min(100, diab_risk), "benchmark": 35, "fullMark": 100},
        {"subject": "Lipid Atherogenicity", "score": min(100, round((ldl_chol / 100.0) * 50.0 + (triglycerides / 150.0) * 30.0, 1)), "benchmark": 40, "fullMark": 100},
        {"subject": "Renal Strain", "score": min(100, kidney_stress), "benchmark": 25, "fullMark": 100},
        {"subject": "Hepatic Metabolic", "score": min(100, liver_stress), "benchmark": 30, "fullMark": 100},
        {"subject": "Vascular Tension", "score": min(100, round((sbp / 120.0) * 45.0 + (dbp / 80.0) * 35.0, 1)), "benchmark": 35, "fullMark": 100},
    ]

    # Primary Risk Drivers
    risk_factors: List[RiskFactor] = []
    if ldl_chol > 100:
        risk_factors.append(RiskFactor(
            name="LDL Atherogenic Burden",
            impact="High" if ldl_chol > 130 else "Moderate",
            detail=f"LDL is at {ldl_chol} mg/dL (target <100 mg/dL), accelerating plaque accumulation risk."
        ))
    if hba1c >= 5.7 or fbg > 100:
        risk_factors.append(RiskFactor(
            name="Glycemic Volatility / Insulin Resistance",
            impact="High" if hba1c >= 6.5 else "Moderate",
            detail=f"HbA1c of {hba1c}% and Fasting Glucose of {fbg} mg/dL indicates pre-diabetic metabolic stress."
        ))
    if sbp >= 130:
        risk_factors.append(RiskFactor(
            name="Elevated Systolic Pressure",
            impact="High" if sbp >= 140 else "Moderate",
            detail=f"Resting systolic pressure of {int(sbp)} mmHg creates increased arterial wall strain."
        ))
    if triglycerides / max(1.0, hdl_chol) > 3.0:
        risk_factors.append(RiskFactor(
            name="Elevated TG/HDL Ratio",
            impact="Moderate",
            detail=f"TG/HDL ratio of {round(triglycerides/hdl_chol, 2)} reflects small dense LDL phenotype & visceral adiposity."
        ))
    if not risk_factors:
        risk_factors.append(RiskFactor(
            name="General Health Maintenance",
            impact="Low",
            detail="Biomarkers are well-balanced. Continue baseline preventive lifestyle."
        ))

    clinical_rec = (
        f"Patient exhibits a {overall_level} 10-year composite risk index ({metabolic_score}/100). "
        f"Prioritize lowering atherogenic lipids and stabilizing glycemic metrics through targeted nutrition and aerobic conditioning."
    )

    # Persist or update prediction record
    pred_record = PredictionRecord(
        patient_id=patient_id,
        report_id=latest_report.id if latest_report else None,
        ascvd_10yr_risk=ascvd_risk,
        diabetes_progression_risk=diab_risk,
        kidney_stress_score=kidney_stress,
        metabolic_score=metabolic_score,
        risk_level=overall_level,
        prediction_details={
            "radar_data": radar_data,
            "primary_risk_factors": [rf.model_dump() for rf in risk_factors],
            "clinical_recommendation": clinical_rec
        }
    )
    db.add(pred_record)
    db.commit()

    return PredictionOut(
        patient_id=patient_id,
        calculated_at=datetime.datetime.utcnow(),
        ascvd_10yr_risk=ascvd_risk,
        ascvd_category=ascvd_cat,
        diabetes_progression_risk=diab_risk,
        diabetes_category=diab_cat,
        kidney_stress_score=kidney_stress,
        kidney_category=kidney_cat,
        metabolic_score=metabolic_score,
        risk_level=overall_level,
        radar_data=radar_data,
        primary_risk_factors=risk_factors,
        clinical_recommendation=clinical_rec
    )
