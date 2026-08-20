import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Users,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  Plus,
  Trash2,
  Search,
  Building2,
  Calendar,
  Send,
  Loader2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  X,
  FileUp,
  Lock
} from 'lucide-react';

const TnpSelectedStudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Multi-upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2027-02-28');
  const [filesPreview, setFilesPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [sendingOffers, setSendingOffers] = useState(false);

  // Single upload Modal State
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [singleStudentTarget, setSingleStudentTarget] = useState(null);
  const [singleStartDate, setSingleStartDate] = useState('2026-09-01');
  const [singleEndDate, setSingleEndDate] = useState('2027-02-28');
  const [singleRole, setSingleRole] = useState('Software Engineering Intern');
  const [singleStipend, setSingleStipend] = useState('50000');
  const [singleFile, setSingleFile] = useState(null);
  const [singleUploading, setSingleUploading] = useState(false);

  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');

  const fileInputRef = useRef(null);
  const singleFileInputRef = useRef(null);

  const calculateFridayCount = (sDate, eDate) => {
    if (!sDate || !eDate) return 0;
    const s = new Date(sDate);
    const e = new Date(eDate);
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

  useEffect(() => {
    fetchSelectedStudents();
  }, []);

  const fetchSelectedStudents = async () => {
    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/tnp/selected-students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching T&P selected students:', err);
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
                url: reader.result,
                base64: reader.result
              });
            };
            reader.onerror = () => {
              resolve({
                filename: file.name,
                size: file.size,
                url: 'https://example.com/offers/offer.pdf'
              });
            };
            reader.readAsDataURL(file);
          });
        })
      );

      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/tnp/offers/sample-files', {
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
        setActionErr(data.error || 'Failed to analyze uploaded files');
      }
    } catch {
      setActionErr('Network error analyzing offer letters');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLoadSampleDemoFiles = async () => {
    if (!isTenureValid(startDate, endDate)) {
      setActionErr('Please set valid Internship Start Date and End Date in Step 1 first.');
      return;
    }

    setAnalyzing(true);
    setActionErr('');

    const sampleFiles = [
      {
        filename: 'Offer_Alex_Patil_GHR_CS_042.pdf',
        size: 145000,
        url: 'https://example.com/offers/alex_patil_offer.pdf'
      },
      {
        filename: 'Offer_Priya_Sharma_GHR_CS_088.pdf',
        size: 135000,
        url: 'https://example.com/offers/priya_sharma_offer.pdf'
      },
      {
        filename: 'Offer_Campus_Selection_General.pdf',
        size: 120000,
        url: 'https://example.com/offers/general_candidate_offer.pdf'
      }
    ];

    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/tnp/offers/sample-files', {
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
      setActionErr('Network error analyzing sample files');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleManualMapStudent = (unmatchedIndex, studentId) => {
    if (!filesPreview) return;
    const targetStudent = filesPreview.eligible_candidates?.find((c) => c.id === studentId || c.student_id === studentId);
    if (!targetStudent) return;

    const unmatchedItem = filesPreview.unmatched_files[unmatchedIndex];
    const newMatchedItem = {
      id: `matched_manual_${Date.now()}`,
      file: unmatchedItem.file,
      file_name: unmatchedItem.file_name || unmatchedItem.filename,
      student_id: targetStudent.student_id || targetStudent.id,
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
      const res = await fetch('/api/tnp/offers/bulk-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          matched_offers: filesPreview.matched_files.map((item) => ({
            student_id: item.student_id,
            role_position: item.role_position || 'Software Engineering Intern',
            stipend_amount: item.stipend_amount || 50000,
            start_date: startDate,
            end_date: endDate,
            offer_letter_url: item.file?.url || item.url || 'https://example.com/offers/official_offer.pdf',
            file_name: item.file_name || item.filename || 'offer_letter.pdf',
            offer_type: 'ON_CAMPUS_INTERNSHIP'
          }))
        })
      });

      const data = await res.json();
      if (res.ok) {
        setActionMsg(`Successfully issued and dispatched ${data.created_offers_count} official on-campus offer letters! (${calculateFridayCount(startDate, endDate)} Friday reports scheduled)`);
        setShowUploadModal(false);
        setFilesPreview(null);
        fetchSelectedStudents();
      } else {
        setActionErr(data.error || 'Failed to dispatch offer letters');
      }
    } catch {
      setActionErr('Network error sending bulk offer letters');
    } finally {
      setSendingOffers(false);
    }
  };

  const handleOpenSingleModal = (cand) => {
    setSingleStudentTarget(cand);
    setSingleRole(cand.role_position || 'Software Engineering Intern');
    setSingleStipend(cand.stipend_amount || 50000);
    setSingleStartDate('2026-09-01');
    setSingleEndDate('2027-02-28');
    setSingleFile(null);
    setShowSingleModal(true);
  };

  const handleSingleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSingleFile({
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
    setSingleFile({
      filename: `Offer_${cleanName}_${cleanRoll}.pdf`,
      size: 140000,
      base64: 'https://example.com/offers/tnp_on_campus_offer.pdf'
    });
  };

  const handleSubmitSingleOffer = async (e) => {
    e.preventDefault();
    if (!singleStudentTarget) return;
    if (!isTenureValid(singleStartDate, singleEndDate)) {
      setActionErr('Please specify valid Internship Start Date and End Date.');
      return;
    }
    if (!singleFile) {
      setActionErr('Please select an Offer Letter PDF file to upload.');
      return;
    }

    setSingleUploading(true);
    setActionMsg('');
    setActionErr('');

    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/tnp/offers/single-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          student_id: singleStudentTarget.student_id || singleStudentTarget.id,
          drive_id: singleStudentTarget.drive_id,
          company_name: singleStudentTarget.company_name,
          role_position: singleRole,
          stipend_amount: singleStipend,
          start_date: singleStartDate,
          end_date: singleEndDate,
          offer_letter_url: singleFile.base64,
          filename: singleFile.filename
        })
      });

      const data = await res.json();
      if (res.ok) {
        setActionMsg(`Offer letter issued successfully to ${singleStudentTarget.student_name}! (${data.friday_reports_count || calculateFridayCount(singleStartDate, singleEndDate)} Friday reports scheduled)`);
        setShowSingleModal(false);
        setSingleStudentTarget(null);
        setSingleFile(null);
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

  // Filter students based on search and status
  const filteredStudents = students.filter((cand) => {
    const matchesSearch =
      cand.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cand.student_roll.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cand.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cand.drive_title.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'PENDING') {
      return !cand.offer_letter_status || cand.offer_letter_status === 'NOT_ISSUED' || cand.offer_letter_status === 'PENDING';
    }
    if (activeFilter === 'ISSUED') {
      return cand.offer_letter_status === 'SENT';
    }
    if (activeFilter === 'ACCEPTED') {
      return cand.offer_letter_status === 'ACCEPTED';
    }
    return true;
  });

  const totalSelected = students.length;
  const totalPending = students.filter((s) => !s.offer_letter_status || s.offer_letter_status === 'NOT_ISSUED' || s.offer_letter_status === 'PENDING').length;
  const totalIssued = students.filter((s) => s.offer_letter_status === 'SENT').length;
  const totalAccepted = students.filter((s) => s.offer_letter_status === 'ACCEPTED').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
            <Building2 className="w-3.5 h-3.5" />
            <span>T&P Campus Drives Offer Management</span>
          </div>
          <h1 className="font-headline font-black text-2xl sm:text-3xl text-on-surface tracking-tight">
            Selected Students & Offers Hub
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl">
            Manage candidates selected across all on-campus drives, specify mandatory internship tenure dates, and upload / dispatch verified PDF offer letters.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowUploadModal(true);
            setFilesPreview(null);
          }}
          className="px-5 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-primary/20 transition-all flex-shrink-0"
        >
          <Upload className="w-4 h-4" />
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
          <span className="text-[11px] font-bold text-amber-800 uppercase">Pending Offer Letters</span>
          <p className="font-headline font-black text-2xl text-amber-900 mt-1">{totalPending}</p>
        </div>
        <div className="p-4 rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm">
          <span className="text-[11px] font-bold text-blue-800 uppercase">Offers Issued</span>
          <p className="font-headline font-black text-2xl text-blue-900 mt-1">{totalIssued}</p>
        </div>
        <div className="p-4 rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-800 uppercase">Accepted & Auto-Verified</span>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/40 pb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-headline font-bold text-base text-on-surface">Selected Candidates Pipeline</h2>
            <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-[11px] font-bold text-on-surface-variant">
              {filteredStudents.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidate, PRN, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 rounded-xl border border-outline-variant bg-white text-xs text-on-surface focus:ring-2 focus:ring-primary outline-none w-64"
              />
            </div>

            <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant/60 text-xs font-bold">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-3 py-1 rounded-lg transition-colors ${activeFilter === 'ALL' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter('PENDING')}
                className={`px-3 py-1 rounded-lg transition-colors ${activeFilter === 'PENDING' ? 'bg-white shadow-sm text-amber-800' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Pending
              </button>
              <button
                onClick={() => setActiveFilter('ISSUED')}
                className={`px-3 py-1 rounded-lg transition-colors ${activeFilter === 'ISSUED' ? 'bg-white shadow-sm text-blue-800' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Issued
              </button>
              <button
                onClick={() => setActiveFilter('ACCEPTED')}
                className={`px-3 py-1 rounded-lg transition-colors ${activeFilter === 'ACCEPTED' ? 'bg-white shadow-sm text-emerald-800' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Accepted
              </button>
            </div>
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <p className="text-xs text-on-surface-variant py-10 text-center">
            No candidates match the selected filter.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-outline-variant/60 text-on-surface-variant font-bold uppercase text-[10px]">
                  <th className="py-3 px-4">Candidate & PRN</th>
                  <th className="py-3 px-4">Company & Drive</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4 text-center">CGPA</th>
                  <th className="py-3 px-4 text-center">Offer Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {filteredStudents.map((cand, index) => {
                  const isIssued = cand.offer_letter_status === 'SENT';
                  const isAccepted = cand.offer_letter_status === 'ACCEPTED';
                  const isRejected = cand.offer_letter_status === 'REJECTED';
                  const isNotIssued = !cand.offer_letter_status || cand.offer_letter_status === 'NOT_ISSUED' || cand.offer_letter_status === 'PENDING';

                  return (
                    <tr key={cand.id || `cand_${index}`} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3.5 px-4 font-bold text-on-surface">
                        <p>{cand.student_name}</p>
                        <p className="text-[10px] text-on-surface-variant font-normal font-mono">{cand.student_roll}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-on-surface">{cand.company_name}</p>
                        <p className="text-[10px] text-on-surface-variant">{cand.drive_title} ({cand.role_position})</p>
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
                            Offer Accepted & Auto-Verified
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            Offer Declined
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2 flex-nowrap">
                          {cand.offer_letter_url && (
                            <a
                              href={cand.offer_letter_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1.5 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container-high text-[11px] font-bold inline-flex items-center gap-1 transition-colors flex-shrink-0"
                            >
                              <FileText className="w-3.5 h-3.5 text-primary" />
                              <span>View PDF</span>
                            </a>
                          )}

                          {isNotIssued ? (
                            <button
                              type="button"
                              onClick={() => handleOpenSingleModal(cand)}
                              className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all shadow-sm bg-primary hover:bg-primary/90 text-on-primary shadow-primary/20 flex-shrink-0"
                            >
                              Upload Offer Letter
                            </button>
                          ) : cand.is_tnp_issued ? (
                            <button
                              type="button"
                              onClick={() => handleOpenSingleModal(cand)}
                              className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all shadow-sm bg-surface-container-high text-on-surface hover:bg-surface-container-highest flex-shrink-0"
                            >
                              Re-upload PDF
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Bulk Upload & PDF Matcher Modal (Step 1: Tenure -> Step 2: PDFs) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-4xl rounded-3xl bg-white border border-outline-variant shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-surface-container-high px-6 py-4 border-b border-outline-variant/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  Bulk Offer Issuance Engine
                </span>
                <h3 className="font-headline font-bold text-lg text-on-surface">
                  Upload & Match Official Offer Letters
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

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* STEP 1: Mandatory Tenure & Date Selection (Must be set first) */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-200 space-y-3 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-blue-200/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white font-black text-xs flex items-center justify-center">1</span>
                    <h4 className="font-headline font-bold text-sm text-primary">
                      Step 1: Set Mandatory Internship Tenure (Start & End Date)
                    </h4>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-primary text-white font-black text-xs shadow-sm flex items-center gap-1">
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
                        setFilesPreview(null);
                      }}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 bg-white text-xs font-semibold text-on-surface focus:ring-2 focus:ring-primary outline-none shadow-sm"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 bg-white text-xs font-semibold text-on-surface focus:ring-2 focus:ring-primary outline-none shadow-sm"
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
                    isTenureValid(startDate, endDate) ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'
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
                      onChange={(e) => processUploadedFiles(e.target.files)}
                      className="hidden"
                    />

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-primary/50 hover:border-primary rounded-3xl p-8 text-center bg-primary/5 cursor-pointer transition-colors space-y-3 group animate-in fade-in"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white text-primary flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-headline font-bold text-sm text-on-surface">
                          Drop candidate offer letter PDFs here or <span className="text-primary underline">browse</span>
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          Upload multiple PDF files. Candidates will be auto-matched by name or Student PRN.
                        </p>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLoadSampleDemoFiles();
                          }}
                          className="px-3.5 py-2 rounded-xl bg-white border border-primary/40 text-primary font-bold text-xs hover:bg-primary/10 shadow-sm"
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
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
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

                  {/* Unmatched Files Section */}
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
                                  <option key={c.id} value={c.student_id || c.id}>
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
                className="px-6 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-on-primary text-xs font-bold shadow-md shadow-primary/20 flex items-center gap-2 transition-all"
              >
                {sendingOffers ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Issuing via T&P Cell...</span>
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

      {/* MODAL 2: Single Student Offer Upload Modal (Step 1: Tenure -> Step 2: Select PDF) */}
      {showSingleModal && singleStudentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-outline-variant shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-surface-container-high px-6 py-4 border-b border-outline-variant/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  T&P Offer Letter Dispatch
                </span>
                <h3 className="font-headline font-bold text-base text-on-surface">
                  Issue Offer Letter to {singleStudentTarget.student_name}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowSingleModal(false);
                  setSingleStudentTarget(null);
                  setSingleFile(null);
                }}
                className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-highest"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSingleOffer} className="p-6 space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200">
                <p className="font-bold text-on-surface">{singleStudentTarget.student_name} ({singleStudentTarget.student_roll})</p>
                <p className="text-[11px] text-on-surface-variant">{singleStudentTarget.branch} | Drive: {singleStudentTarget.drive_title} ({singleStudentTarget.company_name})</p>
              </div>

              {/* STEP 1: Mandatory Tenure Dates */}
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-primary" />
                    Step 1: Set Internship Tenure
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary text-on-primary font-bold text-[10px]">
                    {calculateFridayCount(singleStartDate, singleEndDate)} Friday Reports
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface uppercase mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={singleStartDate}
                      onChange={(e) => setSingleStartDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-primary outline-none"
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
                      className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface uppercase mb-1">
                  Role Position Title
                </label>
                <input
                  type="text"
                  value={singleRole}
                  onChange={(e) => setSingleRole(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-semibold focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface uppercase mb-1">
                  Monthly Stipend (INR)
                </label>
                <input
                  type="number"
                  value={singleStipend}
                  onChange={(e) => setSingleStipend(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-semibold focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              {/* STEP 2: Select Offer Letter PDF */}
              <div className="space-y-2">
                <label className="block font-bold text-on-surface uppercase text-[11px]">
                  Step 2: Select Candidate Offer Letter PDF *
                </label>

                <input
                  type="file"
                  accept=".pdf"
                  ref={singleFileInputRef}
                  onChange={handleSingleFileSelect}
                  className="hidden"
                />

                {singleFile ? (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                      <span className="font-mono font-bold text-emerald-900 truncate">{singleFile.filename}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSingleFile(null)}
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
                      className="flex-1 py-2.5 px-3 rounded-xl border border-dashed border-primary/60 bg-primary/5 text-primary font-bold hover:bg-primary/10 flex items-center justify-center gap-1.5"
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

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/40">
                <button
                  type="button"
                  onClick={() => {
                    setShowSingleModal(false);
                    setSingleStudentTarget(null);
                    setSingleFile(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-outline-variant text-on-surface font-bold hover:bg-surface-container-low"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={singleUploading || !singleFile || !isTenureValid(singleStartDate, singleEndDate)}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-on-primary font-bold shadow-sm flex items-center gap-1.5"
                >
                  {singleUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Issuing...</span>
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

export default TnpSelectedStudentsPage;
