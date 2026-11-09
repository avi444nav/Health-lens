import React, { useState } from "react";

export default function MetricsComparison({ comparison, onOpenUpload }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  if (!comparison || !comparison.metrics || comparison.metrics.length === 0) {
    return (
      <div className="hl-card p-5 text-center my-4">
        <div className="display-6 text-muted mb-3">
          <i className="bi bi-file-earmark-medical"></i>
        </div>
        <h5 className="fw-bold">No Comparative Reports Found</h5>
        <p className="text-muted mx-auto" style={{ maxWidth: "460px" }}>
          Upload your first or follow-up medical lab report to enable automated biomarker delta tracking and historical analysis.
        </p>
        <button className="btn btn-primary mt-2" onClick={onOpenUpload}>
          <i className="bi bi-cloud-arrow-up-fill me-1"></i> Upload Medical Report
        </button>
      </div>
    );
  }

  const categories = ["All", ...new Set(comparison.metrics.map((m) => m.category))];

  const filteredMetrics = comparison.metrics.filter((m) => {
    const matchesCat = selectedCategory === "All" || m.category === selectedCategory;
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.canonical_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const latestDateStr = comparison.latest_report_date
    ? new Date(comparison.latest_report_date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : "Latest";

  const prevDateStr = comparison.previous_report_date
    ? new Date(comparison.previous_report_date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : "Baseline";

  return (
    <div className="mb-4">
      {/* Header Banner */}
      <div className="hl-card p-3 p-md-4 mb-4 border-start border-primary border-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2.5 py-1 fw-bold">
                <i className="bi bi-arrow-left-right me-1"></i> Historical Report Comparison
              </span>
              <span className="text-muted" style={{ fontSize: "0.875rem" }}>
                {latestDateStr} vs {prevDateStr}
              </span>
            </div>
            <h5 className="fw-bold text-dark mt-2 mb-1">Biomarker Trajectory & Delta Shift</h5>
            <p className="text-muted mb-0" style={{ fontSize: "0.875rem" }}>
              {comparison.summary_sentence}
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <div className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 text-start">
              <div className="fs-6 fw-bold">{comparison.total_improved}</div>
              <small style={{ fontSize: "0.7rem" }}>Improved Markers</small>
            </div>
            <div className="badge bg-warning-subtle text-warning border border-warning-subtle px-3 py-2 text-start">
              <div className="fs-6 fw-bold">{comparison.total_worsened}</div>
              <small style={{ fontSize: "0.7rem" }}>Increased Risk</small>
            </div>
            <div className="badge bg-secondary-subtle text-secondary border px-3 py-2 text-start">
              <div className="fs-6 fw-bold">{comparison.total_stable}</div>
              <small style={{ fontSize: "0.7rem" }}>Stable / Baseline</small>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        {/* Category Pills */}
        <div className="d-flex flex-wrap gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`btn btn-sm rounded-pill ${
                selectedCategory === cat
                  ? "btn-primary shadow-sm"
                  : "btn-light text-muted border"
              }`}
              style={{ fontSize: "0.8125rem" }}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ minWidth: "220px" }}>
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-white border-end-0 text-muted">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search biomarker (e.g. cholesterol)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Comparison Table Card */}
      <div className="hl-card overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-muted" style={{ fontSize: "0.8125rem", textTransform: "uppercase" }}>
              <tr>
                <th className="ps-4">Biomarker / Panel</th>
                <th>Previous ({prevDateStr})</th>
                <th>Current ({latestDateStr})</th>
                <th>Delta Change</th>
                <th>Reference Range</th>
                <th>Clinical Status</th>
                <th className="pe-4">Clinical Insight</th>
              </tr>
            </thead>
            <tbody>
              {filteredMetrics.map((m) => {
                const hasPrev = m.previous_value !== null && m.previous_value !== undefined;
                const isIncrease = m.delta_value > 0;
                const isDecrease = m.delta_value < 0;

                let deltaClass = "neutral";
                let icon = "bi-dash";
                if (m.clinical_alert === "positive") {
                  deltaClass = "positive";
                  icon = isDecrease ? "bi-arrow-down-right" : "bi-arrow-up-right";
                } else if (m.clinical_alert === "warning") {
                  deltaClass = "warning";
                  icon = isIncrease ? "bi-arrow-up-right" : "bi-arrow-down-right";
                }

                let statusClass = "optimal";
                if (m.status.toLowerCase().includes("high") || m.status.toLowerCase().includes("critical")) {
                  statusClass = "high";
                } else if (m.status.toLowerCase().includes("borderline") || m.status.toLowerCase().includes("risk")) {
                  statusClass = "borderline";
                } else if (m.status.toLowerCase().includes("low")) {
                  statusClass = "low";
                }

                return (
                  <tr key={m.canonical_key}>
                    <td className="ps-4">
                      <div className="fw-semibold text-dark">{m.name}</div>
                      <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                        {m.category}
                      </small>
                    </td>
                    <td>
                      {hasPrev ? (
                        <span className="fw-medium text-secondary">
                          {m.previous_value} {m.unit}
                        </span>
                      ) : (
                        <span className="text-muted" style={{ fontSize: "0.8125rem" }}>
                          --
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="fw-bold text-dark fs-6">
                        {m.current_value}
                      </span>{" "}
                      <small className="text-muted">{m.unit}</small>
                    </td>
                    <td>
                      {hasPrev ? (
                        <span className={`delta-badge ${deltaClass}`}>
                          <i className={`bi ${icon}`}></i>
                          {m.delta_value > 0 ? `+${m.delta_value}` : m.delta_value} {m.unit}
                          {m.delta_percent !== null && (
                            <span style={{ fontSize: "0.7rem", opacity: 0.85 }}>
                              ({m.delta_percent > 0 ? `+${m.delta_percent}%` : `${m.delta_percent}%`})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="badge bg-light text-muted border" style={{ fontSize: "0.75rem" }}>
                          Baseline Initial
                        </span>
                      )}
                    </td>
                    <td>
                      <small className="text-muted" style={{ fontSize: "0.8125rem" }}>
                        {m.reference_range}
                      </small>
                    </td>
                    <td>
                      <span className={`status-tag ${statusClass}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="pe-4" style={{ maxWidth: "300px" }}>
                      <p className="mb-0 text-muted" style={{ fontSize: "0.8125rem", lineHeight: "1.3" }}>
                        {m.message}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
