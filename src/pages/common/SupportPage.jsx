import React, { useState } from 'react';
import {
  HelpCircle,
  Mail,
  Phone,
  MessageSquare,
  FileText,
  CheckCircle2,
  Send,
  Loader2
} from 'lucide-react';

const SupportPage = () => {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('VERIFICATION');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject || !message) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setSubject('');
      setMessage('');
      setTimeout(() => setSubmitted(false), 5000);
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm space-y-2">
        <span className="text-xs font-bold text-primary uppercase tracking-wider">Help & Grievance</span>
        <h1 className="font-headline font-black text-2xl sm:text-3xl text-on-surface tracking-tight">
          Institutional Support & Helpdesk
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl">
          Get assistance regarding profile verifications, geofence check-in troubleshooting, offer letters, or mentor allocations.
        </p>
      </div>

      {submitted && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Support ticket submitted! The T&P Helpdesk will respond within 24 hours.</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Support Channels */}
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm space-y-3">
            <h3 className="font-headline font-bold text-sm text-on-surface">T&P Cell Contacts</h3>
            <div className="space-y-2 text-xs text-on-surface-variant">
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <span>tnp.helpdesk@ghr.edu</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-secondary" />
                <span>+91 20 6634 5000</span>
              </p>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-50 to-teal-50 border border-blue-100 shadow-sm space-y-2 text-xs">
            <h4 className="font-headline font-bold text-primary">Frequently Asked Questions</h4>
            <p className="text-on-surface leading-relaxed">
              <strong>Q: Why is my profile incomplete?</strong><br />
              Ensure all academic fields, resume link, and certification answers are provided, and verified by your Class Teacher.
            </p>
          </div>
        </div>

        {/* Ticket Form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-4">
            <h3 className="font-headline font-bold text-base text-on-surface border-b border-outline-variant/40 pb-3">
              Raise a Support Query
            </h3>

            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                Issue Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="VERIFICATION">Profile or Document Verification</option>
                <option value="GEOFENCE">Geofenced Attendance / Location</option>
                <option value="OFFERS">Offer Letters & PPO Lock</option>
                <option value="GITHUB">GitHub OAuth & Scoring Sync</option>
                <option value="OTHER">Other Query</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="e.g. Need assistance with offer rejection unlock"
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                Detailed Description
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                placeholder="Explain the problem and include relevant error details or Student ID..."
                className="w-full p-3.5 rounded-2xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
              ></textarea>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Submit Ticket</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
