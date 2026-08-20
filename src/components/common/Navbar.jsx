import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Bell, User, LogOut, ChevronDown, CheckCircle, AlertCircle, Building2, Briefcase, GraduationCap, Shield } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { notifications, totalUnread, markAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
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

  const roleInfo = getRoleBadge(user?.role);
  const RoleIcon = roleInfo.icon;

  return (
    <header className="sticky top-0 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Institution Branding */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-white border border-brand-border/80 p-1 flex items-center justify-center shadow-sm shadow-brand/10 group-hover:scale-105 group-hover:border-brand transition-all overflow-hidden">
                <img
                  src="/logo.png"
                  alt="RaiSakshya Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="font-headline font-bold text-lg text-on-surface tracking-tight flex items-center gap-0.5">
                  Rai<span className="text-brand font-black tracking-tight">Sakshya</span>
                </span>
                <span className="text-[11px] text-on-surface-variant font-medium tracking-wide block uppercase">
                  G H Raisoni College of Engineering
                </span>
              </div>
            </Link>
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
