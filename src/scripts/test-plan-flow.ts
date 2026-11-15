import { connectDB } from '../config/db.js';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { User } from '../models/user.model.js';
import { Plan } from '../models/plan.model.js';
import { generateAccessToken } from '../utils/jwt.js';
import { type Server } from 'http';

const PORT = 5004;
const BASE_URL = `http://localhost:${PORT}/api`;

const runPlanTests = async () => {
  console.log('\n--- 🧪 STARTING PHASE 1.6 PLAN GENERATOR TESTS ---');
  await connectDB();
  const app = createApp();

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(PORT, () => {
      console.log(`[TestServer] Running on ${PORT}`);
      resolve(s);
    });
  });

  try {
    // 1. Create a user with 'lose_weight' goal and Mon/Wed/Fri schedule
    console.log('\n1. Testing Plan Generation for Weight Loss (Mon, Wed, Fri)');
    const weightLossUser = await User.create({
      email: `weightloss_${Date.now()}@example.com`,
      name: 'Weight Loss User',
      isEmailVerified: true,
      role: 'user',
      onboarding: {
        completed: true,
        step: 6,
        goals: ['lose_weight'],
        level: 'beginner',
        weeklyDays: ['Monday', 'Wednesday', 'Friday'],
        preferredTime: '08:00',
      },
    });

    const token1 = generateAccessToken({
      userId: weightLossUser._id.toString(),
      email: weightLossUser.email,
      role: weightLossUser.role,
    });

    const genRes1 = await fetch(`${BASE_URL}/plans/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
    });
    const genData1 = (await genRes1.json()) as any;

    if (genRes1.status === 200 && genData1.success && genData1.data?.schedule?.length === 7) {
      console.log(`✅ Plan generated for ${weightLossUser.name}`);
      console.log(`   Sessions per week: ${genData1.data.sessionsPerWeek}`);

      const mon = genData1.data.schedule.find((s: any) => s.dayOfWeek === 'monday');
      const tue = genData1.data.schedule.find((s: any) => s.dayOfWeek === 'tuesday');
      const wed = genData1.data.schedule.find((s: any) => s.dayOfWeek === 'wednesday');
      const sun = genData1.data.schedule.find((s: any) => s.dayOfWeek === 'sunday');

      if (!mon.isRestDay && tue.isRestDay && !wed.isRestDay && sun.isRestDay) {
        console.log(`✅ Correct rest day distribution: Mon: ${mon.workoutTitle}, Tue: REST, Wed: ${wed.workoutTitle}`);
      } else {
        throw new Error(`Schedule days mismatch: ${JSON.stringify(genData1.data.schedule)}`);
      }
    } else {
      throw new Error(`Plan generation failed: ${JSON.stringify(genData1)}`);
    }

    // 2. Fetch Plan via GET /api/plans/my-plan
    console.log('\n2. Testing GET /api/plans/my-plan');
    const myPlanRes = await fetch(`${BASE_URL}/plans/my-plan`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const myPlanData = (await myPlanRes.json()) as any;

    if (myPlanRes.status === 200 && myPlanData.success && myPlanData.data.goals.includes('lose_weight')) {
      console.log(`✅ Successfully retrieved user plan for ${myPlanData.data.userId}`);
    } else {
      throw new Error(`Failed to retrieve plan: ${JSON.stringify(myPlanData)}`);
    }

    // 3. Test Auto-Generation for user who skipped onboarding (No goals, no days)
    console.log('\n3. Testing Auto-Generation for user with empty onboarding');
    const emptyUser = await User.create({
      email: `skipped_${Date.now()}@example.com`,
      name: 'Skipped Onboarding',
      isEmailVerified: true,
      role: 'user',
    });

    const token2 = generateAccessToken({
      userId: emptyUser._id.toString(),
      email: emptyUser.email,
      role: emptyUser.role,
    });

    const autoPlanRes = await fetch(`${BASE_URL}/plans/my-plan`, {
      headers: { Authorization: `Bearer ${token2}` },
    });
    const autoPlanData = (await autoPlanRes.json()) as any;

    if (autoPlanRes.status === 200 && autoPlanData.success && autoPlanData.data.sessionsPerWeek === 3) {
      console.log(`✅ Fallback successfully activated: 3 days/week beginner plan generated!`);
    } else {
      throw new Error(`Fallback plan failed: ${JSON.stringify(autoPlanData)}`);
    }

    // Cleanup
    await Plan.deleteMany({ userId: { $in: [weightLossUser._id, emptyUser._id] } });
    await User.deleteMany({ _id: { $in: [weightLossUser._id, emptyUser._id] } });

    console.log('\n🎉 ALL PHASE 1.6 PLAN GENERATOR TESTS PASSED!');
  } finally {
    server.close();
    await mongoose.disconnect();
  }
};

runPlanTests().catch((err) => {
  console.error('\n❌ Plan test run failed:', err);
  process.exit(1);
});

