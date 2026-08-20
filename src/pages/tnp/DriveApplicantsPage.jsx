import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Users,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Loader2,
  Lock,
  Unlock,
  Radio,
  Info,
  X,
  MapPin,
  Clock,
  Video
} from 'lucide-react';

const DriveApplicantsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [drive, setDrive] = useState(null);
  const [applicants, setApplicants] = useState({ all: [], applied: [], gd: [], interview: [], selected: [], rejected: [] });
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [stageUpdating, setStageUpdating] = useState(null);
  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');

  // Modals for Post Event and Drive Details
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Broadcast Event Form State
  const [eventTargetStage, setEventTargetStage] = useState('ALL');
  const [eventTitle, setEventTitle] = useState('Technical Interview Round 1');
  const [eventScheduledAt, setEventScheduledAt] = useState('2026-08-25T10:30');
  const [eventVenueOrLink, setEventVenueOrLink] = useState('https://meet.google.com/ghr-campus-interview');
  const [eventNotes, setEventNotes] = useState('Please join 10 minutes prior with your resume and GitHub repository.');
  const [broadcasting, setBroadcasting] = useState(false);

  useEffect(() => {
    fetchApplicants();
  }, [id, user]);

  const fetchApplicants = async () => {
    try {
      const token = localStorage.getItem('ghr_token');
      // Use role-appropriate endpoint
      const primaryEndpoint = user?.role === 'TNP'
        ? `/api/tnp/drives/${id}/applicants`
        : `/api/company/drives/${id}/applicants`;

      let res = await fetch(primaryEndpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Seamless fallback if needed
      if (!res.ok) {
        const fallbackEndpoint = user?.role === 'TNP'
          ? `/api/company/drives/${id}/applicants`
          : `/api/tnp/drives/${id}/applicants`;
        res = await fetch(fallbackEndpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      if (res.ok) {
        const data = await res.json();
        setDrive(data.drive);
        setApplicants(data.applicants || { all: [], applied: [], gd: [], interview: [], selected: [], rejected: [] });
      }
    } catch (err) {
      console.error('Error loading applicants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStageTransition = async (appId, newStage) => {
    setStageUpdating(appId);
    setActionMsg('');
    setActionErr('');

    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch(`/api/tnp/drives/${id}/applicants/${appId}/stage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          new_stage: newStage,
          event_details: {
            venue_or_link: 'Campus Portal Scheduled',
            notes: `Candidate moved to ${newStage} stage.`
          }
        })
      });

      const data = await res.json();
      if (res.ok) {
        setActionMsg(data.message);
        fetchApplicants();
      } else {
        setActionErr(data.error || 'Failed to update stage');
      }
    } catch {
      setActionErr('Network error updating applicant stage');
    } finally {
      setStageUpdating(null);
    }
  };

  const handleToggleStatus = async () => {
    if (!drive) return;
    setStatusUpdating(true);
    setActionMsg('');
    setActionErr('');

    try {
      const token = localStorage.getItem('ghr_token');
      const endpoint = user?.role === 'TNP'
        ? `/api/tnp/drives/${drive.id}/toggle-status`
        : `/api/company/drives/${drive.id}/toggle-status`;

      const res = await fetch(endpoint, {
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
        setDrive(resData.drive);
      } else {
        setActionErr(resData.error || 'Failed to toggle drive status');
      }
    } catch {
      setActionErr('Network error updating drive status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleBroadcastEvent = async (e) => {
    e.preventDefault();
    if (!drive || !eventTitle || !eventScheduledAt) {
      setActionErr('Event title and scheduled time are required.');
      return;
    }

    setBroadcasting(true);
    setActionMsg('');
    setActionErr('');

    try {
      const token = localStorage.getItem('ghr_token');
      const endpoint = user?.role === 'TNP'
        ? `/api/tnp/drives/${drive.id}/broadcast-event`
        : `/api/company/drives/${drive.id}/broadcast-event`;

      const res = await fetch(endpoint, {
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
        setShowEventModal(false);
        fetchApplicants();
      } else {
        setActionErr(resData.error || 'Failed to broadcast event');
      }
    } catch {
      setActionErr('Network error broadcasting event');
    } finally {
      setBroadcasting(false);
    }
  };

  // Open broadcast modal synced with current active tab
  const openBroadcastForCurrentTab = () => {
    let target = 'ALL';
    let defaultTitle = 'Campus Recruitment Event';
    if (activeTab === 'applied') {
      target = 'APPLIED';
      defaultTitle = 'Document Verification & Screening';
    } else if (activeTab === 'gd') {
      target = 'GD';
      defaultTitle = 'Group Discussion Round Schedule';
    } else if (activeTab === 'interview') {
      target = 'INTERVIEW';
      defaultTitle = 'Technical & HR Interview Round';
    } else if (activeTab === 'selected') {
      target = 'SELECTED';
      defaultTitle = 'Selection Announcement & Onboarding Briefing';
    }

    setEventTargetStage(target);
    setEventTitle(defaultTitle);
    setShowEventModal(true);
    setActionMsg('');
    setActionErr('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const currentApplicants = applicants[activeTab] || [];
  const isMyDrive = drive?.created_by_user_id === user?.id || Boolean(drive?.is_my_drive);
  const isCreatorOrAdmin = isMyDrive || user?.role === 'ADMIN';
  const canPostEvent = isCreatorOrAdmin;
  const isClosed = drive?.status === 'CLOSED';

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        to={user?.role === 'COMPANY' ? '/company/drives' : '/tnp/drives'}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Placement Drives</span>
      </Link>

      {/* Header */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">{drive?.company_name}</span>
              <StatusBadge status={drive?.status || 'ACTIVE'} size="xs" />
              {user?.role === 'TNP' && (
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isMyDrive ? 'bg-purple-100 text-purple-900 border border-purple-200' : 'bg-surface-container-high text-on-surface-variant'
                }`}>
                  {isMyDrive ? 'T&P Department Posting' : 'Corporate Recruiter Posting'}
                </span>
              )}
            </div>
            <h1 className="font-headline font-black text-2xl sm:text-3xl text-on-surface tracking-tight mt-0.5">
              {drive?.title} — Applicant Pipeline
            </h1>
            <p className="text-xs text-on-surface-variant mt-1">
              Position: <strong>{drive?.role_position}</strong> | Openings: <strong>{drive?.openings_count}</strong> | Total Applicants: <strong>{applicants.all?.length || 0}</strong>
            </p>
          </div>

          {/* 3 Prominent Header Actions: Post Event, Details, Close Drive */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Action 1: Post Event (Only enabled if drive was posted by current user / T&P) */}
            {canPostEvent ? (
              <button
                type="button"
                onClick={openBroadcastForCurrentTab}
                className="px-4 py-2.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md shadow-purple-700/20 flex items-center gap-1.5 transition-all"
              >
                <Radio className="w-4 h-4" />
                <span>Post Event ({activeTab.toUpperCase()})</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                title="T&P can only post recruitment events on drives posted by the T&P Cell. Corporate drives are managed by their respective company recruiters."
                className="px-4 py-2.5 rounded-2xl bg-surface-container-high text-on-surface-variant/60 cursor-not-allowed font-bold text-xs flex items-center gap-1.5 border border-outline-variant/60 opacity-80"
              >
                <Radio className="w-4 h-4 text-outline" />
                <span>Post Event (Company Managed)</span>
              </button>
            )}

            {/* Action 2: Details */}
            <button
              type="button"
              onClick={() => setShowDetailsModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Info className="w-4 h-4 text-primary" />
              <span>Drive Details</span>
            </button>

            {/* Action 3: Close / Reopen Drive */}
            {isCreatorOrAdmin && (
              <button
                type="button"
                disabled={statusUpdating}
                onClick={handleToggleStatus}
                className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                  isClosed
                    ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                    : 'bg-rose-100 text-rose-900 hover:bg-rose-200'
                }`}
              >
                {statusUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isClosed ? (
                  <>
                    <Unlock className="w-4 h-4 text-emerald-700" />
                    <span>Reopen Drive</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-rose-700" />
                    <span>Close Drive</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Stage Filter Tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-outline-variant/40">
          {[
            { key: 'all', label: `All Applicants (${applicants.all?.length || 0})` },
            { key: 'applied', label: `Applied (${applicants.applied?.length || 0})` },
            { key: 'gd', label: `GD Round (${applicants.gd?.length || 0})` },
            { key: 'interview', label: `Interview (${applicants.interview?.length || 0})` },
            { key: 'selected', label: `Selected (${applicants.selected?.length || 0})` },
            { key: 'rejected', label: `Rejected (${applicants.rejected?.length || 0})` }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.key
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {tab.label}
            </button>
          ))}
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

      {/* Applicants Table */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm">
        {currentApplicants.length === 0 ? (
          <div className="text-center py-12 space-y-2 text-on-surface-variant text-xs">
            <Users className="w-8 h-8 text-outline mx-auto" />
            <p className="font-bold text-on-surface">No applicants in {activeTab.toUpperCase()} stage</p>
            <p>Use the stage dropdown on any applicant to transition them into this stage.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-outline-variant/60 text-on-surface-variant font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Candidate & PRN</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4 text-center">CGPA</th>
                  <th className="py-3 px-4 text-center">GitHub Score</th>
                  <th className="py-3 px-4 text-center">Current Stage</th>
                  <th className="py-3 px-4 text-right">Transition Pipeline Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {currentApplicants.map((app) => (
                  <tr key={app.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3.5 px-4 font-bold text-on-surface">
                      <p>{app.student_name}</p>
                      <p className="text-[10px] text-on-surface-variant font-normal font-mono">{app.student_roll}</p>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-on-surface">{app.branch}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-primary">{app.cgpa}</td>
                    <td className="py-3.5 px-4 text-center font-semibold text-secondary">
                      {app.github_score ? `${app.github_score} pts` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={app.current_stage} size="xs" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isCreatorOrAdmin ? (
                        <select
                          value={app.current_stage}
                          disabled={stageUpdating === app.id}
                          onChange={(e) => handleStageTransition(app.id, e.target.value)}
                          className="px-3 py-1.5 rounded-xl border border-outline-variant bg-white text-xs font-bold text-primary focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value="APPLIED">Applied</option>
                          <option value="GD">GD Round</option>
                          <option value="INTERVIEW">Interview Round</option>
                          <option value="SELECTED">Selected</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      ) : (
                        <span className="text-[11px] text-outline italic">Read-only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Broadcast Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-white border border-outline-variant shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-purple-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-200">
                  Broadcast Event & Schedule
                </span>
                <h3 className="font-headline font-bold text-base">
                  Post Recruitment Event — {drive?.title}
                </h3>
              </div>
              <button
                onClick={() => setShowEventModal(false)}
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
                  <option value="ALL">All Applicants ({applicants.all?.length || 0} candidates)</option>
                  <option value="APPLIED">Applied Stage Only ({applicants.applied?.length || 0} candidates)</option>
                  <option value="GD">GD Round Stage Only ({applicants.gd?.length || 0} candidates)</option>
                  <option value="INTERVIEW">Interview Stage Only ({applicants.interview?.length || 0} candidates)</option>
                  <option value="SELECTED">Selected Stage Only ({applicants.selected?.length || 0} candidates)</option>
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
                  placeholder="e.g. Technical & Architecture Interview Round"
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
                  onClick={() => setShowEventModal(false)}
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
      {showDetailsModal && drive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-white border border-outline-variant shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-surface-container-high px-6 py-4 border-b border-outline-variant/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  {drive.company_name}
                </span>
                <h3 className="font-headline font-bold text-lg text-on-surface">
                  {drive.title}
                </h3>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-highest"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/60">
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Role Position</span>
                  <span className="font-bold text-sm text-on-surface">{drive.role_position}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Monthly Stipend</span>
                  <span className="font-bold text-sm text-emerald-700">₹{Number(drive.stipend_amount || 50000).toLocaleString()}/mo</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Duration</span>
                  <span className="font-bold text-sm text-on-surface">{drive.duration_months} Months</span>
                </div>
                <StatusBadge status={drive.status} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/60">
                  <span className="text-[10px] text-on-surface-variant font-bold block">Openings</span>
                  <span className="font-bold text-on-surface">{drive.openings_count} seats</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/60">
                  <span className="text-[10px] text-on-surface-variant font-bold block">Min CGPA</span>
                  <span className="font-bold text-primary">{drive.min_cgpa} CGPA</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/60">
                  <span className="text-[10px] text-on-surface-variant font-bold block">Max Backlogs</span>
                  <span className="font-bold text-on-surface">{drive.max_backlogs} allowed</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/60">
                  <span className="text-[10px] text-on-surface-variant font-bold block">Deadline</span>
                  <span className="font-bold text-rose-700">{new Date(drive.deadline).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Location */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/60 space-y-1">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                  Work Location & Geofence Site
                </span>
                <p className="font-medium text-on-surface flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>{drive.work_location_address}</span>
                </p>
                <p className="text-[10px] text-outline font-mono">
                  Coordinates: {drive.latitude}, {drive.longitude} (300m Institutional Geofence)
                </p>
              </div>

              {/* Skills */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  Required Competencies & Skills
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(drive.required_skills || ['React', 'Python', 'SQL']).map((skill, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-blue-100 text-primary text-[11px] font-bold">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-surface-container-high px-6 py-3 border-t border-outline-variant/60 text-right">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriveApplicantsPage;
