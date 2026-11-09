from typing import List, Dict, Any, Optional
import datetime
from sqlalchemy.orm import Session
from ..models import Patient, MedicalReport, Biomarker
from ..schemas import ComparisonResponse, MetricDelta

# Markers where a lower value is clinically healthier
LOWER_IS_BETTER = {
    "cholesterol_total", "cholesterol_ldl", "triglycerides",
    "glucose_fasting", "hba1c", "creatinine_serum",
    "blood_urea_nitrogen", "uric_acid", "alt_sgpt",
    "ast_sgot", "bilirubin_total", "blood_pressure_systolic", "blood_pressure_diastolic"
}

# Markers where a higher value is clinically healthier
HIGHER_IS_BETTER = {
    "cholesterol_hdl", "egfr"
}

def generate_delta_commentary(name: str, key: str, current: float, prev: float, delta: float, pct: float, unit: str, prev_date_str: str) -> Dict[str, str]:
    abs_delta = abs(round(delta, 2))
    abs_pct = abs(round(pct, 1))

    sign = "+" if delta > 0 else "-"

    if abs_delta < 0.001:
        return {
            "trend_direction": "stable",
            "clinical_alert": "neutral",
            "message": f"Your {name} remained steady at {current} {unit} compared to {prev_date_str}."
        }

    is_increase = delta > 0
    
    if key in LOWER_IS_BETTER:
        if is_increase:
            # Worsened
            alert = "warning"
            trend = "increased"
            msg = f"Your {name} increased by {abs_delta} {unit} (+{abs_pct}%) compared to {prev_date_str}."
        else:
            # Improved
            alert = "positive"
            trend = "decreased"
            msg = f"Great progress: Your {name} decreased by {abs_delta} {unit} (-{abs_pct}%) since {prev_date_str}."
    elif key in HIGHER_IS_BETTER:
        if is_increase:
            # Improved
            alert = "positive"
            trend = "increased"
            msg = f"Good trend: Your {name} improved by +{abs_delta} {unit} (+{abs_pct}%) compared to {prev_date_str}."
        else:
            # Worsened
            alert = "warning"
            trend = "decreased"
            msg = f"Alert: Your {name} dropped by {abs_delta} {unit} (-{abs_pct}%) compared to {prev_date_str}."
    else:
        # Generic
        alert = "neutral"
        trend = "increased" if is_increase else "decreased"
        msg = f"Your {name} shifted by {sign}{abs_delta} {unit} ({sign}{abs_pct}%) vs {prev_date_str}."

    return {
        "trend_direction": trend,
        "clinical_alert": alert,
        "message": msg
    }

def compare_patient_reports(patient_id: int, db: Session) -> ComparisonResponse:
    """
    Compares the latest report biomarkers against the immediately preceding report
    to generate delta metrics and historical trajectory insights.
    """
    reports = (
        db.query(MedicalReport)
        .filter(MedicalReport.patient_id == patient_id)
        .order_by(MedicalReport.report_date.desc())
        .all()
    )

    if not reports:
        return ComparisonResponse(
            patient_id=patient_id,
            latest_report_date=None,
            previous_report_date=None,
            summary_sentence="No medical reports have been uploaded yet for this patient.",
            metrics=[],
            total_improved=0,
            total_worsened=0,
            total_stable=0
        )

    latest_report = reports[0]
    previous_report = reports[1] if len(reports) > 1 else None

    # Load latest biomarkers
    latest_markers = db.query(Biomarker).filter(Biomarker.report_id == latest_report.id).all()
    latest_map = {b.canonical_key: b for b in latest_markers}

    prev_map = {}
    prev_date_str = "baseline"
    if previous_report:
        prev_markers = db.query(Biomarker).filter(Biomarker.report_id == previous_report.id).all()
        prev_map = {b.canonical_key: b for b in prev_markers}
        prev_date_str = previous_report.report_date.strftime("%b %d, %Y")

    metric_deltas: List[MetricDelta] = []
    improved_count = 0
    worsened_count = 0
    stable_count = 0

    for key, cur_b in latest_map.items():
        ref_str = f"{cur_b.reference_min or 0} - {cur_b.reference_max or 'N/A'} {cur_b.unit}"
        
        if key in prev_map:
            prev_b = prev_map[key]
            delta = cur_b.value - prev_b.value
            pct = ((delta) / prev_b.value * 100.0) if prev_b.value != 0 else 0.0
            
            commentary = generate_delta_commentary(
                cur_b.name, key, cur_b.value, prev_b.value, delta, pct, cur_b.unit, prev_date_str
            )
            
            if commentary["clinical_alert"] == "positive":
                improved_count += 1
            elif commentary["clinical_alert"] == "warning":
                worsened_count += 1
            else:
                stable_count += 1

            metric_deltas.append(MetricDelta(
                canonical_key=key,
                name=cur_b.name,
                category=cur_b.category,
                unit=cur_b.unit,
                current_value=round(cur_b.value, 2),
                previous_value=round(prev_b.value, 2),
                delta_value=round(delta, 2),
                delta_percent=round(pct, 1),
                status=cur_b.status,
                trend_direction=commentary["trend_direction"],
                clinical_alert=commentary["clinical_alert"],
                reference_range=ref_str,
                message=commentary["message"]
            ))
        else:
            # First time recorded or only one report
            metric_deltas.append(MetricDelta(
                canonical_key=key,
                name=cur_b.name,
                category=cur_b.category,
                unit=cur_b.unit,
                current_value=round(cur_b.value, 2),
                previous_value=None,
                delta_value=None,
                delta_percent=None,
                status=cur_b.status,
                trend_direction="new",
                clinical_alert="neutral",
                reference_range=ref_str,
                message=f"Recorded initial baseline value of {cur_b.value} {cur_b.unit} ({cur_b.status})."
            ))
            stable_count += 1

    # Generate summary sentence
    if previous_report:
        summary_sentence = (
            f"Compared with report from {prev_date_str}: {worsened_count} parameter(s) increased in risk, "
            f"{improved_count} parameter(s) improved, and {stable_count} remained steady."
        )
    else:
        summary_sentence = "Single report on file. Displaying baseline clinical profile."

    return ComparisonResponse(
        patient_id=patient_id,
        latest_report_date=latest_report.report_date,
        previous_report_date=previous_report.report_date if previous_report else None,
        summary_sentence=summary_sentence,
        metrics=metric_deltas,
        total_improved=improved_count,
        total_worsened=worsened_count,
        total_stable=stable_count
    )

def get_patient_longitudinal_series(patient_id: int, db: Session) -> Dict[str, Any]:
    """
    Returns time-series data for all biomarkers across all reports for charting.
    """
    reports = (
        db.query(MedicalReport)
        .filter(MedicalReport.patient_id == patient_id)
        .order_by(MedicalReport.report_date.asc())
        .all()
    )

    timeline_points = []
    for rep in reports:
        markers = db.query(Biomarker).filter(Biomarker.report_id == rep.id).all()
        point = {
            "report_id": rep.id,
            "title": rep.title,
            "date": rep.report_date.strftime("%Y-%m-%d"),
            "formatted_date": rep.report_date.strftime("%b %Y"),
        }
        for m in markers:
            point[m.canonical_key] = m.value
        timeline_points.append(point)

    return {
        "patient_id": patient_id,
        "timeline": timeline_points
    }
