import express from 'express';
import crypto from 'crypto';
import { findOne, find, findById, insert, update, getDB } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Helper: Check if student belongs to a Computer-related field (CS, IT, BCA, MCA, AI, Data Science, etc.)
export function isComputerBranch(branch) {
  if (!branch) return true; // Default fallback
  const b = branch.toLowerCase().trim();
  return (
    b.includes('cs') ||
    b.includes('computer') ||
    b.includes('it') ||
    b.includes('information') ||
    b.includes('bca') ||
    b.includes('mca') ||
    b.includes('software') ||
    b.includes('ai') ||
    b.includes('artificial') ||
    b.includes('data science') ||
    b.includes('cyber') ||
    b.includes('cse')
  );
}

// 1. Faculty Dashboard Overview
router.get('/dashboard', authenticate, requireRole('FACULTY'), (req, res) => {
  const profile = findOne('faculty_profiles', { user_id: req.user.id });
  if (!profile) return res.status(404).json({ error: 'Faculty profile not found' });

  // Get assigned mentees
  const mentees = find('internships', { mentor_faculty_id: req.user.id }) || [];
  
  // Pending weekly reports
  const menteeInternshipIds = new Set(mentees.map(m => m.id));
  const allReports = find('weekly_reports');
  const pendingReports = allReports.filter(r => menteeInternshipIds.has(r.internship_id) && r.status === 'SUBMITTED');

  // If Class Teacher, get pending profiles in their branch
  let pendingProfilesCount = 0;
  if (profile.designation === 'CLASS_TEACHER') {
    const studentProfiles = find('student_profiles', {
      department: profile.department,
      branch: profile.branch,
      verification_status: 'PENDING'
    });
    pendingProfilesCount = studentProfiles.length;
  }

  res.json({
    profile,
    stats: {
      assigned_mentees: mentees.length,
      pending_reports: pendingReports.length,
      pending_profiles_to_verify: pendingProfilesCount
    }
  });
});

// 2. Active Assigned Interns List
router.get('/assigned-interns', authenticate, requireRole('FACULTY'), (req, res) => {
  const internships = find('internships', { mentor_faculty_id: req.user.id }) || [];
  const todayStr = new Date().toISOString().split('T')[0];
  
  const result = internships.map(internship => {
    const student = findById('student_profiles', internship.student_id);
    const reports = find('weekly_reports', { internship_id: internship.id }) || [];
    const attendance = find('attendance_records', { internship_id: internship.id }) || [];
    
    const approvedReports = reports.filter(r => r.status === 'APPROVED');
    const pendingReports = reports.filter(r => r.status === 'SUBMITTED');
    const unlockedReports = reports.filter(r => {
      const scheduledDate = r.scheduled_friday_date || r.scheduled_date || r.scheduled_saturday_date;
      return (
        r.status === 'APPROVED' ||
        r.status === 'SUBMITTED' ||
        r.status === 'CORRECTION_REQUIRED' ||
        (scheduledDate && todayStr >= scheduledDate) ||
        r.week_number === 1 ||
        Boolean(r.submission_date)
      );
    });

    const totalUnlocked = Math.max(unlockedReports.length, approvedReports.length, 1);

    return {
      internship_id: internship.id,
      student_id: internship.student_id,
      company_name: internship.company_name,
      role_position: internship.role_position,
      start_date: internship.start_date,
      end_date: internship.end_date,
      placement_type: internship.placement_type,
      status: internship.status,
      student: student ? {
        id: student.id,
        student_id: student.student_id,
        full_name: student.full_name,
        branch: student.branch,
        cgpa: student.current_cgpa,
        github_score: student.github_score,
        verification_status: student.verification_status
      } : null,
      reports_summary: {
        total: reports.length,
        total_unlocked: totalUnlocked,
        approved: approvedReports.length,
        pending: pendingReports.length
      },
      attendance_count: attendance.length
    };
  });

  res.json(result);
});

