const BASE_URL = 'http://127.0.0.1:5000';

async function testStudentGithubOAuthFlow() {
  console.log('========================================================================');
  console.log('🧪 TESTING STUDENT GITHUB OAUTH AUTHORIZATION FLOW & 100/100 SCORING');
  console.log('========================================================================\n');

  // 1. Student Login
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

  // 2. Fetch OAuth URL config
  console.log('\n2. Fetching GitHub OAuth URL configuration (/api/student/github/oauth-url)...');
  const oauthConfigRes = await fetch(`${BASE_URL}/api/student/github/oauth-url`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const oauthConfig = await oauthConfigRes.json();
  console.log('   OAuth Client ID:', oauthConfig.client_id);
  console.log('   Redirect URI:', oauthConfig.redirect_uri);
  console.log('   Is Real App Configured in .env:', oauthConfig.is_configured);

  // 3. Test OAuth Code Exchange & 100/100 Scoring
  console.log('\n3. Simulating student clicking "Authorize" & exchanging OAuth code (/api/student/github/oauth-callback)...');
  const exchangeRes = await fetch(`${BASE_URL}/api/student/github/oauth-callback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      code: 'mock_automated_test_code',
      demo_username: 'alexpatil-dev'
    })
  });

  const exchangeData = await exchangeRes.json();
  console.log('   OAuth Exchange Status:', exchangeRes.status);
  console.log('   OAuth Message:', exchangeData.message);
  console.log('   Connected GitHub Username:', exchangeData.github_username);
  console.log('   Awarded GitHub Score:', exchangeData.github_score);

  if (exchangeRes.status !== 200) {
    throw new Error(`OAuth code exchange failed: ${exchangeData.error}`);
  }

  if (exchangeData.github_score !== 100) {
    throw new Error(`Expected score 100 for normal account, but got ${exchangeData.github_score}`);
  }
  console.log('   ✅ Verified: Student account awarded 100/100 score on GitHub authorization!');

  // 4. Verify in Student Tasks & Reports
  console.log('\n4. Fetching student tasks & reports to verify synced GitHub score...');
  const tasksRes = await fetch(`${BASE_URL}/api/student/tasks-reports`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const tasksData = await tasksRes.json();
  console.log(`   Synced GitHub Username: @${tasksData.github_username}`);
  console.log(`   Synced GitHub Score: ${tasksData.github_score} / 100`);

  if (tasksData.github_score !== 100) {
    throw new Error(`Tasks reports did not reflect 100 score: ${tasksData.github_score}`);
  }

  console.log('\n========================================================================');
  console.log('🎉 ALL GITHUB OAUTH FLOW & 100-SCORING TESTS PASSED 100%');
  console.log('========================================================================\n');
}

testStudentGithubOAuthFlow().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
