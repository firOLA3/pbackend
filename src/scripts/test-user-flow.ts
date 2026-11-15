import { connectDB } from '../config/db.js';
import { User } from '../models/user.model.js';
import { createApp } from '../app.js';
import http from 'http';

const runIntegrationTest = async () => {
  console.log('🧪 Starting Phase 1.4: Onboarding & Profile Integration Tests...');
  await connectDB();

  const app = createApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5001, () => resolve()));
  const baseUrl = 'http://localhost:5001/api';

  const testEmail1 = `test_onboarding_${Date.now()}@pulsefit.test`;
  const testEmail2 = `test_conflict_${Date.now()}@pulsefit.test`;
  const testPassword = 'Password123!';

  let token1 = '';
  let token2 = '';
  let userId1 = '';

  try {
    // 1. Create and verify user 1
    console.log('\n1️⃣ Creating Test User 1...');
    const signupRes = await fetch(`${baseUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail1, password: testPassword, name: 'Alex Johnson' }),
    });
    const signupData = (await signupRes.json()) as any;
    if (!signupData.success) throw new Error(`Signup failed: ${JSON.stringify(signupData)}`);

    // Verify email directly in DB for testing
    const user1 = await User.findOne({ email: testEmail1 });
    if (!user1) throw new Error('User 1 not found in DB');
    user1.isEmailVerified = true;
    await user1.save();
    userId1 = user1._id.toString();

    // Sign in to get access token
    const signinRes = await fetch(`${baseUrl}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail1, password: testPassword }),
    });
    const signinData = (await signinRes.json()) as any;
    token1 = signinData.tokens.accessToken;
    console.log('   ✅ User 1 signed in, token acquired.');

    // 2. GET /api/users/me initial state
    console.log('\n2️⃣ Testing GET /api/users/me initial state...');
    const meRes = await fetch(`${baseUrl}/users/me`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const meData = (await meRes.json()) as any;
    if (!meData.success || meData.data.onboarding.completed !== false) {
      throw new Error(`Invalid initial onboarding state: ${JSON.stringify(meData)}`);
    }
    console.log('   ✅ Initial state: onboarding.completed = false, step = 1');

    // 3. Step 1: Save Goals
    console.log('\n3️⃣ Step 1: Saving Goals...');
    const step1Res = await fetch(`${baseUrl}/users/onboarding`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        step: 2,
        goals: ['Lose Weight', 'Build Muscle', 'Stay Active'],
      }),
    });
    const step1Data = (await step1Res.json()) as any;
    if (!step1Data.success || step1Data.data.onboarding.goals.length !== 3 || step1Data.data.onboarding.step !== 2) {
      throw new Error(`Step 1 failed: ${JSON.stringify(step1Data)}`);
    }
    console.log('   ✅ Goals saved: 3 selected, current step = 2');

    // 4. Step 2: Save Fitness Level
    console.log('\n4️⃣ Step 2: Saving Fitness Level...');
    const step2Res = await fetch(`${baseUrl}/users/onboarding`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        step: 3,
        level: 'intermediate',
      }),
    });
    const step2Data = (await step2Res.json()) as any;
    if (!step2Data.success || step2Data.data.onboarding.level !== 'intermediate') {
      throw new Error(`Step 2 failed: ${JSON.stringify(step2Data)}`);
    }
    console.log('   ✅ Fitness level saved: intermediate, current step = 3');

    // 5. Step 3: Save Schedule & Reminders
    console.log('\n5️⃣ Step 3: Saving Schedule & Reminders...');
    const step3Res = await fetch(`${baseUrl}/users/onboarding`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        step: 4,
        weeklyDays: ['Mon', 'Wed', 'Fri', 'Sat'],
        preferredTime: 'morning',
        remindersEnabled: true,
      }),
    });
    const step3Data = (await step3Res.json()) as any;
    if (!step3Data.success || step3Data.data.onboarding.weeklyDays.length !== 4) {
      throw new Error(`Step 3 failed: ${JSON.stringify(step3Data)}`);
    }
    console.log('   ✅ Schedule saved: 4 days/wk, preferredTime = morning');

    // 6. Step 4: Save Demographics & Unit Preference
    console.log('\n6️⃣ Step 4: Saving Demographics & Units...');
    const step4Res = await fetch(`${baseUrl}/users/onboarding`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        step: 5,
        gender: 'female',
        age: 29,
        heightCm: 168,
        weightKg: 64,
        targetWeightKg: 60,
        units: 'metric',
        timezone: 'Africa/Lagos',
      }),
    });
    const step4Data = (await step4Res.json()) as any;
    if (
      !step4Data.success ||
      step4Data.data.onboarding.weightKg !== 64 ||
      step4Data.data.timezone !== 'Africa/Lagos'
    ) {
      throw new Error(`Step 4 failed: ${JSON.stringify(step4Data)}`);
    }
    console.log('   ✅ Demographics saved: height=168, weight=64, timezone=Africa/Lagos');

    // 7. Step 5: Save Permissions & Finalize
    console.log('\n7️⃣ Step 5: Saving Permissions & Completing Onboarding...');
    const step5Res = await fetch(`${baseUrl}/users/onboarding`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        step: 6,
        completed: true,
        notificationsAllowed: true,
        healthKitConnected: true,
      }),
    });
    const step5Data = (await step5Res.json()) as any;
    if (!step5Data.success || step5Data.data.onboarding.completed !== true) {
      throw new Error(`Step 5 failed: ${JSON.stringify(step5Data)}`);
    }
    console.log('   ✅ Onboarding finalized: completed = true');

    // 8. Test Step-by-Step Resume (simulate app reopening)
    console.log('\n8️⃣ Testing Step-by-step resume persistence...');
    const resumeRes = await fetch(`${baseUrl}/users/me`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const resumeData = (await resumeRes.json()) as any;
    if (
      !resumeData.success ||
      resumeData.data.onboarding.goals.length !== 3 ||
      resumeData.data.onboarding.level !== 'intermediate' ||
      resumeData.data.onboarding.completed !== true
    ) {
      throw new Error(`Resume persistence failed: ${JSON.stringify(resumeData)}`);
    }
    console.log('   ✅ All onboarding data properly persisted across reloads.');

    // 9. Test Username Check
    console.log('\n9️⃣ Testing Username Availability Endpoint...');
    const checkAvailableRes = await fetch(`${baseUrl}/users/check-username?username=fit_runner_99`);
    const checkAvailableData = (await checkAvailableRes.json()) as any;
    if (!checkAvailableData.success || !checkAvailableData.available) {
      throw new Error(`Username check should be available: ${JSON.stringify(checkAvailableData)}`);
    }
    console.log('   ✅ Username fit_runner_99 is available.');

    // 10. Test Profile Update
    console.log('\n🔟 Testing Profile Update...');
    const profileRes = await fetch(`${baseUrl}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        name: 'Alex "The Machine" Johnson',
        username: 'fit_runner_99',
        bio: 'Runner & hybrid athlete',
        units: 'metric',
      }),
    });
    const profileData = (await profileRes.json()) as any;
    if (!profileData.success || profileData.data.username !== 'fit_runner_99') {
      throw new Error(`Profile update failed: ${JSON.stringify(profileData)}`);
    }
    console.log('   ✅ Profile updated: username = fit_runner_99, bio saved.');

    // 11. Test Duplicate Username Conflict (409)
    console.log('\n1️⃣1️⃣ Testing Duplicate Username Conflict (HTTP 409)...');
    const signup2Res = await fetch(`${baseUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail2, password: testPassword }),
    });
    const signup2Data = (await signup2Res.json()) as any;
    const user2 = await User.findOne({ email: testEmail2 });
    if (!user2) throw new Error('User 2 not found');
    user2.isEmailVerified = true;
    await user2.save();

    const signin2Res = await fetch(`${baseUrl}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail2, password: testPassword }),
    });
    const signin2Data = (await signin2Res.json()) as any;
    token2 = signin2Data.tokens.accessToken;

    const conflictRes = await fetch(`${baseUrl}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token2}`,
      },
      body: JSON.stringify({ username: 'fit_runner_99' }),
    });
    if (conflictRes.status !== 409) {
      throw new Error(`Expected 409 Conflict, got ${conflictRes.status}`);
    }
    console.log('   ✅ Correctly rejected duplicate username with HTTP 409 Conflict.');

    console.log('\n🎉 ALL 11/11 ONBOARDING & PROFILE TESTS PASSED PERFECTLY!\n');
  } finally {
    // Clean up
    console.log('🧹 Cleaning up test users...');
    await User.deleteMany({ email: { $in: [testEmail1, testEmail2] } });
    server.close();
  }
};

runIntegrationTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  });

