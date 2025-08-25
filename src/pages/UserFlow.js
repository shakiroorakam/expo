import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import Modal from '../components/Modal';

// --- New Feedback Modal Component ---
const FeedbackModal = ({ user, onSubmit, onSkip }) => {
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onSubmit(feedback);
        setLoading(false);
    };

    return (
        <div className="modal show fade" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Feedback & Suggestions</h5>
                        <button type="button" className="btn-close" onClick={onSkip}></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <p className="text-muted">We'd love to hear your thoughts on the event! Your feedback helps us improve.</p>
                            <textarea
                                className="form-control"
                                rows="4"
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Type your feedback here..."
                                required
                            ></textarea>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onSkip}>Skip</button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? <span className="spinner-border spinner-border-sm"></span> : 'Submit Feedback'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};


// --- Main UserFlow Component ---
const UserFlow = ({ currentUser, setCurrentUser, onLogout }) => {
    const [step, setStep] = useState(1);

    useEffect(() => {
        if (currentUser) {
            if (currentUser.allChecksCompleted) setStep(3);
            else setStep(2);
        } else {
            setStep(1);
        }
    }, [currentUser]);

    const renderStepContent = () => {
        switch (step) {
            case 1: return <RegisterStep setCurrentUser={setCurrentUser} />;
            case 2: return <CheckInStep currentUser={currentUser} setCurrentUser={setCurrentUser} onLogout={onLogout} />;
            case 3: return <CertificateStep currentUser={currentUser} onLogout={onLogout} />;
            default: return <RegisterStep setCurrentUser={setCurrentUser} />;
        }
    };

    const steps = ['Register', 'Check-In', 'Certificate'];

    return (
        <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center p-2 p-md-4" style={{backgroundColor: '#e9ecef'}}>
            {/* The container class is responsive by default, using more width on smaller screens */}
            <div className="container">
                <div className="mb-5">
                    <div className="d-flex justify-content-between align-items-center">
                        {steps.map((title, index) => {
                            const stepNumber = index + 1;
                            const isActive = step === stepNumber;
                            const isCompleted = step > stepNumber;
                            return (
                                <React.Fragment key={title}>
                                    <div className="text-center">
                                        <div className={`rounded-circle d-flex align-items-center justify-content-center mx-auto border ${
                                            isActive ? 'border-primary border-3' : 
                                            isCompleted ? 'bg-success border-success' : 
                                            'border-secondary'
                                        }`} style={{ width: '50px', height: '50px' }}>
                                            <i className={`bi ${isCompleted ? 'bi-check-lg text-white' : `bi-${stepNumber}-circle-fill`} ${isActive ? 'text-primary' : 'text-secondary'}`} style={{fontSize: '1.5rem'}}></i>
                                        </div>
                                        <p className={`mt-2 fw-bold ${isCompleted ? 'text-success' : isActive ? 'text-primary' : 'text-muted'}`}>{title}</p>
                                    </div>
                                    {stepNumber < steps.length && (
                                        <div className={`flex-grow-1 mx-3 rounded ${isCompleted ? 'bg-success' : 'bg-secondary'}`} style={{ height: '4px' }}></div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
                
                <div className="card shadow-lg border-0">
                    <div className="card-body p-3 p-md-5">
                        {renderStepContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- RegisterStep (No changes here) ---
const RegisterStep = ({ setCurrentUser }) => {
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !mobile.trim()) { setError('Name and mobile number are required.'); return; }
        if (!/^\d{10}$/.test(mobile)) { setError('Please enter a valid 10-digit mobile number.'); return; }
        
        setLoading(true);
        setError('');

        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("mobile", "==", mobile));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) { setError("A user with this mobile number is already registered."); setLoading(false); return; }

            const docRef = await addDoc(usersRef, { name, mobile, currentCheckInIndex: 0, allChecksCompleted: false });
            const newUser = { id: docRef.id, name, mobile, currentCheckInIndex: 0, allChecksCompleted: false };
            setCurrentUser(newUser);
        } catch (err) {
            setError('Failed to register. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div>
            <h2 className="h3 fw-bold text-center mb-3 text-primary">Create Your Account</h2>
            <p className="text-center text-muted mb-4">Fill in your details to begin the event check-in.</p>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="name" className="form-label">Full Name</label>
                    <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="form-control form-control-lg" placeholder="Your Name" required />
                </div>
                <div className="mb-4">
                    <label htmlFor="mobile" className="form-label">Mobile Number</label>
                    <input type="tel" id="mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} className="form-control form-control-lg" placeholder="Mobile No." required />
                </div>
                <div className="d-grid">
                    <button type="submit" disabled={loading} className="btn btn-primary btn-lg">
                        {loading ? <span className="spinner-border spinner-border-sm"></span> : 'Register and Start'}
                    </button>
                </div>
            </form>
        </div>
    );
};

// --- CheckInStep (Updated with feedback logic) ---
const CheckInStep = ({ currentUser, setCurrentUser, onLogout }) => {
    const [checkIns, setCheckIns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const currentCheckInIndex = currentUser.currentCheckInIndex || 0;

    useEffect(() => {
        const fetchCheckIns = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "checkIns"));
                const checkInsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                checkInsData.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
                setCheckIns(checkInsData);
            } catch (err) { setError('Could not load check-in tasks.'); } 
            finally { setLoading(false); }
        };
        fetchCheckIns();
    }, []);

    const proceedToCertificate = async () => {
        const userDocRef = doc(db, "users", currentUser.id);
        await updateDoc(userDocRef, { allChecksCompleted: true });
        const updatedUser = { ...currentUser, allChecksCompleted: true };
        setCurrentUser(updatedUser);
    };

    const handleFeedbackSubmit = async (feedbackText) => {
        if (feedbackText.trim()) {
            await addDoc(collection(db, "feedback"), {
                userId: currentUser.id,
                name: currentUser.name,
                feedback: feedbackText,
                submittedAt: new Date()
            });
        }
        setShowFeedbackModal(false);
        await proceedToCertificate();
    };

    const handleCheckIn = async () => {
        const nextIndex = currentCheckInIndex + 1;
        const userDocRef = doc(db, "users", currentUser.id);
        try {
            if (nextIndex >= checkIns.length) {
                setShowFeedbackModal(true);
            } else {
                await updateDoc(userDocRef, { currentCheckInIndex: nextIndex });
                const updatedUser = { ...currentUser, currentCheckInIndex: nextIndex };
                setCurrentUser(updatedUser);
            }
        } catch (err) { setError('Something went wrong. Please try again.'); }
    };

    if (loading) return <div className="d-flex justify-content-center p-5"><div className="spinner-border text-primary"></div></div>;
    if (error) return <p className="alert alert-danger">{error}</p>;

    const currentCheckIn = checkIns[currentCheckInIndex];
    const progress = checkIns.length > 0 ? (currentCheckInIndex / checkIns.length) * 100 : 0;

    return (
        <>
            {showFeedbackModal && (
                <FeedbackModal 
                    user={currentUser} 
                    onSubmit={handleFeedbackSubmit} 
                    onSkip={() => {
                        setShowFeedbackModal(false);
                        proceedToCertificate();
                    }}
                />
            )}
            <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="h3 fw-bold">Hello, {currentUser.name}!</h2>
                    <button onClick={onLogout} className="btn btn-sm btn-outline-danger">Start Over</button>
                </div>
                <p className="text-muted mb-4">Complete the steps below to earn your certificate.</p>
                
                <div className="progress mb-5" style={{height: '10px'}}>
                    <div className="progress-bar bg-primary" role="progressbar" style={{ width: `${progress}%` }}></div>
                </div>
                
                {currentCheckIn ? (
                    <div className="card bg-light border-0 text-center p-4">
                        <div className="card-body">
                            <h3 className="h4 fw-bold mb-4">{currentCheckIn.name}</h3>
                            <button onClick={handleCheckIn} className="btn btn-success btn-lg">
                               <i className="bi bi-check-circle-fill me-2"></i> Mark as Complete
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-4">
                        <i className="bi bi-award-fill text-success" style={{fontSize: '4rem'}}></i>
                        <h3 className="h4 fw-bold mt-3 mb-3">All Steps Completed!</h3>
                        <p className="text-muted">Great job! You're ready to create your certificate.</p>
                    </div>
                )}
            </div>
        </>
    );
};

// --- CertificateStep (No changes here) ---
const CertificateStep = ({ currentUser, onLogout }) => {
    const canvasRef = useRef(null);
    const [modalMessage, setModalMessage] = useState('');
    const [isSharing, setIsSharing] = useState(false);
    
    const certificateTemplateUrl = process.env.PUBLIC_URL + '/participation.jpeg';

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const template = new Image();
        template.crossOrigin = "anonymous";
        template.src = certificateTemplateUrl;

        template.onload = () => {
            ctx.drawImage(template, 0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#333333';
            ctx.font = 'bold 30px "Playfair Display", serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(currentUser.name, canvas.width / 2, 470);
        };
    }, [currentUser.name, certificateTemplateUrl]);

    const downloadCertificate = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const link = document.createElement('a');
            link.download = `certificate-${currentUser.name.replace(/\s+/g, '-')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    };

    const handleShare = async (platform = 'default') => {
        setIsSharing(true);
        const canvas = canvasRef.current;
        if (!canvas) {
            setIsSharing(false);
            return;
        }

        canvas.toBlob(async (blob) => {
            if (!blob) {
                setModalMessage('Error creating certificate image.');
                setIsSharing(false);
                return;
            }

            const file = new File([blob], `certificate-${currentUser.name.replace(/\s+/g, '-')}.png`, { type: 'image/png' });
            const shareData = {
                files: [file],
                title: 'My Event Certificate',
                text: 'I just completed the event and received my certificate!',
            };

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    console.error("User cancelled share or error:", err);
                } finally {
                    setIsSharing(false);
                }
                return;
            }

            try {
                const storageRef = ref(storage, `certificates/${currentUser.id}.png`);
                await uploadBytes(storageRef, blob);
                const imageUrl = await getDownloadURL(storageRef);

                let shareUrl = '';
                const text = encodeURIComponent('I just got my event certificate! Check it out: ');

                if (platform === 'whatsapp') {
                    shareUrl = `https://api.whatsapp.com/send?text=${text}${encodeURIComponent(imageUrl)}`;
                } else if (platform === 'facebook') {
                    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(imageUrl)}`;
                } else {
                    navigator.clipboard.writeText(imageUrl);
                    setModalMessage("Share link copied to clipboard!");
                    setIsSharing(false);
                    return;
                }
                
                window.open(shareUrl, '_blank');

            } catch (error) {
                console.error("Sharing failed:", error);
                setModalMessage("Could not share certificate. Please try again.");
            } finally {
                setIsSharing(false);
            }

        }, 'image/png');
    };
    
    return (
        <div>
            {modalMessage && <Modal message={modalMessage} onClose={() => setModalMessage('')} />}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="h3 fw-bold text-success">Congratulations!</h2>
                <button onClick={onLogout} className="btn btn-sm btn-outline-danger">Start Over</button>
            </div>
            <p className="text-muted mb-4">Your certificate is ready. You can download it or share it on social media.</p>
            
            <div className="row g-4 align-items-center">
                <div className="col-lg-8">
                    <canvas ref={canvasRef} width={1080} height={1350} className="d-none"></canvas>
                    <div className="position-relative">
                        <img src={certificateTemplateUrl} alt="Certificate Preview" className="img-fluid rounded shadow-sm border"/>
                        <p 
                            className="position-absolute text-center fw-bold" 
                            style={{
                                color: '#333333',
                                top: '35.5%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                fontSize: '1.5vw',
                                width: '100%',
                                fontFamily: '"Playfair Display", serif'
                            }}
                        >
                            {currentUser.name}
                        </p>
                    </div>
                </div>
                <div className="col-lg-4">
                    <div className="d-grid gap-3">
                        <button onClick={downloadCertificate} className="btn btn-success btn-lg">
                            <i className="bi bi-download me-2"></i>
                            Download
                        </button>
                        <button onClick={() => handleShare()} disabled={isSharing} className="btn btn-primary btn-lg">
                            {isSharing ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-share-fill me-2"></i> Share</>}
                        </button>
                        <button onClick={() => handleShare('whatsapp')} disabled={isSharing} className="btn btn-lg" style={{backgroundColor: '#25D366', color: 'white'}}>
                            {isSharing ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-whatsapp me-2"></i> Share on WhatsApp</>}
                        </button>
                        <button onClick={() => handleShare('facebook')} disabled={isSharing} className="btn btn-lg" style={{backgroundColor: '#1877F2', color: 'white'}}>
                           {isSharing ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-facebook me-2"></i> Share on Facebook</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserFlow;
