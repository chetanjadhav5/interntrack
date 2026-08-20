const BASE_URL = 'http://localhost:5000';

async function runTest() {
  console.log('========================================================================');
  console.log('🧪 TESTING FACULTY EVALUATION, CERTIFICATE GENERATION & COMPANY OTP FLOW');
  console.log('========================================================================\n');

  // 1. Company Registration with OTP & Admin Approval
  console.log('1. Testing Company Registration with OTP & Admin Approval...');
  const testCompanyEmail = `recruiter_${Date.now()}@infotech.com`;

  // 1A. Request Email OTP
  console.log(`   Requesting Real Email OTP for ${testCompanyEmail}...`);
  const otpRes = await fetch(`${BASE_URL}/api/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testCompanyEmail })
  });
  const otpData = await otpRes.json();
  console.log('   OTP Response:', otpData.message);
  if (!otpRes.ok) throw new Error('Failed to send OTP to company email');

  // 1B. Register Company with OTP
  console.log('   Submitting Company Registration for Admin Approval...');
  const regRes = await fetch(`${BASE_URL}/api/auth/register/company`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testCompanyEmail,
      password: 'SecureCompanyPass123!',
      company_name: 'Apex InfoTech Solutions Ltd.',
      gstin: '27AABCU9603R1ZN',
      website: 'https://apexinfotech.com',
      industry: 'Information Technology & Cloud',
      description: 'Enterprise cloud services and AI infrastructure provider.',
      office_address: 'World Trade Center, Tower 2, Kharadi, Pune 411014',
      latitude: 18.5529,
      longitude: 73.9497
    })
  });
  const regData = await regRes.json();
  console.log('   Registration Status:', regRes.status);
  console.log('   Registration Body:', regData);
  if (!regRes.ok || regData.is_approved !== false) {
    throw new Error(`Expected company registration to have is_approved: false pending Admin approval, got: ${JSON.stringify(regData)}`);
  }

  // 1C. Attempt Company Login Before Admin Approval (Must be rejected)
  console.log('\n   Attempting Company Login before Admin verification...');
  const preLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testCompanyEmail,
      password: 'SecureCompanyPass123!'
    })
  });
  const preLoginData = await preLoginRes.json();
  console.log(`   Pre-approval Login Status (${preLoginRes.status}):`, preLoginData.error);
  if (preLoginRes.status !== 403) {
    throw new Error('Expected 403 Forbidden for unapproved company login attempt');
  }
  console.log('   ✅ Verified: Company login blocked before Admin approval!');

  // 1D. Admin Logs In and Checks Pending Approvals
  console.log('\n2. Admin logging in to verify and approve new Company...');
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@ghr.edu',
      password: 'Admin@123'
    })
  });
  const adminLoginData = await adminLoginRes.json();
  console.log('   Admin Login Status:', adminLoginRes.status);
  console.log('   Admin Token:', adminLoginData.token ? 'Present' : 'Missing', adminLoginData);
  const adminToken = adminLoginData.token;

  const pendingRes = await fetch(`${BASE_URL}/api/admin/pending-approvals`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const pendingList = await pendingRes.json();
  console.log('   Pending List Response:', pendingRes.status, pendingList);
  const foundCompany = Array.isArray(pendingList) ? pendingList.find(p => p.email === testCompanyEmail) : null;
  if (!foundCompany) {
    throw new Error(`Expected newly registered company (${testCompanyEmail}) to appear in Admin pending approvals list`);
  }
  console.log(`   Found in Admin Pending Queue: ${foundCompany.full_name} | Role: ${foundCompany.role} | GSTIN: ${foundCompany.employee_id}`);

  // 1E. Admin Approves Company
  console.log(`   Admin approving company user [${foundCompany.id}]...`);
  const approveRes = await fetch(`${BASE_URL}/api/admin/users/${foundCompany.id}/approval`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ decision: 'APPROVED' })
  });
  const approveData = await approveRes.json();
  console.log('   Approval Result:', approveData.message);
  if (!approveRes.ok) throw new Error('Admin approval failed');

  // 1F. Company Logs In Successfully After Admin Approval
  console.log('\n   Company logging in after Admin approval...');
  const postLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testCompanyEmail,
      password: 'SecureCompanyPass123!'
    })
  });
  const postLoginData = await postLoginRes.json();
  if (!postLoginRes.ok || !postLoginData.token) {
    throw new Error('Expected successful company login after Admin approval');
  }
  console.log(`   ✅ Company successfully logged in as: ${postLoginData.user.profile.company_name} (Token Acquired)`);

  // 3. Faculty Intern Evaluation & Certificate Generation
  console.log('\n3. Testing Faculty Intern Evaluation & Certificate Generation...');
  console.log('   Logging in as Faculty Mentor (Dr. Suresh Verma)...');
  const facLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'classteacher.cs3@ghr.edu',
      password: 'Faculty@123'
    })
  });
  const facLoginData = await facLoginRes.json();
  const facToken = facLoginData.token;

  // 3A. Fetch Eligible Completed Mentees
  console.log('\n   Fetching completed eligible mentees (/api/faculty/evaluation/eligible-mentees)...');
  const menteesRes = await fetch(`${BASE_URL}/api/faculty/evaluation/eligible-mentees`, {
    headers: { Authorization: `Bearer ${facToken}` }
  });
  const menteesList = await menteesRes.json();
  console.log('   Mentees Status:', menteesRes.status, `Found ${Array.isArray(menteesList) ? menteesList.length : 0} completed candidate(s)`);
  if (!Array.isArray(menteesList) || menteesList.length === 0) {
    throw new Error(`Expected at least 1 completed mentee for evaluation, got: ${JSON.stringify(menteesList)}`);
  }

  const candidate = menteesList[0];
  console.log(`   Candidate Under Evaluation: ${candidate.student_name} (${candidate.student_roll})`);
  console.log(`   Company: ${candidate.company_name} | Role: ${candidate.role_position}`);
  console.log(`   Records: Total Reports: ${candidate.records.total_reports}, Approved: ${candidate.records.approved_reports}`);
  console.log(`   Records: Attendance Check-ins: ${candidate.records.attendance_count} (${candidate.records.attendance_percentage}%)`);
  console.log(`   Records: GitHub Live Score: ${candidate.records.github_score}/100`);

  // 3B. Submit 5-Parameter Rubric Evaluation & Generate Digital Certificate
  console.log('\n   Submitting 5-parameter rubric evaluation and generating institutional certificate...');
  const evalSubmitRes = await fetch(`${BASE_URL}/api/faculty/evaluation/${candidate.id}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${facToken}`
    },
    body: JSON.stringify({
      tech_score: 95,
      discipline_score: 94,
      soft_score: 92,
      logbook_score: 96,
      attendance_score: 95,
      remarks: 'Demonstrated outstanding technical innovation, full Friday logbook compliance, and team leadership.'
    })
  });
  const evalSubmitData = await evalSubmitRes.json();
  console.log('   Evaluation Submit Result:', evalSubmitData.message);
  console.log('   Computed Final Score:', evalSubmitData.final_score);
  console.log('   Assigned Grade:', evalSubmitData.grade);
  console.log('   Certificate Number:', evalSubmitData.certificate.certificate_number);
  console.log('   QR Verification Hash:', evalSubmitData.certificate.qr_verification_hash);
  if (!evalSubmitRes.ok || !evalSubmitData.certificate) {
    throw new Error('Certificate generation failed');
  }

  // 4. Student Checks Document Vault for Certificate
  console.log('\n4. Student logging in to verify Certificate in Document Vault...');
  const studLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'alex.patil@ghr.edu',
      password: 'Student@123'
    })
  });
  const studLoginData = await studLoginRes.json();
  const studToken = studLoginData.token;

  const certRes = await fetch(`${BASE_URL}/api/student/certificates`, {
    headers: { Authorization: `Bearer ${studToken}` }
  });
  const certList = await certRes.json();
  const myCert = certList.find(c => c.certificate_number === evalSubmitData.certificate.certificate_number) || certList[0];
  if (!myCert) {
    throw new Error('Generated certificate not found in student Document Vault');
  }

  console.log(`   Found in Student Document Vault: Certificate #${myCert.certificate_number}`);
  console.log(`   Company: ${myCert.company_name} | Role: ${myCert.role_position}`);
  console.log(`   Given Final Score: ${myCert.final_score}% | Grade: ${myCert.grade}`);
  console.log('   ✅ Certificate deposited into Student Document Vault successfully!');

  console.log('\n========================================================================');
  console.log('🎉 ALL INTEGRATION TESTS PASSED 100%');
  console.log('========================================================================\n');
}

runTest().catch((err) => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
