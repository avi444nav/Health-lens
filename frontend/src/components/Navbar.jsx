import React from "react";

export default function Navbar({
  patients,
  selectedPatientId,
  onSelectPatient,
  onOpenUpload,
  onOpenNewPatient,
  onToggleRagChat,
  onResetDemo,
  loading
}) {
  const currentPatient = patients.find((p) => p.id === Number(selectedPatientId));

  return (
    <nav className="hl-navbar py-2 px-3 mb-4">
      <div className="container-fluid d-flex flex-wrap align-items-center justify-content-between gap-3">
        {/* Brand */}
        <div className="d-flex align-items-center gap-3">
          <div className="brand-badge">
            <i className="bi bi-activity"></i>
          </div>
          <div>
            <div className="fw-bold fs-5 text-dark lh-1 d-flex align-items-center gap-2">
              HealthLens
             <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill">

                AI Precision
              </span>
            </div>
            <small className="text-muted" style={{ fontSize: "0.75rem" }}>
              Medical Report RAG & Predictive Health Analytics
            </small>
          </div>
        </div>

        {/* Center: Active Patient Selector */}
        <div className="d-flex align-items-center gap-2">
          <div className="input-group input-group-sm" style={{ minWidth: "260px" }}>
            <span className="input-group-text bg-light text-muted border-end-0">
              <i className="bi bi-person-circle"></i>
            </span>
            <select
              className="form-select bg-light border-start-0 fw-semibold"
              value={selectedPatientId || ""}
              onChange={(e) => onSelectPatient(Number(e.target.value))}
              disabled={loading}
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.age}y {p.gender[0]}) - ID: #{p.id}
                </option>
              ))}
            </select>
          </div>
          <button
            className="btn btn-sm btn-outline-secondary"
            title="Create New Patient"
            onClick={onOpenNewPatient}
          >
            <i className="bi bi-person-plus"></i>
          </button>
        </div>

        {/* Right Actions */}
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
            onClick={onToggleRagChat}
          >
            <i className="bi bi-chat-dots-fill"></i>
            <span className="d-none d-md-inline">Ask HealthLens AI</span>
          </button>

          <button
            className="btn btn-sm btn-primary d-flex align-items-center gap-1 shadow-sm"
            onClick={onOpenUpload}
          >
            <i className="bi bi-cloud-arrow-up-fill"></i>
            <span>Upload Report</span>
          </button>

          <button
            className="btn btn-sm btn-light text-muted border"
            title="Reset Demo Sample Data"
            onClick={onResetDemo}
          >
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>
    </nav>
  );
}
