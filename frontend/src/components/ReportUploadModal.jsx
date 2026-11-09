import React, { useState } from "react";
import { uploadReport } from "../services/api";

const SAMPLE_REPORTS = [
  {
    name: "Quarterly Lipid & Glycemic Follow-Up (Cholesterol Shift)",
    title: "Quarterly Comprehensive Metabolic Evaluation",
    type: "Metabolic & Lipid Panel",
    text: `Patient Medical Diagnostic Report
Evaluation Date: 2026-08-10
Patient ID: HL-2026-08

CLINICAL BIOCHEMISTRY RESULTS:
Total Cholesterol: 222 mg/dL (Reference: 125 - 200 mg/dL) [ELEVATED]
LDL Cholesterol: 138 mg/dL (Reference: 50 - 100 mg/dL) [HIGH]
HDL Cholesterol: 46 mg/dL (Reference: 40 - 65 mg/dL) [NORMAL]
Triglycerides: 180 mg/dL (Reference: 50 - 150 mg/dL) [ELEVATED]
Fasting Blood Sugar: 96 mg/dL (Reference: 70 - 99 mg/dL) [OPTIMAL]
HbA1c: 5.7% (Reference: 4.0 - 5.6%) [PRE-DIABETIC BORDERLINE]
Serum Creatinine: 0.96 mg/dL (Reference: 0.6 - 1.2 mg/dL) [NORMAL]
eGFR: 88 mL/min/1.73m2 (Reference: > 90 mL/min) [MILD REDUCTION]
Blood Urea Nitrogen: 15 mg/dL (Reference: 7 - 20 mg/dL) [NORMAL]
ALT (SGPT): 39 U/L (Reference: 7 - 45 U/L) [NORMAL]
AST (SGOT): 31 U/L (Reference: 8 - 40 U/L) [NORMAL]
Systolic BP: 126 mmHg (Reference: 90 - 120 mmHg) [BORDERLINE]
Diastolic BP: 82 mmHg (Reference: 60 - 80 mmHg) [BORDERLINE]
Resting Heart Rate: 70 bpm (Reference: 60 - 90 bpm) [NORMAL]
Hemoglobin: 15.4 g/dL (Reference: 13.5 - 17.5 g/dL) [NORMAL]
Total WBC Count: 6700 cells/mcL (Reference: 4500 - 11000) [NORMAL]
Platelet Count: 248000 cells/mcL (Reference: 150000 - 450000) [NORMAL]`
  },
  {
    name: "Lipid Optimization Post-Dietary Intervention",
    title: "Post-Intervention Lipid Assessment",
    type: "Lipid Panel",
    text: `Patient Diagnostic Lab Report
Date: 2026-09-15
Total Cholesterol: 198 mg/dL
LDL Cholesterol: 110 mg/dL
HDL Cholesterol: 52 mg/dL
Triglycerides: 142 mg/dL
Fasting Blood Sugar: 92 mg/dL
HbA1c: 5.5%
Serum Creatinine: 0.92 mg/dL
eGFR: 92 mL/min/1.73m2
Systolic BP: 122 mmHg
Diastolic BP: 78 mmHg`
  }
];

