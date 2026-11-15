import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { connectDB } from '../config/db.js';
import { User } from '../models/user.model.js';
import { ENV } from '../config/env.js';

let server: any;

async function runTests() {
  console.log('🧪 Starting Phase 1.3 Accounts & Auth Flow Test...\n');

  await connectDB();
  const app = createApp();

  const testPort = 5001;
  server = app.listen(testPort);
  const baseUrl = `http://localhost:${testPort}/api/auth`;

  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  // Clean up any test artifact
  await User.deleteMany({ email: { $regex: /@example\.com$/ } });

  console.log('1️⃣ Test: Sign Up');
  const signupRes = await fetch(`${baseUrl}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      name: 'PulseFit Tester',
    }),
  });
  const signupData = (await signupRes.json()) as any;
  console.log('Signup status:', signupRes.status, signupData.message);
  if (signupRes.status !== 201) throw new Error('Signup failed');

  // Grab the user and code from DB to simulate reading verification email
  const userInDb = await User.findOne({ email: testEmail });
  if (!userInDb || !userInDb.verificationCode?.codeHash) throw new Error('User not found in DB');

  console.log('2️⃣ Test: 30-Second Cooldown on Resend Code');
  const resendCooldownRes = await fetch(`${baseUrl}/resend-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail }),
  });
  const resendCooldownData = (await resendCooldownRes.json()) as any;
  console.log('Resend status (expected 429):', resendCooldownRes.status, resendCooldownData.message);
  if (resendCooldownRes.status !== 429) throw new Error('Cooldown check failed');

  console.log('3️⃣ Test: Invalid Verification Code');
  const invalidVerifyRes = await fetch(`${baseUrl}/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, code: '000000' }),
  });
  const invalidVerifyData = (await invalidVerifyRes.json()) as any;
  console.log('Invalid verify status (expected 400):', invalidVerifyRes.status, invalidVerifyData.message);
  if (invalidVerifyRes.status !== 400) throw new Error('Invalid code check failed');

  console.log('4️⃣ Test: Valid Verification Code');
  // For testing, let's set a known code so we can verify exact matching
  const bcrypt = (await import('bcryptjs')).default;
  const testCode = '654321';
  userInDb.verificationCode.codeHash = await bcrypt.hash(testCode, 10);
  await userInDb.save();

  const validVerifyRes = await fetch(`${baseUrl}/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, code: testCode }),
  });
  const validVerifyData = (await validVerifyRes.json()) as any;
  console.log('Verify status:', validVerifyRes.status, validVerifyData.message);
  if (validVerifyRes.status !== 200) throw new Error('Email verification failed');
  const { accessToken, refreshToken } = validVerifyData.tokens;

  console.log('5️⃣ Test: Sign In');
  const signinRes = await fetch(`${baseUrl}/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  });
  const signinData = (await signinRes.json()) as any;
  console.log('Sign in status:', signinRes.status, 'User:', signinData.user?.email);
  if (signinRes.status !== 200) throw new Error('Sign in failed');

  console.log('6️⃣ Test: Authenticated Profile (GET /me)');
  const meRes = await fetch(`${baseUrl}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const meData = (await meRes.json()) as any;
  console.log('GET /me status:', meRes.status, 'Name:', meData.data?.name);
  if (meRes.status !== 200) throw new Error('Get profile failed');

  console.log('7️⃣ Test: Refresh Token');
  const refreshRes = await fetch(`${baseUrl}/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const refreshData = (await refreshRes.json()) as any;
  console.log('Refresh status:', refreshRes.status, 'New Access Token granted:', Boolean(refreshData.tokens?.accessToken));
  if (refreshRes.status !== 200) throw new Error('Refresh token failed');

  console.log('8️⃣ Test: OAuth Account Linking (Google/Apple)');
  const oauthRes = await fetch(`${baseUrl}/oauth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'google',
      providerId: 'google-sub-123456789',
      email: testEmail,
      name: 'PulseFit Google User',
    }),
  });
  const oauthData = (await oauthRes.json()) as any;
  console.log('OAuth linking status:', oauthRes.status, 'Providers:', oauthData.user?.authProviders);
  if (oauthRes.status !== 200 || !oauthData.user?.authProviders.includes('google')) {
    throw new Error('OAuth account linking failed');
  }

  console.log('9️⃣ Test: Password Reset Flow');
  await fetch(`${baseUrl}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail }),
  });
  const userForReset = await User.findOne({ email: testEmail });
  const resetCode = '112233';
  userForReset!.passwordResetCode!.codeHash = await bcrypt.hash(resetCode, 10);
  await userForReset!.save();

  const resetRes = await fetch(`${baseUrl}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      code: resetCode,
      newPassword: 'NewPassword999!',
    }),
  });
  const resetData = (await resetRes.json()) as any;
  console.log('Password reset status:', resetRes.status, resetData.message);
  if (resetRes.status !== 200) throw new Error('Reset password failed');

  // Verify sign in with new password
  const newSigninRes = await fetch(`${baseUrl}/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'NewPassword999!' }),
  });
  const newSigninData = (await newSigninRes.json()) as any;
  console.log('Sign in with new password status:', newSigninRes.status);
  if (newSigninRes.status !== 200) throw new Error('Sign in with new password failed');

  console.log('🔟 Test: Account Deletion (Apple Requirement: "type DELETE")');
  // First test without typing DELETE
  const badDeleteRes = await fetch(`${baseUrl}/account`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${newSigninData.tokens.accessToken}`,
    },
    body: JSON.stringify({ confirmText: 'NO' }),
  });
  console.log('Delete status without typing DELETE (expected 400):', badDeleteRes.status);
  if (badDeleteRes.status !== 400) throw new Error('Delete confirmation check failed');

  // Now delete properly
  const goodDeleteRes = await fetch(`${baseUrl}/account`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${newSigninData.tokens.accessToken}`,
    },
    body: JSON.stringify({ confirmText: 'DELETE' }),
  });
  const goodDeleteData = (await goodDeleteRes.json()) as any;
  console.log('Delete status with DELETE:', goodDeleteRes.status, goodDeleteData.message);
  if (goodDeleteRes.status !== 200) throw new Error('Account deletion failed');

  const checkDeleted = await User.findOne({ email: testEmail });
  if (checkDeleted) throw new Error('User still exists after deletion');
  console.log('Confirmed: User completely wiped from database.\n');

  console.log('🎉 ALL PHASE 1.3 ACCOUNTS & AUTH TESTS PASSED!');
}

runTests()
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(process.exitCode || 0);
  });

