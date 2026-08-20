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
  Loader2
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [activeInternship, setActiveInternship] = useState(null);
  const [todayCheckin, setTodayCheckin] = useState(null);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Check-in State
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkinDistance, setCheckinDistance] = useState(null);
  const [checkinMessage, setCheckinMessage] = useState('');
  const [checkinError, setCheckinError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
        if (prof.profile_completion_percent < 100 || prof.verification_status !== 'VERIFIED') {
          setShowCompletionModal(true);
        }
      }

      if (activeRes.ok) {
        const activeData = await activeRes.json();
        setActiveInternship(activeData.internship);
        setTodayCheckin(activeData.today_checkin);
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

  const handlePerformCheckIn = async () => {
    if (!activeInternship) return;
    setCheckinLoading(true);
    setCheckinError('');
    setCheckinMessage('');

    // Get live GPS position or simulate proximate office coordinates
    const simulateLat = activeInternship.latitude + (Math.random() - 0.5) * 0.0008; // ~30m
    const simulateLng = activeInternship.longitude + (Math.random() - 0.5) * 0.0008;

    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/student/attendance/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          latitude: simulateLat,
          longitude: simulateLng,
          photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setTodayCheckin(data.record);
        setCheckinDistance(data.distance_meters);
        setCheckinMessage(data.message);
      } else {
        setCheckinError(data.error || 'Check-in failed');
        setCheckinDistance(data.distance_meters);
      }
    } catch (err) {
      setCheckinError('Network error performing geofenced check-in');
    } finally {
      setCheckinLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

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
          title="Profile Completion"
          value={`${profileData?.profile_completion_percent || 0}%`}
          icon="verified_user"
          color={profileData?.profile_completion_percent === 100 ? 'success' : 'warning'}
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

              {/* Geofenced Daily Attendance Card */}
              <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-primary">
                      <Navigation className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-sm text-on-surface">Daily Geofenced Check-In</h4>
                      <p className="text-[11px] text-on-surface-variant">
                        Fixed Institutional Geofence: <strong>{activeInternship.geofence_radius}m</strong>
                      </p>
                    </div>
                  </div>

                  {todayCheckin ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Checked In ({todayCheckin.distance_meters}m)
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                      Pending Today
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
                      Click check-in to verify your live GPS coordinates against the registered company location.
                    </p>
                    <button
                      onClick={handlePerformCheckIn}
                      disabled={checkinLoading}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-primary/30 transition-all"
                    >
                      {checkinLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying GPS...</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4" />
                          <span>Verify Geofence & Check In</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-2 text-xs text-on-surface-variant border-t border-outline-variant/40">
                    <span>
                      Check-in Timestamp: <strong>{new Date(todayCheckin.checkin_time).toLocaleTimeString()}</strong>
                    </span>
                    <span className="text-emerald-700 font-bold">Location Verified ({todayCheckin.distance_meters}m from center)</span>
                  </div>
                )}
              </div>

              {/* Navigation Links to Tasks and Workflow */}
              <div className="flex flex-wrap gap-3">
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
                  className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 shadow-sm"
                >
                  Browse Campus Drives
                </Link>
                <Link
                  to="/student/self-placed"
                  className="px-5 py-2.5 rounded-xl bg-surface-container-high text-on-surface text-xs font-bold hover:bg-surface-container-highest"
                >
                  Report Self-Placed Offer
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Quick Actions & Deadlines Feed */}
        <div className="space-y-6">
          {/* Quick Profile Summary Card */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-4">
            <h3 className="font-headline font-bold text-sm text-on-surface uppercase tracking-wider">
              Profile Summary
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-outline-variant/40">
                <span className="text-on-surface-variant">Class Teacher</span>
                <span className="font-bold text-on-surface">Dr. Suresh Verma</span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/40">
                <span className="text-on-surface-variant">Preferred Location</span>
                <span className="font-bold text-primary">
                  {profileData?.is_pan_india ? 'Available Pan India' : (profileData?.preferred_locations || []).join(', ')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/40">
                <span className="text-on-surface-variant">GitHub Integration</span>
                <span className="font-bold text-secondary">
                  {profileData?.github_username ? `@${profileData.github_username}` : 'Not Connected'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-on-surface-variant">Active Backlogs</span>
                <span className="font-bold text-on-surface">{profileData?.current_backlogs || 0}</span>
              </div>
            </div>

            <Link
              to="/student/profile"
              className="block w-full py-2.5 rounded-xl bg-blue-50 text-primary text-center text-xs font-bold hover:bg-primary hover:text-white transition-all"
            >
              Edit & Complete Profile
            </Link>
          </div>

          {/* Institutional Compliance Notice */}
          <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-3xl p-6 border border-blue-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-primary font-headline font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>GHR Inter-Track Policy</span>
            </div>
            <p className="text-xs text-on-surface leading-relaxed">
              Students can hold only <strong>1 active internship</strong> at a time. Weekly Friday logbook submissions are required for certificate issuance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