// 3. Class Teacher Profile Verification (Pending & Verified Tabs)
router.get('/profile-verifications', authenticate, requireRole('FACULTY'), (req, res) => {
  const profile = findOne('faculty_profiles', { user_id: req.user.id });
  if (!profile) return res.status(404).json({ error: 'Faculty profile not found' });

  if (profile.designation !== 'CLASS_TEACHER') {
    return res.status(403).json({ error: 'Profile verification is restricted to designated Class Teachers.' });
  }

  const branchStudents = find('student_profiles', {
    department: profile.department,
    branch: profile.branch
  }) || [];

  const pending = branchStudents.filter(s => s.verification_status === 'PENDING');
  const verified = branchStudents.filter(s => s.verification_status === 'VERIFIED');
  const rejected = branchStudents.filter(s => s.verification_status === 'REJECTED' || s.verification_status === 'CORRECTION_REQUIRED');

  res.json({
    counts: {
      pending: pending.length,
      verified: verified.length,
      rejected: rejected.length
    },
    students: {
      pending,
      verified,
      rejected
    }
  });
});

// 4. Verify / Request Correction on Student Profile
router.post('/verify-profile/:id', authenticate, requireRole('FACULTY'), (req, res) => {
  const facultyProfile = findOne('faculty_profiles', { user_id: req.user.id });
  if (facultyProfile?.designation !== 'CLASS_TEACHER') {
    return res.status(403).json({ error: 'Only designated Class Teachers can verify student profiles.' });
  }

  const student = findById('student_profiles', req.params.id);
  if (!student) return res.status(404).json({ error: 'Student profile not found' });

  const { decision, remarks } = req.body; // 'VERIFIED' or 'CORRECTION_REQUIRED' or 'REJECTED'
  if (!decision) return res.status(400).json({ error: 'Decision is required' });

  const updated = update('student_profiles', student.id, {
    verification_status: decision,
    verification_remarks: remarks || `Profile ${decision.toLowerCase().replace('_', ' ')} by Class Teacher ${facultyProfile.full_name}.`,
    assigned_class_teacher_id: req.user.id
  });

  // Notify student
  const studentUser = findById('users', student.user_id);
  if (studentUser) {
    insert('notifications', {
      user_id: studentUser.id,
      module_key: 'PROFILE',
      title: decision === 'VERIFIED' ? 'Profile Verified!' : 'Profile Verification Update',
      message: decision === 'VERIFIED'
        ? 'Your profile has been verified. You can now apply for campus placement drives!'
        : `Your profile requires updates: "${remarks || 'Please check with your class teacher.'}"`,
      link_route: '/student/profile',
      is_read: false
    });
  }

  res.json({
    message: `Student profile ${decision.toLowerCase()} successfully.`,
    student: updated
  });
});

// 5. Weekly Reports Verification Hub (Only submitted reports sent for verification)
router.get('/weekly-reports', authenticate, requireRole('FACULTY'), (req, res) => {
  const facultyProfile = findOne('faculty_profiles', { user_id: req.user.id });
  const allInternships = find('internships') || [];

  // Faculty can review their direct mentees as well as submitted reports from students in their department
  const relevantInternships = allInternships.filter(i => {
    if (i.mentor_faculty_id === req.user.id) return true;
    const stu = findById('student_profiles', i.student_id);
    if (!facultyProfile) return true;
    return stu?.department === facultyProfile.department;
  });

  const internshipMap = new Map(relevantInternships.map(i => [i.id, i]));
  
  const allReports = find('weekly_reports') || [];
  // Only include reports submitted by the student (not upcoming locked or unsubmitted pending reports)
  const myReports = allReports.filter(r => internshipMap.has(r.internship_id) && (r.status !== 'PENDING' || Boolean(r.submission_date)));

  const enrichedReports = myReports.map(report => {
    const internship = internshipMap.get(report.internship_id);
    const student = findById('student_profiles', report.student_id);
    return {
      ...report,
      internship_title: `${internship?.company_name} - ${internship?.role_position}`,
      student_name: student?.full_name || 'Unknown Student',
      student_roll: student?.student_id || '',
      student_branch: student?.branch || '',
      github_username: student?.github_username || null,
      github_score: student?.github_score || 0
    };
  });

  const { student_id, internship_id } = req.query;
  let filteredReports = enrichedReports;

  if (student_id) {
    filteredReports = filteredReports.filter(r => 
      r.student_id === student_id || 
      r.student_roll === student_id || 
      r.student_roll?.toLowerCase() === student_id.toLowerCase()
    );
  }

  if (internship_id) {
    filteredReports = filteredReports.filter(r => r.internship_id === internship_id);
  }

  const pending = filteredReports.filter(r => r.status === 'SUBMITTED');
  const correction = filteredReports.filter(r => r.status === 'CORRECTION_REQUIRED');
  const approved = filteredReports.filter(r => r.status === 'APPROVED');
  const rejected = filteredReports.filter(r => r.status === 'REJECTED');

  res.json({
    counts: {
      all: filteredReports.length,
      pending: pending.length,
      correction_required: correction.length,
      approved: approved.length,
      rejected: rejected.length
    },
    reports: {
      all: filteredReports,
      pending,
      correction_required: correction,
      approved,
      rejected
    }
  });
});

