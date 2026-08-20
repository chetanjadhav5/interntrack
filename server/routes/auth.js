import express from 'express';
import bcrypt from 'bcryptjs';
import { findOne, find, findById, insert, update, getDB } from '../db.js';
import { generateToken, authenticate } from '../middleware/auth.js';
import { sendOtpEmail } from '../services/emailService.js';

const router = express.Router();

// Real in-memory OTP store with expiration timestamp
const otpStore = new Map();

// Send Real OTP via Gmail SMTP
router.post('/send-otp', async (req, res) => {
  const { email, context } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  // Generate real random 6-digit numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

  // Store in memory
  otpStore.set(email.trim().toLowerCase(), { otp, expiresAt });

  try {
    // Send real email via Gmail SMTP
    await sendOtpEmail(email.trim(), otp, context || 'Portal Account Verification');
    res.json({
      message: `Verification OTP has been sent to ${email}. Please check your inbox or spam folder.`,
      email
    });
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    // If SMTP fails, return error
    res.status(500).json({
      error: `Failed to send email verification OTP: ${error.message}`
    });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Both email and 6-digit OTP are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedOtp = otp.toString().trim();
  const stored = otpStore.get(normalizedEmail);

  if (!stored) {
    return res.status(400).json({ error: 'No OTP requested for this email address or it has expired.' });
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(normalizedEmail);
    return res.status(400).json({ error: 'This OTP has expired. Please request a new code.' });
  }

  if (stored.otp !== normalizedOtp) {
    return res.status(400).json({ error: 'Invalid verification code. Please enter the exact 6-digit OTP sent to your email.' });
  }

  // OTP verified successfully - clear from store
  otpStore.delete(normalizedEmail);
  return res.json({ verified: true, message: 'Email address successfully verified!' });
});

// Student Registration
router.post('/register/student', async (req, res) => {
  try {
    const { email, password, full_name, student_id, department, branch, passing_year, gender } = req.body;

    if (!email || !password || !full_name || !student_id || !department || !branch || !passing_year || !gender) {
      return res.status(400).json({ error: 'All fields are mandatory for student registration' });
    }

    const existingUser = findOne('users', { email });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const existingStudentId = findOne('student_profiles', { student_id });
    if (existingStudentId) {
      return res.status(400).json({ error: 'This Student ID is already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = insert('users', {
      email,
      password_hash,
      role: 'STUDENT',
      is_active: true,
      is_approved: true // Students are active on email verification
    });

    const studentProfile = insert('student_profiles', {
      user_id: user.id,
      student_id,
      full_name,
      department,
      branch,
      passing_year: parseInt(passing_year, 10),
      gender,
      current_cgpa: 0.0,
      current_backlogs: 0,
      skills: [],
      certifications: [],
      resume_url: null,
      preferred_locations: ['Pan India'],
      is_pan_india: true,
      github_username: null,
      github_score: 0,
      assigned_class_teacher_id: null,
      profile_completion_percent: 45, // Basic details completed
      verification_status: 'PENDING',
      verification_remarks: 'Profile pending completion and class teacher verification',
      application_locked: false
    });

    // Create a welcoming notification
    insert('notifications', {
      user_id: user.id,
      module_key: 'PROFILE',
      title: 'Welcome to Internship Connect Pro!',
      message: 'Please complete your profile to 100% and submit for verification to unlock internship applications.',
      link_route: '/student/profile',
      is_read: false
    });

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, role: user.role, profile: studentProfile }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to create student account' });
  }
});

// Faculty Registration
router.post('/register/faculty', async (req, res) => {
  try {
    const { email, password, full_name, employee_id, department, branch, year, designation } = req.body;

    if (!email || !password || !full_name || !employee_id || !department || !branch || !year || !designation) {
      return res.status(400).json({ error: 'All fields are mandatory for faculty registration' });
    }

    const existingUser = findOne('users', { email });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = insert('users', {
      email,
      password_hash,
      role: 'FACULTY',
      is_active: true,
      is_approved: false // Requires Admin approval
    });

    const facultyProfile = insert('faculty_profiles', {
      user_id: user.id,
      employee_id,
      full_name,
      department,
      branch,
      assigned_year: parseInt(year, 10),
      designation,
      active_mentee_count: 0
    });

    res.status(201).json({
      message: 'Faculty registration submitted successfully. Your account is pending Admin approval before login.',
      is_approved: false
    });
  } catch (err) {
    console.error('Faculty registration error:', err);
    res.status(500).json({ error: 'Failed to register faculty' });
  }
});

// T&P Registration
router.post('/register/tnp', async (req, res) => {
  try {
    const { email, password, full_name, employee_id, department } = req.body;

    if (!email || !password || !full_name || !employee_id || !department) {
      return res.status(400).json({ error: 'All fields are mandatory for T&P registration' });
    }

    const existingUser = findOne('users', { email });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = insert('users', {
      email,
      password_hash,
      role: 'TNP',
      is_active: true,
      is_approved: false // Requires Admin approval
    });

    insert('tnp_profiles', {
      user_id: user.id,
      employee_id,
      full_name,
      department
    });

    res.status(201).json({
      message: 'T&P registration submitted successfully. Your account is pending Admin approval before login.',
      is_approved: false
    });
  } catch (err) {
    console.error('T&P registration error:', err);
    res.status(500).json({ error: 'Failed to register T&P coordinator' });
  }
});

// Company Registration (with OTP Verification and Admin Approval)
router.post('/register/company', async (req, res) => {
  try {
    const { email, password, company_name, gstin, website, industry, description, office_address, latitude, longitude, otp } = req.body;

    if (!email || !password || !company_name || !gstin) {
      return res.status(400).json({ error: 'Email, password, company name, and GSTIN are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (otp) {
      const stored = otpStore.get(normalizedEmail);
      if (!stored) {
        return res.status(400).json({ error: 'No OTP requested for this corporate email address or it has expired.' });
      }
      if (Date.now() > stored.expiresAt) {
        otpStore.delete(normalizedEmail);
        return res.status(400).json({ error: 'Verification OTP has expired. Please request a new code.' });
      }
      if (stored.otp !== otp.toString().trim()) {
        return res.status(400).json({ error: 'Invalid verification code. Please enter the exact 6-digit OTP sent to your email.' });
      }
      otpStore.delete(normalizedEmail);
    }

    const existingUser = findOne('users', { email });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = insert('users', {
      email,
      password_hash,
      role: 'COMPANY',
      is_active: true,
      is_approved: false // Requires Admin approval
    });

    const companyProfile = insert('company_profiles', {
      user_id: user.id,
      company_name,
      gstin,
      website: website || '',
      industry: industry || 'Technology',
      description: description || '',
      office_address: office_address || '',
      latitude: latitude ? parseFloat(latitude) : 18.5529,
      longitude: longitude ? parseFloat(longitude) : 73.9497,
      trust_score: 90,
      is_approved: false
    });

    // Notify Institutional Admin
    const adminUsers = find('users', { role: 'ADMIN' }) || [];
    adminUsers.forEach(adm => {
      insert('notifications', {
        user_id: adm.id,
        module_key: 'ADMIN',
        title: 'New Company Registration Pending Approval',
        message: `${company_name} (GSTIN: ${gstin}) has registered and requires institutional Admin verification.`,
        link_route: '/admin/approvals',
        is_read: false
      });
    });

    res.status(201).json({
      message: 'Company registration submitted successfully! Your account details and corporate GSTIN have been sent to Institutional Admin for verification. You will be able to log in once approved.',
      is_approved: false
    });
  } catch (err) {
    console.error('Company registration error:', err);
    res.status(500).json({ error: 'Failed to register company' });
  }
});

// Universal Login Endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = findOne('users', { email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'This account has been deactivated. Contact Admin.' });
    }

    if ((user.role === 'FACULTY' || user.role === 'TNP' || user.role === 'COMPANY') && !user.is_approved) {
      return res.status(403).json({
        error: user.role === 'COMPANY'
          ? 'Your company account is pending institutional Admin approval. Please wait for verification.'
          : 'Your account is pending verification by the Administrator. Please check back shortly.'
      });
    }

    // Fetch related profile
    let profile = null;
    if (user.role === 'STUDENT') {
      profile = findOne('student_profiles', { user_id: user.id });
    } else if (user.role === 'FACULTY') {
      profile = findOne('faculty_profiles', { user_id: user.id });
    } else if (user.role === 'TNP') {
      profile = findOne('tnp_profiles', { user_id: user.id });
    } else if (user.role === 'COMPANY') {
      profile = findOne('company_profiles', { user_id: user.id });
    } else if (user.role === 'ADMIN') {
      profile = { full_name: 'System Administrator (HOD)', department: 'All' };
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        is_approved: user.is_approved,
        profile
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login service encountered an unexpected error' });
  }
});

// Current User Session
router.get('/me', authenticate, (req, res) => {
  let profile = null;
  const user = req.user;
  if (user.role === 'STUDENT') {
    profile = findOne('student_profiles', { user_id: user.id });
  } else if (user.role === 'FACULTY') {
    profile = findOne('faculty_profiles', { user_id: user.id });
  } else if (user.role === 'TNP') {
    profile = findOne('tnp_profiles', { user_id: user.id });
  } else if (user.role === 'COMPANY') {
    profile = findOne('company_profiles', { user_id: user.id });
  } else if (user.role === 'ADMIN') {
    profile = { full_name: 'System Administrator (HOD)', department: 'All' };
  }

  res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    is_approved: user.is_approved,
    profile
  });
});

export default router;
