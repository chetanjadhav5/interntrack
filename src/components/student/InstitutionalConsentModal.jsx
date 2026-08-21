import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCheck2,
  Building2,
  Calendar,
  Lock,
  ArrowRight,
  Loader2,
  Info,
  Scale
} from 'lucide-react';

const InstitutionalConsentModal = ({
  isOpen,
  onClose,
  onConfirm,
  drive,
  student,
  loading,
  error = '',
  reasons = []
}) => {
  const [hasAgreed, setHasAgreed] = useState(false);
  const [acknowledgedPoints, setAcknowledgedPoints] = useState({
    conversionRule: false,
    singleOfferPolicy: false,
    tpGovernance: false
  });

  useEffect(() => {
    if (isOpen) {
      setHasAgreed(false);
      setAcknowledgedPoints({
        conversionRule: false,
        singleOfferPolicy: false,
        tpGovernance: false
      });
    }
  }, [isOpen]);

  if (!isOpen || !drive) return null;

  const allClausesChecked =
    acknowledgedPoints.conversionRule &&
    acknowledgedPoints.singleOfferPolicy &&
    acknowledgedPoints.tpGovernance;

  const isReadyToSubmit = hasAgreed || allClausesChecked;

  const handleAcknowledgeAll = () => {
    setHasAgreed(true);
    setAcknowledgedPoints({
      conversionRule: true,
      singleOfferPolicy: true,
      tpGovernance: true
    });
  };

  const handleMasterToggle = (checked) => {
    setHasAgreed(checked);
    if (checked) {
      setAcknowledgedPoints({
        conversionRule: true,
        singleOfferPolicy: true,
        tpGovernance: true
      });
    }
  };

  const handleSubmitApplication = () => {
    if (!isReadyToSubmit) return;
    onConfirm({
      consent_accepted: true,
      consent_accepted_at: new Date().toISOString(),
      student_name: student?.full_name || 'Student',
      student_id: student?.student_id || '',
      company_name: drive.company_name,
      drive_title: drive.title
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-surface-container-lowest rounded-3xl max-w-2xl w-full border border-outline-variant/60 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-primary p-6 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-200 block">
                  Institutional Placement Undertaking & Policy
                </span>
                <h3 className="font-headline font-bold text-lg text-white">
                  Mandatory Candidate Conversion Consent
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-5 text-on-surface">
          {/* Target Drive Snapshot */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-primary flex items-center justify-center flex-shrink-0 font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface">{drive.title}</p>
                <p className="text-[11px] text-on-surface-variant font-medium">
                  {drive.company_name} • {drive.role_position || 'Engineering Intern'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                ₹{drive.stipend_amount?.toLocaleString() || 'Stipend'} / {drive.stipend_type || 'month'}
              </span>
            </div>
          </div>

          {/* Error Banner if submission was blocked */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>Application Submission Blocked</span>
              </div>
              <p className="text-xs text-rose-900 leading-relaxed font-medium">{error}</p>
              {reasons && reasons.length > 0 && (
                <div className="pt-1 border-t border-rose-200">
                  <span className="text-[11px] font-bold text-rose-950 uppercase tracking-wider block mb-1">
                    Requirements to resolve:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-900 font-medium">
                    {reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Primary Legal / Institutional Policy Notice */}
          <div className="p-4.5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-xs space-y-2.5">
            <div className="flex items-start gap-2.5 text-amber-800 font-bold">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-amber-900">
                Placement Conversion Rule (Mandatory Institutional Clause)
              </span>
            </div>
            <p className="text-[12px] text-amber-950/90 leading-relaxed pl-7">
              By applying to this drive, you agree that if <strong>{drive.company_name}</strong> extends an official
              internship or full-time offer to you at any stage of this selection process,{' '}
              <strong>the college will consider and record you as a CONVERTED / PLACED student</strong>, regardless of
              whether you subsequently choose to accept, join, or reject the offer.
            </p>
          </div>

          {/* Detailed Policy Conditions Checklist */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-primary" />
                <span>Please read and acknowledge the following clauses:</span>
              </h4>
              <button
                type="button"
                onClick={handleAcknowledgeAll}
                className="text-[11px] font-bold text-primary hover:text-primary-hover hover:underline"
              >
                Acknowledge All Clauses
              </button>
            </div>

            {/* Clause 1 */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container-low cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={acknowledgedPoints.conversionRule}
                onChange={(e) =>
                  setAcknowledgedPoints({
                    ...acknowledgedPoints,
                    conversionRule: e.target.checked
                  })
                }
                className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary border-outline"
              />
              <span className="text-xs text-on-surface leading-snug">
                <strong>1. Irrevocable Conversion Status:</strong> I understand that once selected and offered by{' '}
                <strong>{drive.company_name}</strong>, my official placement status in the T&P Cell registry will be marked as{' '}
                <span className="text-emerald-700 font-bold uppercase">Converted / Placed</span>, even if I decline or forfeit the offer letter.
              </span>
            </label>

            {/* Clause 2 */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container-low cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={acknowledgedPoints.singleOfferPolicy}
                onChange={(e) =>
                  setAcknowledgedPoints({
                    ...acknowledgedPoints,
                    singleOfferPolicy: e.target.checked
                  })
                }
                className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary border-outline"
              />
              <span className="text-xs text-on-surface leading-snug">
                <strong>2. Equal Opportunity & Dream Offer Policy:</strong> I acknowledge that conversion under this drive fulfills institutional placement criteria and adheres to the college one-student-one-core-offer governance guidelines.
              </span>
            </label>

            {/* Clause 3 */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container-low cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={acknowledgedPoints.tpGovernance}
                onChange={(e) =>
                  setAcknowledgedPoints({
                    ...acknowledgedPoints,
                    tpGovernance: e.target.checked
                  })
                }
                className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary border-outline"
              />
              <span className="text-xs text-on-surface leading-snug">
                <strong>3. Professional Responsibility & Integrity:</strong> I commit to attending all scheduled selection rounds (Online Tests, Group Discussions, Technical Interviews) punctually and professionally without unexcused absenteeism.
              </span>
            </label>
          </div>

          {/* Master Solemn Declaration Checkbox */}
          <div className="pt-2 border-t border-outline-variant/40">
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-primary/5 border-2 border-primary/20 hover:border-primary/40 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={hasAgreed}
                onChange={(e) => handleMasterToggle(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary border-primary"
              />
              <span className="text-xs text-on-surface font-semibold leading-relaxed">
                I, <strong>{student?.full_name || 'the applicant'}</strong> ({student?.student_id || 'PRN Verified'}),
                hereby give my full informed consent to the Institutional Placement Undertaking and agree to submit my formal application for the {drive.title} drive.
              </span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-surface-container-low border-t border-outline-variant/40 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl border border-outline-variant hover:bg-surface-container-high text-xs font-bold text-on-surface-variant transition-colors"
          >
            Cancel / Go Back
          </button>

          <button
            type="button"
            onClick={handleSubmitApplication}
            disabled={!isReadyToSubmit || loading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-700 text-on-primary text-xs font-bold shadow-md shadow-primary/20 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting Application...</span>
              </>
            ) : (
              <>
                <FileCheck2 className="w-4 h-4" />
                <span>Accept Undertaking & Submit Application</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstitutionalConsentModal;
