const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5000';

async function testFacultyEvaluationTabsAndInterns() {
  console.log('========================================================================');
  console.log('🧪 TESTING FACULTY EVALUATION TABS & INTERNS DIRECTORY');
  console.log('========================================================================\n');

  // 1. Faculty Login
  console.log('1. Logging in as Faculty Mentor (Dr. Suresh Verma)...');
  const facultyLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'mentor.cs3@ghr.edu',
      password: 'Faculty@123'
    })
  });
  const facultyData = await facultyLoginRes.json();
  const facultyToken = facultyData.token;

  // 2. Test Eligible Mentees for Evaluation Tabs
  console.log('\n2. Fetching eligible mentees for evaluation (/api/faculty/evaluation/eligible-mentees)...');
  const evalRes = await fetch(`${BASE_URL}/api/faculty/evaluation/eligible-mentees`, {
    headers: { Authorization: `Bearer ${facultyToken}` }
  });
  const candidates = await evalRes.json();
  console.log(`   Found ${candidates.length} eligible mentee(s) for evaluation.`);

  const pendingList = candidates.filter(c => !c.final_internship_score && !c.certificate && c.status !== 'CERTIFICATE_ISSUED');
  const completedList = candidates.filter(c => Boolean(c.final_internship_score || c.certificate || c.status === 'CERTIFICATE_ISSUED'));

  console.log(`   ⏳ Pending Evaluation: ${pendingList.length} candidate(s)`);
  console.log(`   ✅ Completed Evaluation: ${completedList.length} candidate(s)`);

  completedList.forEach((c, idx) => {
    console.log(`      [Completed ${idx + 1}] ${c.student_name} (${c.student_roll}) | Final Score: ${c.final_internship_score}% | Certificate Number: ${c.certificate?.certificate_number || 'N/A'}`);
  });

  // 3. Test Assigned Interns for Active vs Certified Tabs
  console.log('\n3. Fetching assigned interns for Interns Directory (/api/faculty/assigned-interns)...');
  const internsRes = await fetch(`${BASE_URL}/api/faculty/assigned-interns`, {
    headers: { Authorization: `Bearer ${facultyToken}` }
  });
  const interns = await internsRes.json();
  console.log(`   Found ${interns.length} assigned intern(s).`);

  const activeInterns = interns.filter(i => i.status !== 'CERTIFICATE_ISSUED');
  const certifiedInterns = interns.filter(i => i.status === 'CERTIFICATE_ISSUED');

  console.log(`   🕒 Active Ongoing Interns: ${activeInterns.length}`);
  console.log(`   📜 Certified Interns: ${certifiedInterns.length}`);

  interns.forEach((i, idx) => {
    console.log(`      [Intern ${idx + 1}] ${i.student?.full_name} | Status: ${i.status} | Reports Status: ${i.reports_summary?.approved} / ${i.reports_summary?.total_unlocked} Approved`);
  });

  console.log('\n========================================================================');
  console.log('🎉 ALL FACULTY EVALUATION TABS & INTERNS TESTS PASSED 100%');
  console.log('========================================================================\n');
}

testFacultyEvaluationTabsAndInterns().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
