import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MetricCard from '../../components/common/MetricCard';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Building2,
  Briefcase,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  Upload,
  Calendar,
  Loader2,
  Sparkles,
  Layers,
  GraduationCap,
  Award
} from 'lucide-react';

const CompanyDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanyDashboard();
  }, []);

  const fetchCompanyDashboard = async () => {
    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/company/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const resData = await res.json();
        setData(resData);
      }
    } catch (err) {
      console.error('Error loading company dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  const drivesList = data?.drives || [];
  const recentApplicants = data?.recent_applicants || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-orange-700 to-amber-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/20 text-[11px] font-bold uppercase tracking-wider">
                Recruiter Portal
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-100 text-[11px] font-bold uppercase tracking-wider">
                {user?.profile?.industry || 'Information Technology'}
              </span>
            </div>
            <h1 className="font-headline font-black text-2xl sm:text-3xl tracking-tight mt-2">
              {user?.profile?.company_name || 'Partner Organization'}
            </h1>
            <p className="text-xs text-amber-100 mt-1">
              GSTIN: <strong>{user?.profile?.gstin || '27AAACG0535P1Z8'}</strong> | Campus Hiring & Internships Hub
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/company/drives"
              className="px-5 py-2.5 rounded-2xl bg-white text-amber-900 font-bold text-xs hover:bg-amber-50 shadow-md flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Post Campus Drive</span>
            </Link>
            <Link
              to="/company/selected-students"
              className="px-5 py-2.5 rounded-2xl bg-white/20 backdrop-blur-md text-white font-bold text-xs hover:bg-white/30 transition-all flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              <span>Selected Students & Offers</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Active Campus Drives"
          value={data?.stats?.active_drives || 0}
          icon="campaign"
          color="primary"
        />
        <MetricCard
          title="Total Candidate Applications"
          value={data?.stats?.total_applicants || 0}
          icon="groups"
          color="purple"
        />
        <MetricCard
          title="Selected Students"
          value={data?.stats?.selected_students || 0}
          icon="how_to_reg"
          color="success"
        />
        <MetricCard
          title="Active Interns"
          value={data?.stats?.active_interns || 0}
          icon="engineering"
          color="warning"
        />
      </div>

      {/* Main Grid: Posted Drives vs Recent Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Drives Preview */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-amber-700" />
              <h3 className="font-headline font-bold text-base text-on-surface">Active Campus Drives</h3>
            </div>
            <Link to="/company/drives" className="text-xs font-bold text-amber-700 hover:underline">
              View All ({drivesList.length})
            </Link>
          </div>

          {drivesList.length === 0 ? (
            <div className="p-8 text-center bg-surface-container-low rounded-2xl border border-outline-variant/40 space-y-3">
              <Layers className="w-8 h-8 text-on-surface-variant/60 mx-auto" />
              <div>
                <p className="font-bold text-xs text-on-surface">No Campus Drives Posted Yet</p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  Create your first recruitment posting to start receiving eligible student applications.
                </p>
              </div>
              <Link
                to="/company/drives"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-700 text-white font-bold text-xs shadow-sm hover:bg-amber-800"
              >
                <Plus className="w-4 h-4" />
                <span>Create Campus Drive</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {drivesList.map((drive) => (
                <div
                  key={drive.id}
                  className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 hover:bg-surface-container-high transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-headline font-bold text-xs text-on-surface">{drive.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        drive.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        {drive.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant">
                      {drive.role_position} • ₹{drive.stipend_amount ? drive.stipend_amount.toLocaleString() : '0'}/mo
                    </p>
                    <div className="flex items-center gap-3 text-[10px] font-semibold text-on-surface-variant pt-1">
                      <span className="text-primary font-bold">
                        👥 {drive.applicants_count || 0} Applied
                      </span>
                      <span className="text-emerald-700 font-bold">
                        ✓ {drive.selected_count || 0} Selected
                      </span>
                      <span>
                        🎯 {drive.openings_count || 1} Openings
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/company/drives/${drive.id}/applicants`}
                    className="px-3.5 py-2 rounded-xl bg-white border border-outline-variant text-amber-900 hover:bg-amber-50 font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-colors flex-shrink-0"
                  >
                    <span>Manage Pipeline</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-700" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Candidate Applications & Quick Links */}
        <div className="space-y-6">
          {/* Selected Candidates & Offer Letters Card */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-700" />
                <h3 className="font-headline font-bold text-base text-on-surface">Selected Candidates & Offer Letters</h3>
              </div>
              <Link to="/company/selected-students" className="text-xs font-bold text-amber-700 hover:underline">
                Manage Offers
              </Link>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-amber-100/30 border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <Upload className="w-4 h-4 text-amber-700" />
                  <span>Bulk Offer Letters Dispatch Engine</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-700 text-white font-bold text-[10px]">
                  {data?.stats?.selected_students || 0} Selected
                </span>
              </div>
              <p className="text-xs text-amber-950 leading-relaxed">
                Set mandatory internship tenure dates (`start_date` to `end_date`), calculate Friday logbook schedules, and batch upload PDF offer letters with automatic Student PRN matching.
              </p>
              <div className="flex gap-2 pt-1">
                <Link
                  to="/company/selected-students"
                  className="px-4 py-2 rounded-xl bg-amber-700 text-white font-bold text-xs hover:bg-amber-800 shadow-sm flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Issue Offer Letters</span>
                </Link>
                <Link
                  to="/company/evaluation"
                  className="px-4 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold text-xs hover:bg-amber-50 shadow-sm flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5 text-amber-700" />
                  <span>Intern Evaluation & PPO</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Candidates List */}
          {recentApplicants.length > 0 && (
            <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
                <h4 className="font-headline font-bold text-xs text-on-surface">Recent Candidate Applications</h4>
                <span className="text-[11px] text-on-surface-variant font-medium">Pipeline Snapshot</span>
              </div>

              <div className="divide-y divide-outline-variant/30">
                {recentApplicants.map((app) => (
                  <div key={app.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-on-surface">{app.student_name}</p>
                      <p className="text-[10px] text-on-surface-variant">{app.student_roll} • {app.branch}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-bold text-[10px]">
                        {app.current_stage}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
