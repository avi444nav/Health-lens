import React from "react";

export default function LifestyleRecommendations({ lifestyle }) {
  if (!lifestyle) {
    return (
      <div className="hl-card p-5 text-center text-muted">
        <i className="bi bi-heart-pulse fs-2 d-block mb-2"></i>
        Compiling clinical lifestyle, nutrition, and exercise recommendations...
      </div>
    );
  }

  const { nutrition_guidelines, physical_activity, sleep_and_stress, clinical_precautions, critical_biomarker_actions } = lifestyle;

  return (
    <div className="mb-4">
      {/* Banner */}
      <div className="hl-card p-3 p-md-4 mb-4 border-start border-success border-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-1 fw-bold">
              <i className="bi bi-apple me-1"></i> Evidence-Based Clinical Interventions
            </span>
            <h5 className="fw-bold text-dark mt-2 mb-1">
              Personalized Lifestyle & Dietary Prescription
            </h5>
            <p className="text-muted mb-0" style={{ fontSize: "0.875rem" }}>
              Targeted behavioral modifications engineered to reverse biomarker abnormalities and mitigate 10-year risk.
            </p>
          </div>
          <div>
            <span className="badge bg-light text-muted border px-3 py-2">
              <i className="bi bi-check-circle-fill text-success me-1"></i> Tailored to Active Profile
            </span>
          </div>
        </div>
      </div>

      {/* Critical Biomarker Action Targets */}
      {critical_biomarker_actions && critical_biomarker_actions.length > 0 && (
        <div className="hl-card p-3 p-md-4 mb-4">
          <h6 className="fw-bold text-dark mb-3">
            <i className="bi bi-bullseye text-primary me-2"></i>
            Key Biomarker Targets & Physiological Mechanisms
          </h6>
          <div className="row g-3">
            {critical_biomarker_actions.map((act, idx) => (
              <div key={idx} className="col-md-6">
                <div className="p-3 rounded bg-light border h-100">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <strong className="text-dark">{act.biomarker}</strong>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                      Target: {act.target}
                    </span>
                  </div>
                  <div className="text-muted mb-2" style={{ fontSize: "0.8125rem" }}>
                    Current Recorded: <strong className="text-dark">{act.current}</strong>
                  </div>
                  <p className="text-muted mb-0" style={{ fontSize: "0.8125rem" }}>
                    <i className="bi bi-gear-fill me-1 text-secondary"></i>
                    {act.mechanism}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nutrition Guidelines Cards */}
      <h6 className="fw-bold text-dark mb-3">
        <i className="bi bi-egg-fried text-warning me-2"></i>
        Nutritional & Dietary Protocols
      </h6>
      <div className="row g-3 mb-4">
        {nutrition_guidelines.map((n, idx) => (
          <div key={idx} className="col-lg-6">
            <div className="hl-card p-3 p-md-4 h-100">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill">
                  {n.target}
                </span>
                <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                  {n.badge}
                </span>
              </div>

              <h6 className="fw-bold text-dark mb-2">{n.title}</h6>
              <p className="text-muted mb-3" style={{ fontSize: "0.875rem", lineHeight: "1.45" }}>
                {n.description}
              </p>

              {/* Foods to Add vs Limit */}
              <div className="row g-2 pt-2 border-top">
                <div className="col-sm-6">
                  <strong className="text-success d-block mb-1.5" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
                    <i className="bi bi-plus-circle me-1"></i> Foods to Prioritize
                  </strong>
                  <ul className="list-unstyled mb-0" style={{ fontSize: "0.8125rem" }}>
                    {n.foods_to_add.map((f, i) => (
                      <li key={i} className="text-dark mb-1 d-flex align-items-center gap-1.5">
                        <i className="bi bi-check2 text-success"></i> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="col-sm-6">
                  <strong className="text-danger d-block mb-1.5" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
                    <i className="bi bi-dash-circle me-1"></i> Foods to Limit
                  </strong>
                  <ul className="list-unstyled mb-0" style={{ fontSize: "0.8125rem" }}>
                    {n.foods_to_limit.map((f, i) => (
                      <li key={i} className="text-muted mb-1 d-flex align-items-center gap-1.5">
                        <i className="bi bi-x text-danger"></i> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Physical Activity & Sleep Row */}
      <div className="row g-3 mb-4">
        {/* Physical Activity */}
        <div className="col-lg-6">
          <div className="hl-card p-3 p-md-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold text-dark mb-0">
                <i className="bi bi-lightning-charge text-danger me-2"></i>
                Exercise & Conditioning Plan
              </h6>
              <span className="badge bg-success-subtle text-success border border-success-subtle">
                {physical_activity.weekly_target_minutes} Mins / Week
              </span>
            </div>

            <div className="d-flex flex-column gap-2.5">
              <div className="p-2.5 rounded bg-light border">
                <strong className="text-dark d-block" style={{ fontSize: "0.875rem" }}>
                  {physical_activity.zone2_cardio.title}
                </strong>
                <span className="badge bg-secondary-subtle text-secondary border mb-1" style={{ fontSize: "0.7rem" }}>
                  {physical_activity.zone2_cardio.frequency}
                </span>
                <p className="text-muted mb-1" style={{ fontSize: "0.8125rem" }}>
                  {physical_activity.zone2_cardio.intensity}
                </p>
                <small className="text-primary fw-medium" style={{ fontSize: "0.75rem" }}>
                  Benefit: {physical_activity.zone2_cardio.benefit}
                </small>
              </div>

              <div className="p-2.5 rounded bg-light border">
                <strong className="text-dark d-block" style={{ fontSize: "0.875rem" }}>
                  {physical_activity.resistance_training.title}
                </strong>
                <span className="badge bg-secondary-subtle text-secondary border mb-1" style={{ fontSize: "0.7rem" }}>
                  {physical_activity.resistance_training.frequency}
                </span>
                <div className="d-flex flex-wrap gap-1 mb-1">
                  {physical_activity.resistance_training.exercises.map((ex, i) => (
                    <span key={i} className="badge bg-white text-dark border" style={{ fontSize: "0.7rem" }}>
                      {ex}
                    </span>
                  ))}
                </div>
                <small className="text-primary fw-medium" style={{ fontSize: "0.75rem" }}>
                  Benefit: {physical_activity.resistance_training.benefit}
                </small>
              </div>

              <div className="p-2.5 rounded bg-primary-subtle border border-primary-subtle">
                <strong className="text-primary d-block" style={{ fontSize: "0.8125rem" }}>
                  <i className="bi bi-clock-history me-1"></i> {physical_activity.post_meal_habit.title}
                </strong>
                <p className="text-dark mb-0" style={{ fontSize: "0.8125rem" }}>
                  {physical_activity.post_meal_habit.tip}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sleep & Stress */}
        <div className="col-lg-6">
          <div className="hl-card p-3 p-md-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold text-dark mb-0">
                <i className="bi bi-moon-stars text-primary me-2"></i>
                Sleep Architecture & Stress Regulation
              </h6>
              <span className="badge bg-light text-muted border">Recovery Protocol</span>
            </div>

            <div className="d-flex flex-column gap-2.5">
              {sleep_and_stress.map((s, idx) => (
                <div key={idx} className="p-3 rounded bg-light border">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <strong className="text-dark" style={{ fontSize: "0.875rem" }}>
                      {s.category}
                    </strong>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: "0.7rem" }}>
                      {s.target}
                    </span>
                  </div>
                  <p className="text-muted mb-2" style={{ fontSize: "0.8125rem" }}>
                    {s.recommendation}
                  </p>
                  <small className="text-success fw-semibold" style={{ fontSize: "0.75rem" }}>
                    <i className="bi bi-graph-down-arrow me-1"></i> {s.impact}
                  </small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Precautions & Follow-up */}
      <div className="hl-card p-3 p-md-4">
        <h6 className="fw-bold text-dark mb-3">
          <i className="bi bi-hospital text-danger me-2"></i>
          Clinical Precautions & Physician Follow-up Schedule
        </h6>
        <div className="row g-3">
          {clinical_precautions.map((cp, idx) => (
            <div key={idx} className="col-md-4">
              <div className="p-3 rounded bg-light border h-100">
                <div className="d-flex align-items-center gap-1.5 mb-1 text-danger">
                  <i className="bi bi-bell-fill"></i>
                  <strong style={{ fontSize: "0.875rem" }}>{cp.type}</strong>
                </div>
                <div className="badge bg-white text-dark border mb-2" style={{ fontSize: "0.75rem" }}>
                  {cp.window}
                </div>
                <p className="text-muted mb-0" style={{ fontSize: "0.8125rem", lineHeight: "1.4" }}>
                  {cp.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
