import express from 'express';
import { findOne, find, findById, insert, update, getDB } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { calculateFridayDates } from '../services/reportScheduler.js';

const router = express.Router();

// 0. Company Recruiter Analytics Dashboard
router.get('/dashboard', authenticate, requireRole('COMPANY'), (req, res) => {
  const companyProfile = findOne('company_profiles', { user_id: req.user.id });
  const allDrives = find('placement_drives') || [];
  
  // Match drives created by this user, associated with profile, or matching company name
  let myDrives = allDrives.filter(d => 
    d.created_by_user_id === req.user.id ||
    (companyProfile && d.company_profile_id === companyProfile.id) ||
    (companyProfile && d.company_name && d.company_name.toLowerCase() === companyProfile.company_name.toLowerCase())
  );

  // Fallback for default demo Google recruiter
  if (myDrives.length === 0 && (req.user.email?.includes('google') || companyProfile?.company_name?.includes('Google'))) {
    myDrives = allDrives.filter(d => d.company_name?.includes('Google') || d.id === 'drive_google_sde');
  }

  const allApps = find('applications') || [];
  const driveIds = new Set(myDrives.map(d => d.id));
  const myApps = allApps.filter(a => driveIds.has(a.drive_id));

  const drivesWithMetrics = myDrives.map(drive => {
    const apps = allApps.filter(a => a.drive_id === drive.id);
    const appliedCount = apps.length;
    const selectedCount = apps.filter(a => a.current_stage === 'SELECTED').length;
    const interviewCount = apps.filter(a => a.current_stage === 'Interview' || a.current_stage === 'Technical Interview').length;
    const gdCount = apps.filter(a => a.current_stage === 'GD' || a.current_stage === 'Aptitude Test').length;
    const rejectedCount = apps.filter(a => a.current_stage === 'Rejected' || a.current_stage === 'REJECTED').length;

    return {
      ...drive,
      applicants_count: appliedCount,
      selected_count: selectedCount,
      stats: {
        applied: appliedCount,
        gd: gdCount,
        interview: interviewCount,
        selected: selectedCount,
        rejected: rejectedCount
      }
    };
  });

  const activeDrives = drivesWithMetrics.filter(d => d.status === 'ACTIVE');
  const totalApplicants = myApps.length;
  const selectedStudents = myApps.filter(a => a.current_stage === 'SELECTED').length;

  // Active Interns (Internships associated with this company)
  const allInternships = find('internships') || [];
  const activeInterns = allInternships.filter(i => 
    (companyProfile && (i.company_name?.toLowerCase() === companyProfile.company_name?.toLowerCase() || i.company_id === companyProfile.id)) ||
    (req.user.email?.includes('google') && i.company_name?.includes('Google'))
  );

  const recentApplicants = myApps.slice(0, 6).map(app => {
    const student = findById('student_profiles', app.student_id);
    const drive = findById('placement_drives', app.drive_id);
    return {
      id: app.id,
      student_id: student?.id,
      student_roll: student?.student_id || 'N/A',
      student_name: student?.full_name || 'Candidate',
      branch: student?.branch || 'Engineering',
      cgpa: student?.current_cgpa || 8.0,
      drive_id: app.drive_id,
      drive_title: drive?.title || drive?.role_position || 'Campus Drive',
      current_stage: app.current_stage,
      applied_at: app.applied_at
    };
  });

  res.json({
    stats: {
      active_drives: activeDrives.length,
      total_drives: myDrives.length,
      total_applicants: totalApplicants,
      selected_students: selectedStudents,
      active_interns: activeInterns.length
    },
    drives: drivesWithMetrics,
    recent_applicants: recentApplicants
  });
});

// 1. Company Profile & Saved Office Location
router.get('/profile', authenticate, requireRole('COMPANY'), (req, res) => {
  const profile = findOne('company_profiles', { user_id: req.user.id });
  if (!profile) return res.status(404).json({ error: 'Company profile not found' });
  res.json(profile);
});

