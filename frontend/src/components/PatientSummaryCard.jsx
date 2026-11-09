import React from "react";

export default function PatientSummaryCard({ patient, reports, prediction, comparison }) {
  if (!patient) return null;

  const bmiValue = patient.bmi || 24.0;
  let bmiCategory = "Normal";
  let bmiBadgeClass = "bg-success-subtle text-success border-success-subtle";
  if (bmiValue < 18.5) {
    bmiCategory = "Underweight";
    bmiBadgeClass = "bg-info-subtle text-info border-info-subtle";
  } else if (bmiValue >= 25 && bmiValue < 30) {
    bmiCategory = "Overweight";
    bmiBadgeClass = "bg-warning-subtle text-warning border-warning-subtle";
  } else if (bmiValue >= 30) {
    bmiCategory = "Obese";
    bmiBadgeClass = "bg-danger-subtle text-danger border-danger-subtle";
  }

  const metabolicScore = prediction?.metabolic_score ?? 35;
  let scoreColor = "#10b981";
  let scoreLabel = "Optimal State";
  if (metabolicScore > 65) {
    scoreColor = "#ef4444";
    scoreLabel = "High Risk Index";
  } else if (metabolicScore > 40) {
    scoreColor = "#f59e0b";
    scoreLabel = "Moderate Concern";
  }

  const latestReport = reports && reports.length > 0 ? reports[0] : null;

  return (
    <div className="hl-card p-3 p-md-4 mb-4">
      <div className="row align-items-center g-3">
        {/* Patient Profile Info */}
        <div className="col-lg-5 col-md-6 border-end-lg">
          <div className="d-flex align-items-start gap-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shadow-sm flex-shrink-0"
              style={{
                width: "56px",
                height: "56px",
                background: "linear-gradient(135deg, #0284c7 0%, #0f172a 100%)",
                fontSize: "1.35rem"
              }}
            >
              {patient.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <h4 className="fw-bold mb-0 text-dark">{patient.name}</h4>
                <span className="badge bg-secondary-subtle text-secondary border rounded-pill">
                  {patient.gender}, {patient.age} yrs
                </span>
                <span className="badge bg-light text-dark border rounded-pill">
                  Blood: {patient.blood_group}
                </span>
              </div>

              <div className="d-flex align-items-center gap-2 mt-2 flex-wrap text-muted" style={{ fontSize: "0.875rem" }}>
                <span><strong>Height:</strong> {patient.height_cm} cm</span>
                <span>•</span>
                <span><strong>Weight:</strong> {patient.weight_kg} kg</span>
                <span>•</span>
                <span>
                  <strong>BMI:</strong> {bmiValue}{" "}
                  <span className={`badge border rounded-pill ${bmiBadgeClass}`} style={{ fontSize: "0.75rem" }}>
                    {bmiCategory}
                  </span>
                </span>
              </div>

              <div className="d-flex align-items-center gap-2 mt-2 flex-wrap">
                {patient.hypertension_history && (
                  <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle" style={{ fontSize: "0.75rem" }}>
                    <i className="bi bi-exclamation-triangle me-1"></i> Hypertension History
                  </span>
                )}
                {patient.diabetes_history && (
                  <span className="badge bg-danger-subtle text-danger border border-danger-subtle" style={{ fontSize: "0.75rem" }}>
                    <i className="bi bi-droplet-fill me-1"></i> Diabetes History
                  </span>
                )}
                {patient.smoking_status ? (
                  <span className="badge bg-dark-subtle text-dark border" style={{ fontSize: "0.75rem" }}>
                    <i className="bi bi-slash-circle me-1"></i> Active Smoker
                  </span>
                ) : (
                  <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: "0.75rem" }}>
                    <i className="bi bi-shield-check me-1"></i> Non-Smoker
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Longitudinal Quick Stats */}
        <div className="col-lg-4 col-md-6 border-end-lg">
          <div className="row g-2 text-center">
            <div className="col-4">
              <div className="p-2 rounded bg-light border">
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>Total Reports</div>
                <div className="fs-5 fw-bold text-dark">{reports ? reports.length : 0}</div>
                <small className="text-muted" style={{ fontSize: "0.7rem" }}>On File</small>
              </div>
            </div>
            <div className="col-4">
              <div className="p-2 rounded bg-light border">
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>Biomarkers</div>
                <div className="fs-5 fw-bold text-primary">
                  {latestReport ? latestReport.biomarkers?.length || 17 : 0}
                </div>
                <small className="text-muted" style={{ fontSize: "0.7rem" }}>Tracked</small>
              </div>
            </div>
            <div className="col-4">
              <div className="p-2 rounded bg-light border">
                <div className="text-muted" style={{ fontSize: "0.75rem" }}>Risk Alerts</div>
                <div className="fs-5 fw-bold text-danger">
                  {comparison ? comparison.total_worsened : 0}
                </div>
                <small className="text-muted" style={{ fontSize: "0.7rem" }}>Elevations</small>
              </div>
            </div>
          </div>

          <div className="mt-2 text-muted" style={{ fontSize: "0.8125rem" }}>
            <i className="bi bi-clock-history me-1 text-primary"></i>
            Latest Lab: <strong>{latestReport ? new Date(latestReport.report_date).toLocaleDateString() : "No reports yet"}</strong>
          </div>
        </div>

        {/* Health Score Gauge */}
        <div className="col-lg-3 col-md-12">
          <div className="d-flex align-items-center justify-content-between">
            <span className="fw-semibold text-muted" style={{ fontSize: "0.875rem" }}>
              Metabolic Health Index
            </span>
            <span className="badge rounded-pill fw-bold" style={{ backgroundColor: `${scoreColor}20`, color: scoreColor }}>
              {scoreLabel}
            </span>
          </div>

          <div className="d-flex align-items-baseline gap-2 mt-1">
            <h2 className="fw-bold mb-0 text-dark">{metabolicScore}</h2>
            <span className="text-muted">/ 100 Risk Score</span>
          </div>

          <div className="risk-meter mt-2">
            <div
              className="risk-meter-fill"
              style={{
                width: `${Math.min(100, Math.max(5, metabolicScore))}%`,
                backgroundColor: scoreColor
              }}
            ></div>
          </div>
          <small className="text-muted d-block mt-1" style={{ fontSize: "0.75rem" }}>
            Lower score indicates optimal physiological balance
          </small>
        </div>
      </div>
    </div>
  );
}
