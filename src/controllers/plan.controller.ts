import { type Request, type Response } from 'express';
import { Plan, type IScheduledDay } from '../models/plan.model.js';
import { Workout, type IWorkout } from '../models/workout.model.js';

const DAYS_OF_WEEK: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const DAY_DISPLAY_NAMES: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

const normalizeDay = (day: string): string => {
  const d = day.trim().toLowerCase();
  if (d.startsWith('mon')) return 'monday';
  if (d.startsWith('tue')) return 'tuesday';
  if (d.startsWith('wed')) return 'wednesday';
  if (d.startsWith('thu')) return 'thursday';
  if (d.startsWith('fri')) return 'friday';
  if (d.startsWith('sat')) return 'saturday';
  if (d.startsWith('sun')) return 'sunday';
  return d;
};

export const generateUserPlan = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const onboarding = user.onboarding || {};
    const level: 'beginner' | 'intermediate' | 'advanced' = onboarding.level || 'beginner';
    const goals: string[] = onboarding.goals?.length > 0 ? onboarding.goals : ['keep_fit'];
    const preferredTime: string = onboarding.preferredTime || '07:00';

    // Normalize weekly days
    const rawDays: string[] = onboarding.weeklyDays || [];
    const normalizedDays: string[] =
      rawDays.length > 0
        ? rawDays.map(normalizeDay).filter((d) => DAYS_OF_WEEK.includes(d as any))
        : ['monday', 'wednesday', 'friday'];

    // Distinct selected days
    const selectedDaysSet = new Set(normalizedDays.length > 0 ? normalizedDays : ['monday', 'wednesday', 'friday']);

    // Fetch eligible workouts from database
    const allWorkouts = await Workout.find().lean();
    if (!allWorkouts || allWorkouts.length === 0) {
      return res.status(500).json({ success: false, message: 'No workouts available in the database' });
    }

    // Filter by level
    let eligibleWorkouts = allWorkouts.filter((w) => {
      if (level === 'beginner') return w.difficulty === 'beginner' || w.difficulty === 'intermediate';
      if (level === 'intermediate') return true;
      if (level === 'advanced') return w.difficulty === 'intermediate' || w.difficulty === 'advanced';
      return true;
    });

    if (eligibleWorkouts.length === 0) {
      eligibleWorkouts = allWorkouts;
    }

    // Organize into categorized buckets
    const strengthWorkouts = eligibleWorkouts.filter((w) => w.category === 'strength');
    const hiitWorkouts = eligibleWorkouts.filter((w) => w.category === 'hiit' || w.category === 'cardio');
    const coreWorkouts = eligibleWorkouts.filter((w) => w.category === 'core');
    const flexWorkouts = eligibleWorkouts.filter((w) => w.category === 'flexibility');

    // Build priority sequence based on goals
    const prioritySequence: any[] = [];

    const hasGoal = (g: string) => goals.some((item) => item.toLowerCase().includes(g.toLowerCase()));

    if (hasGoal('lose_weight') || hasGoal('fat_loss') || hasGoal('cardio')) {
      // Prioritize HIIT & High-burn Strength
      const hiitFirst = hiitWorkouts.find((w) => w.slug === 'hiit-cardio') || hiitWorkouts[0];
      const fullBody = strengthWorkouts.find((w) => w.slug === 'full-body-burn') || strengthWorkouts[0];
      const core = coreWorkouts[0] || strengthWorkouts[1];
      const lower = strengthWorkouts.find((w) => w.slug === 'lower-body-strength') || strengthWorkouts[0];

      [hiitFirst, fullBody, core, lower].filter(Boolean).forEach((w) => prioritySequence.push(w!));
    } else if (hasGoal('build_muscle') || hasGoal('strength') || hasGoal('hypertrophy')) {
      // Prioritize Upper, Lower, Full Body & Arms Blast
      const upper = strengthWorkouts.find((w) => w.slug === 'upper-body-strength') || strengthWorkouts[0];
      const lower = strengthWorkouts.find((w) => w.slug === 'lower-body-strength') || strengthWorkouts[1];
      const full = strengthWorkouts.find((w) => w.slug === 'full-body-burn') || strengthWorkouts[0];
      const arms = strengthWorkouts.find((w) => w.slug === 'arms-shoulders-blast') || coreWorkouts[0];

      [upper, lower, full, arms].filter(Boolean).forEach((w) => prioritySequence.push(w!));
    } else if (hasGoal('flexibility') || hasGoal('mobility') || hasGoal('yoga')) {
      // Prioritize Mobility & Core
      const mob = flexWorkouts.find((w) => w.slug === 'squat-mobility-flow') || flexWorkouts[0];
      const yoga = flexWorkouts.find((w) => w.slug === 'morning-yoga-flow') || flexWorkouts[1];
      const core = coreWorkouts[0] || strengthWorkouts[0];
      const full = strengthWorkouts.find((w) => w.slug === 'full-body-burn') || strengthWorkouts[0];

      [mob, full, yoga, core].filter(Boolean).forEach((w) => prioritySequence.push(w!));
    } else {
      // Balanced All-Around
      const full = strengthWorkouts.find((w) => w.slug === 'full-body-burn') || eligibleWorkouts[0];
      const hiit = hiitWorkouts[0] || eligibleWorkouts[1];
      const core = coreWorkouts[0] || eligibleWorkouts[2];
      const upper = strengthWorkouts.find((w) => w.slug === 'upper-body-strength') || eligibleWorkouts[0];

      [full, hiit, core, upper].filter(Boolean).forEach((w) => prioritySequence.push(w!));
    }

    // Ensure we have enough workouts by appending remaining eligible workouts
    eligibleWorkouts.forEach((w) => {
      if (!prioritySequence.some((p) => p.slug === w.slug)) {
        prioritySequence.push(w);
      }
    });

    // Generate 7-day schedule
    let workoutCursor = 0;
    const schedule: IScheduledDay[] = DAYS_OF_WEEK.map((dayKey) => {
      const isSelected = selectedDaysSet.has(dayKey);

      if (!isSelected) {
        return {
          dayOfWeek: dayKey,
          dayName: DAY_DISPLAY_NAMES[dayKey],
          isRestDay: true,
        };
      }

      const assignedWorkout = prioritySequence[workoutCursor % prioritySequence.length];
      workoutCursor++;

      return {
        dayOfWeek: dayKey,
        dayName: DAY_DISPLAY_NAMES[dayKey],
        isRestDay: false,
        workoutSlug: assignedWorkout.slug,
        workoutTitle: assignedWorkout.title,
        workoutCategory: assignedWorkout.category,
        durationMinutes: assignedWorkout.durationMinutes,
        estimatedCalories: assignedWorkout.estimatedCalories,
        badge: assignedWorkout.badge,
      };
    });

    // Save or update plan in database
    const plan = await Plan.findOneAndUpdate(
      { userId: user._id },
      {
        level,
        goals,
        sessionsPerWeek: selectedDaysSet.size,
        preferredDays: Array.from(selectedDaysSet),
        preferredTime,
        schedule,
        generatedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Plan generated successfully',
      data: plan,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate plan',
      error: error.message,
    });
  }
};

export const getMyPlan = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    let plan = await Plan.findOne({ userId: user._id }).lean();

    // If user doesn't have a plan yet, generate one automatically
    if (!plan) {
      return generateUserPlan(req, res);
    }

    res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user plan',
      error: error.message,
    });
  }
};
