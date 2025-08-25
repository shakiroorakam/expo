// =========================================================================
// FILE: src/pages/UserCheckIn.js
// The page where users complete their check-in steps.
// =========================================================================
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import Spinner from '../components/Spinner';

const UserCheckIn = ({ setPage, currentUser, setCurrentUser, onLogout }) => {
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const currentCheckInIndex = currentUser.currentCheckInIndex || 0;

  useEffect(() => {
    const fetchCheckIns = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "checkIns"));
        const checkInsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        checkInsData.sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
        setCheckIns(checkInsData);
      } catch (err) {
        console.error("Error fetching check-ins: ", err);
        setError('Could not load check-in tasks.');
      } finally {
        setLoading(false);
      }
    };
    fetchCheckIns();
  }, []);

  const handleCheckIn = async () => {
    const nextIndex = currentCheckInIndex + 1;
    const userDocRef = doc(db, "users", currentUser.id);

    try {
      if (nextIndex >= checkIns.length) {
        await updateDoc(userDocRef, {
          allChecksCompleted: true,
          currentCheckInIndex: nextIndex
        });
        const updatedUser = { ...currentUser, allChecksCompleted: true, currentCheckInIndex: nextIndex };
        setCurrentUser(updatedUser);
        setPage('certificate');
      } else {
        await updateDoc(userDocRef, {
          currentCheckInIndex: nextIndex
        });
        const updatedUser = { ...currentUser, currentCheckInIndex: nextIndex };
        setCurrentUser(updatedUser);
      }
    } catch (err) {
      console.error("Error updating user progress: ", err);
      setError('Something went wrong. Please try again.');
    }
  };

  if (loading) return <Spinner />;
  if (error) return <p className="text-red-500">{error}</p>;

  const currentCheckIn = checkIns[currentCheckInIndex];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
       <div className="w-full max-w-2xl text-end mb-4">
        <button onClick={onLogout} className="btn btn-sm btn-outline-danger">Logout</button>
      </div>
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl text-center">
        <h2 className="text-3xl font-bold mb-2 text-gray-700">Welcome, {currentUser.name}!</h2>
        <p className="text-gray-500 mb-6">Complete the steps to get your certificate.</p>
        
        <div className="progress mb-6" style={{height: '25px'}}>
            <div className="progress-bar" role="progressbar" style={{width: `${(currentCheckInIndex / checkIns.length) * 100}%`}} aria-valuenow={currentCheckInIndex} aria-valuemin="0" aria-valuemax={checkIns.length}>
                {Math.round((currentCheckInIndex / checkIns.length) * 100)}%
            </div>
        </div>
        
        {currentCheckIn ? (
          <div className="bg-light p-5 rounded-lg">
            <h3 className="text-2xl font-semibold mb-4">{currentCheckIn.name}</h3>
            <p className="text-gray-600 mb-6">{currentCheckIn.description}</p>
            <button onClick={handleCheckIn} className="btn btn-success btn-lg w-50">
              Check In
            </button>
          </div>
        ) : (
          <div>
            <h3 className="text-2xl font-semibold mb-4">All Done!</h3>
            <p className="text-gray-600 mb-6">You have completed all the check-in steps.</p>
            <button onClick={() => setPage('certificate')} className="btn btn-primary btn-lg">
              Generate Your Certificate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserCheckIn;
