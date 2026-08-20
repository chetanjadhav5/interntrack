import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Bell, User, LogOut, ChevronDown, CheckCircle, AlertCircle, Building2, Briefcase, GraduationCap, Shield } from 'lucide-react';

const Navbar = () => {
  const { user, logout, quickSwitchRole } = useAuth();
  const { notifications, totalUnread, markAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const navigate = useNavigate();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'STUDENT':
        return { label: 'Student', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: GraduationCap };
      case 'FACULTY':
        return { label: 'Faculty / Mentor', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: User };
      case 'TNP':
        return { label: 'T&P Department', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Briefcase };
      case 'COMPANY':
        return { label: 'Recruiter / Company', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Building2 };
      case 'ADMIN':
        return { label: 'HOD / Super Admin', color: 'bg-rose-100 text-rose-800 border-rose-200', icon: Shield };
      default:
        return { label: 'Guest', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: User };
    }
  };

  const handleRoleSwitch = async (email, password) => {
    setShowRoleSwitcher(false);
    const res = await quickSwitchRole(email, password);
    if (res.success) {
      if (res.user.role === 'STUDENT') navigate('/student/dashboard');
      else if (res.user.role === 'FACULTY') navigate('/faculty/dashboard');
      else if (res.user.role === 'TNP') navigate('/tnp/dashboard');
      else if (res.user.role === 'COMPANY') navigate('/company/dashboard');
      else if (res.user.role === 'ADMIN') navigate('/admin/dashboard');
    }
  };

  const roleInfo = getRoleBadge(user?.role);
  const RoleIcon = roleInfo.icon;

  return (
    <header className="sticky top-0 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Institution Branding */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm shadow-primary/30 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  school
                </span>
              </div>
              <div>
                <span className="font-headline font-bold text-lg text-on-surface tracking-tight flex items-center gap-1.5">
                  Internship Connect <span className="text-primary font-black">PRO</span>
                </span>
                <span className="text-[11px] text-on-surface-variant font-medium tracking-wide block uppercase">
                  G H Raisoni College of Engineering
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Live Demo Quick Switcher Badge */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high border border-outline-variant text-xs font-semibold text-on-surface hover:bg-surface-container-highest transition-all"
                title="Switch demo persona for testing"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Demo Switcher:</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${roleInfo.color}`}>
                  {roleInfo.label}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant" />
              </button>

              {showRoleSwitcher && (
                <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white border border-outline-variant shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/60">
                    Switch Test Persona
                  </div>
                  <button
                    onClick={() => handleRoleSwitch('alex.patil@ghr.edu', 'Student@123')}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-on-surface">Alex Patil (Student)</p>
                      <p className="text-[11px] text-on-surface-variant">100% Profile Verified | Active Google Intern</p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">Student</span>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('priya.sharma@ghr.edu', 'Student@123')}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-on-surface">Priya Sharma (Student)</p>
                      <p className="text-[11px] text-on-surface-variant">90% Profile Pending | Java Candidate</p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold">90% Pending</span>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('classteacher.cs3@ghr.edu', 'Faculty@123')}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-on-surface">Dr. Suresh Verma (Class Teacher)</p>
                      <p className="text-[11px] text-on-surface-variant">CS 3rd Year | Profile & Report Verifier</p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">Class Teacher</span>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('mentor.cs3@ghr.edu', 'Faculty@123')}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-on-surface">Prof. Anjali Mehta (Mentor)</p>
                      <p className="text-[11px] text-on-surface-variant">Internship Mentor | Certificate Issuer</p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 font-bold">Mentor</span>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('tnp.cs@ghr.edu', 'Tnp@123')}
                    className="w-full text-left px-3 py-2 hover:bg-purple-50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-on-surface">Prof. Rajesh Kulkarni (T&P Head)</p>
                      <p className="text-[11px] text-on-surface-variant">Offer Verifier | Drive Manager</p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-bold">T&P Head</span>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('recruiter@google.com', 'Company@123')}
                    className="w-full text-left px-3 py-2 hover:bg-amber-50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-on-surface">Google India Recruiter</p>
                      <p className="text-[11px] text-on-surface-variant">Bulk Offers | SDE Drive</p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold">Company</span>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('admin@ghr.edu', 'Admin@123')}
                    className="w-full text-left px-3 py-2 hover:bg-rose-50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-on-surface">HOD / Super Admin</p>
                      <p className="text-[11px] text-on-surface-variant">Role Transfers | System Approvals</p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">Admin</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Action Icons & User Profile */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface relative transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {totalUnread > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-error text-on-error text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                      {totalUnread}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-outline-variant shadow-2xl py-3 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 flex items-center justify-between border-b border-outline-variant/60">
                      <div className="flex items-center gap-2">
                        <span className="font-headline font-bold text-sm text-on-surface">Notifications</span>
                        {totalUnread > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                            {totalUnread} New
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-on-surface-variant font-medium">Real-time Updates</span>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant/40">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-on-surface-variant text-xs">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              markAsRead(notif.id);
                              if (notif.link_route) {
                                setShowNotifications(false);
                                navigate(notif.link_route);
                              }
                            }}
                            className={`p-3.5 hover:bg-surface-container-low cursor-pointer transition-colors ${
                              !notif.is_read ? 'bg-primary-container/5 border-l-4 border-primary' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-bold text-on-surface">{notif.title}</p>
                              {!notif.is_read && (
                                <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1"></span>
                              )}
                            </div>
                            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{notif.message}</p>
                            <p className="text-[10px] text-outline mt-2 font-medium">
                              {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Profile or Login CTA */}
            {user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-outline-variant/60">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-on-surface leading-none">
                    {user.profile?.full_name || user.email.split('@')[0]}
                  </p>
                  <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">
                    {user.profile?.department || roleInfo.label}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-xs shadow-sm">
                  {user.profile?.full_name ? user.profile.full_name.charAt(0) : 'U'}
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-lg text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/auth/login"
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 shadow-sm transition-all"
                >
                  Portal Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
