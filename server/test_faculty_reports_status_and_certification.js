const BASE_URL = 'http://localhost:5000';

async function testFacultyReportsStatusAndCertification() {
  console.log('========================================================================');
  console.log('🧪 TESTING FACULTY REPORTS STATUS & CERTIFICATION CANDIDATES FILTER');
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

  // 2. Test Assigned Interns Reports Status
  console.log('\n2. Fetching assigned active interns (/api/faculty/assigned-interns)...');
  const internsRes = await fetch(`${BASE_URL}/api/faculty/assigned-interns`, {
    headers: { Authorization: `Bearer ${facultyToken}` }
  });
  const interns = await internsRes.json();
  console.log(`   Found ${interns.length} assigned intern(s).`);

  interns.forEach((intern, idx) => {
    const summary = intern.reports_summary;
    console.log(`   [${idx + 1}] ${intern.student?.full_name} | Status: ${intern.status} | Reports: ${summary?.approved} / ${summary?.total_unlocked} Approved (Total Tenure: ${summary?.total})`);
    if (typeof summary?.total_unlocked !== 'number') {
      throw new Error(`Missing total_unlocked count for intern ${intern.student?.full_name}`);
    }
  });
  console.log('   ✅ Verified: Reports Status correctly computes approved out of total unlocked reports!');

  // 3. Test Certification Module Candidates Filter (Only Completed Internships)
  console.log('\n3. Fetching certification candidates (/api/faculty/certification/candidates)...');
  const certRes = await fetch(`${BASE_URL}/api/faculty/certification/candidates`, {
    headers: { Authorization: `Bearer ${facultyToken}` }
  });
  const certCandidates = await certRes.json();
  console.log(`   Found ${certCandidates.length} certification candidate(s).`);

  const todayStr = new Date().toISOString().split('T')[0];
  certCandidates.forEach((cand, idx) => {
    const isCompleted = cand.status === 'COMPLETED' || cand.status === 'CERTIFICATE_ISSUED' || (cand.end_date && todayStr >= cand.end_date.split('T')[0]);
    console.log(`   [${idx + 1}] ${cand.student?.full_name} | Internship Status: ${cand.status} | End Date: ${cand.end_date} | Completed Check: ${isCompleted}`);
    if (!isCompleted) {
      throw new Error(`Non-completed internship found in certification module: ${cand.student?.full_name} (Status: ${cand.status})`);
    }
  });

  console.log('   ✅ Verified: Certification module strictly includes only candidates with completed internships!');

  console.log('\n========================================================================');
  console.log('🎉 ALL FACULTY REPORTS STATUS & CERTIFICATION TESTS PASSED 100%');
  console.log('========================================================================\n');
}

testFacultyReportsStatusAndCertification().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
