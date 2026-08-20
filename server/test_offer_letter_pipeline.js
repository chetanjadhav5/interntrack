const BASE_URL = 'http://localhost:5000';

async function testOfferPipeline() {
  console.log('================================================================');
  console.log('🧪 TESTING COMPANY MULTI-SELECT OFFER LETTER PIPELINE & PRN MATCHER');
  console.log('================================================================\n');

  // 1. Company Login
  console.log('1. Logging in as Company Recruiter (Google India)...');
  const compLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'recruiter@google.com', password: 'Company@123' })
  });
  const compLoginData = await compLoginRes.json();
  const companyToken = compLoginData.token;
  if (!companyToken) throw new Error('Company login failed');

  // 2. Fetch Selected Students Pipeline
  console.log('\n2. Fetching selected students pipeline...');
  const selectedRes = await fetch(`${BASE_URL}/api/company/selected-students`, {
    headers: { Authorization: `Bearer ${companyToken}` }
  });
  const selectedData = await selectedRes.json();
  console.log(`   Selected candidates count: ${selectedData.length}`);
  selectedData.forEach(c => {
    console.log(`   • ${c.student_name} (${c.student_roll}) - Offer Status: [${c.offer_letter_status}]`);
  });

  // 3. Multi-Select PDF Upload & Auto-Matcher Preview
  console.log('\n3. Testing Multi-Select PDF Upload & PRN Matcher Preview...');
  const multiFiles = [
    { filename: 'GHR-CS-2023-042_Google_AlexPatil_Offer.pdf', url: 'https://example.com/offers/alex_offer.pdf', size: 154000 },
    { filename: 'Priya_Sharma_GHR-CS-2023-088_OfferLetter.pdf', url: 'https://example.com/offers/priya_offer.pdf', size: 148000 },
    { filename: 'Unmatched_Resume_Doc.pdf', url: 'https://example.com/offers/other.pdf', size: 98000 }
  ];

  const previewRes = await fetch(`${BASE_URL}/api/company/offers/bulk-preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${companyToken}`
    },
    body: JSON.stringify({ uploaded_files: multiFiles })
  });
  const previewData = await previewRes.json();
  console.log('   Preview summary:', {
    total_files: previewData.total_files,
    matched_count: previewData.matched_count,
    unmatched_count: previewData.unmatched_count
  });

  if (previewData.matched_count < 2) {
    throw new Error(`Expected at least 2 matched files, got ${previewData.matched_count}`);
  }
  console.log('   ✅ PRN & Name matching successfully mapped candidates!');

  // 4. Dispatch Matched Offers
  console.log('\n4. Dispatching matched offer letters...');
  const dispatchRes = await fetch(`${BASE_URL}/api/company/offers/bulk-send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${companyToken}`
    },
    body: JSON.stringify({
      matched_offers: previewData.matched_files.map(m => ({
        student_id: m.student_id,
        role_position: 'Software Engineering Intern',
        stipend_amount: 85000,
        offer_letter_url: m.file.url,
        file_name: m.file_name
      }))
    })
  });
  const dispatchData = await dispatchRes.json();
  console.log(`   Dispatch response:`, dispatchData);
  if (dispatchRes.status !== 200) throw new Error('Dispatch failed');
  console.log('   ✅ Official offer letters issued and notifications sent!');

  // 5. Student Login & PPO/Offer Hub Verification
  console.log('\n5. Logging in as Student (Alex Patil) to verify PPO & Offer Letters hub...');
  const studLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'alex.patil@ghr.edu', password: 'Student@123' })
  });
  const studLoginData = await studLoginRes.json();
  const studentToken = studLoginData.token;

  const offersRes = await fetch(`${BASE_URL}/api/student/offers`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const offersData = await offersRes.json();
  console.log(`   Student visible offers count: ${offersData.length}`);
  offersData.forEach(o => {
    console.log(`   • Company: ${o.company_name} | Role: ${o.role_position} | Status: [${o.status}] | PDF: ${o.offer_letter_url}`);
  });

  if (offersData.length === 0) {
    throw new Error('Student cannot see the issued offer letters');
  }
  console.log('   ✅ Student can view issued corporate offer letters with PDF links!');

  console.log('\n================================================================');
  console.log('🎉 COMPANY SELECTED STUDENTS & OFFER PIPELINE TEST PASSED 100%');
  console.log('================================================================');
}

testOfferPipeline().catch(err => {
  console.error('❌ Pipeline test failed:', err);
  process.exit(1);
});
