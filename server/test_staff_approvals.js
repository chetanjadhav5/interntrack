const BASE_URL = 'http://localhost:5000';

async function testStaffApprovals() {
  console.log('===========================================================');
  console.log('🧪 TESTING COMPLETE STAFF REGISTRATION & ADMIN APPROVAL FLOW');
  console.log('===========================================================\n');

  // 1. Register a new Faculty user
  const facultyEmail = `prof.rohan.${Date.now()}@ghr.edu`;
  const facultyPassword = 'FacultyPassword@123';
  console.log(`1. Registering new faculty account (${facultyEmail})...`);

  const facRegRes = await fetch(`${BASE_URL}/api/auth/register/faculty`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: facultyEmail,
      password: facultyPassword,
      full_name: 'Prof. Rohan Shinde',
      employee_id: 'GHR-FAC-099',
      department: 'Engineering',
      branch: 'Computer Science and Engineering',
      year: '2026',
      designation: 'Faculty Mentor'
    })
  });

  const facRegData = await facRegRes.json();
  console.log(`   Status: ${facRegRes.status}`, facRegData);
  if (facRegRes.status !== 201) throw new Error('Faculty registration failed');

  // 2. Attempt login before approval (Must be rejected with 403)
  console.log('\n2. Attempting login before Admin approval...');
  const unapprovedLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: facultyEmail, password: facultyPassword })
  });
  const unapprovedLoginData = await unapprovedLoginRes.json();
  console.log(`   Status: ${unapprovedLoginRes.status}`, unapprovedLoginData);
  if (unapprovedLoginRes.status !== 403) {
    throw new Error('Expected 403 Forbidden for unapproved staff account');
  }
  console.log('   ✅ Unapproved login correctly blocked by security guard.');

  // 3. Super Admin Login
  console.log('\n3. Admin logging in to review pending queue...');
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@ghr.edu', password: 'Admin@123' })
  });
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.token;

  // 4. Fetch pending approvals queue
  console.log('\n4. Fetching pending approvals queue...');
  const queueRes = await fetch(`${BASE_URL}/api/admin/pending-approvals`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const queueData = await queueRes.json();
  console.log(`   Pending count: ${queueData.length}`);
  const targetUser = queueData.find(u => u.email === facultyEmail);
  if (!targetUser) {
    throw new Error(`Registered faculty ${facultyEmail} not found in pending queue`);
  }
  console.log('   ✅ Found applicant in queue with properties:', {
    id: targetUser.id,
    full_name: targetUser.full_name,
    role: targetUser.role,
    employee_id: targetUser.employee_id,
    department: targetUser.department
  });

  // 5. Admin Approves the Staff Account
  console.log(`\n5. Admin approving user account (ID: ${targetUser.id})...`);
  const approveRes = await fetch(`${BASE_URL}/api/admin/users/${targetUser.id}/approval`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ decision: 'APPROVED' })
  });
  const approveData = await approveRes.json();
  console.log(`   Status: ${approveRes.status}`, approveData);
  if (approveRes.status !== 200 || !approveData.is_approved) {
    throw new Error('Approval action failed');
  }
  console.log('   ✅ Staff account approved successfully by Admin!');

  // 6. Post-Approval Login by the Faculty Member
  console.log('\n6. Faculty logging in post-approval...');
  const approvedLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: facultyEmail, password: facultyPassword })
  });
  const approvedLoginData = await approvedLoginRes.json();
  console.log(`   Status: ${approvedLoginRes.status}`, {
    token_received: Boolean(approvedLoginData.token),
    user_email: approvedLoginData.user?.email,
    user_role: approvedLoginData.user?.role
  });

  if (approvedLoginRes.status !== 200 || !approvedLoginData.token) {
    throw new Error('Approved faculty login failed');
  }
  console.log('   ✅ Faculty authenticated and received valid JWT session token!');

  console.log('\n===========================================================');
  console.log('🎉 ALL STAFF APPROVAL WORKFLOWS PASSED VERIFICATION (100%)');
  console.log('===========================================================');
}

testStaffApprovals().catch(err => {
  console.error('❌ Staff approval test failed:', err);
  process.exit(1);
});
