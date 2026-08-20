import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import StudentRegisterPage from './pages/public/StudentRegisterPage';
import FacultyRegisterPage from './pages/public/FacultyRegisterPage';
import TnpRegisterPage from './pages/public/TnpRegisterPage';
import CompanyRegisterPage from './pages/public/CompanyRegisterPage';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfilePage from './pages/student/StudentProfilePage';
import CompanyDirectoryPage from './pages/student/CompanyDirectoryPage';
import SmartEligibilityPage from './pages/student/SmartEligibilityPage';
import MyApplicationsPage from './pages/student/MyApplicationsPage';
import WorkflowTrackerPage from './pages/student/WorkflowTrackerPage';
import ReportSelfPlacedPage from './pages/student/ReportSelfPlacedPage';
import TasksReportsPage from './pages/student/TasksReportsPage';
import PPOOffersPage from './pages/student/PPOOffersPage';
import DocumentVaultPage from './pages/student/DocumentVaultPage';

// Faculty Pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import ProfileVerificationPage from './pages/faculty/ProfileVerificationPage';
import WeeklyReportsPage from './pages/faculty/WeeklyReportsPage';
import ActiveInternsPage from './pages/faculty/ActiveInternsPage';
import CertificationPage from './pages/faculty/CertificationPage';
import FacultyEvaluationPage from './pages/faculty/FacultyEvaluationPage';

// T&P Pages
import TnpDashboard from './pages/tnp/TnpDashboard';
import StudentDirectoryPage from './pages/tnp/StudentDirectoryPage';
import ManageDrivesPage from './pages/tnp/ManageDrivesPage';
import DriveApplicantsPage from './pages/tnp/DriveApplicantsPage';
import TnpVerificationPage from './pages/tnp/TnpVerificationPage';
import TnpSelectedStudentsPage from './pages/tnp/TnpSelectedStudentsPage';
import TnpDefaultersPage from './pages/tnp/TnpDefaultersPage';

// Company Pages
import CompanyDashboard from './pages/company/CompanyDashboard';
import CompanyProfilePage from './pages/company/CompanyProfilePage';
import CompanyDrivesPage from './pages/company/CompanyDrivesPage';
import SelectedStudentsPage from './pages/company/SelectedStudentsPage';
import CompanyEvaluationPage from './pages/company/CompanyEvaluationPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminApprovalsPage from './pages/admin/AdminApprovalsPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';

// Common
import SupportPage from './pages/common/SupportPage';

// Protected Layout with Navbar and dynamic Sidebar
const AppLayout = () => {
  return (
    <div className="h-screen flex flex-col bg-background font-body text-on-surface antialiased selection:bg-primary-container selection:text-on-primary-container overflow-hidden">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Public Layout without Sidebar
const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background font-body text-on-surface antialiased">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

// Route Guard for specific roles
const RoleGuard = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to user's native dashboard
    const roleRoutes = {
      STUDENT: '/student/dashboard',
      FACULTY: '/faculty/dashboard',
      TNP: '/tnp/dashboard',
      COMPANY: '/company/dashboard',
      ADMIN: '/admin/dashboard'
    };
    return <Navigate to={roleRoutes[user.role] || '/'} replace />;
  }

  return <Outlet />;
};

function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register/student" element={<StudentRegisterPage />} />
        <Route path="/auth/register/faculty" element={<FacultyRegisterPage />} />
        <Route path="/auth/register/tnp" element={<TnpRegisterPage />} />
        <Route path="/auth/register/company" element={<CompanyRegisterPage />} />
      </Route>

      {/* Authenticated Portal Routes */}
      <Route element={<AppLayout />}>
        {/* Student Routes */}
        <Route element={<RoleGuard allowedRoles={['STUDENT']} />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/profile" element={<StudentProfilePage />} />
          <Route path="/student/directory" element={<CompanyDirectoryPage />} />
          <Route path="/student/eligibility/:driveId" element={<SmartEligibilityPage />} />
          <Route path="/student/applications" element={<MyApplicationsPage />} />
          <Route path="/student/workflow" element={<WorkflowTrackerPage />} />
          <Route path="/student/self-placed" element={<ReportSelfPlacedPage />} />
          <Route path="/student/tasks-reports" element={<TasksReportsPage />} />
          <Route path="/student/offers-ppo" element={<PPOOffersPage />} />
          <Route path="/student/documents" element={<DocumentVaultPage />} />
          <Route path="/student/vault" element={<DocumentVaultPage />} />
        </Route>

        {/* Faculty Routes */}
        <Route element={<RoleGuard allowedRoles={['FACULTY']} />}>
          <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
          <Route path="/faculty/profile-verification" element={<ProfileVerificationPage />} />
          <Route path="/faculty/weekly-reports" element={<WeeklyReportsPage />} />
          <Route path="/faculty/interns" element={<ActiveInternsPage />} />
          <Route path="/faculty/certification" element={<CertificationPage />} />
          <Route path="/faculty/evaluation" element={<FacultyEvaluationPage />} />
        </Route>

        {/* T&P Routes */}
        <Route element={<RoleGuard allowedRoles={['TNP']} />}>
          <Route path="/tnp/dashboard" element={<TnpDashboard />} />
          <Route path="/tnp/students" element={<StudentDirectoryPage />} />
          <Route path="/tnp/drives" element={<ManageDrivesPage />} />
          <Route path="/tnp/drives/:id/applicants" element={<DriveApplicantsPage />} />
          <Route path="/tnp/selected-students" element={<TnpSelectedStudentsPage />} />
          <Route path="/tnp/verification" element={<TnpVerificationPage />} />
          <Route path="/tnp/defaulters" element={<TnpDefaultersPage />} />
        </Route>

        {/* Company Routes */}
        <Route element={<RoleGuard allowedRoles={['COMPANY']} />}>
          <Route path="/company/dashboard" element={<CompanyDashboard />} />
          <Route path="/company/profile" element={<CompanyProfilePage />} />
          <Route path="/company/drives" element={<CompanyDrivesPage />} />
          <Route path="/company/drives/:id/applicants" element={<DriveApplicantsPage />} />
          <Route path="/company/selected-students" element={<SelectedStudentsPage />} />
          <Route path="/company/evaluation" element={<CompanyEvaluationPage />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<RoleGuard allowedRoles={['ADMIN']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/approvals" element={<AdminApprovalsPage />} />
          <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        </Route>

        {/* Common Help & Support */}
        <Route path="/support" element={<SupportPage />} />
      </Route>

      {/* Fallback wildcard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
