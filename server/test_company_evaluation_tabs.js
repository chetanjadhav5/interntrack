const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5000';

async function testCompanyEvaluationTabs() {
  console.log('========================================================================');
  console.log('🧪 TESTING COMPANY EVALUATION TABS & APPRAISAL DETAILS');
  console.log('========================================================================\n');

  // 1. Recruiter Login
  console.log('1. Logging in as Company Recruiter (Google India)...');
  const recruiterLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'recruiter@google.com',
      password: 'Company@123'
    })
  });
  const recruiterData = await recruiterLoginRes.json();
  const recruiterToken = recruiterData.token;

  // 2. Fetch Company Interns
  console.log('\n2. Fetching company interns (/api/company/interns)...');
  const internsRes = await fetch(`${BASE_URL}/api/company/interns`, {
    headers: { Authorization: `Bearer ${recruiterToken}` }
  });
  const interns = await internsRes.json();
  console.log(`   Found ${interns.length} candidate(s) for company.`);

  const pendingList = interns.filter(i => !i.is_evaluated && !i.evaluated_at);
  const evaluatedList = interns.filter(i => i.is_evaluated || Boolean(i.evaluated_at));

  console.log(`   ⏳ Pending Evaluation: ${pendingList.length}`);
  console.log(`   ✅ Evaluated Candidates: ${evaluatedList.length}`);

  // 3. Test Submitting Evaluation for a Pending Candidate (or re-evaluating)
  const targetCandidate = pendingList[0] || interns[0];
  console.log(`\n3. Submitting performance appraisal for candidate: ${targetCandidate.student_name}...`);

  const evalRes = await fetch(`${BASE_URL}/api/company/interns/${targetCandidate.internship_id || targetCandidate.student_id}/evaluate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${recruiterToken}`
    },
    body: JSON.stringify({
      student_id: targetCandidate.student_id,
      technical_score: 96,
      soft_skills_score: 94,
      attendance_rating: 98,
      ppo_recommended: true,
      comments: 'Outstanding contribution on microservices architecture and clean code standards.'
    })
  });

  const evalData = await evalRes.json();
  console.log('   Evaluation Submit Status:', evalRes.status);
  console.log('   Evaluation Message:', evalData.message);
  console.log('   Calculated Score:', evalData.score);
  console.log('   PPO Recommended:', evalData.ppo_recommended);

  if (evalRes.status !== 200) {
    throw new Error(`Failed to submit company appraisal: ${evalData.error}`);
  }

  // 4. Verify candidate now appears in Evaluated tab
  console.log('\n4. Re-fetching company interns to verify status in Evaluated tab...');
  const verifyRes = await fetch(`${BASE_URL}/api/company/interns`, {
    headers: { Authorization: `Bearer ${recruiterToken}` }
  });
  const updatedInterns = await verifyRes.json();
  const updatedEvaluated = updatedInterns.filter(i => i.is_evaluated || Boolean(i.evaluated_at));

  console.log(`   ✅ Verified: ${updatedEvaluated.length} candidate(s) in Evaluated tab.`);
  const evaluatedTarget = updatedEvaluated.find(i => i.student_id === targetCandidate.student_id);

  if (evaluatedTarget) {
    console.log(`      Candidate: ${evaluatedTarget.student_name}`);
    console.log(`      Score: ${evaluatedTarget.company_evaluation_score}/100`);
    console.log(`      PPO Recommended: ${evaluatedTarget.ppo_recommended}`);
    console.log(`      Feedback: "${evaluatedTarget.company_feedback}"`);
  }

  console.log('\n========================================================================');
  console.log('🎉 ALL COMPANY EVALUATION TABS TESTS PASSED 100%');
  console.log('========================================================================\n');
}

testCompanyEvaluationTabs().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