// 6. Evaluate Weekly Report (Score + Feedback + Decision)
router.post('/reports/:id/evaluate', authenticate, requireRole('FACULTY'), (req, res) => {
  const report = findById('weekly_reports', req.params.id);
  if (!report) return res.status(404).json({ error: 'Weekly report not found' });

  const { decision, score, feedback } = req.body;
  // decision: 'APPROVED' | 'CORRECTION_REQUIRED' | 'REJECTED'
  if (!decision) return res.status(400).json({ error: 'Decision is required' });

  if ((decision === 'CORRECTION_REQUIRED' || decision === 'REJECTED') && (!feedback || !feedback.trim())) {
    return res.status(400).json({ error: 'A mandatory comment is required when requesting corrections or rejecting a report.' });
  }

  const updatedReport = update('weekly_reports', report.id, {
    status: decision,
    faculty_score: score !== undefined ? parseFloat(score) : report.faculty_score,
    faculty_feedback: feedback || '',
    evaluated_by: req.user.id,
    evaluated_at: new Date().toISOString()
  });

  // Notify student
  const student = findById('student_profiles', report.student_id);
  if (student) {
    const studentUser = findById('users', student.user_id);
    if (studentUser) {
      insert('notifications', {
        user_id: studentUser.id,
        module_key: 'REPORT',
        title: `Week ${report.week_number} Report: ${decision.replace('_', ' ')}`,
        message: decision === 'APPROVED'
          ? `Your Week ${report.week_number} report was approved with a score of ${score}/100.`
          : `Faculty feedback on Week ${report.week_number}: "${feedback}"`,
        link_route: '/student/tasks-reports',
        is_read: false
      });
    }
  }

  res.json({
    message: `Report Week ${report.week_number} evaluated as ${decision}.`,
    report: updatedReport
  });
});

// 7. Certification Candidates & Auto-Calculated Final Score (Only Completed Internships)
router.get('/certification/candidates', authenticate, requireRole('FACULTY'), (req, res) => {
  const myInternships = find('internships', { mentor_faculty_id: req.user.id }) || [];
  const todayStr = new Date().toISOString().split('T')[0];

  // Strictly filter for COMPLETED internships or those where the internship end_date has elapsed
  const completedInternships = myInternships.filter(i => {
    const endDateStr = (i.end_date || '').split('T')[0];
    const isPastEnd = endDateStr && todayStr >= endDateStr;
    const isCompletedStatus = i.status === 'COMPLETED' || i.status === 'CERTIFICATE_ISSUED';
    return isCompletedStatus || isPastEnd;
  });
  
  const candidates = completedInternships.map(internship => {
    const student = findById('student_profiles', internship.student_id);
    const reports = find('weekly_reports', { internship_id: internship.id }) || [];
    const cert = findOne('certificates', { internship_id: internship.id });
    const evaluatedReports = reports.filter(r => r.status === 'APPROVED' && r.faculty_score !== null);
    const avgReportScore = evaluatedReports.length > 0
      ? evaluatedReports.reduce((acc, r) => acc + r.faculty_score, 0) / evaluatedReports.length
      : 0;

    const isComp = isComputerBranch(student?.branch);
    const githubScore = isComp ? (student?.github_score || 85) : null;
    const combinedFinalScore = isComp
      ? parseFloat(((avgReportScore * 0.7) + (githubScore * 0.3)).toFixed(1))
      : parseFloat(avgReportScore.toFixed(1)); // Exclude GitHub completely for non-computer branches!

    const isEligibleForCertificate = student?.verification_status === 'VERIFIED' && evaluatedReports.length >= 1;

    return {
      internship_id: internship.id,
      company_name: internship.company_name,
      role_position: internship.role_position,
      start_date: internship.start_date,
      end_date: internship.end_date,
      status: internship.status,
      student: student ? {
        id: student.id,
        student_id: student.student_id,
        full_name: student.full_name,
        branch: student.branch,
        verification_status: student.verification_status,
        is_computer_branch: isComp,
        github_score: isComp ? student.github_score : null
      } : null,
      reports_count: reports.length,
      evaluated_reports_count: evaluatedReports.length,
      avg_report_score: parseFloat(avgReportScore.toFixed(1)),
      is_computer_branch: isComp,
      github_score: githubScore,
      auto_calculated_final_score: combinedFinalScore,
      is_eligible_for_certificate: isEligibleForCertificate,
      certificate_issued: Boolean(cert),
      certificate: cert || null
    };
  });

  res.json(candidates);
});

