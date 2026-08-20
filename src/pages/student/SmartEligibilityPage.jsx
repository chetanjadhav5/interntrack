import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  GraduationCap,
  Briefcase,
  Zap,
  Building2,
  MapPin,
  Loader2
} from 'lucide-react';

const SmartEligibilityPage = () => {
  const { driveId } = useParams();
  const navigate = useNavigate();

  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetchEligibility();
  }, [driveId]);

  const fetchEligibility = async () => {
    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch(`/api/student/drives/${driveId}/eligibility`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEligibility(data);
      }
    } catch (err) {
      console.error('Error fetching eligibility breakdown:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/student/applications/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ drive_id: driveId })
      });
      if (res.ok) {
        navigate('/student/applications');
      }
    } catch (err) {
      console.error('Apply error:', err);
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!eligibility) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-sm text-on-surface-variant">Drive eligibility data not available.</p>
        <Link to="/student/directory" className="text-primary font-bold text-xs hover:underline">
          Back to Company Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        to="/student/directory"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Company Directory</span>
      </Link>

      {/* Top Match Header Card */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Smart Eligibility Breakdown</span>
          <h1 className="font-headline font-black text-2xl text-on-surface tracking-tight">
            {eligibility.drive_title}
          </h1>
          <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-secondary" />
            {eligibility.company_name}
          </p>
        </div>

        {/* Overall Status Badge */}
        <div
          className={`px-5 py-3 rounded-2xl border text-center ${
            eligibility.is_eligible
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-sm'
              : 'bg-rose-50 text-rose-800 border-rose-200 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-1.5 font-headline font-black text-lg justify-center">
            {eligibility.is_eligible ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
            <span>{eligibility.is_eligible ? 'Eligible to Apply' : 'Criteria Not Met'}</span>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            {eligibility.is_eligible ? 'All prerequisites satisfied' : 'Review missing criteria below'}
          </p>
        </div>
      </div>

      {/* Criteria Breakdown Grid */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-5">
        <h2 className="font-headline font-bold text-base text-on-surface border-b border-outline-variant/40 pb-3">
          Detailed Criteria Assessment
        </h2>

        <div className="space-y-3">
          {/* CGPA Check */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-on-surface">Cumulative CGPA Requirement</span>
              <p className="text-[11px] text-on-surface-variant">
                Minimum Required: <strong>{eligibility.breakdown.cgpa.required}</strong> | Your CGPA: <strong>{eligibility.breakdown.cgpa.actual}</strong>
              </p>
            </div>
            {eligibility.breakdown.cgpa.passed ? (
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Met
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 text-rose-600" /> CGPA Below Criteria
              </span>
            )}
          </div>

          {/* Active Backlogs Check */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-on-surface">Active Backlogs Policy</span>
              <p className="text-[11px] text-on-surface-variant">
                Allowed Backlogs: <strong>{eligibility.breakdown.backlogs.allowed}</strong> | Current Backlogs: <strong>{eligibility.breakdown.backlogs.actual}</strong>
              </p>
            </div>
            {eligibility.breakdown.backlogs.passed ? (
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Met
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 text-rose-600" /> Backlog Limit Exceeded
              </span>
            )}
          </div>

          {/* Branch Check */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-on-surface">Department / Branch Eligibility</span>
              <p className="text-[11px] text-on-surface-variant">
                Your Branch: <strong>{eligibility.breakdown.branch.actual}</strong>
              </p>
            </div>
            {eligibility.breakdown.branch.passed ? (
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Branch Allowed
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 text-rose-600" /> Branch Not Listed
              </span>
            )}
          </div>

          {/* Profile 100% Verification Check */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-on-surface">Profile 100% & Class Teacher Verification</span>
              <p className="text-[11px] text-on-surface-variant">
                Completion: <strong>{eligibility.breakdown.profile_verification.completion}%</strong> | Status: <strong>{eligibility.breakdown.profile_verification.status}</strong>
              </p>
            </div>
            {eligibility.breakdown.profile_verification.passed ? (
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 100% Verified
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Verification Pending
              </span>
            )}
          </div>
        </div>

        {/* Skills Breakdown */}
        <div className="pt-3 border-t border-outline-variant/40 space-y-3">
          <h3 className="font-headline font-bold text-sm text-on-surface">Skills Compatibility</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Matched Skills */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Matched Skills ({eligibility.skills.matched.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {eligibility.skills.matched.length > 0 ? (
                  eligibility.skills.matched.map((s) => (
                    <span key={s} className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-on-surface-variant italic">No overlapping skills yet.</span>
                )}
              </div>
            </div>

            {/* Missing Skills */}
            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-2">
              <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-600" /> Missing Required Skills ({eligibility.skills.missing.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {eligibility.skills.missing.length > 0 ? (
                  eligibility.skills.missing.map((s) => (
                    <span key={s} className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-[11px] font-semibold">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-emerald-700 font-bold">All required skills present!</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="pt-4 flex items-center justify-between border-t border-outline-variant/40">
          <Link
            to="/student/profile"
            className="px-5 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold transition-colors"
          >
            Update Profile & Skills
          </Link>

          <button
            onClick={handleApply}
            disabled={!eligibility.is_eligible || applying}
            className="px-8 py-3 rounded-2xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-primary/30 flex items-center gap-2 transition-all"
          >
            {applying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting Application...</span>
              </>
            ) : (
              <>
                <span>Apply to Drive Now</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartEligibilityPage;
