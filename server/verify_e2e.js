const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5000';

async function request(method, path, body = null, token = null) {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING END-TO-END SUITE FOR RAISAKSHYA');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    process.stdout.write(`• ${name}... `);
    try {
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
      failed++;
    }
  }

  // 1. Health Check
  await test('Server Health Check', async () => {
    const res = await request('GET', '/api/health');
    if (res.status !== 200 || res.data.status !== 'HEALTHY') {
      throw new Error(`Expected status HEALTHY, got ${JSON.stringify(res.data)}`);
    }
  });

  // 2. Student Login & Profile
  let studentToken = null;
  await test('Student Login (Alex Patil)', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'alex.patil@ghr.edu',
      password: 'Student@123',
      role: 'STUDENT'
    });
    if (res.status !== 200 || !res.data.token) {
      throw new Error(`Login failed: ${JSON.stringify(res.data)}`);
    }
    studentToken = res.data.token;
  });

  await test('Student Profile & Preferred Locations Update', async () => {
    const res = await request('PUT', '/api/student/preferred-location', {
      preferred_locations: ['Pune', 'Bengaluru'],
      is_pan_india: true
    }, studentToken);
    if (res.status !== 200) throw new Error(`Preferred locations failed: ${res.status}`);
  });

  // 3. Smart Eligibility Check
  await test('Smart Eligibility Evaluation for Drives', async () => {
    const drivesRes = await request('GET', '/api/student/drives', null, studentToken);
    if (drivesRes.status !== 200 || drivesRes.data.length === 0) {
      throw new Error('No placement drives found');
    }
    const firstDriveId = drivesRes.data[0].id;
    const eligRes = await request('GET', `/api/student/drives/${firstDriveId}/eligibility`, null, studentToken);
    if (eligRes.status !== 200 || !eligRes.data.breakdown) {
      throw new Error('Eligibility breakdown missing');
    }
  });

  // 4. Geofenced Daily Attendance Check-In (Haversine 300m rule)
  await test('Geofenced Attendance Check-In & Single-Day Constraint', async () => {
    const res = await request('POST', '/api/student/attendance/check-in', {
      latitude: 18.55291,
      longitude: 73.94971,
      photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    }, studentToken);
    if (res.status === 200 && res.data.record) {
      // Checked in
    } else if (res.status === 400 && res.data.error.includes('already checked in')) {
      // Verified single checkin per day rule
    } else {
      throw new Error(`Check-in unexpected response: ${JSON.stringify(res.data)}`);
    }
  });

  // 5. GitHub Scoring Sync
  await test('Student GitHub Connect & Score Generator', async () => {
    const res = await request('POST', '/api/student/github/connect', {
      github_username: 'alexpatil-dev'
    }, studentToken);
    if (res.status !== 200 || !res.data.github_score) {
      throw new Error(`GitHub sync failed: ${JSON.stringify(res.data)}`);
    }
  });

  // 6. Friday Weekly Report Submission
  await test('Friday Weekly Report Submission', async () => {
    const res = await request('POST', '/api/student/weekly-reports/submit', {
      week_number: 1,
      work_summary: 'Configured Dockerized microservices and implemented automated CI testing pipeline.',
      work_proof_urls: ['https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400']
    }, studentToken);
    if (res.status !== 200 && res.status !== 201) {
      throw new Error(`Report submission failed: ${JSON.stringify(res.data)}`);
    }
  });

  // 7. Faculty Login & Weekly Report Evaluation
  let facultyToken = null;
  await test('Class Teacher / Faculty Login (Dr. Suresh Verma)', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'classteacher.cs3@ghr.edu',
      password: 'Faculty@123',
      role: 'FACULTY'
    });
    if (res.status !== 200 || !res.data.token) {
      throw new Error(`Faculty login failed: ${JSON.stringify(res.data)}`);
    }
    facultyToken = res.data.token;
  });

  await test('Faculty Profile Verification & Report Evaluation', async () => {
    const repsRes = await request('GET', '/api/faculty/weekly-reports', null, facultyToken);
    if (repsRes.status !== 200) throw new Error('Failed to fetch faculty reports');
    const firstRep = repsRes.data.reports.all[0];
    if (firstRep) {
      const evalRes = await request('POST', `/api/faculty/reports/${firstRep.id}/evaluate`, {
        decision: 'APPROVED',
        score: 95,
        feedback: 'Outstanding technical implementation and code quality.'
      }, facultyToken);
      if (evalRes.status !== 200) throw new Error('Failed to approve report');
    }
  });

  // 8. T&P Login & Department Directory Progress
  let tnpToken = null;
  await test('T&P Head Login (Prof. Rajesh Kulkarni)', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'tnp.cs@ghr.edu',
      password: 'Tnp@123',
      role: 'TNP'
    });
    if (res.status !== 200 || !res.data.token) {
      throw new Error(`T&P login failed: ${JSON.stringify(res.data)}`);
    }
    tnpToken = res.data.token;
  });

  await test('T&P Student 8-Milestone Progress Calculation', async () => {
    const studsRes = await request('GET', '/api/tnp/students', null, tnpToken);
    if (studsRes.status !== 200 || studsRes.data.length === 0) throw new Error('No students found in T&P');
    const firstStud = studsRes.data[0];
    const progRes = await request('GET', `/api/tnp/students/${firstStud.id}/progress`, null, tnpToken);
    if (progRes.status !== 200 || !progRes.data.milestones || progRes.data.milestones.length !== 8) {
      throw new Error('8-stage milestone progress calculation mismatch');
    }
  });

  // 9. Company Login & Bulk Offer Matcher
  let companyToken = null;
  await test('Company Recruiter Login (Google India)', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'recruiter@google.com',
      password: 'Company@123',
      role: 'COMPANY'
    });
    if (res.status !== 200 || !res.data.token) {
      throw new Error(`Company login failed: ${JSON.stringify(res.data)}`);
    }
    companyToken = res.data.token;
  });

  await test('Company Bulk Offer Matcher Preview & Dispatch', async () => {
    const previewRes = await request('POST', '/api/company/offers/bulk-preview', {
      uploaded_files: [
        { filename: 'GHR-CS-2023-042_offer.pdf', url: 'https://example.com/alex.pdf' },
        { filename: 'unmatched_file.pdf', url: 'https://example.com/unknown.pdf' }
      ]
    }, companyToken);
    if (previewRes.status !== 200 || previewRes.data.matched_count !== 1) {
      throw new Error(`Expected 1 matched offer, got ${previewRes.data?.matched_count}`);
    }
  });

  // 10. Super Admin Login & Atomic Class Teacher Reassignment
  let adminToken = null;
  await test('Super Admin Login', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'admin@ghr.edu',
      password: 'Admin@123',
      role: 'ADMIN'
    });
    if (res.status !== 200 || !res.data.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(res.data)}`);
    }
    adminToken = res.data.token;
  });

  await test('Atomic Class Teacher Role Transfer Execution', async () => {
    const reassignRes = await request('POST', '/api/admin/faculty/reassign-role', {
      faculty_id: 'user_faculty_ct_1',
      new_role: 'CLASS_TEACHER',
      department: 'Engineering',
      branch: 'Computer Science and Engineering',
      assigned_year: '3rd Year (2026)'
    }, adminToken);
    if (reassignRes.status !== 200) {
      throw new Error(`Role reassignment failed: ${JSON.stringify(reassignRes.data)}`);
    }
  });

  console.log('\n====================================================');
  console.log(`🎉 TEST RUN COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
});
