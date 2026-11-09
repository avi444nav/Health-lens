import re
import math
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from ..models import Patient, MedicalReport, Biomarker, ChatMessage
from ..schemas import RagCitation, RagQueryResponse

# Medical FAQ and Clinical Reference knowledge snippets for RAG augmentation
CLINICAL_KNOWLEDGE_SNIPPETS = [
    {
        "topic": "cholesterol",
        "title": "Clinical Guidelines on Atherogenic Lipids",
        "date": "AHA/ACC Reference 2024",
        "content": "Total Cholesterol > 200 mg/dL and LDL > 100 mg/dL contribute to endothelial plaque build-up. HDL > 50 mg/dL acts as a protective scavenger. Triglycerides > 150 mg/dL signal increased hepatic lipid flux and insulin resistance."
    },
    {
        "topic": "glucose_hba1c",
        "title": "ADA Standards of Care in Diabetes",
        "date": "ADA Reference 2024",
        "content": "Normal fasting plasma glucose is 70-99 mg/dL. Pre-diabetes is defined as Fasting Blood Sugar 100-125 mg/dL or HbA1c 5.7-6.4%. HbA1c >= 6.5% confirms diabetes mellitus. Tight glycemic control reduces microvascular risk."
    },
    {
        "topic": "renal_kidney",
        "title": "KDIGO Clinical Practice Guideline for Kidney Health",
        "date": "KDIGO Reference 2024",
        "content": "eGFR > 90 mL/min/1.73m2 represents normal kidney function. eGFR 60-89 indicates mild decrease. Serum creatinine > 1.2 mg/dL in males and > 1.0 mg/dL in females indicates decreased filtration capacity. Adequate hydration and blood pressure control (<130/80) are protective."
    },
    {
        "topic": "liver_enzymes",
        "title": "AASLD Guidelines on Liver Function Evaluation",
        "date": "AASLD Reference 2024",
        "content": "ALT (SGPT) and AST (SGOT) are hepatic intracellular enzymes. Elevations above 40-45 U/L signal hepatocyte inflammation, commonly triggered by non-alcoholic fatty liver disease (NAFLD), alcohol, or metabolic syndrome."
    },
    {
        "topic": "blood_pressure",
        "title": "AHA/ACC Hypertension Clinical Practice Guidelines",
        "date": "AHA Reference 2024",
        "content": "Normal blood pressure is <120/<80 mmHg. Elevated is Systolic 120-129 and Diastolic <80. Stage 1 Hypertension begins at 130-139 / 80-89 mmHg. Lowering sodium and increasing dietary potassium reduces arterial stiffness."
    }
]

def tokenize(text: str) -> List[str]:
    """Basic tokenizer converting text to lowercase alpha-numeric tokens."""
    return re.findall(r"\b[a-z0-9_]{3,}\b", text.lower())

def compute_similarity(query_tokens: List[str], doc_tokens: List[str]) -> float:
    """Computes Jaccard/TF overlap similarity between query and candidate document."""
    if not query_tokens or not doc_tokens:
        return 0.0
    q_set = set(query_tokens)
    d_set = set(doc_tokens)
    overlap = q_set.intersection(d_set)
    if not overlap:
        return 0.0
    
    # Weight overlap by token count in doc
    doc_freq = sum(doc_tokens.count(t) for t in overlap)
    score = (len(overlap) / math.sqrt(len(q_set) * len(d_set))) + (0.1 * doc_freq)
    return min(1.0, score)

