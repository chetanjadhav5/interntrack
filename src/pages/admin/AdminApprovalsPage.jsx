import React, { useState, useEffect } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Users,
  UserCheck,
  Building2,
  RefreshCw,
  Loader2,
  ArrowRight
} from 'lucide-react';

const AdminApprovalsPage = () => {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Role Reassignment Form State
  const [selectedDept, setSelectedDept] = useState('Engineering');
  const [selectedBranch, setSelectedBranch] = useState('Computer Science and Engineering');
  const [selectedYear, setSelectedYear] = useState('3rd Year (2026)');
  const [targetFacultyId, setTargetFacultyId] = useState('user_faculty_ct_1');

  const [approvingId, setApprovingId] = useState(null);
  const [reassigning, setReassigning] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');

  useEffect(() => {
    fetchApprovalsAndFaculty();
  }, []);

  const fetchApprovalsAndFaculty = async () => {
    try {
      const token = localStorage.getItem('ghr_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [pendingRes, facultyRes] = await Promise.all([
        fetch('/api/admin/pending-approvals', { headers }),
        fetch('/api/admin/faculty', { headers })
      ]);

      if (pendingRes.ok) {
        const pendingData = await pendingRes.json();
        setPendingApprovals(Array.isArray(pendingData) ? pendingData : []);
      }
      if (facultyRes.ok) {
        const facData = await facultyRes.json();
        const list = Array.isArray(facData) ? facData : [];
        setFacultyList(list);
        if (list.length > 0 && !targetFacultyId) {
          setTargetFacultyId(list[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading approvals data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId, decision) => {
    setApprovingId(userId);
    setActionMsg('');
    setActionErr('');

    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch(`/api/admin/users/${userId}/approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ decision })
      });

      const data = await res.json();
      if (res.ok) {
        setActionMsg(data.message);
        fetchApprovalsAndFaculty();
      } else {
        setActionErr(data.error || 'Approval action failed');
      }
    } catch {
      setActionErr('Network error processing approval');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReassignClassTeacher = async (e) => {
    e.preventDefault();
    if (!targetFacultyId) return;

    setReassigning(true);
    setActionMsg('');
    setActionErr('');

    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/admin/faculty/reassign-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          faculty_id: targetFacultyId,
          new_role: 'CLASS_TEACHER',
          department: selectedDept,
          branch: selectedBranch,
          assigned_year: selectedYear
        })
      });

      const data = await res.json();
      if (res.ok) {
        setActionMsg(data.message);
        fetchApprovalsAndFaculty();
      } else {
        setActionErr(data.error || 'Failed to reassign Class Teacher role');
      }
    } catch {
      setActionErr('Network error reassigning role');
    } finally {
      setReassigning(false);
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
        <span className="text-xs font-bold text-primary uppercase tracking-wider">Access Governance</span>
        <h1 className="font-headline font-black text-2xl sm:text-3xl text-on-surface tracking-tight">
          Admin Approvals & Role Reassignment
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl">
          Approve pending Faculty, T&P, and Company recruiter registrations, and manage atomic Class Teacher role transfers across institutional departments.
        </p>
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

      {/* Section 1: Pending Faculty, T&P & Company Registrations */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            <h2 className="font-headline font-bold text-base text-on-surface">
              Pending Faculty, T&P & Company Registration Approvals
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-100 text-primary text-xs font-bold">
            {pendingApprovals.length} Pending
          </span>
        </div>

        {pendingApprovals.length === 0 ? (
          <p className="text-xs text-on-surface-variant py-6 text-center">
            No registration requests currently pending admin approval.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-outline-variant/60 text-on-surface-variant uppercase text-[10px] font-bold">
                  <th className="py-3 px-4">Applicant & Email</th>
                  <th className="py-3 px-4">Role & ID / GSTIN</th>
                  <th className="py-3 px-4">Department / Industry</th>
                  <th className="py-3 px-4 text-right">Approval Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {pendingApprovals.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-container-low">
                    <td className="py-3.5 px-4 font-bold text-on-surface">
                      <p>{user.full_name}</p>
                      <p className="text-[10px] text-on-surface-variant font-normal">{user.email}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        user.role === 'COMPANY' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-primary'
                      }`}>
                        {user.role}
                      </span>
                      <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">{user.employee_id}</p>
                    </td>
                    <td className="py-3.5 px-4 text-on-surface">
                      {user.department} {user.branch ? `— ${user.branch}` : ''}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleApproveUser(user.id, 'REJECTED')}
                        disabled={approvingId === user.id}
                        className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-[11px]"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproveUser(user.id, 'APPROVED')}
                        disabled={approvingId === user.id}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm"
                      >
                        {approvingId === user.id ? 'Processing...' : `Approve ${user.role === 'COMPANY' ? 'Company' : 'Account'}`}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: Atomic Class Teacher Role Transfer */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-secondary" />
            <div>
              <h2 className="font-headline font-bold text-base text-on-surface">
                Atomic Class Teacher Role Reassignment
              </h2>
              <p className="text-[11px] text-on-surface-variant">
                Reassigning instantly transfers all students and verification queues to the new Class Teacher.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            Zero Downtime Migration
          </span>
        </div>

        <form onSubmit={handleReassignClassTeacher} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Department
              </label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="Engineering">Department of Engineering</option>
                <option value="Management">Department of Management</option>
                <option value="Computer Applications">Department of Computer Applications</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Branch / Specialization
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="Computer Science and Engineering">Computer Science and Engineering</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics and Telecommunication">Electronics and Telecommunication</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Academic Cohort Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="3rd Year (2026)">3rd Year (2026 Cohort)</option>
                <option value="4th Year (2025)">4th Year (2025 Cohort)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Assign New Class Teacher
              </label>
              <select
                value={targetFacultyId}
                onChange={(e) => setTargetFacultyId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-bold text-primary focus:ring-2 focus:ring-primary outline-none"
              >
                {facultyList.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.current_designation})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] text-on-surface-variant">
              Previous Class Teacher will be restored to Mentor designation.
            </p>
            <button
              type="submit"
              disabled={reassigning}
              className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 shadow-md flex items-center gap-1.5 transition-all"
            >
              {reassigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span>Execute Atomic Transfer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminApprovalsPage;
