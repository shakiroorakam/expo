import React from 'react';

const HomePage = ({ onRegisterClick }) => { // Changed prop from setPage to onRegisterClick
  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center p-4" style={{ backgroundColor: '#343a40' }}>
      <div className="card shadow-lg border-0 rounded-3" style={{ maxWidth: '480px', width: '100%' }}>
        <div className="card-body text-center p-5">
          <h1 className="fw-bold text-primary mb-3">Expo Registration</h1>
          <p className="text-muted mb-4">
            Click the button below to begin the registration and check-in process for the expo.
          </p>
          <div className="d-grid gap-3">
            <button 
              onClick={onRegisterClick} // Use the new onRegisterClick prop here
              className="btn btn-success btn-lg rounded-pill"
            >
              <i className="bi bi-person-plus-fill me-2"></i>
              Register Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
