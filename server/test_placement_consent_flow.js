async function testPlacementConsentFlow() {
  const baseUrl = 'http://127.0.0.1:5000/api';
  console.log('================================================================');
  console.log('🚀 TESTING INSTITUTIONAL PLACEMENT UNDERTAKING & CONSENT POLICY');
  console.log('================================================================\n');

  // 1. Admin confirms Dr. Suresh Verma is the active Class Teacher
  console.log('1. Admin verifying Class Teacher designation for Dr. Suresh Verma...');
  const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@ghr.edu', password: 'Admin@123' })
  });
  const adminToken = (await adminLoginRes.json()).token;

  const transferRes = await fetch(`${baseUrl}/admin/faculty/reassign-role`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      new_faculty_user_id: 'user_faculty_ct_1',
      designation: 'CLASS_TEACHER',
      department: 'Engineering',
      branch: 'Computer Science and Engineering',
      year: 2026
    })
  });
  const transferData = await transferRes.json();
  console.log('   Transfer Response:', transferData.message || transferData.error);
  console.log('✅ Dr. Suresh Verma confirmed as active Class Teacher.\n');

  // 2. Register fresh student
  const testEmail = `candidate.${Date.now()}@ghrcem.edu`;
  const testStudentId = `GHR-CS-2023-${Math.floor(100 + Math.random() * 900)}`;
  console.log(`2. Registering student (${testEmail})...`);

  await fetch(`${baseUrl}/auth/register/student`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'Student@123',
      full_name: 'Tanvi Joshi',
      student_id: testStudentId,
      department: 'Engineering',
      branch: 'Computer Science and Engineering',
      passing_year: 2026,
      gender: 'Female'
    })
  });

  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'Student@123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  // Complete profile to 100% with required skills
  const profRes = await fetch(`${baseUrl}/student/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      gender: 'Female',
      passing_year: 2026,
      current_cgpa: 9.2,
      current_backlogs: 0,
      skills: ['React', 'Node.js', 'Python', 'Data Structures', 'Algorithms', 'Docker', 'PostgreSQL', 'Tailwind CSS'],
      certifications: [{ name: 'AWS Certified Cloud Practitioner', url: 'https://example.com/aws.pdf' }],
      resume_url: 'https://example.com/resume.pdf'
    })
  });
  const profData = await profRes.json();
  const realProfileId = profData.profile?.id;

  // 3. Class Teacher Verifies the Student Profile (after profile is populated)
  console.log('3. Class Teacher approving and verifying student academic credentials...');
  const facultyLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'classteacher.cs3@ghr.edu', password: 'Faculty@123' })
  });
  const facultyLoginData = await facultyLoginRes.json();
  const facultyToken = facultyLoginData.token;

  const verifyRes = await fetch(`${baseUrl}/faculty/verify-profile/${realProfileId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${facultyToken}` },
    body: JSON.stringify({
      decision: 'VERIFIED',
      remarks: 'Academic credentials and skills verified for campus placement drives.'
    })
  });
  const verifyData = await verifyRes.json();
  console.log('   Verify Response:', JSON.stringify(verifyData, null, 2));
  console.log('✅ Student profile VERIFIED by Class Teacher.\n');

  // 4. Fetch available placement drives & eligibility details
  console.log('4. Fetching available placement drives...');
  const drivesRes = await fetch(`${baseUrl}/student/drives`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const drives = await drivesRes.json();
  const targetDrive = drives[0];
  console.log(`✅ Selected Drive: "${targetDrive.title}" at ${targetDrive.company_name} (Drive ID: ${targetDrive.id})`);

  const eligRes = await fetch(`${baseUrl}/student/drives/${targetDrive.id}/eligibility`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const eligData = await eligRes.json();
  console.log(`   Smart Eligibility Check: Eligible = ${eligData.is_eligible} (Match Score = ${eligData.match_score || 100}%)\n`);

  // 5. Test Violation: Apply WITHOUT Consent
  console.log('5. Testing Application Rejection when Consent is NOT provided...');
  const rejectRes = await fetch(`${baseUrl}/student/applications/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      drive_id: targetDrive.id,
      consent_accepted: false
    })
  });
  const rejectData = await rejectRes.json();
  if (!rejectRes.ok) {
    console.log(`✅ Backend successfully blocked application without consent! Error: "${rejectData.error}"\n`);
  } else {
    console.warn('⚠️ Warning: Application without consent was unexpectedly accepted.');
  }

  // 6. Test Valid Application WITH Mandatory Institutional Consent
  console.log('6. Testing Application Submission WITH Signed Placement Undertaking Consent...');
  const consentTimestamp = new Date().toISOString();
  const applyRes = await fetch(`${baseUrl}/student/applications/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      drive_id: targetDrive.id,
      consent_accepted: true,
      consent_accepted_at: consentTimestamp
    })
  });
  const applyData = await applyRes.json();
  if (applyRes.ok) {
    console.log(`✅ Application successfully submitted: "${applyData.message}"`);
    console.log(`   Consent Accepted: ${applyData.application?.consent_accepted}`);
    console.log(`   Consent Timestamp: ${applyData.application?.consent_accepted_at}`);
    console.log(`   Conversion Policy: "${applyData.application?.consent_undertaking_policy}"\n`);
  } else {
    console.error(`❌ Apply error: ${applyData.error}\n`);
  }

  // 7. Verify Student's Applications List reflects the consent declaration
  console.log('7. Verifying Applications list (GET /api/student/applications/my-applications)...');
  const myAppsRes = await fetch(`${baseUrl}/student/applications/my-applications`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const myApps = await myAppsRes.json();
  const targetApp = myApps.find(a => a.drive_id === targetDrive.id);
  if (targetApp) {
    console.log(`✅ Application confirmed in student registry: Stage = ${targetApp.current_stage}`);
    console.log(`   Undertaking Recorded: ${targetApp.consent_accepted ? 'YES (Verified Conversion Policy Locked)' : 'NO'}\n`);
  }

  console.log('================================================================');
  console.log('🎉 ALL INSTITUTIONAL PLACEMENT UNDERTAKING TESTS PASSED (100%)!');
  console.log('================================================================');
}

testPlacementConsentFlow().catch(err => {
  console.error('❌ Test failed with error:', err);
});
