import React, { useState, useEffect } from "react";
import axios from "axios";

const MaintenanceSettings = () => {
  const [status, setStatus] = useState("false");
  const [message, setMessage] = useState(
    "We are undergoing maintenance, please try again later."
  );
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  /* ================= FETCH STATUS ================= */
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

  useEffect(() => {
    fetchMaintenanceStatus();
  }, []);

  /* ================= SAVE ================= */
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
    <div className="min-vh-100 bg-light py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-7 col-md-9">

            {/* ================= CARD ================= */}
            <div className="card shadow-sm border-0 rounded-4">
              <div className="card-header bg-primary text-white rounded-top-4">
                <div className="d-flex align-items-center">
                  <i className="bi bi-tools fs-4 me-2"></i>
                  <h5 className="mb-0 fw-semibold">Maintenance Mode</h5>
                </div>
              </div>

              <div className="card-body p-4">

                {/* STATUS */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    Application Status
                  </label>
                  <select
                    className="form-select form-select-lg"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="false">Live (Maintenance OFF)</option>
                    <option value="true">Maintenance ON</option>
                  </select>
                  <div className="form-text">
                    Enable maintenance mode to block users temporarily.
                  </div>
                </div>

                {/* MESSAGE */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    Maintenance Message
                  </label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                {/* PREVIEW */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    Message Preview
                  </label>
                  <div className="border rounded-3 p-3 bg-light text-muted">
                    {message}
                  </div>
                </div>

                {/* SUCCESS ALERT */}
                {saved && (
                  <div className="alert alert-success d-flex align-items-center">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    Maintenance settings saved successfully
                  </div>
                )}

                {/* ACTION */}
                <button
                  className="btn btn-primary btn-lg w-100"
                  onClick={saveMaintenance}
                  disabled={loading}
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
            {/* ================= END CARD ================= */}

          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceSettings;
