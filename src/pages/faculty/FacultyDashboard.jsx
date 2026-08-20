import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MetricCard from '../../components/common/MetricCard';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Users,
  FileCheck,
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Loader2
} from 'lucide-react';

const FacultyDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [assignedInterns, setAssignedInterns] = useState([]);
  const [loading, setLoading] = useState(true);

  const isClassTeacher = user?.profile?.designation === 'CLASS_TEACHER';

  useEffect(() => {
    fetchFacultyData();
  }, []);

  const fetchFacultyData = async () => {
    try {
      const token = localStorage.getItem('ghr_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [dashRes, internsRes] = await Promise.all([
        fetch('/api/faculty/dashboard', { headers }),
        fetch('/api/faculty/assigned-interns', { headers })
      ]);

      if (dashRes.ok) setData(await dashRes.json());
      if (internsRes.ok) setAssignedInterns(await internsRes.json());
    } catch (err) {
      console.error('Error fetching faculty dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-primary-container rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/20 text-[11px] font-bold uppercase tracking-wider">
                {isClassTeacher ? 'Class Teacher & Mentor' : 'Faculty Mentor'}
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-100 text-[11px] font-bold uppercase tracking-wider">
                {user?.profile?.branch || 'Computer Engineering'}
              </span>
            </div>
            <h1 className="font-headline font-black text-2xl sm:text-3xl tracking-tight mt-2">
              {user?.profile?.full_name || 'Faculty Member'}
            </h1>
            <p className="text-xs text-emerald-100 mt-1">
              Employee ID: <strong>{user?.profile?.employee_id}</strong> | Academic Year: <strong>{user?.profile?.assigned_year || '2026'}</strong>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {isClassTeacher && (
              <Link
                to="/faculty/profile-verification"
                className="px-5 py-2.5 rounded-2xl bg-white text-emerald-800 font-bold text-xs hover:bg-emerald-50 shadow-md flex items-center gap-1.5 transition-all"
              >
                <span>Verify Student Profiles</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
            <Link
              to="/faculty/weekly-reports"
              className="px-5 py-2.5 rounded-2xl bg-white/20 backdrop-blur-md text-white font-bold text-xs hover:bg-white/30 transition-all flex items-center gap-1.5"
            >
              <span>Weekly Reports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <MetricCard
          title="Assigned Mentees"
          value={data?.stats?.assigned_mentees || assignedInterns.length}
          icon="group"
          color="success"
        />
        <MetricCard
          title="Pending Weekly Reports"
          value={data?.stats?.pending_reports || 0}
          icon="rate_review"
          color={data?.stats?.pending_reports > 0 ? 'warning' : 'primary'}
        />
        {isClassTeacher ? (
          <MetricCard
            title="Profiles Pending Verification"
            value={data?.stats?.pending_profiles_to_verify || 0}
            icon="verified_user"
            color={data?.stats?.pending_profiles_to_verify > 0 ? 'warning' : 'success'}
          />
        ) : (
          <MetricCard
            title="Certificates Issued"
            value={assignedInterns.filter((i) => i.status === 'CERTIFICATE_ISSUED').length}
            icon="military_tech"
            color="purple"
          />
        )}
      </div>

      {/* Assigned Interns Table */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
          <div>
            <h2 className="font-headline font-bold text-base text-on-surface">Assigned Student Mentees</h2>
            <p className="text-xs text-on-surface-variant">Live weekly progress, check-in health, and scoring.</p>
          </div>
          <Link
            to="/faculty/interns"
            className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
          >
            <span>View Full Table</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {assignedInterns.length === 0 ? (
          <p className="text-xs text-on-surface-variant py-8 text-center">No assigned mentees found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-outline-variant/60 text-on-surface-variant font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Organization & Role</th>
                  <th className="py-3 px-4">Placement Type</th>
                  <th className="py-3 px-4 text-center">Reports Status</th>
                  <th className="py-3 px-4 text-center">Attendance Logs</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {assignedInterns.map((intern) => (
                  <tr key={intern.internship_id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3.5 px-4 font-bold text-on-surface">
                      <p>{intern.student?.full_name}</p>
                      <p className="text-[10px] text-on-surface-variant font-normal">{intern.student?.student_id}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-on-surface">{intern.company_name}</p>
                      <p className="text-[10px] text-on-surface-variant">{intern.role_position}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          intern.placement_type === 'SELF_PLACED'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {intern.placement_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold inline-flex items-center gap-1 border border-emerald-200/60">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{intern.reports_summary?.approved || 0} / {intern.reports_summary?.total_unlocked || intern.reports_summary?.total || 1} Approved</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-emerald-700">
                      {intern.attendance_count} Days Logged
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/faculty/weekly-reports?student_id=${intern.student_id || intern.student?.id}&student_name=${encodeURIComponent(intern.student?.full_name || '')}&internship_id=${intern.internship_id}`}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] transition-colors"
                      >
                        Review Reports
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyDashboard;
