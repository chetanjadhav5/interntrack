const BASE_URL = 'http://localhost:5000';

async function testFacultyActiveInternReportsFilter() {
  console.log('========================================================================');
  console.log('🧪 TESTING FACULTY ACTIVE INTERN SPECIFIC REPORT REVIEW FILTER');
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

  // 2. Fetch Active Interns
  console.log('\n2. Fetching assigned active interns (/api/faculty/assigned-interns)...');
  const internsRes = await fetch(`${BASE_URL}/api/faculty/assigned-interns`, {
    headers: { Authorization: `Bearer ${facultyToken}` }
  });
  const interns = await internsRes.json();
  console.log(`   Found ${interns.length} assigned intern(s).`);

  if (interns.length === 0) {
    throw new Error('No active interns found for faculty.');
  }

  const targetIntern = interns[0];
  console.log(`   Target Intern: ${targetIntern.student?.full_name} (ID: ${targetIntern.student_id}, PRN: ${targetIntern.student?.student_id})`);

  // 3. Fetch All Reports (No filter - regular Weekly Report Review section)
  console.log('\n3. Fetching all weekly reports without filter (/api/faculty/weekly-reports)...');
  const allReportsRes = await fetch(`${BASE_URL}/api/faculty/weekly-reports`, {
    headers: { Authorization: `Bearer ${facultyToken}` }
  });
  const allReportsData = await allReportsRes.json();
  console.log(`   Total unfiltered reports across all mentees: ${allReportsData.counts.all}`);

  // 4. Fetch Reports Filtered by specific student_id (when coming from Active Interns > Review Reports)
  console.log(`\n4. Fetching reports specifically filtered for ${targetIntern.student?.full_name} (/api/faculty/weekly-reports?student_id=${targetIntern.student_id})...`);
  const studentReportsRes = await fetch(`${BASE_URL}/api/faculty/weekly-reports?student_id=${targetIntern.student_id}`, {
    headers: { Authorization: `Bearer ${facultyToken}` }
  });
  const studentReportsData = await studentReportsRes.json();
  console.log(`   Filtered reports count for student: ${studentReportsData.counts.all}`);

  const studentReports = studentReportsData.reports.all;
  const invalidReports = studentReports.filter(r => r.student_id !== targetIntern.student_id && r.student_roll !== targetIntern.student?.student_id);

  if (invalidReports.length > 0) {
    throw new Error(`Filter failed! Found ${invalidReports.length} report(s) belonging to other students.`);
  }

  console.log(`   ✅ Verified: All ${studentReports.length} returned reports belong exclusively to ${targetIntern.student?.full_name}!`);

  studentReports.forEach((r, idx) => {
    console.log(`      [${idx + 1}] Week ${r.week_number} | Status: ${r.status} | Student: ${r.student_name} (${r.student_roll})`);
  });

  console.log('\n========================================================================');
  console.log('🎉 ALL FACULTY REPORT FILTER TESTS PASSED 100%');
  console.log('========================================================================\n');
}

testFacultyActiveInternReportsFilter().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
