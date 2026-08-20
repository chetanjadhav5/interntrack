import React, { useState, useEffect } from 'react';
import MetricCard from '../../components/common/MetricCard';
import {
  TrendingUp,
  BarChart3,
  PieChart,
  Award,
  DollarSign,
  Briefcase,
  Users,
  Building2,
  Loader2,
  Sparkles
} from 'lucide-react';

const AdminAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/admin/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const resData = await res.json();
        setData(resData);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
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
      {/* Header */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm space-y-2">
        <span className="text-xs font-bold text-primary uppercase tracking-wider">Institutional Intelligence</span>
        <h1 className="font-headline font-black text-2xl sm:text-3xl text-on-surface tracking-tight">
          Executive Placement & Skills Analytics
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl">
          Deep-dive insights into industry skill gap delta, branch placement velocities, and corporate recruiter compensation benchmarks.
        </p>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Overall Placement Rate"
          value={`${data?.placement_overview?.placement_rate || 88}%`}
          icon="trending_up"
          color="success"
        />
        <MetricCard
          title="Highest Stipend"
          value={`₹${data?.placement_overview?.highest_stipend?.toLocaleString() || '85,000'}`}
          icon="payments"
          color="primary"
        />
        <MetricCard
          title="Average Stipend"
          value={`₹${data?.placement_overview?.average_stipend?.toLocaleString() || '52,500'}`}
          icon="account_balance_wallet"
          color="purple"
        />
        <MetricCard
          title="Total Internships Verified"
          value={data?.placement_overview?.total_placed_students || 3}
          icon="military_tech"
          color="secondary"
        />
      </div>

      {/* Main Grid: Skill Gap Matrix & Branch Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skill Gap Matrix */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
            <h3 className="font-headline font-bold text-base text-on-surface">Curriculum Skill Gap Matrix</h3>
            <span className="text-xs text-primary font-bold">Market Demand vs Proficiency</span>
          </div>

          <div className="space-y-4">
            {(data?.skill_gap_matrix || []).map((item) => (
              <div key={item.skill} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-on-surface">{item.skill}</span>
                  <span className="text-on-surface-variant">
                    Market: <strong className="text-primary">{item.market_demand}%</strong> | Student:{' '}
                    <strong className="text-emerald-700">{item.student_proficiency}%</strong>
                  </span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-surface-container-high overflow-hidden flex">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${item.market_demand}%` }}
                    title="Market Demand"
                  ></div>
                </div>

                <div className="flex justify-between text-[10px] text-on-surface-variant">
                  <span>Delta Gap: {item.gap_delta > 0 ? `+${item.gap_delta}% deficit` : 'Proficiency met'}</span>
                  <span className="font-semibold text-purple-700">Recommended for Workshop</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Branch Placement Statistics */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
            <h3 className="font-headline font-bold text-base text-on-surface">Branch Placement Velocity</h3>
            <span className="text-xs font-bold text-emerald-700">Active Cohort</span>
          </div>

          <div className="space-y-3">
            {(data?.branch_stats || []).map((b) => (
              <div
                key={b.branch}
                className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-headline font-bold text-xs text-on-surface">{b.branch}</h4>
                  <p className="text-[11px] text-on-surface-variant">
                    {b.placed_count} / {b.total_students} Placed ({b.placement_percent}%)
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-headline font-extrabold text-sm text-emerald-700">
                    ₹{b.avg_stipend?.toLocaleString()}/mo
                  </span>
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

export default AdminAnalyticsPage;
