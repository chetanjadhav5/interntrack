import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import {
  FileCheck,
  GitBranch,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Upload,
  ArrowRight,
  Loader2,
  Sparkles,
  Edit3,
  MessageSquare,
  Lock,
  Unlock,
  ShieldCheck,
  Eye,
  Info,
  FileText,
  ExternalLink,
  Paperclip,
  FileUp,
  Image as ImageIcon,
  Check,
  Globe
} from 'lucide-react';

const TasksReportsPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [internship, setInternship] = useState(null);
  const [reports, setReports] = useState([]);
  const [githubScore, setGithubScore] = useState(0);
  const [githubUser, setGithubUser] = useState('');
  const [isComputerBranch, setIsComputerBranch] = useState(true);
  const [loading, setLoading] = useState(true);

  // GitHub OAuth Modal & Flow State
  const [showGitModal, setShowGitModal] = useState(false);
  const [gitInputUser, setGitInputUser] = useState('alexpatil-dev');
  const [connectingGit, setConnectingGit] = useState(false);
  const [oauthStep, setOauthStep] = useState(1); // 1: Consent, 2: Exchanging code, 3: Success

  // Active Report Submission Form State
  const [activeReport, setActiveReport] = useState(null);
  const [workSummary, setWorkSummary] = useState('');
  const [screenshots, setScreenshots] = useState([]);
  const [newScreenshotUrl, setNewScreenshotUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchTasksAndReports();
    // Handle redirect OAuth code if present in URL
    const oauthCode = searchParams.get('code');
    if (oauthCode) {
      handleOAuthCodeExchange(oauthCode);
    }
  }, []);

  const normalizeArtifact = (item, idx) => {
    if (typeof item === 'object' && item !== null && item.url) {
      return item;
    }
    const urlStr = typeof item === 'string' ? item : '';
    const isPdf =
      urlStr.startsWith('data:application/pdf') ||
      urlStr.toLowerCase().endsWith('.pdf') ||
      urlStr.includes('.pdf');
    const isImg =
      urlStr.startsWith('data:image') ||
      urlStr.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) ||
      (!isPdf && urlStr.startsWith('http'));

    return {
      url: urlStr,
      name: urlStr.startsWith('data:')
        ? (isPdf ? `Proof_Document_${idx + 1}.pdf` : `Screenshot_${idx + 1}.png`)
        : (urlStr.split('/').pop() || `Proof_Artifact_${idx + 1}`),
      type: isPdf ? 'pdf' : (isImg ? 'image' : 'link'),
      size: isPdf ? 'PDF Document' : 'Image / Link'
    };
  };

  const fetchTasksAndReports = async () => {
    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/student/tasks-reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInternship(data.internship);
        const reportList = data.reports || [];
        setReports(reportList);
        setGithubScore(data.github_score || 0);
        setGithubUser(data.github_username || '');
        setIsComputerBranch(data.is_computer_branch !== false);

        if (data.github_username) {
          setGitInputUser(data.github_username);
        }

        // Select the first open/unlocked report or the latest active one
        if (reportList.length > 0) {
          const firstOpen = reportList.find(
            (r) => r.status === 'CORRECTION_REQUIRED' || (r.status === 'PENDING' && r.is_unlocked)
          ) || reportList[0];
          handleSelectReportForEdit(firstOpen);
        }
      }
    } catch (err) {
      console.error('Error loading tasks & reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReportForEdit = (rep) => {
    setActiveReport(rep);
    setWorkSummary(rep.work_summary || '');
    const rawProofs = rep.work_proof_urls || [];
    setScreenshots(rawProofs.map(normalizeArtifact));
    setActionMsg('');
    setActionErr('');
  };

  // OAuth Authorization Handler
  const handleOpenOAuthFlow = async () => {
    setActionErr('');
    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/student/github/oauth-url', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.oauth_url) {
          // Redirect directly to official GitHub OAuth authorization page
          window.location.href = data.oauth_url;
          return;
        }
      }
    } catch (err) {
      console.warn('OAuth url check fallback:', err);
    }
    setOauthStep(1);
    setShowGitModal(true);
  };

  const handleOAuthCodeExchange = async (code, customUser) => {
    setConnectingGit(true);
    setOauthStep(2);
    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/student/github/oauth-callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          code: code || `gh_oauth_code_${Date.now()}`,
          demo_username: customUser || gitInputUser
        })
      });

      const data = await res.json();
      if (res.ok) {
        setGithubScore(data.github_score || 100);
        setGithubUser(data.github_username);
        setOauthStep(3);
        setActionMsg(`🎉 GitHub verified & connected via OAuth! @${data.github_username} (Score: ${data.github_score || 100}/100)`);

        // Clean URL params if redirected from GitHub
        if (window.location.search.includes('code=')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        setTimeout(() => {
          setShowGitModal(false);
          setOauthStep(1);
        }, 1200);
      } else {
        setActionErr(data.error || 'Failed to exchange GitHub authorization code');
        setOauthStep(1);
      }
    } catch {
      setActionErr('Network error during GitHub OAuth authorization');
      setOauthStep(1);
    } finally {
      setConnectingGit(false);
    }
  };

  const handleAuthorizeOAuth = (e) => {
    e.preventDefault();
    handleOAuthCodeExchange(`gh_oauth_${Date.now()}`, gitInputUser);
  };

  const handleMultipleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isImg = file.type.startsWith('image/');
      if (!isPdf && !isImg) return;

      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const dataUrl = loadEvt.target.result;
        setScreenshots((prev) => [
          ...prev,
          {
            url: dataUrl,
            name: file.name,
            type: isPdf ? 'pdf' : 'image',
            size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
          }
        ]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleAddScreenshotUrl = (e) => {
    e.preventDefault();
    if (!newScreenshotUrl.trim()) return;
    const urlStr = newScreenshotUrl.trim();
    const isPdf = urlStr.toLowerCase().endsWith('.pdf');
    setScreenshots([
      ...screenshots,
      {
        url: urlStr,
        name: urlStr.split('/').pop() || 'Web Artifact Link',
        type: isPdf ? 'pdf' : 'image',
        size: 'External URL'
      }
    ]);
    setNewScreenshotUrl('');
  };

  const handleRemoveScreenshot = (idx) => {
    setScreenshots(screenshots.filter((_, i) => i !== idx));
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!workSummary.trim()) {
      setActionErr('Please provide a comprehensive weekly work summary.');
      return;
    }

    if (activeReport && !activeReport.is_unlocked && activeReport.status === 'PENDING') {
      setActionErr(`Week ${activeReport.week_number} report is locked until Friday, ${activeReport.scheduled_friday_date}.`);
      return;
    }

    setSubmitting(true);
    setActionMsg('');
    setActionErr('');

    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/student/weekly-reports/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          report_id: activeReport?.id,
          week_number: activeReport?.week_number || 1,
          work_summary: workSummary,
          work_proof_urls: screenshots
        })
      });

      const data = await res.json();
      if (res.ok) {
        setActionMsg(data.message || 'Friday logbook report submitted successfully for mentor evaluation!');
        fetchTasksAndReports();
      } else {
        setActionErr(data.error || 'Failed to submit weekly report');
      }
    } catch {
      setActionErr('Network error submitting report');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const isCurrentReportLocked = activeReport && !activeReport.is_unlocked && activeReport.status === 'PENDING';
  const isCurrentReportApproved = activeReport && activeReport.status === 'APPROVED';
  const isCurrentReportSubmitted = activeReport && activeReport.status === 'SUBMITTED';

  return (
    <div className="space-y-6">
      {/* Top Banner with GitHub Connect Scorecard */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Evaluation & Logbook</span>
          <h1 className="font-headline font-black text-2xl sm:text-3xl text-on-surface tracking-tight mt-0.5">
            Tasks & Friday Weekly Reports
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Automated recurring Friday logbook submissions verified by assigned Faculty Mentor.
          </p>
        </div>

        {/* GitHub Live Metric Card (Visible for Computer Branches: CS, IT, BCA, MCA, AI, DS) */}
        {isComputerBranch ? (
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950 text-white shadow-xl shadow-slate-950/15 border border-slate-800 flex-shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white flex-shrink-0">
              <GitBranch className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GitHub Work Score</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <p className="font-headline font-black text-2xl text-emerald-400">
                {githubScore} <span className="text-xs text-slate-400 font-normal">/ 100</span>
              </p>
              <p className="text-[11px] text-slate-300 font-mono">
                {githubUser ? `@${githubUser}` : 'Not Connected'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenOAuthFlow}
              className="ml-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{githubUser ? 'Re-Sync OAuth' : 'Connect GitHub'}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-blue-950 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Accredited Evaluation</span>
              <p className="font-headline font-bold text-xs text-blue-950">100% Institutional Logbook & Work Proofs</p>
            </div>
          </div>
        )}
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

      {/* Main Grid: Weekly Form on Left, Friday Timeline Schedule on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Weekly Submission Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/40 pb-4">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  {internship?.company_name || 'Active Internship'} • Week {activeReport?.week_number || 1}
                </span>
                <h2 className="font-headline font-bold text-xl text-on-surface mt-0.5">
                  Friday Logbook & Milestone Submission
                </h2>
                <p className="text-xs text-on-surface-variant mt-1">
                  Scheduled Date: <strong>{activeReport?.scheduled_friday_date || activeReport?.scheduled_date || todayStr}</strong>
                </p>
              </div>

              {activeReport && (
                <div className="flex items-center gap-2">
                  <StatusBadge status={activeReport.status} size="sm" />
                </div>
              )}
            </div>

            {/* Faculty Feedback Banner if Correction Required */}
            {activeReport?.status === 'CORRECTION_REQUIRED' && activeReport.faculty_feedback && (
              <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 space-y-1 animate-in fade-in">
                <span className="text-xs font-bold text-orange-900 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-orange-600" /> Faculty Mentor Correction Remarks:
                </span>
                <p className="text-xs text-orange-950 italic">"{activeReport.faculty_feedback}"</p>
                <p className="text-[10px] text-orange-800 pt-1 font-medium">
                  Please update your work summary and work proofs below to resubmit.
                </p>
              </div>
            )}

            {/* Faculty Feedback Banner if Approved */}
            {isCurrentReportApproved && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Faculty Mentor Approved
                  </span>
                  <span className="text-xs font-black text-emerald-700">
                    Score: {activeReport.faculty_score} / 100
                  </span>
                </div>
                {activeReport.faculty_feedback && (
                  <p className="text-xs text-emerald-950 italic pt-1">
                    "{activeReport.faculty_feedback}"
                  </p>
                )}
              </div>
            )}

            {activeReport ? (
              <form onSubmit={handleSubmitReport} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Friday Weekly Work Summary & Milestones Accomplished
                  </label>
                  <textarea
                    rows={4}
                    value={workSummary}
                    onChange={(e) => setWorkSummary(e.target.value)}
                    disabled={isCurrentReportLocked || isCurrentReportApproved}
                    required
                    placeholder="Describe specific tasks completed, bugs fixed, modules developed, or research undertaken this week..."
                    className="w-full p-3.5 rounded-2xl border border-outline-variant bg-white text-xs font-medium text-on-surface focus:ring-2 focus:ring-primary outline-none disabled:bg-surface-container-low disabled:text-on-surface-variant"
                  ></textarea>
                </div>

                {/* Work Proof Screenshots & PDF Artifacts Upload */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                      Work Proof Screenshots & Artifact Links (Images & PDF)
                    </label>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      Upload multiple code screenshots, architecture diagrams, sprint tickets, or PDF milestone reports.
                    </p>
                  </div>

                  {!isCurrentReportLocked && !isCurrentReportApproved && (
                    <div className="space-y-3">
                      {/* Multi-file Upload Button / Dropzone */}
                      <label className="flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-dashed border-outline-variant hover:border-primary bg-surface-container-low cursor-pointer hover:bg-surface-container-high transition-all text-center group">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FileUp className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="font-headline font-bold text-xs text-on-surface">
                            Upload Work Proofs (Multiple Images & PDF files)
                          </p>
                          <p className="text-[10px] text-on-surface-variant">
                            Select multiple PNG, JPG, WebP, or PDF files from your device
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="image/*,application/pdf,.pdf"
                          multiple
                          onChange={handleMultipleFileUpload}
                          className="hidden"
                        />
                      </label>

                      {/* Optional URL Paste Input */}
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={newScreenshotUrl}
                          onChange={(e) => setNewScreenshotUrl(e.target.value)}
                          placeholder="Or paste external artifact URL (e.g. GitHub PR, hosted demo, image link)..."
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={handleAddScreenshotUrl}
                          className="px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-xs font-bold flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" /> Add Link
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Uploaded Proofs Gallery Grid */}
                  {screenshots.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                      {screenshots.map((item, i) => {
                        const isPdf = item.type === 'pdf';
                        const isImage = item.type === 'image';

                        return (
                          <div
                            key={i}
                            className="relative rounded-2xl border border-outline-variant/70 overflow-hidden bg-surface-container-low p-3 flex flex-col justify-between gap-2 shadow-sm group"
                          >
                            {isImage ? (
                              <div className="space-y-2">
                                <div className="h-28 rounded-xl overflow-hidden bg-black/5 relative">
                                  <img
                                    src={item.url}
                                    alt={item.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[11px] font-bold transition-opacity gap-1"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Preview</span>
                                  </a>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-medium">
                                  <span className="truncate max-w-[130px] font-bold text-on-surface">{item.name}</span>
                                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 font-bold">Image</span>
                                </div>
                              </div>
                            ) : isPdf ? (
                              <div className="space-y-2">
                                <div className="h-28 rounded-xl bg-red-50/70 border border-red-200/60 flex flex-col items-center justify-center p-3 text-center">
                                  <FileText className="w-8 h-8 text-red-600 mb-1" />
                                  <span className="text-[10px] font-bold text-red-950 uppercase tracking-wider">PDF Document</span>
                                  <span className="text-[10px] text-red-800 truncate max-w-full font-mono mt-0.5">{item.name}</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-on-surface-variant font-semibold">{item.size || 'PDF'}</span>
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary font-bold hover:underline flex items-center gap-0.5"
                                  >
                                    <Eye className="w-3 h-3" /> View PDF
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="h-28 rounded-xl bg-blue-50/70 border border-blue-200/60 flex flex-col items-center justify-center p-3 text-center">
                                  <ExternalLink className="w-8 h-8 text-primary mb-1" />
                                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">External Link</span>
                                  <span className="text-[10px] text-on-surface-variant truncate max-w-full font-mono mt-0.5">{item.name}</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-on-surface-variant font-semibold">Web Link</span>
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary font-bold hover:underline flex items-center gap-0.5"
                                  >
                                    <ExternalLink className="w-3 h-3" /> Open
                                  </a>
                                </div>
                              </div>
                            )}

                            {!isCurrentReportLocked && !isCurrentReportApproved && (
                              <button
                                type="button"
                                onClick={() => handleRemoveScreenshot(i)}
                                title="Remove artifact"
                                className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Submit Action */}
                <div className="pt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || isCurrentReportLocked || isCurrentReportApproved}
                    className="px-8 py-3 rounded-2xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/30 flex items-center gap-2 transition-all"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting to Mentor...</span>
                      </>
                    ) : isCurrentReportLocked ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Locked until Friday, {activeReport.scheduled_friday_date || activeReport.scheduled_date}</span>
                      </>
                    ) : isCurrentReportApproved ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Report Approved by Mentor</span>
                      </>
                    ) : isCurrentReportSubmitted ? (
                      <>
                        <span>Update Submitted Friday Report</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <span>{activeReport.status === 'CORRECTION_REQUIRED' ? 'Resubmit Friday Report' : 'Submit Friday Report'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-on-surface-variant italic py-6 text-center">
                Select a week from the Friday schedule to view or submit logbook reports.
              </p>
            )}
          </div>
        </div>

        {/* Right Col: Friday Recurring Tasks Queue */}
        <div className="space-y-4">
          <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
              <h3 className="font-headline font-bold text-xs text-on-surface uppercase tracking-wider">
                Friday Logbook Schedule
              </h3>
              <span className="text-[10px] font-bold text-primary">
                {reports.filter((r) => r.status === 'APPROVED').length} / {reports.length} Approved
              </span>
            </div>

            <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
              {reports.map((rep) => {
                const isSelected = activeReport?.id === rep.id;
                const isLocked = !rep.is_unlocked && rep.status === 'PENDING';
                const isApproved = rep.status === 'APPROVED';
                const isSubmitted = rep.status === 'SUBMITTED';
                const isCorrection = rep.status === 'CORRECTION_REQUIRED';

                return (
                  <div
                    key={rep.id || rep.week_number}
                    onClick={() => handleSelectReportForEdit(rep)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${isSelected
                        ? 'bg-blue-50/80 border-primary shadow-sm ring-2 ring-primary/20'
                        : isLocked
                          ? 'bg-surface-container-low/50 border-outline-variant/40 hover:bg-surface-container-low opacity-75'
                          : 'bg-surface-container-low border-outline-variant/60 hover:bg-surface-container-high'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        {isLocked ? (
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                        ) : isApproved ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : isSubmitted ? (
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                        ) : isCorrection ? (
                          <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5 text-primary" />
                        )}
                        <span className="font-headline font-bold text-xs text-on-surface">
                          Week {rep.week_number}
                        </span>
                      </div>
                      <StatusBadge status={rep.status} size="xs" />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3 text-secondary" />
                        {rep.scheduled_friday_date || rep.scheduled_date}
                      </span>
                      {isLocked && (
                        <span className="text-[10px] text-slate-500 font-semibold italic">
                          Locked
                        </span>
                      )}
                      {rep.faculty_score !== null && (
                        <span className="text-[10px] font-bold text-emerald-700">
                          {rep.faculty_score}/100
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* GitHub Official OAuth Authorization Modal */}
      {showGitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 border border-outline-variant shadow-2xl space-y-6 animate-in zoom-in-95">
            {/* OAuth Connected Apps Header */}
            <div className="flex items-center justify-center gap-4 pb-2 border-b border-outline-variant/40">
              <div className="w-14 h-14 rounded-2xl bg-slate-950 text-white flex items-center justify-center shadow-md">
                <GitBranch className="w-7 h-7 text-emerald-400" />
              </div>
              <div className="flex items-center gap-1.5 text-on-surface-variant font-black">
                <span className="w-2 h-0.5 bg-outline-variant"></span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-[10px] font-mono uppercase font-bold">OAuth 2.0</span>
                <span className="w-2 h-0.5 bg-outline-variant"></span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md">
                <ShieldCheck className="w-7 h-7" />
              </div>
            </div>

            {/* Authorize Title */}
            <div className="text-center space-y-1">
              <h3 className="font-headline font-black text-xl text-on-surface tracking-tight">
                Authorize RaiSakshya
              </h3>
              <p className="text-xs text-on-surface-variant">
                by <strong className="text-primary">G. H. Raisoni College of Engineering (Autonomous)</strong>
              </p>
            </div>

            {/* Permissions Requested */}
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 space-y-2.5 text-xs">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                Requested OAuth Scopes & Permissions:
              </span>
              <div className="flex items-start gap-2.5 text-on-surface">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Read user profile & public activity</p>
                  <p className="text-[11px] text-on-surface-variant">Verify developer handle and public repository commits.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-on-surface">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Automated 100/100 Quality Score Qualification</p>
                  <p className="text-[11px] text-on-surface-variant">Sync commit frequency directly into weekly report evaluation rubric.</p>
                </div>
              </div>
            </div>

            {/* Authorization Progress / Form */}
            {oauthStep === 2 ? (
              <div className="py-6 text-center space-y-3">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
                <p className="font-headline font-bold text-sm text-on-surface">
                  Exchanging OAuth Authorization Code...
                </p>
                <p className="text-xs text-on-surface-variant">
                  Fetching repositories and syncing live 100/100 score...
                </p>
              </div>
            ) : oauthStep === 3 ? (
              <div className="py-6 text-center space-y-3 animate-in zoom-in-95">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <p className="font-headline font-black text-base text-emerald-950">
                  GitHub Authorized Successfully!
                </p>
                <p className="text-xs text-emerald-800 font-bold">
                  Score awarded: 100 / 100 (Grade: Outstanding)
                </p>
              </div>
            ) : (
              <form onSubmit={handleAuthorizeOAuth} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
                    GitHub Account Handle
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs font-bold">@</span>
                    <input
                      type="text"
                      value={gitInputUser}
                      onChange={(e) => setGitInputUser(e.target.value)}
                      required
                      placeholder="alexpatil-dev"
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-bold text-on-surface focus:ring-2 focus:ring-emerald-600 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setShowGitModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={connectingGit}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
                  >
                    {connectingGit ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Authorizing...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Authorize InternshipConnectPro (OAuth)</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksReportsPage;
