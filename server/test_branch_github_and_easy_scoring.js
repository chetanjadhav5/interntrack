const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5000';

async function testBranchGithubAndEasyScoring() {
  console.log('========================================================================');
  console.log('🧪 TESTING EASY GITHUB SCORING & COMPUTER BRANCH RESTRICTIONS');
  console.log('========================================================================\n');

  // 1. Student Login (Alex Patil - Computer Science & Engineering)
  console.log('1. Logging in as CS Student (Alex Patil)...');
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

  // 2. CS Student OAuth Eligibility & Dynamic Easy Score
  console.log('\n2. Testing CS student GitHub OAuth eligibility & easy scoring...');
  const csOauthRes = await fetch(`${BASE_URL}/api/student/github/oauth-url`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const csOauthData = await csOauthRes.json();
  console.log('   CS Student is_eligible:', csOauthData.is_eligible);
  if (!csOauthData.is_eligible) {
    throw new Error('CS student should be eligible for GitHub connect!');
  }

  // Connect GitHub & check score
  const csConnectRes = await fetch(`${BASE_URL}/api/student/github/oauth-callback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      code: 'mock_branch_test_code',
      demo_username: 'alexpatil-dev'
    })
  });
  const csConnectData = await csConnectRes.json();
  console.log(`   CS Student GitHub Score Awarded: ${csConnectData.github_score} / 100 (Dynamic, easy-to-earn rule-based score)`);
  if (csConnectData.github_score < 88 || csConnectData.github_score > 100) {
    throw new Error(`Expected score in 88-100 range, got ${csConnectData.github_score}`);
  }

  // Verify tasks-reports for CS student returns is_computer_branch: true
  const csTasksRes = await fetch(`${BASE_URL}/api/student/tasks-reports`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const csTasksData = await csTasksRes.json();
  console.log('   CS Tasks is_computer_branch:', csTasksData.is_computer_branch);
  console.log('   CS Tasks github_score:', csTasksData.github_score);
  if (!csTasksData.is_computer_branch || !csTasksData.github_score) {
    throw new Error('CS tasks reports should include is_computer_branch: true and github_score');
  }

  // 3. Register & Login as a Non-Computer Student (Mechanical Engineering)
  console.log('\n3. Registering & testing Non-Computer Student (Mechanical Engineering)...');
  const mechEmail = `mech.student.${Date.now()}@ghr.edu`;
  const registerRes = await fetch(`${BASE_URL}/api/auth/register/student`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: mechEmail,
      password: 'Student@123',
      student_id: `GHR-MECH-${Math.floor(1000 + Math.random() * 9000)}`,
      full_name: 'Vikram Joshi',
      department: 'Mechanical Engineering',
      branch: 'Mechanical Engineering',
      passing_year: 2026,
      gender: 'Male'
    })
  });
  const registerData = await registerRes.json();
  const mechToken = registerData.token;

  // 4. Non-Computer Student OAuth URL check (should be false / not eligible)
  console.log('\n4. Verifying non-computer student OAuth URL is blocked...');
  const mechOauthRes = await fetch(`${BASE_URL}/api/student/github/oauth-url`, {
    headers: { Authorization: `Bearer ${mechToken}` }
  });
  const mechOauthData = await mechOauthRes.json();
  console.log('   Mech Student is_eligible:', mechOauthData.is_eligible);
  console.log('   Mech Student Message:', mechOauthData.message);
  if (mechOauthData.is_eligible === true) {
    throw new Error('Non-computer student should NOT be eligible for GitHub feature!');
  }

  // 5. Non-Computer Student Connect attempt (should return 400 error)
  console.log('\n5. Verifying non-computer student OAuth connection callback is rejected...');
  const mechConnectRes = await fetch(`${BASE_URL}/api/student/github/oauth-callback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${mechToken}`
    },
    body: JSON.stringify({
      code: 'mock_code',
      demo_username: 'vikram-mech'
    })
  });
  const mechConnectData = await mechConnectRes.json();
  console.log('   Mech Student Connect Status:', mechConnectRes.status);
  console.log('   Mech Student Error Message:', mechConnectData.error);
  if (mechConnectRes.status !== 400) {
    throw new Error('Non-computer student GitHub connection should be rejected with status 400!');
  }

  // 6. Faculty Evaluation Logic Check
  console.log('\n6. Checking Faculty Evaluation formulas for Computer vs Non-Computer candidates...');
  const facultyLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'classteacher.cs3@ghr.edu',
      password: 'Faculty@123'
    })
  });
  const facultyData = await facultyLoginRes.json();
  const facultyToken = facultyData.token;

  const eligibleMenteesRes = await fetch(`${BASE_URL}/api/faculty/evaluation/eligible-mentees`, {
    headers: { Authorization: `Bearer ${facultyToken}` }
  });
  const eligibleMenteesText = await eligibleMenteesRes.text();
  console.log('   Eligible Mentees Status:', eligibleMenteesRes.status);
  if (!eligibleMenteesRes.ok) {
    console.error('   Eligible Mentees Response Error:', eligibleMenteesText);
    throw new Error(`Failed to fetch eligible mentees: ${eligibleMenteesRes.status}`);
  }
  const eligibleMentees = JSON.parse(eligibleMenteesText);
  console.log(`   Faculty retrieved ${eligibleMentees.length} eligible mentee(s).`);

  eligibleMentees.forEach(cand => {
    console.log(`   Candidate: ${cand.student_name} | Branch: ${cand.branch}`);
    console.log(`   is_computer_branch: ${cand.records?.is_computer_branch} | github_score: ${cand.records?.github_score}`);
    if (cand.records?.is_computer_branch === false) {
      if (cand.records?.github_score !== null) {
        throw new Error(`Non-computer candidate ${cand.student_name} should have null github_score`);
      }
    }
  });

  console.log('\n========================================================================');
  console.log('🎉 ALL BRANCH-SPECIFIC GITHUB & EASY SCORING TESTS PASSED 100%');
  console.log('========================================================================\n');
}

testBranchGithubAndEasyScoring().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
