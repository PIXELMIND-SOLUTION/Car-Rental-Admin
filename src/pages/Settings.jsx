import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const Settings = () => {
  const storedUser = sessionStorage.getItem('adminUser');
  const sessionUser = storedUser ? JSON.parse(storedUser) : null;
  const userId = sessionUser?.id;

  const [adminData, setAdminData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) fetchAdminProfile();
    else {
      toast.error('Admin user not found in session');
      setLoading(false);
    }
  }, [userId]);

  const fetchAdminProfile = async () => {
    try {
      const res = await axios.get(`https://varahibackend.varahiselfdrivecars.com/api/admin/profileadmin/${userId}`);
      const data = res.data.admin;
      setAdminData({
        name: data.name || '',
        email: data.email || '',
        mobile: data.mobile || '',
        password: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      toast.error('Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setAdminData({ ...adminData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);

    // Check if password fields are filled but don't match
    if ((adminData.password || adminData.confirmPassword) &&
      adminData.password !== adminData.confirmPassword) {
      toast.error('Passwords do not match!');
      setUpdating(false);
      return;
    }

    // Check if password is too short when provided
    if (adminData.password && adminData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      setUpdating(false);
      return;
    }

    const payload = {
      name: adminData.name,
      email: adminData.email,
      mobile: adminData.mobile,
      password: adminData.password,
      confirmPassword: adminData.confirmPassword
    };

    // Only include password in payload if it's provided
    if (adminData.password) {
      payload.password = adminData.password;
    }

    try {
      const response = await axios.put(
        `https://varahibackend.varahiselfdrivecars.com/api/admin/updateadmin/${userId}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionUser?.token}` // Add if using token auth
          }
        }
      );

      if (response.status === 200) {
        toast.success('Profile updated successfully');
        // Update session without storing plain password
        const updatedUser = {
          ...sessionUser,
          name: adminData.name,
          email: adminData.email,
          mobile: adminData.mobile
        };
        sessionStorage.setItem('adminUser', JSON.stringify(updatedUser));
        // Clear password fields after successful update
        setAdminData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="container mt-5">
      <ToastContainer />
      <div className="row justify-content-center">
        <div className="col-lg-8 col-md-10">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white text-center">
              <h4 className="mb-0">Admin Settings</h4>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center">
                  <div className="spinner-border text-primary" role="status" />
                  <p className="mt-2 mb-0">Loading profile...</p>
                </div>
              ) : (
                <form onSubmit={handleUpdate} className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={adminData.name}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={adminData.email}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Mobile</label>
                    <input
                      type="text"
                      name="mobile"
                      value={adminData.mobile}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">New Password</label>
                    <div className="input-group">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={adminData.password}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="Leave blank to keep current"
                        minLength="6"
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <small className="text-muted">Minimum 6 characters</small>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Confirm Password</label>
                    <div className="input-group">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={adminData.confirmPassword}
                        onChange={handleChange}
                        className="form-control"
                        placeholder="Leave blank to keep current"
                        minLength="6"
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  <div className="col-12 text-center mt-3">
                    <button type="submit" className="btn btn-success px-4" disabled={updating}>
                      {updating ? 'Updating...' : 'Update Profile'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;