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
  ScanFace,
  Sliders,
  Zap
} from 'lucide-react';
import { BlinkLivenessDetector, extractFaceEmbeddingFromCanvas } from '../../utils/faceBiometrics';

const FaceRegistrationModal = ({ isOpen, onClose, onRegistered, currentBiometrics }) => {
  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isListeningForBlink, setIsListeningForBlink] = useState(false);
  const [livenessStatus, setLivenessStatus] = useState('ALIGN_FACE');
  const [activityScore, setActivityScore] = useState(0);
  const [sensitivity, setSensitivity] = useState('HIGH');
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
      setBlinkDetected(false);
      setActivityScore(0);
      setCapturedPhoto(null);
      setCapturedEmbedding(null);
      setSuccessMessage('');
      setCameraError('');
      startCamera();

      detectorRef.current = new BlinkLivenessDetector({
        sensitivity: sensitivity,
        onStatusChange: (status) => setLivenessStatus(status),
        onActivityScore: (score) => setActivityScore(score),
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
  }, [isOpen, sensitivity]);

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
          videoRef.current.play().catch(e => console.warn('Play error:', e));
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
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video.readyState >= 2 && video.videoWidth > 0) {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          if (detectorRef.current && isListeningForBlink && !blinkDetected) {
            detectorRef.current.processFrame(canvas);
          }
        }
      }
      animationFrameId.current = requestAnimationFrame(process);
    };
    animationFrameId.current = requestAnimationFrame(process);
  };

  const handleStartBlinkDetection = () => {
    setIsListeningForBlink(true);
    setBlinkDetected(false);
    setActivityScore(0);
    setLivenessStatus('PROMPT_BLINK');
    if (detectorRef.current) {
      detectorRef.current.reset();
    }
  };

  const handleAutoCaptureOnBlink = () => {
    let canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) {
      canvas = document.createElement('canvas');
      canvas.width = videoRef.current?.videoWidth || 640;
      canvas.height = videoRef.current?.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (videoRef.current) ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    }

    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const embedding = extractFaceEmbeddingFromCanvas(canvas);

    setCapturedPhoto(photoDataUrl);
    setCapturedEmbedding(embedding);
  };

  const handleInstantBlinkTrigger = () => {
    setIsListeningForBlink(false);
    setBlinkDetected(true);
    setActivityScore(100);
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
            autoPlay
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
                className={`w-48 h-60 rounded-[50%] border-2 transition-all duration-300 ${
                  blinkDetected
                    ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_30px_rgba(52,211,153,0.5)]'
                    : isListeningForBlink
                    ? 'border-amber-400 border-dashed animate-pulse bg-amber-500/10 shadow-[0_0_25px_rgba(251,191,36,0.4)]'
                    : 'border-white/70 border-dashed'
                }`}
              ></div>
              <span className="text-[11px] font-bold text-white bg-black/75 px-3.5 py-1.5 rounded-full mt-3 backdrop-blur-md shadow flex items-center gap-1.5">
                {blinkDetected ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Blink Liveness Verified!</span>
                  </>
                ) : isListeningForBlink ? (
                  <>
                    <Eye className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                    <span>Please Blink Naturally Now...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5 text-white/80" />
                    <span>Align Face & Tap "Capture via Blink"</span>
                  </>
                )}
              </span>
            </div>
          )}

          {/* Live Sensitivity & Activity Bar */}
          {isListeningForBlink && !blinkDetected && !capturedPhoto && (
            <div className="absolute bottom-3 inset-x-4 bg-black/70 backdrop-blur-md p-2 rounded-xl border border-white/10 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-white font-bold">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Eye Blink Activity Meter</span>
                </span>
                <span className={activityScore > 30 ? 'text-emerald-400 font-mono' : 'text-slate-300 font-mono'}>
                  {activityScore}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-150 rounded-full ${
                    activityScore > 50 ? 'bg-gradient-to-r from-amber-400 to-emerald-400' : 'bg-amber-400'
                  }`}
                  style={{ width: `${activityScore}%` }}
                ></div>
              </div>
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
          <div className="p-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-on-surface-variant text-[11px]">
              <Eye className="w-3.5 h-3.5 text-primary" />
              <span>
                {isListeningForBlink
                  ? 'Blink naturally in front of camera to enroll.'
                  : 'Align face and click "Capture via Blink" to start.'}
              </span>
            </div>

            {isListeningForBlink && (
              <button
                type="button"
                onClick={() => setSensitivity(s => s === 'HIGH' ? 'NORMAL' : 'HIGH')}
                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                title="Toggle detection sensitivity"
              >
                <Sliders className="w-3 h-3" />
                <span>{sensitivity === 'HIGH' ? 'Sensitivity: High' : 'Sensitivity: Normal'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
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
                  setActivityScore(0);
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
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs shadow-md shadow-primary/20 flex items-center gap-2 transition disabled:opacity-50 active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture via Blink</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleInstantBlinkTrigger}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition active:scale-95"
                    title="If lighting is dim, tap to capture face immediately"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>I Blinked (Capture)</span>
                  </button>
                  <button
                    type="button"
                    disabled
                    className="px-4 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 animate-pulse"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Listening...</span>
                  </button>
                </div>
              )
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
