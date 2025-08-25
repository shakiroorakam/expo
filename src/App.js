import React, { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import UserFlow from './pages/UserFlow'; 

// This new component will handle the routing logic
const AppRouter = () => {
  const [route, setRoute] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setRoute(path);
  };

  let componentToRender;

  // Check the current route and render the correct component
  if (route.startsWith('/admin/dashboard')) {
    componentToRender = <AdminDashboard setPage={(page) => navigate(page === 'home' ? '/' : '/admin')} />;
  } else if (route.startsWith('/admin')) {
    componentToRender = <AdminLogin setPage={(page) => navigate(page === 'home' ? '/' : '/admin/dashboard')} />;
  } else {
    // By default, show the main user-facing application
    componentToRender = <App />;
  }

  return (
    <>
      {/* CSS links are now here, so they apply to ALL routes */}
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet" />
      <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css" rel="stylesheet" />
      {componentToRender}
    </>
  );
}


function App() {
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

export default AppRouter;
