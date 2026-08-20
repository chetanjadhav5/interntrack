import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Mail, Lock, User, IdCard, Building2, CheckCircle2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

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
    'MCA - Full Stack Development & AI',
    'BCA - Data Analytics'
  ]
};

const StudentRegisterPage = () => {
  const [step, setStep] = useState(1); // 1: Email/Password/OTP, 2: Extra Info
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  // Step 2 Form
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [branch, setBranch] = useState('Computer Science and Engineering');
  const [passingYear, setPassingYear] = useState('2026');
  const [gender, setGender] = useState('Male');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  // Handle department change -> updates branch options
  const handleDepartmentChange = (dept) => {
    setDepartment(dept);
    const branches = DEPARTMENT_BRANCH_MAP[dept] || [];
    setBranch(branches[0] || '');
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your institutional email');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setSuccessMsg(data.message || `Verification OTP has been sent to ${email}. Please check your inbox.`);
      } else {
        setError(data.error || 'Failed to send verification OTP');
      }
    } catch (err) {
      setError('Network error sending OTP');
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
        setStep(2);
        setSuccessMsg('');
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (err) {
      setError('Error verifying OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          student_id: studentId,
          department,
          branch,
          passing_year: passingYear,
          gender
        })
      });

      const data = await res.json();

      if (res.ok) {
        login(data.token, data.user);
        navigate('/student/dashboard');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network connection error during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-xl overflow-hidden animate-in fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-container p-6 text-white text-center relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-white p-2 backdrop-blur-md mx-auto flex items-center justify-center mb-3 shadow-lg overflow-hidden">
            <img src="/logo.png" alt="RaiSakshya Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="font-headline font-bold text-xl tracking-tight">RaiSakshya Student Registration</h2>
          <p className="text-xs text-blue-100 mt-1">
            {step === 1 ? 'Step 1 of 2: Security & OTP Verification' : 'Step 2 of 2: Academic & Personal Profile'}
          </p>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  Institutional Email ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="e.g. yourname@ghr.edu"
                    disabled={otpSent}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  Create Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Minimum 8 characters"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading || !email || !password}
                  className="w-full py-3 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-primary/30 flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send 6-Digit Email OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                      Enter 6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      className="w-full text-center tracking-widest text-lg font-bold py-2.5 rounded-xl border border-primary bg-blue-50/50 text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    />
                    <p className="text-[11px] text-on-surface-variant text-center mt-1">
                      Check your email inbox or spam folder for the 6-digit code.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={loading || !otp}
                    className="w-full py-3 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 disabled:opacity-60 shadow-md shadow-primary/30 flex items-center justify-center gap-2 transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Continue to Step 2</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleFinalSubmit} className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="e.g. Alex Patil"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Student ID / PRN
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    placeholder="e.g. GHR-CS-2023-042"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* Department Dropdown */}
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  Academic Department
                </label>
                <select
                  value={department}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                >
                  {Object.keys(DEPARTMENT_BRANCH_MAP).map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Branch Dropdown */}
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  Branch / Specialization (Filtered by Department)
                </label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none"
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
                    Passing Year
                  </label>
                  <select
                    value={passingYear}
                    onChange={(e) => setPassingYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  >
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Loader on Registration Button */}
              <button
                type="submit"
                disabled={loading || !fullName || !studentId}
                className="w-full py-3 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-primary/30 flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Student Account in Progress...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Registration & Open Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="pt-2 text-center text-xs text-on-surface-variant">
            Already registered?{' '}
            <Link to="/auth/login" className="font-bold text-primary hover:underline">
              Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentRegisterPage;