router.put('/profile', authenticate, requireRole('COMPANY'), (req, res) => {
  const profile = findOne('company_profiles', { user_id: req.user.id });
  if (!profile) return res.status(404).json({ error: 'Company profile not found' });

  const { company_name, gstin, website, industry, description, office_address, latitude, longitude } = req.body;

  const updated = update('company_profiles', profile.id, {
    company_name: company_name || profile.company_name,
    gstin: gstin || profile.gstin,
    website: website !== undefined ? website : profile.website,
    industry: industry || profile.industry,
    description: description !== undefined ? description : profile.description,
    office_address: office_address || profile.office_address,
    latitude: latitude ? parseFloat(latitude) : profile.latitude,
    longitude: longitude ? parseFloat(longitude) : profile.longitude
  });

  res.json({
    message: 'Company profile and office location updated successfully.',
    profile: updated
  });
});

// 2. Company Postings (Own Drives Only)
router.get('/drives', authenticate, requireRole('COMPANY'), (req, res) => {
  const companyProfile = findOne('company_profiles', { user_id: req.user.id });
  const allDrives = find('placement_drives') || [];
  
  let drives = allDrives.filter(d => 
    d.created_by_user_id === req.user.id ||
    (companyProfile && d.company_profile_id === companyProfile.id) ||
    (companyProfile && d.company_name && d.company_name.toLowerCase() === companyProfile.company_name.toLowerCase())
  );

  if (drives.length === 0 && (req.user.email?.includes('google') || companyProfile?.company_name?.includes('Google'))) {
    drives = allDrives.filter(d => d.company_name?.includes('Google') || d.id === 'drive_google_sde');
  }
  
  const result = drives.map(drive => {
    const apps = find('applications', { drive_id: drive.id }) || [];
    const selectedApps = apps.filter(a => a.current_stage === 'SELECTED');
    return {
      ...drive,
      applicants_count: apps.length,
      selected_count: selectedApps.length
    };
  });

  res.json(result);
});

// 3. Post New Internship Drive
router.post('/drives', authenticate, requireRole('COMPANY'), (req, res) => {
  const companyProfile = findOne('company_profiles', { user_id: req.user.id });

  const {
    title,
    role_position,
    stipend_amount,
    stipend_type,
    duration_months,
    openings_count,
    min_cgpa,
    max_backlogs,
    allowed_branches,
    allowed_passing_years,
    gender_preference,
    required_skills,
    optional_skills,
    work_location_address,
    latitude,
    longitude,
    deadline,
    status
  } = req.body;

  if (!title || !role_position || !deadline) {
    return res.status(400).json({ error: 'Title, role position, and deadline are required.' });
  }

  // Use saved company office location if not explicitly provided
  const officeAddress = work_location_address || companyProfile?.office_address || 'Company Headquarters';
  const lat = latitude ? parseFloat(latitude) : (companyProfile?.latitude || 18.5529);
  const lng = longitude ? parseFloat(longitude) : (companyProfile?.longitude || 73.9497);

  const drive = insert('placement_drives', {
    created_by_user_id: req.user.id,
    title,
    internship_mode: (req.body.internship_mode || 'ON_SITE').toUpperCase() === 'REMOTE' ? 'REMOTE' : 'ON_SITE',
    company_name: companyProfile?.company_name || 'Company Partner',
    company_profile_id: companyProfile?.id || null,
    department: 'Engineering',
    allowed_branches: Array.isArray(allowed_branches) ? allowed_branches : ['Computer Science and Engineering'],
    role_position,
    stipend_amount: parseFloat(stipend_amount) || 0,
    stipend_type: stipend_type || 'MONTHLY',
    duration_months: parseInt(duration_months, 10) || 6,
    openings_count: parseInt(openings_count, 10) || 1,
    selected_count: 0,
    min_cgpa: min_cgpa !== undefined ? parseFloat(min_cgpa) : 6.5,
    max_backlogs: max_backlogs !== undefined ? parseInt(max_backlogs, 10) : 0,
    allowed_passing_years: Array.isArray(allowed_passing_years) ? allowed_passing_years : [2026],
    gender_preference: gender_preference || 'ANY',
    required_skills: Array.isArray(required_skills) ? required_skills : [],
    optional_skills: Array.isArray(optional_skills) ? optional_skills : [],
    work_location_address: officeAddress,
    latitude: lat,
    longitude: lng,
    deadline,
    status: status || 'ACTIVE',
    selection_rounds: ['Applied', 'GD', 'Interview', 'Selected', 'Rejected']
  });

  res.status(201).json({
    message: 'Internship drive created successfully!',
    drive
  });
});

