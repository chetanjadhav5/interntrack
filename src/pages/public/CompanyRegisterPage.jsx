import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import OpenStreetMapPicker from '../../components/common/OpenStreetMapPicker';
import {
  Building2,
  Mail,
  Lock,
  Globe,
  FileText,
  CheckCircle2,
  ArrowRight,
  Loader2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Building
} from 'lucide-react';

const CompanyRegisterPage = () => {
  // Step 1: Email & OTP Verification
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  // Step 2: Company Details
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('Information Technology & Cloud');
  const [description, setDescription] = useState('');

  // Location
  const [officeAddress, setOfficeAddress] = useState('EON Free Zone, Kharadi, Pune, Maharashtra 411014');
  const [latitude, setLatitude] = useState(18.5529);
  const [longitude, setLongitude] = useState(73.9497);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submittedForApproval, setSubmittedForApproval] = useState(false);

  const navigate = useNavigate();

  const handleLocationSelect = (loc) => {
    setOfficeAddress(loc.address);
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your corporate email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setSuccessMsg(data.message || `Verification OTP sent to ${email}. Please check your inbox.`);
      } else {
        setError(data.error || 'Failed to send verification OTP');
      }
    } catch {
      setError('Network error sending verification OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (res.ok) {
        setOtpVerified(true);
        setSuccessMsg('Email OTP verified successfully! Please complete your company registration details.');
      } else {
        setError(data.error || 'Invalid or expired OTP');
      }
    } catch {
      setError('Network error verifying OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !companyName || !gstin) {
      setError('Email, password, company name, and GSTIN are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          company_name: companyName,
          gstin,
          website,
          industry,
          description,
          office_address: officeAddress,
          latitude,
          longitude,
          otp
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSubmittedForApproval(true);
      } else {
        setError(data.error || 'Failed to submit company registration');
      }
    } catch {
      setError('Network connection error');
    } finally {
      setLoading(false);
    }
  };

  if (submittedForApproval) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-background my-8">
        <div className="w-full max-w-lg bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-xl p-8 text-center space-y-5 animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
              Admin Verification Pending
            </span>
            <h2 className="font-headline font-bold text-2xl text-on-surface">Registration Submitted!</h2>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Your company details for <strong>{companyName}</strong> (GSTIN: {gstin}) have been sent to the Institutional Administrator for verification.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 text-xs text-left space-y-2">
            <p className="font-bold text-on-surface">Next Steps:</p>
            <ul className="list-disc list-inside space-y-1 text-on-surface-variant text-[11px]">
              <li>Institutional Admin verifies your corporate GSTIN and company profile.</li>
              <li>Once approved, you will receive confirmation and can log in with <span className="font-mono font-bold text-on-surface">{email}</span>.</li>
            </ul>
          </div>

          <Link
            to="/auth/login"
            className="w-full py-3 rounded-2xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 shadow-sm flex items-center justify-center gap-2 transition-all block"
          >
            <span>Proceed to Login Page</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-background my-8">
      <div className="w-full max-w-2xl bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-xl overflow-hidden animate-in fade-in">
        <div className="bg-gradient-to-r from-amber-600 to-orange-700 p-6 text-white text-center relative">
          <div className="w-14 h-14 rounded-2xl bg-white p-2 backdrop-blur-md mx-auto flex items-center justify-center mb-3 shadow-lg overflow-hidden">
            <img src="/logo.png" alt="RaiSakshya Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="font-headline font-bold text-xl tracking-tight">RaiSakshya Recruiter Registration</h2>
          <p className="text-xs text-amber-100 mt-1">Post campus drives, review talent, and manage intern appraisals</p>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: Corporate Email & Real Email OTP */}
          {!otpVerified ? (
            <div className="space-y-4">
              <div className="border-b border-outline-variant/40 pb-2">
                <h3 className="font-headline font-bold text-sm text-on-surface flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span>Step 1: Corporate Email OTP Verification</span>
                </h3>
                <p className="text-xs text-on-surface-variant">We send a secure 6-digit verification code to your corporate email.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  Corporate Recruiter Email Address
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={otpSent}
                    required
                    placeholder="recruiter@company.com"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-amber-600 outline-none disabled:bg-surface-container-low"
                  />
                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading || !email}
                      className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Real OTP</span>}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setOtp(''); }}
                      className="px-3 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container-low font-bold text-xs"
                    >
                      Change
                    </button>
                  )}
                </div>
              </div>

              {otpSent && (
                <div className="space-y-3 p-4 rounded-2xl bg-amber-50/60 border border-amber-200 animate-in fade-in">
                  <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Enter 6-Digit Email OTP
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 849201"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-amber-300 bg-white text-sm font-mono font-bold tracking-widest text-center focus:ring-2 focus:ring-amber-600 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={loading || otp.length < 6}
                      className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify OTP</span>}
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-800">Check your inbox/spam folder for the verification code.</p>
                </div>
              )}
            </div>
          ) : (
            /* STEP 2: Company Details Form */
            <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in">
              <div className="border-b border-outline-variant/40 pb-2 flex items-center justify-between">
                <div>
                  <h3 className="font-headline font-bold text-sm text-on-surface flex items-center gap-2">
                    <Building className="w-4 h-4 text-emerald-700" />
                    <span>Step 2: Corporate Profile & GSTIN Details</span>
                  </h3>
                  <p className="text-xs text-on-surface-variant">Verified Email: <strong className="font-mono text-emerald-800">{email}</strong></p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Email Verified
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Account Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-amber-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Company Legal Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    placeholder="e.g. Google India Private Limited"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-amber-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Company GSTIN Number
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    required
                    placeholder="e.g. 27AAACG0535P1Z8"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-amber-600 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Industry Sector
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-amber-600 outline-none"
                  >
                    <option value="Information Technology & Cloud">Information Technology & Cloud</option>
                    <option value="Software & Artificial Intelligence">Software & Artificial Intelligence</option>
                    <option value="Banking & Financial Services">Banking & Financial Services</option>
                    <option value="Automotive & Manufacturing">Automotive & Manufacturing</option>
                    <option value="Consulting & Analytics">Consulting & Analytics</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  Careers Website / Portal URL
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://careers.company.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-amber-600 outline-none"
                />
              </div>

              {/* OpenStreetMap Location Setup */}
              <OpenStreetMapPicker
                initialAddress={officeAddress}
                initialLat={latitude}
                initialLng={longitude}
                onLocationSelect={handleLocationSelect}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 shadow-md flex items-center justify-center gap-2 transition-all"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Submit Registration for Admin Approval</span>}
              </button>
            </form>
          )}

          <div className="pt-2 text-center text-xs text-on-surface-variant">
            Already registered?{' '}
            <Link to="/auth/login" className="font-bold text-amber-600 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyRegisterPage;
