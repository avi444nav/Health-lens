import React, { useState } from "react";

export default function ReportHistoryList({ reports, onOpenUpload }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!reports || reports.length === 0) {
    return (
      <div className="hl-card p-5 text-center my-4">
        <i className="bi bi-folder2-open text-muted fs-1 mb-2 d-block"></i>
        <h5 className="fw-bold">No Medical Reports Ingested</h5>
        <p className="text-muted mx-auto" style={{ maxWidth: "420px" }}>
          Upload your PDF reports or lab transcripts to create a longitudinal history.
        </p>
        <button className="btn btn-primary" onClick={onOpenUpload}>
          <i className="bi bi-cloud-arrow-up-fill me-1"></i> Upload First Report
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h5 className="fw-bold text-dark mb-0">
            <i className="bi bi-clock-history text-primary me-2"></i>
            Chronological Medical Document Archive
          </h5>
          <small className="text-muted">
            {reports.length} document(s) indexed in vector database & clinical repository
          </small>
        </div>
        <button className="btn btn-sm btn-primary" onClick={onOpenUpload}>
          <i className="bi bi-plus-lg me-1"></i> Add Lab Report
        </button>
      </div>

      {/* Reports Timeline */}
      <div className="d-flex flex-column gap-3">
        {reports.map((rep, idx) => {
          const isExpanded = expandedId === rep.id;
          const reportDateStr = new Date(rep.report_date).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric"
          });

          return (
            <div key={rep.id} className="hl-card p-3 p-md-4">
              <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
                <div className="d-flex align-items-start gap-3">
                  <div
                    className="rounded-3 bg-primary-subtle text-primary d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: "44px", height: "44px", fontSize: "1.25rem" }}
                  >
                    <i className="bi bi-file-earmark-medical"></i>
                  </div>
                  <div>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <h6 className="fw-bold text-dark mb-0">{rep.title}</h6>
                      {idx === 0 && (
                        <span className="badge bg-primary rounded-pill" style={{ fontSize: "0.7rem" }}>
                          Latest Report
                        </span>
                      )}
                    </div>
                    <div className="text-muted mt-1" style={{ fontSize: "0.8125rem" }}>
                      <i className="bi bi-calendar-event me-1"></i> {reportDateStr} •{" "}
                      <i className="bi bi-tag me-1"></i> {rep.report_type} •{" "}
                      <i className="bi bi-file-earmark me-1"></i> {rep.file_name || "Text Document"}
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button
                    className="btn btn-sm btn-light border text-muted"
                    onClick={() => setExpandedId(isExpanded ? null : rep.id)}
                    style={{ fontSize: "0.8125rem" }}
                  >
                    {isExpanded ? "Collapse Details" : "View Extracted Markers"}
                    <i className={`bi bi-chevron-${isExpanded ? "up" : "down"} ms-1`}></i>
                  </button>
                </div>
              </div>

              {/* Summary note */}
              {rep.summary && (
                <div className="mt-3 p-2.5 rounded bg-light border text-muted" style={{ fontSize: "0.8125rem" }}>
                  <strong>Clinical Summary:</strong> {rep.summary}
                </div>
              )}

              {/* Biomarkers preview pills */}
              <div className="d-flex flex-wrap gap-1.5 mt-2.5">
                {rep.biomarkers?.map((bm) => (
                  <span
                    key={bm.id}
                    className="badge bg-light text-dark border d-inline-flex align-items-center gap-1"
                    style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                  >
                    <span className="text-muted">{bm.name}:</span>
                    <strong className="text-dark">
                      {bm.value} {bm.unit}
                    </strong>
                    {bm.status !== "Optimal" && bm.status !== "Normal" && (
                      <span className="badge bg-warning-subtle text-warning-emphasis p-0 px-1" style={{ fontSize: "0.65rem" }}>
                        {bm.status}
                      </span>
                    )}
                  </span>
                ))}
              </div>

              {/* Expanded Detailed Table */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-top">
                  <h6 className="fw-bold text-dark mb-2" style={{ fontSize: "0.875rem" }}>
                    Full Extracted Biomarker Registry
                  </h6>
                  <div className="table-responsive border rounded">
                    <table className="table table-sm table-hover mb-0" style={{ fontSize: "0.8125rem" }}>
                      <thead className="table-light">
                        <tr>
                          <th>Biomarker Name</th>
                          <th>Category</th>
                          <th>Value</th>
                          <th>Reference Interval</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rep.biomarkers?.map((b) => (
                          <tr key={b.id}>
                            <td className="fw-semibold text-dark">{b.name}</td>
                            <td className="text-muted">{b.category}</td>
                            <td className="fw-bold text-primary">
                              {b.value} {b.unit}
                            </td>
                            <td className="text-muted">
                              {b.reference_min ?? 0} - {b.reference_max ?? "N/A"} {b.unit}
                            </td>
                            <td>
                              <span className="badge bg-light text-dark border">{b.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
