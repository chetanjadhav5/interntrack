async function testTnpGstinTrustScore() {
  console.log('========================================================================');
  console.log('🧪 TESTING T&P OFFER VERIFICATION HUB - GSTIN COMPANY TRUST SCORE ENGINE');
  console.log('========================================================================\n');

  // 1. T&P Login
  console.log('1. Logging in as T&P Officer (tnp.cs@ghr.edu)...');
  const loginRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'tnp.cs@ghr.edu',
      password: 'Tnp@123'
    })
  });

  const loginData = await loginRes.json();
  if (!loginData.token) {
    console.error('❌ T&P Login failed:', loginData);
    process.exit(1);
  }
  const token = loginData.token;
  console.log('✅ T&P Login Successful. Token obtained.\n');

  // 2. Fetch Pending Verifications Queue
  console.log('2. Fetching T&P Verification Queue (/api/tnp/verifications/pending)...');
  const queueRes = await fetch('http://127.0.0.1:5000/api/tnp/verifications/pending', {
    headers: { Authorization: `Bearer ${token}` }
  });

  const queueData = await queueRes.json();
  console.log('Queue HTTP Status:', queueRes.status);
  console.log('Self-Placed Pending Count:', queueData.self_placed?.pending?.length || 0);
  console.log('College-Placed Pending Count:', queueData.college_placed?.pending?.length || 0);

  const sampleSelfPlaced = queueData.self_placed?.pending?.[0] || queueData.self_placed?.all?.[0];
  if (sampleSelfPlaced) {
    console.log('\n3. Inspecting Self-Placed Request GSTIN Trust Intelligence:');
    console.log('   Company Name:', sampleSelfPlaced.company_name);
    console.log('   GSTIN:', sampleSelfPlaced.gstin);
    const trust = sampleSelfPlaced.gstin_trust_data;
    if (trust) {
      console.log('   ✅ Trust Score:', trust.score, '/ 100');
      console.log('   ✅ Trust Grade:', trust.grade_label);
      console.log('   ✅ Recommendation:', trust.recommendation);
      console.log('   ✅ Operational Vintage:', trust.vintage_years, 'years');
      console.log('   ✅ Returns Filed Count:', trust.returns_filed_count);
      console.log('   ✅ Score Breakdown Pillars:', trust.breakdown?.length);
      console.log('   ✅ Recent Return Records:', trust.recent_returns?.length);
    } else {
      console.warn('   ⚠️ No trust data attached');
    }
  }

  // 3. Live On-Demand GSTIN Trust Check Endpoint
  const testGstin = '27AAJCM9929L1ZM';
  console.log(`\n4. Testing Live On-Demand Company Trust Audit (/api/tnp/company-trust-check/${testGstin})...`);
  const auditRes = await fetch(`http://127.0.0.1:5000/api/tnp/company-trust-check/${testGstin}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const auditData = await auditRes.json();
  console.log('Audit HTTP Status:', auditRes.status);
  console.log('Audit Success:', auditData.success);
  console.log('Legal Name:', auditData.legal_name);
  console.log('Calculated Trust Score:', auditData.trust_score, '/ 100');
  console.log('Trust Grade Label:', auditData.trust_grade_label);
  console.log('Recommendation:', auditData.trust_recommendation);

  if (auditData.trust_score < 85) {
    console.error('❌ Expected high trust score (>=85) for verified active corporate');
    process.exit(1);
  }

  console.log('\n🎉 ALL T&P COMPANY TRUST SCORE TESTS PASSED 100% SUCCESSFULLY!');
}

testTnpGstinTrustScore().catch(console.error);
