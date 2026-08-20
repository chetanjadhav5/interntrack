import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

const ProfileCompletionModal = ({ isOpen, onClose, profile }) => {
  const navigate = useNavigate();

  if (!isOpen || !profile) return null;

  const percent = profile.profile_completion_percent || 0;
  const isVerified = profile.verification_status === 'VERIFIED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-primary to-primary-container p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md mx-auto flex items-center justify-center mb-3 shadow-inner">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="font-headline font-bold text-xl tracking-tight">Complete Your Student Profile</h2>
          <p className="text-xs text-blue-100 mt-1 max-w-sm mx-auto">
            GHR Institutional Policy: 100% complete & Class Teacher-verified profiles are required to apply for campus internships.
          </p>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-on-surface">Overall Profile Completion</span>
              <span className={`text-sm ${percent === 100 ? 'text-emerald-600' : 'text-primary'}`}>
                {percent}% Completed
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-surface-container-high overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  percent === 100 ? 'bg-emerald-500' : 'bg-primary'
                }`}
                style={{ width: `${percent}%` }}
              ></div>
            </div>
          </div>

          {/* Checklist of Missing / Completed Items */}
          <div className="space-y-2.5 rounded-2xl bg-surface-container-low p-4 border border-outline-variant/60">
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Profile Verification Checklist
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-on-surface">Basic Academic Information (ID, Dept, Branch)</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-on-surface">Current CGPA & Backlogs Count</span>
                {profile.current_cgpa > 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Required
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-on-surface">Technical Skills & Proficiencies</span>
                {profile.skills && profile.skills.length > 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Required
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-on-surface">Updated Resume PDF Upload</span>
                {profile.resume_url ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Required
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-on-surface">Industry Certifications & Proof</span>
                {profile.certifications && profile.certifications.length > 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Required
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-outline-variant/60">
                <span className="font-bold text-on-surface">Class Teacher Approval Status</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isVerified
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {profile.verification_status}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-outline-variant text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              Remind Me Later
            </button>
            <button
              onClick={() => {
                onClose();
                navigate('/student/profile');
              }}
              className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 shadow-sm shadow-primary/30 transition-all"
            >
              <span>Complete Profile Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionModal;