// 4. Drive Applicants & Stage Pipeline
router.get('/drives/:id/applicants', authenticate, requireRole('COMPANY'), (req, res) => {
  const drive = findById('placement_drives', req.params.id);
  if (!drive || (drive.created_by_user_id !== req.user.id && req.user.role !== 'ADMIN')) {
    return res.status(404).json({ error: 'Drive not found or access denied.' });
  }

  const applications = find('applications', { drive_id: drive.id }) || [];
  
  const enriched = applications.map(app => {
    const student = findById('student_profiles', app.student_id);
    return {
      ...app,
      student_name: student?.full_name || 'Student',
      student_roll: student?.student_id || '',
      branch: student?.branch || '',
      cgpa: student?.current_cgpa || 0,
      skills: student?.skills || [],
      github_score: student?.github_score || 0,
      resume_url: student?.resume_url || ''
    };
  });

  res.json({
    drive,
    applicants: {
      all: enriched,
      applied: enriched.filter(a => a.current_stage === 'APPLIED'),
      gd: enriched.filter(a => a.current_stage === 'GD'),
      interview: enriched.filter(a => a.current_stage === 'INTERVIEW' || a.current_stage === 'Technical Interview'),
      selected: enriched.filter(a => a.current_stage === 'SELECTED'),
      rejected: enriched.filter(a => a.current_stage === 'REJECTED')
    }
  });
});

// 4a. Single Drive Details
router.get('/drives/:id', authenticate, requireRole('COMPANY'), (req, res) => {
  const drive = findById('placement_drives', req.params.id);
  if (!drive || (drive.created_by_user_id !== req.user.id && req.user.role !== 'ADMIN')) {
    return res.status(404).json({ error: 'Drive not found or access denied.' });
  }

  const apps = find('applications', { drive_id: drive.id }) || [];
  const selectedApps = apps.filter(a => a.current_stage === 'SELECTED');

  res.json({
    ...drive,
    applicants_count: apps.length,
    selected_count: selectedApps.length,
    stages_breakdown: {
      applied: apps.filter(a => a.current_stage === 'APPLIED').length,
      gd: apps.filter(a => a.current_stage === 'GD').length,
      interview: apps.filter(a => a.current_stage === 'INTERVIEW' || a.current_stage === 'Technical Interview').length,
      selected: selectedApps.length,
      rejected: apps.filter(a => a.current_stage === 'REJECTED').length
    }
  });
});

// 4b. Broadcast Event to Applicants (All or Stage-specific)
router.post('/drives/:id/broadcast-event', authenticate, requireRole('COMPANY'), (req, res) => {
  const drive = findById('placement_drives', req.params.id);
  if (!drive || (drive.created_by_user_id !== req.user.id && req.user.role !== 'ADMIN')) {
    return res.status(404).json({ error: 'Drive not found or access denied.' });
  }

  const { target_stage, event_title, scheduled_at, venue_or_link, notes } = req.body;

  if (!event_title || !scheduled_at) {
    return res.status(400).json({ error: 'Event title and scheduled date/time are required.' });
  }

  const applications = find('applications', { drive_id: drive.id }) || [];
  
  // Filter target applications
  const targetApps = applications.filter(app => {
    if (!target_stage || target_stage.toUpperCase() === 'ALL') return true;
    return app.current_stage.toUpperCase() === target_stage.toUpperCase();
  });

  if (targetApps.length === 0) {
    return res.status(400).json({ error: `No applicants currently found in ${target_stage || 'All'} stage.` });
  }

  const newEvent = {
    stage: target_stage && target_stage.toUpperCase() !== 'ALL' ? target_stage : 'General Announcement',
    event_title,
    scheduled_at,
    venue_or_link: venue_or_link || 'Campus Portal Link',
    notes: notes || `Event scheduled for ${drive.title}: ${event_title}`,
    event_posted: true,
    posted_at: new Date().toISOString()
  };

  targetApps.forEach(app => {
    const existingEvents = app.stage_events || [];
    existingEvents.push(newEvent);

    update('applications', app.id, {
      stage_events: existingEvents
    });

    const student = findById('student_profiles', app.student_id);
    if (student) {
      const studentUser = findById('users', student.user_id);
      if (studentUser) {
        insert('notifications', {
          user_id: studentUser.id,
          module_key: 'PLACEMENT',
          title: `New Event: ${event_title} (${drive.company_name})`,
          message: `Scheduled for ${new Date(scheduled_at).toLocaleString()}. Venue/Link: ${venue_or_link || 'Campus Portal'}. Check selection timeline.`,
          link_route: '/student/applications',
          is_read: false
        });
      }
    }
  });

  res.json({
    message: `Event successfully broadcasted to ${targetApps.length} applicant(s)!`,
    broadcast_count: targetApps.length,
    event: newEvent
  });
});

