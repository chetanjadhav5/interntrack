async function testStudentGstinAutofetch() {
  console.log('--- Testing GSTIN Verification & Location Autofetch ---');

  // 1. Student Login
  const loginRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'alex.patil@ghr.edu',
      password: 'Student@123'
    })
  });

  const loginData = await loginRes.json();
  if (!loginData.token) {
    console.error('❌ Login failed:', loginData);
    process.exit(1);
  }
  const token = loginData.token;
  console.log('✅ Student Login Successful. Token obtained.');

  // 2. Verify GSTIN 27AAJCM9929L1ZM
  const gstin = '27AAJCM9929L1ZM';
  console.log(`\nVerifying GSTIN: ${gstin}...`);
  const verifyRes = await fetch(`http://127.0.0.1:5000/api/student/verify-gstin/${gstin}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const verifyData = await verifyRes.json();
  console.log('Verification Response Status:', verifyRes.status);
  console.log('Verification Response Data:', verifyData);

  if (!verifyData.success) {
    console.error('❌ GSTIN Verification failed:', verifyData);
    process.exit(1);
  }

  console.log('\n--- Assertions ---');
  console.log('1. Legal Name:', verifyData.legal_name);
  console.log('2. Trade Name:', verifyData.trade_name);
  console.log('3. GSTIN Status:', verifyData.status);
  console.log('4. Company Type:', verifyData.company_type);
  console.log('5. Registered Address:', verifyData.registered_address);
  console.log('6. Autofetched Latitude:', verifyData.latitude);
  console.log('7. Autofetched Longitude:', verifyData.longitude);

  if (!verifyData.legal_name.includes('MADRECHA SOLUTIONS')) {
    console.error('❌ Legal Name mismatch');
    process.exit(1);
  }
  if (!verifyData.latitude || !verifyData.longitude) {
    console.error('❌ Missing geocoded coordinates');
    process.exit(1);
  }

  console.log('\n🎉 ALL GSTIN VERIFICATION & AUTOFETCH TESTS PASSED SUCCESSFULLY!');
}

testStudentGstinAutofetch().catch(console.error);
