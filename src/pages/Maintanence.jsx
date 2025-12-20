import React, { useState, useEffect } from "react";
import axios from "axios";

const MaintenanceSettings = () => {
  const [status, setStatus] = useState("false");
  const [message, setMessage] = useState(
    "We are undergoing maintenance, please try again later."
  );
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // FETCH EXISTING STATUS
  const fetchMaintenanceStatus = async () => {
    try {
      const res = await axios.get(
        "http://194.164.148.244:4062/api/admin/maintenance-status"
      );

      if (res.data) {
        setStatus(res.data.maintenance ? "true" : "false");
        setMessage(res.data.message || message);
      }
    } catch (err) {
      console.error("Fetch failed:", err.message);
    }
  };

  // LOAD ON MOUNT
  useEffect(() => {
    fetchMaintenanceStatus();
  }, []);

  // SAVE UPDATE
  const saveMaintenance = async () => {
    setLoading(true);
    setSaved(false);

    try {
      await axios.post(
        "http://194.164.148.244:4062/api/admin/setmaintenance",
        { status, message },
        { headers: { "Content-Type": "application/json" } }
      );

      setSaved(true);
    } catch (err) {
      alert("Failed: " + err.message);
    } finally {
      setLoading(false);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className="min-vh-100 py-5">
      <div className="container">
        <div
          className="mx-auto shadow-lg rounded-4 overflow-hidden"
          style={{ maxWidth: "650px" }}
        >
          {/* Top Gradient Header */}
          <div
            className="p-4 text-white"
            style={{
              background:
                "linear-gradient(120deg, #ff5e62, #ff9966 50%, #ffdd00)",
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0 fw-bold d-flex align-items-center">
                <i className="bi bi-wrench-adjustable-circle me-2 fs-3"></i>
                Maintenance Mode
              </h4>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 bg-white bg-opacity-75 backdrop-blur rounded-bottom-4">
            {/* Status Toggle */}
            <div className="mb-4">
              <label className="form-label fw-bold text-dark">Status</label>
              <select
                className="form-select form-select-lg border-2"
                style={{ borderColor: "#ff5e62" }}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="false">🟢 LIVE (OFF)</option>
                <option value="true">🔴 MAINTENANCE (ON)</option>
              </select>
              <small className="text-muted">
                Turn <strong>ON</strong> to show maintenance screen.
              </small>
            </div>

            {/* Message Input */}
            <div className="mb-4">
              <label className="form-label fw-bold text-dark">
                Display Message
              </label>
              <textarea
                className="form-control border-2"
                style={{ borderColor: "#ff9966", minHeight: "120px" }}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            {/* Preview */}
            <div
              className="p-3 mb-4 rounded-3 text-dark"
              style={{
                background:
                  "linear-gradient(135deg, #fffbe6, #ffe4b5, #ffd1b3)",
                border: "2px solid #ff9966",
              }}
            >
              <h6 className="fw-bold mb-2 d-flex align-items-center">
                <i className="bi bi-tools me-2"></i>
                Preview
              </h6>
              <p className="mb-0">{message}</p>
            </div>

            {/* Success Notification */}
            {saved && (
              <div
                className="alert alert-success border-0 rounded-3 text-success fw-bold animate__animated animate__fadeIn"
                style={{
                  background:
                    "linear-gradient(135deg, #d4ffb3, #b6ff9c, #8de875)",
                }}
              >
                <i className="bi bi-check-circle-fill me-2"></i>
                Maintenance settings saved!
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={saveMaintenance}
              className="btn btn-lg w-100 text-white fw-bold shadow"
              disabled={loading}
              style={{
                background:
                  "linear-gradient(120deg, #ff5e62, #ff9966, #ffdd00)",
                border: "none",
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-save2 me-2"></i>
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceSettings;
