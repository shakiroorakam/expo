import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import UserFlow from './pages/UserFlow'; 

// A wrapper component to handle navigation logic
const AdminLoginWrapper = () => {
  const navigate = useNavigate();
  return <AdminLogin setPage={(page) => navigate(page === 'home' ? '/' : '/admin/dashboard')} />;
};

const AdminDashboardWrapper = () => {
  const navigate = useNavigate();
  return <AdminDashboard setPage={(page) => navigate(page === 'home' ? '/' : '/admin')} />;
};


// Main user-facing application component
function MainApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserFlow, setShowUserFlow] = useState(false);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('eventAppUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
      setShowUserFlow(true); 
    }
    setIsLoading(false);
  }, []);

  const handleSetCurrentUser = (user) => {
    setCurrentUser(user);
    if (user) {
      sessionStorage.setItem('eventAppUser', JSON.stringify(user));
      setShowUserFlow(true);
    } else {
      sessionStorage.removeItem('eventAppUser');
    }
  };
  
  const handleLogout = () => {
      sessionStorage.removeItem('eventAppUser');
      sessionStorage.removeItem('userPhoto');
      setCurrentUser(null);
      setShowUserFlow(false);
  }

  const handleRegisterClick = () => {
    setShowUserFlow(true);
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light">
      {showUserFlow ? (
        <UserFlow currentUser={currentUser} setCurrentUser={handleSetCurrentUser} onLogout={handleLogout} />
      ) : (
        <HomePage onRegisterClick={handleRegisterClick} />
      )}
    </div>
  );
}


// The main AppRouter component that sets up the HashRouter
const AppRouter = () => {
  return (
    <>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet" />
      <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css" rel="stylesheet" />
      <HashRouter>
        <Routes>
          <Route path="/admin" element={<AdminLoginWrapper />} />
          <Route path="/admin/dashboard" element={<AdminDashboardWrapper />} />
          <Route path="/" element={<MainApp />} />
        </Routes>
      </HashRouter>
    </>
  );
}

export default AppRouter;
