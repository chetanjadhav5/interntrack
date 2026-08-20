import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, ArrowRight, Loader2, Sparkles, GraduationCap, Users, Briefcase, Building2, Shield, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const [roleTab, setRoleTab] = useState('STUDENT');
  const [email, setEmail] = useState('alex.patil@ghr.edu');
  const [password, setPassword] = useState('Student@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRoleTabChange = (role) => {
    setRoleTab(role);
    setError('');
    switch (role) {
      case 'STUDENT':
        setEmail('alex.patil@ghr.edu');
        setPassword('Student@123');
        break;
      case 'FACULTY':
        setEmail('classteacher.cs3@ghr.edu');
        setPassword('Faculty@123');
        break;
      case 'TNP':
        setEmail('tnp.cs@ghr.edu');
        setPassword('Tnp@123');
        break;
      case 'COMPANY':
        setEmail('recruiter@google.com');
        setPassword('Company@123');
        break;
      case 'ADMIN':
        setEmail('admin@ghr.edu');
        setPassword('Admin@123');
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        login(data.token, data.user);
        if (data.user.role === 'STUDENT') navigate('/student/dashboard');
        else if (data.user.role === 'FACULTY') navigate('/faculty/dashboard');
        else if (data.user.role === 'TNP') navigate('/tnp/dashboard');
        else if (data.user.role === 'COMPANY') navigate('/company/dashboard');
        else if (data.user.role === 'ADMIN') navigate('/admin/dashboard');
      } else {
        setError(data.error || 'Login failed. Please verify credentials.');
      }
    } catch (err) {
      setError('Network connection error. Ensure API server is active.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl border border-outline-variant shadow-xl overflow-hidden animate-in fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-container p-6 text-white text-center relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-white p-2 backdrop-blur-md mx-auto flex items-center justify-center mb-3 shadow-lg overflow-hidden">
            <img src="/logo.png" alt="RaiSakshya Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="font-headline font-bold text-xl tracking-tight">RaiSakshya Portal Login</h2>
          <p className="text-xs text-blue-100 mt-1">Sign in to your authorized institutional workspace</p>
        </div>

        {/* Role Tab Selector */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-5 gap-1 p-1 bg-surface-container-high rounded-xl border border-outline-variant/60">
            <button
              type="button"
              onClick={() => handleRoleTabChange('STUDENT')}
              className={`py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                roleTab === 'STUDENT' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => handleRoleTabChange('FACULTY')}
              className={`py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                roleTab === 'FACULTY' ? 'bg-white text-emerald-600 shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Faculty
            </button>
            <button
              type="button"
              onClick={() => handleRoleTabChange('TNP')}
              className={`py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                roleTab === 'TNP' ? 'bg-white text-purple-600 shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              T&P
            </button>
            <button
              type="button"
              onClick={() => handleRoleTabChange('COMPANY')}
              className={`py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                roleTab === 'COMPANY' ? 'bg-white text-amber-600 shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Company
            </button>
            <button
              type="button"
              onClick={() => handleRoleTabChange('ADMIN')}
              className={`py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                roleTab === 'ADMIN' ? 'bg-white text-rose-600 shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Admin
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                Registered Institutional Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="e.g. alex.patil@ghr.edu"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                Account Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>
            </div>

            {/* Submit Button with Loading State */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-primary/30 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to {roleTab} Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration Links */}
          <div className="pt-4 border-t border-outline-variant/60 text-center space-y-2">
            <p className="text-xs text-on-surface-variant">Don't have an account yet?</p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-primary">
              <Link to="/auth/register/student" className="hover:underline">
                Student Register
              </Link>
              <span>•</span>
              <Link to="/auth/register/faculty" className="hover:underline text-emerald-600">
                Faculty Register
              </Link>
              <span>•</span>
              <Link to="/auth/register/tnp" className="hover:underline text-purple-600">
                T&P Register
              </Link>
              <span>•</span>
              <Link to="/auth/register/company" className="hover:underline text-amber-600">
                Company Register
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
