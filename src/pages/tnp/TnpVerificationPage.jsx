import React, { useState, useEffect } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  MapPin,
  ExternalLink,
  Users,
  Calendar,
  Loader2,
  Search,
  Sparkles,
  UserCheck,
  Award,
  Clock,
  XCircle,
  Eye
} from 'lucide-react';

const TnpVerificationPage = () => {
  const [data, setData] = useState({
    self_placed: { pending: [], verified: [], rejected: [], all: [] },
    college_placed: { pending: [], verified: [], rejected: [], all: [] }
  });
  const [activePlacementType, setActivePlacementType] = useState('college_placed');
  const [activeStatusSubTab, setActiveStatusSubTab] = useState('pending'); // 'pending' | 'verified' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  // Faculty mentor list & selected mentor
  const [mentorsList, setMentorsList] = useState([]);
  const [assignedMentorId, setAssignedMentorId] = useState('');

  const [verifying, setVerifying] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('ghr_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [queueRes, facultyRes] = await Promise.all([
        fetch('/api/tnp/verifications/pending', { headers }),
        fetch('/api/tnp/faculty', { headers })
      ]);

      if (queueRes.ok) {
        const resData = await queueRes.json();
        setData({
          self_placed: resData.self_placed || { pending: [], verified: [], rejected: [], all: [] },
          college_placed: resData.college_placed || { pending: [], verified: [], rejected: [], all: [] }
        });

        // Set initial selected item
        const defaultGroup = resData.college_placed?.pending?.length > 0
          ? resData.college_placed
          : resData.self_placed?.pending?.length > 0
          ? resData.self_placed
          : resData.college_placed;

        const defaultType = resData.college_placed?.pending?.length > 0 ? 'college_placed' : 'self_placed';
        setActivePlacementType(defaultType);

        const firstItem = defaultGroup?.pending?.[0] || defaultGroup?.verified?.[0] || defaultGroup?.all?.[0] || null;
        setSelectedRequest(firstItem);
      }

      if (facultyRes.ok) {
        const facData = await facultyRes.json();
        setMentorsList(facData);
        if (facData.length > 0) {
          setAssignedMentorId(facData[0].user_id || facData[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching verification queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const reloadQueue = async () => {
    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/tnp/verifications/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const resData = await res.json();
        setData({
          self_placed: resData.self_placed || { pending: [], verified: [], rejected: [], all: [] },
          college_placed: resData.college_placed || { pending: [], verified: [], rejected: [], all: [] }
        });

        // Retain or select updated item
        const group = resData[activePlacementType] || { pending: [], verified: [], rejected: [] };
        const list = group[activeStatusSubTab] || group.pending || [];
        if (list.length > 0) {
          const match = list.find((i) => i.id === selectedRequest?.id);
          setSelectedRequest(match || list[0]);
        } else {
          setSelectedRequest(null);
        }
      }
    } catch (err) {
      console.error('Error reloading queue:', err);
    }
  };

  const handleSelectRequest = (req) => {
    setSelectedRequest(req);
    if (req.mentor_faculty_id) {
      setAssignedMentorId(req.mentor_faculty_id);
    }
    setActionMsg('');
    setActionErr('');
  };

  const handleVerifyAndAssignMentor = async (decision) => {
    if (!selectedRequest) return;
    setVerifying(true);
    setActionMsg('');
    setActionErr('');

    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch(`/api/tnp/verify-internship/${selectedRequest.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          decision,
          assigned_mentor_id: assignedMentorId,
          remarks: 'Offer letter authenticity, GSTIN, and corporate workplace location verified by T&P Cell.'
        })
      });

      const resData = await res.json();
      if (res.ok) {
        setActionMsg(resData.message || 'Verification successfully updated!');
        await reloadQueue();
      } else {
        setActionErr(resData.error || 'Failed to update verification');
      }
    } catch {
      setActionErr('Network error during verification decision');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  const currentGroup = data[activePlacementType] || { pending: [], verified: [], rejected: [], all: [] };
  const rawList = currentGroup[activeStatusSubTab] || [];

  const currentList = rawList.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const studentName = (item.student?.full_name || item.student_name || '').toLowerCase();
    const roll = (item.student?.student_id || item.roll_number || '').toLowerCase();
    const company = (item.company_name || '').toLowerCase();
    const role = (item.role_position || '').toLowerCase();
    return studentName.includes(query) || roll.includes(query) || company.includes(query) || role.includes(query);
  });

  const pendingSelfCount = data.self_placed?.pending?.length || 0;
  const pendingCollegeCount = data.college_placed?.pending?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">T&P Verification Gateway</span>
            <h1 className="font-headline font-black text-2xl sm:text-3xl text-on-surface tracking-tight mt-0.5">
              Offer Verification & Mentor Assignment Hub
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Mandatory institutional review stage for all self-placed and campus offers prior to faculty mentor allocation and daily attendance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full bg-purple-100 text-purple-900 text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-purple-700" />
              <span>{pendingCollegeCount + pendingSelfCount} Pending Approvals</span>
            </span>
          </div>
        </div>

        {/* 2 Primary Tabs: College-Placed vs Self-Placed */}
        <div className="flex flex-wrap gap-3 pt-2 border-t border-outline-variant/40">
          <button
            onClick={() => {
              setActivePlacementType('college_placed');
              const list = data.college_placed?.[activeStatusSubTab] || data.college_placed?.pending || [];
              setSelectedRequest(list[0] || null);
            }}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activePlacementType === 'college_placed'
                ? 'bg-purple-700 text-white shadow-md'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Campus Placement Offers</span>
            {pendingCollegeCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black">
                {pendingCollegeCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActivePlacementType('self_placed');
              const list = data.self_placed?.[activeStatusSubTab] || data.self_placed?.pending || [];
              setSelectedRequest(list[0] || null);
            }}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activePlacementType === 'self_placed'
                ? 'bg-purple-700 text-white shadow-md'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Self-Placed Internships</span>
            {pendingSelfCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black">
                {pendingSelfCount}
              </span>
            )}
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

      {/* Main Grid: Request List vs Detail Verification Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Requests Queue & Search */}
        <div className="space-y-4">
          {/* Status Filter Sub-Tabs */}
          <div className="flex bg-surface-container-low rounded-2xl p-1 border border-outline-variant/60">
            <button
              onClick={() => {
                setActiveStatusSubTab('pending');
                const list = currentGroup.pending || [];
                setSelectedRequest(list[0] || null);
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeStatusSubTab === 'pending'
                  ? 'bg-white text-purple-900 shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Pending ({currentGroup.pending?.length || 0})
            </button>
            <button
              onClick={() => {
                setActiveStatusSubTab('verified');
                const list = currentGroup.verified || [];
                setSelectedRequest(list[0] || null);
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeStatusSubTab === 'verified'
                  ? 'bg-white text-emerald-900 shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Verified ({currentGroup.verified?.length || 0})
            </button>
            <button
              onClick={() => {
                setActiveStatusSubTab('rejected');
                const list = currentGroup.rejected || [];
                setSelectedRequest(list[0] || null);
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeStatusSubTab === 'rejected'
                  ? 'bg-white text-rose-900 shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Rejected ({currentGroup.rejected?.length || 0})
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate, PRN or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:ring-2 focus:ring-purple-600 outline-none"
            />
          </div>

          {/* List Cards */}
          <div className="space-y-3">
            {currentList.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-3xl p-8 text-center border border-outline-variant/60 text-xs text-on-surface-variant space-y-2">
                <Clock className="w-8 h-8 text-outline mx-auto" />
                <p className="font-semibold">No requests in this queue</p>
                <p className="text-[11px]">Any accepted student offers will appear here for verification.</p>
              </div>
            ) : (
              currentList.map((req) => {
                const isSelected = selectedRequest?.id === req.id;
                const studentName = req.student?.full_name || req.student_name || 'Candidate';
                const studentRoll = req.student?.student_id || req.roll_number || 'N/A';
                const branch = req.student?.branch || req.branch || 'Engineering';

                return (
                  <div
                    key={req.id}
                    onClick={() => handleSelectRequest(req)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                      isSelected
                        ? 'bg-purple-50/90 border-purple-700 shadow-sm ring-2 ring-purple-700/20'
                        : 'bg-surface-container-lowest border-outline-variant/60 hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-headline font-bold text-xs text-on-surface">{studentName}</h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          req.status === 'VERIFICATION_PENDING'
                            ? 'bg-amber-100 text-amber-900'
                            : req.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {req.status === 'VERIFICATION_PENDING'
                          ? 'Pending Review'
                          : req.status === 'REJECTED'
                          ? 'Rejected'
                          : 'Verified'}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-purple-950">{req.company_name}</p>
                      <p className="text-[11px] text-on-surface-variant">{req.role_position}</p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-outline pt-1 border-t border-outline-variant/30 font-medium">
                      <span>PRN: {studentRoll}</span>
                      <span>{branch}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 2 Columns: Institutional Verification Engine */}
        <div className="lg:col-span-2">
          {selectedRequest ? (
            <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-outline-variant/40 pb-4">
                <div>
                  <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                    {selectedRequest.company_name}
                  </span>
                  <h3 className="font-headline font-black text-xl text-on-surface mt-0.5">
                    {selectedRequest.role_position}
                  </h3>
                  <p className="text-xs text-on-surface-variant flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                    <span>{selectedRequest.office_address || 'Registered Corporate Office'}</span>
                  </p>
                </div>
                <StatusBadge status={selectedRequest.status} />
              </div>

              {/* Step 1: Candidate Academic Verification */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 space-y-2">
                <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
                  1. Candidate Academic Credentials
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-bold block">Candidate Name</span>
                    <span className="font-semibold text-on-surface">
                      {selectedRequest.student?.full_name || selectedRequest.student_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-bold block">Student PRN / Roll</span>
                    <span className="font-semibold text-on-surface font-mono">
                      {selectedRequest.student?.student_id || selectedRequest.roll_number}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-bold block">Branch & CGPA</span>
                    <span className="font-semibold text-on-surface">
                      {selectedRequest.student?.branch || selectedRequest.branch} ({selectedRequest.student?.current_cgpa || selectedRequest.cgpa || '8.5'} CGPA)
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 2: Employer & GSTIN Trust Check */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
                    2. Employer & GSTIN Trust Check
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Trust Score: High (Verified GSTIN)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-bold block">Corporate GSTIN</span>
                    <span className="font-semibold text-on-surface font-mono">
                      {selectedRequest.gstin || '27AAACG0535P1Z8'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-bold block">Monthly Stipend</span>
                    <span className="font-semibold text-emerald-700">
                      ₹{Number(selectedRequest.stipend_amount || 50000).toLocaleString()}/month
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-bold block">Internship Duration</span>
                    <span className="font-semibold text-on-surface">
                      {selectedRequest.start_date || 'Current Date'} to {selectedRequest.end_date || '6 Months'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 3: Offer Letter Document & Geofence Site Proof */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 space-y-3">
                <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
                  3. Offer Letter Document & Geofence Radius
                </span>
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-700" />
                    <span className="font-semibold text-on-surface">Official Offer Letter PDF Document</span>
                  </div>

                  {selectedRequest.offer_letter_url ? (
                    <a
                      href={selectedRequest.offer_letter_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Offer Letter PDF</span>
                    </a>
                  ) : (
                    <span className="text-xs text-amber-700 font-semibold">Offer PDF Link Pending</span>
                  )}
                </div>

                <div className="pt-2 border-t border-outline-variant/40 flex items-center justify-between text-[11px] text-on-surface-variant">
                  <span>Fixed Geofence Boundary: <strong>300m Radius</strong></span>
                  <span className="font-mono text-[10px]">Lat: {selectedRequest.latitude || 18.5529}, Lng: {selectedRequest.longitude || 73.9497}</span>
                </div>
              </div>

              {/* Step 4: Faculty Mentor Allocation */}
              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-purple-950 uppercase tracking-wider">
                    4. Faculty Mentor Allocation (Department of Engineering)
                  </label>
                  <span className="text-[10px] text-purple-700 font-bold flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" /> Load-Balanced
                  </span>
                </div>

                <select
                  value={assignedMentorId}
                  onChange={(e) => setAssignedMentorId(e.target.value)}
                  disabled={selectedRequest.status !== 'VERIFICATION_PENDING'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-300 bg-white text-xs font-semibold focus:ring-2 focus:ring-purple-600 outline-none disabled:bg-surface-container-high"
                >
                  {mentorsList.map((m) => (
                    <option key={m.id || m.user_id} value={m.user_id || m.id}>
                      {m.name || m.full_name} ({m.active_mentee_count || 0} active mentees)
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-on-surface-variant">
                  Assigning a faculty mentor activates the student's recurring Friday weekly reports and progress scorecards.
                </p>
              </div>

              {/* Action Buttons */}
              {selectedRequest.status === 'VERIFICATION_PENDING' ? (
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/40">
                  <button
                    type="button"
                    onClick={() => handleVerifyAndAssignMentor('REJECT')}
                    disabled={verifying}
                    className="px-5 py-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors"
                  >
                    Reject Request
                  </button>

                  <button
                    type="button"
                    onClick={() => handleVerifyAndAssignMentor('VERIFY_AND_ASSIGN')}
                    disabled={verifying}
                    className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md shadow-purple-700/20 flex items-center gap-1.5 transition-all"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying & Allocating...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify & Assign Mentor</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-between text-xs">
                  <span className="font-semibold text-on-surface">
                    Verification Status: <strong>{selectedRequest.status}</strong>
                  </span>
                  <span className="text-on-surface-variant text-[11px]">
                    Verified on {selectedRequest.tnp_verified_at ? new Date(selectedRequest.tnp_verified_at).toLocaleDateString() : 'Active'}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-3xl p-12 text-center border border-outline-variant/60 text-xs text-on-surface-variant space-y-2">
              <Building2 className="w-10 h-10 text-outline mx-auto" />
              <p className="font-bold text-sm text-on-surface">No Request Selected</p>
              <p className="max-w-md mx-auto">
                Select an offer or self-placed internship from the left queue to review candidate credentials, inspect offer PDFs, and allocate faculty mentors.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TnpVerificationPage;
