import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Users,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Award,
  Loader2,
  Search,
  FileCheck,
  Clock,
  ShieldCheck
} from 'lucide-react';

const ActiveInternsPage = () => {
  const [interns, setInterns] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'certified'
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchInterns();
  }, []);

  const fetchInterns = async () => {
    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/faculty/assigned-interns', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInterns(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching interns:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeInterns = interns.filter((i) => i.status !== 'CERTIFICATE_ISSUED');
  const certifiedInterns = interns.filter((i) => i.status === 'CERTIFICATE_ISSUED');
  const currentTabInterns = activeTab === 'active' ? activeInterns : certifiedInterns;

  const filtered = currentTabInterns.filter(
    (i) =>
      i.student?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      i.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      i.student?.student_id?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Mentee Directory</span>
            <h1 className="font-headline font-black text-2xl sm:text-3xl text-on-surface tracking-tight mt-0.5">
              Interns Supervision Hub
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Supervise active industrial internships, attendance logs, weekly report reviews, and certified completions.
            </p>
          </div>
        </div>

        {/* 2 Tabs: Active vs Certified */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-outline-variant/40">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'active'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Active Interns</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/10 font-black">
              {activeInterns.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('certified')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'certified'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Certified Interns</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/10 font-black">
              {certifiedInterns.length}
            </span>
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-4 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${activeTab === 'active' ? 'active' : 'certified'} mentees by name, PRN, or company...`}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-outline-variant bg-surface-container-low text-xs font-medium text-on-surface focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Interns Table */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm">
        {filtered.length === 0 ? (
          <p className="text-xs text-on-surface-variant py-10 text-center">
            {activeTab === 'active'
              ? 'No active ongoing interns found matching search.'
              : 'No certified interns found matching search.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-outline-variant/60 text-on-surface-variant font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Student & PRN</th>
                  <th className="py-3 px-4">Company & Position</th>
                  <th className="py-3 px-4">Placement Type</th>
                  <th className="py-3 px-4 text-center">Reports Status</th>
                  <th className="py-3 px-4 text-center">GitHub Score</th>
                  <th className="py-3 px-4 text-center">Attendance Logs</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {filtered.map((intern) => (
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
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        {intern.placement_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold inline-flex items-center gap-1 border border-emerald-200/60">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{intern.reports_summary?.approved || 0} / {intern.reports_summary?.total_unlocked || intern.reports_summary?.total || 1} Approved</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-primary">
                      {intern.student?.github_score ? `${intern.student.github_score} pts` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-emerald-700">
                      {intern.attendance_count} Days Verified
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={intern.status} size="xs" />
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

export default ActiveInternsPage;
