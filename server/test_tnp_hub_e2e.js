const BASE_URL = 'http://localhost:5000';

async function testTnpHub() {
  console.log('========================================================================');
  console.log('🧪 TESTING T&P OFFER VERIFICATION HUB API & DATA CONTRACT');
  console.log('========================================================================\n');

  // 1. T&P Login
  console.log('1. Logging in as T&P Coordinator (Prof. Rajesh Kulkarni)...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'tnp.cs@ghr.edu', password: 'Tnp@123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  if (!token) throw new Error('T&P Login failed');

  // 2. Fetch Pending Queue
  console.log('\n2. Fetching T&P Verification Queue (/api/tnp/verifications/pending)...');
  const queueRes = await fetch(`${BASE_URL}/api/tnp/verifications/pending`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const queueData = await queueRes.json();
  console.log('   Campus Placed Stats:', {
    pending: queueData.college_placed?.pending?.length,
    verified: queueData.college_placed?.verified?.length,
    rejected: queueData.college_placed?.rejected?.length
  });
  console.log('   Self Placed Stats:', {
    pending: queueData.self_placed?.pending?.length,
    verified: queueData.self_placed?.verified?.length,
    rejected: queueData.self_placed?.rejected?.length
  });

  if (!queueData.college_placed || !queueData.self_placed) {
    throw new Error('Verification queue missing required tabs');
  }

  // 3. Fetch Faculty Mentors List
  console.log('\n3. Fetching Faculty Mentors list (/api/tnp/faculty)...');
  const facRes = await fetch(`${BASE_URL}/api/tnp/faculty`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const facData = await facRes.json();
  console.log(`   Found ${facData.length} faculty mentors in department:`);
  facData.forEach(f => {
    console.log(`   • ${f.name} (Mentee Count: ${f.active_mentee_count})`);
  });

  if (facData.length === 0) {
    throw new Error('No faculty mentors returned');
  }

  // 4. Test Verification Decision Action
  const sampleItem = queueData.college_placed?.pending?.[0] || queueData.college_placed?.verified?.[0];
  if (sampleItem) {
    console.log(`\n4. Testing verify decision on internship [${sampleItem.id}] (${sampleItem.company_name})...`);
    const verifyRes = await fetch(`${BASE_URL}/api/tnp/verify-internship/${sampleItem.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        decision: 'VERIFY_AND_ASSIGN',
        assigned_mentor_id: facData[0].user_id || facData[0].id,
        remarks: 'Institutional approval granted.'
      })
    });
    const verifyData = await verifyRes.json();
    console.log('   Verification response:', verifyData.message);
    if (!verifyRes.ok) throw new Error('Verification action failed');
    console.log('   ✅ Verification action succeeded!');
  }

  console.log('\n========================================================================');
  console.log('🎉 T&P VERIFICATION HUB API TEST COMPLETED WITH 100% SUCCESS');
  console.log('========================================================================');
}

testTnpHub().catch(err => {
  console.error('❌ T&P test failed:', err);
  process.exit(1);
});
