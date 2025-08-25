import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import Modal from '../components/Modal';

const AdminDashboard = ({ setPage }) => {
  const [checkIns, setCheckIns] = useState([]);
  const [newCheckInName, setNewCheckInName] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    const unsubCheckins = onSnapshot(collection(db, "checkIns"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      setCheckIns(data);
    });
    return () => unsubCheckins();
  }, []);

  const handleAddCheckIn = async (e) => {
    e.preventDefault();
    if (!newCheckInName.trim()) {
      setModalMessage("Check-in name cannot be empty.");
      return;
    }
    setLoading(true);
    try {
      // Only the name is added now
      await addDoc(collection(db, "checkIns"), { name: newCheckInName });
      setNewCheckInName('');
      setModalMessage("Check-in added successfully!");
    } catch (error) {
      setModalMessage("Failed to add check-in.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCheckIn = async (id) => {
    if (window.confirm("Are you sure you want to delete this check-in step?")) {
      try {
        await deleteDoc(doc(db, "checkIns", id));
        setModalMessage("Check-in deleted successfully!");
      } catch (error) {
        setModalMessage("Failed to delete check-in.");
      }
    }
  };
  
  const handleLogout = () => {
    sessionStorage.removeItem('isAdmin');
    setPage('home');
  };

  return (
    <div className="min-vh-100 p-4 p-md-5" style={{backgroundColor: '#e9ecef'}}>
      {modalMessage && <Modal message={modalMessage} onClose={() => setModalMessage('')} />}
      <div className="container-fluid">
        <header className="d-flex justify-content-between align-items-center mb-5">
          <div>
            <h1 className="h2 fw-bold text-dark">Admin Dashboard</h1>
            <p className="text-muted">Manage the event's check-in steps below.</p>
          </div>
          <button onClick={handleLogout} className="btn btn-danger">
            <i className="bi bi-box-arrow-right me-2"></i>Logout
          </button>
        </header>
        
        <div className="row g-4 justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-sm border-0 h-100">
                <div className="card-header bg-primary text-white">
                    <h5 className="mb-0"><i className="bi bi-list-check me-2"></i>Manage Check-in List</h5>
                </div>
                <div className="card-body p-4">
                    <form onSubmit={handleAddCheckIn} className="mb-4">
                        <div className="mb-3">
                            <input type="text" className="form-control" value={newCheckInName} onChange={(e) => setNewCheckInName(e.target.value)} placeholder="Check-in Name (e.g., 'Step 1: Welcome')" />
                        </div>
                        <div className="d-grid">
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? <span className="spinner-border spinner-border-sm"></span> : <span><i className="bi bi-plus-circle-fill me-2"></i>Add New Check-in</span>}
                            </button>
                        </div>
                    </form>
                    
                    <h6 className="text-muted">Current List ({checkIns.length})</h6>
                    <ul className="list-group list-group-flush" style={{maxHeight: '400px', overflowY: 'auto'}}>
                        {checkIns.map(item => (
                            <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                                <p className="fw-bold mb-0">{item.name}</p>
                                <button onClick={() => handleDeleteCheckIn(item.id)} className="btn btn-sm btn-outline-danger border-0">
                                    <i className="bi bi-trash-fill"></i>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
