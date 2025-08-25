import React, { useState, useEffect } from 'react';

const AdminLogin = ({ setPage }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') {
      sessionStorage.setItem('isAdmin', 'true');
      setPage('adminDashboard'); // This will navigate to /admin/dashboard
    } else {
      setError('Incorrect password. Please try again.');
    }
  };
  
  // This effect checks if the user is already logged in as an admin
  useEffect(() => {
    if (sessionStorage.getItem('isAdmin') === 'true') {
      setPage('adminDashboard');
    }
  }, [setPage]);

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center p-4" style={{ backgroundColor: '#343a40' }}>
      <div className="card shadow-lg border-0 rounded-3" style={{ maxWidth: '480px', width: '100%' }}>
        <div className="card-body text-center p-5">
          <h1 className="fw-bold text-primary mb-3">Admin Login</h1>
          <p className="text-muted mb-4">
            Please enter the admin password to access the dashboard.
          </p>
          {error && <div className="alert alert-danger small p-2">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="mb-3 text-start">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                id="password"
                className="form-control form-control-lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <div className="d-grid mt-4">
              <button type="submit" className="btn btn-primary btn-lg rounded-pill">
                <i className="bi bi-box-arrow-in-right me-2"></i>
                Login
              </button>
            </div>
          </form>
           <div className="mt-4">
             <button onClick={() => setPage('home')} className="btn btn-link text-secondary text-decoration-none">
                Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
