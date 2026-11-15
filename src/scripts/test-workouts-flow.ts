import { connectDB } from '../config/db.js';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { User } from '../models/user.model.js';
import { generateAccessToken } from '../utils/jwt.js';
import { type Server } from 'http';

const PORT = 5003;
const BASE_URL = `http://localhost:${PORT}/api`;

const runWorkoutTests = async () => {
  console.log('\n--- 🧪 STARTING PHASE 1.5 WORKOUTS & PROGRAMS TESTS ---');
  await connectDB();
  const app = createApp();

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(PORT, () => {
      console.log(`[TestServer] Running on ${PORT}`);
      resolve(s);
    });
  });

  try {
    // 1. Fetch All Workouts
    console.log('\n1. Testing GET /api/workouts');
    const resAll = await fetch(`${BASE_URL}/workouts`);
    const dataAll = (await resAll.json()) as any;
    if (resAll.status === 200 && dataAll.success && dataAll.count >= 8) {
      console.log(`✅ Fetched ${dataAll.count} workouts (Total in DB: ${dataAll.total})`);
    } else {
      throw new Error(`Failed to fetch workouts: ${JSON.stringify(dataAll)}`);
    }

    // 2. Filter Workouts by Category (strength)
    console.log('\n2. Testing GET /api/workouts?category=strength');
    const resCat = await fetch(`${BASE_URL}/workouts?category=strength`);
    const dataCat = (await resCat.json()) as any;
    if (resCat.status === 200 && dataCat.data.every((w: any) => w.category === 'strength')) {
      console.log(`✅ Successfully filtered category: strength (${dataCat.count} workouts found)`);
    } else {
      throw new Error(`Category filter failed: ${JSON.stringify(dataCat)}`);
    }

    // 3. Search Workouts (search=burn)
    console.log('\n3. Testing GET /api/workouts?search=burn');
    const resSearch = await fetch(`${BASE_URL}/workouts?search=burn`);
    const dataSearch = (await resSearch.json()) as any;
    if (resSearch.status === 200 && dataSearch.data.some((w: any) => w.slug === 'full-body-burn')) {
      console.log(`✅ Search query matched 'full-body-burn' workout`);
    } else {
      throw new Error(`Search failed: ${JSON.stringify(dataSearch)}`);
    }

    // 4. Workout Details with Enriched Exercise Data (GET /api/workouts/full-body-burn)
    console.log('\n4. Testing GET /api/workouts/full-body-burn');
    const resDetail = await fetch(`${BASE_URL}/workouts/full-body-burn`);
    const dataDetail = (await resDetail.json()) as any;
    if (
      resDetail.status === 200 &&
      dataDetail.success &&
      dataDetail.data.steps.length === 12 &&
      dataDetail.data.steps[0].exerciseDetails?.primaryMuscles
    ) {
      console.log(`✅ Workout detail fetched: ${dataDetail.data.title}`);
      console.log(`   Step 1 exercise name: ${dataDetail.data.steps[0].exerciseDetails.name}`);
      console.log(`   Step 1 muscles: ${dataDetail.data.steps[0].exerciseDetails.primaryMuscles.join(', ')}`);
      console.log(`   Step 1 MET: ${dataDetail.data.steps[0].exerciseDetails.met}`);
    } else {
      throw new Error(`Failed to fetch workout details: ${JSON.stringify(dataDetail)}`);
    }

    // 5. Fetch All Programs (GET /api/programs)
    console.log('\n5. Testing GET /api/programs');
    const resProg = await fetch(`${BASE_URL}/programs`);
    const dataProg = (await resProg.json()) as any;
    if (resProg.status === 200 && dataProg.success && dataProg.count >= 2) {
      console.log(`✅ Fetched ${dataProg.count} programs: ${dataProg.data.map((p: any) => p.title).join(', ')}`);
    } else {
      throw new Error(`Failed to fetch programs: ${JSON.stringify(dataProg)}`);
    }

    // 6. Program Details with Enriched Schedule (GET /api/programs/core-starter)
    console.log('\n6. Testing GET /api/programs/core-starter');
    const resProgDetail = await fetch(`${BASE_URL}/programs/core-starter`);
    const dataProgDetail = (await resProgDetail.json()) as any;
    if (
      resProgDetail.status === 200 &&
      dataProgDetail.success &&
      dataProgDetail.data.weeks.length === 4 &&
      dataProgDetail.data.weeks[0].schedule[0].workout?.title
    ) {
      console.log(`✅ Program details fetched: ${dataProgDetail.data.title}`);
      console.log(`   Week 1 Day 1 workout: ${dataProgDetail.data.weeks[0].schedule[0].workout.title}`);
    } else {
      throw new Error(`Failed to fetch program details: ${JSON.stringify(dataProgDetail)}`);
    }

    // 7. Authenticate User and Test Save / Unsave Workout
    console.log('\n7. Testing Save / Unsave Workout (POST / DELETE /api/workouts/:slug/save)');
    const testUser = await User.create({
      email: `test_save_${Date.now()}@example.com`,
      name: 'Test Saver',
      isEmailVerified: true,
      role: 'user',
    });
    const token = generateAccessToken({
      userId: testUser._id.toString(),
      email: testUser.email,
      role: testUser.role,
    });

    // Save workout
    const saveRes = await fetch(`${BASE_URL}/workouts/full-body-burn/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const saveData = (await saveRes.json()) as any;
    if (saveRes.status === 200 && saveData.savedWorkouts.includes('full-body-burn')) {
      console.log(`✅ Saved workout 'full-body-burn' for user`);
    } else {
      throw new Error(`Failed to save workout: ${JSON.stringify(saveData)}`);
    }

    // Get saved workouts
    const getSavedRes = await fetch(`${BASE_URL}/workouts/saved`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const getSavedData = (await getSavedRes.json()) as any;
    if (getSavedRes.status === 200 && getSavedData.count === 1 && getSavedData.data[0].slug === 'full-body-burn') {
      console.log(`✅ Successfully retrieved saved workouts (count: 1)`);
    } else {
      throw new Error(`Failed to get saved workouts: ${JSON.stringify(getSavedData)}`);
    }

    // Unsave workout
    const unsaveRes = await fetch(`${BASE_URL}/workouts/full-body-burn/save`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const unsaveData = (await unsaveRes.json()) as any;
    if (unsaveRes.status === 200 && !unsaveData.savedWorkouts.includes('full-body-burn')) {
      console.log(`✅ Successfully unsaved workout 'full-body-burn'`);
    } else {
      throw new Error(`Failed to unsave workout: ${JSON.stringify(unsaveData)}`);
    }

    // Cleanup test user
    await User.findByIdAndDelete(testUser._id);

    console.log('\n🎉 ALL PHASE 1.5 WORKOUT & PROGRAM TESTS PASSED!');
  } finally {
    server.close();
    await mongoose.disconnect();
  }
};

runWorkoutTests().catch((err) => {
  console.error('\n❌ Test run failed:', err);
  process.exit(1);
});
