import React, { useState, useEffect } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Building2,
  Calendar,
  FileText,
  UserCheck,
  Lock,
  Unlock,
  Loader2,
  X,
  Sparkles,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

const TnpDefaultersPage = () => {
  const [defaulters, setDefaulters] = useState([]);
  const [stats, setStats] = useState({ total: 0, restricted: 0, restored: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Re-enable Exemption Modal State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [exemptionRemarks, setExemptionRemarks] = useState('');
  const [reEnabling, setReEnabling] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');

  useEffect(() => {
    fetchDefaulters();
  }, []);

  const fetchDefaulters = async () => {
    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/tnp/defaulters', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDefaulters(data.defaulters || []);
        setStats({
          total: data.total_defaulters || 0,
          restricted: data.restricted_count || 0,
          restored: data.restored_count || 0
        });
      }
    } catch (err) {
      console.error('Error fetching defaulters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReEnableModal = (student) => {
    setSelectedStudent(student);
    setExemptionRemarks(`Special exemption approved by T&P Authority for candidate ${student.full_name} (${student.student_roll})`);
    setActionMsg('');
    setActionErr('');
  };

  const handleConfirmReEnable = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setReEnabling(true);
    setActionMsg('');
    setActionErr('');

    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch(`/api/tnp/defaulters/${selectedStudent.id}/re-enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ remarks: exemptionRemarks })
      });

      const data = await res.json();
      if (res.ok) {
        setActionMsg(data.message || `Placement access successfully restored for ${selectedStudent.full_name}!`);
        setSelectedStudent(null);
        fetchDefaulters();
      } else {
        setActionErr(data.error || 'Failed to re-enable placement access');
      }
    } catch {
      setActionErr('Network error restoring student placement access');
    } finally {
      setReEnabling(false);
    }
  };

  const filtered = defaulters.filter((d) => {
    const matchesSearch =
      d.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.student_roll?.toLowerCase().includes(search.toLowerCase()) ||
      d.branch?.toLowerCase().includes(search.toLowerCase()) ||
      d.rejected_company?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'RESTRICTED') return d.is_restricted;
    if (activeFilter === 'RESTORED') return !d.is_restricted;
    return true;
  });

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
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-800 text-xs font-bold border border-rose-200">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Placement Integrity & Offer Policy</span>
          </div>
          <h1 className="font-headline font-black text-2xl sm:text-3xl text-on-surface tracking-tight">
            Defaulters Management
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl">
            Review students whose placement drive access is restricted due to declining / rejecting official job offers. T&P Coordinators can review appeals and re-enable placement drive eligibility with 1 click.
          </p>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase">Total Offer Rejections</span>
          <p className="font-headline font-black text-2xl text-on-surface mt-1">{stats.total}</p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">Candidates who declined corporate offers</p>
        </div>

        <div className="p-5 rounded-3xl bg-rose-50/70 border border-rose-200 shadow-sm">
          <span className="text-[11px] font-bold text-rose-900 uppercase flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-rose-700" />
            <span>Placement Access Restricted</span>
          </span>
          <p className="font-headline font-black text-2xl text-rose-900 mt-1">{stats.restricted}</p>
          <p className="text-[11px] text-rose-800 mt-0.5">Currently barred from further placement drives</p>
        </div>

        <div className="p-5 rounded-3xl bg-emerald-50/70 border border-emerald-200 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-900 uppercase flex items-center gap-1.5">
            <Unlock className="w-3.5 h-3.5 text-emerald-700" />
            <span>Access Restored / Exempted</span>
          </span>
          <p className="font-headline font-black text-2xl text-emerald-900 mt-1">{stats.restored}</p>
          <p className="text-[11px] text-emerald-800 mt-0.5">Special exemptions granted by T&P Cell</p>
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {actionErr && (
        <div className="p-4 rounded-2xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{actionErr}</span>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/40 pb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-700" />
            <h2 className="font-headline font-bold text-base text-on-surface">Offer Rejection Defaulters Queue</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-[11px] font-bold text-on-surface-variant">
              {filtered.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidate, PRN, company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-1.5 rounded-xl border border-outline-variant bg-white text-xs text-on-surface focus:ring-2 focus:ring-primary outline-none w-64"
              />
            </div>

            <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant/60 text-xs font-bold">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-3 py-1 rounded-lg transition-colors ${activeFilter === 'ALL' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                All ({defaulters.length})
              </button>
              <button
                onClick={() => setActiveFilter('RESTRICTED')}
                className={`px-3 py-1 rounded-lg transition-colors ${activeFilter === 'RESTRICTED' ? 'bg-white shadow-sm text-rose-800' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Restricted ({stats.restricted})
              </button>
              <button
                onClick={() => setActiveFilter('RESTORED')}
                className={`px-3 py-1 rounded-lg transition-colors ${activeFilter === 'RESTORED' ? 'bg-white shadow-sm text-emerald-800' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Restored ({stats.restored})
              </button>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-surface-container-low/40 rounded-2xl border border-outline-variant/30 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="font-headline font-bold text-xs text-on-surface">No Defaulters in Queue</p>
            <p className="text-[11px] text-on-surface-variant">
              No students are currently flagged with unaddressed placement offer rejections.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-outline-variant/60 text-on-surface-variant font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Candidate & PRN</th>
                  <th className="py-3 px-4">Declined Offer Details</th>
                  <th className="py-3 px-4">Branch & CGPA</th>
                  <th className="py-3 px-4 text-center">Placement Access Status</th>
                  <th className="py-3 px-4 text-right">T&P Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {filtered.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3.5 px-4 font-bold text-on-surface">
                      <p className="text-sm font-headline">{item.full_name}</p>
                      <p className="text-[10px] text-on-surface-variant font-normal font-mono">{item.student_roll}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-rose-900 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-rose-700 flex-shrink-0" />
                        <span>{item.rejected_company}</span>
                      </p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        {item.rejected_role} • ₹{item.rejected_stipend ? Number(item.rejected_stipend).toLocaleString() : '50,000'}/mo
                      </p>
                      <p className="text-[10px] text-rose-800 font-mono mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-rose-600" />
                        <span>Declined on: {item.rejection_date ? new Date(item.rejection_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}</span>
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-medium text-on-surface">{item.branch}</p>
                      <span className="text-[11px] font-bold text-primary">CGPA: {item.current_cgpa || '8.0'}</span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {item.is_restricted ? (
                        <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-900 text-[11px] font-bold inline-flex items-center gap-1.5 shadow-sm border border-rose-200">
                          <Lock className="w-3 h-3 text-rose-700" />
                          <span>Access Restricted (Defaulter)</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-bold inline-flex items-center gap-1.5 shadow-sm border border-emerald-200">
                          <Unlock className="w-3 h-3 text-emerald-700" />
                          <span>Access Re-Enabled (Exempted)</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      {item.rejected_offer_url && (
                        <a
                          href={item.rejected_offer_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container-high text-[11px] font-bold inline-flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5 text-primary" />
                          <span>Offer PDF</span>
                        </a>
                      )}

                      {item.is_restricted ? (
                        <button
                          type="button"
                          onClick={() => handleOpenReEnableModal(item)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm inline-flex items-center gap-1.5 transition-all"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Re-enable Placement Access</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-800 font-semibold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Active Eligibility</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Re-enable Placement Access Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-outline-variant shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-surface-container-high px-6 py-4 border-b border-outline-variant/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Unlock className="w-5 h-5 text-emerald-700" />
                <h3 className="font-headline font-bold text-base text-on-surface">
                  Re-enable Placement Drive Access
                </h3>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-highest"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReEnable} className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                <p className="font-bold text-sm text-emerald-950">{selectedStudent.full_name} ({selectedStudent.student_roll})</p>
                <p className="text-[11px] text-emerald-900">{selectedStudent.branch} • CGPA: {selectedStudent.current_cgpa}</p>
                <p className="text-[11px] text-rose-800 font-semibold pt-1">
                  Declined Offer: {selectedStudent.rejected_company} — {selectedStudent.rejected_role}
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface uppercase mb-1">
                  Exemption Justification / Remarks *
                </label>
                <textarea
                  rows={3}
                  value={exemptionRemarks}
                  onChange={(e) => setExemptionRemarks(e.target.value)}
                  required
                  placeholder="Enter reason for restoring campus drive access (e.g. Higher tier drive eligibility exemption)..."
                  className="w-full p-3 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-outline-variant/40">
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="px-4 py-2 rounded-xl border border-outline-variant text-on-surface font-bold hover:bg-surface-container-low"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reEnabling || !exemptionRemarks.trim()}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold shadow-sm flex items-center gap-1.5"
                >
                  {reEnabling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Restoring Access...</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>Confirm & Re-enable Access</span>
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

export default TnpDefaultersPage;
