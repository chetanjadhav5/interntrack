import React, { useState, useEffect } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Award,
  ExternalLink,
  Loader2,
  ShieldCheck,
  MessageSquare,
  Search
} from 'lucide-react';

const ProfileVerificationPage = () => {
  const [data, setData] = useState({ counts: { pending: 0, verified: 0, rejected: 0 }, students: { pending: [], verified: [], rejected: [] } });
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verification Decision State
  const [decisionRemarks, setDecisionRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetchProfileVerifications();
  }, []);

  const fetchProfileVerifications = async () => {
    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/faculty/profile-verifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const resData = await res.json();
        setData(resData);
        if (resData.students.pending.length > 0 && !selectedStudent) {
          setSelectedStudent(resData.students.pending[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching verifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAction = async (decision) => {
    if (!selectedStudent) return;
    setActionLoading(true);
    setActionMessage('');
    setActionError('');

    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch(`/api/faculty/verify-profile/${selectedStudent.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          decision,
          remarks: decisionRemarks || (decision === 'VERIFIED' ? 'Approved all academic details.' : 'Correction required.')
        })
      });

      const resData = await res.json();
      if (res.ok) {
        setActionMessage(resData.message);
        setDecisionRemarks('');
        fetchProfileVerifications();
      } else {
        setActionError(resData.error || 'Verification action failed');
      }
    } catch {
      setActionError('Network error updating student profile');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  const currentList = data.students[activeTab] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Class Teacher Governance</span>
            <h1 className="font-headline font-black text-2xl sm:text-3xl text-on-surface tracking-tight mt-0.5">
              Student Profile Verification
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Verify academic CGPA, backlogs, skills, and industry certification proofs before unlocking drive applications.
            </p>
          </div>
        </div>

        {/* 2 Primary Tabs: Pending & Verified */}
        <div className="flex gap-2 pt-2 border-t border-outline-variant/40">
          <button
            onClick={() => {
              setActiveTab('pending');
              setSelectedStudent(data.students.pending[0] || null);
            }}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span>Pending Verification</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-black">
              {data.counts.pending}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('verified');
              setSelectedStudent(data.students.verified[0] || null);
            }}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'verified'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span>Verified Profiles</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-black">
              {data.counts.verified}
            </span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-2xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Grid: Student List vs Profile Detail Review Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Student Cards List (Scrollable Viewport) */}
        <div className="space-y-3 max-h-[calc(100vh-260px)] overflow-y-auto pr-2">
          {currentList.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-3xl p-8 text-center border border-outline-variant/60 text-xs text-on-surface-variant">
              No students in {activeTab} status.
            </div>
          ) : (
            currentList.map((student) => {
              const isSelected = selectedStudent?.id === student.id;
              return (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-50/80 border-emerald-600 shadow-sm ring-2 ring-emerald-600/20'
                      : 'bg-surface-container-lowest border-outline-variant/60 hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-headline font-bold text-xs text-on-surface">{student.full_name}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-primary">
                      CGPA: {student.current_cgpa}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">
                    {student.student_id} | {student.branch}
                  </p>
                  <p className="text-[10px] text-outline mt-1 font-medium">
                    Profile: {student.profile_completion_percent}% Complete
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Right 2 Columns: Detailed Credential Verification Drawer */}
        <div className="lg:col-span-2 sticky top-6">
          {selectedStudent ? (
            <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-5">
              <div className="flex items-start justify-between border-b border-outline-variant/40 pb-4">
                <div>
                  <h3 className="font-headline font-bold text-lg text-on-surface">{selectedStudent.full_name}</h3>
                  <p className="text-xs text-on-surface-variant">
                    PRN: <strong>{selectedStudent.student_id}</strong> | {selectedStudent.branch} (Passing Year: {selectedStudent.passing_year})
                  </p>
                </div>
                <StatusBadge status={selectedStudent.verification_status} />
              </div>

              {/* Academic Parameters */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-surface-container-low text-xs border border-outline-variant/60 text-center">
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase block">CGPA</span>
                  <span className="font-headline font-extrabold text-sm text-emerald-700">{selectedStudent.current_cgpa} / 10</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Live Backlogs</span>
                  <span className="font-headline font-extrabold text-sm text-on-surface">{selectedStudent.current_backlogs}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Gender</span>
                  <span className="font-headline font-extrabold text-sm text-on-surface">{selectedStudent.gender}</span>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Declared Technical Skills
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedStudent.skills || []).map((s) => (
                    <span key={s} className="px-2.5 py-1 rounded-lg bg-blue-50 text-primary border border-blue-200 text-xs font-semibold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Certifications Proof Review */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Industry Certifications & Proof
                </span>
                {selectedStudent.certifications && selectedStudent.certifications.length > 0 ? (
                  <div className="space-y-2">
                    {selectedStudent.certifications.map((c, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-emerald-600" />
                          <span className="font-bold text-on-surface">{c.name}</span>
                        </div>
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 rounded-lg bg-white border border-outline-variant text-primary hover:bg-blue-50 font-bold text-[11px] flex items-center gap-1 shadow-sm"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View Certificate PDF</span>
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-on-surface-variant italic">No certifications submitted.</p>
                )}
              </div>

              {/* Resume Review */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs font-bold text-on-surface">Student Resume Document</p>
                    <p className="text-[11px] text-on-surface-variant">Uploaded PDF for company drive screening</p>
                  </div>
                </div>
                <a
                  href={selectedStudent.resume_url || 'https://example.com/resume.pdf'}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-white border border-outline-variant text-primary hover:bg-blue-50 font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Inspect Resume</span>
                </a>
              </div>

              {/* Class Teacher Verification Form */}
              <div className="space-y-3 pt-3 border-t border-outline-variant/40">
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                  Class Teacher Remarks / Correction Feedback
                </label>
                <textarea
                  rows={2}
                  value={decisionRemarks}
                  onChange={(e) => setDecisionRemarks(e.target.value)}
                  placeholder="Optional remarks on approval, or mandatory explanation if requesting correction..."
                  className="w-full p-3 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-600 outline-none"
                ></textarea>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleVerifyAction('CORRECTION_REQUIRED')}
                    disabled={actionLoading}
                    className="px-5 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors"
                  >
                    Request Correction
                  </button>

                  <button
                    type="button"
                    onClick={() => handleVerifyAction('VERIFIED')}
                    disabled={actionLoading}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Verify & Approve Profile</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-3xl p-12 text-center border border-outline-variant/60 text-xs text-on-surface-variant">
              Select a student to review academic credentials and submit verification.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileVerificationPage;
