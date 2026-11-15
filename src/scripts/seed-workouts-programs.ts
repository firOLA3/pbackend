import { connectDB } from '../config/db.js';
import { Workout, type IWorkout } from '../models/workout.model.js';
import { Program, type IProgram } from '../models/program.model.js';

export const STARTER_WORKOUTS = [
  {
    slug: 'full-body-burn',
    title: 'Full Body Burn',
    description: 'High-energy total body workout targeting major muscle groups with strength and cardio finishers.',
    category: 'strength',
    difficulty: 'intermediate',
    durationMinutes: 45,
    estimatedCalories: 380,
    badge: 'Full Body',
    bannerImage: '/static/workouts/full-body-burn.png',
    primaryMuscles: ['quads', 'chest', 'back', 'abs', 'shoulders'],
    equipment: ['dumbbells', 'pull-up bar', 'mat'],
    isFeatured: true,
    tags: ['full-body', 'hypertrophy', 'fat-burn'],
    steps: [
      { order: 1, exerciseSlug: 'thruster', exerciseName: 'Thruster', stepType: 'timed', durationSeconds: 45, restSeconds: 30, notes: 'Explode upward from squat into overhead press.' },
      { order: 2, exerciseSlug: 'front-squat', exerciseName: 'Front Squat', stepType: 'counted', sets: 3, reps: 10, restSeconds: 45, notes: 'Keep elbows high and chest tall.' },
      { order: 3, exerciseSlug: 'pull-up', exerciseName: 'Pull-Up', stepType: 'counted', sets: 3, reps: 8, restSeconds: 45, notes: 'Full extension at the bottom, chin over bar.' },
      { order: 4, exerciseSlug: 'incline-db-press', exerciseName: 'Incline Dumbbell Press', stepType: 'counted', sets: 3, reps: 12, restSeconds: 45, notes: 'Drive through upper chest.' },
      { order: 5, exerciseSlug: 'bent-over-db-row', exerciseName: 'Bent-Over Dumbbell Row', stepType: 'counted', sets: 3, reps: 12, restSeconds: 45, notes: 'Hinge at hips, pull elbows to ribcage.' },
      { order: 6, exerciseSlug: 'mountain-climbers', exerciseName: 'Mountain Climbers', stepType: 'timed', durationSeconds: 45, restSeconds: 30, notes: 'Keep hips low and pace steady.' },
      { order: 7, exerciseSlug: 'barbell-reverse-lunge', exerciseName: 'Barbell Reverse Lunge', stepType: 'counted', sets: 3, reps: 10, restSeconds: 45, notes: '10 reps each leg. 90-degree knee bend.' },
      { order: 8, exerciseSlug: 'machine-chest-fly', exerciseName: 'Machine Chest Fly', stepType: 'counted', sets: 3, reps: 12, restSeconds: 30, notes: 'Squeeze chest at peak contraction.' },
      { order: 9, exerciseSlug: 'bicep-curl', exerciseName: 'Dumbbell Bicep Curl', stepType: 'counted', sets: 3, reps: 12, restSeconds: 30, notes: 'Strict form, no swinging.' },
      { order: 10, exerciseSlug: 'single-arm-tricep-pushdown', exerciseName: 'Single Arm Tricep Pushdown', stepType: 'counted', sets: 3, reps: 12, restSeconds: 30, notes: 'Lock elbow at side.' },
      { order: 11, exerciseSlug: 'ab-wheel-rollout', exerciseName: 'Ab Wheel Rollout', stepType: 'counted', sets: 3, reps: 10, restSeconds: 30, notes: 'Brace core, don’t let lower back sag.' },
      { order: 12, exerciseSlug: 'glute-bridge', exerciseName: 'Glute Bridge', stepType: 'counted', sets: 3, reps: 15, restSeconds: 30, notes: 'Hold for 2 seconds at the top.' },
    ],
  },
  {
    slug: 'upper-body-strength',
    title: 'Upper Body Strength',
    description: 'Focused hypertrophy and power for chest, back, shoulders, and arms.',
    category: 'strength',
    difficulty: 'intermediate',
    durationMinutes: 35,
    estimatedCalories: 280,
    badge: 'Upper Body',
    bannerImage: '/static/workouts/upper-body-strength.png',
    primaryMuscles: ['chest', 'lats', 'shoulders', 'biceps', 'triceps'],
    equipment: ['dumbbells', 'cable-machine', 'pull-up bar'],
    isFeatured: true,
    tags: ['upper-body', 'push-pull', 'strength'],
    steps: [
      { order: 1, exerciseSlug: 'incline-db-press', exerciseName: 'Incline Dumbbell Press', stepType: 'counted', sets: 4, reps: 10, restSeconds: 60, notes: 'Focus on upper pec engagement.' },
      { order: 2, exerciseSlug: 'pull-up', exerciseName: 'Pull-Up', stepType: 'counted', sets: 4, reps: 8, restSeconds: 60, notes: 'Controlled eccentric descent.' },
      { order: 3, exerciseSlug: 'bent-over-db-row', exerciseName: 'Bent-Over Dumbbell Row', stepType: 'counted', sets: 3, reps: 12, restSeconds: 45, notes: 'Pull weights to pocket.' },
      { order: 4, exerciseSlug: 'machine-chest-fly', exerciseName: 'Machine Chest Fly', stepType: 'counted', sets: 3, reps: 12, restSeconds: 45, notes: 'Keep slight bend in elbows.' },
      { order: 5, exerciseSlug: 'ez-bar-upright-row', exerciseName: 'EZ-Bar Upright Row', stepType: 'counted', sets: 3, reps: 12, restSeconds: 45, notes: 'Pull bar toward upper chest.' },
      { order: 6, exerciseSlug: 'bicep-curl', exerciseName: 'Dumbbell Bicep Curl', stepType: 'counted', sets: 3, reps: 12, restSeconds: 30, notes: 'Full supination at the top.' },
      { order: 7, exerciseSlug: 'single-arm-tricep-pushdown', exerciseName: 'Single Arm Tricep Pushdown', stepType: 'counted', sets: 3, reps: 12, restSeconds: 30, notes: 'Squeeze triceps at lockout.' },
    ],
  },
  {
    slug: 'lower-body-strength',
    title: 'Lower Body Strength',
    description: 'Build powerful legs and glutes through compound squats, lunges, and unilateral stability.',
    category: 'strength',
    difficulty: 'intermediate',
    durationMinutes: 35,
    estimatedCalories: 310,
    badge: 'Lower Body',
    bannerImage: '/static/workouts/lower-body-strength.png',
    primaryMuscles: ['quads', 'glutes', 'hamstrings', 'calves'],
    equipment: ['barbell', 'dumbbells', 'bench', 'resistance-band'],
    isFeatured: true,
    tags: ['legs', 'squats', 'hypertrophy'],
    steps: [
      { order: 1, exerciseSlug: 'front-squat', exerciseName: 'Front Squat', stepType: 'counted', sets: 4, reps: 10, restSeconds: 60, notes: 'Brace core before descending.' },
      { order: 2, exerciseSlug: 'barbell-reverse-lunge', exerciseName: 'Barbell Reverse Lunge', stepType: 'counted', sets: 3, reps: 10, restSeconds: 45, notes: 'Keep torso upright.' },
      { order: 3, exerciseSlug: 'single-leg-box-squat', exerciseName: 'Single-Leg Box Squat', stepType: 'counted', sets: 3, reps: 8, restSeconds: 45, notes: 'Control movement without collapsing onto the box.' },
      { order: 4, exerciseSlug: 'banded-lateral-walk', exerciseName: 'Banded Lateral Walk', stepType: 'counted', sets: 3, reps: 15, restSeconds: 30, notes: 'Keep tension on band throughout.' },
      { order: 5, exerciseSlug: 'glute-bridge', exerciseName: 'Glute Bridge', stepType: 'counted', sets: 3, reps: 15, restSeconds: 30, notes: 'Drive through heels, squeeze glutes at the top.' },
      { order: 6, exerciseSlug: 'smith-machine-front-squat', exerciseName: 'Smith Machine Front Squat', stepType: 'counted', sets: 3, reps: 10, restSeconds: 45, notes: 'Maintain steady tempo.' },
    ],
  },
  {
    slug: 'hiit-cardio',
    title: 'HIIT Cardio',
    description: 'Fast-paced high-intensity interval session designed to spike heart rate and burn maximum calories.',
    category: 'hiit',
    difficulty: 'beginner',
    durationMinutes: 25,
    estimatedCalories: 260,
    badge: 'Fat Burn',
    bannerImage: '/static/workouts/hiit-cardio.png',
    primaryMuscles: ['cardiovascular', 'quads', 'abs'],
    equipment: ['rowing machine', 'dumbbells', 'mat'],
    isFeatured: true,
    tags: ['cardio', 'hiit', 'calorie-burn'],
    steps: [
      { order: 1, exerciseSlug: 'mountain-climbers', exerciseName: 'Mountain Climbers', stepType: 'timed', durationSeconds: 40, restSeconds: 20, notes: 'Drive knees forcefully toward chest.' },
      { order: 2, exerciseSlug: 'thruster', exerciseName: 'Thruster', stepType: 'timed', durationSeconds: 40, restSeconds: 20, notes: 'Smooth transition from squat into overhead press.' },
      { order: 3, exerciseSlug: 'rowing-machine', exerciseName: 'Rowing Machine', stepType: 'timed', durationSeconds: 60, restSeconds: 30, notes: 'Leg drive first, then pull through back and arms.' },
      { order: 4, exerciseSlug: 'running', exerciseName: 'Running Interval', stepType: 'timed', durationSeconds: 60, restSeconds: 30, notes: 'High knees or quick sprint pace.' },
      { order: 5, exerciseSlug: 'balance-dome-crunch', exerciseName: 'Balance Dome Crunch', stepType: 'timed', durationSeconds: 40, restSeconds: 20, notes: 'Controlled contraction on dome.' },
    ],
  },
  {
    slug: 'core-and-stability',
    title: 'Core and Stability',
    description: 'Strengthen deep core stabilizers, rectus abdominis, and lower back support for posture and injury prevention.',
    category: 'core',
    difficulty: 'intermediate',
    durationMinutes: 20,
    estimatedCalories: 150,
    badge: 'Core',
    bannerImage: '/static/workouts/core-and-stability.png',
    primaryMuscles: ['abs', 'obliques', 'lower back'],
    equipment: ['ab wheel', 'balance dome', 'mat'],
    isFeatured: false,
    tags: ['core', 'abs', 'stability'],
    steps: [
      { order: 1, exerciseSlug: 'ab-wheel-rollout', exerciseName: 'Ab Wheel Rollout', stepType: 'counted', sets: 3, reps: 10, restSeconds: 30, notes: 'Start on knees, keep glutes squeezed.' },
      { order: 2, exerciseSlug: 'balance-dome-crunch', exerciseName: 'Balance Dome Crunch', stepType: 'counted', sets: 3, reps: 15, restSeconds: 30, notes: 'Full abdominal stretch and squeeze.' },
      { order: 3, exerciseSlug: 'bench-leg-pull-in', exerciseName: 'Bench Leg Pull-In', stepType: 'counted', sets: 3, reps: 15, restSeconds: 30, notes: 'Bring knees to chest, extend legs without touching floor.' },
      { order: 4, exerciseSlug: 'cat-cow', exerciseName: 'Cat-Cow Flow', stepType: 'timed', durationSeconds: 45, restSeconds: 15, notes: 'Breathe with movement to mobilize spine.' },
      { order: 5, exerciseSlug: 'glute-bridge', exerciseName: 'Glute Bridge', stepType: 'counted', sets: 3, reps: 15, restSeconds: 30, notes: 'Activate posterior chain.' },
    ],
  },
  {
    slug: 'squat-mobility-flow',
    title: 'Squat Mobility Flow',
    description: 'Unlock hip mobility, ankle dorsiflexion, and spinal flexibility for deeper, pain-free squats.',
    category: 'flexibility',
    difficulty: 'beginner',
    durationMinutes: 20,
    estimatedCalories: 110,
    badge: 'Mobility',
    bannerImage: '/static/workouts/squat-mobility-flow.png',
    primaryMuscles: ['hips', 'glutes', 'spine', 'ankles'],
    equipment: ['mat', 'resistance band'],
    isFeatured: false,
    tags: ['mobility', 'flexibility', 'warm-up'],
    steps: [
      { order: 1, exerciseSlug: 'cat-cow', exerciseName: 'Cat-Cow', stepType: 'timed', durationSeconds: 60, restSeconds: 15, notes: 'Inhale on cow, exhale on cat.' },
      { order: 2, exerciseSlug: 'glute-bridge', exerciseName: 'Glute Bridge', stepType: 'counted', sets: 3, reps: 12, restSeconds: 30, notes: 'Open up hip flexors at the top.' },
      { order: 3, exerciseSlug: 'banded-lateral-walk', exerciseName: 'Banded Lateral Walk', stepType: 'counted', sets: 3, reps: 12, restSeconds: 30, notes: 'Wake up gluteus medius.' },
      { order: 4, exerciseSlug: 'front-squat', exerciseName: 'Deep Bodyweight Squat Hold', stepType: 'timed', durationSeconds: 45, restSeconds: 30, notes: 'Sit deep into squat, elbows pushing knees outward.' },
    ],
  },
  {
    slug: 'morning-yoga-flow',
    title: 'Morning Yoga Flow',
    description: 'Gentle spinal activation and core wake-up sequence to kickstart your day with energy and focus.',
    category: 'flexibility',
    difficulty: 'beginner',
    durationMinutes: 15,
    estimatedCalories: 90,
    badge: 'Flexibility',
    bannerImage: '/static/workouts/morning-yoga-flow.png',
    primaryMuscles: ['spine', 'core', 'hips'],
    equipment: ['mat'],
    isFeatured: false,
    tags: ['yoga', 'morning', 'recovery'],
    steps: [
      { order: 1, exerciseSlug: 'cat-cow', exerciseName: 'Cat-Cow Flow', stepType: 'timed', durationSeconds: 60, restSeconds: 15, notes: 'Gentle spinal waves with deep breathing.' },
      { order: 2, exerciseSlug: 'glute-bridge', exerciseName: 'Glute Bridge Hold', stepType: 'timed', durationSeconds: 45, restSeconds: 15, notes: 'Hold and breathe at top contraction.' },
      { order: 3, exerciseSlug: 'bench-leg-pull-in', exerciseName: 'Bench Leg Pull-In', stepType: 'counted', sets: 2, reps: 12, restSeconds: 30, notes: 'Slow, controlled repetitions.' },
    ],
  },
  {
    slug: 'arms-shoulders-blast',
    title: 'Arms & Shoulders Blast',
    description: 'Complete arm pump and boulder shoulder session with curls, extensions, and lateral raises.',
    category: 'strength',
    difficulty: 'beginner',
    durationMinutes: 25,
    estimatedCalories: 200,
    badge: 'Arms',
    bannerImage: '/static/workouts/arms-shoulders-blast.png',
    primaryMuscles: ['biceps', 'triceps', 'deltoids'],
    equipment: ['dumbbells', 'ez-bar', 'cable machine'],
    isFeatured: false,
    tags: ['arms', 'biceps', 'triceps', 'shoulders'],
    steps: [
      { order: 1, exerciseSlug: 'bicep-curl', exerciseName: 'Dumbbell Bicep Curl', stepType: 'counted', sets: 3, reps: 12, restSeconds: 30, notes: 'Supinate wrists as you curl.' },
      { order: 2, exerciseSlug: 'concentration-curl', exerciseName: 'Concentration Curl', stepType: 'counted', sets: 3, reps: 10, restSeconds: 30, notes: 'Isolate each bicep against inner thigh.' },
      { order: 3, exerciseSlug: 'cross-body-hammer-curl', exerciseName: 'Cross Body Hammer Curl', stepType: 'counted', sets: 3, reps: 12, restSeconds: 30, notes: 'Targets brachialis and forearms.' },
      { order: 4, exerciseSlug: 'single-arm-tricep-pushdown', exerciseName: 'Single Arm Tricep Pushdown', stepType: 'counted', sets: 3, reps: 12, restSeconds: 30, notes: 'Full extension without moving shoulder.' },
      { order: 5, exerciseSlug: 'side-lying-lateral-raise', exerciseName: 'Side-Lying Lateral Raise', stepType: 'counted', sets: 3, reps: 12, restSeconds: 30, notes: 'Targets lateral deltoid head.' },
      { order: 6, exerciseSlug: 'ez-bar-upright-row', exerciseName: 'EZ-Bar Upright Row', stepType: 'counted', sets: 3, reps: 12, restSeconds: 30, notes: 'Elbows lead the movement.' },
    ],
  },
];

