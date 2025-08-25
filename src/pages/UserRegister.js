// =========================================================================
// FILE: src/pages/UserRegister.js
// The user registration form page.
// =========================================================================
import React, { useState } from 'react';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import Spinner from '../components/Spinner';

const UserRegister = ({ setPage, setCurrentUser }) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim()) {
      setError('Name and mobile number are required.');
      return;
    }
    if (!/^\d{10}$/.test(mobile)) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
    }
    
    setLoading(true);
    setError('');

    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("mobile", "==", mobile));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            setError("A user with this mobile number is already registered.");
            setLoading(false);
            return;
        }

        const docRef = await addDoc(collection(db, "users"), {
            name: name,
            mobile: mobile,
            currentCheckInIndex: 0,
            allChecksCompleted: false,
        });

        const newUser = { id: docRef.id, name, mobile, currentCheckInIndex: 0, allChecksCompleted: false };
        setCurrentUser(newUser);
        setPage('checkin');

    } catch (err) {
        console.error("Error registering user: ", err);
        setError('Failed to register. Please try again.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-700">User Registration</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="form-label">Full Name</label>
            <input
              type="text"
              id="name"
              className="form-control form-control-lg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="mobile" className="form-label">Mobile Number</label>
            <input
              type="tel"
              id="mobile"
              className="form-control form-control-lg"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Enter your 10-digit mobile number"
              required
            />
          </div>
          <div className="d-grid">
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? <Spinner /> : 'Register and Start'}
            </button>
          </div>
        </form>
         <button onClick={() => setPage('home')} className="text-blue-500 hover:underline mt-4 text-center w-full">Back to Home</button>
      </div>
    </div>
  );
}

export default UserRegister;