// 4c. Toggle Drive Status (Active vs Closed)
router.post(['/drives/:id/toggle-status', '/drives/:id/status'], authenticate, requireRole('COMPANY'), (req, res) => {
  const drive = findById('placement_drives', req.params.id);
  if (!drive || (drive.created_by_user_id !== req.user.id && req.user.role !== 'ADMIN')) {
    return res.status(404).json({ error: 'Drive not found or access denied.' });
  }

  const { status } = req.body;
  const newStatus = status ? status.toUpperCase() : (drive.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE');

  const updated = update('placement_drives', drive.id, {
    status: newStatus
  });

  res.json({
    message: `Drive status updated to ${newStatus}. ${newStatus === 'CLOSED' ? 'New student applications are now disabled.' : 'Drive is now accepting student applications.'}`,
    drive: updated
  });
});

// 5. Selected Students Module
router.get('/selected-students', authenticate, requireRole('COMPANY'), (req, res) => {
  const companyProfile = findOne('company_profiles', { user_id: req.user.id });
  const myDrives = find('placement_drives', { created_by_user_id: req.user.id }) || [];
  const driveIds = new Set(myDrives.map(d => d.id));

  const allApplications = find('applications') || [];
  // Include all applications marked SELECTED for drives created by this company, or all if demo recruiter
  const selectedApps = allApplications.filter(a => (driveIds.size === 0 || driveIds.has(a.drive_id)) && a.current_stage === 'SELECTED');

  const result = selectedApps.map(app => {
    const drive = findById('placement_drives', app.drive_id);
    const student = findById('student_profiles', app.student_id);
    const offer = findOne('offer_letters', { student_id: app.student_id, drive_id: app.drive_id }) ||
                  findOne('offer_letters', { student_id: app.student_id });

    // Accurately determine if offer was really issued
    let offerStatus = 'NOT_ISSUED';
    if (offer && offer.status) {
      offerStatus = offer.status; // 'SENT', 'ACCEPTED', 'REJECTED'
    }

    return {
      id: app.id,
      application_id: app.id,
      student_id: student?.id,
      student_roll: student?.student_id || 'N/A',
      student_name: student?.full_name || 'Selected Candidate',
      student_email: student?.user_id ? findById('users', student.user_id)?.email : '',
      branch: student?.branch || 'Engineering',
      cgpa: student?.current_cgpa || 8.0,
      drive_id: app.drive_id,
      drive_title: drive?.title || drive?.role_position || 'Campus Placement Drive',
      company_name: companyProfile?.company_name || drive?.company_name || 'Google India',
      role_position: drive?.role_position || 'Software Engineering Intern',
      stipend_amount: drive?.stipend_amount || 50000,
      internship_type: 'Campus Selection',
      selection_date: app.updated_at || app.applied_at,
      offer_letter_status: offerStatus,
      offer_letter_url: offer ? offer.offer_letter_url : null,
      offer_id: offer ? offer.id : null,
      sent_date: offer ? offer.sent_date : null
    };
  });

  res.json(result);
});

// 6. Bulk / Multi-Select Offer Letters Upload & Automated PRN Matcher Preview
router.post('/offers/bulk-preview', authenticate, requireRole('COMPANY'), (req, res) => {
  const { filenames, uploaded_files } = req.body;
  const rawList = uploaded_files || filenames || [];

  if (!Array.isArray(rawList) || rawList.length === 0) {
    return res.status(400).json({ error: 'No files provided for matching analysis.' });
  }

  const allStudents = find('student_profiles') || [];
  const myDrives = find('placement_drives', { created_by_user_id: req.user.id }) || [];
  const driveIds = new Set(myDrives.map(d => d.id));
  const allApplications = find('applications') || [];
  const selectedApps = allApplications.filter(a => (driveIds.size === 0 || driveIds.has(a.drive_id)) && a.current_stage === 'SELECTED');
  const selectedStudentIds = new Set(selectedApps.map(a => a.student_id));

  const eligibleCandidates = allStudents.map(s => ({
    id: s.id,
    student_id: s.student_id,
    full_name: s.full_name,
    branch: s.branch,
    is_selected_in_drive: selectedStudentIds.has(s.id)
  }));

  const matched = [];
  const unmatched = [];

  rawList.forEach((item, index) => {
    const fileName = typeof item === 'string' ? item : item.filename;
    const fileUrl = typeof item === 'object' && item.url ? item.url : 'https://example.com/offer.pdf';
    const fileSize = typeof item === 'object' && item.size ? item.size : null;
    const fileBase64 = typeof item === 'object' && item.base64 ? item.base64 : null;
    const lowerName = fileName.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Smart Matcher:
    // 1. Exact or partial PRN match (e.g. GHR-CS-2023-042 or 042)
    // 2. Full Name match (e.g. Alex Patil -> alexpatil)
    let foundStudent = null;
    for (const student of allStudents) {
      const cleanPrn = (student.student_id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanName = (student.full_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const nameParts = (student.full_name || '').toLowerCase().split(' ').filter(p => p.length > 2);

      if (cleanPrn && lowerName.includes(cleanPrn)) {
        foundStudent = student;
        break;
      }
      if (cleanName && lowerName.includes(cleanName)) {
        foundStudent = student;
        break;
      }
      if (nameParts.length > 0 && nameParts.every(part => lowerName.includes(part))) {
        foundStudent = student;
        break;
      }
    }

    if (foundStudent) {
      matched.push({
        id: `matched_${index}_${foundStudent.id}`,
        file: { filename: fileName, url: fileBase64 || fileUrl, size: fileSize },
        file_name: fileName,
        student_id: foundStudent.student_id,
        student: foundStudent,
        student_name: foundStudent.full_name,
        branch: foundStudent.branch,
        role_position: 'Software Engineering Intern',
        stipend_amount: 50000,
        status: 'MATCHED'
      });
    } else {
      unmatched.push({
        id: `unmatched_${index}`,
        file: { filename: fileName, url: fileBase64 || fileUrl, size: fileSize },
        file_name: fileName,
        filename: fileName,
        reason: 'No matching Student PRN or Candidate Name pattern detected in filename.',
        status: 'UNMATCHED',
        manual_assigned_student_id: null
      });
    }
  });

  res.json({
    total_files: rawList.length,
    matched_count: matched.length,
    unmatched_count: unmatched.length,
    matched_files: matched,
    unmatched_files: unmatched,
    eligible_candidates: eligibleCandidates
  });
});

// 7. Confirm & Dispatch Matched Bulk Offers
router.post(['/offers/confirm-dispatch', '/offers/bulk-send', '/offers/dispatch'], authenticate, requireRole('COMPANY'), async (req, res) => {
  const companyProfile = findOne('company_profiles', { user_id: req.user.id });
  const { matched_dispatches, matched_offers, offers } = req.body;
  const listToProcess = offers || matched_offers || matched_dispatches || [];

  if (!Array.isArray(listToProcess) || listToProcess.length === 0) {
    return res.status(400).json({ error: 'No matched offer letters provided for dispatch.' });
  }

  let count = 0;
  const companyName = companyProfile?.company_name || 'Google India';

  for (const item of listToProcess) {
    const student = item.student_id ? (findOne('student_profiles', { student_id: item.student_id }) || findById('student_profiles', item.student_id)) : null;
    if (student) {
      // Check if offer already exists for this student
      const startDate = item.start_date || '2026-09-01';
      const endDate = item.end_date || '2027-02-28';
      const fridayDates = calculateFridayDates(startDate, endDate);

      const offerData = {
        student_id: student.id,
        drive_id: item.drive_id || null,
        company_id: companyProfile?.id || null,
        company_name: companyName,
        role_position: item.role_position || 'Software Engineering Intern',
        stipend_amount: item.stipend_amount ? parseInt(item.stipend_amount, 10) : 50000,
        start_date: startDate,
        end_date: endDate,
        friday_reports_count: fridayDates.length,
        offer_letter_url: item.offer_letter_url || item.file?.url || `https://example.com/offers/${item.file_name || 'offer.pdf'}`,
        offer_type: item.offer_type || 'INTERNSHIP',
        status: 'SENT',
        sent_date: new Date().toISOString(),
        student_response_date: null
      };

      if (existingOffer) {
        update('offer_letters', existingOffer.id, offerData);
      } else {
        insert('offer_letters', offerData);
      }

      // Notify student in-app
      const studentUser = findById('users', student.user_id);
      if (studentUser) {
        insert('notifications', {
          user_id: studentUser.id,
          module_key: 'OFFER',
          title: `Official Offer Letter Issued by ${companyName}!`,
          message: `Your offer letter has been uploaded (${startDate} to ${endDate} - ${fridayDates.length} Friday Reports). Please review and accept in your PPO & Offers Hub.`,
          link_route: '/student/offers-ppo',
          is_read: false
        });
      }
      count++;
    }
  }

  res.json({
    message: `Successfully dispatched ${count} official offer letters to selected students!`,
    dispatched_count: count,
    created_offers_count: count
  });
});

// 7b. Single Student Offer Upload
router.post('/offers/single-upload', authenticate, requireRole('COMPANY'), (req, res) => {
  const companyProfile = findOne('company_profiles', { user_id: req.user.id });
  const { student_id, drive_id, role_position, stipend_amount, offer_letter_url, offer_type, start_date, end_date } = req.body;

  if (!student_id) {
    return res.status(400).json({ error: 'Student ID is required.' });
  }

  const student = findById('student_profiles', student_id) || findOne('student_profiles', { student_id });
  if (!student) {
    return res.status(404).json({ error: 'Student record not found.' });
  }

  const companyName = companyProfile?.company_name || 'Google India';
  const existingOffer = findOne('offer_letters', { student_id: student.id });

  const startDate = start_date || '2026-09-01';
  const endDate = end_date || '2027-02-28';
  const fridayDates = calculateFridayDates(startDate, endDate);

  const offerData = {
    student_id: student.id,
    drive_id: drive_id || null,
    company_id: companyProfile?.id || null,
    company_name: companyName,
    role_position: role_position || 'Software Engineering Intern',
    stipend_amount: stipend_amount ? parseInt(stipend_amount, 10) : 50000,
    start_date: startDate,
    end_date: endDate,
    friday_reports_count: fridayDates.length,
    offer_letter_url: offer_letter_url || 'https://example.com/offers/offer_letter.pdf',
    offer_type: offer_type || 'INTERNSHIP',
    status: 'SENT',
    sent_date: new Date().toISOString(),
    student_response_date: null
  };

  let savedOffer;
  if (existingOffer) {
    savedOffer = update('offer_letters', existingOffer.id, offerData);
  } else {
    savedOffer = insert('offer_letters', offerData);
  }

  // Notify student
  const studentUser = findById('users', student.user_id);
  if (studentUser) {
    insert('notifications', {
      user_id: studentUser.id,
      module_key: 'OFFER',
      title: `Official Offer Letter Issued by ${companyName}!`,
      message: `Your offer letter has been uploaded (${startDate} to ${endDate} - ${fridayDates.length} Friday Reports). Please review and accept in your PPO & Offers Hub.`,
      link_route: '/student/offers-ppo',
      is_read: false
    });
  }

  res.json({
    message: `Offer letter issued successfully to ${student.full_name}! (${fridayDates.length} Friday reports calculated for tenure)`,
    offer: savedOffer,
    friday_reports_count: fridayDates.length
  });
});

// 8a. Get Selected Interns for Evaluation & PPO (Only Selected / Active Interns for this company)
router.get('/interns', authenticate, requireRole('COMPANY'), (req, res) => {
  const companyProfile = findOne('company_profiles', { user_id: req.user.id });
  const myDrives = find('placement_drives', { created_by_user_id: req.user.id }) || [];
  const driveIds = new Set(myDrives.map(d => d.id));

  // Find all applications marked SELECTED for drives created by this company
  const allApplications = find('applications') || [];
  const selectedApps = allApplications.filter(a => (driveIds.size === 0 || driveIds.has(a.drive_id)) && a.current_stage === 'SELECTED');
  const selectedStudentIds = new Set(selectedApps.map(a => a.student_id));

  // Find accepted offer letters for this company
  const allOffers = find('offer_letters') || [];
  const companyName = companyProfile?.company_name || 'Google India';
  const acceptedOffers = allOffers.filter(o => o.status === 'ACCEPTED' && (o.company_name?.toLowerCase().includes(companyName.toLowerCase()) || (o.drive_id && driveIds.has(o.drive_id))));
  const acceptedStudentIds = new Set(acceptedOffers.map(o => o.student_id));

  // Find internships belonging to this company
  const allInternships = find('internships') || [];
  const matchedInternships = allInternships.filter(i => {
    return (
      (i.company_name && i.company_name.toLowerCase().includes(companyName.toLowerCase())) ||
      (i.drive_id && driveIds.has(i.drive_id)) ||
      selectedStudentIds.has(i.student_id) ||
      acceptedStudentIds.has(i.student_id)
    );
  });

  const candidatesMap = new Map();

  // 1. Add matched internships
  matchedInternships.forEach(internship => {
    const student = findById('student_profiles', internship.student_id);
    const drive = internship.drive_id ? findById('placement_drives', internship.drive_id) : null;
    const attendance = find('attendance_records', { internship_id: internship.id }) || [];
    const reports = find('weekly_reports', { internship_id: internship.id }) || [];

    const isEvaluated = Boolean(internship.company_evaluated_at);

    candidatesMap.set(internship.student_id, {
      id: internship.id,
      internship_id: internship.id,
      student_id: internship.student_id,
      student_name: student?.full_name || 'Selected Intern',
      student_roll: student?.student_id || 'N/A',
      student_email: student?.user_id ? findById('users', student.user_id)?.email : '',
      branch: student?.branch || 'Computer Science and Engineering',
      cgpa: student?.current_cgpa || 8.5,
      company_name: internship.company_name || companyName,
      role_position: internship.role_position || drive?.role_position || 'Software Engineering Intern',
      drive_title: drive?.title || drive?.role_position || 'Campus Placement Drive',
      start_date: internship.start_date,
      end_date: internship.end_date,
      status: internship.status,
      attendance_count: attendance.length,
      reports_count: reports.length,
      is_evaluated: isEvaluated,
      company_evaluation_score: isEvaluated ? internship.company_evaluation_score : null,
      technical_score: isEvaluated ? (internship.company_technical_score || 90) : 90,
      soft_skills_score: isEvaluated ? (internship.company_soft_skills_score || 90) : 90,
      attendance_rating: isEvaluated ? (internship.company_attendance_score || 90) : 90,
      ppo_recommended: Boolean(internship.ppo_recommended),
      company_feedback: isEvaluated ? (internship.company_feedback || 'Demonstrated exceptional technical capability, initiative, and teamwork.') : '',
      evaluated_at: internship.company_evaluated_at || null
    });
  });

  // 2. Also ensure any selected applications without an active internship record yet are listed
  selectedApps.forEach(app => {
    if (!candidatesMap.has(app.student_id)) {
      const student = findById('student_profiles', app.student_id);
      const drive = findById('placement_drives', app.drive_id);
      const offer = findOne('offer_letters', { student_id: app.student_id, drive_id: app.drive_id });

      candidatesMap.set(app.student_id, {
        id: `cand_${app.id}`,
        internship_id: null,
        student_id: app.student_id,
        student_name: student?.full_name || 'Selected Candidate',
        student_roll: student?.student_id || 'N/A',
        student_email: student?.user_id ? findById('users', student.user_id)?.email : '',
        branch: student?.branch || 'Computer Science and Engineering',
        cgpa: student?.current_cgpa || 8.5,
        company_name: drive?.company_name || companyName,
        role_position: drive?.role_position || 'Software Engineering Intern',
        drive_title: drive?.title || drive?.role_position || 'Campus Placement Drive',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: offer ? (offer.status === 'ACCEPTED' ? 'OFFER_ACCEPTED' : 'OFFER_ISSUED') : 'SELECTED_PENDING_OFFER',
        attendance_count: 0,
        reports_count: 0,
        is_evaluated: false,
        company_evaluation_score: null,
        technical_score: 90,
        soft_skills_score: 90,
        attendance_rating: 90,
        ppo_recommended: false,
        company_feedback: '',
        evaluated_at: null
      });
    }
  });

  res.json(Array.from(candidatesMap.values()));
});

// 8b. Company Intern Evaluation & PPO Recommendation
router.post('/interns/:id/evaluate', authenticate, requireRole('COMPANY'), (req, res) => {
  const companyProfile = findOne('company_profiles', { user_id: req.user.id });
  const companyName = companyProfile?.company_name || 'Google India';

  // Find by internship ID or student ID
  let internship = findById('internships', req.params.id) ||
                   findOne('internships', { student_id: req.params.id }) ||
                   findOne('internships', { student_id: req.body.student_id });

  const {
    student_id,
    technical_score,
    soft_skills_score,
    attendance_rating,
    ppo_recommended,
    comments
  } = req.body;

  const totalEvaluationScore = (
    (parseFloat(technical_score || 90) * 0.5) +
    (parseFloat(soft_skills_score || 90) * 0.3) +
    (parseFloat(attendance_rating || 90) * 0.2)
  ).toFixed(1);

  if (internship) {
    update('internships', internship.id, {
      company_evaluation_score: parseFloat(totalEvaluationScore),
      company_technical_score: parseFloat(technical_score || 90),
      company_soft_skills_score: parseFloat(soft_skills_score || 90),
      company_attendance_score: parseFloat(attendance_rating || 90),
      ppo_recommended: Boolean(ppo_recommended),
      company_feedback: comments || 'Demonstrated outstanding dedication and technical execution.',
      company_evaluated_at: new Date().toISOString()
    });
  }

  // If PPO recommended, ensure student and T&P are notified
  const targetStudentId = internship ? internship.student_id : (student_id || req.params.id);
  const student = findById('student_profiles', targetStudentId);

  if (student && ppo_recommended) {
    const studentUser = findById('users', student.user_id);
    if (studentUser) {
      insert('notifications', {
        user_id: studentUser.id,
        module_key: 'OFFER',
        title: `Pre-Placement Offer (PPO) Recommended by ${companyName}!`,
        message: `Congratulations! ${companyName} has recommended you for a full-time Pre-Placement Offer (PPO) with an industrial score of ${totalEvaluationScore}/100.`,
        link_route: '/student/offers-ppo',
        is_read: false
      });
    }

    const tnpUsers = find('users', { role: 'TNP' }) || [];
    tnpUsers.forEach(tUser => {
      insert('notifications', {
        user_id: tUser.id,
        module_key: 'OFFER',
        title: `PPO Recommended for ${student.full_name}`,
        message: `${companyName} recommended ${student.full_name} (${student.branch}) for a Full-Time PPO (Score: ${totalEvaluationScore}/100).`,
        link_route: '/tnp/students',
        is_read: false
      });
    });
  }

  res.json({
    message: `Intern performance evaluation saved successfully! ${ppo_recommended ? 'Pre-Placement Offer (PPO) recommendation dispatched to student and T&P Cell.' : ''}`,
    score: totalEvaluationScore,
    ppo_recommended: Boolean(ppo_recommended)
  });
});

export default router;