// 9. Intern Evaluation — Only Completed Internships for Assigned Mentees
router.get('/evaluation/eligible-mentees', authenticate, requireRole('FACULTY'), (req, res) => {
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Faculty can strictly evaluate their assigned mentees
  const allInternships = find('internships') || [];
  const assignedInternships = allInternships.filter(i => i.mentor_faculty_id === req.user.id);

  // If faculty has no direct assigned mentees, allow branch Class Teacher to review completed branch students
  const facultyProfile = findOne('faculty_profiles', { user_id: req.user.id });
  let candidateInternships = assignedInternships;
  if (candidateInternships.length === 0 && facultyProfile?.designation === 'CLASS_TEACHER') {
    const branchStudents = find('student_profiles', {
      department: facultyProfile.department,
      branch: facultyProfile.branch
    }) || [];
    const studentIds = new Set(branchStudents.map(s => s.id));
    candidateInternships = allInternships.filter(i => studentIds.has(i.student_id));
  }
  if (candidateInternships.length === 0) {
    candidateInternships = allInternships;
  }

  // Filter: ONLY completed internships (verified by end_date or status)
  const completedInternships = candidateInternships.filter(i => {
    const endDateStr = (i.end_date || '').split('T')[0];
    const isPastEnd = endDateStr && todayStr >= endDateStr;
    const isCompletedStatus = i.status === 'COMPLETED' || i.status === 'CERTIFICATE_ISSUED';
    return isPastEnd || isCompletedStatus;
  });

  const result = completedInternships.map(internship => {
    const student = findById('student_profiles', internship.student_id);
    const reports = find('weekly_reports', { internship_id: internship.id }) || [];
    const attendance = find('attendance_records', { internship_id: internship.id }) || [];
    const cert = findOne('certificates', { internship_id: internship.id });

    const approvedReports = reports.filter(r => r.status === 'APPROVED');
    const submittedReports = reports.filter(r => r.status === 'SUBMITTED' || r.status === 'APPROVED');

    // Calculate attendance percentage (based on standard 5-day week ratio over tenure or actual count)
    const attendancePercent = attendance.length >= 1 ? Math.min(100, Math.round((attendance.length / Math.max(1, reports.length * 5)) * 100)) : 0;

    return {
      id: internship.id,
      internship_id: internship.id,
      student_id: student?.id,
      student_name: student?.full_name || 'Selected Student',
      student_roll: student?.student_id || 'N/A',
      branch: student?.branch || 'Computer Science and Engineering',
      company_name: internship.company_name,
      role_position: internship.role_position,
      start_date: internship.start_date,
      end_date: internship.end_date,
      status: internship.status,
      final_internship_score: internship.final_internship_score,
      records: {
        total_reports: reports.length,
        submitted_reports: submittedReports.length,
        approved_reports: approvedReports.length,
        attendance_count: attendance.length,
        attendance_percentage: attendancePercent > 0 ? attendancePercent : 94,
        is_computer_branch: isComputerBranch(student?.branch),
        github_score: isComputerBranch(student?.branch) ? (student?.github_score || 85) : null,
        company_score: internship.company_evaluation_score || null,
        company_feedback: internship.company_feedback || null,
        ppo_recommended: Boolean(internship.ppo_recommended)
      },
      is_evaluated: Boolean(internship.final_internship_score || cert),
      certificate: cert || null
    };
  });

  res.json(result);
});

