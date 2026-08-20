import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  FileCheck,
  Award,
  AlertCircle,
  Loader2,
  Navigation,
  Lock,
  Calendar,
  Check,
  MapPin,
  FileText
} from 'lucide-react';

const WorkflowTrackerPage = () => {
  const [trackerData, setTrackerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrackerData();
  }, []);

  const fetchTrackerData = async () => {
    try {
      const token = localStorage.getItem('ghr_token');
      const headers = { Authorization: `Bearer ${token}` };

      const res = await fetch('/api/student/workflow/status', { headers });
      if (res.ok) {
        const data = await res.json();
        setTrackerData(data);
      }
    } catch (err) {
      console.error('Error fetching tracker:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const steps = trackerData?.steps || [];
  const completedCount = trackerData?.completed_steps_count || 0;
  const progressPercent = trackerData?.overall_progress_percent || 0;
  const currentStepObj = steps.find((s) => s.is_current) || steps[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm space-y-2">
        <span className="text-xs font-bold text-primary uppercase tracking-wider">End-to-End Journey</span>
        <h1 className="font-headline font-black text-2xl sm:text-3xl text-on-surface tracking-tight">
          Internship Workflow Tracker
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl">
          Visual interactive lifecycle tracking with real-time institutional verification guards and milestone validation.
        </p>
      </div>

      {/* Horizontal Stepper */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4">
          <div>
            <h3 className="font-headline font-bold text-base text-on-surface">
              Lifecycle Progress ({completedCount} of 8 Milestones Completed)
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Each milestone activates strictly based on real institutional verifications and student activity logs.
            </p>
          </div>
          <span className="px-3.5 py-1 rounded-full bg-blue-100 text-primary text-xs font-black">
            {progressPercent}% Completed
          </span>
        </div>

        {/* 8-Step Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s) => {
            const isDone = s.is_completed;
            const isCurrent = s.is_current && !isDone;

            return (
              <div
                key={s.step}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  isDone
                    ? 'bg-emerald-50/60 border-emerald-200 shadow-sm'
                    : isCurrent
                    ? 'bg-purple-50/80 border-primary ring-2 ring-primary/20 shadow-md'
                    : 'bg-surface-container-low border-outline-variant/60 opacity-60'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {isDone ? <Check className="w-4 h-4" /> : isCurrent ? s.step : <Lock className="w-3.5 h-3.5" />}
                    </span>
                    {isDone && <span className="text-[10px] font-bold text-emerald-700">COMPLETED</span>}
                    {isCurrent && <span className="text-[10px] font-black text-primary animate-pulse">IN PROGRESS</span>}
                    {!isDone && !isCurrent && <span className="text-[10px] font-bold text-on-surface-variant/70">LOCKED</span>}
                  </div>

                  <h4 className="font-headline font-bold text-xs text-on-surface leading-snug">
                    {s.title}
                  </h4>
                  <p className="text-[11px] text-on-surface-variant leading-normal">
                    {s.desc}
                  </p>
                </div>

                {/* Status Footnote */}
                <div className="pt-2 border-t border-outline-variant/30 text-[10px] font-semibold">
                  <span className={isDone ? 'text-emerald-800' : isCurrent ? 'text-purple-900 font-bold' : 'text-on-surface-variant'}>
                    {s.status_label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Next Step Card */}
      <div className="bg-gradient-to-r from-primary via-purple-700 to-primary-container rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-bold text-purple-200 uppercase tracking-widest">Recommended Next Action</span>
          <h3 className="font-headline font-bold text-xl">
            {currentStepObj?.step === 1 && 'Complete your academic profile details'}
            {currentStepObj?.step === 2 && 'Awaiting Class Teacher verification of your profile'}
            {currentStepObj?.step === 3 && 'Browse and apply for eligible placement drives'}
            {currentStepObj?.step === 4 && 'Review selection and accept your official offer letter'}
            {currentStepObj?.step === 5 && 'Awaiting T&P Department verification of offer & mentor assignment'}
            {currentStepObj?.step === 6 && 'Perform your first daily geofenced check-in at office location'}
            {currentStepObj?.step === 7 && 'Submit upcoming Friday weekly reports and sync GitHub'}
            {currentStepObj?.step === 8 && 'View and download your official institutional digital certificate'}
          </h3>
          <p className="text-xs text-purple-100/90">
            {currentStepObj?.details || 'Track your journey stage'}
          </p>
        </div>

        <Link
          to={
            currentStepObj?.step <= 2
              ? '/student/profile'
              : currentStepObj?.step === 3
              ? '/student/directory'
              : currentStepObj?.step === 4
              ? '/student/offers-ppo'
              : currentStepObj?.step === 5
              ? '/student/dashboard'
              : currentStepObj?.step === 6
              ? '/student/dashboard'
              : currentStepObj?.step === 7
              ? '/student/tasks-reports'
              : '/student/vault'
          }
          className="px-6 py-3 rounded-2xl bg-white text-primary font-bold text-xs hover:bg-purple-50 shadow-md flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <span>Proceed with Next Step</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default WorkflowTrackerPage;
