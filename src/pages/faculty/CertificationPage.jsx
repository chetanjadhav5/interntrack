import React, { useState, useEffect } from 'react';
import CertificateModal from '../../components/common/CertificateModal';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  GitBranch,
  ShieldCheck,
  Download,
  Loader2,
  Sparkles
} from 'lucide-react';

const CertificationPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [issuingId, setIssuingId] = useState(null);
  const [activeCertModal, setActiveCertModal] = useState(null);
  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/faculty/certification/candidates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
      }
    } catch (err) {
      console.error('Error fetching certification candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueCertificate = async (candidate) => {
    setIssuingId(candidate.internship_id);
    setActionMsg('');
    setActionErr('');

    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/faculty/certificates/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          internship_id: candidate.internship_id,
          final_score: candidate.auto_calculated_final_score,
          remarks: 'Approved final industrial internship performance by Faculty Mentor.'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setActionMsg(`Certificate ${data.certificate.certificate_number} successfully issued to ${candidate.student?.full_name}!`);
        fetchCandidates();
        setActiveCertModal({
          certificate: data.certificate,
          studentName: candidate.student?.full_name,
          companyName: candidate.company_name,
          rolePosition: candidate.role_position,
          score: data.certificate.final_score,
          certNumber: data.certificate.certificate_number,
          issueDate: data.certificate.issue_date
        });
      } else {
        setActionErr(data.error || 'Failed to issue certificate');
      }
    } catch {
      setActionErr('Network error issuing certificate');
    } finally {
      setIssuingId(null);
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
      {/* Certificate Modal Popup */}
      {activeCertModal && (
        <CertificateModal
          isOpen={Boolean(activeCertModal)}
          onClose={() => setActiveCertModal(null)}
          certificate={activeCertModal.certificate}
          studentName={activeCertModal.studentName}
          companyName={activeCertModal.companyName}
          rolePosition={activeCertModal.rolePosition}
          score={activeCertModal.score}
          certNumber={activeCertModal.certNumber}
          issueDate={activeCertModal.issueDate}
        />
      )}

      {/* Header */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm space-y-2">
        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Final Evaluation & Accreditation</span>
        <h1 className="font-headline font-black text-2xl sm:text-3xl text-on-surface tracking-tight">
          Certification Module
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl">
          Auto-calculates composite final internship scores from verified academic profiles, weekly mentor logbook ratings, and GitHub code activity.
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

      {/* Candidates Grid */}
      {candidates.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl p-12 text-center border border-outline-variant/60 space-y-3">
          <p className="text-xs text-on-surface-variant">No candidates currently enrolled in mentorship.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {candidates.map((cand) => (
            <div
              key={cand.internship_id}
              className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm hover:shadow-card-hover transition-all flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                      {cand.company_name}
                    </span>
                    <h3 className="font-headline font-bold text-lg text-on-surface mt-0.5">
                      {cand.student?.full_name}
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      PRN: <strong>{cand.student?.student_id}</strong> | {cand.role_position}
                    </p>
                  </div>
                  {cand.certificate_issued ? (
                    <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Certificate Issued
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                      Evaluation Ready
                    </span>
                  )}
                </div>

                {/* Performance Breakdown Matrix */}
                <div className="grid grid-cols-3 gap-2 p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/60 text-center text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Profile Status</span>
                    <span
                      className={`font-bold text-[11px] ${
                        cand.student?.verification_status === 'VERIFIED' ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {cand.student?.verification_status}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Weekly Reports</span>
                    <span className="font-headline font-extrabold text-on-surface">
                      {cand.evaluated_reports_count} Submitted ({cand.avg_report_score}%)
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase block">GitHub Score</span>
                    <span className="font-headline font-extrabold text-secondary">
                      {cand.github_score} pts
                    </span>
                  </div>
                </div>

                {/* Auto-Calculated Final Score Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">
                      Auto-Calculated Final Score
                    </span>
                    <p className="text-xs text-on-surface-variant">Weighted: (70% Logbook + 30% GitHub)</p>
                  </div>
                  <span className="font-headline font-black text-2xl text-primary">
                    {cand.auto_calculated_final_score}%
                  </span>
                </div>
              </div>

              {/* Action Button */}
              {cand.certificate_issued ? (
                <button
                  type="button"
                  onClick={() =>
                    setActiveCertModal({
                      certificate: cand.certificate,
                      studentName: cand.student?.full_name,
                      companyName: cand.company_name,
                      rolePosition: cand.role_position,
                      score: cand.auto_calculated_final_score,
                      certNumber: cand.certificate?.certificate_number,
                      issueDate: cand.certificate?.issue_date
                    })
                  }
                  className="w-full py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Award className="w-4 h-4 text-purple-600" />
                  <span>View Issued Certificate & QR Code</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleIssueCertificate(cand)}
                  disabled={!cand.is_eligible_for_certificate || issuingId === cand.internship_id}
                  className="w-full py-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all"
                >
                  {issuingId === cand.internship_id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Digital Certificate...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Approve and Issue Certificate</span>
                    </>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CertificationPage;
