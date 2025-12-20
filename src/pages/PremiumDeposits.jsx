import React, { useEffect, useState } from "react";
import axios from "axios";

const BASE_URL = "http://194.164.148.244:4062/api/admin";

const PremiumDeposits = () => {
  const [deposits, setDeposits] = useState([]);
  const [isPremium, setIsPremium] = useState(true);
  const [depositOptions, setDepositOptions] = useState([]);
  const [optionInput, setOptionInput] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // ============================
  // FETCH ALL DEPOSITS
  // ============================
  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/getalldeposites`);
      setDeposits(res.data.depositOptions || []);
    } catch (error) {
      alert("Failed to fetch deposits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  // ============================
  // ADD OPTION TO ARRAY
  // ============================
  const addOption = () => {
    if (!optionInput.trim()) return;
    if (depositOptions.includes(optionInput)) return;
    setDepositOptions([...depositOptions, optionInput]);
    setOptionInput("");
  };

  const removeOption = (index) => {
    setDepositOptions(depositOptions.filter((_, i) => i !== index));
  };

  // ============================
  // CREATE / UPDATE
  // ============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (depositOptions.length === 0) {
      alert("Please add at least one deposit option");
      return;
    }

    const payload = {
      isPremium,
      depositOptions,
    };

    try {
      if (editingId) {
        // UPDATE
        await axios.put(`${BASE_URL}/updatedeposite/${editingId}`, payload);
        alert("Deposit option updated successfully");
      } else {
        // CREATE
        await axios.post(`${BASE_URL}/createdeposite`, payload);
        alert("Deposit option created successfully");
      }

      resetForm();
      fetchDeposits();
    } catch (error) {
      alert("Operation failed");
    }
  };

  // ============================
  // EDIT
  // ============================
  const handleEdit = (item) => {
    setEditingId(item._id);
    setIsPremium(item.isPremium);
    setDepositOptions(item.depositOptions);
  };

  // ============================
  // DELETE
  // ============================
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this deposit option?"))
      return;

    try {
      await axios.delete(`${BASE_URL}/deletedeposite/${id}`);
      alert("Deleted successfully");
      fetchDeposits();
    } catch (error) {
      alert("Delete failed");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setIsPremium(true);
    setDepositOptions([]);
    setOptionInput("");
  };

  return (
    <div className="container my-5">
      <h2 className="fw-bold mb-4">🚗 Car Premium Deposits</h2>

      {/* ================= FORM ================= */}
      <form onSubmit={handleSubmit} className="card p-4 mb-5 shadow-sm">
        <h5 className="mb-3">
          {editingId ? "Update Deposit Option" : "Create Deposit Option"}
        </h5>

        <div className="form-check form-switch mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            checked={isPremium}
            onChange={(e) => setIsPremium(e.target.checked)}
          />
          <label className="form-check-label">
            Premium Deposit Required
          </label>
        </div>

        <div className="d-flex mb-3">
          <input
            type="text"
            className="form-control me-2"
            placeholder="Enter deposit option (e.g., Bike)"
            value={optionInput}
            onChange={(e) => setOptionInput(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={addOption}
          >
            Add
          </button>
        </div>

        {/* OPTIONS LIST */}
        <div className="mb-3">
          {depositOptions.map((opt, index) => (
            <span
              key={index}
              className="badge bg-secondary me-2 p-2"
              style={{ cursor: "pointer" }}
              onClick={() => removeOption(index)}
            >
              {opt} ❌
            </span>
          ))}
        </div>

        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-success">
            {editingId ? "Update" : "Create"}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* ================= TABLE ================= */}
      <div className="card shadow-sm">
        <div className="card-header fw-semibold">
          All Deposit Options
        </div>

        <div className="card-body p-0">
          {loading ? (
            <p className="p-3">Loading...</p>
          ) : deposits.length === 0 ? (
            <p className="p-3 text-muted">No deposit options found</p>
          ) : (
            <table className="table table-bordered mb-0">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Premium</th>
                  <th>Deposit Options</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((item, index) => (
                  <tr key={item._id}>
                    <td>{index + 1}</td>
                    <td>
                      {item.isPremium ? (
                        <span className="badge bg-success">Yes</span>
                      ) : (
                        <span className="badge bg-danger">No</span>
                      )}
                    </td>
                    <td>
                      {item.depositOptions.map((opt, i) => (
                        <span
                          key={i}
                          className="badge bg-info text-dark me-1"
                        >
                          {opt}
                        </span>
                      ))}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary me-2"
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(item._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default PremiumDeposits;
