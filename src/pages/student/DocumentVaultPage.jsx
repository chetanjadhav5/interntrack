import React, { useState, useEffect } from 'react';
import CertificateModal from '../../components/common/CertificateModal';
import {
  FileText,
  Award,
  Download,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Plus,
  Loader2,
  Calendar,
  Sparkles,
  Building2,
  Eye
} from 'lucide-react';

const DocumentVaultPage = () => {
  const [profile, setProfile] = useState(null);
  const [offers, setOffers] = useState([]);
  const [internship, setInternship] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState(null);
  const [showCertModal, setShowCertModal] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('ghr_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [profRes, offersRes, activeRes, certRes] = await Promise.all([
        fetch('/api/student/profile', { headers }),
        fetch('/api/student/offers', { headers }),
        fetch('/api/student/internships/active', { headers }),
        fetch('/api/student/certificates', { headers })
      ]);

      if (profRes.ok) setProfile(await profRes.json());
      if (offersRes.ok) setOffers(await offersRes.json());
      if (activeRes.ok) {
        const activeData = await activeRes.json();
        setInternship(activeData.internship);
      }
      if (certRes.ok) {
        const certData = await certRes.json();
        setCertificates(Array.isArray(certData) ? certData : []);
      }
    } catch (err) {
      console.error('Error fetching vault documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCertificate = (cert) => {
    setSelectedCert(cert);
    setShowCertModal(true);
  };

  const primaryCert = certificates.length > 0 ? certificates[0] : null;
  const isCertAvailable = Boolean(primaryCert || internship?.final_internship_score);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const activeCertForModal = selectedCert || primaryCert;

  return (
    <div className="space-y-6">
      {/* Certificate Viewer Modal */}
      {showCertModal && (
        <CertificateModal
          isOpen={showCertModal}
          onClose={() => {
            setShowCertModal(false);
            setSelectedCert(null);
          }}
          certificate={activeCertForModal}
          studentName={profile?.full_name || 'Alex Patil'}
          companyName={activeCertForModal?.company_name || internship?.company_name || 'Corporate Partner'}
          rolePosition={activeCertForModal?.role_position || internship?.role_position || 'Software Engineering Intern'}
          score={activeCertForModal?.final_score || internship?.final_internship_score || '94.5'}
          certNumber={activeCertForModal?.certificate_number || 'GHR-IMS-2026-00429'}
          issueDate={activeCertForModal?.issue_date ? new Date(activeCertForModal.issue_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : '20 August 2026'}
        />
      )}

      {/* Header */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm space-y-2">
        <span className="text-xs font-bold text-primary uppercase tracking-wider">Document Repository</span>
        <h1 className="font-headline font-black text-2xl sm:text-3xl text-on-surface tracking-tight">
          Document Vault
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl">
          Centralized repository of verified academic resumes, corporate offer letters, institutional permissions, and official digital internship completion certificates.
        </p>
      </div>

      {/* Completion Certificates Section */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-sm">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-headline font-bold text-base text-on-surface flex items-center gap-2">
                <span>Institutional Internship Completion Certificates</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 text-[10px] font-black border border-purple-200">
                  {certificates.length} Issued
                </span>
              </h2>
              <p className="text-xs text-on-surface-variant">
                Official certificates generated upon completion of faculty mentor evaluation with QR verification.
              </p>
            </div>
          </div>

          {isCertAvailable && (
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>QR Authenticated by GHR Institutional Authority</span>
            </span>
          )}
        </div>

        {certificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {certificates.map((cert, index) => (
              <div
                key={cert.id || cert.certificate_number || index}
                className="p-5 rounded-3xl bg-gradient-to-br from-purple-50/50 via-white to-blue-50/30 border border-purple-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 font-mono font-bold text-[11px] shadow-sm">
                      #{cert.certificate_number}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Score: {cert.final_score}% ({cert.grade ? `Grade ${cert.grade}` : 'Passed'})
                    </span>
                  </div>

                  <div>
                    <h3 className="font-headline font-bold text-base text-on-surface">
                      {cert.company_name}
                    </h3>
                    <p className="text-xs text-primary font-semibold mt-0.5">{cert.role_position}</p>
                    <p className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-2">
                      <Calendar className="w-3.5 h-3.5 text-on-surface-variant" />
                      <span>Issue Date: {cert.issue_date ? new Date(cert.issue_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : '20 August 2026'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-purple-100">
                  <button
                    type="button"
                    onClick={() => openCertificate(cert)}
                    className="flex-1 py-2.5 px-3 rounded-2xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 shadow-sm flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Certificate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openCertificate(cert)}
                    className="py-2.5 px-3.5 rounded-2xl bg-white border border-outline-variant text-on-surface text-xs font-bold hover:bg-surface-container-low shadow-sm flex items-center justify-center gap-1 transition-all"
                    title="Download Official PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-primary" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : isCertAvailable ? (
          <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-50/50 via-white to-blue-50/30 border border-purple-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                Score: {internship?.final_internship_score || '94.5'}%
              </span>
              <h3 className="font-headline font-bold text-base text-on-surface mt-1">
                {internship?.company_name || 'Google India'} — {internship?.role_position || 'Software Engineering Intern'}
              </h3>
              <p className="text-xs text-on-surface-variant">
                Certificate issued and stored with institutional QR authentication hash.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCertModal(true)}
              className="px-5 py-2.5 rounded-2xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 shadow-sm flex items-center justify-center gap-1.5"
            >
              <Award className="w-4 h-4" />
              <span>View & Download Certificate</span>
            </button>
          </div>
        ) : (
          <div className="p-6 rounded-3xl bg-surface-container-low border border-outline-variant/40 text-center space-y-2">
            <Lock className="w-8 h-8 text-on-surface-variant/60 mx-auto" />
            <p className="font-headline font-bold text-xs text-on-surface">
              Completion Certificate Pending Faculty Mentor Evaluation
            </p>
            <p className="text-[11px] text-on-surface-variant max-w-md mx-auto">
              Your official institutional digital certificate will automatically appear here once your faculty mentor completes your final internship evaluation.
            </p>
          </div>
        )}
      </div>

      {/* Other Vault Document Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Document 2: Current Verified Resume */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm hover:shadow-card-hover transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Verified
              </span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-on-surface">Academic Resume (PDF)</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Active resume snapshot attached to placement applications.
              </p>
            </div>
          </div>

          <a
            href={profile?.resume_url || 'https://example.com/resume.pdf'}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-primary" />
            <span>Download Resume PDF</span>
          </a>
        </div>

        {/* Document 3: Campus Offer Letters */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm hover:shadow-card-hover transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-100 text-primary text-xs font-bold">
                {offers.length} Offer(s)
              </span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-on-surface">Corporate Offer Letters</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Official signed letters from hiring companies.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {offers.map((o) => (
              <a
                key={o.id}
                href={o.offer_letter_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-xs font-bold text-on-surface border border-outline-variant/40"
              >
                <span className="truncate max-w-[170px]">{o.company_name} — {o.role_position}</span>
                <Download className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              </a>
            ))}
          </div>
        </div>

        {/* Document 4: Institutional No Objection Certificate (NOC) */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm hover:shadow-card-hover transition-all flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-secondary flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                Approved
              </span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-on-surface">Institutional NOC Document</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Official permission letter from HOD for semester 6/8 industrial training.
              </p>
            </div>
          </div>

          <a
            href="https://example.com/noc.pdf"
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-secondary" />
            <span>Download Approved NOC</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default DocumentVaultPage;
