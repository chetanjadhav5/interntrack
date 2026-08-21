import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import StatusBadge from '../../components/common/StatusBadge';
import {
  FileCheck,
  GitBranch,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Award,
  ExternalLink,
  Loader2,
  Trash2,
  Search,
  AlertCircle,
  Users,
  X,
  Filter,
  FileText,
  Eye,
  Globe,
  Building2,
  Image as ImageIcon,
  Clock
} from 'lucide-react';

const WeeklyReportsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const studentId = searchParams.get('student_id');
  const studentName = searchParams.get('student_name');
  const internshipId = searchParams.get('internship_id');

  const [data, setData] = useState({
    counts: { all: 0, pending: 0, correction_required: 0, approved: 0, rejected: 0 },
    reports: { all: [], pending: [], correction_required: [], approved: [], rejected: [] }
  });
  const [activeTab, setActiveTab] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // Scoring & Evaluation Form
  const [score, setScore] = useState('95');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');

  useEffect(() => {
    fetchWeeklyReports();
  }, [studentId, internshipId]);

  const fetchWeeklyReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('ghr_token');
      const params = new URLSearchParams();
      if (studentId) params.append('student_id', studentId);
      if (internshipId) params.append('internship_id', internshipId);
      const queryStr = params.toString() ? `?${params.toString()}` : '';

      const res = await fetch(`/api/faculty/weekly-reports${queryStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const resData = await res.json();
        setData(resData);
        if (resData.reports.all.length > 0) {
          setSelectedReport(resData.reports.all[0]);
          setScore(resData.reports.all[0].faculty_score?.toString() || '95');
          setFeedback(resData.reports.all[0].faculty_feedback || '');
        } else {
          setSelectedReport(null);
        }
      }
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReport = (rep) => {
    setSelectedReport(rep);
    setScore(rep.faculty_score ? rep.faculty_score.toString() : '95');
    setFeedback(rep.faculty_feedback || '');
    setActionMsg('');
    setActionErr('');
  };

  const handleEvaluate = async (decision) => {
    if (!selectedReport) return;
    if ((decision === 'CORRECTION_REQUIRED' || decision === 'REJECTED') && !feedback.trim()) {
      setActionErr('A mandatory comment is required when requesting corrections or rejecting a report.');
      return;
    }

    setSubmitting(true);
    setActionMsg('');
    setActionErr('');

    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch(`/api/faculty/reports/${selectedReport.id}/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          decision,
          score: decision === 'APPROVED' ? score : null,
          feedback
        })
      });

      const resData = await res.json();
      if (res.ok) {
        setActionMsg(resData.message);
        fetchWeeklyReports();
      } else {
        setActionErr(resData.error || 'Evaluation failed');
      }
    } catch {
      setActionErr('Network error saving evaluation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  const reportList = data.reports[activeTab] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm space-y-4">
        <div>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Logbook Verification</span>
          <h1 className="font-headline font-black text-2xl sm:text-3xl text-on-surface tracking-tight mt-0.5">
            Weekly Report Verification Hub
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Review weekly progress summaries, inspect GitHub work health, and assign academic logbook scores.
          </p>
        </div>

        {/* Filter Banner when coming from Active Interns */}
        {(studentId || studentName) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-200/70 text-emerald-800">
                    Mentee Review Filter Active
                  </span>
                </div>
                <p className="font-headline font-bold text-sm text-emerald-950 mt-0.5">
                  Showing Weekly Reports for <span className="underline decoration-emerald-500 font-extrabold">{studentName || studentId}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSearchParams({})}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm flex-shrink-0 self-start sm:self-auto"
            >
              <X className="w-3.5 h-3.5" />
              <span>View All Students' Reports</span>
            </button>
          </div>
        )}

        {/* 5 Tabs with Counts */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-outline-variant/40">
          {[
            { key: 'all', label: 'All Reports', count: data.counts.all },
            { key: 'pending', label: 'Pending Review', count: data.counts.pending },
            { key: 'correction_required', label: 'Correction Required', count: data.counts.correction_required },
            { key: 'approved', label: 'Approved & Scored', count: data.counts.approved },
            { key: 'rejected', label: 'Rejected', count: data.counts.rejected }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/10 font-black">
                {tab.count}
              </span>
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

      {/* Main Grid: Reports List vs Detailed Review Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Report Cards (Scrollable Viewport Section) */}
        <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
          {reportList.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-3xl p-8 text-center border border-outline-variant/60 text-xs text-on-surface-variant space-y-2">
              <p className="font-semibold text-on-surface">
                {studentName ? `No weekly reports found for ${studentName} in this category.` : 'No weekly reports in this view.'}
              </p>
              {studentId && (
                <button
                  type="button"
                  onClick={() => setSearchParams({})}
                  className="text-xs text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>Clear student filter and show all reports</span>
                </button>
              )}
            </div>
          ) : (
            reportList.map((rep) => {
              const isSelected = selectedReport?.id === rep.id;
              return (
                <div
                  key={rep.id}
                  onClick={() => handleSelectReport(rep)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-50/80 border-emerald-600 shadow-sm ring-2 ring-emerald-600/20'
                      : 'bg-surface-container-lowest border-outline-variant/60 hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-headline font-bold text-xs text-on-surface">Week {rep.week_number} Report</h4>
                      {rep.internship_mode === 'REMOTE' ? (
                        <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 text-[9px] font-bold inline-flex items-center gap-0.5">
                          <Globe className="w-2.5 h-2.5" /> Remote
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 text-[9px] font-bold inline-flex items-center gap-0.5">
                          <Building2 className="w-2.5 h-2.5" /> On-Site
                        </span>
                      )}
                    </div>
                    <StatusBadge status={rep.status} size="xs" />
                  </div>
                  <p className="text-xs font-bold text-primary">{rep.student_name}</p>
                  <p className="text-[11px] text-on-surface-variant">{rep.internship_title}</p>
                  <div className="flex items-center justify-between pt-2 mt-1 border-t border-outline-variant/40 text-[10px] text-outline">
                    <span>Friday: {rep.scheduled_friday_date || rep.scheduled_date || rep.scheduled_saturday_date}</span>
                    {rep.faculty_score && <span className="font-bold text-emerald-700">Score: {rep.faculty_score}/100</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right 2 Cols: Report Detail Review Drawer */}
        <div className="lg:col-span-2">
          {selectedReport ? (
            <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-5">
              <div className="flex items-start justify-between border-b border-outline-variant/40 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      {selectedReport.internship_title}
                    </span>
                    {selectedReport.internship_mode === 'REMOTE' ? (
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-bold border border-purple-200 inline-flex items-center gap-1">
                        <Globe className="w-3 h-3 text-purple-700" />
                        <span>Remote Internship</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-bold border border-blue-200 inline-flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-blue-700" />
                        <span>On-Site Internship</span>
                      </span>
                    )}
                  </div>
                  <h3 className="font-headline font-bold text-lg text-on-surface mt-0.5">
                    {selectedReport.student_name} — Week {selectedReport.week_number} Report
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Student ID: <strong>{selectedReport.student_roll}</strong> | Scheduled Friday: <strong>{selectedReport.scheduled_friday_date || selectedReport.scheduled_date || selectedReport.scheduled_saturday_date}</strong>
                  </p>
                </div>
                <StatusBadge status={selectedReport.status} />
              </div>

              {/* GitHub Live Work Score Card (for Computer branches) */}
              {selectedReport.github_score !== null && selectedReport.github_score !== undefined && (
                <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <GitBranch className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        GitHub Activity & Work Score
                      </span>
                      <p className="font-headline font-bold text-sm text-white">
                        {selectedReport.github_username ? `@${selectedReport.github_username}` : 'GitHub Connected'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-headline font-black text-2xl text-emerald-400">
                      {selectedReport.github_score || selectedReport.github_score_snapshot || 85} / 100
                    </span>
                    <span className="text-[10px] text-slate-300 block font-semibold">Live Commit Frequency</span>
                  </div>
                </div>
              )}

              {/* Weekly Work Summary */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Submitted Weekly Summary
                </span>
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 text-xs text-on-surface leading-relaxed whitespace-pre-wrap">
                  {selectedReport.work_summary || 'No summary provided.'}
                </div>
              </div>

              {/* Remote Intern: Daily Check-Out Proofs Section */}
              {selectedReport.daily_proofs && selectedReport.daily_proofs.length > 0 && (
                <div className="space-y-3 p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-purple-700" />
                      <span className="text-xs font-bold text-purple-950 uppercase tracking-wider">
                        Daily Attendance Proofs & Check-Out Logs ({selectedReport.daily_proofs.length} Days)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-purple-800 bg-purple-200/70 px-2 py-0.5 rounded-full">
                      Remote Internship Verification
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-900 leading-snug">
                    Daily work proofs submitted by the remote student at check-out during this week:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {selectedReport.daily_proofs.map((dp, idx) => {
                      const isPdf = dp.type === 'pdf' || (dp.url && (dp.url.startsWith('data:application/pdf') || dp.url.toLowerCase().endsWith('.pdf')));
                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-white border border-purple-200/80 shadow-sm space-y-2 flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between text-[11px] border-b border-purple-100 pb-1.5">
                            <span className="font-mono font-bold text-purple-950">{dp.date}</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold font-mono text-[10px] border border-emerald-200">
                              {dp.hours ? `${dp.hours} hrs` : '8.5 hrs'}
                            </span>
                          </div>

                          <p className="text-[11px] text-on-surface line-clamp-2 italic">
                            "{dp.work_summary || 'Completed daily engineering tasks.'}"
                          </p>

                          {dp.url && (
                            <div className="pt-1">
                              {isPdf ? (
                                <a
                                  href={dp.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-2 rounded-lg bg-red-50 text-red-900 border border-red-200 flex items-center justify-between text-[11px] font-bold hover:bg-red-100 transition-colors"
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <FileText className="w-4 h-4 text-red-600 flex-shrink-0" />
                                    <span className="truncate">{dp.name || 'Daily Proof Document (PDF)'}</span>
                                  </div>
                                  <Eye className="w-3.5 h-3.5 text-red-600 flex-shrink-0 ml-1" />
                                </a>
                              ) : (
                                <a
                                  href={dp.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="group relative rounded-lg overflow-hidden border border-purple-200 block h-24 bg-black/5"
                                >
                                  <img src={dp.url} alt="Proof" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity gap-1">
                                    <Eye className="w-3 h-3" />
                                    <span>Preview Daily Proof</span>
                                  </div>
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Work Proof Screenshots & PDF Artifacts */}
              {selectedReport.work_proof_urls && selectedReport.work_proof_urls.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Additional Milestone Artifacts & Screenshots ({selectedReport.work_proof_urls.length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedReport.work_proof_urls.map((rawItem, i) => {
                      const url = typeof rawItem === 'object' && rawItem?.url ? rawItem.url : (typeof rawItem === 'string' ? rawItem : '');
                      const name = typeof rawItem === 'object' && rawItem?.name ? rawItem.name : (url.split('/').pop() || `Proof_${i + 1}`);
                      const isPdf =
                        (typeof rawItem === 'object' && rawItem?.type === 'pdf') ||
                        url.startsWith('data:application/pdf') ||
                        url.toLowerCase().endsWith('.pdf') ||
                        url.includes('.pdf');

                      if (isPdf) {
                        return (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-3 rounded-2xl bg-red-50/80 border border-red-200/80 flex flex-col items-center justify-center text-center hover:bg-red-100/80 transition-all group shadow-sm"
                          >
                            <FileText className="w-8 h-8 text-red-600 mb-1 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold text-red-950 uppercase tracking-wider">PDF Document</span>
                            <span className="text-[10px] text-red-800 truncate max-w-full font-mono mt-0.5">{name}</span>
                            <span className="text-[10px] text-primary font-bold mt-1 inline-flex items-center gap-0.5">
                              <Eye className="w-3 h-3" /> View PDF
                            </span>
                          </a>
                        );
                      }

                      return (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="group relative rounded-2xl overflow-hidden border border-outline-variant block shadow-sm bg-black/5"
                        >
                          <img src={url} alt={`Proof ${i + 1}`} className="w-full h-28 object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[11px] font-bold transition-opacity gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Full Size</span>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Scoring & Remarks Form */}
              <div className="space-y-4 pt-4 border-t border-outline-variant/40">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                      Weekly Score (0 - 100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-600 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                      Mentor Feedback Remarks (Mandatory for Corrections/Rejection)
                    </label>
                    <input
                      type="text"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="e.g. Approved high quality submission, or specify required changes..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-600 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleEvaluate('REJECTED')}
                    disabled={submitting}
                    className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors"
                  >
                    Reject Report
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEvaluate('CORRECTION_REQUIRED')}
                    disabled={submitting}
                    className="px-4 py-2.5 rounded-xl border border-amber-300 text-amber-800 hover:bg-amber-50 text-xs font-bold transition-colors"
                  >
                    Request Correction
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEvaluate('APPROVED')}
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Approve & Record Score</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-3xl p-12 text-center border border-outline-variant/60 text-xs text-on-surface-variant">
              Select a report from the list to review work proof and submit evaluation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeeklyReportsPage;
