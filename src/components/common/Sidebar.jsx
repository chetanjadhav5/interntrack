import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const Sidebar = () => {
  const { user } = useAuth();
  const { moduleUnreadMap, markModuleAsRead } = useNotifications();
  const location = useLocation();

  if (!user) return null;

  // Define navigation items per role
  const getNavItems = () => {
    switch (user.role) {
      case 'STUDENT':
        return [
          { name: 'Dashboard', path: '/student/dashboard', icon: 'dashboard', moduleKey: 'DASHBOARD' },
          { name: 'My Profile', path: '/student/profile', icon: 'person', moduleKey: 'PROFILE' },
          { name: 'Daily Attendance & Hours', path: '/student/attendance', icon: 'schedule', moduleKey: 'ATTENDANCE' },
          { name: 'Company Directory', path: '/student/directory', icon: 'domain', moduleKey: 'DIRECTORY' },
          { name: 'My Applications', path: '/student/applications', icon: 'assignment_ind', moduleKey: 'APPLICATIONS' },
          { name: 'Workflow Tracker', path: '/student/workflow', icon: 'timeline', moduleKey: 'WORKFLOW' },
          { name: 'Self-Placed Report', path: '/student/self-placed', icon: 'add_location_alt', moduleKey: 'SELF_PLACED' },
          { name: 'Tasks & Friday Reports', path: '/student/tasks-reports', icon: 'fact_check', moduleKey: 'REPORT' },
          { name: 'PPO & Offer Letters', path: '/student/offers-ppo', icon: 'card_giftcard', moduleKey: 'OFFER' },
          { name: 'Document Vault', path: '/student/documents', icon: 'description', moduleKey: 'DOCUMENT' },
          { name: 'Support & Help', path: '/support', icon: 'help_outline', moduleKey: 'SUPPORT' }
        ];

      case 'FACULTY':
        const isClassTeacher = user.profile?.designation === 'CLASS_TEACHER';
        const items = [
          { name: 'Mentor Dashboard', path: '/faculty/dashboard', icon: 'dashboard', moduleKey: 'DASHBOARD' },
          { name: 'Interns', path: '/faculty/interns', icon: 'group', moduleKey: 'INTERNS' },
          { name: 'Weekly Report Review', path: '/faculty/weekly-reports', icon: 'rate_review', moduleKey: 'REPORT' },
          { name: 'Intern Evaluation', path: '/faculty/evaluation', icon: 'assignment_turned_in', moduleKey: 'EVALUATION' },
          { name: 'Certification Module', path: '/faculty/certification', icon: 'military_tech', moduleKey: 'CERTIFICATE' }
        ];

        if (isClassTeacher) {
          items.splice(1, 0, {
            name: 'Profile Verification',
            path: '/faculty/profile-verification',
            icon: 'verified_user',
            moduleKey: 'PROFILE'
          });
        }

        items.push({ name: 'Support & Help', path: '/support', icon: 'help_outline', moduleKey: 'SUPPORT' });
        return items;

      case 'TNP':
        return [
          { name: 'Analytics Dashboard', path: '/tnp/dashboard', icon: 'analytics', moduleKey: 'DASHBOARD' },
          { name: 'Student Directory', path: '/tnp/students', icon: 'badge', moduleKey: 'STUDENTS' },
          { name: 'Manage Postings & Drives', path: '/tnp/drives', icon: 'campaign', moduleKey: 'DRIVES' },
          { name: 'Selected Students & Offers', path: '/tnp/selected-students', icon: 'how_to_reg', moduleKey: 'OFFER' },
          { name: 'Offer Verification Hub', path: '/tnp/verification', icon: 'verified', moduleKey: 'VERIFICATION' },
          { name: 'Defaulters Management', path: '/tnp/defaulters', icon: 'gavel', moduleKey: 'DEFAULTERS' },
          { name: 'Support & Help', path: '/support', icon: 'help_outline', moduleKey: 'SUPPORT' }
        ];

      case 'COMPANY':
        return [
          { name: 'Recruiter Dashboard', path: '/company/dashboard', icon: 'dashboard', moduleKey: 'DASHBOARD' },
          { name: 'Company Profile & Location', path: '/company/profile', icon: 'storefront', moduleKey: 'PROFILE' },
          { name: 'Manage Postings', path: '/company/drives', icon: 'work', moduleKey: 'DRIVES' },
          { name: 'Selected Students & Offers', path: '/company/selected-students', icon: 'how_to_reg', moduleKey: 'OFFER' },
          { name: 'Intern Evaluation & PPO', path: '/company/evaluation', icon: 'grade', moduleKey: 'EVALUATION' },
          { name: 'Support & Help', path: '/support', icon: 'help_outline', moduleKey: 'SUPPORT' }
        ];

      case 'ADMIN':
        return [
          { name: 'HOD / Admin Dashboard', path: '/admin/dashboard', icon: 'dashboard', moduleKey: 'DASHBOARD' },
          { name: 'Approvals & Role Transfer', path: '/admin/approvals', icon: 'admin_panel_settings', moduleKey: 'APPROVALS' },
          { name: 'Institutional Analytics', path: '/admin/analytics', icon: 'insights', moduleKey: 'ANALYTICS' },
          { name: 'Support & Help', path: '/support', icon: 'help_outline', moduleKey: 'SUPPORT' }
        ];

      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 flex-shrink-0 bg-surface-container-low border-r border-outline-variant/60 flex flex-col h-full overflow-hidden p-3">
      {/* Workspace Header */}
      <div className="mb-4 px-3 py-2 flex items-center gap-3 bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold shadow-sm">
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            account_circle
          </span>
        </div>
        <div className="overflow-hidden">
          <p className="font-headline font-bold text-xs text-on-surface truncate">
            {user.profile?.full_name || 'Portal User'}
          </p>
          <p className="text-[11px] text-on-surface-variant font-medium capitalize truncate">
            {user.role.toLowerCase()} Workspace
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const hasUnread = Boolean(moduleUnreadMap[item.moduleKey] && moduleUnreadMap[item.moduleKey] > 0);
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (hasUnread) markModuleAsRead(item.moduleKey);
              }}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-primary-container text-on-primary shadow-sm shadow-primary/20'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`
              }
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.name}</span>
              </div>

              {/* Unread Circular Dot Indicator */}
              {hasUnread && (
                <span className="w-2.5 h-2.5 rounded-full bg-error ring-2 ring-white animate-pulse flex-shrink-0" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Institutional Trust Footer */}
      <div className="pt-3 mt-auto border-t border-outline-variant/60 text-center">
        <p className="text-[10px] text-on-surface-variant font-medium">
          GHR Inter-Track IMS v2.4
        </p>
        <p className="text-[9px] text-outline">
          Authentic & Data-Driven
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
