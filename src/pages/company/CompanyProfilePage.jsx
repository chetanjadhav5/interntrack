import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import GoogleMapPicker from '../../components/common/GoogleMapPicker';
import {
  Building2,
  Globe,
  FileText,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2
} from 'lucide-react';

const CompanyProfilePage = () => {
  const { user } = useAuth();

  const [companyName, setCompanyName] = useState('Google India Private Limited');
  const [gstin, setGstin] = useState('27AAACG0535P1Z8');
  const [industry, setIndustry] = useState('Information Technology & Cloud');
  const [website, setWebsite] = useState('https://careers.google.com');
  const [description, setDescription] = useState('Global technology leader in search, cloud systems, and machine intelligence.');

  // Google Maps Coordinates
  const [officeAddress, setOfficeAddress] = useState('EON Free Zone, Kharadi, Pune, Maharashtra 411014');
  const [latitude, setLatitude] = useState(18.5529);
  const [longitude, setLongitude] = useState(73.9497);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (user?.profile) {
      setCompanyName(user.profile.company_name || 'Google India Private Limited');
      setGstin(user.profile.gstin || '27AAACG0535P1Z8');
      setIndustry(user.profile.industry || 'Information Technology & Cloud');
      setWebsite(user.profile.website || 'https://careers.google.com');
      setDescription(user.profile.description || '');
      if (user.profile.office_address) setOfficeAddress(user.profile.office_address);
      if (user.profile.latitude) setLatitude(user.profile.latitude);
      if (user.profile.longitude) setLongitude(user.profile.longitude);
    }
  }, [user]);

  const handleLocationSelect = (loc) => {
    setOfficeAddress(loc.address);
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    setErr('');

    try {
      const token = localStorage.getItem('ghr_token');
      const res = await fetch('/api/company/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          company_name: companyName,
          gstin,
          industry,
          website,
          description,
          office_address: officeAddress,
          latitude,
          longitude
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMsg('Company profile and geofenced office location updated successfully!');
      } else {
        setErr(data.error || 'Failed to update company profile');
      }
    } catch {
      setErr('Network error updating company profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/60 shadow-sm space-y-2">
        <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Organization Settings</span>
        <h1 className="font-headline font-black text-2xl sm:text-3xl text-on-surface tracking-tight">
          Recruiter & Company Profile
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl">
          Manage corporate credentials, GSTIN registration, and headquarters GPS coordinates for student geofenced attendance.
        </p>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {err && (
        <div className="p-4 rounded-2xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{err}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Legal Credentials */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-outline-variant/40 pb-3">
            <Building2 className="w-5 h-5 text-amber-600" />
            <h2 className="font-headline font-bold text-base text-on-surface">Legal Entity & Industry</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                Company Legal Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-amber-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                Company GSTIN
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-amber-600 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                Industry Sector
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-amber-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                Careers Website
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-amber-600 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5">
                Corporate Overview
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-outline-variant bg-white text-xs font-medium focus:ring-2 focus:ring-amber-600 outline-none"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Section 2: Google Maps Location */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/60 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-outline-variant/40 pb-3">
            <MapPin className="w-5 h-5 text-secondary" />
            <h2 className="font-headline font-bold text-base text-on-surface">Registered Work Location & Geofence</h2>
          </div>

          <GoogleMapPicker
            initialAddress={officeAddress}
            initialLat={latitude}
            initialLng={longitude}
            onLocationSelect={handleLocationSelect}
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 rounded-2xl bg-amber-700 text-white font-bold text-xs hover:bg-amber-800 shadow-md flex items-center gap-2 transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Profile & Location</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyProfilePage;
