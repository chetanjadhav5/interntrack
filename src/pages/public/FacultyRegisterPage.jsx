import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Users, Mail, Lock, User, IdCard, CheckCircle2, ArrowRight, Loader2, AlertCircle, ShieldAlert } from 'lucide-react';

const DEPARTMENT_BRANCH_MAP = {
  'Engineering': [
    'Computer Science and Engineering',
    'Information Technology',
    'Artificial Intelligence & Data Science',
    'Electronics & Telecommunication',
    'Mechanical Engineering',
    'Civil Engineering'
  ],
  'Management': [
    'MBA - Finance & Analytics',
    'MBA - Marketing & Human Resources',
    'MBA - Operations & Supply Chain'
  ],
  'Computer Applications': [
    'MCA - Cloud Computing & DevOps',
    'MCA - Full Stack Development & AI'
  ]
};

const FacultyRegisterPage = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [branch, setBranch] = useState('Computer Science and Engineering');
  const [year, setYear] = useState('2026');
  const [designation, setDesignation] = useState('CLASS_TEACHER');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleDepartmentChange = (dept) => {
    setDepartment(dept);
    const branches = DEPARTMENT_BRANCH_MAP[dept] || [];
    setBranch(branches[0] || '');
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return setError('Email is required');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, context: 'Faculty Registration' })
      });
      const data = await res.json();
      if (res.ok) setOtpSent(true);
      else setError(data.error || 'Failed to send verification OTP');
    } catch {
      setError('Network error sending verification OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return setError('Please enter the 6-digit OTP code');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (res.ok) setStep(2);
      else setError(data.error || 'Invalid or expired OTP');
    } catch {
      setError('Error verifying OTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register/faculty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          employee_id: employeeId,
          department,
          branch,
          year,
          designation
        })
      });

      const data = await res.json();
      if (res.ok) {
        setIsSubmitted(true);
      } else {
        setError(data.error || 'Failed to submit faculty registration');
      }
    } catch {
      setError('Network error during registration');
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md bg-white rounded-3xl border border-outline-variant p-8 text-center space-y-4 shadow-xl animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="font-headline font-bold text-xl text-on-surface">Registration Submitted!</h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Your faculty account request has been forwarded to the <strong>Administrator / HOD</strong> for credential verification. You will be able to log in once approved.
          </p>
          <Link
            to="/auth/login"
            className="inline-block px-6 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-all shadow-sm"
          >
            Back to Portal Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-xl overflow-hidden animate-in fade-in">
        <div className="bg-gradient-to-r from-emerald-700 to-teal-700 p-6 text-white text-center relative">
          <div className="w-14 h-14 rounded-2xl bg-white p-2 backdrop-blur-md mx-auto flex items-center justify-center mb-3 shadow-lg overflow-hidden">
            <img src="/logo.png" alt="RaiSakshya Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="font-headline font-bold text-xl tracking-tight">RaiSakshya Faculty Registration</h2>
          <p className="text-xs text-emerald-100 mt-1">
            {step === 1 ? 'Step 1 of 2: Security & OTP Verification' : 'Step 2 of 2: Department, Branch & Designation'}
          </p>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  Institutional Faculty Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="e.g. prof.name@ghr.edu"
                    disabled={otpSent}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
              </div>

              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading || !email || !password}
                  className="w-full py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send 6-Digit Email OTP</span>}
                </button>
              ) : (
                <div className="space-y-4 pt-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full text-center tracking-widest text-lg font-bold py-2.5 rounded-xl border border-emerald-600 bg-emerald-50/50"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={loading || !otp}
                    className="w-full py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify & Continue to Step 2</span>}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Full Name (with Prefix)
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="e.g. Dr. Suresh Verma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Faculty Employee ID
                  </label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    required
                    placeholder="e.g. GHR-FAC-CS-012"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                </div>
              </div>

              {/* Department Dropdown */}
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-600 outline-none"
                >
                  {Object.keys(DEPARTMENT_BRANCH_MAP).map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch Dropdown */}
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  Branch
                </label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-600 outline-none"
                >
                  {(DEPARTMENT_BRANCH_MAP[department] || []).map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Assigned Year
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-600 outline-none"
                  >
                    <option value="2025">2nd Year (2025)</option>
                    <option value="2026">3rd Year (2026)</option>
                    <option value="2027">Final Year (2027)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Designation
                  </label>
                  <select
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-600 outline-none font-bold"
                  >
                    <option value="CLASS_TEACHER">Class Teacher (Profile Verifier)</option>
                    <option value="PROFESSOR">Professor (Mentor)</option>
                    <option value="ASSISTANT_PROFESSOR">Assistant Professor (Mentor)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-md flex items-center justify-center gap-2 transition-all"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Submit for Admin Approval</span>}
              </button>
            </form>
          )}

          <div className="pt-2 text-center text-xs text-on-surface-variant">
            Already have an approved account?{' '}
            <Link to="/auth/login" className="font-bold text-emerald-600 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyRegisterPage;
