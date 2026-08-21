import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OpenStreetMapPicker from '../../components/common/OpenStreetMapPicker';
import {
  Building2,
  MapPin,
  FileText,
  Users,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Camera,
  ArrowRight,
  Loader2,
  DollarSign,
  Sparkles,
  ExternalLink,
  Check,
  Globe
} from 'lucide-react';

const ReportSelfPlacedPage = () => {
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');
  const [internshipMode, setInternshipMode] = useState('ON_SITE'); // ON_SITE vs REMOTE
  const [rolePosition, setRolePosition] = useState('Software Engineering Intern');
  const [stipend, setStipend] = useState('45000');
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [offerLetterUrl, setOfferLetterUrl] = useState('https://example.com/self-placed-offer.pdf');

  // OpenStreetMap Coordinates
  const [officeAddress, setOfficeAddress] = useState('EON Free Zone, Kharadi, Pune, Maharashtra 411014');
  const [latitude, setLatitude] = useState(18.5529);
  const [longitude, setLongitude] = useState(73.9497);

  // GSTIN Live Verification State
  const [isVerifyingGstin, setIsVerifyingGstin] = useState(false);
  const [gstinVerifiedData, setGstinVerifiedData] = useState(null);
  const [gstinError, setGstinError] = useState('');

  // Mentor Selector from same department & branch
  const [mentors, setMentors] = useState([]);
  const [selectedMentorId, setSelectedMentorId] = useState('');

  // Offsite photo verification
  const [isOffsite, setIsOffsite] = useState(false);
  const [firstCheckinPhotoUrl, setFirstCheckinPhotoUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Simulated available mentors for branch (CS 3rd Year)
    setMentors([
      { id: 'user_faculty_mentor_1', name: 'Prof. Anjali Mehta (Assistant Professor)' },
      { id: 'user_faculty_ct_1', name: 'Dr. Suresh Verma (Class Teacher)' }
    ]);
    setSelectedMentorId('user_faculty_mentor_1');
  }, []);

  const handleLocationSelect = (loc) => {
    setOfficeAddress(loc.address);
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
  };

  // RapidAPI GSTIN Verification & Location Autofetch
  const handleVerifyGstin = async () => {
    const cleanGst = (gstin || '').trim().toUpperCase();
    if (!cleanGst || cleanGst.length < 10) {
      setGstinError('Please enter a valid 15-character GSTIN number (e.g. 27AAJCM9929L1ZM)');
      return;
    }

    setIsVerifyingGstin(true);
    setGstinError('');

    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch(`/api/student/verify-gstin/${encodeURIComponent(cleanGst)}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGstinVerifiedData(data);
        // Autofill Company Name if not filled
        if (!companyName || companyName.trim() === '') {
          setCompanyName(data.company_name || data.legal_name);
        }
        // Autofill registered address and geocoded coordinates
        if (data.registered_address) {
          setOfficeAddress(data.registered_address);
        }
        if (data.latitude && data.longitude) {
          setLatitude(data.latitude);
          setLongitude(data.longitude);
        }
      } else {
        setGstinError(data.error || 'Unable to verify GSTIN with government portal. Please check the number.');
      }
    } catch {
      setGstinError('Network error while verifying GSTIN with server.');
    } finally {
      setIsVerifyingGstin(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyName || !officeAddress || !offerLetterUrl) {
      setError('Please fill in all mandatory company and offer letter fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/student/internships/report-self-placed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          company_name: companyName,
          gstin,
          internship_mode: internshipMode,
          role_position: rolePosition,
          office_address: officeAddress,
          latitude,
          longitude,
          offer_letter_url: offerLetterUrl,
          start_date: startDate,
          end_date: endDate,
          requested_mentor_id: selectedMentorId,
          is_offsite_address: isOffsite,
          first_checkin_photo_url: firstCheckinPhotoUrl,
          gstin_trust_data: gstinVerifiedData?.trust_data || null
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/student/workflow');
        }, 2000);
      } else {
        setError(data.error || 'Failed to submit self-placed report');
      }
    } catch {
      setError('Network error submitting self-placed internship');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm space-y-2">
        <span className="text-xs font-bold text-primary uppercase tracking-wider">Off-Campus Placement</span>
        <h1 className="font-headline font-black text-2xl sm:text-3xl text-on-surface tracking-tight">
          Report Self-Placed Internship
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl">
          Reported self-placed internships are verified directly by the <strong>Training & Placement (T&P) Department</strong> prior to faculty mentor assignment and daily attendance unlock.
        </p>
      </div>

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Self-placed internship submitted successfully to T&P! Redirecting to Workflow Tracker...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Company & Position Details */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <h2 className="font-headline font-bold text-base text-on-surface">Company & Offer Information</h2>
            </div>
            <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> RapidAPI GSTIN Verified
            </span>
          </div>

          {/* Internship Work Mode Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
              Internship Working Mode <span className="text-rose-600">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setInternshipMode('ON_SITE')}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                  internshipMode === 'ON_SITE'
                    ? 'bg-blue-50/80 border-primary shadow-sm ring-2 ring-primary/20'
                    : 'bg-surface-container-low border-outline-variant hover:bg-surface-container-high'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  internshipMode === 'ON_SITE' ? 'bg-primary text-white' : 'bg-surface-container-highest text-on-surface-variant'
                }`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs text-on-surface">🏢 On-Site (Office Based)</h4>
                    {internshipMode === 'ON_SITE' && (
                      <span className="px-1.5 py-0.5 rounded bg-primary text-white text-[9px] font-black">SELECTED</span>
                    )}
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                    Verified via 300m office geofence & biometric Face ID.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setInternshipMode('REMOTE')}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                  internshipMode === 'REMOTE'
                    ? 'bg-purple-50/80 border-purple-600 shadow-sm ring-2 ring-purple-600/20'
                    : 'bg-surface-container-low border-outline-variant hover:bg-surface-container-high'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  internshipMode === 'REMOTE' ? 'bg-purple-600 text-white' : 'bg-surface-container-highest text-on-surface-variant'
                }`}>
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs text-on-surface">🌐 Remote (Work From Home)</h4>
                    {internshipMode === 'REMOTE' && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-600 text-white text-[9px] font-black">SELECTED</span>
                    )}
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                    Direct check-in; mandatory daily work proof (image/PDF) at checkout.
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                Hiring Organization / Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                placeholder="e.g. Infosys / Persistent Systems"
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                  Company GSTIN (Auto-Verification)
                </label>
                <span className="text-[10px] text-on-surface-variant font-medium">15 Alphanumeric</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => {
                    setGstin(e.target.value.toUpperCase());
                    if (gstinVerifiedData) setGstinVerifiedData(null);
                    if (gstinError) setGstinError('');
                  }}
                  placeholder="e.g. 27AAJCM9929L1ZM"
                  maxLength={15}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-mono font-medium focus:ring-2 focus:ring-primary outline-none uppercase"
                />
                <button
                  type="button"
                  onClick={handleVerifyGstin}
                  disabled={isVerifyingGstin || !gstin}
                  className="px-3.5 py-2.5 bg-primary hover:bg-primary-hover active:scale-95 text-on-primary rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-sm"
                  title="Verify GSTIN with Government Portal & Autofetch Registered Office Coordinates"
                >
                  {isVerifyingGstin ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Verify & Autofetch</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* GSTIN Verification Feedback & Details Card */}
            {gstinError && (
              <div className="sm:col-span-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>{gstinError}</span>
              </div>
            )}

            {gstinVerifiedData && (
              <div className="sm:col-span-2 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/70 border border-emerald-300 text-emerald-950 text-xs shadow-sm space-y-2.5 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-emerald-950 leading-tight">
                        {gstinVerifiedData.legal_name || gstinVerifiedData.trade_name}
                      </h4>
                      <p className="text-[11px] text-emerald-800 font-medium">
                        GSTIN: <span className="font-mono font-bold">{gstinVerifiedData.gstin}</span> • {gstinVerifiedData.company_type}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold tracking-wide uppercase shadow-sm">
                    {gstinVerifiedData.status || 'Active'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-emerald-900">
                  <div>
                    <span className="font-bold text-emerald-950">Registered Office Address:</span>
                    <p className="line-clamp-2 mt-0.5 text-emerald-800">{gstinVerifiedData.registered_address}</p>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200/80 flex flex-col justify-center">
                    <div className="flex items-center gap-1 text-primary font-bold">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Autofetched Office Coordinates</span>
                    </div>
                    <p className="text-[10px] text-emerald-700 font-mono mt-0.5">
                      Lat: {gstinVerifiedData.latitude.toFixed(6)} | Lng: {gstinVerifiedData.longitude.toFixed(6)} (300m Attendance Ring Set)
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                Designation / Role Title
              </label>
              <input
                type="text"
                value={rolePosition}
                onChange={(e) => setRolePosition(e.target.value)}
                required
                placeholder="e.g. Software Engineering Intern"
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                Monthly Stipend (INR)
              </label>
              <input
                type="number"
                value={stipend}
                onChange={(e) => setStipend(e.target.value)}
                placeholder="45000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                Internship Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                Internship End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Google Maps Office Location & Fixed 300m Geofence */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-secondary" />
              <div>
                <h2 className="font-headline font-bold text-base text-on-surface">Company Work Location & Geofence</h2>
                <p className="text-[11px] text-on-surface-variant">
                  Fixed Institutional Geofence: <strong>300 meters</strong> (User radius slider removed per specification).
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-100 text-primary text-xs font-bold">
              Fixed 300m Geofence
            </span>
          </div>

          <OpenStreetMapPicker
            initialAddress={officeAddress}
            initialLat={latitude}
            initialLng={longitude}
            companyNameHint={companyName}
            onLocationSelect={handleLocationSelect}
          />
        </div>

        {/* Section 3: Mentor Selection & Offer Letter Proof */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-outline-variant/40 pb-3">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-headline font-bold text-base text-on-surface">
              Desired Mentor & Documentation Proof
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                Choose Desired Mentor (From Same Department & Branch)
              </label>
              <select
                value={selectedMentorId}
                onChange={(e) => setSelectedMentorId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
              >
                {mentors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                Official Offer Letter Hosted Document Link (PDF)
              </label>
              <input
                type="url"
                value={offerLetterUrl}
                onChange={(e) => setOfferLetterUrl(e.target.value)}
                required
                placeholder="https://example.com/self-placed-offer.pdf"
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            {/* Offsite Address Photo Verification */}
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold text-on-surface cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOffsite}
                  onChange={(e) => setIsOffsite(e.target.checked)}
                  className="rounded text-primary focus:ring-primary"
                />
                <span>Company address differs from GSTIN registered headquarters / offsite location</span>
              </label>

              {isOffsite && (
                <div className="space-y-2 pt-2 animate-in fade-in">
                  <span className="text-[11px] font-bold text-on-surface-variant block uppercase tracking-wider">
                    First Check-in Site Photo Verification (Sent to Faculty Mentor)
                  </span>
                  <input
                    type="url"
                    value={firstCheckinPhotoUrl}
                    onChange={(e) => setFirstCheckinPhotoUrl(e.target.value)}
                    placeholder="Provide image link for initial site verification"
                    className="w-full px-3.5 py-2 rounded-xl border border-outline-variant bg-white text-xs font-medium outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm">
          <p className="text-xs text-on-surface-variant">
            Submitted records will appear under <strong>T&P Verification Hub &gt; Self-Placed</strong>.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 rounded-2xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 disabled:opacity-60 shadow-md shadow-primary/30 flex items-center gap-2 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting to T&P...</span>
              </>
            ) : (
              <>
                <span>Submit for T&P Verification</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportSelfPlacedPage;
