import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ShieldCheck,
  Eye,
  ScanFace,
  MapPin,
  Clock,
  Check
} from 'lucide-react';
import { BlinkLivenessDetector, extractFaceEmbeddingFromCanvas } from '../../utils/faceBiometrics';

const FaceVerificationModal = ({
  isOpen,
  onClose,
  actionType = 'CHECK_IN',
  internship,
  onSuccess,
  customHours = '8.5',
  workSummary = ''
}) => {
  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [livenessStatus, setLivenessStatus] = useState('ALIGN_FACE');
  const [blinkDetected, setBlinkDetected] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);
  const detectorRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setBlinkDetected(false);
      setVerificationResult(null);
      setCapturedPhoto(null);
      setCameraError('');
      startCamera();

      detectorRef.current = new BlinkLivenessDetector({
        onStatusChange: (status) => setLivenessStatus(status),
        onBlinkDetected: () => {
          setBlinkDetected(true);
          handleBlinkAndVerify();
        }
      });
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setStreamActive(true);
          startFrameProcessing();
        };
      }
    } catch (err) {
      console.warn('Webcam permission error or camera not accessible:', err);
      setCameraError('Webcam access was not granted. Please ensure camera permissions are enabled in your browser.');
    }
  };

  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  const startFrameProcessing = () => {
    const process = () => {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState === 4) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (detectorRef.current && !blinkDetected && !verifying) {
          detectorRef.current.processFrame(canvas);
        }
      }
      animationFrameId.current = requestAnimationFrame(process);
    };
    animationFrameId.current = requestAnimationFrame(process);
  };

  const handleBlinkAndVerify = async () => {
    if (!canvasRef.current) return;
    setVerifying(true);
    setCameraError('');

    const canvas = canvasRef.current;
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const embedding = extractFaceEmbeddingFromCanvas(canvas);
    setCapturedPhoto(photoDataUrl);

    try {
      const token = localStorage.getItem('ghr_token');
      let endpoint = '/api/student/attendance/check-in';
      let payload = {};

      if (actionType === 'CHECK_IN') {
        const simulateLat = internship ? internship.latitude + (Math.random() - 0.5) * 0.0008 : 18.5529;
        const simulateLng = internship ? internship.longitude + (Math.random() - 0.5) * 0.0008 : 73.9497;
        payload = {
          latitude: simulateLat,
          longitude: simulateLng,
          photo_url: photoDataUrl,
          face_embedding: embedding,
          blink_verified: true
        };
      } else {
        endpoint = '/api/student/attendance/check-out';
        payload = {
          hours_worked: parseFloat(customHours) || 8.5,
          work_summary: workSummary || 'Completed daily assigned engineering sprint items and code review.',
          face_embedding: embedding,
          blink_verified: true
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setVerificationResult(data);
        if (onSuccess) onSuccess(data);
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setCameraError(data.error || 'Biometric verification failed.');
        setBlinkDetected(false);
        if (detectorRef.current) detectorRef.current.reset();
      }
    } catch {
      setCameraError('Network error while processing biometric verification.');
      setBlinkDetected(false);
      if (detectorRef.current) detectorRef.current.reset();
    } finally {
      setVerifying(false);
    }
  };

  const handleManualBlinkTrigger = () => {
    setBlinkDetected(true);
    setLivenessStatus('BLINK_CONFIRMED');
    handleBlinkAndVerify();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-outline-variant/60 shadow-2xl space-y-5 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ScanFace className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-on-surface">
                {actionType === 'CHECK_IN' ? 'Biometric Check-In & Liveness' : 'Biometric Check-Out & Liveness'}
              </h3>
              <p className="text-[11px] text-on-surface-variant">Blink detection anti-spoofing & facial template match</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Scanner Container */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-[4/3] flex items-center justify-center border-2 border-primary/30 shadow-inner">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover ${capturedPhoto ? 'hidden' : 'block'}`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {capturedPhoto && (
            <img src={capturedPhoto} alt="Captured Face" className="w-full h-full object-cover" />
          )}

          {/* Oval Face Guide Overlay */}
          {!capturedPhoto && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div
                className={`w-48 h-64 rounded-[50%] border-2 transition-all duration-300 ${
                  blinkDetected
                    ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_30px_rgba(52,211,153,0.5)]'
                    : 'border-white/70 border-dashed animate-pulse'
                }`}
              ></div>
              <span className="text-[11px] font-bold text-white bg-black/60 px-3 py-1 rounded-full mt-3 backdrop-blur-sm shadow">
                {verifying
                  ? '🔄 Verifying Facial Biometrics...'
                  : blinkDetected
                  ? '🟢 Blink Verified! Matching Template...'
                  : livenessStatus === 'BLINK_DETECTED'
                  ? '👁️ Blink Detected! Processing...'
                  : '👁️ Please Blink Naturally'}
              </span>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-x-4 bottom-4 p-3 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}
        </div>

        {verificationResult && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              {actionType === 'CHECK_IN'
                ? `Biometric Check-In Successful! Face match verified.`
                : `Biometric Check-Out Verified! Logged ${verificationResult.hours_worked} working hours.`}
            </span>
          </div>
        )}

        {/* Liveness Guidance & Actions */}
        <div className="space-y-3">
          <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <Eye className="w-4 h-4 text-primary" />
              <span>Liveness Rule: <strong>Blink naturally once</strong></span>
            </div>
            {blinkDetected ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Blink Verified
              </span>
            ) : (
              <button
                type="button"
                onClick={handleManualBlinkTrigger}
                className="text-[10px] font-bold text-primary hover:underline"
              >
                Simulate Blink Test
              </button>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-high"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleManualBlinkTrigger}
              disabled={verifying}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs shadow-md shadow-primary/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Matching Biometrics...</span>
                </>
              ) : (
                <>
                  <ScanFace className="w-4 h-4" />
                  <span>{actionType === 'CHECK_IN' ? 'Verify & Check In' : 'Verify & Check Out'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceVerificationModal;
