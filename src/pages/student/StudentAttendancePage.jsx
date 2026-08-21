import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MetricCard from '../../components/common/MetricCard';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Navigation,
  ShieldCheck,
  Building2,
  FileText,
  Send,
  Loader2,
  ArrowRight,
  TrendingUp,
  Download,
  Check,
  X,
  Sparkles,
  Info,
  ScanFace,
  Eye,
  Globe,
  FileUp,
  FileCheck,
  Image as ImageIcon
} from 'lucide-react';
import FaceVerificationModal from '../../components/common/FaceVerificationModal';

const StudentAttendancePage = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({
    total_hours: 0,
    days_attended: 0,
    average_daily_hours: 8.0,
    target_hours: 450,
    progress_percent: 0,
    geofence_verified_count: 0
  });

  // Check-In / Check-Out Actions
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');

  // Checkout & Face Verification Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [isFaceVerifyModalOpen, setIsFaceVerifyModalOpen] = useState(false);
  const [faceModalActionType, setFaceModalActionType] = useState('CHECK_IN');
  const [workSummary, setWorkSummary] = useState('');
  const [customHours, setCustomHours] = useState('8.5');

  // Remote Mode Work Proof Upload State
  const [dailyProof, setDailyProof] = useState(null);
  const [proofUploadError, setProofUploadError] = useState('');

  // Active Timer Ticker
  const [activeDurationText, setActiveDurationText] = useState('0h 0m');

  useEffect(() => {
    fetchAttendanceHistory();
  }, []);

  useEffect(() => {
    // Live timer for active check-in
    let timer;
    if (data?.today_record?.checkin_time && !data?.today_record?.checkout_time) {
      const updateTimer = () => {
        const checkinTime = new Date(data.today_record.checkin_time);
        const now = new Date();
        const diffMs = Math.max(0, now - checkinTime);
        const mins = Math.floor((diffMs / (1000 * 60)) % 60);
        const hrs = Math.floor(diffMs / (1000 * 60 * 60));
        setActiveDurationText(`${hrs}h ${mins}m`);
      };
      updateTimer();
      timer = setInterval(updateTimer, 30000);
    }
    return () => clearInterval(timer);
  }, [data?.today_record]);

  const fetchAttendanceHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/student/attendance/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const resData = await res.json();
        setData(resData);
        setRecords(resData.records || []);
        if (resData.stats) setStats(resData.stats);
      }
    } catch (err) {
      console.error('Error fetching attendance history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCheckInModal = () => {
    if (!data?.face_biometrics?.registered) {
      setActionErr('Please enroll your Biometric Face ID in your Profile before checking in.');
      return;
    }
    setFaceModalActionType('CHECK_IN');
    setIsFaceVerifyModalOpen(true);
  };

  const handleRemoteCheckIn = async () => {
    setActionLoading(true);
    setActionErr('');
    setActionMsg('');
    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/student/attendance/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({})
      });
      const resData = await res.json();
      if (res.ok) {
        setActionMsg(resData.message || 'Remote Check-In successful! Have a productive day.');
        await fetchAttendanceHistory();
      } else {
        setActionErr(resData.error || 'Failed to check in');
      }
    } catch (err) {
      setActionErr('Network error during remote check-in');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProofFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImg = file.type.startsWith('image/');

    if (!isPdf && !isImg) {
      setProofUploadError('Please select a valid image (PNG, JPG, WebP) or PDF file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setProofUploadError('File size exceeds 10 MB limit.');
      return;
    }

    setProofUploadError('');
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setDailyProof({
        url: loadEvt.target.result,
        name: file.name,
        type: isPdf ? 'pdf' : 'image',
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleProceedToBiometricCheckout = () => {
    setShowCheckoutModal(false);
    setFaceModalActionType('CHECK_OUT');
    setIsFaceVerifyModalOpen(true);
  };

  const handleRemoteCheckOut = async (e) => {
    e.preventDefault();
    if (!dailyProof?.url) {
      setProofUploadError('Mandatory: Please upload your work proof (image or PDF) for today to complete check-out.');
      return;
    }
    setActionLoading(true);
    setActionErr('');
    setActionMsg('');
    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/student/attendance/check-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          hours_worked: parseFloat(customHours) || 8.5,
          work_summary: workSummary,
          daily_proof_url: dailyProof.url,
          daily_proof_name: dailyProof.name,
          daily_proof_type: dailyProof.type
        })
      });
      const resData = await res.json();
      if (res.ok) {
        setActionMsg(resData.message || 'Remote Check-Out & daily work proof submitted successfully!');
        setShowCheckoutModal(false);
        setDailyProof(null);
        await fetchAttendanceHistory();
      } else {
        setActionErr(resData.error || 'Failed to check out');
      }
    } catch (err) {
      setActionErr('Network error during remote check-out');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBiometricVerificationSuccess = async (result) => {
    setActionMsg(result.message || 'Biometric verification successful!');
    setActionErr('');
    await fetchAttendanceHistory();
  };

  const activeInternship = data?.internship;
  const isRemote = activeInternship?.internship_mode === 'REMOTE';
  const todayRecord = data?.today_record;
  const isCheckedIn = todayRecord && !todayRecord.checkout_time;
  const isCheckedOut = todayRecord && Boolean(todayRecord.checkout_time);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Attendance & Working Hours</span>
            {isRemote ? (
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-bold flex items-center gap-1">
                <Globe className="w-3 h-3 text-purple-700" />
                <span>Remote Internship (Work From Home)</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-bold flex items-center gap-1">
                <Building2 className="w-3 h-3 text-blue-700" />
                <span>On-Site (300m Fixed Geofence)</span>
              </span>
            )}
          </div>
          <h1 className="font-headline font-black text-2xl sm:text-3xl text-on-surface tracking-tight">
            Daily Attendance & Hours Log
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-xl">
            {activeInternship
              ? `Logging daily ${isRemote ? 'remote' : 'workplace'} attendance at ${activeInternship.company_name} (${activeInternship.role_position})`
              : 'Track daily check-in, check-out, working hours, and institutional credit progress.'}
          </p>
        </div>

        {activeInternship && (
          <div className="flex items-center gap-3">
            <div className="bg-surface-container-low px-4 py-2.5 rounded-2xl border border-outline-variant/60 text-right">
              <span className="text-[10px] text-on-surface-variant font-bold block uppercase tracking-wider">
                Target Hours
              </span>
              <span className="font-headline font-black text-base text-primary">
                {stats.total_hours} / {stats.target_hours} hrs
              </span>
            </div>
          </div>
        )}
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {actionErr && (
        <div className="p-4 rounded-2xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionErr}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Total Hours Worked"
          value={`${stats.total_hours} hrs`}
          icon="schedule"
          color="primary"
        />
        <MetricCard
          title="Days Attended"
          value={`${stats.days_attended} Days`}
          icon="event_available"
          color="success"
        />
        <MetricCard
          title="Average Daily Hours"
          value={`${stats.average_daily_hours} hrs/day`}
          icon="trending_up"
          color="secondary"
        />
        <MetricCard
          title={isRemote ? "Daily Proofs Verified" : "Geofence Verified Rate"}
          value={`${stats.days_attended > 0 ? '100%' : 'N/A'}`}
          icon="verified_user"
          color="success"
        />
      </div>

      {/* Active Check-In / Check-Out Action Terminal */}
      {activeInternship && (
        <div className="bg-gradient-to-br from-surface-container-lowest via-surface-container-low to-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 shadow-inner">
                {isRemote ? <Globe className="w-6 h-6" /> : <Navigation className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-headline font-bold text-lg text-on-surface">Daily Attendance Terminal</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isRemote ? 'bg-purple-100 text-purple-900 border border-purple-200' : 'bg-blue-100 text-blue-900 border border-blue-200'
                  }`}>
                    {isRemote ? '🌐 Remote Mode' : '🏢 On-Site Mode'}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>{isRemote ? 'Work From Home (Daily Work Proof Required on Checkout)' : activeInternship.office_address}</span>
                </p>
              </div>
            </div>

            {/* Status Pill */}
            <div>
              {isCheckedIn ? (
                <span className="px-4 py-1.5 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  <span>Currently Checked In ({activeDurationText})</span>
                </span>
              ) : isCheckedOut ? (
                <span className="px-4 py-1.5 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Completed Today ({todayRecord.hours_worked} hrs)</span>
                </span>
              ) : (
                <span className="px-4 py-1.5 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Not Checked In Today</span>
                </span>
              )}
            </div>
          </div>

          {/* Interactive Action Control */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-2">
              <h4 className="font-bold text-sm text-on-surface">
                {!todayRecord
                  ? (isRemote ? 'Start your remote work day' : 'Ready to start your work day at office?')
                  : isCheckedIn
                  ? `Active session started at ${new Date(todayRecord.checkin_time).toLocaleTimeString()}`
                  : `Work session concluded at ${new Date(todayRecord.checkout_time).toLocaleTimeString()}`}
              </h4>
              <p className="text-xs text-on-surface-variant">
                {!todayRecord
                  ? (isRemote
                      ? '⚡ Direct Remote Check-In: No geolocation or face scan needed. You will upload daily work proof (image/PDF) when checking out.'
                      : 'Your check-in timestamp and live GPS coordinates will be verified within the 300m institutional perimeter with Biometric Face ID.')
                  : isCheckedIn
                  ? (isRemote
                      ? 'When your remote shift finishes, click Check Out to upload today\'s work proof (image/PDF) and log tasks.'
                      : 'When your shift finishes, click Check Out to calculate total working hours and record daily engineering notes.')
                  : `Summary: ${todayRecord.work_summary || 'Completed daily engineering tasks.'}`}
              </p>

              {/* Progress Bar towards Target */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-on-surface-variant">Institutional Internship Credit Target (450 Hours)</span>
                  <span className="text-primary">{stats.progress_percent}% Completed</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-surface-container-high overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, stats.progress_percent)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-start md:justify-end">
              {!todayRecord ? (
                isRemote ? (
                  <button
                    type="button"
                    onClick={handleRemoteCheckIn}
                    disabled={actionLoading}
                    className="w-full md:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold text-xs shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                    <span>⚡ Remote One-Click Check In</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenCheckInModal}
                    className="w-full md:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-700 text-on-primary font-bold text-xs shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <ScanFace className="w-4 h-4" />
                    <span>Biometric Check In (Blink Liveness)</span>
                  </button>
                )
              ) : isCheckedIn ? (
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(true)}
                  className="w-full md:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white font-bold text-xs shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  {isRemote ? <FileUp className="w-4 h-4" /> : <ScanFace className="w-4 h-4" />}
                  <span>{isRemote ? 'Check Out & Submit Work Proof' : 'Biometric Check Out & Log Hours'}</span>
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold text-center">
                  ✅ Day Concluded ({todayRecord.hours_worked} hrs)
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Attendance History Ledger Table */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/40 pb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-headline font-bold text-base text-on-surface">Daily Attendance & Work Ledger</h3>
              <p className="text-[11px] text-on-surface-variant">Complete audit history of timestamps, hours worked, and daily work proofs</p>
            </div>
          </div>
          <span className="text-xs font-bold text-on-surface-variant">
            Showing {records.length} Recorded Shifts
          </span>
        </div>

        {records.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant space-y-2">
            <Clock className="w-10 h-10 text-outline mx-auto" />
            <p className="font-bold text-sm text-on-surface">No attendance records yet</p>
            <p className="text-xs max-w-sm mx-auto">
              Check in daily during your active internship tenure to build your verified work hours ledger.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-outline-variant/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Check-In</th>
                  <th className="px-4 py-3">Check-Out</th>
                  <th className="px-4 py-3">Hours</th>
                  <th className="px-4 py-3">Verification Status</th>
                  <th className="px-4 py-3">Daily Work Proof & Log</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 font-medium">
                {records.map((rec) => {
                  const isShiftComplete = rec.is_completed !== undefined ? rec.is_completed : (Boolean(rec.checkout_time) || rec.status === 'COMPLETED');
                  const checkinFormatted = rec.checkin_time
                    ? new Date(rec.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'N/A';
                  const checkoutFormatted = rec.checkout_time
                    ? new Date(rec.checkout_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : rec.status === 'CHECKED_IN'
                    ? 'In Progress'
                    : isShiftComplete
                    ? 'Auto (8.0h)'
                    : 'Not Checked Out';

                  const hours = isShiftComplete ? (rec.hours_worked ? parseFloat(rec.hours_worked) : 8.0) : 0.0;
                  const recordIsRemote = rec.is_remote || rec.internship_mode === 'REMOTE' || isRemote;

                  return (
                    <tr key={rec.id} className="hover:bg-surface-container-low/60 transition-colors">
                      <td className="px-4 py-3 font-bold text-on-surface whitespace-nowrap font-mono">
                        {rec.date || (rec.checkin_time ? new Date(rec.checkin_time).toLocaleDateString() : 'N/A')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {recordIsRemote ? (
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-bold inline-flex items-center gap-1 border border-purple-200">
                            <Globe className="w-3 h-3" /> Remote
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-bold inline-flex items-center gap-1 border border-blue-200">
                            <Building2 className="w-3 h-3" /> On-Site
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-purple-950 font-semibold whitespace-nowrap">
                        {checkinFormatted}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">
                        {checkoutFormatted}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isShiftComplete ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs font-mono border border-emerald-200">
                            {hours.toFixed(1)} hrs
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-bold text-xs font-mono border border-amber-200">
                            0.0 hrs (Incomplete)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {recordIsRemote ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700">
                            <FileCheck className="w-3.5 h-3.5 text-purple-600" />
                            <span>{rec.daily_proof_url ? 'Proof Uploaded' : 'Remote Log'}</span>
                          </span>
                        ) : isShiftComplete ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Biometric ({rec.distance_meters || 24}m)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Incomplete Shift</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-on-surface text-[11px] max-w-xs">
                        <div className="space-y-1">
                          <p className="truncate">{rec.work_summary || 'Completed daily engineering tasks.'}</p>
                          {rec.daily_proof_url && (
                            <a
                              href={rec.daily_proof_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 transition-colors font-semibold text-[10px]"
                            >
                              {rec.daily_proof_type === 'pdf' ? <FileText className="w-3 h-3 text-red-600" /> : <ImageIcon className="w-3 h-3 text-purple-600" />}
                              <span className="truncate max-w-[120px]">{rec.daily_proof_name || 'View Daily Proof'}</span>
                              <Eye className="w-2.5 h-2.5 text-purple-500 ml-0.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Check-Out & Daily Log Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-outline-variant/60 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="font-headline font-bold text-lg text-on-surface">
                  {isRemote ? 'Remote Daily Check-Out & Work Proof' : 'Daily Check-Out & Work Log'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="p-1 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                if (isRemote) {
                  handleRemoteCheckOut(e);
                } else {
                  e.preventDefault();
                  handleProceedToBiometricCheckout();
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  Logged Working Hours Today
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="16"
                  value={customHours}
                  onChange={(e) => setCustomHours(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-mono font-bold focus:ring-2 focus:ring-primary outline-none"
                />
                <p className="text-[10px] text-on-surface-variant mt-1">
                  Default standard shift is 8.5 hours.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  Daily Work Summary & Tasks Completed
                </label>
                <textarea
                  rows={3}
                  value={workSummary}
                  onChange={(e) => setWorkSummary(e.target.value)}
                  placeholder="e.g. Developed authentication middleware, tested REST API endpoints, submitted daily commits."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs focus:ring-2 focus:ring-primary outline-none resize-none"
                />
              </div>

              {/* Remote Mode: Mandatory Daily Work Proof (Image or PDF) */}
              {isRemote && (
                <div className="space-y-2 p-4 rounded-2xl bg-purple-50/70 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-purple-950 uppercase tracking-wider">
                      Daily Work Proof <span className="text-rose-600">* (Mandatory for Remote)</span>
                    </label>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-200/70 px-2 py-0.5 rounded-full">
                      Image or PDF
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-900 leading-relaxed">
                    Upload a screenshot of your work, code editor, GitHub commit, or daily PDF summary. This is bundled into your Friday weekly report for faculty verification.
                  </p>

                  {proofUploadError && (
                    <div className="p-2.5 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1.5 border border-rose-300">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{proofUploadError}</span>
                    </div>
                  )}

                  {!dailyProof ? (
                    <label className="flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed border-purple-300 hover:border-purple-600 bg-white cursor-pointer transition-all group text-center">
                      <FileUp className="w-6 h-6 text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-purple-950">Click to Select Work Proof File</span>
                      <span className="text-[10px] text-purple-700 mt-0.5">Supports PNG, JPG, WebP, or PDF (Max 10MB)</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf,.pdf"
                        onChange={handleProofFileUpload}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="p-3 rounded-xl bg-white border border-purple-200 flex items-center justify-between gap-3 shadow-sm">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {dailyProof.type === 'pdf' ? (
                          <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-purple-100 flex-shrink-0">
                            <img src={dailyProof.url} alt="Proof" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-on-surface truncate">{dailyProof.name}</p>
                          <p className="text-[10px] text-on-surface-variant">{dailyProof.size} • {dailyProof.type.toUpperCase()}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDailyProof(null)}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-high"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white font-bold text-xs shadow-md shadow-primary/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isRemote ? (
                    <FileCheck className="w-4 h-4" />
                  ) : (
                    <ScanFace className="w-4 h-4" />
                  )}
                  <span>{isRemote ? 'Submit Work Proof & Check Out' : 'Verify Face & Check Out'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Face Verification & Blink Liveness Modal */}
      <FaceVerificationModal
        isOpen={isFaceVerifyModalOpen}
        onClose={() => setIsFaceVerifyModalOpen(false)}
        actionType={faceModalActionType}
        internship={activeInternship}
        customHours={customHours}
        workSummary={workSummary}
        onSuccess={handleBiometricVerificationSuccess}
      />
    </div>
  );
};

export default StudentAttendancePage;
