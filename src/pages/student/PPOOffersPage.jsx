import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Gift,
  Building2,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Loader2
} from 'lucide-react';

const PPOOffersPage = () => {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState(null);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/student/offers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOffers(data);
      }
    } catch (err) {
      console.error('Error fetching offers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (offerId, decision) => {
    setRespondingId(offerId);
    setActionMessage('');
    setActionError('');
    setShowRejectConfirm(null);

    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch(`/api/student/offers/${offerId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ decision })
      });

      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message);
        fetchOffers();
      } else {
        setActionError(data.error || 'Failed to update offer response');
      }
    } catch {
      setActionError('Network error responding to offer');
    } finally {
      setRespondingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm space-y-2">
        <span className="text-xs font-bold text-primary uppercase tracking-wider">Placement Offers</span>
        <h1 className="font-headline font-black text-2xl sm:text-3xl text-on-surface tracking-tight">
          PPO & Official Offer Letters
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl">
          Review corporate offer letters and Pre-Placement Offers (PPOs) extended by campus and off-campus recruiters.
        </p>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-2xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Institutional Rejection Policy Alert */}
      <div className="bg-amber-50 rounded-3xl p-6 border border-amber-200 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-amber-900 font-headline font-bold text-xs uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <span>GHR Institutional Placement Policy</span>
        </div>
        <p className="text-xs text-amber-950 leading-relaxed">
          Please review offer details carefully. If you reject an official campus offer, your access to applying for new drives is automatically revoked until reviewed and reset by the T&P Department.
        </p>
      </div>

      {/* Offers List */}
      {offers.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl p-12 text-center border border-outline-variant/60 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-primary flex items-center justify-center mx-auto">
            <Gift className="w-6 h-6" />
          </div>
          <h3 className="font-headline font-bold text-base text-on-surface">No Offer Letters Yet</h3>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto">
            Offer letters issued by companies following selection will appear here for your review and acceptance.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm hover:shadow-card-hover transition-all flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                      {offer.offer_type === 'PPO' ? '★ Pre-Placement Offer (PPO)' : 'Campus Internship Offer'}
                    </span>
                    <h3 className="font-headline font-bold text-lg text-on-surface mt-0.5">
                      {offer.company_name}
                    </h3>
                    <p className="text-xs text-on-surface-variant font-medium mt-0.5">{offer.role_position}</p>
                  </div>
                  <StatusBadge status={offer.status} />
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Compensation / CTC</span>
                    <span className="font-headline font-extrabold text-sm text-on-surface">
                      ₹{offer.stipend_amount ? offer.stipend_amount.toLocaleString() : 'Negotiated'} {offer.offer_type === 'PPO' ? 'per Annum' : '/ month'}
                    </span>
                  </div>
                  <a
                    href={offer.offer_letter_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-white border border-outline-variant text-primary hover:bg-blue-50 font-bold text-xs flex items-center gap-1 shadow-sm transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View PDF Letter</span>
                  </a>
                </div>

                <p className="text-[11px] text-on-surface-variant">
                  Sent on: <strong>{new Date(offer.sent_date).toLocaleDateString()}</strong>
                  {offer.student_response_date && (
                    <span> | Responded on: <strong>{new Date(offer.student_response_date).toLocaleDateString()}</strong></span>
                  )}
                </p>
              </div>

              {/* Action Buttons */}
              {offer.status === 'PENDING' || offer.status === 'SENT' ? (
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRejectConfirm(offer.id)}
                    disabled={respondingId === offer.id}
                    className="flex-1 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors"
                  >
                    Reject Offer
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRespond(offer.id, 'ACCEPTED')}
                    disabled={respondingId === offer.id}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all"
                  >
                    {respondingId === offer.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Accept Offer</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-surface-container-high text-center text-xs font-bold text-on-surface">
                  Offer has been {offer.status.toLowerCase()} by you.
                </div>
              )}

              {/* Rejection Warning Confirmation Modal */}
              {showRejectConfirm === offer.id && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Are you sure you want to reject this offer?</span>
                  </div>
                  <p className="text-[11px] text-rose-900">
                    Rejecting this offer will revoke your ability to apply for new campus drives until granted again by T&P.
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRejectConfirm(null)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-xs font-bold text-on-surface"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRespond(offer.id, 'REJECTED')}
                      className="px-4 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PPOOffersPage;