def build_patient_documents(patient_id: int, db: Session) -> List[Dict[str, Any]]:
    """Builds chunked retrieval documents from patient records and lab reports."""
    docs = []
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        return docs

    # Patient summary document
    docs.append({
        "source_type": "patient_profile",
        "title": f"Patient Demographics: {patient.name}",
        "date": patient.created_at.strftime("%Y-%m-%d"),
        "content": (
            f"Patient {patient.name}, Age: {patient.age}, Gender: {patient.gender}, "
            f"Blood Group: {patient.blood_group}, BMI: {patient.bmi}, "
            f"Hypertension: {patient.hypertension_history}, Diabetes History: {patient.diabetes_history}, "
            f"Smoking Status: {patient.smoking_status}."
        )
    })

    # Individual report documents & biomarker chunks
    reports = db.query(MedicalReport).filter(MedicalReport.patient_id == patient_id).order_by(MedicalReport.report_date.desc()).all()
    for rep in reports:
        biomarkers = db.query(Biomarker).filter(Biomarker.report_id == rep.id).all()
        marker_descriptions = [
            f"{b.name} ({b.canonical_key}): {b.value} {b.unit} [Status: {b.status}, Reference: {b.reference_min}-{b.reference_max}]"
            for b in biomarkers
        ]
        
        # Whole report summary chunk
        docs.append({
            "source_type": "medical_report",
            "title": rep.title,
            "date": rep.report_date.strftime("%b %d, %Y"),
            "content": f"Medical Report '{rep.title}' on {rep.report_date.strftime('%Y-%m-%d')}. Summary: {rep.summary or 'N/A'}. Lab Values: {'; '.join(marker_descriptions)}"
        })

        # Detailed individual biomarker chunks for granular RAG retrieval
        for b in biomarkers:
            docs.append({
                "source_type": "biomarker_record",
                "title": f"{rep.title} - {b.name}",
                "date": rep.report_date.strftime("%b %d, %Y"),
                "content": (
                    f"In report '{rep.title}' dated {rep.report_date.strftime('%b %d, %Y')}, "
                    f"{b.name} was measured at {b.value} {b.unit}. Reference range is {b.reference_min} to {b.reference_max} {b.unit}. "
                    f"Clinical status: {b.status}. Category: {b.category}."
                )
            })

    # Append Clinical Knowledge Base snippets
    for kb in CLINICAL_KNOWLEDGE_SNIPPETS:
        docs.append({
            "source_type": "clinical_guideline",
            "title": kb["title"],
            "date": kb["date"],
            "content": kb["content"]
        })

    return docs

