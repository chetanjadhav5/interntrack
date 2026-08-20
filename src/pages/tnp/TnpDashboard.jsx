import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MetricCard from '../../components/common/MetricCard';
import {
  Briefcase,
  Users,
  Building2,
  TrendingUp,
  Award,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  PieChart,
  Loader2
} from 'lucide-react';

const TnpDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTnpDashboard();
  }, []);

  const fetchTnpDashboard = async () => {
    try {
      const token = localStorage.getItem('ghr_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [dashRes, analRes] = await Promise.all([
        fetch('/api/tnp/dashboard', { headers }),
        fetch('/api/tnp/analytics', { headers })
      ]);

      if (dashRes.ok) setData(await dashRes.json());
      if (analRes.ok) setAnalytics(await analRes.json());
    } catch (err) {
      console.error('Error loading T&P dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-primary rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/20 text-[11px] font-bold uppercase tracking-wider">
                Training & Placement Cell
              </span>
              <span className="px-3 py-1 rounded-full bg-purple-400/20 text-purple-100 text-[11px] font-bold uppercase tracking-wider">
                {user?.profile?.department || 'Department of Engineering'}
              </span>
            </div>
            <h1 className="font-headline font-black text-2xl sm:text-3xl tracking-tight mt-2">
              {user?.profile?.full_name || 'T&P Coordinator'}
            </h1>
            <p className="text-xs text-purple-100 mt-1">
              Employee ID: <strong>{user?.profile?.employee_id || 'GHR-TNP-004'}</strong> | Department-Scoped Governance
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/tnp/verification"
              className="px-5 py-2.5 rounded-2xl bg-white text-purple-900 font-bold text-xs hover:bg-purple-50 shadow-md flex items-center gap-1.5 transition-all"
            >
              <span>Offer Verification Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/tnp/drives"
              className="px-5 py-2.5 rounded-2xl bg-white/20 backdrop-blur-md text-white font-bold text-xs hover:bg-white/30 transition-all flex items-center gap-1.5"
            >
              <span>Manage Postings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Total Department Students"
          value={data?.stats?.total_students || 3}
          icon="badge"
          color="primary"
        />
        <MetricCard
          title="Active Internships"
          value={data?.stats?.active_internships || 2}
          icon="work"
          color="success"
        />
        <MetricCard
          title="Pending Offer Verifications"
          value={data?.stats?.pending_verifications || 0}
          icon="verified"
          color={data?.stats?.pending_verifications > 0 ? 'warning' : 'purple'}
        />
        <MetricCard
          title="Placement Rate"
          value={`${analytics?.placement_rate || 87}%`}
          icon="trending_up"
          color="secondary"
        />
      </div>

      {/* Analytics Insights: Stipend Distribution & Top Recruiters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stipends Metrics */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
            <h3 className="font-headline font-bold text-base text-on-surface">Compensation Analytics</h3>
            <span className="text-xs font-bold text-purple-700">Monthly INR</span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-surface-container-low flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface-variant">Highest Monthly Stipend</span>
              <span className="font-headline font-extrabold text-sm text-emerald-700">
                ₹{analytics?.stipends?.highest?.toLocaleString() || '85,000'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-container-low flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface-variant">Average Monthly Stipend</span>
              <span className="font-headline font-extrabold text-sm text-primary">
                ₹{analytics?.stipends?.average?.toLocaleString() || '54,000'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-container-low flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface-variant">Lowest Monthly Stipend</span>
              <span className="font-headline font-extrabold text-sm text-on-surface">
                ₹{analytics?.stipends?.lowest?.toLocaleString() || '25,000'}
              </span>
            </div>
          </div>
        </div>

        {/* Top Hiring Corporate Partners */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
            <h3 className="font-headline font-bold text-base text-on-surface">Top Recruiting Partners</h3>
            <Link to="/tnp/drives" className="text-xs font-bold text-purple-700 hover:underline">
              View All Campus Drives
            </Link>
          </div>

          <div className="space-y-3">
            {(analytics?.top_hiring_companies || []).map((comp, idx) => (
              <div
                key={comp.name}
                className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 font-bold flex items-center justify-center text-xs">
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="font-headline font-bold text-xs text-on-surface">{comp.name}</h4>
                    <p className="text-[11px] text-on-surface-variant">{comp.count} Students Selected</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-700">₹{comp.avg_stipend.toLocaleString()}/mo</span>
                  <span className="text-[10px] text-outline block">Avg Stipend</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TnpDashboard;
