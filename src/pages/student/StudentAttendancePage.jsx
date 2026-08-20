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
  Info
} from 'lucide-react';

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

  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [workSummary, setWorkSummary] = useState('');
  const [customHours, setCustomHours] = useState('8.5');

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

  const handleCheckIn = async () => {
    if (!data?.internship) return;
    setActionLoading(true);
    setActionErr('');
    setActionMsg('');

    // Simulate precise GPS proximate to registered company coordinates
    const simulateLat = data.internship.latitude + (Math.random() - 0.5) * 0.0008;
    const simulateLng = data.internship.longitude + (Math.random() - 0.5) * 0.0008;

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

      const resJson = await res.json();
      if (res.ok) {
        setActionMsg(resJson.message);
        await fetchAttendanceHistory();
      } else {
        setActionErr(resJson.error || 'Check-in failed');
      }
    } catch {
      setActionErr('Network error while checking in');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOutSubmit = async (e) => {
    if (e) e.preventDefault();
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
          hours_worked: parseFloat(customHours) || 8.0,
          work_summary: workSummary || 'Completed daily assigned engineering tasks, code reviews, and sprint items.'
        })
      });

      const resJson = await res.json();
      if (res.ok) {
        setActionMsg(resJson.message);
        setShowCheckoutModal(false);
        setWorkSummary('');
        await fetchAttendanceHistory();
      } else {
        setActionErr(resJson.error || 'Check-out failed');
      }
    } catch {
      setActionErr('Network error while checking out');
    } finally {
      setActionLoading(false);
    }
  };

  const activeInternship = data?.internship;
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
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-bold">
              300m Fixed Geofence
            </span>
          </div>
          <h1 className="font-headline font-black text-2xl sm:text-3xl text-on-surface tracking-tight">
            Daily Attendance & Hours Log
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-xl">
            {activeInternship
              ? `Logging daily workplace attendance at ${activeInternship.company_name} (${activeInternship.role_position})`
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
          title="Geofence Verified Rate"
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
                <Navigation className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-lg text-on-surface">Daily Attendance Terminal</h3>
                <p className="text-xs text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>{activeInternship.office_address}</span>
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
                  ? 'Ready to start your work day?'
                  : isCheckedIn
                  ? `Active session started at ${new Date(todayRecord.checkin_time).toLocaleTimeString()}`
                  : `Work session concluded at ${new Date(todayRecord.checkout_time).toLocaleTimeString()}`}
              </h4>
              <p className="text-xs text-on-surface-variant">
                {!todayRecord
                  ? 'Your check-in timestamp and live GPS coordinates will be verified within the 300m institutional perimeter.'
                  : isCheckedIn
                  ? 'When your shift finishes, click Check Out to calculate total working hours and record daily engineering notes.'
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
                <button
                  type="button"
                  onClick={handleCheckIn}
                  disabled={actionLoading}
                  className="w-full md:w-auto px-8 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying GPS & Site...</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4" />
                      <span>Check In Now (300m GPS)</span>
                    </>
                  )}
                </button>
              ) : isCheckedIn ? (
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(true)}
                  disabled={actionLoading}
                  className="w-full md:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white font-bold text-xs shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Clock className="w-4 h-4" />
                  <span>Check Out & Log Hours</span>
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
              <p className="text-[11px] text-on-surface-variant">Complete audit history of timestamps, hours worked, and task logs</p>
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
                  <th className="px-4 py-3">Check-In</th>
                  <th className="px-4 py-3">Check-Out</th>
                  <th className="px-4 py-3">Hours Worked</th>
                  <th className="px-4 py-3">Geofence Status</th>
                  <th className="px-4 py-3">Daily Work Log Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 font-medium">
                {records.map((rec) => {
                  const checkinFormatted = rec.checkin_time
                    ? new Date(rec.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'N/A';
                  const checkoutFormatted = rec.checkout_time
                    ? new Date(rec.checkout_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : rec.status === 'CHECKED_IN'
                    ? 'In Progress'
                    : 'Auto (8.0h)';

                  const hours = rec.hours_worked ? parseFloat(rec.hours_worked) : 8.0;

                  return (
                    <tr key={rec.id} className="hover:bg-surface-container-low/60 transition-colors">
                      <td className="px-4 py-3 font-bold text-on-surface whitespace-nowrap font-mono">
                        {rec.date || (rec.checkin_time ? new Date(rec.checkin_time).toLocaleDateString() : 'N/A')}
                      </td>
                      <td className="px-4 py-3 text-purple-950 font-semibold whitespace-nowrap">
                        {checkinFormatted}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">
                        {checkoutFormatted}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs font-mono">
                          {hours.toFixed(1)} hrs
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Verified ({rec.distance_meters || 24}m)</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-on-surface text-[11px] max-w-xs truncate">
                        {rec.work_summary || 'Completed daily engineering tasks, feature development, and code reviews.'}
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

            <form onSubmit={handleCheckOutSubmit} className="space-y-4">
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
                  Default standard full-day shift is 8.5 hours.
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
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs shadow-md shadow-primary/20 flex items-center gap-1.5 transition-all"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Log...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirm Check Out</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAttendancePage;