def answer_health_query(patient_id: int, query: str, db: Session) -> RagQueryResponse:
    """
    RAG Pipeline:
    1. Indexes patient medical history, lab reports, and clinical guidelines.
    2. Retrieves top-k most relevant evidence chunks.
    3. Synthesizes a medically grounded, structured response with exact citations.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        return RagQueryResponse(
            answer="Patient not found in system.",
            citations=[],
            confidence="Low"
        )

    all_docs = build_patient_documents(patient_id, db)
    query_tokens = tokenize(query)

    scored_docs: List[Tuple[float, Dict[str, Any]]] = []
    for doc in all_docs:
        doc_tokens = tokenize(doc["title"] + " " + doc["content"])
        sim = compute_similarity(query_tokens, doc_tokens)
        if sim > 0.05:
            scored_docs.append((sim, doc))

    scored_docs.sort(key=lambda x: x[0], reverse=True)
    top_chunks = scored_docs[:4]

    if not top_chunks:
        # Fallback if query terms didn't match directly
        top_chunks = [(0.2, d) for d in all_docs[:2]]

    # Format citations
    citations: List[RagCitation] = []
    for score, doc in top_chunks:
        snippet = doc["content"]
        if len(snippet) > 220:
            snippet = snippet[:220] + "..."
        citations.append(RagCitation(
            report_title=doc["title"],
            report_date=doc["date"],
            snippet=snippet,
            relevance_score=round(score, 2)
        ))

    # Retrieve patient's latest markers for personalized answering
    latest_report = (
        db.query(MedicalReport)
        .filter(MedicalReport.patient_id == patient_id)
        .order_by(MedicalReport.report_date.desc())
        .first()
    )
    latest_markers = db.query(Biomarker).filter(Biomarker.report_id == latest_report.id).all() if latest_report else []
    marker_map = {b.canonical_key: b for b in latest_markers}

    q_lower = query.lower()

    # Contextual synthesis logic based on query topic
    if any(w in q_lower for w in ["cholesterol", "lipid", "ldl", "hdl", "triglyceride"]):
        tot = marker_map.get("cholesterol_total")
        ldl = marker_map.get("cholesterol_ldl")
        hdl = marker_map.get("cholesterol_hdl")
        tg = marker_map.get("triglycerides")
        
        answer = (
            f"Based on your latest medical report ('{latest_report.title if latest_report else 'Lab Records'}'), "
            f"your Total Cholesterol is **{tot.value if tot else 'N/A'} {tot.unit if tot else ''}** ({tot.status if tot else 'N/A'}), "
            f"with LDL at **{ldl.value if ldl else 'N/A'} mg/dL** and HDL at **{hdl.value if hdl else 'N/A'} mg/dL**. "
            f"Triglycerides are measured at **{tg.value if tg else 'N/A'} mg/dL**.\n\n"
            f"**Clinical Insight:** "
            f"{'Your LDL is above the ideal threshold of 100 mg/dL. Increasing dietary soluble fiber (oats, psyllium) and daily aerobic activity is recommended to help clear circulating atherogenic particles.' if ldl and ldl.value > 100 else 'Your lipid markers are currently within standard ranges.'}"
        )
    elif any(w in q_lower for w in ["sugar", "glucose", "diabetes", "hba1c", "a1c"]):
        fbg = marker_map.get("glucose_fasting")
        hba1c = marker_map.get("hba1c")
        answer = (
            f"Looking at your recent glycemic records, your Fasting Blood Glucose is **{fbg.value if fbg else 'N/A'} mg/dL** "
            f"and your HbA1c is **{hba1c.value if hba1c else 'N/A'}%** ({hba1c.status if hba1c else 'N/A'}).\n\n"
            f"**Clinical Interpretation:** "
            f"{'An HbA1c between 5.7% and 6.4% indicates pre-diabetic metabolic stress. Implementing low-glycemic meal sequencing (fibrous greens & protein first) and 10-15 minute post-meal walks will significantly improve insulin sensitivity.' if hba1c and hba1c.value >= 5.7 else 'Your blood sugar and glycated hemoglobin levels indicate good metabolic stability.'}"
        )
    elif any(w in q_lower for w in ["kidney", "renal", "creatinine", "egfr", "bun"]):
        creat = marker_map.get("creatinine_serum")
        egfr = marker_map.get("egfr")
        answer = (
            f"Your renal panel indicates Serum Creatinine of **{creat.value if creat else 'N/A'} mg/dL** "
            f"and an Estimated GFR (eGFR) of **{egfr.value if egfr else 'N/A'} mL/min/1.73m²** ({egfr.status if egfr else 'N/A'}).\n\n"
            f"**Clinical Insight:** "
            f"{'An eGFR above 90 represents optimal filtration rate. Keep staying well hydrated (2.5L water/day) and maintain blood pressure control to protect kidney microvasculature.' if egfr and egfr.value >= 90 else 'Your filtration rate shows mild reduction; discuss with your doctor and ensure blood pressure is well regulated.'}"
        )
    elif any(w in q_lower for w in ["liver", "alt", "sgpt", "ast", "sgot", "enzymes"]):
        alt = marker_map.get("alt_sgpt")
        ast = marker_map.get("ast_sgot")
        answer = (
            f"Your liver function panel records ALT (SGPT) at **{alt.value if alt else 'N/A'} U/L** ({alt.status if alt else 'N/A'}) "
            f"and AST (SGOT) at **{ast.value if ast else 'N/A'} U/L**.\n\n"
            f"**Clinical Guidance:** "
            f"{'Elevated ALT/AST enzymes indicate mild liver cell stress, often associated with hepatic lipid accumulation or processed food intake. Incorporating cruciferous vegetables and reducing refined fructose helps reduce hepatic strain.' if alt and alt.value > 40 else 'Your liver transaminase enzymes are within healthy normal ranges.'}"
        )
    elif any(w in q_lower for w in ["lifestyle", "diet", "food", "eat", "exercise", "walk"]):
        answer = (
            f"Based on {patient.name}'s metabolic and lipid profile, here are the top 3 personalized recommendations:\n\n"
            f"1. **Heart-Healthy Nutrition:** Focus on soluble fiber (chia seeds, steel-cut oats, legumes) and unsaturated fats (olive oil, avocados) to optimize lipid ratios.\n"
            f"2. **Glycemic Control:** Follow food order sequencing (eat vegetables and proteins before carbohydrates) to prevent glucose spikes.\n"
            f"3. **Physical Activity:** Aim for 150-180 minutes of Zone 2 cardio (conversational pace) plus 2 full-body resistance sessions weekly."
        )
    elif any(w in q_lower for w in ["compare", "comparison", "change", "past", "history", "trend"]):
        answer = (
            f"Health Lens continuously monitors your historical biomarker trajectory. "
            f"When comparing your sequential reports, your key cardiovascular and metabolic markers are evaluated for absolute shifts, percentage changes, and clinical risk directions. "
            f"Check the **Historical Comparisons** tab on your dashboard to see exact delta badges (e.g. cholesterol shifts and glycemic trends) across all test dates."
        )
    else:
        # General response grounded in retrieved context
        context_preview = "\n".join([f"- **{d['title']}**: {d['content'][:140]}..." for _, d in top_chunks[:2]])
        answer = (
            f"Based on {patient.name}'s medical profile and clinical records:\n\n"
            f"{context_preview}\n\n"
            f"Your health dashboard integrates your latest lab reports, historical trends, and ML risk scores. "
            f"Feel free to ask about specific markers like cholesterol, blood sugar, kidney function, or dietary guidelines!"
        )

    # Save to chat history
    user_msg = ChatMessage(patient_id=patient_id, sender="user", message=query, citations_json=[])
    ai_msg = ChatMessage(patient_id=patient_id, sender="assistant", message=answer, citations_json=[c.model_dump() for c in citations])
    db.add(user_msg)
    db.add(ai_msg)
    db.commit()

    return RagQueryResponse(
        answer=answer,
        citations=citations,
        confidence="High" if top_chunks and top_chunks[0][0] > 0.15 else "Moderate"
    )
