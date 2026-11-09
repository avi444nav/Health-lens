import React from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip
} from "recharts";

export default function RiskPredictionView({ prediction }) {
  if (!prediction) {
    return (
      <div className="hl-card p-5 text-center text-muted">
        <i className="bi bi-cpu fs-2 d-block mb-2"></i>
        Generating machine learning risk models and complication forecasts...
      </div>
    );
  }

  // Determine risk colors
  const getCardColor = (val, thresholds) => {
    if (val >= thresholds.high) return { color: "#ef4444", bg: "#fee2e2", border: "#fca5a5" };
    if (val >= thresholds.mod) return { color: "#f59e0b", bg: "#fef3c7", border: "#fde68a" };
    return { color: "#10b981", bg: "#dcfce7", border: "#86efac" };
  };

  const ascvdStyle = getCardColor(prediction.ascvd_10yr_risk, { mod: 7.5, high: 20.0 });
  const diabStyle = getCardColor(prediction.diabetes_progression_risk, { mod: 40.0, high: 70.0 });
  const renalStyle = getCardColor(prediction.kidney_stress_score, { mod: 40.0, high: 70.0 });

  return (
    <div className="mb-4">
      {/* Top Section Banner */}
      <div className="hl-card p-3 p-md-4 mb-4 border-start border-primary border-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2.5 py-1 fw-bold">
              <i className="bi bi-shield-exclamation me-1"></i> ML Future Complication Risk Forecast
            </span>
            <h5 className="fw-bold text-dark mt-2 mb-1">
              Longitudinal Predictive Health Trajectory
            </h5>
            <p className="text-muted mb-0" style={{ fontSize: "0.875rem" }}>
              {prediction.clinical_recommendation}
            </p>
          </div>
          <div>
            <span className="badge bg-light text-dark border px-3 py-2">
              <i className="bi bi-clock me-1 text-primary"></i>
              Calculated: {new Date(prediction.calculated_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* 3 Core Complication Risk Cards */}
      <div className="row g-3 mb-4">
        {/* Cardiovascular Risk */}
        <div className="col-lg-4 col-md-6">
          <div className="hl-card p-3 p-md-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="fw-semibold text-dark d-flex align-items-center gap-1.5" style={{ fontSize: "0.9375rem" }}>
                <i className="bi bi-heart-pulse-fill text-danger fs-5"></i>
                10-Yr Cardiovascular Risk
              </span>
              <span
                className="badge rounded-pill fw-bold"
                style={{ backgroundColor: ascvdStyle.bg, color: ascvdStyle.color, border: `1px solid ${ascvdStyle.border}` }}
              >
                {prediction.ascvd_category}
              </span>
            </div>

            <div className="d-flex align-items-baseline gap-2 my-2">
              <h2 className="fw-bold mb-0" style={{ color: ascvdStyle.color }}>
                {prediction.ascvd_10yr_risk}%
              </h2>
              <span className="text-muted" style={{ fontSize: "0.8125rem" }}>
                10-Year ASCVD Event Probability
              </span>
            </div>

            <div className="risk-meter mb-3">
              <div
                className="risk-meter-fill"
                style={{ width: `${Math.min(100, prediction.ascvd_10yr_risk * 3.5)}%`, backgroundColor: ascvdStyle.color }}
              ></div>
            </div>

            <p className="text-muted mb-0" style={{ fontSize: "0.8125rem", lineHeight: "1.4" }}>
              Derived from ACC/AHA pooled cohort models tracking age, atherogenic lipid ratios, resting blood pressure, and smoking indices.
            </p>
          </div>
        </div>

        {/* Diabetes & Insulin Resistance */}
        <div className="col-lg-4 col-md-6">
          <div className="hl-card p-3 p-md-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="fw-semibold text-dark d-flex align-items-center gap-1.5" style={{ fontSize: "0.9375rem" }}>
                <i className="bi bi-droplet-half text-primary fs-5"></i>
                Type-2 Diabetes Complication
              </span>
              <span
                className="badge rounded-pill fw-bold"
                style={{ backgroundColor: diabStyle.bg, color: diabStyle.color, border: `1px solid ${diabStyle.border}` }}
              >
                {prediction.diabetes_category}
              </span>
            </div>

            <div className="d-flex align-items-baseline gap-2 my-2">
              <h2 className="fw-bold mb-0" style={{ color: diabStyle.color }}>
                {prediction.diabetes_progression_risk}%
              </h2>
              <span className="text-muted" style={{ fontSize: "0.8125rem" }}>
                Glycemic Progression Index
              </span>
            </div>

            <div className="risk-meter mb-3">
              <div
                className="risk-meter-fill"
                style={{ width: `${Math.min(100, prediction.diabetes_progression_risk)}%`, backgroundColor: diabStyle.color }}
              ></div>
            </div>

            <p className="text-muted mb-0" style={{ fontSize: "0.8125rem", lineHeight: "1.4" }}>
              Evaluates Triglyceride-to-HDL ratio (TyG surrogate insulin resistance index), fasting glucose stability, and glycated hemoglobin trajectory.
            </p>
          </div>
        </div>

        {/* Renal / Kidney Stress */}
        <div className="col-lg-4 col-md-12">
          <div className="hl-card p-3 p-md-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="fw-semibold text-dark d-flex align-items-center gap-1.5" style={{ fontSize: "0.9375rem" }}>
                <i className="bi bi-shield-shaded text-success fs-5"></i>
                Renal Filtration & Stress
              </span>
              <span
                className="badge rounded-pill fw-bold"
                style={{ backgroundColor: renalStyle.bg, color: renalStyle.color, border: `1px solid ${renalStyle.border}` }}
              >
                {prediction.kidney_category}
              </span>
            </div>

            <div className="d-flex align-items-baseline gap-2 my-2">
              <h2 className="fw-bold mb-0" style={{ color: renalStyle.color }}>
                {prediction.kidney_stress_score}%
              </h2>
              <span className="text-muted" style={{ fontSize: "0.8125rem" }}>
                Microvascular Kidney Strain
              </span>
            </div>

            <div className="risk-meter mb-3">
              <div
                className="risk-meter-fill"
                style={{ width: `${Math.min(100, prediction.kidney_stress_score)}%`, backgroundColor: renalStyle.color }}
              ></div>
            </div>

            <p className="text-muted mb-0" style={{ fontSize: "0.8125rem", lineHeight: "1.4" }}>
              Monitors glomerulus filtration (eGFR), serum creatinine clearance, and microvascular pressure to identify early kidney stress.
            </p>
          </div>
        </div>
      </div>

      {/* Radar Chart & Primary Risk Factors Row */}
      <div className="row g-3">
        {/* Radar Chart */}
        <div className="col-lg-6">
          <div className="hl-card p-3 p-md-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold text-dark mb-0">
                <i className="bi bi-radar me-1 text-primary"></i> 6-Dimension Health Risk Radar
              </h6>
              <span className="badge bg-light text-muted border">0 - 100 Scale</span>
            </div>

            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <RadarChart data={prediction.radar_data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" stroke="#475569" style={{ fontSize: "0.75rem", fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" style={{ fontSize: "0.7rem" }} />
                  <Radar name="Patient Risk Profile" dataKey="score" stroke="#0284c7" fill="#0284c7" fillOpacity={0.45} />
                  <Radar name="Optimal Health Baseline" dataKey="benchmark" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "0.8125rem" }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Primary Contributing Risk Drivers */}
        <div className="col-lg-6">
          <div className="hl-card p-3 p-md-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold text-dark mb-0">
                <i className="bi bi-exclamation-octagon me-1 text-warning"></i> Actionable Risk Drivers
              </h6>
              <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                Identified from Latest Panel
              </span>
            </div>

            <div className="d-flex flex-column gap-2.5">
              {prediction.primary_risk_factors.map((rf, idx) => {
                const isHigh = rf.impact === "High";
                const isMod = rf.impact === "Moderate";
                const badgeClass = isHigh
                  ? "bg-danger-subtle text-danger border-danger-subtle"
                  : isMod
                  ? "bg-warning-subtle text-warning-emphasis border-warning-subtle"
                  : "bg-success-subtle text-success border-success-subtle";

                return (
                  <div key={idx} className="p-2.5 rounded bg-light border">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <strong className="text-dark" style={{ fontSize: "0.875rem" }}>
                        {rf.name}
                      </strong>
                      <span className={`badge border rounded-pill ${badgeClass}`} style={{ fontSize: "0.7rem" }}>
                        {rf.impact} Impact
                      </span>
                    </div>
                    <p className="text-muted mb-0" style={{ fontSize: "0.8125rem" }}>
                      {rf.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
