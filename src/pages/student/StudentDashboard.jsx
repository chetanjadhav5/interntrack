import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MetricCard from '../../components/common/MetricCard';
import StatusBadge from '../../components/common/StatusBadge';
import ProfileCompletionModal from '../../components/common/ProfileCompletionModal';
import {
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Building2,
  Clock,
  ArrowRight,
  GitBranch,
  Award,
  FileText,
  Navigation,
  ShieldCheck,
  Send,
  Camera,
  Loader2,
  Check,
  X,
  TrendingUp,
  Sparkles,
  ScanFace,
  Eye,
  Globe,
  FileUp,
  FileCheck,
  Image as ImageIcon
} from 'lucide-react';
import FaceVerificationModal from '../../components/common/FaceVerificationModal';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [activeInternship, setActiveInternship] = useState(null);
  const [todayCheckin, setTodayCheckin] = useState(null);
  const [totalHoursWorked, setTotalHoursWorked] = useState(0);
  const [daysAttended, setDaysAttended] = useState(0);
  const [avgDailyHours, setAvgDailyHours] = useState(8.0);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Check-in / Check-out & Face Verification State
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [isFaceVerifyModalOpen, setIsFaceVerifyModalOpen] = useState(false);
  const [faceModalActionType, setFaceModalActionType] = useState('CHECK_IN');
  const [isFaceRegistered, setIsFaceRegistered] = useState(false);
  const [workSummary, setWorkSummary] = useState('');
  const [customHours, setCustomHours] = useState('8.5');
  const [dailyProof, setDailyProof] = useState(null);
  const [proofUploadError, setProofUploadError] = useState('');
  const [checkinDistance, setCheckinDistance] = useState(null);
  const [checkinMessage, setCheckinMessage] = useState('');
  const [checkinError, setCheckinError] = useState('');
  const [activeDurationText, setActiveDurationText] = useState('0h 0m');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    let timer;
    if (todayCheckin?.checkin_time && !todayCheckin?.checkout_time) {
      const updateTimer = () => {
        const checkinTime = new Date(todayCheckin.checkin_time);
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
  }, [todayCheckin]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('ghr_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [profileRes, activeRes, appsRes] = await Promise.all([
        fetch('/api/student/profile', { headers }),
        fetch('/api/student/internships/active', { headers }),
        fetch('/api/student/applications/my-applications', { headers })
      ]);

      if (profileRes.ok) {
        const prof = await profileRes.json();
        setProfileData(prof);
        setIsFaceRegistered(Boolean(prof.face_biometrics?.registered));
        if (prof.profile_completion_percent < 100 || prof.verification_status !== 'VERIFIED') {
          setShowCompletionModal(true);
        }
      }

      if (activeRes.ok) {
        const activeData = await activeRes.json();
        setActiveInternship(activeData.internship);
        setTodayCheckin(activeData.today_checkin);
        if (activeData.face_registered !== undefined) setIsFaceRegistered(activeData.face_registered);
        if (activeData.total_hours_worked !== undefined) setTotalHoursWorked(activeData.total_hours_worked);
        if (activeData.days_attended !== undefined) setDaysAttended(activeData.days_attended);
        if (activeData.average_daily_hours !== undefined) setAvgDailyHours(activeData.average_daily_hours);
      }

      if (appsRes.ok) {
        const apps = await appsRes.json();
        setApplicationsCount(apps.length || 0);
      }
    } catch (err) {
      console.error('Error loading student dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCheckinModal = () => {
    if (!isFaceRegistered) {
      setCheckinError('Please enroll your Biometric Face ID in your Profile section before checking in.');
      return;
    }
    setFaceModalActionType('CHECK_IN');
    setIsFaceVerifyModalOpen(true);
  };

  const handleRemoteCheckIn = async () => {
    setCheckinLoading(true);
    setCheckinError('');
    setCheckinMessage('');
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
        setCheckinMessage(resData.message || 'Remote Check-In successful! Have a productive day.');
        await fetchDashboardData();
      } else {
        setCheckinError(resData.error || 'Failed to check in');
      }
    } catch (err) {
      setCheckinError('Network error during remote check-in');
    } finally {
      setCheckinLoading(false);
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

  const handleOpenCheckoutModal = () => {
    setShowCheckoutModal(true);
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
    setCheckoutLoading(true);
    setCheckinError('');
    setCheckinMessage('');
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
        setCheckinMessage(resData.message || 'Remote Check-Out & daily work proof submitted successfully!');
        setShowCheckoutModal(false);
        setDailyProof(null);
        await fetchDashboardData();
      } else {
        setCheckinError(resData.error || 'Failed to check out');
      }
    } catch (err) {
      setCheckinError('Network error during remote check-out');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleBiometricVerificationSuccess = async (result) => {
    if (result.record) {
      setTodayCheckin(result.record);
    }
    setCheckinMessage(result.message || 'Biometric verification successful!');
    setCheckinError('');
    await fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const isCheckedIn = todayCheckin && !todayCheckin.checkout_time;
  const isCheckedOut = todayCheckin && Boolean(todayCheckin.checkout_time);

  return (
    <div className="space-y-6">
      {/* Profile Completion Popup */}
      <ProfileCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        profile={profileData}
      />

      {/* Top Welcome & Mentor Header */}
      <div className="bg-gradient-to-r from-primary via-primary-container to-secondary rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider">
                Student Workspace
              </span>
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  profileData?.verification_status === 'VERIFIED'
                    ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-300/30'
                    : 'bg-amber-400/20 text-amber-100 border border-amber-300/30'
                }`}
              >
                Profile: {profileData?.verification_status || 'PENDING'}
              </span>
            </div>

            <h1 className="font-headline font-black text-2xl sm:text-3xl tracking-tight">
              Welcome back, {profileData?.full_name || 'Student'}!
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
              PRN: <strong>{profileData?.student_id}</strong> | {profileData?.branch} ({profileData?.passing_year})
            </p>
          </div>

          {/* Assigned Mentor Badge */}
          <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-4 min-w-[240px]">
            <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest block mb-1">
              Assigned Faculty Mentor
            </span>
            <p className="font-headline font-bold text-sm text-white">
              {profileData?.mentor_info?.name || 'Yet to assign'}
            </p>
            <p className="text-[11px] text-blue-100">
              {profileData?.mentor_info?.email || 'Will be assigned upon T&P verification'}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Current CGPA"
          value={profileData?.current_cgpa ? `${profileData.current_cgpa} / 10` : 'Not Set'}
          icon="grade"
          color="primary"
        />
        <MetricCard
          title="Total Hours Logged"
          value={`${totalHoursWorked} hrs`}
          icon="schedule"
          color="success"
        />
        <MetricCard
          title="Applied Drives"
          value={applicationsCount}
          icon="assignment_ind"
          color="purple"
        />
        {(!profileData?.branch || ['cs', 'computer', 'it', 'information', 'bca', 'mca', 'software', 'ai', 'data science', 'cyber', 'cse'].some(b => profileData.branch.toLowerCase().includes(b))) ? (
          <MetricCard
            title="GitHub Work Score"
            value={profileData?.github_score ? `${profileData.github_score} / 100` : 'Not Connected'}
            icon="terminal"
            color="secondary"
          />
        ) : (
          <MetricCard
            title="Logbook Compliance"
            value="100% Accredited"
            icon="verified_user"
            color="success"
          />
        )}
      </div>

      {/* Main Grid: Active Internship & Daily Check-In vs Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Internship & Geofenced Check-In */}
        <div className="lg:col-span-2 space-y-6">
          {activeInternship ? (
            <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">
                    Active Ongoing Internship
                  </span>
                  <h2 className="font-headline font-bold text-xl text-on-surface mt-1">
                    {activeInternship.company_name} — {activeInternship.role_position}
                  </h2>
                  <p className="text-xs text-on-surface-variant flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-secondary" />
                    {activeInternship.office_address}
                  </p>
                </div>
                <StatusBadge status={activeInternship.status} />
              </div>

              {/* Geofenced / Remote Daily Attendance & Work Hours Card */}
              <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/60 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      activeInternship.internship_mode === 'REMOTE'
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-blue-50 border border-blue-100 text-primary'
                    }`}>
                      {activeInternship.internship_mode === 'REMOTE' ? <Globe className="w-5 h-5" /> : <Navigation className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-headline font-bold text-sm text-on-surface">Daily Attendance & Work Terminal</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          activeInternship.internship_mode === 'REMOTE'
                            ? 'bg-purple-100 text-purple-900 border border-purple-200'
                            : 'bg-blue-100 text-blue-900 border border-blue-200'
                        }`}>
                          {activeInternship.internship_mode === 'REMOTE' ? '🌐 Remote Mode' : '🏢 On-Site Mode'}
                        </span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant">
                        {activeInternship.internship_mode === 'REMOTE'
                          ? 'Work From Home (Daily Work Proof Required on Checkout)'
                          : `Fixed Institutional Geofence: ${activeInternship.geofence_radius || 300}m`}
                      </p>
                    </div>
                  </div>

                  {isCheckedIn ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white"></span>
                      <span>Checked In ({activeDurationText})</span>
                    </span>
                  ) : isCheckedOut ? (
                    <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center gap-1 shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Day Completed ({todayCheckin.hours_worked} hrs)</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                      Pending Check-In
                    </span>
                  )}
                </div>

                {checkinMessage && (
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{checkinMessage}</span>
                  </div>
                )}

                {checkinError && (
                  <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{checkinError}</span>
                  </div>
                )}

                {!todayCheckin ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <p className="text-xs text-on-surface-variant">
                      {activeInternship.internship_mode === 'REMOTE'
                        ? '⚡ Direct Remote Check-In: No geolocation or biometric scan required.'
                        : 'Requires 300m GPS office geofence verification and enrolled Biometric Face ID matching.'}
                    </p>
                    {activeInternship.internship_mode === 'REMOTE' ? (
                      <button
                        onClick={handleRemoteCheckIn}
                        disabled={checkinLoading}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-purple-900/20 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {checkinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                        <span>⚡ Remote One-Click Check-In</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleOpenCheckinModal}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-700 text-on-primary text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/20 transition-all active:scale-95"
                      >
                        <ScanFace className="w-4 h-4" />
                        <span>Geofenced Face Check-In</span>
                      </button>
                    )}
                  </div>
                ) : isCheckedIn ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <div className="text-xs text-on-surface-variant">
                      <span>Shift started at: <strong>{new Date(todayCheckin.checkin_time).toLocaleTimeString()}</strong></span>
                      {activeInternship.internship_mode !== 'REMOTE' && (
                        <span className="text-emerald-700 font-semibold ml-2">({todayCheckin.distance_meters || 24}m from center)</span>
                      )}
                    </div>
                    <button
                      onClick={handleOpenCheckoutModal}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all"
                    >
                      {activeInternship.internship_mode === 'REMOTE' ? <FileUp className="w-4 h-4" /> : <ScanFace className="w-4 h-4" />}
                      <span>{activeInternship.internship_mode === 'REMOTE' ? 'Check Out & Submit Work Proof' : 'Biometric Check Out & Log Hours'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-xs text-on-surface-variant border-t border-outline-variant/40">
                    <div>
                      <span>Logged: <strong>{todayCheckin.hours_worked} hrs</strong></span>
                      <span className="mx-2">•</span>
                      <span>Task: <em>{todayCheckin.work_summary || 'Daily engineering tasks completed.'}</em></span>
                    </div>
                    <Link
                      to="/student/attendance"
                      className="text-primary font-bold hover:underline flex items-center gap-1"
                    >
                      <span>View Full History</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Navigation Links to Tasks, Attendance and Workflow */}
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/student/attendance"
                  className="px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Daily Attendance & Hours Log</span>
                </Link>
                <Link
                  to="/student/tasks-reports"
                  className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  <FileText className="w-4 h-4 text-primary" />
                  <span>Friday Reports Hub</span>
                </Link>
                <Link
                  to="/student/workflow"
                  className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  <Award className="w-4 h-4 text-secondary" />
                  <span>Interactive Workflow Tracker</span>
                </Link>
                <Link
                  to="/student/offers-ppo"
                  className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span>PPO & Offer Letters</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/60 text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-primary flex items-center justify-center mx-auto border border-blue-100">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-lg text-on-surface">No Active Internship Right Now</h3>
                <p className="text-xs text-on-surface-variant max-w-md mx-auto mt-1">
                  Complete your profile, browse available placement drives, or report an off-campus self-placed internship.
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <Link
                  to="/student/directory"
                  className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 flex items-center gap-2 transition-colors shadow-sm"
                >
                  <span>Explore Placement Drives</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/student/report-self-placed"
                  className="px-5 py-2.5 rounded-xl bg-surface-container-high text-on-surface text-xs font-bold hover:bg-surface-container-highest flex items-center gap-2 transition-colors"
                >
                  <span>Report Self-Placed</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Mentor Card & Quick Links */}
        <div className="space-y-6">
          {/* Institutional Credit Target */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h3 className="font-headline font-bold text-sm text-on-surface">Internship Credit Goal</h3>
              </div>
              <span className="text-xs font-black text-primary">450 Hours Required</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant">
                <span>Completed Hours</span>
                <span className="font-mono font-bold text-on-surface">{totalHoursWorked} / 450 hrs</span>
              </div>
              <div className="w-full h-3 rounded-full bg-surface-container-high overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalHoursWorked / 450) * 100)}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-on-surface-variant pt-1">
                {((totalHoursWorked / 450) * 100).toFixed(1)}% of institutional engineering credits fulfilled
              </p>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-3">
            <h3 className="font-headline font-bold text-sm text-on-surface border-b border-outline-variant/40 pb-2">
              Quick Portals
            </h3>
            <div className="space-y-2">
              <Link
                to="/student/tasks-reports"
                className="p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container-high transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-on-surface">Friday Weekly Logbook</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-on-surface-variant group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/student/attendance"
                className="p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container-high transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-on-surface">Daily Attendance Ledger</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-on-surface-variant group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/student/workflow"
                className="p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container-high transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold text-on-surface">Accreditation Lifecycle</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-on-surface-variant group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Check-Out & Daily Log Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-outline-variant/60 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="font-headline font-bold text-lg text-on-surface">
                  {activeInternship?.internship_mode === 'REMOTE' ? 'Remote Daily Check-Out & Work Proof' : 'Daily Check-Out & Work Log'}
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
                if (activeInternship?.internship_mode === 'REMOTE') {
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
              {activeInternship?.internship_mode === 'REMOTE' && (
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
                  disabled={checkoutLoading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white font-bold text-xs shadow-md shadow-primary/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {checkoutLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : activeInternship?.internship_mode === 'REMOTE' ? (
                    <FileCheck className="w-4 h-4" />
                  ) : (
                    <ScanFace className="w-4 h-4" />
                  )}
                  <span>{activeInternship?.internship_mode === 'REMOTE' ? 'Submit Work Proof & Check Out' : 'Verify Face & Check Out'}</span>
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

export default StudentDashboard;