export const STARTER_PROGRAMS = [
  {
    slug: 'core-starter',
    title: 'Core Starter',
    subtitle: '4 Weeks · Build bulletproof abdominal & stabilizer foundation',
    description: 'A progressive 4-week core routine designed to build deep spinal stability, endurance, and visible abdominal definition with 3 sessions per week.',
    level: 'beginner',
    durationWeeks: 4,
    sessionsPerWeek: 3,
    badge: 'Starter',
    bannerImage: '/static/programs/core-starter.png',
    isFeatured: true,
    tags: ['core', 'foundation', 'beginner'],
    weeks: [
      {
        weekNumber: 1,
        title: 'Week 1: Stabilizer Activation',
        schedule: [
          { day: 1, isRestDay: false, workoutSlug: 'core-and-stability', workoutTitle: 'Core and Stability' },
          { day: 2, isRestDay: true },
          { day: 3, isRestDay: false, workoutSlug: 'squat-mobility-flow', workoutTitle: 'Squat Mobility Flow' },
          { day: 4, isRestDay: true },
          { day: 5, isRestDay: false, workoutSlug: 'core-and-stability', workoutTitle: 'Core and Stability' },
          { day: 6, isRestDay: true },
          { day: 7, isRestDay: true },
        ],
      },
      {
        weekNumber: 2,
        title: 'Week 2: Increasing Tension',
        schedule: [
          { day: 1, isRestDay: false, workoutSlug: 'core-and-stability', workoutTitle: 'Core and Stability' },
          { day: 2, isRestDay: true },
          { day: 3, isRestDay: false, workoutSlug: 'hiit-cardio', workoutTitle: 'HIIT Cardio' },
          { day: 4, isRestDay: true },
          { day: 5, isRestDay: false, workoutSlug: 'core-and-stability', workoutTitle: 'Core and Stability' },
          { day: 6, isRestDay: true },
          { day: 7, isRestDay: true },
        ],
      },
      {
        weekNumber: 3,
        title: 'Week 3: Core & Total Body Fusion',
        schedule: [
          { day: 1, isRestDay: false, workoutSlug: 'core-and-stability', workoutTitle: 'Core and Stability' },
          { day: 2, isRestDay: true },
          { day: 3, isRestDay: false, workoutSlug: 'full-body-burn', workoutTitle: 'Full Body Burn' },
          { day: 4, isRestDay: true },
          { day: 5, isRestDay: false, workoutSlug: 'core-and-stability', workoutTitle: 'Core and Stability' },
          { day: 6, isRestDay: true },
          { day: 7, isRestDay: true },
        ],
      },
      {
        weekNumber: 4,
        title: 'Week 4: Peak Core Endurance',
        schedule: [
          { day: 1, isRestDay: false, workoutSlug: 'core-and-stability', workoutTitle: 'Core and Stability' },
          { day: 2, isRestDay: true },
          { day: 3, isRestDay: false, workoutSlug: 'hiit-cardio', workoutTitle: 'HIIT Cardio' },
          { day: 4, isRestDay: true },
          { day: 5, isRestDay: false, workoutSlug: 'full-body-burn', workoutTitle: 'Full Body Burn' },
          { day: 6, isRestDay: true },
          { day: 7, isRestDay: true },
        ],
      },
    ],
  },
  {
    slug: 'goblet-squat-basics',
    title: 'Goblet Squat Basics',
    subtitle: '4 Weeks · Build lower-body foundation and squat mechanics',
    description: 'Master squat depth, hip hinge mechanics, and lower body hypertrophy with progressive dumbbell and barbell squat variations.',
    level: 'beginner',
    durationWeeks: 4,
    sessionsPerWeek: 3,
    badge: 'Foundation',
    bannerImage: '/static/programs/goblet-squat-basics.png',
    isFeatured: true,
    tags: ['legs', 'squat', 'technique'],
    weeks: [
      {
        weekNumber: 1,
        title: 'Week 1: Squat Mechanics & Mobility',
        schedule: [
          { day: 1, isRestDay: false, workoutSlug: 'squat-mobility-flow', workoutTitle: 'Squat Mobility Flow' },
          { day: 2, isRestDay: true },
          { day: 3, isRestDay: false, workoutSlug: 'lower-body-strength', workoutTitle: 'Lower Body Strength' },
          { day: 4, isRestDay: true },
          { day: 5, isRestDay: false, workoutSlug: 'squat-mobility-flow', workoutTitle: 'Squat Mobility Flow' },
          { day: 6, isRestDay: true },
          { day: 7, isRestDay: true },
        ],
      },
      {
        weekNumber: 2,
        title: 'Week 2: Strength & Load Progression',
        schedule: [
          { day: 1, isRestDay: false, workoutSlug: 'lower-body-strength', workoutTitle: 'Lower Body Strength' },
          { day: 2, isRestDay: true },
          { day: 3, isRestDay: false, workoutSlug: 'full-body-burn', workoutTitle: 'Full Body Burn' },
          { day: 4, isRestDay: true },
          { day: 5, isRestDay: false, workoutSlug: 'lower-body-strength', workoutTitle: 'Lower Body Strength' },
          { day: 6, isRestDay: true },
          { day: 7, isRestDay: true },
        ],
      },
      {
        weekNumber: 3,
        title: 'Week 3: Power & Conditioning',
        schedule: [
          { day: 1, isRestDay: false, workoutSlug: 'lower-body-strength', workoutTitle: 'Lower Body Strength' },
          { day: 2, isRestDay: true },
          { day: 3, isRestDay: false, workoutSlug: 'hiit-cardio', workoutTitle: 'HIIT Cardio' },
          { day: 4, isRestDay: true },
          { day: 5, isRestDay: false, workoutSlug: 'lower-body-strength', workoutTitle: 'Lower Body Strength' },
          { day: 6, isRestDay: true },
          { day: 7, isRestDay: true },
        ],
      },
      {
        weekNumber: 4,
        title: 'Week 4: Peak Leg Capacity',
        schedule: [
          { day: 1, isRestDay: false, workoutSlug: 'full-body-burn', workoutTitle: 'Full Body Burn' },
          { day: 2, isRestDay: true },
          { day: 3, isRestDay: false, workoutSlug: 'lower-body-strength', workoutTitle: 'Lower Body Strength' },
          { day: 4, isRestDay: true },
          { day: 5, isRestDay: false, workoutSlug: 'full-body-burn', workoutTitle: 'Full Body Burn' },
          { day: 6, isRestDay: true },
          { day: 7, isRestDay: true },
        ],
      },
    ],
  },
];

