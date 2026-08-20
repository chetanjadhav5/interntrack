import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import OpenStreetMapPicker from '../../components/common/OpenStreetMapPicker';
import StatusBadge from '../../components/common/StatusBadge';
import {
  Briefcase,
  Plus,
  Search,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Loader2
} from 'lucide-react';

const ManageDrivesPage = () => {
  const [drives, setDrives] = useState([]);
  const [activeTab, setActiveTab] = useState('ACTIVE');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [rolePosition, setRolePosition] = useState('');
  const [stipend, setStipend] = useState('50000');
  const [duration, setDuration] = useState('6');
  const [openings, setOpenings] = useState('5');
  const [minCgpa, setMinCgpa] = useState('7.0');
  const [maxBacklogs, setMaxBacklogs] = useState('0');
  const [allowedBranches, setAllowedBranches] = useState(['Computer Science and Engineering', 'Information Technology']);
  const [deadline, setDeadline] = useState('2026-09-30T23:59');
  
  // Optional section: Required skills
  const [skillsInput, setSkillsInput] = useState('React, Node.js, SQL');

  // Google Maps Coordinates
  const [officeAddress, setOfficeAddress] = useState('EON Free Zone, Kharadi, Pune, Maharashtra 411014');
  const [latitude, setLatitude] = useState(18.5529);
  const [longitude, setLongitude] = useState(73.9497);

  const [creating, setCreating] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');

  useEffect(() => {
    fetchDrives();
  }, [activeTab]);

  const fetchDrives = async () => {
    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch(`/api/tnp/drives?status=${activeTab}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDrives(data);
      }
    } catch (err) {
      console.error('Error loading drives:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (loc) => {
    setOfficeAddress(loc.address);
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
  };

  const handleCreateDrive = async (e) => {
    e.preventDefault();
    if (!title || !companyName || !rolePosition || !deadline) {
      setActionErr('Please fill in mandatory drive details.');
      return;
    }

    setCreating(true);
    setActionMsg('');
    setActionErr('');

    const parsedSkills = skillsInput.split(',').map((s) => s.trim()).filter(Boolean);

    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/tnp/drives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          company_name: companyName,
          role_position: rolePosition,
          stipend_amount: stipend,
          duration_months: duration,
          openings_count: openings,
          min_cgpa: minCgpa,
          max_backlogs: maxBacklogs,
          allowed_branches: allowedBranches,
          required_skills: parsedSkills,
          work_location_address: officeAddress,
          latitude,
          longitude,
          deadline,
          status: 'ACTIVE'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setActionMsg('New campus placement drive posted successfully!');
        setShowCreateModal(false);
        fetchDrives();
      } else {
        setActionErr(data.error || 'Failed to create drive');
      }
    } catch {
      setActionErr('Network error posting drive');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Placement Operations</span>
            <h1 className="font-headline font-black text-2xl sm:text-3xl text-on-surface tracking-tight mt-0.5">
              Manage Placement Drives
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Create campus placement opportunities with Google Maps office pins and candidate selection pipelines.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-2xl bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 shadow-md flex items-center gap-1.5 self-start sm:self-auto transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Placement Drive</span>
          </button>
        </div>

        {/* 3 Status Tabs: Active Drives, Closed Drives, Drafts */}
        <div className="flex gap-2 pt-2 border-t border-outline-variant/40">
          {['ACTIVE', 'CLOSED', 'DRAFT'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {tab === 'ACTIVE' && 'Active Drives'}
              {tab === 'CLOSED' && 'Closed Drives'}
              {tab === 'DRAFT' && 'Drafts'}
            </button>
          ))}
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Drives Grid */}
      {drives.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl p-12 text-center border border-outline-variant/60 space-y-3">
          <p className="text-xs text-on-surface-variant">No drives in {activeTab.toLowerCase()} status.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {drives.map((drive) => (
            <div
              key={drive.id}
              className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm hover:shadow-card-hover transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                      {drive.company_name}
                    </span>
                    <h3 className="font-headline font-bold text-lg text-on-surface mt-0.5">{drive.title}</h3>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-secondary" />
                      {drive.work_location_address.split(',')[0]}
                    </p>
                  </div>
                  <StatusBadge status={drive.status} />
                </div>

                {/* Counters Strip: Openings & Selected Candidates */}
                <div className="grid grid-cols-3 gap-2 p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/60 text-center text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Total Applicants</span>
                    <span className="font-headline font-extrabold text-sm text-primary">{drive.applicants_count || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Openings</span>
                    <span className="font-headline font-extrabold text-sm text-on-surface">{drive.openings_count}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">Selected Candidates</span>
                    <span className="font-headline font-extrabold text-sm text-emerald-700">
                      {drive.selected_count || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <Link
                to={`/tnp/drives/${drive.id}/applicants`}
                className="w-full py-2.5 rounded-xl bg-purple-50 text-purple-800 hover:bg-purple-700 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Review Candidate Pipeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Create Drive Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-3xl rounded-3xl bg-white border border-outline-variant shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95">
            <div className="bg-surface-container-high px-6 py-4 border-b border-outline-variant/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Placement Drive Setup</span>
                <h3 className="font-headline font-bold text-lg text-on-surface">Post Campus Placement Opportunity</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-highest"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDrive} className="flex-1 overflow-y-auto p-6 space-y-5">
              {actionErr && (
                <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{actionErr}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Drive Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g. SDE Intern 2026"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Hiring Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    placeholder="e.g. Amazon / Microsoft"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Role Position Title
                  </label>
                  <input
                    type="text"
                    value={rolePosition}
                    onChange={(e) => setRolePosition(e.target.value)}
                    required
                    placeholder="e.g. Cloud Developer Intern"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Monthly Stipend (INR)
                  </label>
                  <input
                    type="number"
                    value={stipend}
                    onChange={(e) => setStipend(e.target.value)}
                    placeholder="50000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Duration (Months)
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Total Openings Count
                  </label>
                  <input
                    type="number"
                    value={openings}
                    onChange={(e) => setOpenings(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Minimum CGPA Threshold
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={minCgpa}
                    onChange={(e) => setMinCgpa(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Application Deadline
                  </label>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-purple-600 outline-none"
                  />
                </div>
              </div>

              {/* Optional Section: Required Skills */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/60 space-y-2">
                <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                  Optional / Supplementary Criteria
                </span>
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                    Required Skills (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    placeholder="e.g. React, Node.js, Python, SQL"
                    className="w-full px-3.5 py-2 rounded-xl border border-outline-variant bg-white text-xs font-medium outline-none"
                  />
                </div>
              </div>

              {/* Google Maps Location Setup */}
              <OpenStreetMapPicker
                initialAddress={createForm.office_address}
                initialLat={createForm.work_location_lat}
                initialLng={createForm.work_location_lng}
                onLocationSelect={(loc) => {
                  setCreateForm({
                    ...createForm,
                    office_address: loc.address,
                    work_location_lat: loc.latitude,
                    work_location_lng: loc.longitude
                  });
                }}
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/40">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-outline-variant text-xs font-bold text-on-surface-variant hover:bg-surface-container-high"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Publish Drive</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageDrivesPage;
