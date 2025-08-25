import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import Modal from '../components/Modal';
import * as XLSX from 'xlsx';

const EditUserModal = ({ user, onClose, onSave }) => {
    const [name, setName] = useState(user.name);
    const [mobile, setMobile] = useState(user.mobile);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onSave(user.id, { name, mobile });
        setLoading(false);
        onClose();
    };

    return (
        <div className="modal show fade" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Edit User</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label htmlFor="editName" className="form-label">Full Name</label>
                                <input type="text" className="form-control" id="editName" value={name} onChange={(e) => setName(e.target.value)} required />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="editMobile" className="form-label">Mobile Number</label>
                                <input type="tel" className="form-control" id="editMobile" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? <span className="spinner-border spinner-border-sm"></span> : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};


const AdminDashboard = ({ setPage }) => {
  const [checkIns, setCheckIns] = useState([]);
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]); // State for feedback
  const [newCheckInName, setNewCheckInName] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    const unsubCheckins = onSnapshot(collection(db, "checkIns"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      setCheckIns(data);
    });

    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
    });

    // New listener for feedback collection
    const unsubFeedback = onSnapshot(collection(db, "feedback"), (snapshot) => {
        const feedbackData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFeedback(feedbackData);
    });

    return () => { 
        unsubCheckins();
        unsubUsers();
        unsubFeedback(); // Unsubscribe on cleanup
    };
  }, []);

  const handleAddCheckIn = async (e) => {
    e.preventDefault();
    if (!newCheckInName.trim()) { setModalMessage("Check-in name cannot be empty."); return; }
    setLoading(true);
    try {
      await addDoc(collection(db, "checkIns"), { name: newCheckInName });
      setNewCheckInName('');
      setModalMessage("Check-in added successfully!");
    } catch (error) { setModalMessage("Failed to add check-in."); } 
    finally { setLoading(false); }
  };

  const handleDeleteCheckIn = async (id) => {
    if (window.confirm("Are you sure you want to delete this check-in step?")) {
        try {
            await deleteDoc(doc(db, "checkIns", id));
            setModalMessage("Check-in deleted successfully!");
        } catch (error) { setModalMessage("Failed to delete check-in."); }
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (userId, updatedData) => {
    try {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, updatedData);
        setModalMessage("User updated successfully!");
    } catch (error) {
        setModalMessage("Failed to update user.");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
        try {
            await deleteDoc(doc(db, "users", userId));
            setModalMessage("User deleted successfully!");
        } catch (error) {
            setModalMessage("Failed to delete user.");
        }
    }
  };
  
  const handleDownloadExcel = () => {
    // Combine user data with their feedback
    const dataForExcel = users.map(user => {
        const userFeedback = feedback.find(fb => fb.userId === user.id);
        return {
            Name: user.name,
            Mobile: user.mobile,
            Feedback: userFeedback ? userFeedback.feedback : 'N/A'
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registered Users");
    XLSX.writeFile(workbook, "RegisteredUsers.xlsx");
  };
  
  const handleLogout = () => { sessionStorage.removeItem('isAdmin'); setPage('home'); }

  return (
    <div className="min-vh-100 p-4 p-md-5" style={{backgroundColor: '#e9ecef'}}>
      {modalMessage && <Modal message={modalMessage} onClose={() => setModalMessage('')} />}
      {isEditModalOpen && <EditUserModal user={editingUser} onClose={() => setIsEditModalOpen(false)} onSave={handleUpdateUser} />}
      
      <div className="container-fluid">
        <header className="d-flex justify-content-between align-items-center mb-5">
          <div>
            <h1 className="h2 fw-bold text-dark">Admin Dashboard</h1>
            <p className="text-muted">Manage your event settings below.</p>
          </div>
          <button onClick={handleLogout} className="btn btn-danger">
            <i className="bi bi-box-arrow-right me-2"></i>Logout
          </button>
        </header>
        
        <div className="row g-4">
          <div className="col-lg-4">
            <div className="card shadow-sm border-0 h-100">
                <div className="card-header bg-primary text-white">
                    <h5 className="mb-0"><i className="bi bi-list-check me-2"></i>Manage Check-in List</h5>
                </div>
                <div className="card-body p-4">
                    <form onSubmit={handleAddCheckIn} className="mb-4">
                        <div className="mb-3">
                            <input type="text" className="form-control" value={newCheckInName} onChange={(e) => setNewCheckInName(e.target.value)} placeholder="Check-in Name" />
                        </div>
                        <div className="d-grid">
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? <span className="spinner-border spinner-border-sm"></span> : <span><i className="bi bi-plus-circle-fill me-2"></i>Add Check-in</span>}
                            </button>
                        </div>
                    </form>
                    
                    <h6 className="text-muted">Current List ({checkIns.length})</h6>
                    <ul className="list-group list-group-flush" style={{maxHeight: '300px', overflowY: 'auto'}}>
                        {checkIns.map(item => (
                            <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                                <p className="fw-bold mb-0">{item.name}</p>
                                <button onClick={() => handleDeleteCheckIn(item.id)} className="btn btn-sm btn-outline-danger border-0"><i className="bi bi-trash-fill"></i></button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="card shadow-sm border-0 h-100">
                <div className="card-header bg-success text-white">
                    <h5 className="mb-0"><i className="bi bi-people-fill me-2"></i>Registered Users</h5>
                </div>
                <div className="card-body p-4">
                    <div className="d-grid mb-4">
                        <button className="btn btn-success" onClick={handleDownloadExcel}><i className="bi bi-file-earmark-excel-fill me-2"></i>Download as Excel</button>
                    </div>
                    <h6 className="text-muted">User List ({users.length})</h6>
                    <div className="table-responsive" style={{maxHeight: '350px', overflowY: 'auto'}}>
                        <table className="table table-striped table-hover">
                            <thead><tr><th>Name</th><th>Mobile</th><th>Actions</th></tr></thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.name}</td>
                                        <td>{user.mobile}</td>
                                        <td>
                                            <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEditUser(user)}><i className="bi bi-pencil-fill"></i></button>
                                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteUser(user.id)}><i className="bi bi-trash-fill"></i></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* New Feedback Card */}
        <div className="row mt-4">
            <div className="col-12">
                <div className="card shadow-sm border-0">
                    <div className="card-header bg-info text-white">
                        <h5 className="mb-0"><i className="bi bi-chat-left-text-fill me-2"></i>Feedback & Suggestions</h5>
                    </div>
                    <div className="card-body p-4" style={{maxHeight: '400px', overflowY: 'auto'}}>
                        {feedback.length > 0 ? (
                            <ul className="list-group list-group-flush">
                                {feedback.map(item => (
                                    <li key={item.id} className="list-group-item">
                                        <p className="fw-bold mb-1">{item.name}</p>
                                        <p className="text-muted mb-0">"{item.feedback}"</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted text-center">No feedback has been submitted yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}

export default AdminDashboard;
