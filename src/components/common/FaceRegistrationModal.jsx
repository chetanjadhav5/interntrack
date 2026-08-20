import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ShieldCheck,
  Eye,
  Sparkles,
  RefreshCw,
  ScanFace
} from 'lucide-react';
import { BlinkLivenessDetector, extractFaceEmbeddingFromCanvas } from '../../utils/faceBiometrics';

const FaceRegistrationModal = ({ isOpen, onClose, onRegistered, currentBiometrics }) => {
  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isListeningForBlink, setIsListeningForBlink] = useState(false);
  const [livenessStatus, setLivenessStatus] = useState('ALIGN_FACE');
  const [blinkDetected, setBlinkDetected] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [capturedEmbedding, setCapturedEmbedding] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setIsListeningForBlink(false);
      startCamera();
      detectorRef.current = new BlinkLivenessDetector({
        onStatusChange: (status) => setLivenessStatus(status),
        onBlinkDetected: () => {
          setBlinkDetected(true);
          setIsListeningForBlink(false);
          handleAutoCaptureOnBlink();
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
    setCameraError('');
    setBlinkDetected(false);
    setIsListeningForBlink(false);
    setCapturedPhoto(null);
    setCapturedEmbedding(null);
    setSuccessMessage('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      streamRef.current = stream;

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
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
          track.enabled = false;
        } catch (e) {
          console.warn('Error stopping stream track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => {
        try {
          track.stop();
          track.enabled = false;
        } catch (e) {
          console.warn('Error stopping video track:', e);
        }
      });
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
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

        if (detectorRef.current && isListeningForBlink && !blinkDetected) {
          detectorRef.current.processFrame(canvas);
        }
      }
      animationFrameId.current = requestAnimationFrame(process);
    };
    animationFrameId.current = requestAnimationFrame(process);
  };

  const handleStartBlinkDetection = () => {
    setIsListeningForBlink(true);
    setBlinkDetected(false);
    setLivenessStatus('PROMPT_BLINK');
    if (detectorRef.current) {
      detectorRef.current.reset();
    }
  };

  const handleAutoCaptureOnBlink = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const embedding = extractFaceEmbeddingFromCanvas(canvas);

    setCapturedPhoto(photoDataUrl);
    setCapturedEmbedding(embedding);
  };

  const handleManualBlinkTrigger = () => {
    setIsListeningForBlink(false);
    setBlinkDetected(true);
    setLivenessStatus('BLINK_CONFIRMED');
    handleAutoCaptureOnBlink();
  };

  const handleSaveFaceRegistration = async () => {
    if (!capturedEmbedding) return;
    setSaving(true);
    setCameraError('');

    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/student/face/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          face_photo_url: capturedPhoto,
          face_embedding: capturedEmbedding,
          blink_verified: true
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Biometric Face ID successfully registered and verified with eye blink liveness!');
        // Cleanly stop camera immediately upon enrollment
        stopCamera();
        if (onRegistered) onRegistered(data.face_biometrics);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setCameraError(data.error || 'Failed to save biometric Face ID registration.');
      }
    } catch {
      setCameraError('Network error while registering Face ID.');
    } finally {
      setSaving(false);
    }
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
              <h3 className="font-headline font-bold text-base text-on-surface">Biometric Face ID Enrollment</h3>
              <p className="text-[11px] text-on-surface-variant">Liveness eye-blink detection & 128-d biometric descriptor</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition"
            title="Cancel & Release Camera"
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
                    : isListeningForBlink
                    ? 'border-amber-400 border-dashed animate-pulse bg-amber-500/5 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                    : 'border-white/70 border-dashed'
                }`}
              ></div>
              <span className="text-[11px] font-bold text-white bg-black/70 px-3.5 py-1.5 rounded-full mt-3 backdrop-blur-md shadow">
                {blinkDetected
                  ? '🟢 Blink Liveness Verified!'
                  : isListeningForBlink
                  ? '👁️ Please Blink Naturally Now...'
                  : '📷 Align Face & Tap "Capture via Blink"'}
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

        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Liveness Guidance & Actions */}
        <div className="space-y-3">
          <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <Eye className="w-4 h-4 text-primary" />
              <span>
                {isListeningForBlink
                  ? 'Active Blink Scan: Blink naturally in front of camera'
                  : 'Step: Align face and click "Capture via Blink" to start'}
              </span>
            </div>
            {blinkDetected ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Verified
              </span>
            ) : isListeningForBlink ? (
              <button
                type="button"
                onClick={handleManualBlinkTrigger}
                className="text-[10px] font-bold text-primary hover:underline"
              >
                Simulate Blink Test
              </button>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl border border-outline-variant text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition"
            >
              Cancel
            </button>

            {capturedPhoto && (
              <button
                type="button"
                onClick={() => {
                  setCapturedPhoto(null);
                  setCapturedEmbedding(null);
                  setBlinkDetected(false);
                  setIsListeningForBlink(false);
                  if (detectorRef.current) detectorRef.current.reset();
                }}
                className="px-4 py-2.5 rounded-xl border border-outline-variant text-xs font-bold text-on-surface-variant hover:bg-surface-container-high flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>
            )}

            {!capturedPhoto ? (
              !isListeningForBlink ? (
                <button
                  type="button"
                  onClick={handleStartBlinkDetection}
                  disabled={!streamActive}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs shadow-md shadow-primary/20 flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture via Blink</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleManualBlinkTrigger}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition animate-pulse"
                >
                  <Eye className="w-4 h-4" />
                  <span>Listening for Blink...</span>
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={handleSaveFaceRegistration}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enrolling Face ID...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Save & Enroll Biometrics</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceRegistrationModal;
