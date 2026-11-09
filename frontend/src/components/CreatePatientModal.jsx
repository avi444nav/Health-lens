import React, { useState } from "react";
import { createPatient } from "../services/api";

export default function CreatePatientModal({ isOpen, onClose, onPatientCreated }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState(48);
  const [gender, setGender] = useState("Male");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [heightCm, setHeightCm] = useState(172);
  const [weightKg, setWeightKg] = useState(76);
  const [smokingStatus, setSmokingStatus] = useState(false);
  const [diabetesHistory, setDiabetesHistory] = useState(false);
  const [hypertensionHistory, setHypertensionHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a valid patient name.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await createPatient({
        name,
        age: Number(age),
        gender,
        blood_group: bloodGroup,
        height_cm: Number(heightCm),
        weight_kg: Number(weightKg),
        smoking_status: smokingStatus,
        diabetes_history: diabetesHistory,
        hypertension_history: hypertensionHistory
      });
      if (onPatientCreated) {
        onPatientCreated(res.data);
      }
      onClose();
    } catch (err) {
      setError("Failed to create patient profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(15, 23, 42, 0.6)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div className="modal-header bg-light border-bottom px-4 py-3">
            <h5 className="modal-title fw-bold text-dark mb-0">Register New Patient Profile</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body px-4 py-3">
              {error && <div className="alert alert-danger py-2">{error}</div>}

              <div className="mb-3">
                <label className="form-label fw-semibold" style={{ fontSize: "0.8125rem" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label fw-semibold" style={{ fontSize: "0.8125rem" }}>
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min={1}
                    max={120}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label fw-semibold" style={{ fontSize: "0.8125rem" }}>
                    Gender
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-4">
                  <label className="form-label fw-semibold" style={{ fontSize: "0.8125rem" }}>
                    Blood Group
                  </label>
                  <select
                    className="form-select form-select-sm"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div className="col-4">
                  <label className="form-label fw-semibold" style={{ fontSize: "0.8125rem" }}>
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                  />
                </div>
                <div className="col-4">
                  <label className="form-label fw-semibold" style={{ fontSize: "0.8125rem" }}>
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                  />
                </div>
              </div>

              <div className="border-top pt-2">
                <label className="form-label fw-semibold text-dark d-block mb-1.5" style={{ fontSize: "0.8125rem" }}>
                  Clinical Risk Indicators
                </label>
                <div className="d-flex flex-column gap-1.5">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="smokeCheck"
                      checked={smokingStatus}
                      onChange={(e) => setSmokingStatus(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="smokeCheck" style={{ fontSize: "0.8125rem" }}>
                      Active Tobacco Smoker
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="hypCheck"
                      checked={hypertensionHistory}
                      onChange={(e) => setHypertensionHistory(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="hypCheck" style={{ fontSize: "0.8125rem" }}>
                      Diagnosed Hypertension / On BP Medication
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="diabCheck"
                      checked={diabetesHistory}
                      onChange={(e) => setDiabetesHistory(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="diabCheck" style={{ fontSize: "0.8125rem" }}>
                      Diagnosed Diabetes / Impaired Fasting Glucose
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer bg-light px-4 py-2">
              <button type="button" className="btn btn-sm btn-light border" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn btn-sm btn-primary px-3" disabled={saving}>
                {saving ? "Creating..." : "Save Patient Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
