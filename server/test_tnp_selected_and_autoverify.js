const BASE_URL = 'http://localhost:5000';

async function testTnpSelectedAndAutoVerify() {
  console.log('========================================================================');
  console.log('🧪 TESTING T&P SELECTED STUDENTS, OFFER ISSUANCE & AUTO-VERIFICATION HUB');
  console.log('========================================================================\n');

  // 1. T&P Coordinator Login
  console.log('1. Logging in as T&P Head (Prof. Rajesh Kulkarni)...');
  const tnpLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'tnp.cs@ghr.edu', password: 'Tnp@123', role: 'TNP' })
  });
  const tnpData = await tnpLogin.json();
  const tnpToken = tnpData.token;
  if (!tnpToken) throw new Error('T&P login failed');

  // 2. Fetch Selected Students in T&P Portal
  console.log('\n2. Fetching selected candidates in T&P Selected Students section...');
  const selRes = await fetch(`${BASE_URL}/api/tnp/selected-students`, {
    headers: { Authorization: `Bearer ${tnpToken}` }
  });
  const selList = await selRes.json();
  console.log(`   Found ${selList.length} selected candidate(s) across T&P placement drives.`);
  if (selList.length === 0) throw new Error('No selected candidates found in T&P portal');

  const targetCandidate = selList[0];
  console.log(`   Candidate: ${targetCandidate.student_name} (${targetCandidate.student_roll}) | Drive: ${targetCandidate.drive_title}`);

  // 3. T&P Issues Offer Letter with Custom Start and End Dates
  console.log('\n3. T&P Department issuing verified offer letter (start: 2026-09-01, end: 2027-02-28)...');
  const issueRes = await fetch(`${BASE_URL}/api/tnp/offers/single-upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tnpToken}`
    },
    body: JSON.stringify({
      student_id: targetCandidate.student_id,
      drive_id: targetCandidate.drive_id,
      role_position: targetCandidate.role_position || 'Software Engineering Intern',
      stipend_amount: 55000,
      start_date: '2026-09-01',
      end_date: '2027-02-28',
      offer_letter_url: 'https://example.com/offers/tnp_on_campus_offer.pdf'
    })
  });
  const issueData = await issueRes.json();
  console.log('   T&P Issue Response:', issueData.message);
  console.log(`   Calculated Friday Reports Count: ${issueData.friday_reports_count}`);
  if (!issueRes.ok) throw new Error('Failed to issue T&P offer letter');

  // 4. Student Logs in and Checks Offers
  console.log('\n4. Logging in as Student (Alex Patil)...');
  const studLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'alex.patil@ghr.edu', password: 'Student@123' })
  });
  const studData = await studLogin.json();
  const studentToken = studData.token;

  const offersRes = await fetch(`${BASE_URL}/api/student/offers`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const offersList = await offersRes.json();
  console.log(`   Student has ${offersList.length} offer letter(s).`);

  const issuedOffer = offersList.find(o => o.student_id === targetCandidate.student_id && o.is_tnp_drive) || offersList[0];
  console.log(`   Offer ID: ${issuedOffer.id} | Company: ${issuedOffer.company_name} | is_tnp_drive: [${issuedOffer.is_tnp_drive}]`);

  // 5. Student Accepts the T&P Offer
  console.log('\n5. Student accepting the T&P On-Campus offer letter...');
  const acceptRes = await fetch(`${BASE_URL}/api/student/offers/${issuedOffer.id}/respond`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`
    },
    body: JSON.stringify({ decision: 'ACCEPTED' })
  });
  const acceptData = await acceptRes.json();
  console.log('   Accept Response:', acceptData.message);
  console.log('   Auto-Verified:', acceptData.auto_verified);
  console.log('   Assigned Mentor Faculty ID:', acceptData.internship?.mentor_faculty_id);
  console.log('   Internship Status:', acceptData.internship?.status);

  if (!acceptData.auto_verified || acceptData.internship?.status !== 'WEEKLY_REVIEW_ONGOING') {
    throw new Error('Expected internship to be auto-verified (WEEKLY_REVIEW_ONGOING) for T&P on-campus offer');
  }
  if (!acceptData.internship?.mentor_faculty_id) {
    throw new Error('Expected faculty mentor to be auto-assigned');
  }
  console.log('   ✅ Student offer acceptance triggered auto-verification and mentor assignment!');

  // 6. Verify in T&P Offer Verification Hub > Verified section
  console.log('\n6. Checking T&P Offer Verification Hub > Verified section (/api/tnp/verifications)...');
  const verifRes = await fetch(`${BASE_URL}/api/tnp/verifications`, {
    headers: { Authorization: `Bearer ${tnpToken}` }
  });
  const verifData = await verifRes.json();
  const verifiedList = verifData.college_placed?.verified || [];
  console.log(`   Verified Campus Placements count: ${verifiedList.length}`);

  const foundInVerified = verifiedList.find(i => i.student_id === targetCandidate.student_id);
  if (!foundInVerified) {
    throw new Error(`Student ${targetCandidate.student_name} not found in college_placed.verified`);
  }

  console.log(`   Found in Verified section: ${foundInVerified.student_name} (${foundInVerified.roll_number})`);
  console.log(`   Company: ${foundInVerified.company_name} | Role: ${foundInVerified.role_position} | Mentor: ${foundInVerified.mentor_faculty_id}`);
  console.log('   ✅ Student is automatically listed in T&P Offer Verification Hub > Verified section!');

  console.log('\n========================================================================');
  console.log('🎉 T&P SELECTED STUDENTS & AUTO-VERIFICATION PIPELINE PASSED 100%');
  console.log('========================================================================');
}

testTnpSelectedAndAutoVerify().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
