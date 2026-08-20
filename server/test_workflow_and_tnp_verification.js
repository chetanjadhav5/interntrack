const BASE_URL = 'http://localhost:5000';

async function testWorkflowAndTnp() {
  console.log('========================================================================');
  console.log('🧪 TESTING OFFER ACCEPTANCE -> T&P VERIFICATION -> AUTO MENTOR ASSIGN -> WORKFLOW');
  console.log('========================================================================\n');

  const uniqueSuffix = Date.now();
  const testEmail = `test_candidate_${uniqueSuffix}@ghr.edu`;

  // 1. Register & verify clean student
  console.log(`1. Registering clean student (${testEmail})...`);
  const regRes = await fetch(`${BASE_URL}/api/auth/register/student`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: `Candidate ${uniqueSuffix}`,
      email: testEmail,
      password: 'Student@123',
      phone: '9876543210',
      student_id: `GHR-CS-${uniqueSuffix.toString().slice(-4)}`,
      department: 'Engineering',
      branch: 'Computer Science and Engineering',
      passing_year: 2026,
      gender: 'MALE'
    })
  });
  const regData = await regRes.json();
  if (!regRes.ok) throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
  const studentToken = regData.token;
  const studentId = regData.user.profile.id;

  // Verify student profile by class teacher
  const ctLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'faculty.cs@ghr.edu', password: 'Faculty@123' })
  });
  const ctData = await ctLoginRes.json();
  await fetch(`${BASE_URL}/api/faculty/verify-student/${studentId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ctData.token}`
    },
    body: JSON.stringify({
      status: 'VERIFIED',
      remarks: 'Verified 100% profile credentials.'
    })
  });

  // 2. Recruiter creates & dispatches an offer letter to the new student
  console.log('\n2. Recruiter dispatching offer letter to candidate...');
  const compLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'recruiter@google.com', password: 'Company@123' })
  });
  const compData = await compLoginRes.json();
  const companyToken = compData.token;

  const singleOfferRes = await fetch(`${BASE_URL}/api/company/offers/single-upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${companyToken}`
    },
    body: JSON.stringify({
      student_id: studentId,
      role_position: 'Cloud Infrastructure Intern',
      stipend_amount: 75000,
      offer_letter_url: 'https://example.com/offers/candidate_offer.pdf'
    })
  });
  const singleOfferData = await singleOfferRes.json();
  const offerId = singleOfferData.offer.id;
  console.log(`   Created Offer ID: ${offerId} with status: [${singleOfferData.offer.status}]`);

  // 3. Student accepts the offer
  console.log('\n3. Student accepting the offer...');
  const acceptRes = await fetch(`${BASE_URL}/api/student/offers/${offerId}/respond`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`
    },
    body: JSON.stringify({ decision: 'ACCEPTED' })
  });
  const acceptData = await acceptRes.json();
  console.log('   Accept Response:', acceptData.message);
  console.log('   Created Internship in status:', acceptData.internship.status, '| Mentor:', acceptData.internship.mentor_faculty_id);

  if (acceptData.internship.status !== 'VERIFICATION_PENDING') {
    throw new Error(`Expected VERIFICATION_PENDING, got ${acceptData.internship.status}`);
  }
  if (acceptData.internship.mentor_faculty_id !== null) {
    throw new Error('Mentor should NOT be assigned before T&P verification');
  }
  console.log('   ✅ Offer accepted and queued for T&P approval (Mentor unassigned).');

  // 4. Verify Student Workflow Tracker BEFORE T&P approval
  console.log('\n4. Checking Workflow Tracker BEFORE T&P verification...');
  const wfBeforeRes = await fetch(`${BASE_URL}/api/student/workflow/status`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const wfBeforeData = await wfBeforeRes.json();

  const step5_before = wfBeforeData.steps.find(s => s.step === 5);
  const step6_before = wfBeforeData.steps.find(s => s.step === 6);

  console.log('   Step 5 (T&P Verification): is_completed =', step5_before.is_completed, '| label =', step5_before.status_label);
  console.log('   Step 6 (Geofenced Check-In): is_completed =', step6_before.is_completed, '| label =', step6_before.status_label);

  if (step5_before.is_completed) {
    throw new Error('Step 5 should NOT be completed before T&P approves!');
  }
  if (step6_before.is_completed) {
    throw new Error('Step 6 should NOT be completed before check-in is performed!');
  }
  console.log('   ✅ Steps 5 and 6 correctly guarded as IN PROGRESS / LOCKED.');

  // 5. T&P Head logs in and verifies the offer
  console.log('\n5. T&P Head logging in to verify internship and assign mentor...');
  const tnpLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'tnp.cs@ghr.edu', password: 'Tnp@123' })
  });
  const tnpData = await tnpLoginRes.json();
  const tnpToken = tnpData.token;

  const tnpVerifyRes = await fetch(`${BASE_URL}/api/tnp/verify-internship/${acceptData.internship.id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tnpToken}`
    },
    body: JSON.stringify({
      decision: 'VERIFY_AND_ASSIGN',
      remarks: 'Verified Google India offer letter authenticity and corporate address.'
    })
  });
  const tnpVerifyData = await tnpVerifyRes.json();
  console.log('   T&P Verification Response:', tnpVerifyData.message);
  console.log('   Updated Internship Status:', tnpVerifyData.internship.status, '| Assigned Mentor:', tnpVerifyData.internship.mentor_faculty_id);

  if (tnpVerifyData.internship.status !== 'WEEKLY_REVIEW_ONGOING') {
    throw new Error('Expected status WEEKLY_REVIEW_ONGOING after T&P approval');
  }
  if (!tnpVerifyData.internship.mentor_faculty_id) {
    throw new Error('Mentor should be auto-assigned upon T&P verification');
  }
  console.log('   ✅ T&P successfully verified internship and auto-assigned faculty mentor!');

  // 6. Verify Student Workflow Tracker AFTER T&P approval (Step 5 now done, Step 6 awaiting check-in)
  console.log('\n6. Checking Workflow Tracker AFTER T&P verification...');
  const wfAfterRes = await fetch(`${BASE_URL}/api/student/workflow/status`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const wfAfterData = await wfAfterRes.json();

  const step5_after = wfAfterData.steps.find(s => s.step === 5);
  const step6_after = wfAfterData.steps.find(s => s.step === 6);

  console.log('   Step 5 (T&P Verification): is_completed =', step5_after.is_completed, '| label =', step5_after.status_label);
  console.log('   Step 6 (Geofenced Check-In): is_completed =', step6_after.is_completed, '| label =', step6_after.status_label);

  if (!step5_after.is_completed) {
    throw new Error('Step 5 should be COMPLETED after T&P approval');
  }
  if (step6_after.is_completed) {
    throw new Error('Step 6 should NOT be completed until at least 1 check-in is logged');
  }
  console.log('   ✅ Step 5 is now COMPLETED and Step 6 is awaiting first daily check-in.');

  // 7. Student performs daily check-in
  console.log('\n7. Student performing first daily geofenced check-in...');
  const checkinRes = await fetch(`${BASE_URL}/api/student/attendance/check-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      latitude: 18.55291,
      longitude: 73.94971,
      photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    })
  });
  const checkinData = await checkinRes.json();
  console.log('   Check-in response:', checkinData.message || checkinData.error);

  // 8. Verify Student Workflow Tracker AFTER Check-In (Step 6 now done!)
  console.log('\n8. Checking Workflow Tracker AFTER Check-In...');
  const wfFinalRes = await fetch(`${BASE_URL}/api/student/workflow/status`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const wfFinalData = await wfFinalRes.json();

  const step6_final = wfFinalData.steps.find(s => s.step === 6);
  console.log('   Step 6 (Geofenced Check-In): is_completed =', step6_final.is_completed, '| label =', step6_final.status_label);

  if (!step6_final.is_completed) {
    throw new Error('Step 6 should be COMPLETED after attendance check-in');
  }
  console.log('   ✅ Step 6 is now verified as COMPLETED!');

  console.log('\n========================================================================');
  console.log('🎉 WORKFLOW LIFECYCLE & T&P VERIFICATION TEST COMPLETED WITH 100% SUCCESS');
  console.log('========================================================================');
}

testWorkflowAndTnp().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
