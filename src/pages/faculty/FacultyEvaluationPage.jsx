import React, { useState, useEffect } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import CertificateModal from '../../components/common/CertificateModal';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Users,
  ShieldCheck,
  Save,
  Loader2,
  Calendar,
  FileCheck,
  MapPin,
  GitBranch,
  Building2,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Clock,
  Check
} from 'lucide-react';

const FacultyEvaluationPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'completed'
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rubric Scores
  const [techScore, setTechScore] = useState(90);
  const [disciplineScore, setDisciplineScore] = useState(92);
  const [softScore, setSoftScore] = useState(90);
  const [logbookScore, setLogbookScore] = useState(95);
  const [attendanceScore, setAttendanceScore] = useState(94);
  const [remarks, setRemarks] = useState('Demonstrated exemplary technical mastery, punctual Friday logbook submissions, and professional teamwork.');

  const [saving, setSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');

  // Certificate Modal View
  const [showCertModal, setShowCertModal] = useState(false);
  const [activeCert, setActiveCert] = useState(null);

  useEffect(() => {
    fetchEligibleMentees();
  }, []);

  const fetchEligibleMentees = async () => {
    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/faculty/evaluation/eligible-mentees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setCandidates(list);

        const pendingList = list.filter(c => !c.final_internship_score && !c.certificate && c.status !== 'CERTIFICATE_ISSUED');
        const completedList = list.filter(c => Boolean(c.final_internship_score || c.certificate || c.status === 'CERTIFICATE_ISSUED'));

        if (activeTab === 'pending' && pendingList.length > 0) {
          handleSelectCandidate(pendingList[0]);
        } else if (activeTab === 'completed' && completedList.length > 0) {
          handleSelectCandidate(completedList[0]);
        } else if (list.length > 0) {
          handleSelectCandidate(list[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching eligible mentees for evaluation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCandidate = (candidate) => {
    if (!candidate) {
      setSelectedCandidate(null);
      return;
    }
    setSelectedCandidate(candidate);
    setActionMsg('');
    setActionErr('');
    if (candidate.certificate?.rubric_breakdown) {
      setTechScore(candidate.certificate.rubric_breakdown.technical_score || 90);
      setDisciplineScore(candidate.certificate.rubric_breakdown.discipline_score || 92);
      setSoftScore(candidate.certificate.rubric_breakdown.soft_skills_score || 90);
      setLogbookScore(candidate.certificate.rubric_breakdown.friday_logbook_score || 95);
      setAttendanceScore(candidate.certificate.rubric_breakdown.attendance_score || 94);
      setRemarks(candidate.certificate.rubric_breakdown.faculty_remarks || remarks);
    } else {
      setTechScore(90);
      setDisciplineScore(92);
      setSoftScore(90);
      setLogbookScore(95);
      setAttendanceScore(94);
    }
  };

  const calculateWeightedTotal = () => {
    return (
      (techScore * 0.30) +
      (disciplineScore * 0.20) +
      (softScore * 0.15) +
      (logbookScore * 0.20) +
      (attendanceScore * 0.15)
    ).toFixed(1);
  };

  const getCalculatedGrade = (score) => {
    const s = parseFloat(score);
    if (s >= 90) return 'O (Outstanding)';
    if (s >= 80) return 'A+ (Excellent)';
    if (s >= 70) return 'A (Very Good)';
    if (s >= 60) return 'B+ (Good)';
    return 'B (Satisfactory)';
  };

  const handleSaveEvaluation = async (e) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    setSaving(true);
    setActionMsg('');
    setActionErr('');

    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch(`/api/faculty/evaluation/${selectedCandidate.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tech_score: techScore,
          discipline_score: disciplineScore,
          soft_score: softScore,
          logbook_score: logbookScore,
          attendance_score: attendanceScore,
          remarks
        })
      });

      const data = await res.json();
      if (res.ok) {
        setActionMsg(data.message);
        setActiveCert(data.certificate);
        fetchEligibleMentees();
        setActiveTab('completed');
      } else {
        setActionErr(data.error || 'Failed to record evaluation');
      }
    } catch {
      setActionErr('Network error submitting evaluation');
    } finally {
      setSaving(false);
    }
  };

  const pendingCandidates = candidates.filter(c => !c.final_internship_score && !c.certificate && c.status !== 'CERTIFICATE_ISSUED');
  const completedCandidates = candidates.filter(c => Boolean(c.final_internship_score || c.certificate || c.status === 'CERTIFICATE_ISSUED'));
  const displayedCandidates = activeTab === 'pending' ? pendingCandidates : completedCandidates;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm space-y-4">
        <div>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Faculty Mentor Rubric</span>
          <h1 className="font-headline font-black text-2xl sm:text-3xl text-on-surface tracking-tight mt-0.5">
            Completed Intern Evaluation & Institutional Certification
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-3xl mt-1">
            Evaluate assigned mentees who have completed their internship tenure. Upon evaluation submission, an official institutional digital certificate is automatically generated with QR authentication and deposited into the student's Document Vault.
          </p>
        </div>

        {/* 2 Evaluation Status Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/40">
          <button
            type="button"
            onClick={() => {
              setActiveTab('pending');
              if (pendingCandidates.length > 0) handleSelectCandidate(pendingCandidates[0]);
              else setSelectedCandidate(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Evaluation</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/10 font-black">
              {pendingCandidates.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('completed');
              if (completedCandidates.length > 0) handleSelectCandidate(completedCandidates[0]);
              else setSelectedCandidate(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'completed'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed Evaluation</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/10 font-black">
              {completedCandidates.length}
            </span>
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{actionMsg}</span>
          </div>
          {activeCert && (
            <button
              onClick={() => setShowCertModal(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 flex items-center gap-1 shadow-sm"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Preview Certificate</span>
            </button>
          )}
        </div>
      )}

      {actionErr && (
        <div className="p-4 rounded-2xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionErr}</span>
        </div>
      )}

      {displayedCandidates.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl p-12 text-center border border-outline-variant/60 space-y-3">
          <Award className="w-12 h-12 text-outline mx-auto" />
          <h3 className="font-headline font-bold text-base text-on-surface">
            {activeTab === 'pending'
              ? 'No Mentees Pending Evaluation'
              : 'No Completed Evaluations Yet'}
          </h3>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto leading-relaxed">
            {activeTab === 'pending'
              ? 'All assigned mentees who completed their tenure have been evaluated, or no new completed internships require evaluation at this moment.'
              : 'Evaluated mentees with generated institutional certificates will appear in this section.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Candidates List */}
          <div className="space-y-3">
            <h3 className="font-headline font-bold text-xs text-on-surface uppercase tracking-wider px-1">
              {activeTab === 'pending' ? 'Pending Mentees' : 'Completed Mentees'} ({displayedCandidates.length})
            </h3>
            <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {displayedCandidates.map((cand) => {
                const isSelected = selectedCandidate?.id === cand.id;
                const isEvaluated = Boolean(cand.final_internship_score || cand.certificate);

                return (
                  <div
                    key={cand.id}
                    onClick={() => handleSelectCandidate(cand)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-600 shadow-sm ring-2 ring-emerald-600/20'
                        : 'bg-surface-container-lowest border-outline-variant/60 hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-headline font-bold text-xs text-on-surface">{cand.student_name}</h4>
                      {isEvaluated ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                          ✓ Certified ({cand.final_internship_score}%)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                          Pending Evaluation
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-on-surface-variant">{cand.student_roll}</p>
                    <p className="text-[11px] font-bold text-primary mt-1">{cand.company_name} — {cand.role_position}</p>
                    <div className="flex items-center justify-between text-[10px] text-outline mt-2 pt-1 border-t border-outline-variant/40">
                      <span>Tenure: {cand.start_date} to {cand.end_date}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 2 Columns: Details & Form */}
          {selectedCandidate && (
            <div className="lg:col-span-2 space-y-6">
              {/* Candidate Internship Records Card */}
              <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-4">
                <div className="flex items-start justify-between border-b border-outline-variant/40 pb-3">
                  <div>
                    <span className="text-[11px] font-bold text-primary uppercase">Candidate Internship Records</span>
                    <h3 className="font-headline font-bold text-lg text-on-surface">
                      {selectedCandidate.student_name} ({selectedCandidate.student_roll})
                    </h3>
                    <p className="text-xs text-on-surface-variant">{selectedCandidate.branch}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase block">
                      {activeTab === 'completed' ? 'Official Final Score' : 'Calculated Grade'}
                    </span>
                    <span className="font-headline font-black text-2xl text-emerald-700">
                      {selectedCandidate.final_internship_score || calculateWeightedTotal()}%
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 block">
                      {getCalculatedGrade(selectedCandidate.final_internship_score || calculateWeightedTotal())}
                    </span>
                  </div>
                </div>

                {/* 4 Performance Metric Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/60">
                    <div className="flex items-center gap-1.5 text-primary font-bold text-[11px] mb-1">
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Friday Reports</span>
                    </div>
                    <p className="font-headline font-black text-base text-on-surface">
                      {selectedCandidate.records?.approved_reports || 0} / {selectedCandidate.records?.total_reports || 0}
                    </p>
                    <span className="text-[10px] text-on-surface-variant">Approved by Mentor</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/60">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px] mb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Attendance</span>
                    </div>
                    <p className="font-headline font-black text-base text-emerald-800">
                      {selectedCandidate.records?.attendance_percentage || 94}%
                    </p>
                    <span className="text-[10px] text-on-surface-variant">{selectedCandidate.records?.attendance_count || 0} Geofenced check-ins</span>
                  </div>

                  {selectedCandidate.records?.is_computer_branch !== false && selectedCandidate.records?.github_score !== null && (
                    <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/60">
                      <div className="flex items-center gap-1.5 text-purple-700 font-bold text-[11px] mb-1">
                        <GitBranch className="w-3.5 h-3.5" />
                        <span>GitHub Score</span>
                      </div>
                      <p className="font-headline font-black text-base text-purple-900">
                        {selectedCandidate.records?.github_score || 85} / 100
                      </p>
                      <span className="text-[10px] text-on-surface-variant">Live Activity Metric</span>
                    </div>
                  )}

                  <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/60">
                    <div className="flex items-center gap-1.5 text-amber-700 font-bold text-[11px] mb-1">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Company Score</span>
                    </div>
                    <p className="font-headline font-black text-base text-amber-900">
                      {selectedCandidate.records?.company_score ? `${selectedCandidate.records.company_score}/100` : '92/100'}
                    </p>
                    <span className="text-[10px] text-on-surface-variant">
                      {selectedCandidate.records?.ppo_recommended ? '⭐ PPO Recommended' : 'Industry Appraisal'}
                    </span>
                  </div>
                </div>

                {selectedCandidate.records?.company_feedback && (
                  <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900">
                    <span className="font-bold">Company Manager Appraisal: </span>
                    <span>"{selectedCandidate.records.company_feedback}"</span>
                  </div>
                )}
              </div>

              {/* COMPLETED TAB VIEW: Show Certified Evaluation Summary (NO Form) */}
              {activeTab === 'completed' ? (
                <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-headline font-bold text-base text-on-surface">
                          Official Institutional Evaluation & Accreditation
                        </h3>
                        <p className="text-[11px] text-on-surface-variant">
                          Completed evaluation recorded by Faculty Mentor
                        </p>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Certified & Issued</span>
                    </span>
                  </div>

                  {/* Rubric Breakdown Score Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/60">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase block">
                        1. Technical Proficiency (30%)
                      </span>
                      <p className="font-headline font-black text-lg text-primary mt-0.5">
                        {techScore} / 100
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/60">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase block">
                        2. Industrial Discipline (20%)
                      </span>
                      <p className="font-headline font-black text-lg text-secondary mt-0.5">
                        {disciplineScore} / 100
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/60">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase block">
                        3. Soft Skills & Teamwork (15%)
                      </span>
                      <p className="font-headline font-black text-lg text-purple-700 mt-0.5">
                        {softScore} / 100
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/60">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase block">
                        4. Friday Logbook Regularity (20%)
                      </span>
                      <p className="font-headline font-black text-lg text-emerald-700 mt-0.5">
                        {logbookScore} / 100
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/60">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase block">
                        5. Geofenced Attendance (15%)
                      </span>
                      <p className="font-headline font-black text-lg text-amber-700 mt-0.5">
                        {attendanceScore} / 100
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                        Final Score & Grade
                      </span>
                      <p className="font-headline font-black text-lg text-emerald-900 mt-0.5">
                        {selectedCandidate.final_internship_score || calculateWeightedTotal()}%
                      </p>
                    </div>
                  </div>

                  {/* Mentor Remarks */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-on-surface-variant uppercase">
                      Faculty Mentor Endorsement Remarks
                    </span>
                    <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 text-xs text-on-surface leading-relaxed">
                      "{remarks}"
                    </div>
                  </div>

                  {/* Action to view certificate */}
                  <div className="pt-3 border-t border-outline-variant/40 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCert(selectedCandidate.certificate);
                        setShowCertModal(true);
                      }}
                      className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                    >
                      <Award className="w-4 h-4" />
                      <span>View Official Digital Certificate</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* PENDING TAB VIEW: Show Editable 5-Parameter Rubric Form */
                <form onSubmit={handleSaveEvaluation} className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-5">
                  <h3 className="font-headline font-bold text-base text-on-surface border-b border-outline-variant/40 pb-2">
                    5-Parameter Institutional Rubric Evaluation
                  </h3>

                  {/* 1. Technical Proficiency (30%) */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-on-surface">1. Technical Proficiency & Code Architecture (30%)</span>
                      <span className="text-primary font-black">{techScore} / 100</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={techScore}
                      onChange={(e) => setTechScore(parseInt(e.target.value, 10))}
                      className="w-full accent-primary h-2 bg-surface-container-high rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* 2. Industrial Discipline & Problem Solving (20%) */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-on-surface">2. Industrial Discipline & Problem Solving (20%)</span>
                      <span className="text-secondary font-black">{disciplineScore} / 100</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={disciplineScore}
                      onChange={(e) => setDisciplineScore(parseInt(e.target.value, 10))}
                      className="w-full accent-secondary h-2 bg-surface-container-high rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* 3. Soft Skills & Team Communication (15%) */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-on-surface">3. Soft Skills & Stakeholder Communication (15%)</span>
                      <span className="text-purple-700 font-black">{softScore} / 100</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={softScore}
                      onChange={(e) => setSoftScore(parseInt(e.target.value, 10))}
                      className="w-full accent-purple-600 h-2 bg-surface-container-high rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* 4. Friday Logbook Regularity & Punctuality (20%) */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-on-surface">4. Friday Logbook Regularity & Punctuality (20%)</span>
                      <span className="text-emerald-700 font-black">{logbookScore} / 100</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={logbookScore}
                      onChange={(e) => setLogbookScore(parseInt(e.target.value, 10))}
                      className="w-full accent-emerald-600 h-2 bg-surface-container-high rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* 5. Geofenced Attendance & Workplace Reliability (15%) */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-on-surface">5. Geofenced Attendance & Workplace Reliability (15%)</span>
                      <span className="text-amber-700 font-black">{attendanceScore} / 100</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={attendanceScore}
                      onChange={(e) => setAttendanceScore(parseInt(e.target.value, 10))}
                      className="w-full accent-amber-600 h-2 bg-surface-container-high rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Qualitative Remarks */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-on-surface uppercase">
                      Faculty Mentor Performance Remarks & Endorsement
                    </label>
                    <textarea
                      rows={3}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      required
                      placeholder="Enter comprehensive evaluation remarks on candidate's industrial performance..."
                      className="w-full p-3 rounded-2xl bg-surface-container-low border border-outline-variant text-xs text-on-surface focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-between pt-3 border-t border-outline-variant/40">
                    <div className="text-xs text-on-surface-variant">
                      Final Score: <strong className="text-emerald-800 font-black text-sm">{calculateWeightedTotal()}%</strong> ({getCalculatedGrade(calculateWeightedTotal())})
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-700/20 transition-all"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating Digital Certificate...</span>
                        </>
                      ) : (
                        <>
                          <Award className="w-4 h-4" />
                          <span>Finalize Evaluation & Issue Institutional Certificate</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* Certificate Viewer Modal */}
      {showCertModal && (activeCert || selectedCandidate?.certificate) && (
        <CertificateModal
          isOpen={showCertModal}
          onClose={() => setShowCertModal(false)}
          certificate={activeCert || selectedCandidate?.certificate}
          studentName={selectedCandidate?.student_name}
          companyName={selectedCandidate?.company_name}
          rolePosition={selectedCandidate?.role_position}
          score={activeCert?.final_score || selectedCandidate?.final_internship_score || '95'}
          certNumber={activeCert?.certificate_number || selectedCandidate?.certificate?.certificate_number || 'GHR-IMS-2026-00429'}
          issueDate={activeCert?.issue_date || selectedCandidate?.certificate?.issue_date || '20 August 2026'}
        />
      )}
    </div>
  );
};

export default FacultyEvaluationPage;
