import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import InstitutionalConsentModal from '../../components/student/InstitutionalConsentModal';
import {
  Search,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Loader2
} from 'lucide-react';

const CompanyDirectoryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEligibleOnly, setFilterEligibleOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [consentDrive, setConsentDrive] = useState(null);
  const [applyingId, setApplyingId] = useState(null);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionReasons, setActionReasons] = useState([]);

  useEffect(() => {
    fetchDrives();
  }, [filterEligibleOnly]);

  const fetchDrives = async () => {
    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch(`/api/student/drives?eligible_only=${filterEligibleOnly}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDrives(data);
      }
    } catch (err) {
      console.error('Error fetching drives:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConsentModal = (drive) => {
    setActionMessage('');
    setActionError('');
    setActionReasons([]);
    setConsentDrive(drive);
  };

  const handleConfirmApply = async (consentData) => {
    if (!consentDrive) return;
    const driveId = consentDrive.id;
    setApplyingId(driveId);
    setActionMessage('');
    setActionError('');
    setActionReasons([]);

    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/student/applications/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          drive_id: driveId,
          consent_accepted: true,
          consent_accepted_at: consentData.consent_accepted_at
        })
      });

      const data = await res.json();

      if (res.ok) {
        setConsentDrive(null);
        setActionMessage(data.message);
        // Remove applied drive from available list and navigate to My Applications after brief delay
        setDrives(drives.filter((d) => d.id !== driveId));
        setTimeout(() => {
          navigate('/student/applications');
        }, 1500);
      } else {
        setActionError(data.error || 'Failed to submit application');
        if (data.reasons && Array.isArray(data.reasons)) {
          setActionReasons(data.reasons);
        }
      }
    } catch {
      setActionError('Network error submitting application');
    } finally {
      setApplyingId(null);
    }
  };

  const filteredDrives = drives.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.work_location_address.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Placement Drives</span>
            <h1 className="font-headline font-black text-2xl sm:text-3xl text-on-surface tracking-tight mt-0.5">
              Available Internship Drives
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Smart Eligibility engine evaluates your profile criteria in real-time.
            </p>
          </div>

          {/* Filter Only Eligible Internships Toggle */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs font-bold text-primary cursor-pointer hover:bg-blue-100 transition-colors shadow-sm">
              <input
                type="checkbox"
                checked={filterEligibleOnly}
                onChange={(e) => setFilterEligibleOnly(e.target.checked)}
                className="rounded text-primary focus:ring-primary w-4 h-4"
              />
              <Zap className="w-4 h-4 text-primary" />
              <span>Filter Only Eligible Internships</span>
            </label>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by drive title, company name, skills, or city..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-outline-variant bg-surface-container-low text-xs font-medium text-on-surface focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all shadow-inner"
          />
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

      {/* Drives Grid */}
      {filteredDrives.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl p-12 text-center border border-outline-variant/60 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-primary flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="font-headline font-bold text-base text-on-surface">No Drives Found</h3>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
            {filterEligibleOnly
              ? 'No drives currently match all your profile criteria. Toggle the filter to view all campus postings.'
              : 'No placement drives match your search query.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDrives.map((drive) => (
            <div
              key={drive.id}
              className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                {/* Company & Role Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                      {drive.company_name}
                    </span>
                    <h3 className="font-headline font-bold text-lg text-on-surface mt-0.5">{drive.title}</h3>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-secondary" />
                      {drive.work_location_address.split(',')[0]}
                    </p>
                  </div>

                  {/* Smart Eligibility Tag */}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                      drive.is_eligible
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {drive.is_eligible ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
                    {drive.is_eligible ? 'Eligible' : 'Not Eligible'}
                  </span>
                </div>

                {/* Key Metrics Strip */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-outline-variant/40 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-on-surface-variant uppercase font-bold block">Stipend</span>
                    <span className="font-headline font-extrabold text-on-surface">
                      ₹{drive.stipend_amount ? drive.stipend_amount.toLocaleString() : '0'}/mo
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant uppercase font-bold block">Duration</span>
                    <span className="font-headline font-extrabold text-on-surface">{drive.duration_months} Months</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant uppercase font-bold block">Min CGPA</span>
                    <span className="font-headline font-extrabold text-primary">{drive.min_cgpa}</span>
                  </div>
                </div>

                {/* Required Skills Chips */}
                {drive.required_skills && drive.required_skills.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                      Required Skills
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {drive.required_skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2.5 py-1 rounded-lg bg-surface-container-high text-on-surface text-[11px] font-semibold"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ineligibility Reason Callout */}
                {!drive.is_eligible && drive.eligibility_reasons && drive.eligibility_reasons.length > 0 && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800 space-y-1">
                    <span className="font-bold block">Why you're ineligible:</span>
                    <p>{drive.eligibility_reasons[0]}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Link
                  to={`/student/eligibility/${drive.id}`}
                  className="flex-1 py-2.5 rounded-xl border border-outline-variant text-center text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  View Smart Breakdown
                </Link>

                <button
                  type="button"
                  onClick={() => handleOpenConsentModal(drive)}
                  disabled={!drive.is_eligible || applyingId === drive.id}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-primary/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  {applyingId === drive.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Apply Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Institutional Placement Undertaking & Conversion Policy Modal */}
      <InstitutionalConsentModal
        isOpen={Boolean(consentDrive)}
        onClose={() => {
          setConsentDrive(null);
          setActionError('');
          setActionReasons([]);
        }}
        onConfirm={handleConfirmApply}
        drive={consentDrive}
        student={user?.profile}
        loading={Boolean(applyingId)}
        error={actionError}
        reasons={actionReasons}
      />
    </div>
  );
};

export default CompanyDirectoryPage;
