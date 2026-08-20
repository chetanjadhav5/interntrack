import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  GraduationCap,
  Award,
  FileText,
  MapPin,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Upload,
  Loader2,
  ShieldCheck,
  Globe,
  Eye,
  ExternalLink,
  FileCheck,
  ScanFace,
  Camera
} from 'lucide-react';
import FaceRegistrationModal from '../../components/common/FaceRegistrationModal';

const COMMON_SKILLS = [
  'React', 'Node.js', 'Python', 'Java', 'Spring Boot', 'SQL', 'PostgreSQL',
  'Docker', 'Kubernetes', 'AWS', 'Machine Learning', 'Tailwind CSS', 'TypeScript', 'Git'
];

const POPULAR_LOCATIONS = [
  'Pune', 'Bengaluru', 'Mumbai', 'Hyderabad', 'Delhi NCR', 'Noida', 'Gurugram', 'Chennai', 'Jalgaon'
];

const StudentProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locationSaving, setLocationSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Editable Form State
  const [gender, setGender] = useState('Male');
  const [cgpa, setCgpa] = useState('');
  const [backlogs, setBacklogs] = useState('0');
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [hasCertifications, setHasCertifications] = useState(true);
  const [certifications, setCertifications] = useState([]);
  const [newCertName, setNewCertName] = useState('');
  const [newCertUrl, setNewCertUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [resumeFileSize, setResumeFileSize] = useState('');
  const [resumeUploadError, setResumeUploadError] = useState('');

  // Preferred Locations State
  const [isPanIndia, setIsPanIndia] = useState(true);
  const [preferredLocations, setPreferredLocations] = useState(['Pune']);

  // Face ID Biometrics State
  const [faceBiometrics, setFaceBiometrics] = useState(null);
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/student/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setGender(data.gender || 'Male');
        setCgpa(data.current_cgpa ? data.current_cgpa.toString() : '8.85');
        setBacklogs(data.current_backlogs ? data.current_backlogs.toString() : '0');
        setSkills(data.skills || ['React', 'Node.js', 'Python', 'Docker']);
        setCertifications(data.certifications || []);
        setHasCertifications(data.certifications && data.certifications.length > 0);
        setResumeUrl(data.resume_url || 'https://example.com/resumes/alex_patil_resume.pdf');
        setIsPanIndia(data.is_pan_india !== undefined ? data.is_pan_india : true);
        setPreferredLocations(data.preferred_locations || ['Pune', 'Bengaluru']);
        setFaceBiometrics(data.face_biometrics || null);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = (skillToAdd) => {
    const s = skillToAdd.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleAddCertification = (e) => {
    e.preventDefault();
    if (!newCertName.trim()) return;
    const cert = {
      name: newCertName.trim(),
      url: newCertUrl.trim() || 'https://example.com/cert-proof.pdf',
      is_verified: false
    };
    setCertifications([...certifications, cert]);
    setNewCertName('');
    setNewCertUrl('');
  };

  const handleRemoveCertification = (index) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const handleResumeFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setResumeUploadError('Please select a valid PDF document (.pdf).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setResumeUploadError('PDF file size must be less than 10MB.');
      return;
    }

    setResumeUploadError('');
    setResumeFileName(file.name);
    setResumeFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setResumeUrl(loadEvt.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleToggleLocation = (loc) => {
    if (preferredLocations.includes(loc)) {
      setPreferredLocations(preferredLocations.filter((l) => l !== loc));
    } else {
      setPreferredLocations([...preferredLocations, loc]);
    }
  };

  // Instant Save for Preferred Locations (no re-verification reset)
  const handleSavePreferredLocation = async () => {
    setLocationSaving(true);
    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/student/preferred-location', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          preferred_locations: preferredLocations,
          is_pan_india: isPanIndia
        })
      });
      if (res.ok) {
        setMessage('Preferred location preferences saved instantly!');
        setTimeout(() => setMessage(''), 4000);
      }
    } catch {
      setError('Failed to update preferred location');
    } finally {
      setLocationSaving(false);
    }
  };

  // Update Profile Details (Triggers re-verification)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          gender,
          current_cgpa: cgpa,
          current_backlogs: backlogs,
          skills,
          certifications: hasCertifications ? certifications : [],
          resume_url: resumeUrl
        })
      });

      const data = await res.json();
      if (res.ok) {
        setProfile(data.profile);
        setMessage('Profile details updated! Re-sent to Class Teacher for verification.');
        setTimeout(() => setMessage(''), 5000);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch {
      setError('Network error updating profile');
    } finally {
      setSaving(false);
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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Mentor & Verification Status Banner */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-container text-on-primary flex items-center justify-center font-headline font-black text-xl shadow-md">
            {profile?.full_name?.charAt(0) || 'S'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline font-black text-xl text-on-surface">{profile?.full_name}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  profile?.verification_status === 'VERIFIED'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {profile?.verification_status === 'VERIFIED' ? 'Verified by Class Teacher' : 'Pending Verification'}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              PRN: <strong>{profile?.student_id}</strong> | {profile?.department} — {profile?.branch}
            </p>
          </div>
        </div>

        {/* Assigned Mentor Callout */}
        <div className="bg-surface-container-low rounded-2xl p-3.5 border border-outline-variant/60 text-right min-w-[200px]">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
            Assigned Faculty Mentor
          </span>
          <p className="font-headline font-bold text-sm text-primary">
            {profile?.mentor_info?.name || 'Yet to assign'}
          </p>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Profile Editor Form */}
      <form onSubmit={handleUpdateProfile} className="space-y-6">
        {/* Section 1: Read-Only System Details */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-outline-variant/40 pb-3">
            <GraduationCap className="w-5 h-5 text-primary" />
            <h2 className="font-headline font-bold text-base text-on-surface">
              System Registered Details (Read-Only)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Institutional Email
              </label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-low text-xs font-bold text-on-surface cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                disabled
                value={profile?.full_name || ''}
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-low text-xs font-bold text-on-surface cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Student ID / Roll No.
              </label>
              <input
                type="text"
                disabled
                value={profile?.student_id || ''}
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-low text-xs font-bold text-on-surface cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Department
              </label>
              <input
                type="text"
                disabled
                value={profile?.department || ''}
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-low text-xs font-bold text-on-surface cursor-not-allowed"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                Branch / Specialization
              </label>
              <input
                type="text"
                disabled
                value={profile?.branch || ''}
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-low text-xs font-bold text-on-surface cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Academic & Personal Metrics (Editable) */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-outline-variant/40 pb-3">
            <Award className="w-5 h-5 text-secondary" />
            <h2 className="font-headline font-bold text-base text-on-surface">
              Academic & Placement Qualifications
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                Current Cumulative CGPA
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={cgpa}
                onChange={(e) => setCgpa(e.target.value)}
                required
                placeholder="e.g. 8.85"
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-bold text-on-surface focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                Active / Live Backlogs
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={backlogs}
                onChange={(e) => setBacklogs(e.target.value)}
                required
                placeholder="0"
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-bold text-on-surface focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Past Internship Experience (Autofetched) */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs font-bold text-on-surface">Calculated Industrial Internship Experience</p>
                <p className="text-[11px] text-on-surface-variant">
                  Autofetched from completed verified internships on platform: <strong>{profile?.completed_internships_count || 0} completed</strong>
                </p>
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-blue-100 text-primary font-headline font-black text-sm">
              {profile?.experience_months || 0} Months Total
            </span>
          </div>
        </div>

        {/* Section 3: Technical Skills */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-4">
          <h2 className="font-headline font-bold text-base text-on-surface">Technical Skills & Proficiencies</h2>

          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1.5 rounded-xl bg-blue-50 text-primary border border-blue-200 text-xs font-bold flex items-center gap-2"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-red-600 transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add skill (e.g. React, Docker, SQL)"
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium text-on-surface focus:ring-2 focus:ring-primary outline-none"
            />
            <button
              type="button"
              onClick={() => handleAddSkill(newSkill)}
              className="px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {/* Quick Suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-on-surface-variant font-bold">Suggested:</span>
            {COMMON_SKILLS.slice(0, 8).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleAddSkill(s)}
                className="px-2 py-0.5 rounded-md bg-surface-container-low hover:bg-blue-100 text-[10px] font-medium text-on-surface-variant"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>

        {/* Section 4: Certifications & Proofs */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
            <h2 className="font-headline font-bold text-base text-on-surface">Industry Certifications</h2>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                <input
                  type="radio"
                  name="certToggle"
                  checked={hasCertifications}
                  onChange={() => setHasCertifications(true)}
                  className="text-primary focus:ring-primary"
                />
                <span>Yes (Provide proof)</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                <input
                  type="radio"
                  name="certToggle"
                  checked={!hasCertifications}
                  onChange={() => setHasCertifications(false)}
                  className="text-primary focus:ring-primary"
                />
                <span>No (NA)</span>
              </label>
            </div>
          </div>

          {hasCertifications ? (
            <div className="space-y-3">
              {certifications.map((cert, index) => (
                <div
                  key={index}
                  className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="font-bold text-on-surface">{cert.name}</p>
                      <a
                        href={cert.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-primary hover:underline truncate max-w-xs block"
                      >
                        {cert.url}
                      </a>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCertification(index)}
                    className="p-1 text-on-surface-variant hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Add Certification Sub-form */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                <input
                  type="text"
                  value={newCertName}
                  onChange={(e) => setNewCertName(e.target.value)}
                  placeholder="Certification Name (e.g. AWS Cloud Practitioner)"
                  className="sm:col-span-2 px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium text-on-surface focus:ring-2 focus:ring-primary outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCertification}
                  className="px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add Certificate
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-on-surface-variant italic">No certifications marked (NA).</p>
          )}
        </div>

        {/* Section 5: Resume PDF Upload */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <h2 className="font-headline font-bold text-base text-on-surface">Resume Document (PDF)</h2>
                <p className="text-[11px] text-on-surface-variant">
                  Upload your latest official academic and technical resume in PDF format.
                </p>
              </div>
            </div>
            {resumeUrl && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold inline-flex items-center gap-1 border border-emerald-200">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>PDF Attached</span>
              </span>
            )}
          </div>

          {resumeUploadError && (
            <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{resumeUploadError}</span>
            </div>
          )}

          {resumeUrl ? (
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-headline font-bold text-xs text-on-surface">
                    {resumeFileName || (profile?.full_name ? `${profile?.full_name?.replace(/\s+/g, '_')}_Resume.pdf` : 'Student_Resume.pdf')}
                  </p>
                  <p className="text-[10px] text-on-surface-variant font-medium">
                    {resumeFileSize || 'PDF Document'} • Ready for T&P and Recruiter Review
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-surface-container-high text-primary border border-outline-variant text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview PDF</span>
                </a>

                <label className="px-3.5 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary/90 text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-sm">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Replace PDF</span>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleResumeFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ) : (
            <label className="border-2 border-dashed border-outline-variant hover:border-primary rounded-2xl p-6 text-center cursor-pointer transition-all block bg-surface-container-low/50 hover:bg-surface-container-low group">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-primary flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <p className="font-headline font-bold text-xs text-on-surface">
                Click to upload your Resume PDF
              </p>
              <p className="text-[10px] text-on-surface-variant mt-0.5">
                Supports PDF format up to 10MB
              </p>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleResumeFileUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Section 6: Biometric Face ID & Anti-Spoofing Registration */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-outline-variant/40 pb-3 gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <ScanFace className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-headline font-bold text-base text-on-surface">Biometric Face ID & Liveness Check</h2>
                <p className="text-[11px] text-on-surface-variant">
                  Enrolled biometric template used for facial verification and eye-blink liveness checks on daily check-in/out.
                </p>
              </div>
            </div>

            {faceBiometrics?.registered ? (
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold inline-flex items-center gap-1.5 border border-emerald-200 self-start sm:self-auto">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Face ID Active & Verified</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold inline-flex items-center gap-1.5 border border-amber-200 self-start sm:self-auto">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Face ID Not Enrolled</span>
              </span>
            )}
          </div>

          <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-primary/30 bg-slate-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                {faceBiometrics?.photo_url ? (
                  <img src={faceBiometrics.photo_url} alt="Enrolled Face" className="w-full h-full object-cover" />
                ) : (
                  <ScanFace className="w-8 h-8 text-on-surface-variant" />
                )}
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-headline font-bold text-sm text-on-surface">
                  {faceBiometrics?.registered ? '128-Dimensional Biometric Descriptor' : 'No Facial Profile Template'}
                </p>
                <p className="text-[11px] text-on-surface-variant">
                  {faceBiometrics?.registered
                    ? `Enrolled with Eye Blink Liveness on ${new Date(faceBiometrics.registered_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    : 'Enrollment is mandatory before taking attendance for active internships.'}
                </p>
                {faceBiometrics?.registered && (
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                      Anti-Spoofing: Active
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                      Method: Real-Time Blink
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsFaceModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 shadow-md shadow-primary/20 flex items-center justify-center gap-2 transition"
            >
              <Camera className="w-4 h-4" />
              <span>{faceBiometrics?.registered ? 'Update / Re-scan Face ID' : 'Enroll Face ID (Webcam)'}</span>
            </button>
          </div>
        </div>

        {/* Submit Profile Details Button */}
        <div className="flex items-center justify-between p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm">
          <p className="text-xs text-on-surface-variant max-w-md">
            Updating details re-routes your profile to <strong>Class Teacher Dr. Suresh Verma</strong> for re-verification.
          </p>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 rounded-2xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 disabled:opacity-60 shadow-md shadow-primary/30 flex items-center gap-2 transition-all"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Details...</span>
              </>
            ) : (
              <>
                <span>Update Details & Request Verification</span>
                <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Section 7: Preferred Locations (Instant Save, No Verification Reset) */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-secondary" />
            <div>
              <h2 className="font-headline font-bold text-base text-on-surface">Preferred Internship Locations</h2>
              <p className="text-[11px] text-on-surface-variant">
                Adjust job discovery preferences anytime (Instant save; does not require teacher verification).
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-primary cursor-pointer">
            <input
              type="checkbox"
              checked={isPanIndia}
              onChange={(e) => setIsPanIndia(e.target.checked)}
              className="rounded text-primary focus:ring-primary"
            />
            <Globe className="w-3.5 h-3.5" />
            <span>Available Pan India (All Openings)</span>
          </label>
        </div>

        {!isPanIndia && (
          <div className="space-y-3">
            <p className="text-xs text-on-surface-variant">Select your preferred work cities:</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_LOCATIONS.map((loc) => {
                const isSelected = preferredLocations.includes(loc);
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => handleToggleLocation(loc)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {loc}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSavePreferredLocation}
            disabled={locationSaving}
            className="px-6 py-2.5 rounded-xl bg-secondary text-white text-xs font-bold hover:bg-secondary/90 disabled:opacity-60 shadow-sm flex items-center gap-1.5 transition-all"
          >
            {locationSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Location Preferences</span>}
          </button>
        </div>
      </div>

      {/* Biometric Face ID Enrollment Modal */}
      <FaceRegistrationModal
        isOpen={isFaceModalOpen}
        onClose={() => setIsFaceModalOpen(false)}
        onRegistered={(bio) => setFaceBiometrics(bio)}
        currentBiometrics={faceBiometrics}
      />
    </div>
  );
};

export default StudentProfilePage;
