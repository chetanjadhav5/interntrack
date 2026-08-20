import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MetricCard from '../../components/common/MetricCard';
import StatusBadge from '../../components/common/StatusBadge';
import {
  ShieldAlert,
  Users,
  Building2,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Settings,
  Loader2
} from 'lucide-react';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminDashboard();
  }, []);

  const fetchAdminDashboard = async () => {
    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const resData = await res.json();
        setData(resData);
      }
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
    } finally {
      setLoading(false);
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
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-primary to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/20 text-[11px] font-bold uppercase tracking-wider">
                System Administration
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-100 text-[11px] font-bold uppercase tracking-wider">
                Platform Active
              </span>
            </div>
            <h1 className="font-headline font-black text-2xl sm:text-3xl tracking-tight mt-2">
              G H Raisoni Institutional Console
            </h1>
            <p className="text-xs text-blue-100 mt-1">
              Antigravity Multi-Role RBAC • Class Teacher Governance • Placement Lifecycle
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/approvals"
              className="px-5 py-2.5 rounded-2xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 shadow-md flex items-center gap-1.5 transition-all"
            >
              <span>Faculty Approvals & Roles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/admin/analytics"
              className="px-5 py-2.5 rounded-2xl bg-white/20 backdrop-blur-md text-white font-bold text-xs hover:bg-white/30 transition-all flex items-center gap-1.5"
            >
              <span>Institutional Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Total Registered Users"
          value={data?.stats?.total_users || 9}
          icon="manage_accounts"
          color="primary"
        />
        <MetricCard
          title="Active Drives"
          value={data?.stats?.active_drives || 2}
          icon="campaign"
          color="purple"
        />
        <MetricCard
          title="Active Internships"
          value={data?.stats?.active_internships || 2}
          icon="work"
          color="success"
        />
        <MetricCard
          title="Pending Staff Approvals"
          value={data?.stats?.pending_approvals || 0}
          icon="verified_user"
          color={data?.stats?.pending_approvals > 0 ? 'warning' : 'secondary'}
        />
      </div>

      {/* Main Grid: Pending Approvals Teaser vs Role Reassignment Teaser */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals Card */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
            <h3 className="font-headline font-bold text-base text-on-surface">Pending Faculty & T&P Approvals</h3>
            <Link to="/admin/approvals" className="text-xs font-bold text-primary hover:underline">
              View Approvals Hub
            </Link>
          </div>

          <p className="text-xs text-on-surface-variant leading-relaxed">
            Faculty and T&P accounts require super-admin verification before gaining access to student logbooks and placement management.
          </p>

          <Link
            to="/admin/approvals"
            className="inline-block px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 shadow-sm"
          >
            Review Pending Registrations
          </Link>
        </div>

        {/* Atomic Class Teacher Role Reassignment Card */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
            <h3 className="font-headline font-bold text-base text-on-surface">Class Teacher Role Governance</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              Atomic Transfer
            </span>
          </div>

          <p className="text-xs text-on-surface-variant leading-relaxed">
            Assign or transfer the official Class Teacher designation for any department and branch. All student queues and verification pipelines automatically re-route to the newly appointed account.
          </p>

          <Link
            to="/admin/approvals"
            className="inline-block px-5 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold"
          >
            Reassign Class Teacher Roles
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