export default function ReportUploadModal({ isOpen, onClose, patientId, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("Diagnostic Lab Report");
  const [reportType, setReportType] = useState("Comprehensive Metabolic & Lipid Panel");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [rawText, setRawText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleLoadSample = (sample) => {
    setTitle(sample.title);
    setReportType(sample.type);
    setRawText(sample.text);
    setFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !rawText.trim()) {
      setError("Please select a PDF file or enter report text.");
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("report_type", reportType);
    formData.append("report_date_str", reportDate);
    if (file) {
      formData.append("file", file);
    }
    if (rawText.trim()) {
      formData.append("raw_text_input", rawText);
    }

    try {
      const res = await uploadReport(patientId, formData);
      setResult(res.data);
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to upload and parse medical report.");
    } finally {
      setUploading(false);
    }
  };

  const handleDone = () => {
    setResult(null);
    setFile(null);
    setRawText("");
    onClose();
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(15, 23, 42, 0.6)" }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          {/* Modal Header */}
          <div className="modal-header bg-light border-bottom px-4 py-3">
            <div className="d-flex align-items-center gap-2">
              <div className="brand-badge" style={{ width: "32px", height: "32px", fontSize: "1rem" }}>
                <i className="bi bi-cloud-arrow-up-fill"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold text-dark mb-0">Upload Medical Lab Report</h5>
                <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                  Automated OCR / Clinical RAG Ingestion & Biomarker Parsing
                </small>
              </div>
            </div>
            <button type="button" className="btn-close" onClick={onClose} disabled={uploading}></button>
          </div>

          {/* Modal Body */}
          <div className="modal-body px-4 py-3">
            {error && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
              </div>
            )}

            {result ? (
              /* Ingestion Success View */
              <div className="p-3 text-center">
                <div
                  className="rounded-circle bg-success-subtle text-success d-flex align-items-center justify-content-center mx-auto mb-3"
                  style={{ width: "64px", height: "64px", fontSize: "2rem" }}
                >
                  <i className="bi bi-check-lg"></i>
                </div>
                <h5 className="fw-bold text-dark">{result.message}</h5>
                <p className="text-muted" style={{ fontSize: "0.875rem" }}>
                  {result.summary}
                </p>

                <div className="text-start mt-4">
                  <h6 className="fw-bold text-dark mb-2">
                    <i className="bi bi-list-check me-1 text-primary"></i> Extracted Biomarkers (
                    {result.extracted_biomarkers?.length || 0}):
                  </h6>
                  <div className="table-responsive border rounded" style={{ maxHeight: "200px" }}>
                    <table className="table table-sm table-striped mb-0" style={{ fontSize: "0.8125rem" }}>
                      <thead>
                        <tr>
                          <th>Biomarker</th>
                          <th>Category</th>
                          <th>Recorded Value</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.extracted_biomarkers?.map((bm, i) => (
                          <tr key={i}>
                            <td className="fw-medium">{bm.name}</td>
                            <td className="text-muted">{bm.category}</td>
                            <td className="fw-bold text-dark">
                              {bm.value} {bm.unit}
                            </td>
                            <td>
                              <span className="badge bg-light text-dark border">{bm.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-4">
                  <button className="btn btn-primary px-4" onClick={handleDone}>
                    View Updated Dashboard & Historical Comparisons
                  </button>
                </div>
              </div>
            ) : (
              /* Upload Form */
              <form onSubmit={handleSubmit}>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark" style={{ fontSize: "0.8125rem" }}>
                      Report Title
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold text-dark" style={{ fontSize: "0.8125rem" }}>
                      Report Evaluation Date
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Dropzone */}
                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark d-block" style={{ fontSize: "0.8125rem" }}>
                    Select PDF / Lab Document File
                  </label>
                  <label className="dropzone d-block w-100">
                    <i className="bi bi-file-earmark-arrow-up text-primary fs-1 d-block mb-2"></i>
                    <span className="fw-semibold text-dark">
                      {file ? file.name : "Click or drag & drop medical report (PDF / TXT)"}
                    </span>
                    <small className="text-muted d-block mt-1">
                      {file ? `${(file.size / 1024).toFixed(1)} KB` : "Supports standard clinical laboratory formats"}
                    </small>
                    <input
                      type="file"
                      className="d-none"
                      accept=".pdf,.txt"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>

                {/* Or Raw Text Area */}
                <div className="mb-3">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <label className="form-label fw-semibold text-dark mb-0" style={{ fontSize: "0.8125rem" }}>
                      Or Paste Report Text Directly / Load Sample
                    </label>
                    <div className="dropdown">
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-decoration-none p-0"
                        style={{ fontSize: "0.75rem" }}
                        onClick={() => handleLoadSample(SAMPLE_REPORTS[0])}
                      >
                        <i className="bi bi-magic me-1"></i> Load Sample Follow-up Report
                      </button>
                    </div>
                  </div>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Paste raw medical lab report text here (e.g. Total Cholesterol: 220 mg/dL, Fasting Glucose: 98 mg/dL...)"
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    style={{ fontSize: "0.8125rem", fontFamily: "monospace" }}
                  ></textarea>
                </div>

                {/* Footer Buttons */}
                <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                  <button type="button" className="btn btn-sm btn-light border" onClick={onClose} disabled={uploading}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary px-3" disabled={uploading}>
                    {uploading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                        Parsing Report...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-cpu me-1"></i> Ingest & Parse Report
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
