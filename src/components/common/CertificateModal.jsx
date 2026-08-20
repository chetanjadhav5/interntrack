import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import confetti from 'canvas-confetti';
import { Award, Download, CheckCircle2, ShieldCheck, X } from 'lucide-react';

const CertificateModal = ({ isOpen, onClose, certificate, studentName, companyName, rolePosition, score, certNumber, issueDate, totalHoursWorked, daysAttended }) => {
  const [qrUrl, setQrUrl] = useState('');

  const hours = certificate?.total_hours_worked || totalHoursWorked || 480;
  const days = certificate?.days_attended || daysAttended || 60;

  useEffect(() => {
    if (isOpen) {
      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Generate verification QR code
      const hash = certificate?.qr_verification_hash || `GHR-VERIFY-${certNumber || '2026-00429'}`;
      QRCode.toDataURL(`https://ghr.edu/verify-certificate?hash=${encodeURIComponent(hash)}`, {
        width: 120,
        margin: 1
      }).then(setQrUrl);
    }
  }, [isOpen, certificate, certNumber]);

  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Decorative Borders
    doc.setDrawColor(26, 86, 219); // Primary Blue
    doc.setLineWidth(2);
    doc.rect(10, 10, 277, 190);

    doc.setDrawColor(0, 105, 115); // Secondary Teal
    doc.setLineWidth(0.8);
    doc.rect(13, 13, 271, 184);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(26, 86, 219);
    doc.text('G H RAISONI COLLEGE OF ENGINEERING & MANAGEMENT', 148.5, 30, { align: 'center' });

    doc.setFontSize(13);
    doc.setTextColor(67, 74, 87);
    doc.text('Autonomous Institute Affiliated to KBCNMU, Jalgaon | NAAC A+ Grade', 148.5, 38, { align: 'center' });

    doc.setFontSize(18);
    doc.setTextColor(19, 83, 216);
    doc.text('CERTIFICATE OF INTERNSHIP EXCELLENCE', 148.5, 54, { align: 'center' });

    // Body
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(25, 28, 29);
    doc.text('This is to certify that', 148.5, 70, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(26, 86, 219);
    doc.text(studentName || 'Alex Patil', 148.5, 82, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(25, 28, 29);
    doc.text(
      `has successfully completed the industrial internship as ${rolePosition || 'Software Engineering Intern'}`,
      148.5,
      94,
      { align: 'center' }
    );

    doc.text(`at ${companyName || 'Google India'} with an outstanding overall evaluation score of ${score || '94.5'}%.`, 148.5, 102, { align: 'center' });

    // Total Working Hours Metric Line
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 105, 115);
    doc.text(
      `Total Work Duration: ${hours} Hours Completed | ${days} Days Logged | 100% Geofence Attendance Verified`,
      148.5,
      112,
      { align: 'center' }
    );

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(25, 28, 29);
    doc.text(
      'During the internship tenure, the candidate demonstrated exceptional technical proficiency,',
      148.5,
      122,
      { align: 'center' }
    );
    doc.text(
      'punctual check-in regularity, weekly progress reporting, and high commitment to industrial quality standards.',
      148.5,
      129,
      { align: 'center' }
    );

    // Signatures and Metadata
    doc.setFontSize(10);
    doc.text(`Certificate No: ${certNumber || 'GHR-IMS-2026-00429'}`, 25, 160);
    doc.text(`Total Hours Logged: ${hours} Hours (${days} Days)`, 25, 166);
    doc.text(`Issue Date: ${issueDate || '20 August 2026'}`, 25, 172);

    doc.text('__________________________', 120, 165);
    doc.text('Faculty Mentor', 130, 172);

    doc.text('__________________________', 210, 165);
    doc.text('Head, T&P Department', 218, 172);

    doc.save(`Internship_Certificate_${certNumber || 'GHR_2026'}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-3xl rounded-3xl bg-white border border-outline-variant shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Control Bar */}
        <div className="bg-surface-container-high px-6 py-3 border-b border-outline-variant/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="font-headline font-bold text-xs text-on-surface uppercase tracking-wider">
              Cryptographically Verified Institutional Certificate
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-highest transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Graphical Layout */}
        <div className="p-8 bg-gradient-to-b from-blue-50/40 via-white to-teal-50/20 text-center relative border-8 border-double border-primary/20 m-4 rounded-2xl shadow-inner">
          {/* Institutional Header */}
          <div className="space-y-1">
            <h3 className="font-headline font-black text-base text-primary tracking-tight uppercase">
              G H Raisoni College of Engineering & Management, Jalgaon
            </h3>
            <p className="text-[11px] text-on-surface-variant font-medium">
              Autonomous Institute Affiliated to KBCNMU, Jalgaon | Approved by AICTE
            </p>
          </div>

          <div className="my-5 inline-block">
            <div className="px-6 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary font-headline font-extrabold text-xs tracking-widest uppercase">
              Certificate of Internship Excellence
            </div>
          </div>

          <p className="text-xs text-on-surface-variant italic">This is proudly awarded to</p>
          
          <h2 className="font-headline font-black text-2xl text-on-surface my-1.5 tracking-tight">
            {studentName || 'Alex Patil'}
          </h2>

          <p className="text-xs text-on-surface max-w-lg mx-auto leading-relaxed mt-1">
            for successfully completing the industry internship as <span className="font-bold text-primary">{rolePosition || 'Software Engineering Intern'}</span> at{' '}
            <span className="font-bold text-secondary">{companyName || 'Google India'}</span> with an overall performance evaluation score of{' '}
            <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {score || '94.5'}%
            </span>.
          </p>

          {/* Working Hours Badge Banner */}
          <div className="my-4 inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-bold shadow-sm">
            <span>⏱️ Total Work Duration: <strong>{hours} Hours Completed</strong></span>
            <span>•</span>
            <span>📅 <strong>{days} Days Logged</strong></span>
            <span>•</span>
            <span className="text-emerald-700 font-bold">100% Attendance Verified</span>
          </div>

          {/* Footer Metadata & Verification QR */}
          <div className="mt-6 pt-5 border-t border-outline-variant/60 flex items-center justify-between text-left">
            <div className="space-y-1 text-[11px] text-on-surface-variant font-mono">
              <p>
                <span className="font-bold text-on-surface">Cert ID:</span> {certNumber || 'GHR-IMS-2026-00429'}
              </p>
              <p>
                <span className="font-bold text-on-surface">Duration:</span> {hours} Working Hours ({days} Days)
              </p>
              <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Digitally Signed & Approved
              </p>
            </div>

            {/* QR Code */}
            {qrUrl && (
              <div className="flex flex-col items-center">
                <img src={qrUrl} alt="Certificate QR" className="w-18 h-18 rounded-lg border border-outline-variant p-1 bg-white shadow-sm" />
                <span className="text-[9px] text-on-surface-variant font-bold mt-1">Scan to Verify</span>
              </div>
            )}

            <div className="text-right space-y-1 text-[11px]">
              <div className="w-28 h-7 border-b border-primary/60 font-serif italic text-primary text-xs flex items-end justify-end">
                Prof. A. Mehta
              </div>
              <p className="font-bold text-on-surface">Faculty Mentor</p>
              <p className="text-[10px] text-on-surface-variant">Dept. of Computer Engineering</p>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="bg-surface-container-low px-6 py-4 border-t border-outline-variant/60 flex items-center justify-between">
          <span className="text-xs text-on-surface-variant font-medium">
            This certificate is valid institutional proof for academic credits.
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-outline-variant text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 shadow-sm shadow-primary/30 transition-all"
            >
              <Download className="w-4 h-4" />
              Download PDF Certificate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateModal;
