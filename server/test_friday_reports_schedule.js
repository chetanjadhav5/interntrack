const BASE_URL = 'http://localhost:5000';

async function testFridayReportsSchedule() {
  console.log('========================================================================');
  console.log('🧪 TESTING FRIDAY WEEKLY REPORTS SCHEDULE, LOCKING, & TENURE CALCULATION');
  console.log('========================================================================\n');

  // 1. Recruiter Login & Issue Offer with Specific Tenure
  console.log('1. Logging in as Company Recruiter (Google India)...');
  const compLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'recruiter@google.com', password: 'Company@123' })
  });
  const compData = await compLogin.json();
  const companyToken = compData.token;

  console.log('\n2. Issuing Offer Letter with start_date=2026-09-01 and end_date=2027-02-28 (6 months tenure)...');
  const offerRes = await fetch(`${BASE_URL}/api/company/offers/single-upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${companyToken}`
    },
    body: JSON.stringify({
      student_id: 'stud_prof_1',
      role_position: 'Cloud Infrastructure & SRE Intern',
      stipend_amount: 60000,
      start_date: '2026-09-01',
      end_date: '2027-02-28',
      offer_letter_url: 'https://example.com/offers/alex_offer_2026.pdf'
    })
  });
  const offerData = await offerRes.json();
  console.log('   Offer Upload Response:', offerData.message);
  console.log(`   Calculated Friday Reports count: ${offerData.friday_reports_count}`);
  if (offerData.friday_reports_count !== 26) {
    throw new Error(`Expected 26 Friday reports for Sep 1, 2026 to Feb 28, 2027, got ${offerData.friday_reports_count}`);
  }
  console.log('   ✅ Company tenure and Friday report calculation verified (26 Reports)!');

  // 2. Student Login & Fetch Tasks & Friday Reports
  console.log('\n3. Logging in as Student (Alex Patil)...');
  const studLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'alex.patil@ghr.edu', password: 'Student@123' })
  });
  const studData = await studLogin.json();
  const studentToken = studData.token;

  console.log('\n4. Fetching student Friday Logbook Schedule (/api/student/tasks-reports)...');
  const tasksRes = await fetch(`${BASE_URL}/api/student/tasks-reports`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const tasksData = await tasksRes.json();
  console.log(`   Student has active internship: [${tasksData.has_active}]`);
  console.log(`   Total Scheduled Friday Reports: ${tasksData.reports?.length}`);

  if (!tasksData.reports || tasksData.reports.length === 0) {
    throw new Error('Expected Friday reports schedule for active student');
  }

  const week1 = tasksData.reports.find(r => r.week_number === 1);
  const week15 = tasksData.reports.find(r => r.week_number === 15);

  console.log('   Week 1 Report:', {
    week: week1?.week_number,
    scheduled_friday: week1?.scheduled_friday_date,
    is_unlocked: week1?.is_unlocked,
    status: week1?.status
  });

  if (week15) {
    console.log('   Week 15 (Future) Report:', {
      week: week15.week_number,
      scheduled_friday: week15.scheduled_friday_date,
      is_unlocked: week15.is_unlocked,
      status: week15.status
    });
  }

  // 3. Submit Unlocked Friday Report
  console.log('\n5. Submitting Week 1 Friday logbook report...');
  const submitRes = await fetch(`${BASE_URL}/api/student/weekly-reports/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      report_id: week1?.id,
      week_number: 1,
      work_summary: 'Engineered microservices architecture, set up Docker compose local cluster, and configured Friday logbook scheduler.',
      work_proof_urls: ['https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600']
    })
  });
  const submitData = await submitRes.json();
  console.log('   Submission response:', submitData.message);
  if (!submitRes.ok) throw new Error('Week 1 submission failed');
  console.log('   ✅ Unlocked Friday report submitted successfully!');

  // 4. Test Locked Report Submission Block
  if (week15 && !week15.is_unlocked) {
    console.log('\n6. Attempting to submit locked future report (Week 15)...');
    const lockedRes = await fetch(`${BASE_URL}/api/student/weekly-reports/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        report_id: week15.id,
        week_number: 15,
        work_summary: 'Premature submission attempt'
      })
    });
    const lockedData = await lockedRes.json();
    console.log(`   Locked attempt response (${lockedRes.status}):`, lockedData.error);
    if (lockedRes.status !== 400) {
      throw new Error('Expected 400 error when submitting locked report');
    }
    console.log('   ✅ Locked report submission blocked as expected until scheduled Friday!');
  }

  // 5. Faculty Mentor Evaluates Friday Report
  console.log('\n7. Logging in as Faculty Mentor (Dr. Suresh Verma)...');
  const facLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'classteacher.cs3@ghr.edu', password: 'Faculty@123', role: 'FACULTY' })
  });
  const facData = await facLogin.json();
  const facultyToken = facData.token;

  console.log('8. Faculty evaluates Week 1 Friday logbook report...');
  const evalRes = await fetch(`${BASE_URL}/api/faculty/reports/${week1.id}/evaluate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${facultyToken}`
    },
    body: JSON.stringify({
      decision: 'APPROVED',
      score: 96.0,
      feedback: 'Exceptional Friday logbook submission and comprehensive Docker architecture artifact.'
    })
  });
  const evalData = await evalRes.json();
  console.log('   Evaluation response:', evalData.message);
  if (!evalRes.ok) throw new Error('Faculty evaluation failed');
  console.log('   ✅ Faculty successfully evaluated Friday logbook report with 96/100 score!');

  console.log('\n========================================================================');
  console.log('🎉 FRIDAY LOGBOOK SCHEDULE & TENURE CALCULATION PASSED 100%');
  console.log('========================================================================');
}

testFridayReportsSchedule().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