export async function seedWorkoutsAndPrograms() {
  console.log('🚀 Seeding Starter Workouts and Programs (Phase 1.5)...');
  await connectDB();

  // 1. Seed Workouts
  console.log(`\n🏋️ Seeding ${STARTER_WORKOUTS.length} Workouts...`);
  for (const w of STARTER_WORKOUTS) {
    await Workout.findOneAndUpdate({ slug: w.slug }, w, { upsert: true, new: true });
    console.log(`   ✅ Workout: [${w.slug}] "${w.title}" (${w.durationMinutes} min, ${w.steps.length} exercises)`);
  }

  // 2. Seed Programs
  console.log(`\n📚 Seeding ${STARTER_PROGRAMS.length} Programs...`);
  for (const p of STARTER_PROGRAMS) {
    await Program.findOneAndUpdate({ slug: p.slug }, p, { upsert: true, new: true });
    console.log(`   ✅ Program: [${p.slug}] "${p.title}" (${p.durationWeeks} weeks, ${p.sessionsPerWeek} sessions/wk)`);
  }

  const workoutCount = await Workout.countDocuments();
  const programCount = await Program.countDocuments();
  console.log(`\n🎉 Seed Complete! Total Workouts: ${workoutCount}, Total Programs: ${programCount}`);
}

seedWorkoutsAndPrograms()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
