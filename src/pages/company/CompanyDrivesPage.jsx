import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import OpenStreetMapPicker from '../../components/common/OpenStreetMapPicker';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Building2,
  Plus,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Loader2,
  Radio,
  Info,
  Lock,
  Unlock,
  ExternalLink,
  Clock,
  Video,
  FileText,
  Globe
} from 'lucide-react';

const CompanyDrivesPage = () => {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Card Action Modals
  const [activeDriveForDetails, setActiveDriveForDetails] = useState(null);
  const [activeDriveForEvent, setActiveDriveForEvent] = useState(null);

  // Broadcast Event Form State
  const [eventTargetStage, setEventTargetStage] = useState('ALL');
  const [eventTitle, setEventTitle] = useState('Technical Interview Round 1');
  const [eventScheduledAt, setEventScheduledAt] = useState('2026-08-25T10:30');
  const [eventVenueOrLink, setEventVenueOrLink] = useState('https://meet.google.com/ghr-campus-eval');
  const [eventNotes, setEventNotes] = useState('Please join 10 minutes prior with your resume, government ID, and GitHub repository.');
  const [broadcasting, setBroadcasting] = useState(false);

  // Create Drive Form State
  const [title, setTitle] = useState('');
  const [rolePosition, setRolePosition] = useState('Software Engineering Intern');
  const [internshipMode, setInternshipMode] = useState('ON_SITE'); // ON_SITE vs REMOTE
  const [stipend, setStipend] = useState('50000');
  const [duration, setDuration] = useState('6');
  const [openings, setOpenings] = useState('5');
  const [minCgpa, setMinCgpa] = useState('7.5');
  const [maxBacklogs, setMaxBacklogs] = useState('0');
  const [allowedBranches, setAllowedBranches] = useState(['Computer Science and Engineering', 'Information Technology']);
  const [deadline, setDeadline] = useState('2026-09-30T23:59');
  const [skillsInput, setSkillsInput] = useState('React, Python, SQL');

  // Google Maps Coordinates
  const [officeAddress, setOfficeAddress] = useState('EON Free Zone, Kharadi, Pune, Maharashtra 411014');
  const [latitude, setLatitude] = useState(18.5529);
  const [longitude, setLongitude] = useState(73.9497);

  const [creating, setCreating] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/company/drives', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDrives(data);
      }
    } catch (err) {
      console.error('Error fetching drives:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (loc) => {
    setOfficeAddress(loc.address);
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
  };

  const handleToggleStatus = async (drive) => {
    setStatusUpdating(drive.id);
    setActionMsg('');
    setActionErr('');

    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch(`/api/company/drives/${drive.id}/toggle-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: drive.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE'
        })
      });

      const resData = await res.json();
      if (res.ok) {
        setActionMsg(resData.message);
        fetchDrives();
      } else {
        setActionErr(resData.error || 'Failed to toggle drive status');
      }
    } catch {
      setActionErr('Network error updating drive status');
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleBroadcastEvent = async (e) => {
    e.preventDefault();
    if (!activeDriveForEvent || !eventTitle || !eventScheduledAt) {
      setActionErr('Event title and scheduled time are required.');
      return;
    }

    setBroadcasting(true);
    setActionMsg('');
    setActionErr('');

    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch(`/api/company/drives/${activeDriveForEvent.id}/broadcast-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          target_stage: eventTargetStage,
          event_title: eventTitle,
          scheduled_at: eventScheduledAt,
          venue_or_link: eventVenueOrLink,
          notes: eventNotes
        })
      });

      const resData = await res.json();
      if (res.ok) {
        setActionMsg(resData.message);
        setActiveDriveForEvent(null);
        fetchDrives();
      } else {
        setActionErr(resData.error || 'Failed to broadcast event');
      }
    } catch {
      setActionErr('Network error broadcasting event');
    } finally {
      setBroadcasting(false);
    }
  };

  const handleCreateDrive = async (e) => {
    e.preventDefault();
    if (!title || !rolePosition || !deadline) {
      setActionErr('Please fill in title, role, and deadline.');
      return;
    }

    setCreating(true);
    setActionMsg('');
    setActionErr('');

    const parsedSkills = skillsInput.split(',').map((s) => s.trim()).filter(Boolean);

    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/company/drives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          role_position: rolePosition,
          internship_mode: internshipMode,
          stipend_amount: stipend,
          duration_months: duration,
          openings_count: openings,
          min_cgpa: minCgpa,
          max_backlogs: maxBacklogs,
          allowed_branches: allowedBranches,
          required_skills: parsedSkills,
          work_location_address: officeAddress,
          latitude,
          longitude,
          deadline,
          status: 'ACTIVE'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setActionMsg('Drive posted successfully and published to student directory!');
        setShowCreateModal(false);
        fetchDrives();
      } else {
        setActionErr(data.error || 'Failed to create drive');
      }
    } catch {
      setActionErr('Network error creating drive');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Recruitment Operations</span>
            <h1 className="font-headline font-black text-2xl sm:text-3xl text-on-surface tracking-tight mt-0.5">
              Campus Placement Drives
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Create and manage job postings, define eligibility rules, broadcast assessment events, and manage candidate pipelines.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-2xl bg-amber-700 text-white font-bold text-xs hover:bg-amber-800 shadow-md flex items-center gap-1.5 self-start sm:self-auto transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Post Campus Drive</span>
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {actionErr && (
        <div className="p-4 rounded-2xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionErr}</span>
        </div>
      )}

      {/* Drives Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {drives.map((drive) => {
          const isClosed = drive.status === 'CLOSED';

          return (
            <div
              key={drive.id}
              className={`bg-surface-container-lowest rounded-3xl p-6 border transition-all flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md ${
                isClosed ? 'border-outline-variant/80 opacity-80' : 'border-outline-variant/60'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-headline font-bold text-lg text-on-surface">{drive.title}</h3>
                    <p className="text-xs text-on-surface-variant font-medium">{drive.role_position}</p>
                  </div>
                  <StatusBadge status={drive.status} />
                </div>

                <div className="grid grid-cols-3 gap-2 p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/60 text-center text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Applicants</span>
                    <span className="font-headline font-extrabold text-sm text-primary">{drive.applicants_count || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Openings</span>
                    <span className="font-headline font-extrabold text-sm text-on-surface">{drive.openings_count}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">Selected</span>
                    <span className="font-headline font-extrabold text-sm text-emerald-700">{drive.selected_count || 0}</span>
                  </div>
                </div>
              </div>

              {/* Primary Pipeline Action */}
              <Link
                to={`/company/drives/${drive.id}/applicants`}
                className="w-full py-2.5 rounded-xl bg-amber-700 text-white hover:bg-amber-800 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <span>Manage Applicant Pipeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              {/* 3 Prominent Card Actions: Post Event, Details, Close Drive */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-outline-variant/40 text-[11px]">
                {/* Option 1: Post Event */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveDriveForEvent(drive);
                    setEventTargetStage('ALL');
                    setActionMsg('');
                    setActionErr('');
                  }}
                  className="py-2 px-2.5 rounded-xl bg-purple-50 text-purple-900 hover:bg-purple-100 font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <Radio className="w-3.5 h-3.5 text-purple-700" />
                  <span>Post Event</span>
                </button>

                {/* Option 2: Details */}
                <button
                  type="button"
                  onClick={() => setActiveDriveForDetails(drive)}
                  className="py-2 px-2.5 rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-container-highest font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <Info className="w-3.5 h-3.5 text-primary" />
                  <span>Details</span>
                </button>

                {/* Option 3: Close / Reopen Drive */}
                <button
                  type="button"
                  disabled={statusUpdating === drive.id}
                  onClick={() => handleToggleStatus(drive)}
                  className={`py-2 px-2.5 rounded-xl font-bold flex items-center justify-center gap-1 transition-colors ${
                    isClosed
                      ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                  }`}
                >
                  {statusUpdating === drive.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isClosed ? (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Reopen</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-rose-600" />
                      <span>Close Drive</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Broadcast Event Modal */}
      {activeDriveForEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-white border border-outline-variant shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-purple-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-200">
                  Broadcast Announcement & Schedule
                </span>
                <h3 className="font-headline font-bold text-base">
                  Post Recruitment Event — {activeDriveForEvent.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveDriveForEvent(null)}
                className="p-1 rounded-lg text-purple-200 hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBroadcastEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  Target Audience Stage
                </label>
                <select
                  value={eventTargetStage}
                  onChange={(e) => setEventTargetStage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-semibold focus:ring-2 focus:ring-purple-600 outline-none"
                >
                  <option value="ALL">All Applicants (Broadcast to all applied candidates)</option>
                  <option value="APPLIED">Applied Stage Candidates Only</option>
                  <option value="GD">GD Round Candidates Only</option>
                  <option value="INTERVIEW">Interview Round Candidates Only</option>
                  <option value="SELECTED">Selected Candidates Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  Event Title / Name
                </label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  required
                  placeholder="e.g. Technical Interview Round 1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-semibold focus:ring-2 focus:ring-purple-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Event Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={eventScheduledAt}
                    onChange={(e) => setEventScheduledAt(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-semibold focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Venue or Video Meeting Link
                  </label>
                  <input
                    type="text"
                    value={eventVenueOrLink}
                    onChange={(e) => setEventVenueOrLink(e.target.value)}
                    placeholder="https://meet.google.com/xyz or Room 402"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-semibold focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  Instructions & Candidate Notes
                </label>
                <textarea
                  rows={3}
                  value={eventNotes}
                  onChange={(e) => setEventNotes(e.target.value)}
                  placeholder="Specific preparation requirements, resume checklist, or instructions..."
                  className="w-full p-3 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-purple-600 outline-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/40">
                <button
                  type="button"
                  onClick={() => setActiveDriveForEvent(null)}
                  className="px-4 py-2.5 rounded-xl border border-outline-variant text-xs font-bold hover:bg-surface-container-high"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={broadcasting}
                  className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  {broadcasting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
                  <span>Broadcast Event to Candidates</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drive Details Modal */}
      {activeDriveForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-white border border-outline-variant shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-surface-container-high px-6 py-4 border-b border-outline-variant/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                  {activeDriveForDetails.company_name}
                </span>
                <h3 className="font-headline font-bold text-lg text-on-surface">
                  {activeDriveForDetails.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveDriveForDetails(null)}
                className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-highest"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/60">
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Role Position</span>
                  <span className="font-bold text-sm text-on-surface">{activeDriveForDetails.role_position}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Monthly Stipend</span>
                  <span className="font-bold text-sm text-emerald-700">₹{Number(activeDriveForDetails.stipend_amount || 50000).toLocaleString()}/mo</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Duration</span>
                  <span className="font-bold text-sm text-on-surface">{activeDriveForDetails.duration_months} Months</span>
                </div>
                <StatusBadge status={activeDriveForDetails.status} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/60">
                  <span className="text-[10px] text-on-surface-variant font-bold block">Openings</span>
                  <span className="font-bold text-on-surface">{activeDriveForDetails.openings_count} seats</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/60">
                  <span className="text-[10px] text-on-surface-variant font-bold block">Min CGPA</span>
                  <span className="font-bold text-primary">{activeDriveForDetails.min_cgpa} CGPA</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/60">
                  <span className="text-[10px] text-on-surface-variant font-bold block">Max Backlogs</span>
                  <span className="font-bold text-on-surface">{activeDriveForDetails.max_backlogs} allowed</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/60">
                  <span className="text-[10px] text-on-surface-variant font-bold block">Deadline</span>
                  <span className="font-bold text-rose-700">{new Date(activeDriveForDetails.deadline).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Location */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/60 space-y-1">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                  Work Location & Geofence Site
                </span>
                <p className="font-medium text-on-surface flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                  <span>{activeDriveForDetails.work_location_address}</span>
                </p>
                <p className="text-[10px] text-outline font-mono">
                  Coordinates: {activeDriveForDetails.latitude}, {activeDriveForDetails.longitude} (300m Geofence)
                </p>
              </div>

              {/* Skills */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  Required Competencies & Skills
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(activeDriveForDetails.required_skills || ['React', 'Python', 'SQL']).map((skill, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 text-[11px] font-bold">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-surface-container-high px-6 py-3 border-t border-outline-variant/60 flex items-center justify-between">
              <Link
                to={`/company/drives/${activeDriveForDetails.id}/applicants`}
                className="px-4 py-2 rounded-xl bg-amber-700 text-white font-bold text-xs hover:bg-amber-800"
              >
                Go to Applicant Pipeline
              </Link>
              <button
                onClick={() => setActiveDriveForDetails(null)}
                className="px-4 py-2 rounded-xl border border-outline-variant text-xs font-bold hover:bg-surface-container-highest"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Drive Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-3xl rounded-3xl bg-white border border-outline-variant shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95">
            <div className="bg-surface-container-high px-6 py-4 border-b border-outline-variant/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Drive Setup</span>
                <h3 className="font-headline font-bold text-lg text-on-surface">Post Campus Placement Opening</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-highest"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDrive} className="flex-1 overflow-y-auto p-6 space-y-5">
              {actionErr && (
                <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{actionErr}</span>
                </div>
              )}

              {/* Internship Work Mode */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                  Internship Working Mode <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setInternshipMode('ON_SITE')}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                      internshipMode === 'ON_SITE'
                        ? 'bg-amber-50/80 border-amber-600 shadow-sm ring-2 ring-amber-600/20'
                        : 'bg-surface-container-low border-outline-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      internshipMode === 'ON_SITE' ? 'bg-amber-700 text-white' : 'bg-surface-container-highest text-on-surface-variant'
                    }`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs text-on-surface">🏢 On-Site (Office)</h4>
                        {internshipMode === 'ON_SITE' && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-700 text-white text-[9px] font-black">SELECTED</span>
                        )}
                      </div>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">300m GPS geofence + Biometric Face ID attendance.</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInternshipMode('REMOTE')}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                      internshipMode === 'REMOTE'
                        ? 'bg-purple-50/80 border-purple-600 shadow-sm ring-2 ring-purple-600/20'
                        : 'bg-surface-container-low border-outline-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      internshipMode === 'REMOTE' ? 'bg-purple-600 text-white' : 'bg-surface-container-highest text-on-surface-variant'
                    }`}>
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs text-on-surface">🌐 Remote (Work From Home)</h4>
                        {internshipMode === 'REMOTE' && (
                          <span className="px-1.5 py-0.2 rounded bg-purple-600 text-white text-[9px] font-black">SELECTED</span>
                        )}
                      </div>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">Direct check-in; mandatory daily work proof on checkout.</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Drive Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g. Software Development Engineer Intern"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-amber-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Role Position Title
                  </label>
                  <input
                    type="text"
                    value={rolePosition}
                    onChange={(e) => setRolePosition(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-amber-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Monthly Stipend (INR)
                  </label>
                  <input
                    type="number"
                    value={stipend}
                    onChange={(e) => setStipend(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-amber-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Openings Count
                  </label>
                  <input
                    type="number"
                    value={openings}
                    onChange={(e) => setOpenings(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-amber-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Minimum CGPA Threshold
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={minCgpa}
                    onChange={(e) => setMinCgpa(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-amber-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Application Deadline
                  </label>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-amber-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  Required Skills (Comma separated)
                </label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="e.g. React, Node.js, SQL, Docker"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-amber-600 outline-none"
                />
              </div>

              {/* OpenStreetMap Office Location Picker */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                  Office Work Location & Geofence (300m Institutional Radius)
                </label>
                <OpenStreetMapPicker
                  initialAddress={officeAddress}
                  initialLat={latitude}
                  initialLng={longitude}
                  onLocationSelect={handleLocationSelect}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/60">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-outline-variant text-xs font-bold hover:bg-surface-container-high transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Publish Campus Drive</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDrivesPage;
