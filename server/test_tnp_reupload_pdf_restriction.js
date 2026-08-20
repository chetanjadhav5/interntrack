const BASE_URL = 'http://localhost:5000';

async function testTnpReuploadPdfRestriction() {
  console.log('========================================================================');
  console.log('🧪 TESTING T&P RE-UPLOAD PDF PERMISSION RESTRICTION');
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

  // 2. Fetch selected candidates in T&P Portal
  console.log('\n2. Fetching selected students in T&P Portal (/api/tnp/selected-students)...');
  const selRes = await fetch(`${BASE_URL}/api/tnp/selected-students`, {
    headers: { Authorization: `Bearer ${tnpToken}` }
  });
  const candidates = await selRes.json();
  console.log(`   Found ${candidates.length} candidate(s) in Selected Students hub.`);

  candidates.forEach((c, i) => {
    console.log(`   [${i + 1}] ${c.student_name} (${c.student_roll}) | Company: ${c.company_name} | Offer: ${c.offer_letter_status} | T&P Issued: ${c.is_tnp_issued} | Issued By: ${c.issued_by_role}`);
  });

  const companyOfferCandidate = candidates.find(c => c.is_tnp_issued === false && c.offer_letter_status !== 'NOT_ISSUED');
  const tnpOfferCandidate = candidates.find(c => c.is_tnp_issued === true) || candidates[0];

  if (companyOfferCandidate) {
    console.log(`\n3. Found candidate with Company-issued offer: ${companyOfferCandidate.student_name} (${companyOfferCandidate.company_name})`);
    console.log('   Testing T&P attempt to re-upload single offer PDF on Company-issued offer (Should be Forbidden)...');

    const forbiddenRes = await fetch(`${BASE_URL}/api/tnp/offers/single-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tnpToken}`
      },
      body: JSON.stringify({
        student_id: companyOfferCandidate.student_id,
        drive_id: companyOfferCandidate.drive_id,
        company_name: companyOfferCandidate.company_name,
        role_position: 'Overwritten Role',
        stipend_amount: 50000,
        start_date: '2026-09-01',
        end_date: '2027-02-28',
        offer_letter_url: 'https://example.com/offers/unauthorized.pdf'
      })
    });
    const forbiddenData = await forbiddenRes.json();
    console.log('   Forbidden Status:', forbiddenRes.status);
    console.log('   Forbidden Error Message:', forbiddenData.error);

    if (forbiddenRes.status === 403) {
      console.log('   ✅ Verified: T&P cannot overwrite/re-upload corporate company offers!');
    } else {
      throw new Error(`Expected 403 Forbidden but got ${forbiddenRes.status}`);
    }
  }

  // 4. Test T&P uploading/re-uploading for T&P-issued offer
  console.log(`\n4. Testing T&P issuing/re-uploading for T&P on-campus candidate: ${tnpOfferCandidate.student_name}...`);
  const tnpUploadRes = await fetch(`${BASE_URL}/api/tnp/offers/single-upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tnpToken}`
    },
    body: JSON.stringify({
      student_id: tnpOfferCandidate.student_id,
      drive_id: tnpOfferCandidate.drive_id,
      company_name: tnpOfferCandidate.company_name || 'T&P Innovation Hub',
      role_position: 'Graduate Intern',
      stipend_amount: 45000,
      start_date: '2026-09-01',
      end_date: '2027-02-28',
      offer_letter_url: 'https://example.com/offers/tnp_verified.pdf'
    })
  });
  const tnpUploadData = await tnpUploadRes.json();
  console.log('   T&P Upload Status:', tnpUploadRes.status);
  console.log('   T&P Upload Message:', tnpUploadData.message);

  if (tnpUploadRes.status === 200) {
    console.log('   ✅ Verified: T&P can successfully issue/re-upload offer letters for T&P drives!');
  } else {
    throw new Error(`T&P upload failed: ${tnpUploadData.error}`);
  }

  console.log('\n========================================================================');
  console.log('🎉 ALL RE-UPLOAD PDF PERMISSION TESTS PASSED 100%');
  console.log('========================================================================\n');
}

testTnpReuploadPdfRestriction().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
