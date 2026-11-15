import { type Request, type Response } from 'express';
import { Workout } from '../models/workout.model.js';
import { Exercise } from '../models/exercise.model.js';
import { User } from '../models/user.model.js';

export const getWorkouts = async (req: Request, res: Response) => {
  try {
    const { category, difficulty, search, featured, page = '1', limit = '20' } = req.query;

    const query: Record<string, any> = {};

    if (category && category !== 'all' && category !== 'All') {
      // Map 'stretching' or 'flexibility' appropriately
      const catLower = String(category).toLowerCase();
      if (catLower === 'stretching') {
        query.category = { $in: ['flexibility', 'stretching'] };
      } else {
        query.category = catLower;
      }
    }

    if (difficulty && difficulty !== 'all') {
      query.difficulty = String(difficulty).toLowerCase();
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: searchRegex },
        { primaryMuscles: searchRegex },
        { equipment: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [workouts, total] = await Promise.all([
      Workout.find(query).sort({ isFeatured: -1, createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Workout.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: workouts.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: workouts,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workouts',
      error: error.message,
    });
  }
};

export const getWorkoutBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const workout = await Workout.findOne({ slug }).lean();

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: `Workout with slug '${slug}' not found`,
      });
    }

    // Enrich steps with real exercise media and instructions from Exercise database
    const exerciseSlugs = workout.steps.map((s) => s.exerciseSlug);
    const exercises = await Exercise.find({ slug: { $in: exerciseSlugs } }).lean();
    const exerciseMap = new Map<string, any>();
    exercises.forEach((ex) => exerciseMap.set(ex.slug, ex));

    const enrichedSteps = workout.steps.map((step) => {
      const ex = exerciseMap.get(step.exerciseSlug);
      if (!ex) return step;

      const mainMedia = ex.media?.find((m: any) => m.subtype === 'main' || m.subtype === 'start') || ex.media?.[0];
      const animMedia = ex.media?.find((m: any) => m.type === 'animation');
      const videoMedia = ex.media?.find((m: any) => m.type === 'video');
      const startMedia = ex.media?.find((m: any) => m.subtype === 'start');
      const peakMedia = ex.media?.find((m: any) => m.subtype === 'peak');

      return {
        ...step,
        exerciseDetails: {
          name: ex.name?.en || step.exerciseName,
          equipment: ex.equipment,
          primaryMuscles: ex.primaryMuscles || [],
          secondaryMuscles: ex.secondaryMuscles || [],
          instructions: ex.instructions?.en || [],
          tips: ex.tips?.en || [],
          met: ex.met || 6.0,
          mediaUrl: mainMedia?.url || '',
          animationUrl: animMedia?.url || '',
          videoUrl: videoMedia?.url || '',
          startImageUrl: startMedia?.url || '',
          peakImageUrl: peakMedia?.url || '',
        },
      };
    });

    res.status(200).json({
      success: true,
      data: {
        ...workout,
        steps: enrichedSteps,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workout details',
      error: error.message,
    });
  }
};

export const getSavedWorkouts = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const savedSlugs = user.savedWorkouts || [];
    const workouts = await Workout.find({ slug: { $in: savedSlugs } }).lean();

    res.status(200).json({
      success: true,
      count: workouts.length,
      data: workouts,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch saved workouts',
      error: error.message,
    });
  }
};

export const saveWorkout = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { slug } = req.params;

    const workout = await Workout.findOne({ slug });
    if (!workout) {
      return res.status(404).json({ success: false, message: 'Workout not found' });
    }

    if (!user.savedWorkouts) {
      user.savedWorkouts = [];
    }

    if (!user.savedWorkouts.includes(slug)) {
      user.savedWorkouts.push(slug);
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Workout saved successfully',
      savedWorkouts: user.savedWorkouts,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to save workout',
      error: error.message,
    });
  }
};

export const unsaveWorkout = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { slug } = req.params;

    if (!user.savedWorkouts) {
      user.savedWorkouts = [];
    }

    user.savedWorkouts = user.savedWorkouts.filter((s: string) => s !== slug);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Workout removed from saved',
      savedWorkouts: user.savedWorkouts,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to unsave workout',
      error: error.message,
    });
  }
};

