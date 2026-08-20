const BASE_URL = 'http://localhost:5000';

async function testCompanyDashboard() {
  console.log('Testing Company Dashboard Endpoint...');

  // Login as Google Recruiter
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'recruiter@google.com',
      password: 'Company@123'
    })
  });

  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('Company Login Status:', loginRes.status, loginData.user?.role);

  // Fetch Dashboard
  const dashRes = await fetch(`${BASE_URL}/api/company/dashboard`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const dashData = await dashRes.json();
  console.log('Dashboard Response Status:', dashRes.status);
  console.log('Stats:', dashData.stats);
  console.log('Drives count:', dashData.drives?.length);
  if (dashData.drives?.length > 0) {
    console.log('First Drive:', {
      title: dashData.drives[0].title,
      role: dashData.drives[0].role_position,
      status: dashData.drives[0].status,
      applicants: dashData.drives[0].applicants_count,
      selected: dashData.drives[0].selected_count
    });
  }

  // Fetch /drives directly
  const drivesRes = await fetch(`${BASE_URL}/api/company/drives`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const drivesData = await drivesRes.json();
  console.log('Drives Response Status:', drivesRes.status, 'Count:', drivesData.length);

  if (dashRes.ok && drivesRes.ok && dashData.drives?.length > 0) {
    console.log('✅ Company Dashboard and Active Drives data verified 100%!');
  } else {
    throw new Error('Dashboard verification failed');
  }
}

testCompanyDashboard().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
