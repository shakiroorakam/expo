import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import Modal from '../components/Modal';

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
        <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center p-4" style={{backgroundColor: '#e9ecef'}}>
            <div className="container-fluid" style={{ maxWidth: '900px' }}>
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
                    <div className="card-body p-5">
                        {renderStepContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Sub-components for each step ---

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
            setLoading(false); // Ensure loading is stopped on error
        }
        // No finally block needed as loading is handled in success/error cases
    };
    
    return (
        <div>
            {/* Added a style tag for the pulsing animation */}
            <style>
            {`
                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.7;
                    }
                }
                .pulsing-animation {
                    animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}
            </style>
            <h2 className="h3 fw-bold text-center mb-3 text-primary">Create Your Account</h2>
            <p className="text-center text-muted mb-4">Fill in your details to begin the event check-in.</p>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="name" className="form-label">Full Name</label>
                    <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="form-control form-control-lg" placeholder="e.g., John Doe" required disabled={loading} />
                </div>
                <div className="mb-4">
                    <label htmlFor="mobile" className="form-label">Mobile Number</label>
                    <input type="tel" id="mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} className="form-control form-control-lg" placeholder="e.g., 9876543210" required disabled={loading} />
                </div>
                <div className="d-grid">
                    <button 
                        type="submit" 
                        disabled={loading} 
                        // Added a conditional class for the animation
                        className={`btn btn-primary btn-lg ${loading ? 'pulsing-animation' : ''}`}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Registering...
                            </>
                        ) : 'Register and Start'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const CheckInStep = ({ currentUser, setCurrentUser, onLogout }) => {
    const [checkIns, setCheckIns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
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

    const handleCheckIn = async () => {
        const nextIndex = currentCheckInIndex + 1;
        const userDocRef = doc(db, "users", currentUser.id);
        try {
            const isCompleting = nextIndex >= checkIns.length;
            await updateDoc(userDocRef, { allChecksCompleted: isCompleting, currentCheckInIndex: nextIndex });
            const updatedUser = { ...currentUser, allChecksCompleted: isCompleting, currentCheckInIndex: nextIndex };
            setCurrentUser(updatedUser);
        } catch (err) { setError('Something went wrong. Please try again.'); }
    };

    if (loading) return <div className="d-flex justify-content-center p-5"><div className="spinner-border text-primary"></div></div>;
    if (error) return <p className="alert alert-danger">{error}</p>;

    const currentCheckIn = checkIns[currentCheckInIndex];
    const progress = checkIns.length > 0 ? (currentCheckInIndex / checkIns.length) * 100 : 0;

    return (
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
    );
};

const CertificateStep = ({ currentUser, onLogout }) => {
    const canvasRef = useRef(null);
    const [modalMessage, setModalMessage] = useState('');
    
    const certificateTemplateUrl = '/participation.jpeg';

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

    const shareCertificate = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.toBlob(async (blob) => {
            const fileName = `certificate-${currentUser.name.replace(/\s+/g, '-')}.png`;
            const file = new File([blob], fileName, { type: 'image/png' });
            const shareData = {
                files: [file],
                title: 'My Event Certificate',
                text: `I just completed the event and received my certificate!`,
            };

            if (navigator.canShare && navigator.canShare(shareData)) {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    console.error("Share failed:", err.message);
                }
            } else {
                setModalMessage("Web Share is not supported on your browser. Please download the certificate to share it.");
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
                        <button onClick={shareCertificate} className="btn btn-primary btn-lg">
                            <i className="bi bi-share-fill me-2"></i>
                            Share
                        </button>
                        <a href={`https://api.whatsapp.com/send?text=I just completed the event and got my certificate!`} target="_blank" rel="noopener noreferrer" className="btn btn-lg" style={{backgroundColor: '#25D366', color: 'white'}}>
                            <i className="bi bi-whatsapp me-2"></i> Share on WhatsApp
                        </a>
                        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className="btn btn-lg" style={{backgroundColor: '#1877F2', color: 'white'}}>
                           <i className="bi bi-facebook me-2"></i> Share on Facebook
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserFlow;
