import React, { useState, useEffect } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Building2,
  Save,
  Loader2,
  Users,
  Calendar,
  Sparkles,
  Search,
  Clock,
  Briefcase,
  ShieldCheck,
  Check
} from 'lucide-react';

const CompanyEvaluationPage = () => {
  const [interns, setInterns] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'evaluated'
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Performance Form State
  const [technicalScore, setTechnicalScore] = useState(95);
  const [softSkillsScore, setSoftSkillsScore] = useState(92);
  const [attendanceRating, setAttendanceRating] = useState(95);
  const [isPpoRecommended, setIsPpoRecommended] = useState(true);
  const [remarks, setRemarks] = useState('Excellent performance on microservices refactoring and Kubernetes deployment pipelines.');

  const [saving, setSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');

  useEffect(() => {
    fetchInterns();
  }, []);

  const fetchInterns = async () => {
    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/company/interns', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setInterns(list);

        const pendingList = list.filter((i) => !i.is_evaluated && !i.evaluated_at);
        const evaluatedList = list.filter((i) => i.is_evaluated || Boolean(i.evaluated_at));

        if (activeTab === 'pending' && pendingList.length > 0) {
          selectCandidate(pendingList[0]);
        } else if (activeTab === 'evaluated' && evaluatedList.length > 0) {
          selectCandidate(evaluatedList[0]);
        } else if (list.length > 0) {
          selectCandidate(list[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching interns:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectCandidate = (cand) => {
    if (!cand) {
      setSelectedIntern(null);
      return;
    }
    setSelectedIntern(cand);
    setTechnicalScore(cand.technical_score || 95);
    setSoftSkillsScore(cand.soft_skills_score || 92);
    setAttendanceRating(cand.attendance_rating || 95);
    setIsPpoRecommended(Boolean(cand.ppo_recommended));
    setRemarks(cand.company_feedback || 'Demonstrated exceptional technical capability, initiative, and teamwork.');
    setActionMsg('');
    setActionErr('');
  };

  const calculateTotalScore = () => {
    return ((technicalScore * 0.5) + (softSkillsScore * 0.3) + (attendanceRating * 0.2)).toFixed(1);
  };

  const handleSaveEvaluation = async (e) => {
    e.preventDefault();
    if (!selectedIntern) return;

    setSaving(true);
    setActionMsg('');
    setActionErr('');

    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch(`/api/company/interns/${selectedIntern.internship_id || selectedIntern.student_id}/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          student_id: selectedIntern.student_id,
          technical_score: technicalScore,
          soft_skills_score: softSkillsScore,
          attendance_rating: attendanceRating,
          ppo_recommended: isPpoRecommended,
          comments: remarks
        })
      });

      const resData = await res.json();
      if (res.ok) {
        setActionMsg(resData.message || 'Performance appraisal and PPO status recorded successfully!');
        const updatedCandidate = {
          ...selectedIntern,
          is_evaluated: true,
          company_evaluation_score: resData.score,
          technical_score: technicalScore,
          soft_skills_score: softSkillsScore,
          attendance_rating: attendanceRating,
          ppo_recommended: isPpoRecommended,
          company_feedback: remarks,
          evaluated_at: new Date().toISOString()
        };

        setInterns((prev) =>
          prev.map((i) => (i.student_id === selectedIntern.student_id ? updatedCandidate : i))
        );
        setSelectedIntern(updatedCandidate);
        setActiveTab('evaluated');
      } else {
        setActionErr(resData.error || 'Failed to submit appraisal');
      }
    } catch {
      setActionErr('Network error saving intern evaluation');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  const pendingInterns = interns.filter((i) => !i.is_evaluated && !i.evaluated_at);
  const evaluatedInterns = interns.filter((i) => i.is_evaluated || Boolean(i.evaluated_at));
  const currentTabInterns = activeTab === 'pending' ? pendingInterns : evaluatedInterns;

  const filteredInterns = currentTabInterns.filter((cand) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      cand.student_name?.toLowerCase().includes(q) ||
      cand.student_roll?.toLowerCase().includes(q) ||
      cand.role_position?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm space-y-4">
        <div>
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Corporate Assessment</span>
          <h1 className="font-headline font-black text-2xl sm:text-3xl text-on-surface tracking-tight mt-0.5">
            Employer Intern Performance Evaluation & PPO Hub
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl mt-1">
            Evaluate selected candidates and active interns from your placement drives, record industrial competency scores, and issue Pre-Placement Offers (PPO).
          </p>
        </div>

        {/* 2 Tabs: Pending vs Evaluated */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-outline-variant/40">
          <button
            type="button"
            onClick={() => {
              setActiveTab('pending');
              if (pendingInterns.length > 0) selectCandidate(pendingInterns[0]);
              else setSelectedIntern(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-amber-700 text-white shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Evaluation</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/10 font-black">
              {pendingInterns.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('evaluated');
              if (evaluatedInterns.length > 0) selectCandidate(evaluatedInterns[0]);
              else setSelectedIntern(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'evaluated'
                ? 'bg-amber-700 text-white shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Evaluated Candidates</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/10 font-black">
              {evaluatedInterns.length}
            </span>
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

      {/* Main Layout: Selected Interns List vs Evaluation Form / Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Candidates Queue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-headline font-bold text-sm text-on-surface">
              {activeTab === 'pending' ? 'Pending Candidates' : 'Evaluated Candidates'} ({currentTabInterns.length})
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
              Corporate Cohort
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'pending' ? 'pending' : 'evaluated'} student or PRN...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:ring-2 focus:ring-amber-600 outline-none"
            />
          </div>

          {/* List Cards */}
          <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {filteredInterns.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-3xl p-8 text-center border border-outline-variant/60 text-xs text-on-surface-variant space-y-2">
                <Users className="w-8 h-8 text-outline mx-auto" />
                <p className="font-semibold text-on-surface">
                  {activeTab === 'pending' ? 'No Pending Candidates' : 'No Evaluated Candidates Yet'}
                </p>
                <p className="text-[11px]">
                  {activeTab === 'pending'
                    ? 'All selected candidates have been evaluated.'
                    : 'Evaluated candidates and PPO recommendations will be listed here.'}
                </p>
              </div>
            ) : (
              filteredInterns.map((cand) => {
                const isSelected = selectedIntern?.student_id === cand.student_id;

                return (
                  <div
                    key={cand.id || cand.student_id}
                    onClick={() => selectCandidate(cand)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                      isSelected
                        ? 'bg-amber-50/90 border-amber-700 shadow-sm ring-2 ring-amber-700/20'
                        : 'bg-surface-container-lowest border-outline-variant/60 hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline font-bold text-xs text-on-surface">{cand.student_name}</h4>
                      {cand.ppo_recommended ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-600" /> PPO Offered
                        </span>
                      ) : cand.is_evaluated ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900">
                          ✓ Evaluated ({cand.company_evaluation_score}%)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                          Pending
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-bold text-amber-950">{cand.role_position}</p>
                      <p className="text-[11px] text-on-surface-variant font-mono">{cand.student_roll} | {cand.branch}</p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-outline pt-1 border-t border-outline-variant/30 font-medium">
                      <span>Score: <strong>{cand.company_evaluation_score ? `${cand.company_evaluation_score}/100` : 'Not Rated'}</strong></span>
                      <span>Logs: {cand.attendance_count} days</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 2 Columns: Appraisal Form OR Evaluated Details */}
        <div className="lg:col-span-2">
          {selectedIntern ? (
            <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm space-y-6">
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-outline-variant/40 pb-4">
                <div>
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                    {selectedIntern.company_name}
                  </span>
                  <h3 className="font-headline font-black text-xl text-on-surface mt-0.5">
                    {selectedIntern.student_name}
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-1">
                    PRN: <strong className="font-mono">{selectedIntern.student_roll}</strong> | Branch: <strong>{selectedIntern.branch}</strong> ({selectedIntern.cgpa} CGPA)
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase block">
                    {activeTab === 'evaluated' || selectedIntern.is_evaluated ? 'Employer Rating' : 'Calculated Rating'}
                  </span>
                  <span className="font-headline font-black text-2xl text-amber-700">
                    {selectedIntern.company_evaluation_score || calculateTotalScore()} / 100
                  </span>
                </div>
              </div>

              {/* IF EVALUATED TAB: ONLY SHOW DETAILS (NO RANGE BARS / FORM) */}
              {activeTab === 'evaluated' || selectedIntern.is_evaluated ? (
                <div className="space-y-6">
                  {/* Status Banner */}
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <div>
                        <p className="font-headline font-bold text-xs text-emerald-950">
                          Official Corporate Appraisal Recorded
                        </p>
                        <p className="text-[11px] text-emerald-800">
                          Submitted on {selectedIntern.evaluated_at ? new Date(selectedIntern.evaluated_at).toLocaleDateString() : 'Recent'}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-200/70 text-emerald-900 text-xs font-bold">
                      Completed
                    </span>
                  </div>

                  {/* 3 Industrial Competency Score Display Cards */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider block">
                      Industrial Competency Ratings
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase block">
                          1. Technical Execution (50%)
                        </span>
                        <p className="font-headline font-black text-xl text-amber-800 mt-1">
                          {selectedIntern.technical_score || 95} / 100
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase block">
                          2. Soft Skills & Teamwork (30%)
                        </span>
                        <p className="font-headline font-black text-xl text-amber-800 mt-1">
                          {selectedIntern.soft_skills_score || 92} / 100
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase block">
                          3. Attendance & Punctuality (20%)
                        </span>
                        <p className="font-headline font-black text-xl text-amber-800 mt-1">
                          {selectedIntern.attendance_rating || 95} / 100
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* PPO Status Display */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider block">
                      Pre-Placement Offer (PPO) Decision
                    </span>
                    {selectedIntern.ppo_recommended ? (
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <div>
                          <p className="font-headline font-bold text-xs text-emerald-950">
                            Full-Time Pre-Placement Offer (PPO) Recommended
                          </p>
                          <p className="text-[11px] text-emerald-800 mt-0.5">
                            Candidate has been officially recommended for full-time conversion and notified in their Offers Hub.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 text-xs text-on-surface-variant">
                        Regular Internship Completed (No PPO Recommended)
                      </div>
                    )}
                  </div>

                  {/* Qualitative Feedback Details */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider block">
                      Employer Performance Feedback & Comments
                    </span>
                    <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 text-xs text-on-surface leading-relaxed">
                      "{selectedIntern.company_feedback || 'Demonstrated outstanding technical contribution and dedication throughout the internship.'}"
                    </div>
                  </div>
                </div>
              ) : (
                /* PENDING TAB: SHOW INTERACTIVE EVALUATION FORM */
                <form onSubmit={handleSaveEvaluation} className="space-y-6">
                  {/* Multi-Factor Score Sliders */}
                  <div className="space-y-4 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                      Industrial Competency Scoring (Weighted Aggregate)
                    </span>

                    {/* Factor 1: Technical Score (50%) */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-on-surface">1. Technical Execution & Code Quality (50% weight)</span>
                        <span className="font-bold text-amber-800">{technicalScore} / 100</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={technicalScore}
                        onChange={(e) => setTechnicalScore(parseInt(e.target.value, 10))}
                        className="w-full accent-amber-700 h-2 bg-surface-container-high rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Factor 2: Soft Skills & Teamwork (30%) */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-on-surface">2. Collaboration, Communication & Ownership (30% weight)</span>
                        <span className="font-bold text-amber-800">{softSkillsScore} / 100</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={softSkillsScore}
                        onChange={(e) => setSoftSkillsScore(parseInt(e.target.value, 10))}
                        className="w-full accent-amber-700 h-2 bg-surface-container-high rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Factor 3: Attendance & Punctuality (20%) */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-on-surface">3. Geofenced Attendance & Punctuality (20% weight)</span>
                        <span className="font-bold text-amber-800">{attendanceRating} / 100</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={attendanceRating}
                        onChange={(e) => setAttendanceRating(parseInt(e.target.value, 10))}
                        className="w-full accent-amber-700 h-2 bg-surface-container-high rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Pre-Placement Offer (PPO) Recommendation Card */}
                  <div className={`p-5 rounded-2xl border transition-all ${
                    isPpoRecommended ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-600/20' : 'bg-surface-container-low border-outline-variant/60'
                  }`}>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPpoRecommended}
                        onChange={(e) => setIsPpoRecommended(e.target.checked)}
                        className="w-5 h-5 mt-0.5 rounded text-emerald-600 focus:ring-emerald-600"
                      />
                      <div className="space-y-1">
                        <span className="font-headline font-bold text-xs text-on-surface flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          Recommend Candidate for Full-Time Pre-Placement Offer (PPO)
                        </span>
                        <p className="text-[11px] text-on-surface-variant leading-relaxed">
                          Recommending a PPO instantly notifies the student in their <strong>PPO & Offers Hub</strong> and informs the college T&P Department for conversion tracking.
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Qualitative Feedback */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                      Employer Performance Appraisal & Feedback
                    </label>
                    <textarea
                      rows={4}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Summarize the intern's contributions, milestones achieved, and professional growth..."
                      className="w-full p-3.5 rounded-2xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-amber-600 outline-none"
                    ></textarea>
                  </div>

                  <div className="flex items-center justify-end pt-2 border-t border-outline-variant/40">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-8 py-3 rounded-2xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-md shadow-amber-700/20 flex items-center gap-2 transition-all"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>Save Intern Appraisal & PPO Status</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-3xl p-12 text-center border border-outline-variant/60 text-xs text-on-surface-variant space-y-2">
              <Users className="w-10 h-10 text-outline mx-auto" />
              <p className="font-bold text-sm text-on-surface">No Candidate Selected</p>
              <p className="max-w-md mx-auto">
                Select a candidate from the left queue to evaluate industrial performance and issue PPO recommendations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyEvaluationPage;
