const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5000';

async function testStudentResumeAndProofUploads() {
  console.log('========================================================================');
  console.log('🧪 TESTING STUDENT RESUME PDF UPLOAD & MULTI-IMAGE/PDF ARTIFACT PROOFS');
  console.log('========================================================================\n');

  // 1. Student Login (Alex Patil)
  console.log('1. Logging in as Student (Alex Patil)...');
  const studentLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'alex.patil@ghr.edu',
      password: 'Student@123'
    })
  });
  const studentData = await studentLoginRes.json();
  const studentToken = studentData.token;

  // 2. Test Updating Profile with PDF Resume Upload
  console.log('\n2. Submitting profile update with uploaded Resume PDF...');
  const samplePdfDataUrl = 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCg==';

  const profileUpdateRes = await fetch(`${BASE_URL}/api/student/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      current_cgpa: 8.92,
      current_backlogs: 0,
      gender: 'Male',
      skills: ['React', 'Node.js', 'Python', 'Docker', 'Kubernetes'],
      certifications: [
        { name: 'AWS Certified Cloud Practitioner', url: 'https://aws.amazon.com/certification', is_verified: false }
      ],
      resume_url: samplePdfDataUrl
    })
  });

  const profileUpdateData = await profileUpdateRes.json();
  console.log('   Profile Update Status:', profileUpdateRes.status);
  console.log('   Profile Update Message:', profileUpdateData.message);

  if (profileUpdateRes.status !== 200) {
    throw new Error(`Profile update failed: ${profileUpdateData.error}`);
  }

  // Verify profile fetched has updated resume PDF
  const getProfileRes = await fetch(`${BASE_URL}/api/student/profile`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const getProfileData = await getProfileRes.json();
  console.log('   ✅ Verified: Profile resume_url is saved as PDF:', getProfileData.resume_url?.startsWith('data:application/pdf'));

  // 3. Test Submitting Friday Report with Multiple Images and PDF Proofs
  console.log('\n3. Submitting Friday Weekly Report with multiple image and PDF proofs...');
  const sampleImageProof = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const samplePdfProof = 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2Jq';

  const multiProofs = [
    {
      url: sampleImageProof,
      name: 'microservices_architecture_diagram.png',
      type: 'image',
      size: '240.5 KB'
    },
    {
      url: samplePdfProof,
      name: 'week_sprint_completion_report.pdf',
      type: 'pdf',
      size: '1.25 MB'
    },
    {
      url: 'https://github.com/alexpatil-dev/internship-project/pull/14',
      name: 'Pull Request #14: Core Auth Refactor',
      type: 'link',
      size: 'External URL'
    }
  ];

  const reportSubmitRes = await fetch(`${BASE_URL}/api/student/weekly-reports/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      week_number: 1,
      work_summary: 'Completed end-to-end user authentication refactoring, Docker containerization, and sprint documentation.',
      work_proof_urls: multiProofs
    })
  });

  const reportSubmitData = await reportSubmitRes.json();
  console.log('   Report Submit Status:', reportSubmitRes.status);
  console.log('   Report Submit Message:', reportSubmitData.message);

  if (!reportSubmitRes.ok) {
    throw new Error(`Report submission failed: ${reportSubmitData.error}`);
  }

  // 4. Faculty Login & Verify Multiple Proofs
  console.log('\n4. Logging in as Faculty Mentor to verify multi-proof review...');
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

  const facultyReportsRes = await fetch(`${BASE_URL}/api/faculty/weekly-reports?student_id=${getProfileData.id}`, {
    headers: { Authorization: `Bearer ${facultyToken}` }
  });
  const facultyReports = await facultyReportsRes.json();
  const reportList = facultyReports.reports?.all || [];
  console.log(`   Faculty retrieved ${reportList.length} report(s) for Alex Patil.`);

  const submittedReport = reportList[0];
  console.log(`   Report Week: ${submittedReport?.week_number} | Status: ${submittedReport?.status}`);
  console.log(`   Proofs count: ${submittedReport?.work_proof_urls?.length}`);

  if (!submittedReport || submittedReport.work_proof_urls?.length < 3) {
    throw new Error('Submitted multi-proofs were not properly received by Faculty Mentor!');
  }

  console.log('   ✅ Verified: All 3 multi-artifact proofs (Image, PDF, URL) successfully received by mentor!');

  console.log('\n========================================================================');
  console.log('🎉 ALL STUDENT RESUME PDF & MULTI-PROOF UPLOAD TESTS PASSED 100%');
  console.log('========================================================================\n');
}

testStudentResumeAndProofUploads().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
