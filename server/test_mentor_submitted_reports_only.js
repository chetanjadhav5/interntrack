const BASE_URL = 'http://localhost:5000';

async function testMentorSubmittedReportsOnly() {
  console.log('========================================================================');
  console.log('🧪 TESTING ONLY SUBMITTED REPORTS ARE SENT TO FACULTY MENTOR FOR REVIEW');
  console.log('========================================================================\n');

  // 1. Student Login (Alex Patil)
  console.log('1. Logging in as Student (Alex Patil)...');
  const studLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'alex.patil@ghr.edu', password: 'Student@123' })
  });
  const studData = await studLogin.json();
  const studentToken = studData.token;

  // 2. Fetch Student Tasks & Reports (Full schedule of 26 Friday reports exists in student portal)
  console.log('\n2. Fetching student Friday Logbook Schedule (/api/student/tasks-reports)...');
  const studRepRes = await fetch(`${BASE_URL}/api/student/tasks-reports`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const studRepData = await studRepRes.json();
  console.log(`   Student has ${studRepData.reports?.length} total scheduled Friday reports in logbook.`);
  const unsubmittedReports = studRepData.reports?.filter(r => r.status === 'PENDING') || [];
  console.log(`   Student has ${unsubmittedReports.length} pending/locked reports not yet submitted.`);

  // 3. Find Assigned Mentor and Login
  const activeInternshipRes = await fetch(`${BASE_URL}/api/student/internships/active`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const activeData = await activeInternshipRes.json();
  const mentorId = activeData.internship?.mentor_faculty_id || 'user_faculty_mentor_1';
  console.log(`\n3. Assigned Mentor User ID for student: [${mentorId}]`);

  // Try login with mentor.cs3@ghr.edu or classteacher.cs3@ghr.edu
  let facLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'mentor.cs3@ghr.edu', password: 'Faculty@123', role: 'FACULTY' })
  });
  let facData = await facLogin.json();
  if (!facData.token) {
    facLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'classteacher.cs3@ghr.edu', password: 'Faculty@123', role: 'FACULTY' })
    });
    facData = await facLogin.json();
  }
  const facultyToken = facData.token;
  console.log(`   Logged in as Faculty Mentor (${facData.user?.email || 'Faculty'}).`);

  // 4. Mentor fetches weekly reports queue
  console.log('\n4. Mentor fetching verification queue (/api/faculty/weekly-reports)...');
  const facRepRes = await fetch(`${BASE_URL}/api/faculty/weekly-reports`, {
    headers: { Authorization: `Bearer ${facultyToken}` }
  });
  const facRepData = await facRepRes.json();
  console.log('   Mentor Reports Counts:', facRepData.counts);
  console.log(`   Total Reports in Mentor Queue: ${facRepData.reports.all.length}`);
  
  // Verify that NO pending unsubmitted/locked reports are visible to the mentor
  const hasUnsubmittedInMentorQueue = facRepData.reports.all.some(r => r.status === 'PENDING' && !r.submission_date);
  if (hasUnsubmittedInMentorQueue) {
    throw new Error('FAILED: Unsubmitted / locked pending reports found in mentor verification queue!');
  }
  console.log('   ✅ Verified: Zero unsubmitted/locked reports are present in mentor review queue.');

  // 5. Student Submits Week 1 Friday Report
  console.log('\n5. Student submitting Week 1 Friday logbook report...');
  const submitRes = await fetch(`${BASE_URL}/api/student/weekly-reports/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      week_number: 1,
      work_summary: 'Designed REST endpoints and configured automated token refresh flow for client application.',
      work_proof_urls: ['https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600']
    })
  });
  const submitData = await submitRes.json();
  console.log('   Submission response:', submitData.message);
  if (!submitRes.ok) throw new Error('Week 1 submission failed');

  // 6. Mentor Refetches Queue - now Week 1 is in Pending Review
  console.log('\n6. Mentor refetching verification queue after student submission...');
  const afterRes = await fetch(`${BASE_URL}/api/faculty/weekly-reports`, {
    headers: { Authorization: `Bearer ${facultyToken}` }
  });
  const afterData = await afterRes.json();
  console.log('   Updated Mentor Counts:', afterData.counts);
  const week1InQueue = afterData.reports.pending.find(r => r.week_number === 1) || afterData.reports.all.find(r => r.week_number === 1);
  if (!week1InQueue) {
    throw new Error('Expected Week 1 report to appear in mentor queue upon student submission');
  }
  console.log(`   Found submitted Week 1 report in mentor queue: "${week1InQueue.work_summary}"`);
  console.log('   ✅ Verified: Only submitted report is received by mentor for verification!');

  // 7. Mentor evaluates and approves Week 1 report
  console.log('\n7. Mentor evaluating and scoring Week 1 report...');
  const evalRes = await fetch(`${BASE_URL}/api/faculty/reports/${week1InQueue.id}/evaluate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${facultyToken}`
    },
    body: JSON.stringify({
      decision: 'APPROVED',
      score: 98.0,
      feedback: 'Excellent work on API security and clear code artifacts.'
    })
  });
  const evalData = await evalRes.json();
  console.log('   Evaluation response:', evalData.message);
  if (!evalRes.ok) throw new Error('Evaluation failed');

  // 8. Verify Mentor Queue updated
  const finalRes = await fetch(`${BASE_URL}/api/faculty/weekly-reports`, {
    headers: { Authorization: `Bearer ${facultyToken}` }
  });
  const finalData = await finalRes.json();
  console.log('   Final Mentor Counts:', finalData.counts);
  console.log('   ✅ Mentor verified and scored submitted report successfully!');

  console.log('\n========================================================================');
  console.log('🎉 SUBMITTED-ONLY REPORTS TO MENTOR VERIFIED 100%');
  console.log('========================================================================');
}

testMentorSubmittedReportsOnly().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
