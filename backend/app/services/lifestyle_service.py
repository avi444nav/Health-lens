from typing import Dict, List, Any
from sqlalchemy.orm import Session
from ..models import Patient, MedicalReport, Biomarker
from ..schemas import LifestylePlanOut

def generate_lifestyle_recommendations(patient_id: int, db: Session) -> LifestylePlanOut:
    """
    Generates a personalized, clinical-grade lifestyle, dietary, and exercise action plan
    tailored to the patient's specific biomarker profile and health status.
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
        markers_map = {b.canonical_key: b for b in biomarkers}

    nutrition_guidelines: List[Dict[str, Any]] = []
    critical_biomarker_actions: List[Dict[str, Any]] = []
    clinical_precautions: List[Dict[str, Any]] = []

    # 1. Lipid / Cholesterol Logic
    chol_total = markers_map.get("cholesterol_total")
    chol_ldl = markers_map.get("cholesterol_ldl")
    tg = markers_map.get("triglycerides")
    hdl = markers_map.get("cholesterol_hdl")

    if (chol_ldl and chol_ldl.value > 100) or (chol_total and chol_total.value > 200):
        nutrition_guidelines.append({
            "target": "Atherogenic Lipid Reduction",
            "icon": "heart-pulse",
            "badge": "Priority",
            "title": "Soluble Fiber & Plant Sterol Boost",
            "description": "Incorporate 10-15g of daily soluble fiber (oat bran, psyllium husk, chia seeds, black beans). Soluble fiber binds to bile acids in the intestine, facilitating natural LDL clearance.",
            "foods_to_add": ["Oatmeal & Barley", "Avocados & Olive Oil", "Walnuts & Flaxseeds", "Fatty Fish (Salmon, Mackerel)"],
            "foods_to_limit": ["Ultra-processed bakery items", "Fried foods & palm oil", "Heavy dairy cream", "Processed red meat"]
        })
        critical_biomarker_actions.append({
            "biomarker": "LDL & Total Cholesterol",
            "current": f"{chol_ldl.value if chol_ldl else chol_total.value} mg/dL",
            "target": "< 100 mg/dL (Optimal)",
            "mechanism": "Replacing 5% of daily saturated fat with polyunsaturated fats lowers LDL by approx 8-12% within 6-8 weeks."
        })

    # 2. Glycemic / Blood Sugar Logic
    fbg = markers_map.get("glucose_fasting")
    hba1c = markers_map.get("hba1c")

    if (hba1c and hba1c.value >= 5.7) or (fbg and fbg.value >= 100) or patient.diabetes_history:
        nutrition_guidelines.append({
            "target": "Insulin Sensitivity & Glucose Control",
            "icon": "droplet",
            "badge": "Critical",
            "title": "Low Glycemic Sequencing & Carb Timing",
            "description": "Adopt 'food sequencing' protocol: consume fibrous vegetables and protein first, saving complex carbohydrates for the end of meals. This blunts the postprandial glucose spike by up to 40%.",
            "foods_to_add": ["Non-starchy greens (Spinach, Broccoli)", "Lentils & Chickpeas", "Greek Yogurt / Paneer / Tofu", "Cinnamon & Apple Cider Vinegar"],
            "foods_to_limit": ["Refined white flour (Maida)", "Sugar-sweetened beverages & fruit juices", "White rice in large portions", "Midnight snacks"]
        })
        critical_biomarker_actions.append({
            "biomarker": "HbA1c & Fasting Glucose",
            "current": f"{hba1c.value if hba1c else fbg.value} {'%' if hba1c else 'mg/dL'}",
            "target": "< 5.7% (Normal non-diabetic range)",
            "mechanism": "15-minute post-meal brisk walks activate GLUT4 glucose transporters without demanding insulin."
        })

    # 3. Blood Pressure / Vascular
    sbp = markers_map.get("blood_pressure_systolic")
    dbp = markers_map.get("blood_pressure_diastolic")

    if (sbp and sbp.value >= 125) or (dbp and dbp.value >= 80) or patient.hypertension_history:
        nutrition_guidelines.append({
            "target": "Vascular Tone & Endothelial Support",
            "icon": "activity",
            "badge": "Important",
            "title": "DASH Protocol & Sodium-Potassium Balance",
            "description": "Limit added sodium to under 1,500mg/day. Increase dietary potassium and nitrates (beetroot, arugula, garlic) which synthesize nitric oxide to naturally dilate blood vessels.",
            "foods_to_add": ["Beetroot & leafy greens", "Bananas, Oranges & Kiwi", "Pistachios & Pumpkin Seeds", "Garlic & Hibiscus tea"],
            "foods_to_limit": ["Pickles & canned soups", "Salted chips & instant noodles", "Excessive caffeine (>3 cups/day)", "Monosodium glutamate (MSG)"]
        })

    # 4. Liver & Uric Acid Support
    alt = markers_map.get("alt_sgpt")
    uric = markers_map.get("uric_acid")

    if (alt and alt.value > 40) or (uric and uric.value > 7.0):
        nutrition_guidelines.append({
            "target": "Hepatorenal Clearance",
            "icon": "shield-check",
            "badge": "Support",
            "title": "Cruciferous Detox & Hydration Protocol",
            "description": "Increase daily fluid intake to 2.5 - 3.0 Liters. Cruciferous vegetables stimulate phase II liver detox enzymes and reduce hepatic fat accumulation.",
            "foods_to_add": ["Cruciferous vegetables (Cabbage, Broccoli, Cauliflower)", "Green tea", "Lemon water", "Artichoke"],
            "foods_to_limit": ["Alcohol", "High-fructose corn syrup", "Purine-heavy organ meats", "Deep-fried street foods"]
        })

    # General baseline if no specific elevations
    if not nutrition_guidelines:
        nutrition_guidelines.append({
            "target": "Cardiometabolic Preservation",
            "icon": "check-circle",
            "badge": "Maintenance",
            "title": "Mediterranean Whole-Food Protocol",
            "description": "Maintain your balanced biomarkers with antioxidant-rich colorful vegetables, quality lean proteins, extra virgin olive oil, and unrefined whole grains.",
            "foods_to_add": ["Colorful seasonal produce", "Nuts & Seeds", "Legumes", "Extra virgin olive oil"],
            "foods_to_limit": ["Ultra-processed snack foods", "Industrial trans-fats", "Excessive refined sugars"]
        })

    # Physical Activity Prescription
    physical_activity = {
        "weekly_target_minutes": 180,
        "zone2_cardio": {
            "title": "Zone 2 Low-Intensity Aerobic Training",
            "frequency": "3 to 4 sessions / week (35-45 mins each)",
            "intensity": "Brisk walking, cycling, or swimming at a conversational pace (Heart Rate ~110-130 bpm).",
            "benefit": "Enhances mitochondrial density, increases HDL cholesterol, and maximizes fatty acid oxidation."
        },
        "resistance_training": {
            "title": "Full-Body Strength & Resistance",
            "frequency": "2 to 3 sessions / week (30 mins)",
            "exercises": ["Bodyweight Squats / Lunges", "Push-ups or chest press", "Resistance band rows", "Core planks"],
            "benefit": "Builds skeletal muscle reservoir for rapid glucose disposal, directly improving insulin sensitivity."
        },
        "post_meal_habit": {
            "title": "10-Minute Postprandial Mobility",
            "tip": "Take a 10-15 minute easy walk immediately after your largest meal of the day to flatten glucose spikes."
        }
    }

    # Sleep and Stress Interventions
    sleep_and_stress = [
        {
            "category": "Sleep Architecture",
            "target": "7.5 - 8.5 Hours Nightly",
            "recommendation": "Maintain a consistent sleep-wake window (+/- 30 mins). Avoid blue light screens 60 minutes before bed. Deep REM sleep regulates nocturnal growth hormone and cortisol clearance.",
            "impact": "Reduces morning fasting cortisol spikes by 25%."
        },
        {
            "category": "Autonomic Stress Balance",
            "target": "Daily 5-minute Box Breathing",
            "recommendation": "Practice 4-4-4-4 Box Breathing (Inhale 4s, Hold 4s, Exhale 4s, Hold 4s) when experiencing mental fatigue or before evening meals.",
            "impact": "Activates parasympathetic vagus nerve, reducing resting blood pressure."
        }
    ]

    # Clinical Precautions
    clinical_precautions = [
        {
            "type": "Follow-Up Timeline",
            "window": "Repeat Lab Profile in 90 to 120 Days",
            "detail": "Repeat Lipid Panel, Fasting Glucose, and HbA1c in 3-4 months to measure intervention efficacy and quantify trend reversal."
        },
        {
            "type": "Physician Consultation",
            "window": "Primary Care Review",
            "detail": "Share these trend comparisons and risk radar scores with your physician to evaluate if pharmacological therapy (e.g. statin or metformin) is warranted alongside lifestyle adjustments."
        },
        {
            "type": "Red Flag Watch",
            "window": "Immediate Clinical Attention",
            "detail": "Seek prompt medical care if experiencing unexplained shortness of breath, radiating chest tightness, sudden severe dizziness, or persistent extreme fatigue."
        }
    ]

    return LifestylePlanOut(
        patient_id=patient_id,
        nutrition_guidelines=nutrition_guidelines,
        physical_activity=physical_activity,
        sleep_and_stress=sleep_and_stress,
        clinical_precautions=clinical_precautions,
        critical_biomarker_actions=critical_biomarker_actions
    )
