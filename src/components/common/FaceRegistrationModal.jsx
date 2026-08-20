import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ShieldCheck,
  RefreshCw,
  ScanFace,
  Sparkles
} from 'lucide-react';
import { extractFaceEmbeddingFromCanvas } from '../../utils/faceBiometrics';

const FaceRegistrationModal = ({ isOpen, onClose, onRegistered, currentBiometrics }) => {
  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [capturedEmbedding, setCapturedEmbedding] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(null);
      setCapturedEmbedding(null);
      setSuccessMessage('');
      setCameraError('');
      startCamera();
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

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch((e) => console.warn('Play error:', e));
          setStreamActive(true);
        };
      }
    } catch (err) {
      console.warn('Webcam permission error:', err);
      setCameraError('Webcam access was not granted. Please ensure camera permissions are enabled in your browser.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
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
      tracks.forEach((track) => {
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

  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
    }
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const embedding = extractFaceEmbeddingFromCanvas(canvas);

    setCapturedPhoto(photoDataUrl);
    setCapturedEmbedding(embedding);
    // Once photo is captured, pause live stream preview
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setCapturedEmbedding(null);
    startCamera();
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
          face_embedding: capturedEmbedding
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Biometric Face ID successfully registered and enrolled!');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-outline-variant/60 shadow-2xl space-y-4 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ScanFace className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-on-surface">Biometric Face ID Enrollment</h3>
              <p className="text-[11px] text-on-surface-variant">Capture a clear front-facing portrait for attendance check-ins</p>
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

        {/* Video / Photo Preview Container */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-[4/3] flex items-center justify-center border-2 border-primary/30 shadow-inner">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`w-full h-full object-cover ${capturedPhoto ? 'hidden' : 'block'}`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {capturedPhoto && (
            <img src={capturedPhoto} alt="Captured Face" className="w-full h-full object-cover" />
          )}

          {/* Oval Guide Overlay */}
          {!capturedPhoto && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-48 h-60 rounded-[50%] border-2 border-white/80 border-dashed"></div>
              <span className="text-[11px] font-bold text-white bg-black/75 px-3.5 py-1.5 rounded-full mt-3 backdrop-blur-md shadow flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-white/80" />
                <span>Align Face Inside Oval & Tap Capture</span>
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

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          {capturedPhoto ? (
            <button
              type="button"
              onClick={handleRetake}
              className="px-4 py-2.5 rounded-xl border border-outline-variant text-xs font-bold text-on-surface-variant hover:bg-surface-container-high flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retake Photo</span>
            </button>
          ) : (
            <div className="text-[11px] text-on-surface-variant flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Ensure good lighting and face camera</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl border border-outline-variant text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition"
            >
              Cancel
            </button>

            {!capturedPhoto ? (
              <button
                type="button"
                onClick={handleCaptureSnapshot}
                disabled={!streamActive}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs shadow-md shadow-primary/20 flex items-center gap-2 transition disabled:opacity-50 active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Face Snapshot</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveFaceRegistration}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition disabled:opacity-50 active:scale-95"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enrolling Face ID...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Save & Enroll Face ID</span>
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
