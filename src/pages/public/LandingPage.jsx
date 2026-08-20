import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  Briefcase,
  Building2,
  Users,
  Shield,
  ArrowRight,
  CheckCircle,
  MapPin,
  FileCheck,
  TrendingUp,
  Award,
  Sparkles,
  Zap,
  Lock
} from 'lucide-react';

const LandingPage = () => {
  const { user, quickSwitchRole } = useAuth();
  const navigate = useNavigate();

  const handleDemoPersona = async (email, password, route) => {
    const res = await quickSwitchRole(email, password);
    if (res.success) {
      navigate(route);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background">
      {/* Top Hackathon Banner */}
      <div className="bg-gradient-to-r from-primary-container via-primary to-secondary text-white py-2 px-4 text-center text-xs font-bold tracking-wide shadow-sm flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 animate-spin-slow" />
        <span>G H RAISONI COLLEGE OF ENGINEERING & MANAGEMENT — GHR INTER-TRACK HACKATHON 2026</span>
        <span className="hidden md:inline px-2 py-0.5 rounded-full bg-white/20 text-[10px] uppercase font-black">
          Institutional Authority
        </span>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#1a56db_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-extrabold tracking-wide uppercase">
              <Zap className="w-3.5 h-3.5" />
              Next-Generation Internship Management System
            </div>

            <h1 className="font-headline font-black text-4xl sm:text-5xl lg:text-6xl text-on-surface tracking-tight leading-tight">
              Building Smarter <br />
              <span className="bg-gradient-to-r from-primary via-primary-container to-secondary bg-clip-text text-transparent">
                Internship Ecosystems
              </span>
            </h1>

            <p className="text-base sm:text-lg text-on-surface-variant font-normal leading-relaxed">
              Eliminate manual forms and scattered spreadsheets. A unified, authentic, and data-driven platform
              connecting <strong>Students</strong>, <strong>Faculty Mentors</strong>, <strong>T&P Departments</strong>, and <strong>Corporate Recruiters</strong>.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                to="/auth/login"
                className="px-8 py-4 rounded-2xl bg-primary text-on-primary font-bold text-sm hover:bg-primary/90 shadow-lg shadow-primary/30 flex items-center gap-2 group transition-all hover:scale-105 active:scale-95"
              >
                <span>Launch IMS Workspace</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/support"
                className="px-8 py-4 rounded-2xl bg-surface-container-lowest border border-outline-variant text-on-surface font-bold text-sm hover:bg-surface-container-high transition-all shadow-sm"
              >
                Explore System Docs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Live Statistical Counters */}
      <section className="bg-surface-container-low border-y border-outline-variant/60 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 bg-white rounded-2xl border border-outline-variant/60 shadow-sm">
              <p className="font-headline font-black text-3xl text-primary">100%</p>
              <p className="text-xs font-bold text-on-surface-variant mt-1 uppercase">Automated Eligibility</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-outline-variant/60 shadow-sm">
              <p className="font-headline font-black text-3xl text-secondary">300m</p>
              <p className="text-xs font-bold text-on-surface-variant mt-1 uppercase">Geofenced Attendance</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-outline-variant/60 shadow-sm">
              <p className="font-headline font-black text-3xl text-emerald-600">87.4%</p>
              <p className="text-xs font-bold text-on-surface-variant mt-1 uppercase">Placement Conversion</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-outline-variant/60 shadow-sm">
              <p className="font-headline font-black text-3xl text-purple-600">₹85,000</p>
              <p className="text-xs font-bold text-on-surface-variant mt-1 uppercase">Highest Monthly Stipend</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5 User Persona Cards (Interactive One-Click Quick Launch) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold text-primary uppercase tracking-widest">Multi-Role Architecture</span>
          <h2 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight">
            Tailored Experiences for Every Stakeholder
          </h2>
          <p className="text-sm text-on-surface-variant">
            Click any role to test and experience the dedicated portals instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {/* Student */}
          <div className="bg-white rounded-3xl p-6 border border-outline-variant/80 shadow-sm hover:shadow-card-hover transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="font-headline font-bold text-base text-on-surface">Student Portal</h3>
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                Profile completion, Smart Eligibility check, Geofenced check-in, GitHub score, and Friday weekly reports.
              </p>
            </div>
            <button
              onClick={() => handleDemoPersona('alex.patil@ghr.edu', 'Student@123', '/student/dashboard')}
              className="mt-6 w-full py-2.5 rounded-xl bg-blue-50 text-primary hover:bg-primary hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <span>Explore Student</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Faculty / Class Teacher */}
          <div className="bg-white rounded-3xl p-6 border border-outline-variant/80 shadow-sm hover:shadow-card-hover transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-headline font-bold text-base text-on-surface">Faculty Mentor</h3>
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                Class teacher profile verification, weekly report scoring with mandatory feedback, and certificate issuance.
              </p>
            </div>
            <button
              onClick={() => handleDemoPersona('classteacher.cs3@ghr.edu', 'Faculty@123', '/faculty/dashboard')}
              className="mt-6 w-full py-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <span>Explore Faculty</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* T&P Department */}
          <div className="bg-white rounded-3xl p-6 border border-outline-variant/80 shadow-sm hover:shadow-card-hover transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="font-headline font-bold text-base text-on-surface">T&P Department</h3>
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                Campus placement drives, Offer Verification hub, Student Directory with progress sidebar, and analytics.
              </p>
            </div>
            <button
              onClick={() => handleDemoPersona('tnp.cs@ghr.edu', 'Tnp@123', '/tnp/dashboard')}
              className="mt-6 w-full py-2.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <span>Explore T&P</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Corporate Recruiter */}
          <div className="bg-white rounded-3xl p-6 border border-outline-variant/80 shadow-sm hover:shadow-card-hover transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4 group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-headline font-bold text-base text-on-surface">Company Recruiter</h3>
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                Post drives, stage pipeline (GD/Interview), Bulk ZIP/PDF offer letter upload with Student ID matcher.
              </p>
            </div>
            <button
              onClick={() => handleDemoPersona('recruiter@google.com', 'Company@123', '/company/dashboard')}
              className="mt-6 w-full py-2.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <span>Explore Company</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* HOD / Super Admin */}
          <div className="bg-white rounded-3xl p-6 border border-outline-variant/80 shadow-sm hover:shadow-card-hover transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-headline font-bold text-base text-on-surface">HOD / Super Admin</h3>
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                System approvals, Class Teacher role transfer with auto data reallocation, and skill gap matrix.
              </p>
            </div>
            <button
              onClick={() => handleDemoPersona('admin@ghr.edu', 'Admin@123', '/admin/dashboard')}
              className="mt-6 w-full py-2.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <span>Explore Admin</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Key Architectural Innovations Section */}
      <section className="bg-surface-container-low py-20 border-t border-outline-variant/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold text-secondary uppercase tracking-widest">Built For Rigor & Transparency</span>
            <h2 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight">
              Institutional Innovations That Matter
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-7 rounded-3xl border border-outline-variant/60 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-headline font-bold text-lg text-on-surface">Google Maps Geofencing (300m)</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Fixed 300m institutional radius verified with Haversine GPS calculations. Displays exact real-time distance from site with optional first check-in photo validation.
              </p>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-outline-variant/60 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="font-headline font-bold text-lg text-on-surface">Automated Friday Reports & GitHub</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Connect GitHub once to calculate live activity scores. Recurring Friday report tasks are automatically scheduled, scored, and certified by mentors.
              </p>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-outline-variant/60 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-headline font-bold text-lg text-on-surface">QR Verified Digital Certificates</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Cryptographically hashed digital certificates generated with jsPDF and real-time QR code validation. Combines profile, reports, and company ratings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant/60 py-12 text-center text-xs text-on-surface-variant space-y-3">
        <div className="flex items-center justify-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold">
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              school
            </span>
          </div>
          <span className="font-headline font-bold text-on-surface text-sm">
            Internship Connect PRO
          </span>
        </div>
        <p className="max-w-md mx-auto text-[11px] text-outline">
          G H Raisoni College of Engineering & Management, Jalgaon. GHR Inter-Track Hackathon 2026. Built with authentic workflows and institutional rigor.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
