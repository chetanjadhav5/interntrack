const BASE_URL = 'http://localhost:5000';

async function testTnpDriveApplicantsAndEvents() {
  console.log('========================================================================');
  console.log('🧪 TESTING T&P DRIVE APPLICANTS PIPELINE & EVENT PERMISSIONS');
  console.log('========================================================================\n');

  // 1. Log in as T&P Head
  console.log('1. Logging in as T&P Head (Prof. Rajesh Kulkarni)...');
  const tnpLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'tnp.cs@ghr.edu',
      password: 'Tnp@123'
    })
  });
  const tnpData = await tnpLoginRes.json();
  const tnpToken = tnpData.token;
  console.log('   T&P Token acquired for user:', tnpData.user?.email);

  // 2. Fetch all drives visible to T&P
  console.log('\n2. Fetching drives visible to T&P (/api/tnp/drives)...');
  const drivesRes = await fetch(`${BASE_URL}/api/tnp/drives`, {
    headers: { Authorization: `Bearer ${tnpToken}` }
  });
  const drives = await drivesRes.json();
  console.log(`   Found ${drives.length} drives.`);

  const tnpDrive = drives.find(d => d.is_my_drive || d.created_by_user_id === tnpData.user.id) || drives[0];
  const companyDrive = drives.find(d => !d.is_my_drive && d.created_by_user_id !== tnpData.user.id) || drives[1];

  console.log(`   T&P Posted Drive: "${tnpDrive?.title}" (ID: ${tnpDrive?.id})`);
  console.log(`   Corporate Company Drive: "${companyDrive?.title}" (ID: ${companyDrive?.id})`);

  // 3. Fetch applicants for drive via /api/tnp/drives/:id/applicants
  console.log('\n3. Testing GET /api/tnp/drives/:id/applicants...');
  const appRes = await fetch(`${BASE_URL}/api/tnp/drives/${tnpDrive.id}/applicants`, {
    headers: { Authorization: `Bearer ${tnpToken}` }
  });
  const appData = await appRes.json();
  console.log('   Applicants endpoint status:', appRes.status);
  console.log('   Total applicants returned:', appData.applicants?.all?.length);
  console.log('   Applied:', appData.applicants?.applied?.length);
  console.log('   Interview:', appData.applicants?.interview?.length);
  console.log('   Selected:', appData.applicants?.selected?.length);

  if (appRes.status !== 200 || !appData.applicants) {
    throw new Error('Failed to fetch applicants for T&P drive');
  }
  console.log('   ✅ T&P Candidate Pipeline verified successfully with all student records!');

  // Ensure there is at least 1 application for event testing
  let targetDriveId = tnpDrive.id;
  if (appData.applicants.all.length === 0) {
    // If no applicants on this drive, check company drive
    const compAppRes = await fetch(`${BASE_URL}/api/tnp/drives/${companyDrive.id}/applicants`, {
      headers: { Authorization: `Bearer ${tnpToken}` }
    });
    const compAppData = await compAppRes.json();
    console.log(`   Company drive has ${compAppData.applicants?.all?.length} applicant(s).`);
  }

  // 4. Test Event Posting on Corporate Drive (SHOULD BE REJECTED with 403)
  console.log('\n4. Testing Event Broadcast by T&P on a Corporate Company Drive (Should be Forbidden)...');
  const forbiddenEventRes = await fetch(`${BASE_URL}/api/tnp/drives/${companyDrive.id}/broadcast-event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tnpToken}`
    },
    body: JSON.stringify({
      target_stage: 'ALL',
      event_title: 'T&P Unauthorized Event',
      scheduled_at: '2026-09-01T10:00',
      venue_or_link: 'Campus Auditorium'
    })
  });
  const forbiddenData = await forbiddenEventRes.json();
  console.log('   Forbidden Check Status:', forbiddenEventRes.status);
  console.log('   Forbidden Error Message:', forbiddenData.error);

  if (forbiddenEventRes.status === 403) {
    console.log('   ✅ Verified: T&P is properly restricted from posting events on corporate company drives!');
  } else {
    throw new Error(`Expected 403 Forbidden but got ${forbiddenEventRes.status}`);
  }

  // 5. Test Event Posting on T&P's Own Drive
  // T&P posts a new placement drive
  console.log('\n5. T&P posting a new placement drive and testing applicant pipeline...');
  const newDriveRes = await fetch(`${BASE_URL}/api/tnp/drives`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tnpToken}`
    },
    body: JSON.stringify({
      title: 'T&P Campus Innovation Drive 2026',
      company_name: 'GHR Incubation & Tech Cell',
      role_position: 'Junior Software Engineer Intern',
      stipend_amount: 45000,
      duration_months: 6,
      openings_count: 10,
      min_cgpa: 6.0,
      max_backlogs: 2,
      allowed_branches: ['Computer Science and Engineering', 'Information Technology'],
      work_location_address: 'GHR Academic Block A, Pune',
      deadline: '2026-11-30T23:59',
      status: 'ACTIVE'
    })
  });
  const newDriveData = await newDriveRes.json();
  const createdDrive = newDriveData.drive;
  console.log('   New Drive Created Status:', newDriveRes.status, createdDrive.id);

  // Student logs in and applies to the newly created T&P drive
  const studentLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'rohit.deshmukh@ghr.edu',
      password: 'Student@123'
    })
  });
  const studentToken = (await studentLoginRes.json()).token;

  const applyRes = await fetch(`${BASE_URL}/api/student/applications/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`
    },
    body: JSON.stringify({ drive_id: createdDrive.id })
  });
  const applyData = await applyRes.json();
  console.log('   Student Apply Status:', applyRes.status, applyData.message || applyData.error);

  // Verify applicants pipeline on new drive
  const verifyPipelineRes = await fetch(`${BASE_URL}/api/tnp/drives/${createdDrive.id}/applicants`, {
    headers: { Authorization: `Bearer ${tnpToken}` }
  });
  const verifyPipelineData = await verifyPipelineRes.json();
  console.log(`   Pipeline applicants on new drive: ${verifyPipelineData.applicants?.all?.length} student(s)`);

  console.log('\n6. Testing Event Broadcast by T&P on their OWN Drive...');
  const tnpEventRes = await fetch(`${BASE_URL}/api/tnp/drives/${createdDrive.id}/broadcast-event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tnpToken}`
    },
    body: JSON.stringify({
      target_stage: 'ALL',
      event_title: 'Campus Aptitude & Technical Round 1',
      scheduled_at: '2026-09-05T09:30',
      venue_or_link: 'Main Auditorium & Lab 301',
      notes: 'Please bring your institute ID card and laptops.'
    })
  });
  const tnpEventData = await tnpEventRes.json();
  console.log('   Own Drive Event Status:', tnpEventRes.status);
  console.log('   Success Message:', tnpEventData.message);

  if (tnpEventRes.status === 200 && verifyPipelineData.applicants?.all?.length > 0) {
    console.log('   ✅ Verified: T&P successfully fetched candidate pipeline and posted event on their own drive!');
  } else {
    throw new Error(`Failed to post event on own drive: ${tnpEventData.error}`);
  }

  console.log('\n========================================================================');
  console.log('🎉 ALL T&P APPLICANTS PIPELINE & EVENT PERMISSION TESTS PASSED 100%');
  console.log('========================================================================\n');
}

testTnpDriveApplicantsAndEvents().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
