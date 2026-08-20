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
  Eye
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

  const handleOpenCheckoutModal = () => {
    setShowCheckoutModal(true);
  };

  const handleProceedToBiometricCheckout = () => {
    setShowCheckoutModal(false);
    setFaceModalActionType('CHECK_OUT');
    setIsFaceVerifyModalOpen(true);
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
            <p className="text-xs sm:text-sm text-purple-100 max-w-xl">
              PRN: <strong>{profileData?.student_id}</strong> | {profileData?.branch} ({profileData?.passing_year})
            </p>
          </div>

          {/* Assigned Mentor Badge */}
          <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-4 min-w-[240px]">
            <span className="text-[10px] font-bold text-purple-200 uppercase tracking-widest block mb-1">
              Assigned Faculty Mentor
            </span>
            <p className="font-headline font-bold text-sm text-white">
              {profileData?.mentor_info?.name || 'Yet to assign'}
            </p>
            <p className="text-[11px] text-purple-100">
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

              {/* Geofenced Daily Attendance & Work Hours Card */}
              <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/60 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-primary">
                      <Navigation className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-sm text-on-surface">Daily Attendance & Work Terminal</h4>
                      <p className="text-[11px] text-on-surface-variant">
                        Fixed Institutional Geofence: <strong>{activeInternship.geofence_radius}m</strong>
                      </p>
                    </div>
                  </div>

                  {isCheckedIn ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white"></span>
                      <span>Checked In ({activeDurationText})</span>
                    </span>
                  ) : isCheckedOut ? (
                    <span className="px-3 py-1 rounded-full bg-primary text-white text-xs font-bold flex items-center gap-1 shadow-sm">
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
                      Requires 300m GPS office geofence verification and enrolled Biometric Face ID matching.
                    </p>
                    <button
                      onClick={handleOpenCheckinModal}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-700 text-on-primary text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/20 transition-all active:scale-95"
                    >
                      <ScanFace className="w-4 h-4" />
                      <span>Geofenced Face Check-In</span>
                    </button>
                  </div>
                ) : isCheckedIn ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <div className="text-xs text-on-surface-variant">
                      <span>Shift started at: <strong>{new Date(todayCheckin.checkin_time).toLocaleTimeString()}</strong></span>
                      <span className="text-emerald-700 font-semibold ml-2">({todayCheckin.distance_meters}m from center)</span>
                    </div>
                    <button
                      onClick={handleOpenCheckoutModal}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all"
                    >
                      <ScanFace className="w-4 h-4" />
                      <span>Biometric Check Out & Log Hours</span>
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
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-primary flex items-center justify-center mx-auto border border-purple-100">
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
                  to="/student/self-placed"
                  className="px-5 py-2.5 rounded-xl bg-surface-container-high text-on-surface text-xs font-bold hover:bg-surface-container-highest flex items-center gap-2 transition-colors"
                >
                  <Building2 className="w-4 h-4 text-primary" />
                  <span>Report Self-Placed</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Quick Access & Actions */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-4">
            <h3 className="font-headline font-bold text-base text-on-surface">Quick Actions</h3>
            <div className="space-y-2.5">
              <Link
                to="/student/attendance"
                className="w-full p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center justify-between transition-colors border border-outline-variant/40"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-primary flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span>Attendance & Hours Log</span>
                </div>
                <ArrowRight className="w-4 h-4 text-outline" />
              </Link>

              <Link
                to="/student/tasks-reports"
                className="w-full p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center justify-between transition-colors border border-outline-variant/40"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span>Friday Weekly Report</span>
                </div>
                <ArrowRight className="w-4 h-4 text-outline" />
              </Link>

              <Link
                to="/student/documents"
                className="w-full p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center justify-between transition-colors border border-outline-variant/40"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span>Document Vault & Certs</span>
                </div>
                <ArrowRight className="w-4 h-4 text-outline" />
              </Link>
            </div>
          </div>

          {/* Institutional Compliance Notice */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50/50 rounded-3xl p-6 border border-purple-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-primary font-headline font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>GHR Inter-Track Policy</span>
            </div>
            <p className="text-xs text-on-surface leading-relaxed">
              Students can hold only <strong>1 active internship</strong> at a time. Daily check-in / check-out and weekly Friday logbook submissions are required for certificate issuance.
            </p>
          </div>
        </div>
      </div>

      {/* Check-Out & Daily Log Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-outline-variant/60 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="font-headline font-bold text-lg text-on-surface">Daily Check-Out & Work Log</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="p-1 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePerformCheckOut} className="space-y-4">
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
                  placeholder="e.g. Developed authentication middleware, tested REST API endpoints, attended daily engineering standup."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs focus:ring-2 focus:ring-primary outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-high"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProceedToBiometricCheckout}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white font-bold text-xs shadow-md shadow-primary/20 flex items-center gap-1.5 transition-all"
                >
                  <ScanFace className="w-4 h-4" />
                  <span>Verify Face & Check Out</span>
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