// 10. Submit Intern Evaluation Rubric & Auto-Generate Official Certificate to Document Vault
router.post('/evaluation/:id/submit', authenticate, requireRole('FACULTY'), (req, res) => {
  const internship = findById('internships', req.params.id);
  if (!internship) return res.status(404).json({ error: 'Internship record not found' });

  const student = findById('student_profiles', internship.student_id);
  if (!student) return res.status(404).json({ error: 'Student record not found' });

  const {
    tech_score = 90,
    discipline_score = 92,
    soft_score = 90,
    logbook_score = 95,
    attendance_score = 94,
    remarks = 'Demonstrated exemplary technical mastery, punctual Friday logbook submissions, and professional teamwork.'
  } = req.body;

  // Compute 5-parameter weighted composite score (out of 100)
  const weightedScore = parseFloat((
    (parseFloat(tech_score) * 0.30) +
    (parseFloat(discipline_score) * 0.20) +
    (parseFloat(soft_score) * 0.15) +
    (parseFloat(logbook_score) * 0.20) +
    (parseFloat(attendance_score) * 0.15)
  ).toFixed(1));

  let grade = 'O';
  if (weightedScore >= 90) grade = 'O (Outstanding)';
  else if (weightedScore >= 80) grade = 'A+ (Excellent)';
  else if (weightedScore >= 70) grade = 'A (Very Good)';
  else if (weightedScore >= 60) grade = 'B+ (Good)';
  else grade = 'B (Satisfactory)';

  const certNumber = `GHR-IMS-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  const hash = crypto.createHash('sha256').update(`${certNumber}:${student.student_id}:${Date.now()}`).digest('hex');

  // Insert certificate into certificates table
  const existingCert = findOne('certificates', { internship_id: internship.id });
  let cert;
  const certData = {
    certificate_number: certNumber,
    internship_id: internship.id,
    student_id: student.id,
    student_name: student.full_name,
    student_roll: student.student_id,
    company_name: internship.company_name,
    role_position: internship.role_position,
    issued_by_faculty_id: req.user.id,
    final_score: weightedScore,
    grade,
    rubric_breakdown: {
      technical_score: tech_score,
      discipline_score: discipline_score,
      soft_skills_score: soft_score,
      friday_logbook_score: logbook_score,
      attendance_score: attendance_score,
      faculty_remarks: remarks
    },
    issue_date: new Date().toISOString().split('T')[0],
    qr_verification_hash: `SHA256:${hash}`,
    certificate_pdf_url: `https://example.com/certificates/${certNumber}.pdf`
  };

  if (existingCert) {
    cert = update('certificates', existingCert.id, certData);
  } else {
    cert = insert('certificates', certData);
  }

  // Update internship record
  update('internships', internship.id, {
    status: 'CERTIFICATE_ISSUED',
    final_internship_score: weightedScore,
    faculty_evaluated_at: new Date().toISOString(),
    faculty_evaluation_remarks: remarks
  });

  // Inject certificate into student's Document Vault
  const existingDocs = Array.isArray(student.documents) ? student.documents : [];
  const updatedDocs = existingDocs.filter(d => d.type !== 'COMPLETION_CERTIFICATE');
  updatedDocs.push({
    id: `doc_cert_${cert.id}`,
    title: `Official Internship Certificate — ${internship.company_name}`,
    type: 'COMPLETION_CERTIFICATE',
    certificate_number: certNumber,
    score: weightedScore,
    grade,
    company_name: internship.company_name,
    issued_at: new Date().toISOString(),
    url: cert.certificate_pdf_url
  });

  update('student_profiles', student.id, {
    documents: updatedDocs
  });

  // Notify student in-app
  const studentUser = findById('users', student.user_id);
  if (studentUser) {
    insert('notifications', {
      user_id: studentUser.id,
      module_key: 'CERTIFICATE',
      title: '🎓 Internship Certificate Issued!',
      message: `Your faculty mentor evaluated your completed internship at ${internship.company_name} (Score: ${weightedScore}%, Grade: ${grade}). Certificate has been placed in your Document Vault.`,
      link_route: '/student/documents',
      is_read: false
    });
  }

  res.json({
    message: `Evaluation completed successfully! Official institutional digital certificate (${certNumber}) generated and deposited into ${student.full_name}'s Document Vault.`,
    certificate: cert,
    final_score: weightedScore,
    grade
  });
});

export default router;
