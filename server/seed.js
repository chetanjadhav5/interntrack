import bcrypt from 'bcryptjs';
import { setDB, saveDB } from './db.js';

export const seedDatabase = async () => {
  const salt = await bcrypt.genSalt(10);
  const studentPassword = await bcrypt.hash('Student@123', salt);
  const facultyPassword = await bcrypt.hash('Faculty@123', salt);
  const tnpPassword = await bcrypt.hash('Tnp@123', salt);
  const companyPassword = await bcrypt.hash('Company@123', salt);
  const adminPassword = await bcrypt.hash('Admin@123', salt);

  const initialData = {
    users: [
      {
        id: 'user_admin_1',
        email: 'admin@ghr.edu',
        password_hash: adminPassword,
        role: 'ADMIN',
        is_active: true,
        is_approved: true,
        created_at: new Date('2026-08-01').toISOString()
      },
      {
        id: 'user_tnp_1',
        email: 'tnp.cs@ghr.edu',
        password_hash: tnpPassword,
        role: 'TNP',
        is_active: true,
        is_approved: true,
        created_at: new Date('2026-08-01').toISOString()
      },
      {
        id: 'user_faculty_ct_1',
        email: 'classteacher.cs3@ghr.edu',
        password_hash: facultyPassword,
        role: 'FACULTY',
        is_active: true,
        is_approved: true,
        created_at: new Date('2026-08-01').toISOString()
      },
      {
        id: 'user_faculty_mentor_1',
        email: 'mentor.cs3@ghr.edu',
        password_hash: facultyPassword,
        role: 'FACULTY',
        is_active: true,
        is_approved: true,
        created_at: new Date('2026-08-01').toISOString()
      },
      {
        id: 'user_company_google',
        email: 'recruiter@google.com',
        password_hash: companyPassword,
        role: 'COMPANY',
        is_active: true,
        is_approved: true,
        created_at: new Date('2026-08-01').toISOString()
      },
      {
        id: 'user_company_microsoft',
        email: 'recruiter@microsoft.com',
        password_hash: companyPassword,
        role: 'COMPANY',
        is_active: true,
        is_approved: true,
        created_at: new Date('2026-08-01').toISOString()
      },
      {
        id: 'user_student_alex',
        email: 'alex.patil@ghr.edu',
        password_hash: studentPassword,
        role: 'STUDENT',
        is_active: true,
        is_approved: true,
        created_at: new Date('2026-08-01').toISOString()
      },
      {
        id: 'user_student_priya',
        email: 'priya.sharma@ghr.edu',
        password_hash: studentPassword,
        role: 'STUDENT',
        is_active: true,
        is_approved: true,
        created_at: new Date('2026-08-01').toISOString()
      },
      {
        id: 'user_student_rohit',
        email: 'rohit.deshmukh@ghr.edu',
        password_hash: studentPassword,
        role: 'STUDENT',
        is_active: true,
        is_approved: true,
        created_at: new Date('2026-08-01').toISOString()
      }
    ],

    student_profiles: [
      {
        id: 'stud_prof_1',
        user_id: 'user_student_alex',
        student_id: 'GHR-CS-2023-042',
        full_name: 'Alex Patil',
        department: 'Engineering',
        branch: 'Computer Science and Engineering',
        passing_year: 2026,
        gender: 'Male',
        current_cgpa: 8.85,
        current_backlogs: 0,
        skills: ['React', 'Node.js', 'Python', 'Docker', 'PostgreSQL', 'Tailwind CSS'],
        certifications: [
          { name: 'AWS Certified Cloud Practitioner', url: 'https://example.com/aws-cert.pdf', is_verified: true },
          { name: 'Google Cloud Associate Engineer', url: 'https://example.com/gcp-cert.pdf', is_verified: true }
        ],
        resume_url: 'https://example.com/resumes/alex_patil_resume.pdf',
        preferred_locations: ['Pune', 'Bengaluru', 'Mumbai'],
        is_pan_india: true,
        github_username: 'alexpatil-dev',
        github_score: 92,
        github_last_synced: new Date('2026-08-19').toISOString(),
        assigned_class_teacher_id: 'user_faculty_ct_1',
        profile_completion_percent: 100,
        verification_status: 'VERIFIED',
        verification_remarks: 'All academic credentials and cloud certifications verified.',
        application_locked: false
      },
      {
        id: 'stud_prof_2',
        user_id: 'user_student_priya',
        student_id: 'GHR-CS-2023-088',
        full_name: 'Priya Sharma',
        department: 'Engineering',
        branch: 'Computer Science and Engineering',
        passing_year: 2026,
        gender: 'Female',
        current_cgpa: 7.95,
        current_backlogs: 0,
        skills: ['Java', 'Spring Boot', 'SQL', 'Git'],
        certifications: [
          { name: 'Oracle Certified Professional Java', url: 'https://example.com/java-cert.pdf', is_verified: false }
        ],
        resume_url: 'https://example.com/resumes/priya_sharma_resume.pdf',
        preferred_locations: ['Pune', 'Hyderabad'],
        is_pan_india: false,
        github_username: 'priyasharma-code',
        github_score: 78,
        github_last_synced: new Date('2026-08-18').toISOString(),
        assigned_class_teacher_id: 'user_faculty_ct_1',
        profile_completion_percent: 90,
        verification_status: 'PENDING',
        verification_remarks: 'Awaiting class teacher verification of semester 5 grade card.',
        application_locked: false
      },
      {
        id: 'stud_prof_3',
        user_id: 'user_student_rohit',
        student_id: 'GHR-CS-2023-115',
        full_name: 'Rohit Deshmukh',
        department: 'Engineering',
        branch: 'Computer Science and Engineering',
        passing_year: 2026,
        gender: 'Male',
        current_cgpa: 8.20,
        current_backlogs: 0,
        skills: ['Python', 'Machine Learning', 'TensorFlow', 'FastAPI', 'Pandas'],
        certifications: [
          { name: 'DeepLearning.AI TensorFlow Specialization', url: 'https://example.com/dl-cert.pdf', is_verified: true }
        ],
        resume_url: 'https://example.com/resumes/rohit_deshmukh_resume.pdf',
        preferred_locations: ['Bengaluru', 'Pune', 'Noida'],
        is_pan_india: true,
        github_username: 'rohit-ml',
        github_score: 86,
        github_last_synced: new Date('2026-08-19').toISOString(),
        assigned_class_teacher_id: 'user_faculty_ct_1',
        profile_completion_percent: 100,
        verification_status: 'VERIFIED',
        verification_remarks: 'Verified by Class Teacher Dr. S. K. Verma.',
        application_locked: false
      }
    ],

    faculty_profiles: [
      {
        id: 'fac_prof_1',
        user_id: 'user_faculty_ct_1',
        employee_id: 'GHR-FAC-CS-012',
        full_name: 'Dr. Suresh Verma',
        department: 'Engineering',
        branch: 'Computer Science and Engineering',
        assigned_year: 2026,
        designation: 'CLASS_TEACHER',
        active_mentee_count: 14
      },
      {
        id: 'fac_prof_2',
        user_id: 'user_faculty_mentor_1',
        employee_id: 'GHR-FAC-CS-028',
        full_name: 'Prof. Anjali Mehta',
        department: 'Engineering',
        branch: 'Computer Science and Engineering',
        assigned_year: 2026,
        designation: 'ASSISTANT_PROFESSOR',
        active_mentee_count: 8
      }
    ],

    tnp_profiles: [
      {
        id: 'tnp_prof_1',
        user_id: 'user_tnp_1',
        employee_id: 'GHR-TNP-004',
        full_name: 'Prof. Rajesh Kulkarni (T&P Head)',
        department: 'Engineering'
      }
    ],

    company_profiles: [
      {
        id: 'comp_prof_1',
        user_id: 'user_company_google',
        company_name: 'Google India',
        gstin: '27AAACG0535P1Z8',
        website: 'https://careers.google.com',
        industry: 'Information Technology & Cloud',
        description: 'Google is a global technology leader focusing on search, cloud computing, software, and hardware.',
        office_address: 'Google Signature Towers, Sector 15, Cyber City, Gurugram / EON Free Zone, Kharadi, Pune, Maharashtra 411014',
        latitude: 18.5529,
        longitude: 73.9497,
        trust_score: 99
      },
      {
        id: 'comp_prof_2',
        user_id: 'user_company_microsoft',
        company_name: 'Microsoft India (R&D)',
        gstin: '27AABCM2818A1ZW',
        website: 'https://careers.microsoft.com',
        industry: 'Software & Cloud Infrastructure',
        description: 'Empowering every person and organization on the planet to achieve more.',
        office_address: 'Microsoft Building 3, Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103',
        latitude: 12.9279,
        longitude: 77.6821,
        trust_score: 98
      }
    ],

    placement_drives: [
      {
        id: 'drive_google_sde',
        created_by_user_id: 'user_company_google',
        title: 'Software Development Engineering (SDE) Intern',
        company_name: 'Google India',
        company_profile_id: 'comp_prof_1',
        department: 'Engineering',
        allowed_branches: ['Computer Science and Engineering', 'Information Technology', 'Artificial Intelligence & Data Science'],
        role_position: 'Software Engineering Intern',
        stipend_amount: 85000,
        stipend_type: 'MONTHLY',
        duration_months: 6,
        openings_count: 5,
        selected_count: 2,
        min_cgpa: 7.50,
        max_backlogs: 0,
        allowed_passing_years: [2026],
        gender_preference: 'ANY',
        required_skills: ['Data Structures', 'Algorithms', 'React', 'Node.js'],
        optional_skills: ['Docker', 'Kubernetes', 'Go'],
        min_experience_months: 0,
        work_location_address: 'EON Free Zone, Kharadi, Pune, Maharashtra 411014',
        latitude: 18.5529,
        longitude: 73.9497,
        deadline: new Date('2026-09-15T23:59:59').toISOString(),
        status: 'ACTIVE',
        selection_rounds: ['Applied', 'GD', 'Technical Interview', 'Selected', 'Rejected']
      },
      {
        id: 'drive_msft_cloud',
        created_by_user_id: 'user_company_microsoft',
        title: 'Cloud & AI Solutions Engineering Intern',
        company_name: 'Microsoft India (R&D)',
        company_profile_id: 'comp_prof_2',
        department: 'Engineering',
        allowed_branches: ['Computer Science and Engineering', 'Electronics & Telecommunication'],
        role_position: 'Cloud Engineering Intern',
        stipend_amount: 75000,
        stipend_type: 'MONTHLY',
        duration_months: 6,
        openings_count: 8,
        selected_count: 3,
        min_cgpa: 7.00,
        max_backlogs: 0,
        allowed_passing_years: [2026],
        gender_preference: 'ANY',
        required_skills: ['Python', 'Cloud Computing', 'SQL'],
        optional_skills: ['Azure', 'FastAPI', 'Machine Learning'],
        min_experience_months: 0,
        work_location_address: 'Microsoft Building 3, Outer Ring Road, Bellandur, Bengaluru 560103',
        latitude: 12.9279,
        longitude: 77.6821,
        deadline: new Date('2026-09-20T23:59:59').toISOString(),
        status: 'ACTIVE',
        selection_rounds: ['Applied', 'GD', 'Technical Interview', 'Selected', 'Rejected']
      },
      {
        id: 'drive_tcs_digital',
        created_by_user_id: 'user_tnp_1',
        title: 'TCS Digital Innovation Intern',
        company_name: 'Tata Consultancy Services',
        company_profile_id: null,
        department: 'Engineering',
        allowed_branches: ['Computer Science and Engineering', 'Information Technology', 'Mechanical Engineering'],
        role_position: 'Full Stack Developer Intern',
        stipend_amount: 35000,
        stipend_type: 'MONTHLY',
        duration_months: 4,
        openings_count: 15,
        selected_count: 0,
        min_cgpa: 6.50,
        max_backlogs: 0,
        allowed_passing_years: [2026],
        gender_preference: 'ANY',
        required_skills: ['Java', 'SQL', 'HTML/CSS'],
        optional_skills: ['React', 'Spring Boot'],
        min_experience_months: 0,
        work_location_address: 'TCS Sahyadri Park, Hinjewadi Phase 3, Pune, Maharashtra 411057',
        latitude: 18.5833,
        longitude: 73.6933,
        deadline: new Date('2026-09-30T23:59:59').toISOString(),
        status: 'ACTIVE',
        selection_rounds: ['Applied', 'Aptitude Test', 'Interview', 'Selected', 'Rejected']
      }
    ],

    applications: [
      {
        id: 'app_1',
        drive_id: 'drive_google_sde',
        student_id: 'stud_prof_1',
        current_stage: 'SELECTED',
        stage_events: [
          { stage: 'Applied', scheduled_at: '2026-08-05T10:00:00Z', venue_or_link: 'Portal Submission', notes: 'Application verified and screened.' },
          { stage: 'GD', scheduled_at: '2026-08-08T14:00:00Z', venue_or_link: 'Google Meet (meet.google.com/xyz-abc)', notes: 'Group discussion cleared with distinction.' },
          { stage: 'Technical Interview', scheduled_at: '2026-08-11T11:30:00Z', venue_or_link: 'Google Meet', notes: 'Technical coding rounds passed with positive feedback.' },
          { stage: 'Selected', scheduled_at: '2026-08-14T16:00:00Z', venue_or_link: 'Offer dispatched', notes: 'Official offer letter generated and sent.' }
        ],
        applied_at: new Date('2026-08-05').toISOString()
      },
      {
        id: 'app_2',
        drive_id: 'drive_msft_cloud',
        student_id: 'stud_prof_3',
        current_stage: 'INTERVIEW',
        stage_events: [
          { stage: 'Applied', scheduled_at: '2026-08-06T09:00:00Z', venue_or_link: 'Portal Submission', notes: 'Profile short-listed.' },
          { stage: 'GD', scheduled_at: '2026-08-10T15:00:00Z', venue_or_link: 'Microsoft Teams', notes: 'Cleared Group Discussion round.' },
          { stage: 'Technical Interview', scheduled_at: '2026-08-22T10:30:00Z', venue_or_link: 'Microsoft Teams (teams.microsoft.com/r/123)', notes: 'Upcoming 2nd round system design interview.' }
        ],
        applied_at: new Date('2026-08-06').toISOString()
      }
    ],

    internships: [
      {
        id: 'internship_alex_google',
        student_id: 'stud_prof_1',
        drive_id: 'drive_google_sde',
        mentor_faculty_id: 'user_faculty_mentor_1',
        placement_type: 'COLLEGE_PLACED',
        company_name: 'Google India',
        gstin: '27AAACG0535P1Z8',
        role_position: 'Software Engineering Intern',
        office_address: 'EON Free Zone, Kharadi, Pune, Maharashtra 411014',
        latitude: 18.5529,
        longitude: 73.9497,
        geofence_radius: 300,
        first_checkin_photo_required: false,
        first_checkin_photo_url: null,
        first_checkin_verified: true,
        offer_letter_url: 'https://example.com/offers/google_offer_alex.pdf',
        start_date: '2026-08-01',
        end_date: '2026-11-30',
        status: 'WEEKLY_REVIEW_ONGOING',
        tnp_verified_by: 'user_tnp_1',
        tnp_verified_at: new Date('2026-08-02').toISOString(),
        tnp_remarks: 'Verified Google India offer letter and assigned mentor Prof. Anjali Mehta.',
        final_internship_score: 94.5
      }
    ],

    attendance_records: [
      {
        id: 'att_1',
        internship_id: 'internship_alex_google',
        student_id: 'stud_prof_1',
        checkin_time: new Date('2026-08-18T09:12:00').toISOString(),
        latitude: 18.5531,
        longitude: 73.9495,
        distance_meters: 32,
        is_inside_geofence: true,
        photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        verification_status: 'VERIFIED',
        date: '2026-08-18'
      },
      {
        id: 'att_2',
        internship_id: 'internship_alex_google',
        student_id: 'stud_prof_1',
        checkin_time: new Date('2026-08-19T09:05:00').toISOString(),
        latitude: 18.5530,
        longitude: 73.9496,
        distance_meters: 18,
        is_inside_geofence: true,
        photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        verification_status: 'VERIFIED',
        date: '2026-08-19'
      },
      {
        id: 'att_3',
        internship_id: 'internship_alex_google',
        student_id: 'stud_prof_1',
        checkin_time: new Date('2026-08-20T08:58:00').toISOString(),
        latitude: 18.5529,
        longitude: 73.9497,
        distance_meters: 5,
        is_inside_geofence: true,
        photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        verification_status: 'VERIFIED',
        date: '2026-08-20'
      }
    ],

    weekly_reports: [
      {
        id: 'rep_1',
        internship_id: 'internship_alex_google',
        student_id: 'stud_prof_1',
        week_number: 1,
        scheduled_saturday_date: '2026-08-08',
        submission_date: new Date('2026-08-08T18:30:00').toISOString(),
        work_summary: 'Completed developer environment onboarding, set up Dockerized microservice architecture, and resolved 3 initial backlog tickets in the payments service repository.',
        work_proof_urls: [
          'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600',
          'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600'
        ],
        github_score_snapshot: 94,
        status: 'APPROVED',
        faculty_score: 95.0,
        faculty_feedback: 'Excellent work summary and consistent commits in GitHub repo. Keep up the high standard.',
        evaluated_by: 'user_faculty_mentor_1',
        evaluated_at: new Date('2026-08-10').toISOString()
      },
      {
        id: 'rep_2',
        internship_id: 'internship_alex_google',
        student_id: 'stud_prof_1',
        week_number: 2,
        scheduled_saturday_date: '2026-08-15',
        submission_date: new Date('2026-08-15T19:45:00').toISOString(),
        work_summary: 'Engineered REST API endpoints for user webhook notifications using Express and Redis pub/sub. Added unit tests with Jest achieving 88% coverage.',
        work_proof_urls: [
          'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600'
        ],
        github_score_snapshot: 91,
        status: 'APPROVED',
        faculty_score: 92.0,
        faculty_feedback: 'High quality implementation of pub/sub pattern. Approved.',
        evaluated_by: 'user_faculty_mentor_1',
        evaluated_at: new Date('2026-08-17').toISOString()
      },
      {
        id: 'rep_3',
        internship_id: 'internship_alex_google',
        student_id: 'stud_prof_1',
        week_number: 3,
        scheduled_saturday_date: '2026-08-22',
        submission_date: null,
        work_summary: '',
        work_proof_urls: [],
        github_score_snapshot: null,
        status: 'PENDING',
        faculty_score: null,
        faculty_feedback: null,
        evaluated_by: null,
        evaluated_at: null
      }
    ],

    offer_letters: [
      {
        id: 'offer_1',
        student_id: 'stud_prof_1',
        drive_id: 'drive_google_sde',
        company_id: 'comp_prof_1',
        company_name: 'Google India',
        role_position: 'Software Engineering Intern',
        stipend_amount: 85000,
        offer_letter_url: 'https://example.com/offers/google_offer_alex.pdf',
        offer_type: 'INTERNSHIP',
        status: 'ACCEPTED',
        sent_date: new Date('2026-08-14').toISOString(),
        student_response_date: new Date('2026-08-15').toISOString()
      },
      {
        id: 'offer_2',
        student_id: 'stud_prof_1',
        drive_id: 'drive_google_sde',
        company_id: 'comp_prof_1',
        company_name: 'Google India',
        role_position: 'Software Engineer (Full-Time PPO)',
        stipend_amount: 1800000, // 18 LPA CTC
        offer_letter_url: 'https://example.com/offers/google_ppo_alex.pdf',
        offer_type: 'PPO',
        status: 'PENDING',
        sent_date: new Date('2026-08-19').toISOString(),
        student_response_date: null
      }
    ],

    certificates: [
      {
        id: 'cert_1',
        certificate_number: 'GHR-IMS-2026-00429',
        internship_id: 'internship_alex_google',
        student_id: 'stud_prof_1',
        issued_by_faculty_id: 'user_faculty_mentor_1',
        final_score: 94.5,
        issue_date: '2026-08-20',
        qr_verification_hash: 'SHA256:4f8e9a2b1c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f',
        certificate_pdf_url: 'https://example.com/certificates/alex_google_certificate.pdf'
      }
    ],

    notifications: [
      {
        id: 'notif_1',
        user_id: 'user_student_alex',
        module_key: 'OFFER',
        title: 'New PPO Received from Google India!',
        message: 'Congratulations! Google India has extended a Pre-Placement Offer (PPO). Review and accept in the PPO & Offers Hub.',
        link_route: '/student/offers-ppo',
        is_read: false,
        created_at: new Date('2026-08-19T10:00:00').toISOString()
      },
      {
        id: 'notif_2',
        user_id: 'user_faculty_ct_1',
        module_key: 'PROFILE',
        title: 'Profile Verification Reminder',
        message: 'T&P Department reminded you to verify pending student profiles for CS 3rd Year.',
        link_route: '/faculty/profile-verification',
        is_read: false,
        created_at: new Date('2026-08-20T08:30:00').toISOString()
      },
      {
        id: 'notif_3',
        user_id: 'user_student_priya',
        module_key: 'PROFILE',
        title: 'Complete Your Profile (90%)',
        message: 'Your profile is 90% complete. Please upload verified certificate proof to become eligible for campus drives.',
        link_route: '/student/profile',
        is_read: false,
        created_at: new Date('2026-08-20T09:00:00').toISOString()
      }
    ],

    support_tickets: [
      {
        id: 'ticket_1',
        user_id: 'user_student_rohit',
        subject: 'Query regarding Microsoft Interview Schedule',
        category: 'INTERNSHIP_DRIVE',
        message: 'Will the interview link be sent via email or updated directly in the portal?',
        status: 'RESOLVED',
        response: 'The Teams link is updated directly in your My Applications timeline.',
        created_at: new Date('2026-08-18').toISOString()
      }
    ]
  };

  setDB(initialData);
  console.log('Database seeded successfully with GHR Inter-Track demo dataset.');
};
