// =========================================================================
// FILE: src/pages/CertificateGenerator.js
// The page for generating and customizing the user's certificate.
// =========================================================================
import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import Modal from '../components/Modal';

const CertificateGenerator = ({ currentUser, onLogout }) => {
  const canvasRef = useRef(null);
  const [frameUrl, setFrameUrl] = useState('');
  const [userImage, setUserImage] = useState(null);
  const [imagePos, setImagePos] = useState({ x: 150, y: 210 });
  const [imageScale, setImageScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "config", "certificate"), (doc) => {
        if (doc.exists()) {
            setFrameUrl(doc.data().frameUrl);
        }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const frame = new Image();
    frame.crossOrigin = "anonymous";
    const userImg = new Image();

    const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (userImage) {
            userImg.src = userImage;
            const imgWidth = userImg.width * imageScale;
            const imgHeight = userImg.height * imageScale;
            ctx.drawImage(userImg, imagePos.x - imgWidth / 2, imagePos.y - imgHeight / 2, imgWidth, imgHeight);
        }
        if (frameUrl) {
            frame.src = frameUrl;
            ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
        }
        ctx.fillStyle = '#333';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(currentUser.name, canvas.width / 2, canvas.height - 50);
    };

    frame.onload = draw;
    userImg.onload = draw;
    draw();

  }, [frameUrl, userImage, imagePos, imageScale, currentUser.name]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUserImage(event.target.result);
        sessionStorage.setItem('userPhoto', event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
      const storedPhoto = sessionStorage.getItem('userPhoto');
      if (storedPhoto) {
          setUserImage(storedPhoto);
      }
  }, []);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - imagePos.x, y: e.clientY - imagePos.y });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setImagePos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  const handleWheel = (e) => {
    e.preventDefault();
    const scaleAmount = -e.deltaY * 0.001;
    setImageScale(prevScale => Math.max(0.1, prevScale + scaleAmount));
  };
  
  const downloadCertificate = () => {
      if (canvasRef.current && userImage) {
          const link = document.createElement('a');
          link.download = `certificate-${currentUser.name.replace(/\s+/g, '-')}.png`;
          link.href = canvasRef.current.toDataURL('image/png');
          link.click();
      } else {
          setModalMessage("Please upload your photo first!");
      }
  };

  const shareToSocial = (platform) => {
      if (!userImage) {
          setModalMessage("Please generate the certificate first by uploading a photo.");
          return;
      }
      const text = encodeURIComponent(`I just completed the event and got my certificate!`);
      let url = '';
      switch(platform) {
          case 'twitter': url = `https://twitter.com/intent/tweet?text=${text}`; break;
          case 'facebook': url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${text}`; break;
          case 'linkedin': url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(window.location.href)}&title=Event%20Certificate&summary=${text}&source=${encodeURIComponent(window.location.href)}`; break;
          default: return;
      }
      window.open(url, '_blank');
  };

  return (
    <div className="container mx-auto p-4">
      {modalMessage && <Modal message={modalMessage} onClose={() => setModalMessage('')} />}
      <div className="w-full text-end mb-4">
        <button onClick={onLogout} className="btn btn-sm btn-outline-danger">Logout & Start Over</button>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center mb-4">Your Certificate</h2>
        <p className="text-center text-gray-500 mb-6">Upload your photo and adjust it to fit inside the frame.</p>
        <div className="row g-4">
            <div className="col-md-8">
                <canvas ref={canvasRef} width={600} height={424} className="border rounded-lg shadow-md w-100 cursor-grab" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseLeave} onWheel={handleWheel}></canvas>
            </div>
            <div className="col-md-4">
                <div className="bg-light p-4 rounded-lg h-100 d-flex flex-column justify-content-between">
                    <div>
                        <h4 className="font-semibold mb-3">Controls</h4>
                        <div className="mb-4">
                            <label htmlFor="photoUpload" className="form-label">1. Upload Your Photo</label>
                            <input type="file" id="photoUpload" className="form-control" onChange={handleImageUpload} accept="image/*" />
                        </div>
                        <div className="text-muted">
                            <p><strong className="text-dark">2. Adjust Photo:</strong></p>
                            <ul className="list-unstyled ps-3">
                                <li>- <strong>Drag</strong> to move the photo.</li>
                                <li>- <strong>Scroll</strong> with your mouse wheel to zoom in/out.</li>
                            </ul>
                        </div>
                    </div>
                    <div className="d-grid gap-2">
                         <button onClick={downloadCertificate} className="btn btn-primary btn-lg">Download Certificate</button>
                         <div className="btn-group w-100">
                            <button onClick={() => shareToSocial('twitter')} className="btn btn-info text-white w-100">Share on Twitter</button>
                            <button onClick={() => shareToSocial('facebook')} className="btn btn-primary w-100">Share on Facebook</button>
                            <button onClick={() => shareToSocial('linkedin')} className="btn btn-secondary w-100">Share on LinkedIn</button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default CertificateGenerator;
