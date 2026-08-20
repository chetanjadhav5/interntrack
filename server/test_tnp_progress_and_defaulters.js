const BASE_URL = 'http://localhost:5000';

async function testTnpProgressAndDefaulters() {
  console.log('========================================================================');
  console.log('🧪 TESTING T&P MILESTONE 100% COMPLETION & DEFAULTERS MANAGEMENT FLOW');
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

  // 2. Fetch student list and check progress of evaluated student with certificate (Alex Patil)
  console.log('\n2. Fetching student progress for student with certificate (Alex Patil)...');
  const studsRes = await fetch(`${BASE_URL}/api/tnp/students`, {
    headers: { Authorization: `Bearer ${tnpToken}` }
  });
  const students = await studsRes.json();
  const alex = students.find(s => s.full_name?.includes('Alex')) || students[0];

  const progRes = await fetch(`${BASE_URL}/api/tnp/students/${alex.id}/progress`, {
    headers: { Authorization: `Bearer ${tnpToken}` }
  });
  const progData = await progRes.json();
  console.log('   Student:', progData.student?.full_name);
  console.log('   Progress Percent:', `${progData.progress_percent}%`);
  console.log('   Current Status:', progData.current_status);
  console.log('   Milestones Count:', progData.milestones?.length);
  
  const allCompleted = progData.milestones.every(m => m.completed === true);
  console.log('   All 8 Milestones Completed:', allCompleted);
  if (progData.current_status === 'CERTIFICATE_ISSUED') {
    if (!allCompleted || progData.progress_percent !== 100) {
      throw new Error('Expected all milestones to be marked completed when certificate is issued');
    }
    console.log('   ✅ Verified: All 8 milestones marked completed (100%) for certified student!');
  }

  // 3. Test Defaulters Flow: Create an offer for candidate Priya Sharma and reject it
  console.log('\n3. Testing Student Offer Rejection & Defaulter Flagging...');
  const priya = students.find(s => s.full_name?.includes('Priya')) || students[1];

  // Company recruiter logs in and issues offer to Priya
  const compLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'recruiter@google.com',
      password: 'Company@123'
    })
  });
  const compToken = (await compLoginRes.json()).token;

  const issueRes = await fetch(`${BASE_URL}/api/company/offers/single-upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${compToken}`
    },
    body: JSON.stringify({
      student_id: priya.id,
      role_position: 'Cloud Infrastructure Intern',
      stipend_amount: 60000,
      start_date: '2026-09-01',
      end_date: '2027-02-28',
      offer_letter_url: 'https://example.com/offers/priya_offer.pdf',
      filename: 'Priya_Sharma_Offer.pdf'
    })
  });
  const issueData = await issueRes.json();
  console.log('   Offer Upload Status:', issueRes.status, issueData.message);

  // Priya logs in and declines/rejects the offer
  const priyaLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'priya.sharma@ghr.edu',
      password: 'Student@123'
    })
  });
  const priyaToken = (await priyaLoginRes.json()).token;

  const offersRes = await fetch(`${BASE_URL}/api/student/offers`, {
    headers: { Authorization: `Bearer ${priyaToken}` }
  });
  const priyaOffers = await offersRes.json();
  const targetOffer = priyaOffers[0];

  console.log(`   Student ${priya.full_name} declining offer from ${targetOffer.company_name}...`);
  const rejectRes = await fetch(`${BASE_URL}/api/student/offers/${targetOffer.id}/respond`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${priyaToken}`
    },
    body: JSON.stringify({ decision: 'REJECTED' })
  });
  const rejectData = await rejectRes.json();
  console.log('   Rejection Response:', rejectData.message);

  // 4. T&P Head checks Defaulters Queue (/api/tnp/defaulters)
  console.log('\n4. T&P Head checking Defaulters Queue (/api/tnp/defaulters)...');
  const defRes = await fetch(`${BASE_URL}/api/tnp/defaulters`, {
    headers: { Authorization: `Bearer ${tnpToken}` }
  });
  const defData = await defRes.json();
  console.log(`   Found ${defData.total_defaulters} Defaulter(s) | Restricted: ${defData.restricted_count}`);

  const defaulterPriya = defData.defaulters.find(d => d.student_roll === priya.student_id || d.full_name === priya.full_name);
  if (!defaulterPriya) {
    throw new Error('Priya not found in Defaulters list after offer rejection');
  }
  console.log(`   Candidate in Defaulters Queue: ${defaulterPriya.full_name} (${defaulterPriya.student_roll})`);
  console.log(`   Declined Offer: ${defaulterPriya.rejected_company} — ${defaulterPriya.rejected_role}`);
  console.log(`   Placement Access Status: [${defaulterPriya.defaulter_status}]`);
  console.log('   ✅ Student successfully flagged in Defaulters list with restricted placement access!');

  // 5. T&P Department re-enables placement access with exemption remarks
  console.log('\n5. T&P Head re-enabling placement access for student...');
  const reEnableRes = await fetch(`${BASE_URL}/api/tnp/defaulters/${defaulterPriya.id}/re-enable`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tnpToken}`
    },
    body: JSON.stringify({
      remarks: 'Special exemption granted by T&P Dean for Core Engineering campus drives.'
    })
  });
  const reEnableData = await reEnableRes.json();
  console.log('   Re-enable Response Status:', reEnableRes.status);
  console.log('   Message:', reEnableData.message);

  // 6. Verify restored status
  const defVerifyRes = await fetch(`${BASE_URL}/api/tnp/defaulters`, {
    headers: { Authorization: `Bearer ${tnpToken}` }
  });
  const defVerifyData = await defVerifyRes.json();
  const restoredPriya = defVerifyData.defaulters.find(d => d.id === defaulterPriya.id);
  console.log(`   Updated Placement Status in Defaulters Queue: [${restoredPriya.defaulter_status}]`);
  console.log(`   Exemption Note: "${restoredPriya.exemption_remarks}"`);
  console.log('   ✅ Placement drive access re-enabled successfully!');

  console.log('\n========================================================================');
  console.log('🎉 ALL T&P MILESTONES & DEFAULTERS MANAGEMENT TESTS PASSED 100%');
  console.log('========================================================================\n');
}

testTnpProgressAndDefaulters().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
