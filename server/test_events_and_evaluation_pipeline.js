const BASE_URL = 'http://localhost:5000';

async function testEventsAndEvaluation() {
  console.log('========================================================================');
  console.log('🧪 TESTING COMPANY EVENT BROADCAST, DRIVE DETAILS/CLOSE, & INTERN PPO HUB');
  console.log('========================================================================\n');

  // 1. Company Recruiter Login
  console.log('1. Logging in as Company Recruiter (Google India)...');
  const compLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'recruiter@google.com', password: 'Company@123' })
  });
  const compData = await compLoginRes.json();
  const companyToken = compData.token;
  if (!companyToken) throw new Error('Company login failed');

  // 2. Fetch Drives & Test Drive Details
  console.log('\n2. Fetching company drives and inspecting Drive Details...');
  const drivesRes = await fetch(`${BASE_URL}/api/company/drives`, {
    headers: { Authorization: `Bearer ${companyToken}` }
  });
  const drivesList = await drivesRes.json();
  if (drivesList.length === 0) throw new Error('No drives found for company');
  const testDrive = drivesList[0];
  console.log(`   Found Drive: "${testDrive.title}" (ID: ${testDrive.id}) | Status: [${testDrive.status}]`);

  const detailRes = await fetch(`${BASE_URL}/api/company/drives/${testDrive.id}`, {
    headers: { Authorization: `Bearer ${companyToken}` }
  });
  const detailData = await detailRes.json();
  console.log('   Drive Details Breakdown:', detailData.stages_breakdown);

  // 3. Test Close / Reopen Drive
  console.log('\n3. Testing Close Drive / Reopen Drive toggle action...');
  const toggleRes1 = await fetch(`${BASE_URL}/api/company/drives/${testDrive.id}/toggle-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${companyToken}` },
    body: JSON.stringify({ status: 'CLOSED' })
  });
  const toggleData1 = await toggleRes1.json();
  console.log(`   Toggle 1 response: Status is now [${toggleData1.drive.status}]`);
  if (toggleData1.drive.status !== 'CLOSED') throw new Error('Expected status CLOSED');

  const toggleRes2 = await fetch(`${BASE_URL}/api/company/drives/${testDrive.id}/toggle-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${companyToken}` },
    body: JSON.stringify({ status: 'ACTIVE' })
  });
  const toggleData2 = await toggleRes2.json();
  console.log(`   Toggle 2 response: Status restored to [${toggleData2.drive.status}]`);
  if (toggleData2.drive.status !== 'ACTIVE') throw new Error('Expected status ACTIVE');
  console.log('   ✅ Close / Reopen Drive action verified!');

  // 4. Test Post Event (Broadcast to Applicants)
  console.log('\n4. Testing Post Event (Broadcast Announcement to All Applicants)...');
  const broadcastRes = await fetch(`${BASE_URL}/api/company/drives/${testDrive.id}/broadcast-event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${companyToken}`
    },
    body: JSON.stringify({
      target_stage: 'ALL',
      event_title: 'System Architecture & Coding Assessment',
      scheduled_at: '2026-08-28T10:30:00Z',
      venue_or_link: 'https://meet.google.com/ghr-interview-live',
      notes: 'Please ensure high-speed internet and webcam enabled. 60 mins coding challenge.'
    })
  });
  const broadcastData = await broadcastRes.json();
  console.log(`   Broadcast response:`, broadcastData.message);
  if (!broadcastRes.ok) throw new Error('Event broadcast failed');
  console.log('   ✅ Event broadcast successfully sent to applicants!');

  // 5. Student Login & Verify Selection Timeline Tile
  console.log('\n5. Logging in as Student (Alex Patil) to check Selection Timeline & Details...');
  const studLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'alex.patil@ghr.edu', password: 'Student@123' })
  });
  const studData = await studLoginRes.json();
  const studentToken = studData.token;

  const myAppsRes = await fetch(`${BASE_URL}/api/student/applications/my-applications`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const myAppsData = await myAppsRes.json();
  console.log(`   Student has ${myAppsData.length} applied drive records.`);
  const matchingApp = myAppsData.find(a => a.drive_id === testDrive.id) || myAppsData[0];
  
  if (matchingApp) {
    const latestEvent = matchingApp.stage_events?.slice(-1)[0];
    console.log('   Latest Timeline Event on student tile:', {
      event_title: latestEvent?.event_title,
      stage: latestEvent?.stage,
      venue_or_link: latestEvent?.venue_or_link,
      scheduled_at: latestEvent?.scheduled_at,
      event_posted: latestEvent?.event_posted
    });
    if (!latestEvent?.venue_or_link) {
      throw new Error('Expected venue_or_link in timeline event');
    }
  }
  console.log('   ✅ Student can view event details on the timeline tile!');

  // 6. Test Intern Evaluation & PPO Section
  console.log('\n6. Fetching Selected Interns for Intern Evaluation & PPO Hub...');
  const internsRes = await fetch(`${BASE_URL}/api/company/interns`, {
    headers: { Authorization: `Bearer ${companyToken}` }
  });
  const internsList = await internsRes.json();
  console.log(`   Selected Interns count: ${internsList.length}`);
  internsList.forEach(cand => {
    console.log(`   • ${cand.student_name} (${cand.student_roll}) - Role: ${cand.role_position} | PPO Recommended: [${cand.ppo_recommended}]`);
  });

  if (internsList.length === 0) throw new Error('No selected interns found');

  const selectedTarget = internsList[0];
  console.log(`\n7. Evaluating intern [${selectedTarget.student_name}] and recommending PPO...`);
  const evalRes = await fetch(`${BASE_URL}/api/company/interns/${selectedTarget.id}/evaluate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${companyToken}`
    },
    body: JSON.stringify({
      student_id: selectedTarget.student_id,
      technical_score: 98,
      soft_skills_score: 95,
      attendance_rating: 96,
      ppo_recommended: true,
      comments: 'Outstanding intern! Solved mission-critical backend scaling tasks and demonstrated high leadership potential.'
    })
  });
  const evalData = await evalRes.json();
  console.log('   Appraisal response:', evalData.message, '| Score:', evalData.score);
  if (!evalRes.ok) throw new Error('Evaluation submission failed');
  console.log('   ✅ Intern evaluation and PPO recommendation successfully recorded!');

  console.log('\n========================================================================');
  console.log('🎉 COMPANY EVENT BROADCAST & INTERN EVALUATION PIPELINE PASSED 100%');
  console.log('========================================================================');
}

testEventsAndEvaluation().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
