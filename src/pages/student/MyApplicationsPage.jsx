import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Briefcase,
  Building2,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Video,
  X,
  ArrowRight,
  Loader2,
  ExternalLink,
  Info,
  Radio,
  FileText,
  Sparkles,
  Scale,
  ShieldCheck
} from 'lucide-react';

const MyApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedApp, setSelectedApp] = useState(null);
  const [viewingEvent, setViewingEvent] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/student/applications/my-applications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = applications.filter((app) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'ACTIVE') return app.current_stage === 'APPLIED' || app.current_stage === 'GD';
    if (activeTab === 'INTERVIEW') return app.current_stage === 'INTERVIEW' || app.current_stage === 'Technical Interview';
    if (activeTab === 'SELECTED') return app.current_stage === 'SELECTED';
    if (activeTab === 'REJECTED') return app.current_stage === 'REJECTED';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Candidate Pipeline</span>
            <h1 className="font-headline font-black text-2xl sm:text-3xl text-on-surface tracking-tight mt-0.5">
              My Applied Internships
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Track recruitment rounds, interview schedules, event details, and selection updates in real-time.
            </p>
          </div>

          <Link
            to="/student/directory"
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 shadow-sm self-start sm:self-auto flex items-center gap-1.5"
          >
            <span>Browse More Drives</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Pipeline Filter Tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-outline-variant/40">
          {['ALL', 'ACTIVE', 'INTERVIEW', 'SELECTED', 'REJECTED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Grid */}
      {filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl p-12 text-center border border-outline-variant/60 space-y-3">
          <p className="text-xs text-on-surface-variant">No applications found in this stage.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((app) => (
            <div
              key={app.id}
              className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm hover:shadow-card-hover transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                      {app.drive_details?.company_name}
                    </span>
                    <h3 className="font-headline font-bold text-base text-on-surface mt-0.5">
                      {app.drive_details?.title}
                    </h3>
                  </div>
                  <StatusBadge status={app.current_stage} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-outline-variant/40">
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-bold block uppercase">Applied On</span>
                    <span className="font-semibold text-on-surface">
                      {new Date(app.applied_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-bold block uppercase">Latest Stage</span>
                    <span className="font-semibold text-primary">
                      {app.stage_events?.slice(-1)[0]?.stage || app.current_stage}
                    </span>
                  </div>
                </div>

                {/* Latest Event Teaser */}
                {app.stage_events && app.stage_events.length > 0 && (
                  <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 text-[11px] space-y-1">
                    <span className="font-bold text-primary flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Latest Round Update
                    </span>
                    <p className="text-on-surface truncate">{app.stage_events.slice(-1)[0].notes}</p>
                  </div>
                )}

                {/* Institutional Consent Badge */}
                {app.consent_accepted && (
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-900 font-semibold flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <span>Placement Undertaking Signed: Conversion policy applies upon offer issuance.</span>
                  </div>
                )}
              </div>

              {/* View Timeline Action */}
              <button
                type="button"
                onClick={() => setSelectedApp(app)}
                className="w-full py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>View Selection Timeline & Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Selection Timeline Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-white border border-outline-variant shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-surface-container-high px-6 py-4 border-b border-outline-variant/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                  {selectedApp.drive_details?.company_name}
                </span>
                <h3 className="font-headline font-bold text-base text-on-surface">
                  {selectedApp.drive_details?.title} — Selection Timeline
                </h3>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-highest"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Timeline Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1">
                <h4 className="font-headline font-bold text-xs uppercase tracking-wider text-on-surface-variant">
                  Recruitment Stages & Scheduled Events
                </h4>
                <p className="text-xs text-on-surface-variant">
                  Detailed timeline logs, interview timings, venue links, and instructions posted by {selectedApp.drive_details?.company_name}.
                </p>
              </div>

              {/* Vertical Stepper Timeline with Tiles */}
              <div className="space-y-4 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-outline-variant/60">
                {(selectedApp.stage_events || []).map((event, idx) => {
                  const hasEventDetails = Boolean(
                    event.event_posted ||
                    (event.venue_or_link && event.venue_or_link !== 'Campus Portal Submission' && event.venue_or_link !== 'Updated in portal') ||
                    event.event_title
                  );

                  return (
                    <div key={idx} className="relative flex items-start gap-4 pl-1">
                      <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-[10px] font-bold ring-4 ring-white z-10">
                        {idx + 1}
                      </div>

                      {/* Event Tile */}
                      <div className="flex-1 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-headline font-bold text-xs text-primary uppercase tracking-wide">
                              {event.event_title || event.stage}
                            </span>
                            {event.stage && event.event_title && (
                              <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-bold">
                                {event.stage}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-on-surface-variant font-medium">
                            {new Date(event.scheduled_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>

                        <p className="text-xs text-on-surface font-medium leading-relaxed">{event.notes}</p>

                        {/* Down on right side of the tile: Event Details button */}
                        <div className="pt-2 border-t border-outline-variant/30 flex items-center justify-between">
                          <div className="text-[11px] text-on-surface-variant truncate max-w-[240px]">
                            {event.venue_or_link ? (
                              <span className="font-mono text-[10px] text-outline truncate block">
                                {event.venue_or_link}
                              </span>
                            ) : (
                              <span className="text-[10px] text-outline italic">No venue attached</span>
                            )}
                          </div>

                          {/* Event Details Button (Down Right Side) */}
                          {hasEventDetails ? (
                            <button
                              type="button"
                              onClick={() =>
                                setViewingEvent({
                                  ...event,
                                  company_name: selectedApp.drive_details?.company_name,
                                  drive_title: selectedApp.drive_details?.title
                                })
                              }
                              className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-bold shadow-sm flex items-center gap-1.5 transition-all"
                            >
                              <Radio className="w-3 h-3 animate-pulse text-purple-200" />
                              <span>View Event Details</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={true}
                              className="px-3 py-1.5 rounded-xl bg-surface-container-high text-on-surface-variant/60 text-[11px] font-bold cursor-not-allowed flex items-center gap-1"
                            >
                              <span>Details Pending</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-surface-container-low px-6 py-3 border-t border-outline-variant/60 text-right">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-all"
              >
                Close Timeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Event Details Sub-Modal */}
      {viewingEvent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-outline-variant shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-purple-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-200">
                  {viewingEvent.company_name}
                </span>
                <h3 className="font-headline font-bold text-base">
                  {viewingEvent.event_title || viewingEvent.stage}
                </h3>
              </div>
              <button
                onClick={() => setViewingEvent(null)}
                className="p-1 rounded-lg text-purple-200 hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Event Timing */}
              <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-purple-700 flex-shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-purple-900 uppercase block">Scheduled Date & Time</span>
                  <span className="font-bold text-sm text-purple-950">
                    {new Date(viewingEvent.scheduled_at).toLocaleString([], {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              {/* Location or Meeting Link */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/60 space-y-1.5">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase block">
                  Location / Meeting Link
                </span>
                {viewingEvent.venue_or_link?.startsWith('http') ? (
                  <a
                    href={viewingEvent.venue_or_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 shadow-sm transition-all"
                  >
                    <Video className="w-4 h-4" />
                    <span>Join Online Meeting / Video Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <p className="font-semibold text-on-surface flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{viewingEvent.venue_or_link || 'Campus Portal / Offline Placement Hall'}</span>
                  </p>
                )}
              </div>

              {/* Instructions / Notes */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/60 space-y-1">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase block">
                  Recruiter Instructions & Notes
                </span>
                <p className="font-medium text-on-surface leading-relaxed whitespace-pre-line">
                  {viewingEvent.notes || 'Please be on time and ensure all documents are ready.'}
                </p>
              </div>
            </div>

            <div className="bg-surface-container-high px-6 py-3 border-t border-outline-variant/60 text-right">
              <button
                onClick={() => setViewingEvent(null)}
                className="px-5 py-2 rounded-xl bg-purple-700 text-white text-xs font-bold hover:bg-purple-800"
              >
                Close Event Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyApplicationsPage;
