import React, { useState, useEffect, useRef } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Users,
  FileUp,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Send,
  Loader2,
  Calendar,
  X,
  Building2,
  Sparkles,
  Download,
  Trash2,
  Clock,
  Briefcase,
  Layers,
  Lock,
  ArrowRight
} from 'lucide-react';

const SelectedStudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bulk Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2027-02-28');
  const [filesPreview, setFilesPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [sendingOffers, setSendingOffers] = useState(false);

  // Single Student Upload Modal State
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [singleStudentTarget, setSingleStudentTarget] = useState(null);
  const [singleStartDate, setSingleStartDate] = useState('2026-09-01');
  const [singleEndDate, setSingleEndDate] = useState('2027-02-28');
  const [singleSelectedFile, setSingleSelectedFile] = useState(null);
  const [singleStipend, setSingleStipend] = useState(50000);
  const [singleRole, setSingleRole] = useState('Software Engineering Intern');
  const [singleUploading, setSingleUploading] = useState(false);

  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');

  // Calculate Friday count between start and end dates
  const calculateFridayCount = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    if (e <= s) return 0;

    let count = 0;
    const cur = new Date(s);
    while (cur <= e) {
      if (cur.getDay() === 5) {
        count++;
        break;
      }
      cur.setDate(cur.getDate() + 1);
    }
    while (cur <= e) {
      count++;
      cur.setDate(cur.getDate() + 7);
    }
    return count;
  };

  const isTenureValid = (sDate, eDate) => {
    if (!sDate || !eDate) return false;
    const s = new Date(sDate);
    const e = new Date(eDate);
    return e > s;
  };

  const fileInputRef = useRef(null);
  const singleFileInputRef = useRef(null);

  useEffect(() => {
    fetchSelectedStudents();
  }, []);

  const fetchSelectedStudents = async () => {
    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/company/selected-students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching selected students:', err);
    } finally {
      setLoading(false);
    }
  };

  // Process raw PDF files selected from disk
  const processUploadedFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    if (!isTenureValid(startDate, endDate)) {
      setActionErr('Please set valid Internship Start Date and End Date in Step 1 first.');
      return;
    }

    setAnalyzing(true);
    setActionErr('');

    try {
      const filesData = await Promise.all(
        Array.from(fileList).map(async (file) => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                filename: file.name,
                size: file.size,
                base64: reader.result,
                url: reader.result
              });
            };
            reader.readAsDataURL(file);
          });
        })
      );

      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/company/offers/bulk-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ uploaded_files: filesData })
      });

      const data = await res.json();
      if (res.ok) {
        setFilesPreview(data);
      } else {
        setActionErr(data.error || 'Failed to analyze selected files');
      }
    } catch (err) {
      console.error('Error analyzing files:', err);
      setActionErr('Network error analyzing files');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileInputChange = (e) => {
    processUploadedFiles(e.target.files);
  };

  // Load sample test offer files for demonstration
  const handleLoadSampleDemoFiles = async () => {
    if (!isTenureValid(startDate, endDate)) {
      setActionErr('Please set valid Internship Start Date and End Date in Step 1 first.');
      return;
    }

    setAnalyzing(true);
    setActionErr('');

    const sampleFiles = [
      {
        filename: 'Alex_Patil_GHR-CS-2023-042_Offer.pdf',
        size: 142000,
        url: 'https://example.com/offers/alex_patil_offer.pdf'
      },
      {
        filename: 'Priya_Sharma_GHR-CS-2023-088_Offer.pdf',
        size: 138000,
        url: 'https://example.com/offers/priya_sharma_offer.pdf'
      },
      {
        filename: 'General_Internship_Offer_Unassigned.pdf',
        size: 125000,
        url: 'https://example.com/offers/general_offer.pdf'
      }
    ];

    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/company/offers/bulk-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ uploaded_files: sampleFiles })
      });

      const data = await res.json();
      if (res.ok) {
        setFilesPreview(data);
      } else {
        setActionErr(data.error || 'Failed to analyze sample files');
      }
    } catch {
      setActionErr('Network error analyzing sample bundle');
    } finally {
      setAnalyzing(false);
    }
  };

  // Manually map an unmatched file to a student candidate
  const handleManualMapStudent = (unmatchedIndex, studentId) => {
    if (!filesPreview) return;
    const targetStudent = filesPreview.eligible_candidates?.find((c) => c.id === studentId || c.student_id === studentId);
    if (!targetStudent) return;

    const unmatchedItem = filesPreview.unmatched_files[unmatchedIndex];
    const newMatchedItem = {
      id: `matched_manual_${Date.now()}`,
      file: unmatchedItem.file,
      file_name: unmatchedItem.file_name || unmatchedItem.filename,
      student_id: targetStudent.student_id,
      student: targetStudent,
      student_name: targetStudent.full_name,
      branch: targetStudent.branch,
      role_position: 'Software Engineering Intern',
      stipend_amount: 50000,
      status: 'MATCHED'
    };

    const nextUnmatched = filesPreview.unmatched_files.filter((_, idx) => idx !== unmatchedIndex);
    const nextMatched = [...filesPreview.matched_files, newMatchedItem];

    setFilesPreview({
      ...filesPreview,
      matched_count: nextMatched.length,
      unmatched_count: nextUnmatched.length,
      matched_files: nextMatched,
      unmatched_files: nextUnmatched
    });
  };

  const handleRemoveMatchedFile = (index) => {
    if (!filesPreview) return;
    const nextMatched = filesPreview.matched_files.filter((_, idx) => idx !== index);
    setFilesPreview({
      ...filesPreview,
      matched_count: nextMatched.length,
      matched_files: nextMatched
    });
  };

  const handleUpdateMatchedField = (index, field, value) => {
    if (!filesPreview) return;
    const nextMatched = [...filesPreview.matched_files];
    nextMatched[index] = { ...nextMatched[index], [field]: value };
    setFilesPreview({
      ...filesPreview,
      matched_files: nextMatched
    });
  };

  // Dispatch all matched offers
  const handleDispatchBulkOffers = async () => {
    if (!filesPreview || !filesPreview.matched_files || filesPreview.matched_files.length === 0) {
      setActionErr('No matched offer letters to dispatch.');
      return;
    }
    if (!isTenureValid(startDate, endDate)) {
      setActionErr('Please set valid Start and End dates before dispatching offers.');
      return;
    }

    setSendingOffers(true);
    setActionMsg('');
    setActionErr('');

    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/company/offers/bulk-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          matched_offers: filesPreview.matched_files.map((item) => ({
            student_id: item.student_id || item.student?.student_id || item.student?.id,
            role_position: item.role_position || 'Software Engineering Intern',
            stipend_amount: item.stipend_amount || 50000,
            start_date: startDate,
            end_date: endDate,
            offer_letter_url: item.file?.url || item.url || 'https://example.com/offers/offer.pdf',
            file_name: item.file_name || item.filename || 'offer_letter.pdf',
            offer_type: 'INTERNSHIP'
          }))
        })
      });

      const data = await res.json();
      if (res.ok) {
        setActionMsg(`Successfully dispatched ${data.created_offers_count || data.dispatched_count} official corporate offer letters! (${calculateFridayCount(startDate, endDate)} Friday reports scheduled)`);
        setShowUploadModal(false);
        setFilesPreview(null);
        fetchSelectedStudents();
      } else {
        setActionErr(data.error || 'Failed to dispatch offer letters');
      }
    } catch {
      setActionErr('Network error sending bulk offers');
    } finally {
      setSendingOffers(false);
    }
  };

  // Open Single Student Upload Modal
  const openSingleStudentModal = (student) => {
    setSingleStudentTarget(student);
    setSingleRole(student.role_position || 'Software Engineering Intern');
    setSingleStipend(student.stipend_amount || 50000);
    setSingleStartDate('2026-09-01');
    setSingleEndDate('2027-02-28');
    setSingleSelectedFile(null);
    setShowSingleModal(true);
  };

  const handleSingleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSingleSelectedFile({
          filename: file.name,
          size: file.size,
          base64: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseSingleSampleFile = () => {
    if (!singleStudentTarget) return;
    const cleanName = (singleStudentTarget.student_name || 'Candidate').replace(/\s+/g, '_');
    const cleanRoll = (singleStudentTarget.student_roll || 'GHR-CS-001').replace(/\s+/g, '-');
    setSingleSelectedFile({
      filename: `${cleanName}_${cleanRoll}_Offer.pdf`,
      size: 145000,
      base64: 'https://example.com/offers/official_offer.pdf'
    });
  };

  const handleSubmitSingleOffer = async (e) => {
    e.preventDefault();
    if (!singleStudentTarget) return;
    if (!isTenureValid(singleStartDate, singleEndDate)) {
      setActionErr('Please specify valid Internship Start Date and End Date.');
      return;
    }
    if (!singleSelectedFile) {
      setActionErr('Please select an Offer Letter PDF file to upload.');
      return;
    }

    setSingleUploading(true);
    setActionMsg('');
    setActionErr('');

    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/company/offers/single-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          student_id: singleStudentTarget.student_id || singleStudentTarget.id,
          drive_id: singleStudentTarget.drive_id,
          role_position: singleRole || singleStudentTarget.role_position || 'Software Engineering Intern',
          stipend_amount: singleStipend || 50000,
          start_date: singleStartDate,
          end_date: singleEndDate,
          offer_letter_url: singleSelectedFile.base64,
          filename: singleSelectedFile.filename
        })
      });

      const data = await res.json();
      if (res.ok) {
        setActionMsg(`Offer letter uploaded and issued successfully to ${singleStudentTarget.student_name}! (${data.friday_reports_count || calculateFridayCount(singleStartDate, singleEndDate)} Friday reports scheduled)`);
        setShowSingleModal(false);
        setSingleStudentTarget(null);
        setSingleSelectedFile(null);
        fetchSelectedStudents();
      } else {
        setActionErr(data.error || 'Failed to issue offer letter');
      }
    } catch {
      setActionErr('Error uploading single offer letter');
    } finally {
      setSingleUploading(false);
    }
  };

  const totalSelected = students.length;
  const totalIssued = students.filter((s) => s.offer_letter_status === 'SENT' || s.offer_letter_status === 'ACCEPTED').length;
  const totalPending = students.filter((s) => s.offer_letter_status === 'NOT_ISSUED' || s.offer_letter_status === 'PENDING').length;
  const totalAccepted = students.filter((s) => s.offer_letter_status === 'ACCEPTED').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Recruiter Management Hub</span>
          <h1 className="font-headline font-black text-2xl sm:text-3xl text-on-surface tracking-tight">
            Selected Students & Offers Hub
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl">
            Review final selected candidates across campus recruitment drives, specify mandatory internship tenure dates, and upload / dispatch verified PDF offer letters.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowUploadModal(true);
            setFilesPreview(null);
          }}
          className="px-5 py-3 rounded-2xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-700/20 transition-all flex-shrink-0"
        >
          <FileUp className="w-4 h-4" />
          <span>Bulk Upload Offer Letters</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase">Total Selected</span>
          <p className="font-headline font-black text-2xl text-on-surface mt-1">{totalSelected}</p>
        </div>
        <div className="p-4 rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm">
          <span className="text-[11px] font-bold text-amber-800 uppercase">Awaiting Offer Letters</span>
          <p className="font-headline font-black text-2xl text-amber-900 mt-1">{totalPending}</p>
        </div>
        <div className="p-4 rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm">
          <span className="text-[11px] font-bold text-blue-800 uppercase">Offers Issued</span>
          <p className="font-headline font-black text-2xl text-blue-900 mt-1">{totalIssued}</p>
        </div>
        <div className="p-4 rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-800 uppercase">Accepted by Students</span>
          <p className="font-headline font-black text-2xl text-emerald-900 mt-1">{totalAccepted}</p>
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {actionErr && (
        <div className="p-4 rounded-2xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{actionErr}</span>
        </div>
      )}

      {/* Selected Students Table */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
          <h2 className="font-headline font-bold text-base text-on-surface flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-700" />
            <span>Selected Candidates Pipeline</span>
          </h2>
          <span className="text-xs text-on-surface-variant font-medium">
            {students.length} Candidates Selected
          </span>
        </div>

        {students.length === 0 ? (
          <p className="text-xs text-on-surface-variant py-10 text-center">
            No candidates marked as Selected across campus placement drives.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-outline-variant/60 text-on-surface-variant font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Candidate & PRN</th>
                  <th className="py-3 px-4">Drive & Role</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4 text-center">CGPA</th>
                  <th className="py-3 px-4 text-center">Offer Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {students.map((cand, index) => {
                  const isIssued = cand.offer_letter_status === 'SENT';
                  const isAccepted = cand.offer_letter_status === 'ACCEPTED';
                  const isRejected = cand.offer_letter_status === 'REJECTED';
                  const isNotIssued = !cand.offer_letter_status || cand.offer_letter_status === 'NOT_ISSUED' || cand.offer_letter_status === 'PENDING';

                  return (
                    <tr key={cand.id || cand.application_id || `cand_${index}`} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3.5 px-4 font-bold text-on-surface">
                        <p>{cand.student_name}</p>
                        <p className="text-[10px] text-on-surface-variant font-normal font-mono">{cand.student_roll}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-on-surface">{cand.drive_title}</p>
                        <p className="text-[10px] text-on-surface-variant">{cand.role_position}</p>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-on-surface">{cand.branch}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-primary">{cand.cgpa}</td>
                      <td className="py-3.5 px-4 text-center">
                        {isNotIssued && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            Offer Not Issued
                          </span>
                        )}
                        {isIssued && (
                          <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            Offer Issued (Pending Student Acceptance)
                          </span>
                        )}
                        {isAccepted && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Offer Accepted & Verified
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            Offer Declined
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {cand.offer_letter_url && (
                          <a
                            href={cand.offer_letter_url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1.5 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container-high text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                            title="View current PDF offer letter"
                          >
                            <FileText className="w-3.5 h-3.5 text-primary" />
                            <span>View PDF</span>
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => openSingleStudentModal(cand)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all shadow-sm ${
                            isNotIssued
                              ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                              : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                          }`}
                        >
                          {isNotIssued ? 'Upload Offer Letter' : 'Re-upload PDF'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Multi-Select PDF Upload & Auto-Matcher Modal (Step 1: Tenure -> Step 2: PDFs) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-4xl rounded-3xl bg-white border border-outline-variant shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-surface-container-high px-6 py-4 border-b border-outline-variant/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Multi-Select & Automated PRN Matcher</span>
                <h3 className="font-headline font-bold text-lg text-on-surface">
                  Bulk Upload & Issue Offer Letters
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setFilesPreview(null);
                }}
                className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-highest"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* STEP 1: Mandatory Tenure & Date Selection (Must be set first) */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-300 space-y-3 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-amber-200/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center">1</span>
                    <h4 className="font-headline font-bold text-sm text-amber-950">
                      Step 1: Set Mandatory Internship Tenure (Start & End Date)
                    </h4>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-700 text-white font-black text-xs shadow-sm flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{calculateFridayCount(startDate, endDate)} Friday Reports Scheduled</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface uppercase mb-1">
                      Internship Start Date *
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setFilesPreview(null); // reset preview if date changed
                      }}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-white text-xs font-semibold text-on-surface focus:ring-2 focus:ring-amber-600 outline-none shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface uppercase mb-1">
                      Internship End Date *
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setFilesPreview(null);
                      }}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-white text-xs font-semibold text-on-surface focus:ring-2 focus:ring-amber-600 outline-none shadow-sm"
                    />
                  </div>
                </div>

                {!isTenureValid(startDate, endDate) ? (
                  <p className="text-[11px] text-rose-700 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Please enter a valid Start Date and End Date (End Date must be after Start Date).</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tenure confirmed: {startDate} to {endDate} ({calculateFridayCount(startDate, endDate)} Friday logbook reports will be automatically scheduled for candidates).</span>
                  </p>
                )}
              </div>

              {/* STEP 2: Select Offer Letter PDFs (Unlocked only when Step 1 dates are set) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <span className={`w-6 h-6 rounded-full font-black text-xs flex items-center justify-center ${
                    isTenureValid(startDate, endDate) ? 'bg-amber-700 text-white' : 'bg-surface-container-high text-on-surface-variant'
                  }`}>2</span>
                  <h4 className="font-headline font-bold text-sm text-on-surface">
                    Step 2: Select Candidate Offer Letter PDFs (Multi-Select)
                  </h4>
                </div>

                {!isTenureValid(startDate, endDate) ? (
                  <div className="p-8 rounded-3xl border-2 border-dashed border-outline-variant/60 bg-surface-container-low text-center space-y-2">
                    <Lock className="w-8 h-8 text-outline mx-auto" />
                    <p className="font-headline font-bold text-xs text-on-surface-variant">
                      Please confirm Internship Start Date & End Date in Step 1 above to unlock Offer Letter PDF upload.
                    </p>
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      multiple
                      accept=".pdf"
                      ref={fileInputRef}
                      onChange={handleFileInputChange}
                      className="hidden"
                    />

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="p-8 rounded-3xl border-2 border-dashed border-amber-300 bg-amber-50/40 hover:bg-amber-50 hover:border-amber-500 cursor-pointer transition-all text-center space-y-3 animate-in fade-in"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
                        <FileUp className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-headline font-bold text-sm text-on-surface">
                          Select One or Multiple PDF Offer Letters from Computer
                        </h4>
                        <p className="text-xs text-on-surface-variant mt-1">
                          Select multiple files at once. Filenames containing Student PRNs (e.g., <span className="font-mono font-bold text-amber-900">GHR-CS-2023-042</span>) or Candidate Names are auto-matched.
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-3 pt-1">
                        <button
                          type="button"
                          className="px-4 py-2 rounded-xl bg-amber-700 text-white font-bold text-xs hover:bg-amber-800 shadow-sm"
                        >
                          Browse Local PDF Files
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLoadSampleDemoFiles();
                          }}
                          className="px-3.5 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold text-xs hover:bg-amber-100/60 shadow-sm"
                        >
                          Load Sample Test PDFs (Demo)
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Analysis Loader */}
              {analyzing && (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
                  <p className="text-xs text-on-surface-variant font-medium">
                    Scanning PDF files and matching candidate records...
                  </p>
                </div>
              )}

              {/* STEP 3: Matcher Results Preview & Confirmation */}
              {!analyzing && filesPreview && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-between text-xs">
                    <span className="font-bold text-on-surface">
                      Analysis Results: {filesPreview.total_files} Files Scanned (Tenure: {startDate} to {endDate})
                    </span>
                    <div className="flex items-center gap-3 font-semibold">
                      <span className="text-emerald-700">✓ {filesPreview.matched_count} Matched</span>
                      {filesPreview.unmatched_count > 0 && (
                        <span className="text-amber-800">⚠️ {filesPreview.unmatched_count} Unmatched</span>
                      )}
                    </div>
                  </div>

                  {/* Matched Files Table */}
                  {filesPreview.matched_files && filesPreview.matched_files.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-headline font-bold text-sm text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Matched Offer Letters ({filesPreview.matched_files.length})</span>
                      </h4>

                      <div className="border border-emerald-200 rounded-2xl overflow-hidden bg-emerald-50/20">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-emerald-100/60 text-emerald-900 font-bold uppercase text-[10px]">
                            <tr>
                              <th className="py-2.5 px-4">PDF Filename</th>
                              <th className="py-2.5 px-4">Matched Candidate & PRN</th>
                              <th className="py-2.5 px-4">Role Title</th>
                              <th className="py-2.5 px-4">Monthly Stipend</th>
                              <th className="py-2.5 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-emerald-100">
                            {filesPreview.matched_files.map((item, index) => (
                              <tr key={item.id || index} className="hover:bg-emerald-50/50">
                                <td className="py-3 px-4 font-mono font-medium text-[11px] text-on-surface">
                                  <div className="flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                    <span className="truncate max-w-[180px]">{item.file_name}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <p className="font-bold text-on-surface">{item.student_name}</p>
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                                    {item.student_id}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <input
                                    type="text"
                                    value={item.role_position || ''}
                                    onChange={(e) => handleUpdateMatchedField(index, 'role_position', e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-outline-variant bg-white text-xs font-medium text-on-surface focus:ring-1 focus:ring-primary outline-none"
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1">
                                    <span className="text-on-surface-variant font-bold text-xs">₹</span>
                                    <input
                                      type="number"
                                      value={item.stipend_amount || 50000}
                                      onChange={(e) => handleUpdateMatchedField(index, 'stipend_amount', e.target.value)}
                                      className="w-24 px-2 py-1.5 rounded-lg border border-outline-variant bg-white text-xs font-medium text-on-surface focus:ring-1 focus:ring-primary outline-none"
                                    />
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMatchedFile(index)}
                                    className="p-1.5 rounded-lg text-on-surface-variant hover:text-rose-600 hover:bg-rose-50"
                                    title="Remove from batch"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Unmatched Files Section with Manual Mapper */}
                  {filesPreview.unmatched_files && filesPreview.unmatched_files.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-headline font-bold text-sm text-amber-800 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>Unmatched Files ({filesPreview.unmatched_files.length})</span>
                      </h4>

                      <div className="space-y-2">
                        {filesPreview.unmatched_files.map((item, index) => (
                          <div
                            key={item.id || index}
                            className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-amber-700 flex-shrink-0" />
                              <div>
                                <p className="font-mono font-bold text-on-surface">{item.file_name || item.filename}</p>
                                <p className="text-[10px] text-amber-800">{item.reason}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-semibold text-on-surface-variant">
                                Assign Candidate:
                              </span>
                              <select
                                defaultValue=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleManualMapStudent(index, e.target.value);
                                  }
                                }}
                                className="px-3 py-1.5 rounded-xl border border-amber-300 bg-white text-xs font-bold text-on-surface focus:ring-2 focus:ring-primary outline-none"
                              >
                                <option value="" disabled>
                                  Choose selected candidate...
                                </option>
                                {filesPreview.eligible_candidates?.map((c) => (
                                  <option key={c.id} value={c.student_id}>
                                    {c.full_name} ({c.student_id})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-surface-container-high px-6 py-4 border-t border-outline-variant/60 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setFilesPreview(null);
                }}
                className="px-4 py-2 rounded-xl bg-white border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container-low"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDispatchBulkOffers}
                disabled={sendingOffers || !filesPreview || !filesPreview.matched_files || filesPreview.matched_files.length === 0}
                className="px-6 py-2.5 rounded-2xl bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-amber-700/20 flex items-center gap-2 transition-all"
              >
                {sendingOffers ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Issuing Offer Letters...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>
                      Issue & Dispatch {filesPreview?.matched_files?.length ? `(${filesPreview.matched_files.length}) Offer Letters` : 'Offers'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Single Student Offer Letter Issuance Modal (Step 1: Tenure -> Step 2: Select PDF) */}
      {showSingleModal && singleStudentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-outline-variant shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-surface-container-high px-6 py-4 border-b border-outline-variant/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Direct Offer Issuance</span>
                <h3 className="font-headline font-bold text-lg text-on-surface">
                  Issue Offer Letter to Candidate
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowSingleModal(false);
                  setSingleStudentTarget(null);
                  setSingleSelectedFile(null);
                }}
                className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-highest"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSingleOffer} className="p-6 space-y-5">
              {/* Candidate Info Summary */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-on-surface text-sm">{singleStudentTarget.student_name}</p>
                  <p className="font-mono text-on-surface-variant text-[11px]">{singleStudentTarget.student_roll} — {singleStudentTarget.branch}</p>
                  <p className="text-[11px] text-amber-800 font-semibold mt-0.5">{singleStudentTarget.drive_title}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">
                  Selected
                </span>
              </div>

              {/* STEP 1: Mandatory Tenure Dates */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-700" />
                    Step 1: Set Internship Tenure
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-700 text-white font-bold text-[10px]">
                    {calculateFridayCount(singleStartDate, singleEndDate)} Friday Reports
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface uppercase mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={singleStartDate}
                      onChange={(e) => setSingleStartDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-semibold focus:ring-2 focus:ring-amber-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface uppercase mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={singleEndDate}
                      onChange={(e) => setSingleEndDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-semibold focus:ring-2 focus:ring-amber-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Role & Stipend */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-on-surface uppercase mb-1">Role Title</label>
                  <input
                    type="text"
                    value={singleRole}
                    onChange={(e) => setSingleRole(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-white text-xs font-semibold focus:ring-2 focus:ring-amber-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-on-surface uppercase mb-1">Monthly Stipend (₹)</label>
                  <input
                    type="number"
                    value={singleStipend}
                    onChange={(e) => setSingleStipend(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-white text-xs font-semibold focus:ring-2 focus:ring-amber-600 outline-none"
                  />
                </div>
              </div>

              {/* STEP 2: Select Offer Letter PDF */}
              <div className="space-y-2 text-xs">
                <label className="block font-bold text-on-surface uppercase text-[11px]">
                  Step 2: Select Offer Letter PDF *
                </label>

                <input
                  type="file"
                  accept=".pdf"
                  ref={singleFileInputRef}
                  onChange={handleSingleFileSelect}
                  className="hidden"
                />

                {singleSelectedFile ? (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                      <span className="font-mono font-bold text-emerald-900 truncate">{singleSelectedFile.filename}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSingleSelectedFile(null)}
                      className="text-rose-600 hover:text-rose-800 text-xs font-bold ml-2"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => singleFileInputRef.current?.click()}
                      className="flex-1 py-2.5 px-3 rounded-xl border border-dashed border-amber-400 bg-amber-50/40 text-amber-900 font-bold hover:bg-amber-100/60 flex items-center justify-center gap-1.5"
                    >
                      <FileUp className="w-4 h-4" />
                      <span>Browse PDF File</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleUseSingleSampleFile}
                      className="px-3 py-2.5 rounded-xl border border-outline-variant bg-white text-on-surface-variant font-bold hover:bg-surface-container-low"
                    >
                      Use Demo PDF
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Action */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-outline-variant/40">
                <button
                  type="button"
                  onClick={() => {
                    setShowSingleModal(false);
                    setSingleStudentTarget(null);
                    setSingleSelectedFile(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container-low"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={singleUploading || !singleSelectedFile || !isTenureValid(singleStartDate, singleEndDate)}
                  className="px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
                >
                  {singleUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Issue Official Offer Letter</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectedStudentsPage;
