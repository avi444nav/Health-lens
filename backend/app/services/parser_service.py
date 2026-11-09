import io
import re
import datetime
from typing import Dict, List, Any, Optional, Tuple
from pypdf import PdfReader

# Standard clinical dictionary with synonym matchers, units, and standard reference ranges
CLINICAL_KNOWLEDGE_BASE = {
    # --- LIPID PANEL ---
    "cholesterol_total": {
        "name": "Total Cholesterol",
        "category": "Lipid Panel",
        "unit": "mg/dL",
        "ref_min": 125.0,
        "ref_max": 200.0,
        "patterns": [
            r"(?:total\s+cholesterol|serum\s+cholesterol|cholesterol[,\s]+total)\s*[:=-]?\s*([0-9]+(?:\.[0-9]+)?)",
            r"cholesterol\s*[:=-]?\s*([0-9]+(?:\.[0-9]+)?)\s*mg\/d[lL]"
        ]
    },
    "cholesterol_ldl": {
        "name": "LDL Cholesterol (Bad)",
        "category": "Lipid Panel",
        "unit": "mg/dL",
        "ref_min": 50.0,
        "ref_max": 100.0,
        "patterns": [
            r"(?:ldl\s+cholesterol|cholesterol[,\s]+ldl|calculated\s+ldl|ldl[- ]c)\s*[:=-]?\s*([0-9]+(?:\.[0-9]+)?)",
            r"ldl\s*[:=-]?\s*([0-9]+(?:\.[0-9]+)?)\s*mg\/d[lL]"
        ]
    },
    "cholesterol_hdl": {
        "name": "HDL Cholesterol (Good)",
        "category": "Lipid Panel",
        "unit": "mg/dL",
        "ref_min": 40.0,
        "ref_max": 65.0,
        "patterns": [
            r"(?:hdl\s+cholesterol|cholesterol[,\s]+hdl|hdl[- ]c)\s*[:=-]?\s*([0-9]+(?:\.[0-9]+)?)",
            r"hdl\s*[:=-]?\s*([0-9]+(?:\.[0-9]+)?)\s*mg\/d[lL]"
        ]
    },
    "triglycerides": {
        "name": "Triglycerides",
        "category": "Lipid Panel",
        "unit": "mg/dL",
        "ref_min": 50.0,
        "ref_max": 150.0,
        "patterns": [
            r"(?:serum\s+triglycerides|triglycerides|tg)\s*[:=-]?\s*([0-9]+(?:\.[0-9]+)?)",
            r"triglyceride\s*[:=-]?\s*([0-9]+(?:\.[0-9]+)?)\s*mg\/d[lL]"
        ]
    },
    # --- METABOLIC / GLYCEMIC ---
    "glucose_fasting": {
        "name": "Fasting Blood Glucose",
        "category": "Metabolic & Glycemic",
        "unit": "mg/dL",
        "ref_min": 70.0,
        "ref_max": 99.0,
        "patterns": [
            r"(?:fasting\s+blood\s+sugar|fasting\s+glucose|glucose[,\s]+fasting|fbs)\s*[:=-]?\s*([0-9]+(?:\.[0-9]+)?)",
            r"blood\s+glucose\s*\(?fasting\)?\s*[:=-]?\s*([0-9]+(?:\.[0-9]+)?)"
        ]
    },
    "hba1c": {
        "name": "Glycated Hemoglobin (HbA1c)",
        "category": "Metabolic & Glycemic",
        "unit": "%",
        "ref_min": 4.0,
        "ref_max": 5.6,
        "patterns": [
            r"(?:glycated\s+hemoglobin|hba1c|glycosylated\s+hemoglobin|a1c)\s*[:=-]?\s*([0-9]+(?:\.[0-9]+)?)",
            r"hba1c\s*[:=-]?\s*([0-9]+(?:\.[0-9]+)?)\s*%"
        ]
    },
    # --- RENAL PANEL ---
    "creatinine_serum": {
        "name": "Serum Creatinine",
        "category": "Renal Function",
        "unit": "mg/dL",
        "ref_min": 0.6,
        "ref_max": 1.2,
        "patterns": [
            r"(?:serum\s+creatinine|creatinine[,\s]+serum|creatinine)\s*[:=-]?\s*([0-9]+(?:\.[0-9]+)?)",
            r"creatinine\s*[:=-]?\s*([0-9]+(?:\.[0-9]+)?)\s*mg\/d[lL]"
        ]
    },
    "egfr": {
        "name": "Estimated GFR (eGFR)",
        "category": "Renal Function",
        "unit": "mL/min/1.73m²",
        "ref_min": 90.0,
        "ref_max": 125.0,
        "patterns": [
            r"(?:estimated\s+gfr|egfr|gfr\s+calc)\s*[:=-]?\s*(?:>|>=)?\s*([0-9]+(?:\.[0-9]+)?)",
            r"egfr\s*[:=-]?\s*([0-9]+(?:\.[0-9]+)?)"
        ]
    },
    "blood_urea_nitrogen": {
        "name": "Blood Urea Nitrogen (BUN)",
        "category": "Renal Function",
        "unit": "mg/dL",
        "ref_min": 7.0,
        "ref_max": 20.0,
        "patterns": [
            r"(?:blood\s+urea\s+nitrogen|bun|urea\s+nitrogen)\s*[:=-]?\s*([0-9]+(?:\.[0-9]+)?)"
        ]
    },
    "uric_acid": {
        "name": "Uric Acid",
        "category": "Renal Function",
        "unit": "mg/dL",
        "ref_min": 3.5,
        "ref_max": 7.2,
        "patterns": [
            r"(?:serum\s+uric\s+acid|uric\s+acid)\s*[:=-]?\s*([0-9]+(?:\.[0-9]+)?)"
        ]
    },
    # --- LIVER FUNCTION ---
    "alt_sgpt": {
        "name": "ALT (SGPT)",
        "category": "Liver Function",
        "unit": "U/L",
        "ref_min": 7.0,
        "ref_max": 45.0,
        "patterns": [
            r"(?:alanine\s+aminotransferase|sgpt|alt\s*\(sgpt\)|alt)\s*[:=-]?\s*([0-9]+(?:\.[0-9]+)?)"
        ]
    },
    "ast_sgot": {
        "name": "AST (SGOT)",
        "category": "Liver Function",
        "unit": "U/L",
        "ref_min": 8.0,
        "ref_max": 40.0,
        "patterns": [
            r"(?:aspartate\s+aminotransferase|sgot|ast\s*\(sgot\)|ast)\s*[:=-]?\s*([0-9]+(?:\.[0-9]+)?)"
        ]
    },
    "bilirubin_total": {
        "name": "Total Bilirubin",
        "category": "Liver Function",
        "unit": "mg/dL",
        "ref_min": 0.2,
        "ref_max": 1.2,
        "patterns": [
            r"(?:total\s+bilirubin|bilirubin[,\s]+total)\s*[:=-]?\s*([0-9]+(?:\.[0-9]+)?)"
        ]
    },
    # --- COMPLETE BLOOD COUNT (CBC) ---
    "hemoglobin": {
        "name": "Hemoglobin",
        "category": "Complete Blood Count",
        "unit": "g/dL",
        "ref_min": 13.5,
        "ref_max": 17.5,
        "patterns": [
            r"(?:hemoglobin|hb|haemoglobin)\s*[:=-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:g\/d[lL]|gm%)?"
        ]
    },
    "wbc_count": {
        "name": "Total White Blood Cells (WBC)",
        "category": "Complete Blood Count",
        "unit": "cells/mcL",
        "ref_min": 4500.0,
        "ref_max": 11000.0,
        "patterns": [
            r"(?:total\s+leukocyte\s+count|wbc\s+count|wbc|tlc)\s*[:=-]?\s*([0-9,]+(?:\.[0-9]+)?)"
        ]
    },
    "platelets": {
        "name": "Platelet Count",
        "category": "Complete Blood Count",
        "unit": "cells/mcL",
        "ref_min": 150000.0,
        "ref_max": 450000.0,
        "patterns": [
            r"(?:platelet\s+count|platelets|plt)\s*[:=-]?\s*([0-9,]+(?:\.[0-9]+)?)"
        ]
    },
    # --- VITALS ---
    "blood_pressure_systolic": {
        "name": "Systolic Blood Pressure",
        "category": "Vitals & Hemodynamics",
        "unit": "mmHg",
        "ref_min": 90.0,
        "ref_max": 120.0,
        "patterns": [
            r"(?:systolic\s+bp|systolic|sbp)\s*[:=-]?\s*([0-9]+)",
            r"(?:blood\s+pressure|bp)\s*[:=-]?\s*([0-9]{2,3})\s*\/\s*[0-9]{2,3}"
        ]
    },
    "blood_pressure_diastolic": {
        "name": "Diastolic Blood Pressure",
        "category": "Vitals & Hemodynamics",
        "unit": "mmHg",
        "ref_min": 60.0,
        "ref_max": 80.0,
        "patterns": [
            r"(?:diastolic\s+bp|diastolic|dbp)\s*[:=-]?\s*([0-9]+)",
            r"(?:blood\s+pressure|bp)\s*[:=-]?\s*[0-9]{2,3}\s*\/\s*([0-9]{2,3})"
        ]
    },
    "heart_rate": {
        "name": "Resting Heart Rate",
        "category": "Vitals & Hemodynamics",
        "unit": "bpm",
        "ref_min": 60.0,
        "ref_max": 90.0,
        "patterns": [
            r"(?:heart\s+rate|pulse\s+rate|pulse|hr)\s*[:=-]?\s*([0-9]+)"
        ]
    }
}

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extracts raw text content from uploaded PDF bytes."""
    text_content = []
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text_content.append(f"--- PAGE {i+1} ---\n{page_text}")
    except Exception as e:
        text_content.append(f"Error reading PDF: {str(e)}")
    return "\n".join(text_content)

def determine_status(value: float, ref_min: Optional[float], ref_max: Optional[float], canonical_key: str) -> str:
    """Classifies clinical status based on reference thresholds."""
    if ref_min is not None and value < ref_min:
        if canonical_key in ["cholesterol_hdl", "egfr"]:
            return "Low (Risk)"
        return "Low"
    if ref_max is not None:
        if value > ref_max * 1.3:
            return "Critical High"
        if value > ref_max * 1.1:
            return "High"
        if value > ref_max:
            return "Borderline Elevated"
    return "Optimal"

def parse_medical_report_text(raw_text: str, report_date: Optional[datetime.datetime] = None) -> Tuple[List[Dict[str, Any]], str]:
    """
    Analyzes medical report text using clinical entity extraction.
    Returns parsed structured biomarkers list and a synthesized clinical summary.
    """
    if not report_date:
        report_date = datetime.datetime.utcnow()

    parsed_biomarkers = []
    found_keys = set()

    normalized_text = raw_text.replace(",", "")
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]

    # First pass: check regex patterns across text
    for key, info in CLINICAL_KNOWLEDGE_BASE.items():
        if key in found_keys:
            continue
        for pattern in info["patterns"]:
            match = re.search(pattern, raw_text, re.IGNORECASE)
            if not match:
                match = re.search(pattern, normalized_text, re.IGNORECASE)
            if match:
                try:
                    val_str = match.group(1).replace(",", "").strip()
                    val = float(val_str)
                    
                    # Sanity check ranges (e.g., total cholesterol shouldn't be 1.2 or 9000 unless unit error)
                    if key in ["cholesterol_total", "triglycerides", "glucose_fasting"] and val < 10:
                        continue # likely a mismatch or mmol/L without conversion

                    status = determine_status(val, info["ref_min"], info["ref_max"], key)
                    parsed_biomarkers.append({
                        "canonical_key": key,
                        "name": info["name"],
                        "category": info["category"],
                        "value": val,
                        "unit": info["unit"],
                        "reference_min": info["ref_min"],
                        "reference_max": info["ref_max"],
                        "status": status,
                        "test_date": report_date
                    })
                    found_keys.add(key)
                    break
                except Exception:
                    pass

    # Second pass: line-by-line tabular parsing fallback
    for line in lines:
        for key, info in CLINICAL_KNOWLEDGE_BASE.items():
            if key in found_keys:
                continue
            name_query = info["name"].lower().split("(")[0].strip()
            if name_query in line.lower():
                numbers = re.findall(r"[-+]?\d*\.\d+|\d+", line)
                if numbers:
                    try:
                        val = float(numbers[0])
                        status = determine_status(val, info["ref_min"], info["ref_max"], key)
                        parsed_biomarkers.append({
                            "canonical_key": key,
                            "name": info["name"],
                            "category": info["category"],
                            "value": val,
                            "unit": info["unit"],
                            "reference_min": info["ref_min"],
                            "reference_max": info["ref_max"],
                            "status": status,
                            "test_date": report_date
                        })
                        found_keys.add(key)
                    except Exception:
                        pass

    # Generate synthesized report summary
    elevated = [b for b in parsed_biomarkers if "High" in b["status"] or "Elevated" in b["status"]]
    low = [b for b in parsed_biomarkers if "Low" in b["status"]]
    
    summary_parts = [f"Extracted {len(parsed_biomarkers)} clinical biomarker(s)."]
    if elevated:
        elevated_names = ", ".join([f"{b['name']} ({b['value']} {b['unit']})" for b in elevated[:4]])
        summary_parts.append(f"Elevated parameters detected: {elevated_names}.")
    if low:
        low_names = ", ".join([f"{b['name']} ({b['value']} {b['unit']})" for b in low[:3]])
        summary_parts.append(f"Sub-optimal low parameters: {low_names}.")
    if not elevated and not low and parsed_biomarkers:
        summary_parts.append("All parsed biomarkers fall within standard reference intervals.")

    summary = " ".join(summary_parts)
    return parsed_biomarkers, summary
