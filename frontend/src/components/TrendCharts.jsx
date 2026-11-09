import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from "recharts";

export default function TrendCharts({ longitudinalData }) {
  const [activeTab, setActiveTab] = useState("lipids");

  if (!longitudinalData || !longitudinalData.timeline || longitudinalData.timeline.length === 0) {
    return (
      <div className="hl-card p-4 text-center text-muted">
        <i className="bi bi-graph-up fs-2 d-block mb-2"></i>
        Insufficient longitudinal timeline data. Upload multiple reports across time to visualize trend curves.
      </div>
    );
  }

  const data = longitudinalData.timeline;

  return (
    <div className="hl-card p-3 p-md-4 mb-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h5 className="fw-bold text-dark mb-1">
            <i className="bi bi-graph-up-arrow me-2 text-primary"></i>
            Longitudinal Health Biomarker Trends
          </h5>
          <p className="text-muted mb-0" style={{ fontSize: "0.875rem" }}>
            Track biomarker dynamics and medication/lifestyle responses across all report milestones.
          </p>
        </div>

        {/* Panel Switcher */}
        <div className="btn-group btn-group-sm" role="group">
          <button
            type="button"
            className={`btn ${activeTab === "lipids" ? "btn-primary" : "btn-light border"}`}
            onClick={() => setActiveTab("lipids")}
          >
            <i className="bi bi-heart-pulse me-1"></i> Lipid Panel
          </button>
          <button
            type="button"
            className={`btn ${activeTab === "glycemic" ? "btn-primary" : "btn-light border"}`}
            onClick={() => setActiveTab("glycemic")}
          >
            <i className="bi bi-droplet me-1"></i> Glycemic / Glucose
          </button>
          <button
            type="button"
            className={`btn ${activeTab === "organ" ? "btn-primary" : "btn-light border"}`}
            onClick={() => setActiveTab("organ")}
          >
            <i className="bi bi-shield me-1"></i> Renal & Liver
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div style={{ width: "100%", height: 340 }}>
        <ResponsiveContainer>
          {activeTab === "lipids" ? (
            <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="formatted_date" stroke="#64748b" style={{ fontSize: "0.8125rem" }} />
              <YAxis domain={['auto', 'auto']} stroke="#64748b" style={{ fontSize: "0.8125rem" }} unit=" mg/dL" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  fontSize: "0.8125rem"
                }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "0.8125rem" }} />
              <ReferenceLine y={200} label={{ value: "Cholesterol Target <200", fill: "#ef4444", fontSize: 11 }} stroke="#ef4444" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="cholesterol_total" name="Total Cholesterol" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="cholesterol_ldl" name="LDL (Bad)" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="cholesterol_hdl" name="HDL (Good)" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="triglycerides" name="Triglycerides" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          ) : activeTab === "glycemic" ? (
            <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="formatted_date" stroke="#64748b" style={{ fontSize: "0.8125rem" }} />
              <YAxis yAxisId="left" domain={['auto', 'auto']} stroke="#0284c7" unit=" mg/dL" style={{ fontSize: "0.8125rem" }} />
              <YAxis yAxisId="right" orientation="right" domain={[4, 9]} stroke="#8b5cf6" unit=" %" style={{ fontSize: "0.8125rem" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  fontSize: "0.8125rem"
                }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "0.8125rem" }} />
              <ReferenceLine yAxisId="left" y={100} label={{ value: "Fasting Normal <100", fill: "#10b981", fontSize: 11 }} stroke="#10b981" strokeDasharray="3 3" />
              <Line yAxisId="left" type="monotone" dataKey="glucose_fasting" name="Fasting Glucose (mg/dL)" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line yAxisId="right" type="monotone" dataKey="hba1c" name="HbA1c (%)" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          ) : (
            <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="formatted_date" stroke="#64748b" style={{ fontSize: "0.8125rem" }} />
              <YAxis yAxisId="egfr" domain={[50, 120]} stroke="#10b981" unit=" mL/min" style={{ fontSize: "0.8125rem" }} />
              <YAxis yAxisId="enzymes" orientation="right" domain={['auto', 'auto']} stroke="#f59e0b" unit=" U/L" style={{ fontSize: "0.8125rem" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  fontSize: "0.8125rem"
                }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "0.8125rem" }} />
              <Line yAxisId="egfr" type="monotone" dataKey="egfr" name="Kidney eGFR (mL/min)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line yAxisId="enzymes" type="monotone" dataKey="alt_sgpt" name="Liver ALT / SGPT (U/L)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
              <Line yAxisId="enzymes" type="monotone" dataKey="ast_sgot" name="Liver AST / SGOT (U/L)" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Explanatory footer */}
      <div className="d-flex align-items-center justify-content-between mt-3 pt-3 border-top text-muted" style={{ fontSize: "0.8125rem" }}>
        <span>
          <i className="bi bi-info-circle me-1 text-primary"></i>
          {data.length} historical milestone points recorded from {data[0]?.formatted_date} to {data[data.length - 1]?.formatted_date}.
        </span>
        <span className="badge bg-light text-secondary border">
          Confidence: High (Longitudinal Extracted)
        </span>
      </div>
    </div>
  );
}
