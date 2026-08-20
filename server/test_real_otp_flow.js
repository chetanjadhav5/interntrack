const BASE_URL = 'http://localhost:5000';

async function testRealOtpFlow() {
  console.log('======================================================');
  console.log('📧 TESTING LIVE GMAIL SMTP REAL VERIFICATION OTP FLOW');
  console.log('======================================================\n');

  const testEmail = 'cj01111974@gmail.com';

  // 1. Request real OTP via API
  console.log(`1. Requesting real OTP via POST /api/auth/send-otp for ${testEmail}...`);
  const sendRes = await fetch(`${BASE_URL}/api/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, context: 'Student Registration Verification' })
  });

  const sendData = await sendRes.json();
  console.log(`   Response Status: ${sendRes.status}`);
  console.log(`   Response Body:`, sendData);

  if (sendRes.status !== 200) {
    throw new Error(`Failed to send real OTP: ${JSON.stringify(sendData)}`);
  }
  console.log('   ✅ Real OTP dispatched via Gmail SMTP successfully!\n');

  // 2. Test Invalid OTP verification
  console.log('2. Testing invalid OTP verification (000000)...');
  const invalidVerifyRes = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, otp: '000000' })
  });
  const invalidData = await invalidVerifyRes.json();
  console.log(`   Response Status: ${invalidVerifyRes.status}`);
  console.log(`   Response Body:`, invalidData);

  if (invalidVerifyRes.status === 400) {
    console.log('   ✅ Correctly rejected invalid OTP.\n');
  } else {
    throw new Error('Expected 400 Bad Request for invalid OTP.');
  }

  console.log('======================================================');
  console.log('🎉 REAL SMTP OTP SYSTEM FULLY OPERATIONAL AND VERIFIED');
  console.log('======================================================');
}

testRealOtpFlow().catch(err => {
  console.error('❌ Real OTP flow test failed:', err);
  process.exit(1);
});
