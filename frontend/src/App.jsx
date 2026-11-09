import React, { useState, useEffect } from "react";
import "bootswatch/dist/minty/bootstrap.min.css";

import Navbar from "./components/Navbar";
import PatientSummaryCard from "./components/PatientSummaryCard";
import MetricsComparison from "./components/MetricsComparison";
import TrendCharts from "./components/TrendCharts";
import RiskPredictionView from "./components/RiskPredictionView";
import LifestyleRecommendations from "./components/LifestyleRecommendations";
import ReportHistoryList from "./components/ReportHistoryList";
import RagChatDrawer from "./components/RagChatDrawer";
import ReportUploadModal from "./components/ReportUploadModal";
import CreatePatientModal from "./components/CreatePatientModal";
import {
  getPatients,
  getPatientProfile,
  getPatientReports,
  getComparison,
  getLongitudinal,
  getPredictions,
  getLifestyle,
  resetDemoData
} from "./services/api";

export default function App() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patient, setPatient ] = useState(null);
  const [reports, setReports] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [longitudinal, setLongitudinal] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [lifestyle, setLifestyle] = useState(null);

  const [activeTab, setActiveTab] = useState("comparison");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals & Drawers
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
  const [isRagOpen, setIsRagOpen] = useState(false);

  // Initial load
  useEffect(() => {
    loadPatientsList();
  }, []);

  const loadPatientsList = async () => {
    try {
      setLoading(true);
      const res = await getPatients();
      setPatients(res.data);
      if (res.data.length > 0) {
        setSelectedPatientId(res.data[0].id);
      }
    } catch (e) {
      console.error("Failed to load patients", e);
    } finally {
      setLoading(false);
    }
  };

  // Load patient telemetry whenever selected patient changes
  useEffect(() => {
    if (selectedPatientId) {
      loadPatientDetails(selectedPatientId);
    }
  }, [selectedPatientId]);

  const loadPatientDetails = async (pId) => {
    try {
      setRefreshing(true);
      const [pRes, rRes, cRes, lRes, prRes, lfRes] = await Promise.all([
        getPatientProfile(pId),
        getPatientReports(pId),
        getComparison(pId),
        getLongitudinal(pId),
        getPredictions(pId),
        getLifestyle(pId),
      ]);

      setPatient(pRes.data);
      setReports(rRes.data);
      setComparison(cRes.data);
      setLongitudinal(lRes.data);
      setPrediction(prRes.data);
      setLifestyle(lfRes.data);
    } catch (e) {
      console.error("Failed to load patient telemetry", e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleResetDemo = async () => {
    if (window.confirm("Reset all patient reports to original demo state?")) {
      try {
        setLoading(true);
        await resetDemoData();
        await loadPatientsList();
      } catch (e) {
        console.error("Failed to reset demo data", e);
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePatientCreated = (newPatient) => {
    setPatients((prev) => [...prev, newPatient]);
    setSelectedPatientId(newPatient.id);
  };

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: "var(--hl-bg)" }}>
      {/* Navigation Header */}
      <Navbar
        patients={patients}
        selectedPatientId={selectedPatientId}
        onSelectPatient={(id) => setSelectedPatientId(id)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenNewPatient={() => setIsNewPatientOpen(true)}
        onToggleRagChat={() => setIsRagOpen(!isRagOpen)}
        onResetDemo={handleResetDemo}
        loading={loading}
      />

      {/* Main Container */}
      <main className="container-fluid px-3 px-md-4 flex-grow-1">
        {loading ? (
          <div className="hl-card p-5 text-center my-5">
            <div className="spinner-border text-primary mb-3" role="status" style={{ width: "3rem", height: "3rem" }}></div>
            <h5 className="fw-bold text-dark">Initializing Health Lens Clinical Intelligence...</h5>
            <p className="text-muted">Loading vector embeddings and patient biomarker models</p>
          </div>
        ) : (
          <>
            {/* Patient Header Summary Card */}
            <PatientSummaryCard
              patient={patient}
              reports={reports}
              prediction={prediction}
              comparison={comparison}
            />

            {/* Navigation Tabs */}
            <div className="hl-card mb-4 overflow-hidden">
              <ul className="nav hl-nav-tabs px-3 pt-2">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === "comparison" ? "active" : ""}`}
                    onClick={() => setActiveTab("comparison")}
                  >
                    <i className="bi bi-arrow-left-right me-1.5"></i>
                    Historical Report Comparison
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === "trends" ? "active" : ""}`}
                    onClick={() => setActiveTab("trends")}
                  >
                    <i className="bi bi-graph-up me-1.5"></i>
                    Longitudinal Trends
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === "predictions" ? "active" : ""}`}
                    onClick={() => setActiveTab("predictions")}
                  >
                    <i className="bi bi-shield-exclamation me-1.5"></i>
                    Future Complication Risk Radar
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === "lifestyle" ? "active" : ""}`}
                    onClick={() => setActiveTab("lifestyle")}
                  >
                    <i className="bi bi-apple me-1.5"></i>
                    Personalized Lifestyle & Diet
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === "archive" ? "active" : ""}`}
                    onClick={() => setActiveTab("archive")}
                  >
                    <i className="bi bi-folder2-open me-1.5"></i>
                    Document Archive ({reports?.length || 0})
                  </button>
                </li>
              </ul>
            </div>

            {/* Tab Views */}
            {activeTab === "comparison" && (
              <MetricsComparison
                comparison={comparison}
                onOpenUpload={() => setIsUploadOpen(true)}
              />
            )}

            {activeTab === "trends" && (
              <TrendCharts longitudinalData={longitudinal} />
            )}

            {activeTab === "predictions" && (
              <RiskPredictionView prediction={prediction} />
            )}

            {activeTab === "lifestyle" && (
              <LifestyleRecommendations lifestyle={lifestyle} />
            )}

            {activeTab === "archive" && (
              <ReportHistoryList
                reports={reports}
                onOpenUpload={() => setIsUploadOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Action Button for RAG Assistant */}
      <button
        className="btn btn-primary rounded-circle position-fixed shadow-lg d-flex align-items-center justify-content-center"
        style={{
          bottom: "24px",
          right: "24px",
          width: "56px",
          height: "56px",
          fontSize: "1.4rem",
          zIndex: 1040,
          boxShadow: "0 4px 14px rgba(2, 132, 199, 0.45)"
        }}
        title="Ask HealthLens AI Assistant"
        onClick={() => setIsRagOpen(!isRagOpen)}
      >
        <i className="bi bi-robot"></i>
      </button>

      {/* Upload Modal */}
      <ReportUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        patientId={selectedPatientId}
        onUploadSuccess={() => loadPatientDetails(selectedPatientId)}
      />

      {/* Register Patient Modal */}
      <CreatePatientModal
        isOpen={isNewPatientOpen}
        onClose={() => setIsNewPatientOpen(false)}
        onPatientCreated={handlePatientCreated}
      />

      {/* Contextual RAG Chat Drawer */}
      <RagChatDrawer
        isOpen={isRagOpen}
        onClose={() => setIsRagOpen(false)}
        patientId={selectedPatientId}
        patientName={patient?.name}
      />

      {/* Footer */}
      <footer className="mt-auto py-3 bg-white border-top text-center text-muted" style={{ fontSize: "0.8125rem" }}>
        <div className="container-fluid d-flex flex-wrap align-items-center justify-content-between px-4 gap-2">
          <span>
            <strong>HealthLens</strong> — Precision Medical Intelligence & Historical Biomarker Analytics Platform
          </span>
          <span className="text-secondary">
            Built with React, Bootstrap 5, Python FastAPI, RAG & ML Clinical Risk Models
          </span>
        </div>
      </footer>
    </div>
  );
}
