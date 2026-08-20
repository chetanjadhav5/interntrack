import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Camera,
  ScanFace,
  Clock,
  ArrowRight,
  RefreshCw,
  Navigation,
  Sparkles,
  Building2,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { extractFaceEmbeddingFromCanvas } from '../../utils/faceBiometrics';

// Haversine distance calculator in meters
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

const FaceVerificationModal = ({
  isOpen,
  onClose,
  actionType = 'CHECK_IN',
  internship,
  onSuccess,
  customHours = '8.5',
  workSummary = ''
}) => {
  // Step 1 = Geofence Verification, Step 2 = Face Capture & Verification
  const [currentStep, setCurrentStep] = useState(1);

  // Geofence & Location States
  const [locating, setLocating] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [distanceToCompany, setDistanceToCompany] = useState(null);
  const [isInsideGeofence, setIsInsideGeofence] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [isSimulatedLocation, setIsSimulatedLocation] = useState(false);

  // Camera & Face Verification States
  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const geoWatchIdRef = useRef(null);

  const targetLat = internship?.latitude || 18.5529;
  const targetLng = internship?.longitude || 73.9497;
  const companyName = internship?.company_name || 'Designated Internship Partner Office';
  const officeAddress = internship?.office_address || 'Registered Corporate Office';
  const allowedRadius = internship?.geofence_radius || 300;

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setVerificationResult(null);
      setCapturedPhoto(null);
      setCameraError('');
      setLocationError('');
      setVerifying(false);
      setIsSimulatedLocation(false);
      startLocationWatcher();
    } else {
      stopLocationWatcher();
      stopCamera();
    }

    return () => {
      stopLocationWatcher();
      stopCamera();
    };
  }, [isOpen, internship]);

  useEffect(() => {
    // When switching to Step 2, start camera feed
    if (currentStep === 2 && isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [currentStep, isOpen]);

  // Start real-time GPS geolocation tracker
  const startLocationWatcher = () => {
    setLocating(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser. Please use a modern browser.');
      setLocating(false);
      return;
    }

    // Single fast query + Continuous watcher for refining precision
    navigator.geolocation.getCurrentPosition(
      (pos) => handleLocationSuccess(pos),
      (err) => handleLocationError(err),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );

    geoWatchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => handleLocationSuccess(pos),
      (err) => handleLocationError(err),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const stopLocationWatcher = () => {
    if (geoWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(geoWatchIdRef.current);
      geoWatchIdRef.current = null;
    }
  };

  const handleLocationSuccess = (pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const accuracy = pos.coords.accuracy || 15;

    const distance = calculateHaversineDistance(lat, lng, targetLat, targetLng);
    setUserLocation({ lat, lng });
    setLocationAccuracy(accuracy);
    setDistanceToCompany(distance);
    setIsInsideGeofence(distance <= allowedRadius);
    setLocating(false);
    setLocationError('');
  };

  const handleLocationError = (err) => {
    setLocating(false);
    console.warn('Geolocation error:', err);
    if (err.code === 1) {
      setLocationError('Location permission denied. Please allow location access in your browser to verify office proximity.');
    } else if (err.code === 2) {
      setLocationError('Position unavailable. Retrying GPS lock...');
    } else {
      setLocationError('GPS signal timed out. You can retry or use proximity simulation below.');
    }
  };

  // Helper for demo / testing: Simulate within 300m range
  const handleSimulateProximity = () => {
    const simLat = targetLat + (Math.random() - 0.5) * 0.0006;
    const simLng = targetLng + (Math.random() - 0.5) * 0.0006;
    const distance = calculateHaversineDistance(simLat, simLng, targetLat, targetLng);

    setUserLocation({ lat: simLat, lng: simLng });
    setLocationAccuracy(8);
    setDistanceToCompany(distance);
    setIsInsideGeofence(true);
    setIsSimulatedLocation(true);
    setLocationError('');
    setLocating(false);
  };

  // Start Webcam Stream
  const startCamera = async () => {
    setCameraError('');
    setCapturedPhoto(null);

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
      setCameraError('Webcam access was not granted. Please allow camera permissions in your browser.');
    }
  };

  // Stop Webcam Stream and Release Hardware Access Immediately
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
    stopLocationWatcher();
    stopCamera();
    onClose();
  };

  // Capture Face Snapshot (Direct Snapshot - No Blink Required)
  const handleCaptureFaceAndVerify = async () => {
    if (!videoRef.current) return;
    setVerifying(true);
    setCameraError('');

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

    try {
      const token = localStorage.getItem('ghr_token');
      let endpoint = '/api/student/attendance/check-in';
      let payload = {};

      const currentLat = userLocation?.lat || targetLat;
      const currentLng = userLocation?.lng || targetLng;

      if (actionType === 'CHECK_IN') {
        payload = {
          latitude: currentLat,
          longitude: currentLng,
          photo_url: photoDataUrl,
          face_embedding: embedding
        };
      } else {
        endpoint = '/api/student/attendance/check-out';
        payload = {
          hours_worked: parseFloat(customHours) || 8.5,
          work_summary: workSummary || 'Completed daily assigned engineering sprint items and code review.',
          face_embedding: embedding
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
        // Stop camera immediately on successful check-in
        stopCamera();
        if (onSuccess) onSuccess(data);
        setTimeout(() => {
          onClose();
        }, 1600);
      } else {
        setCameraError(data.error || 'Biometric verification failed.');
        setCapturedPhoto(null);
      }
    } catch {
      setCameraError('Network error while processing verification.');
      setCapturedPhoto(null);
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-outline-variant/60 shadow-2xl space-y-4 animate-in zoom-in-95">
        {/* Header with Step Progress */}
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              {currentStep === 1 ? <MapPin className="w-5 h-5" /> : <ScanFace className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-on-surface">
                {actionType === 'CHECK_IN' ? 'Biometric Geofenced Check-In' : 'Biometric Check-Out & Work Log'}
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                {currentStep === 1
                  ? 'Step 1 of 2: Geofence Location & Precision Check'
                  : 'Step 2 of 2: Face Snapshot Verification'}
              </p>
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

        {/* Step 1: Geofence Location Verification */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in">
            {/* Target Office Card */}
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-bold text-primary flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  Target Internship Office
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  Allowed Radius: {allowedRadius}m
                </span>
              </div>
              <p className="text-xs font-bold text-on-surface">{companyName}</p>
              <p className="text-[11px] text-on-surface-variant line-clamp-1">{officeAddress}</p>
            </div>

            {/* Live GPS Distance & Accuracy Monitor */}
            <div className="p-4 rounded-2xl bg-slate-950 text-white space-y-3 shadow-inner">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                  Live GPS Proximity
                </span>
                {locating ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Acquiring Lock...
                  </span>
                ) : distanceToCompany !== null ? (
                  <span
                    className={`font-mono font-bold text-xs px-2.5 py-0.5 rounded-full ${
                      isInsideGeofence ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-red-500/20 text-red-300 border border-red-500/40'
                    }`}
                  >
                    {distanceToCompany}m Away
                  </span>
                ) : null}
              </div>

              {/* Status Message based on Precision and Distance */}
              {locating ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                  <span>📍 Acquiring high-precision GPS lock. Please wait while your location refines...</span>
                </div>
              ) : locationAccuracy && locationAccuracy > 80 ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    GPS signal is refining (Current accuracy: ±{Math.round(locationAccuracy)}m). Please wait a moment for a precise lock.
                  </span>
                </div>
              ) : isInsideGeofence ? (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="font-bold">You are inside the {allowedRadius}m office perimeter!</p>
                    <p className="text-[11px] text-emerald-200/80">
                      Distance: <strong>{distanceToCompany} meters</strong> • GPS Precision: ±{Math.round(locationAccuracy || 5)}m
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Outside Office Perimeter ({distanceToCompany}m away)</p>
                    <p className="text-[11px] text-red-200/80">
                      Institutional policy requires you to be within <strong>{allowedRadius} meters</strong> of {companyName} to check in.
                    </p>
                  </div>
                </div>
              )}

              {/* Location Error if any */}
              {locationError && (
                <div className="p-2.5 rounded-xl bg-red-900/30 border border-red-700/50 text-red-300 text-xs flex items-center justify-between gap-2">
                  <span>{locationError}</span>
                  <button
                    type="button"
                    onClick={startLocationWatcher}
                    className="text-[11px] font-bold text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Retry
                  </button>
                </div>
              )}
            </div>

            {/* Actions & Simulation Trigger */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleSimulateProximity}
                className="text-[11px] text-primary hover:underline font-bold flex items-center gap-1"
                title="Use simulated coordinates within 300m for testing/demo"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulate 300m Range (Demo)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/60 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={!isInsideGeofence || (locationAccuracy && locationAccuracy > 100)}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs shadow-md shadow-primary/20 flex items-center gap-1.5 transition disabled:opacity-40 active:scale-95"
                >
                  <span>Proceed to Face ID</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Face Snapshot Capture & Verification (No Blink Required) */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in">
            {/* Live Camera Scanner */}
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
                  <div className="w-48 h-60 rounded-[50%] border-2 border-white/80 border-dashed transition-all duration-300"></div>
                  <span className="text-[11px] font-bold text-white bg-black/75 px-3.5 py-1.5 rounded-full mt-3 backdrop-blur-md shadow flex items-center gap-1.5">
                    {verifying ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                        <span>Verifying Facial Biometrics...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-3.5 h-3.5 text-white/80" />
                        <span>Align Face & Tap Capture Below</span>
                      </>
                    )}
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

            {/* Success Notification Banner */}
            {verificationResult && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  {actionType === 'CHECK_IN'
                    ? `Biometric Check-In Successful! Face verified (${verificationResult.face_match || '100%'}).`
                    : `Biometric Check-Out Verified! Logged ${verificationResult.hours_worked} working hours.`}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setCurrentStep(1);
                }}
                disabled={verifying}
                className="text-xs font-bold text-on-surface-variant hover:text-primary transition"
              >
                ← Back to Geofence
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={verifying}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/60 transition"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleCaptureFaceAndVerify}
                  disabled={!streamActive || verifying || Boolean(verificationResult)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-700 text-on-primary font-bold text-xs shadow-md shadow-primary/20 flex items-center gap-2 transition disabled:opacity-50 active:scale-95"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Matching Face ID...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span>{actionType === 'CHECK_IN' ? 'Capture Face & Check In' : 'Capture Face & Check Out'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceVerificationModal;
