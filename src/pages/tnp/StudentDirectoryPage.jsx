import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Users,
  Search,
  Bell,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Award,
  FileText,
  MapPin,
  Calendar,
  X,
  Loader2,
  ShieldAlert
} from 'lucide-react';

const StudentDirectoryPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentProgress, setStudentProgress] = useState(null);
  const [progressLoading, setProgressLoading] = useState(false);

  // Ping bell alert state
  const [pingMessage, setPingMessage] = useState('');
  const [pingError, setPingError] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/tnp/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStudentProfile = async (studId) => {
    setSelectedStudentId(studId);
    setProgressLoading(true);
    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch(`/api/tnp/students/${studId}/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudentProgress(data);
      }
    } catch (err) {
      console.error('Error fetching student progress:', err);
    } finally {
      setProgressLoading(false);
    }
  };

  const handleNotifyClassTeacher = async (studentId, studentName) => {
    setPingMessage('');
    setPingError('');
    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch(`/api/tnp/students/${studentId}/notify-classteacher`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPingMessage(`Notification ping dispatched to Class Teacher for ${studentName}!`);
        setTimeout(() => setPingMessage(''), 4000);
      } else {
        setPingError(data.error || 'Failed to ping class teacher');
      }
    } catch {
      setPingError('Network error sending reminder notification');
    }
  };

  const filtered = students.filter(
    (s) =>
      s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id?.toLowerCase().includes(search.toLowerCase()) ||
      s.branch?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Department Records</span>
            <h1 className="font-headline font-black text-2xl sm:text-3xl text-on-surface tracking-tight mt-0.5">
              Student Placement Directory
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Department-scoped candidate directory tracking profile verification status and 8-step milestone progression.
            </p>
          </div>

          <Link
            to="/tnp/defaulters"
            className="px-4 py-2.5 rounded-2xl bg-rose-50 text-rose-900 border border-rose-200 hover:bg-rose-100 font-bold text-xs flex items-center gap-2 shadow-sm transition-all flex-shrink-0"
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Defaulters Management</span>
          </Link>
        </div>

        {pingMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{pingMessage}</span>
          </div>
        )}

        {pingError && (
          <div className="p-3.5 rounded-2xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{pingError}</span>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-4 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student by name, roll number, or branch..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-outline-variant bg-surface-container-low text-xs font-medium text-on-surface focus:bg-white focus:ring-2 focus:ring-purple-600 outline-none transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm">
        {filtered.length === 0 ? (
          <p className="text-xs text-on-surface-variant py-10 text-center">No students found matching query.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-outline-variant/60 text-on-surface-variant font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Student & PRN</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4 text-center">CGPA</th>
                  <th className="py-3 px-4 text-center">Profile Verification Status</th>
                  <th className="py-3 px-4">Active Placement</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3.5 px-4 font-bold text-on-surface">
                      <p>{s.full_name}</p>
                      <p className="text-[10px] text-on-surface-variant font-normal">{s.student_id}</p>
                    </td>
                    <td className="py-3.5 px-4 text-on-surface font-medium">{s.branch}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-primary">{s.current_cgpa}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <StatusBadge status={s.verification_status} size="xs" />
                        {/* Bell Icon to Ping Class Teacher */}
                        <button
                          type="button"
                          onClick={() => handleNotifyClassTeacher(s.id, s.full_name)}
                          className="p-1.5 rounded-full hover:bg-purple-100 text-purple-700 transition-colors"
                          title="Send Verification Reminder to Class Teacher"
                        >
                          <Bell className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {s.active_internship ? (
                        <div>
                          <p className="font-bold text-on-surface">{s.active_internship.company_name}</p>
                          <p className="text-[10px] text-on-surface-variant">{s.active_internship.role}</p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-outline italic">No active internship</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenStudentProfile(s.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-[11px] transition-colors"
                      >
                        View Profile & Progress
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enhanced View Profile Drawer with Right Sidebar "Internship Progress" */}
      {selectedStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-5xl rounded-3xl bg-white border border-outline-variant shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
            {/* Top Modal Header */}
            <div className="bg-surface-container-high px-6 py-4 border-b border-outline-variant/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
                  {studentProgress?.student?.full_name?.charAt(0) || 'S'}
                </div>
                <div>
                  <h3 className="font-headline font-bold text-base text-on-surface">
                    {studentProgress?.student?.full_name}
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {studentProgress?.student?.student_id} | {studentProgress?.student?.branch}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentId(null)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-highest"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split Body: Main Profile & Internship Records vs Right Sidebar "Internship Progress" */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-outline-variant/60">
              {/* Left 2 Cols: Student Info & Enhanced Internship Records */}
              <div className="lg:col-span-2 p-6 space-y-6">
                {/* Academic & Skills Section */}
                <div className="space-y-3">
                  <h4 className="font-headline font-bold text-xs uppercase tracking-wider text-purple-800">
                    Academic Qualifications & Proficiencies
                  </h4>
                  <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-surface-container-low text-xs border border-outline-variant/60">
                    <div>
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase block">CGPA</span>
                      <span className="font-headline font-bold text-sm text-emerald-700">
                        {studentProgress?.student?.current_cgpa} / 10
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Live Backlogs</span>
                      <span className="font-headline font-bold text-sm text-on-surface">
                        {studentProgress?.student?.current_backlogs}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase block">GitHub Score</span>
                      <span className="font-headline font-bold text-sm text-secondary">
                        {studentProgress?.student?.github_score || 0} pts
                      </span>
                    </div>
                  </div>
                </div>

                {/* Enhanced Internship Records Module */}
                <div className="space-y-4">
                  <h4 className="font-headline font-bold text-xs uppercase tracking-wider text-purple-800">
                    Internship Records & Evaluation Modules
                  </h4>

                  {studentProgress?.internship ? (
                    <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/60 space-y-4 text-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-bold text-primary text-[11px] uppercase">
                            {studentProgress.internship.placement_type.replace('_', ' ')}
                          </span>
                          <h5 className="font-headline font-bold text-base text-on-surface mt-0.5">
                            {studentProgress.internship.company_name} — {studentProgress.internship.role_position}
                          </h5>
                          <p className="text-on-surface-variant text-[11px] flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 text-secondary" />
                            {studentProgress.internship.office_address}
                          </p>
                        </div>
                        <StatusBadge status={studentProgress.internship.status} size="xs" />
                      </div>

                      {/* Submodules Strip */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-outline-variant/40 text-[11px]">
                        <div className="p-2.5 rounded-xl bg-white border border-outline-variant/60">
                          <span className="text-[10px] text-on-surface-variant font-bold block">Mentor Info</span>
                          <span className="font-bold text-on-surface">Prof. Anjali Mehta</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-outline-variant/60">
                          <span className="text-[10px] text-on-surface-variant font-bold block">Verification</span>
                          <span className="font-bold text-emerald-700">T&P Approved</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-outline-variant/60">
                          <span className="text-[10px] text-on-surface-variant font-bold block">Logbook Reports</span>
                          <span className="font-bold text-primary">Weekly Ongoing</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-outline-variant/60">
                          <span className="text-[10px] text-on-surface-variant font-bold block">Final Eval Score</span>
                          <span className="font-bold text-purple-700">
                            {studentProgress.internship.final_internship_score ? `${studentProgress.internship.final_internship_score}%` : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-on-surface-variant italic">No internship records found for student.</p>
                  )}
                </div>
              </div>

              {/* Right Sidebar: "Internship Progress" Stepper & Milestones */}
              <div className="p-6 bg-surface-container-low/50 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-on-surface">Overall Internship Progress</span>
                    <span className="text-purple-700 font-black">{studentProgress?.progress_percent || 0}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-surface-container-high overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full transition-all duration-500"
                      style={{ width: `${studentProgress?.progress_percent || 0}%` }}
                    ></div>
                  </div>
                  <div className="pt-1">
                    <StatusBadge status={studentProgress?.current_status} size="xs" />
                  </div>
                </div>

                {/* 8 Milestone Checkpoints */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                    8-Stage Milestone Checklist
                  </span>

                  <div className="space-y-2 text-xs">
                    {(studentProgress?.milestones || []).map((m, idx) => (
                      <div
                        key={m.key}
                        className={`p-2.5 rounded-xl border flex items-center justify-between ${
                          m.completed
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                            : 'bg-white border-outline-variant/60 text-on-surface-variant'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              m.completed ? 'bg-emerald-600 text-white' : 'bg-surface-container-high text-outline'
                            }`}
                          >
                            {m.completed ? '✓' : idx + 1}
                          </span>
                          <span className="font-semibold">{m.label}</span>
                        </div>
                        {m.completed && <span className="text-[10px] font-bold text-emerald-700">Done</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDirectoryPage;
